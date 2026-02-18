"use client";

import { useMemo, useState } from "react";
import {
  useDevices,
  useCreateRule,
  useRules,
  useToggleRule,
  useZones,
  useDeleteRule,
} from "@/hooks/use-dashboard-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Workflow } from "lucide-react";
import { PageLayout } from "@/components/dashboard/PageLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { LogicBuilder, type LogicBlock } from "@/components/logic-builder/LogicBuilder";

export default function RulesPage() {
  const { data: rules = [], isLoading } = useRules();
  const { data: zones = [] } = useZones();
  const { data: devices = [] } = useDevices();
  const createRuleMutation = useCreateRule();
  const toggleRuleMutation = useToggleRule();
  const deleteRuleMutation = useDeleteRule();
  const [zoneFilter, setZoneFilter] = useState(() => {
    if (typeof window === "undefined") return "all";
    return new URLSearchParams(window.location.search).get("zone") ?? "all";
  });
  const [builderOpen, setBuilderOpen] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [logicBlock, setLogicBlock] = useState<LogicBlock>({
    variables: [],
    conditions: [],
    thenActions: [],
    elseActions: [],
  });

  const filteredRules = useMemo(() => {
    return rules.filter(
      (rule) => zoneFilter === "all" || rule.zoneId === zoneFilter,
    );
  }, [rules, zoneFilter]);

  const activeCount = rules.filter((r) => r.status === "active").length;
  const pausedCount = rules.filter((r) => r.status === "paused").length;
  const targetZone = zoneFilter === "all" ? zones[0]?.id : zoneFilter;

  const createQuickRule = () => {
    const targetZone = zoneFilter === "all" ? zones[0]?.id : zoneFilter;
    if (!targetZone) return;
    createRuleMutation.mutate({
      name: `Rule ${new Date().toLocaleTimeString()}`,
      siteId: targetZone,
      condition: {
        type: "threshold",
        value: "temperature > 28",
        description: "Auto-generated quick rule",
      },
      action: "Enable ventilation",
    });
  };

  const createBuilderRule = () => {
    if (!targetZone) return;

    const buildConditionExpression = () => {
      if (logicBlock.conditions.length === 0) return "true";
      return logicBlock.conditions
        .map((c, i) => {
          const expr = `${c.left} ${c.operator} ${c.right}`;
          return i === 0 ? expr : `${c.logicOp} ${expr}`;
        })
        .join(" ");
    };

    const buildActionPayload = (actions: typeof logicBlock.thenActions) => {
      if (actions.length === 0) return "No action";
      return JSON.stringify(
        actions.map((a) => ({
          type: a.type,
          target: a.target,
          command: a.command,
          value: a.value,
          message: a.message,
        }))
      );
    };

    createRuleMutation.mutate(
      {
        name: ruleName.trim() || `Logic Rule ${new Date().toLocaleTimeString()}`,
        siteId: targetZone,
        condition: {
          type: "logic",
          value: buildConditionExpression(),
          description: `IF ${buildConditionExpression()}`,
        },
        action: buildActionPayload(logicBlock.thenActions),
        elseAction: logicBlock.elseActions.length > 0 ? buildActionPayload(logicBlock.elseActions) : undefined,
        eventType: "telemetry",
        variables: logicBlock.variables.map((v) => ({
          name: v.name,
          source: v.source,
          key: v.key,
          value: v.value,
        })),
      },
      {
        onSuccess: () => {
          setBuilderOpen(false);
          setRuleName("");
          setLogicBlock({ variables: [], conditions: [], thenActions: [], elseActions: [] });
        },
      }
    );
  };

  return (
    <PageLayout>
      <PageHeader
        title="Rule Builder"
        description={`Configure zone automation conditions and actions${isLoading ? " (loading...)" : ""}.`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={createQuickRule}
              disabled={createRuleMutation.isPending}
            >
              <Plus className="h-4 w-4 mr-2" /> Quick Rule
            </Button>
            <Button
              onClick={() => setBuilderOpen((prev) => !prev)}
              disabled={createRuleMutation.isPending}
            >
              <Workflow className="h-4 w-4 mr-2" />
              {builderOpen ? "Close Builder" : "Logic Builder"}
            </Button>
          </div>
        }
      />

      {builderOpen ? (
        <Card>
          <CardHeader>
            <CardTitle>Visual Logic Builder</CardTitle>
            <CardDescription>
              Build automation rules with drag-and-drop blocks: variables, conditions, and actions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              placeholder="Rule name"
            />
            <Select
              value={targetZone || ""}
              onChange={(e) => setZoneFilter(e.target.value)}
            >
              {zones.map((zone) => (
                <option value={zone.id} key={zone.id}>
                  {zone.name}
                </option>
              ))}
            </Select>
            <LogicBuilder block={logicBlock} onChange={setLogicBlock} devices={devices} />
            <div className="flex justify-end">
              <Button onClick={createBuilderRule} disabled={createRuleMutation.isPending}>
                Create Rule
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Rules" value={rules.length} />
        <StatCard
          title="Active"
          value={activeCount}
          accentClassName="border-green-200/70 bg-green-50/40"
        />
        <StatCard
          title="Paused"
          value={pausedCount}
          accentClassName="border-amber-200/70 bg-amber-50/40"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <CardTitle>Automation Rules</CardTitle>
            <CardDescription>
              IF condition is true, THEN run an action.
            </CardDescription>
          </div>
          <Select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="w-full md:w-64"
          >
            <option value="all">All zones</option>
            {zones.map((zone) => (
              <option value={zone.id} key={zone.id}>
                {zone.name}
              </option>
            ))}
          </Select>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredRules.length > 0 ? (
            filteredRules.map((rule) => {
              const zone = zones.find((z) => z.id === rule.zoneId);

              return (
                <div key={rule.id} className="rounded-lg border bg-white p-4">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-gray-900">
                        {rule.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {zone?.name ?? "Unknown zone"}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        rule.status === "active"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }
                    >
                      {rule.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid gap-2 text-sm">
                    <p>
                      <span className="font-medium text-gray-600">IF:</span>{" "}
                      {rule.when}
                    </p>
                    <p>
                      <span className="font-medium text-gray-600">THEN:</span>{" "}
                      {rule.then}
                    </p>
                    {rule.elseThen ? (
                      <p>
                        <span className="font-medium text-gray-600">ELSE:</span>{" "}
                        {rule.elseThen}
                      </p>
                    ) : null}
                    {rule.eventType ||
                    rule.triggerType ||
                    rule.timer?.intervalMinutes ? (
                      <p className="text-xs text-gray-500">
                        Trigger: {rule.triggerType || "telemetry"}
                        {rule.eventType ? ` • Event: ${rule.eventType}` : ""}
                        {rule.timer?.intervalMinutes
                          ? ` • Every ${rule.timer.intervalMinutes} min`
                          : ""}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Workflow className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant={
                        rule.status === "active" ? "secondary" : "default"
                      }
                      disabled={toggleRuleMutation.isPending}
                      onClick={() => toggleRuleMutation.mutate(rule.id)}
                    >
                      {rule.status === "active" ? "Pause" : "Activate"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={deleteRuleMutation.isPending}
                      onClick={() => {
                        if (confirm(`Delete rule "${rule.name}"?`)) {
                          deleteRuleMutation.mutate(rule.id);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState
              title="No rules found"
              description="No automation rules match the selected zone filter."
            />
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
