"use client";

import { useMemo, useState } from "react";
import { PlayCircle, CheckCircle2, XCircle } from "lucide-react";
import {
  useCreateAction,
  useExecuteAction,
  useActions,
  useAlertHistory,
  useDeviceHistory,
  useRuleHistory,
  useZones,
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
import { PageLayout } from "@/components/dashboard/PageLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatCard } from "@/components/dashboard/StatCard";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { HistoryListCard } from "@/components/dashboard/HistoryListCard";

export default function ActionsPage() {
  const { data: actions = [], isLoading } = useActions();
  const { data: alertHistory = [] } = useAlertHistory();
  const { data: ruleHistory = [] } = useRuleHistory();
  const { data: deviceHistory = [] } = useDeviceHistory();
  const { data: zones = [] } = useZones();
  const createActionMutation = useCreateAction();
  const executeActionMutation = useExecuteAction();

  const [zoneFilter, setZoneFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "success" | "failed"
  >("all");
  const [sourceFilter, setSourceFilter] = useState<"all" | "manual" | "rule">(
    "all",
  );
  const [query, setQuery] = useState("");

  const filteredActions = useMemo(() => {
    return actions.filter((entry) => {
      const matchZone = zoneFilter === "all" || entry.zoneId === zoneFilter;
      const matchStatus =
        statusFilter === "all" || entry.status === statusFilter;
      const normalizedSource = entry.source === "manual" ? "manual" : "rule";
      const matchSource =
        sourceFilter === "all" || normalizedSource === sourceFilter;
      const matchQuery =
        query.trim().length === 0 ||
        entry.action.toLowerCase().includes(query.toLowerCase()) ||
        entry.source.toLowerCase().includes(query.toLowerCase()) ||
        (entry.actor ?? "").toLowerCase().includes(query.toLowerCase());

      return matchZone && matchStatus && matchSource && matchQuery;
    });
  }, [actions, zoneFilter, statusFilter, sourceFilter, query]);

  const successCount = actions.filter(
    (entry) => entry.status === "success",
  ).length;
  const failedCount = actions.filter(
    (entry) => entry.status === "failed",
  ).length;
  const automationCount = actions.filter(
    (entry) => entry.source !== "manual",
  ).length;

  const triggerAction = () => {
    const zoneId = zoneFilter === "all" ? zones[0]?.id : zoneFilter;
    if (!zoneId) return;
    createActionMutation.mutate({
      name: `Manual Action ${new Date().toLocaleTimeString()}`,
      type: "manual",
      siteId: zoneId,
      parameters: { source: "ui" },
    });
  };

  return (
    <PageLayout>
      <PageHeader
        title="Action Center"
        description={`Execution history for automation and manual commands${isLoading ? " (loading...)" : ""}.`}
        actions={
          <Button
            onClick={triggerAction}
            disabled={createActionMutation.isPending || zones.length === 0}
          >
            <PlayCircle className="h-4 w-4 mr-2" /> Trigger Action
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Actions" value={actions.length} />
        <StatCard
          title="Successful"
          value={successCount}
          accentClassName="border-green-200/70 bg-green-50/40"
        />
        <StatCard
          title="Failed"
          value={failedCount}
          accentClassName="border-red-200/70 bg-red-50/40"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Action History</CardTitle>
          <CardDescription>
            Drill down by zone, source, status, or keyword.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search action, source, actor"
            />
            <Select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
            >
              <option value="all">All zones</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </Select>
            <Select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "success" | "failed")
              }
            >
              <option value="all">All statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </Select>
            <Select
              value={sourceFilter}
              onChange={(e) =>
                setSourceFilter(e.target.value as "all" | "manual" | "rule")
              }
            >
              <option value="all">All sources</option>
              <option value="manual">Manual</option>
              <option value="rule">Rule/Automation</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Executions</CardTitle>
          <CardDescription>
            Latest action outcomes across all zones.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredActions.length > 0 ? (
            filteredActions.map((entry) => {
              const zone = zones.find((z) => z.id === entry.zoneId);
              const ok = entry.status === "success";
              return (
                <div key={entry.id} className="rounded-lg border bg-white p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {entry.action}
                      </p>
                      <p className="text-xs text-gray-500">
                        {zone?.name ?? "Unknown Zone"} • Source: {entry.source}{" "}
                        • {entry.time}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-500">
                        Actor: {entry.actor ?? "system"}
                        {typeof entry.durationMs === "number"
                          ? ` • Duration: ${entry.durationMs}ms`
                          : ""}
                        {entry.targetDeviceId
                          ? ` • Device: ${entry.targetDeviceId}`
                          : ""}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        ok
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }
                    >
                      {ok ? "SUCCESS" : "FAILED"}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-700 inline-flex items-center gap-2">
                    {ok ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    {ok
                      ? "Execution completed"
                      : "Device timeout, retry recommended"}
                  </div>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={executeActionMutation.isPending}
                      onClick={() => executeActionMutation.mutate(entry.id)}
                    >
                      Execute
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState
              title="No action history"
              description="No actions match the selected filters."
            />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <HistoryListCard
          title="Alert History"
          description="Alert lifecycle events"
          items={alertHistory.slice(0, 5).map((item) => ({
            id: item.id,
            title: `${item.action.toUpperCase()} • ${item.alertId}`,
            subtitle: `${item.actor}${item.note ? ` • ${item.note}` : ""}`,
            timestamp: new Date(item.timestamp).toLocaleString(),
            tone:
              item.action === "created"
                ? "warning"
                : item.action === "resolved"
                  ? "success"
                  : "default",
          }))}
          emptyTitle="No alert history"
          emptyDescription="No alert lifecycle events recorded yet."
        />

        <HistoryListCard
          title="Rule History"
          description="Rule edits and trigger events"
          items={ruleHistory.slice(0, 5).map((item) => ({
            id: item.id,
            title: `${item.action.toUpperCase()} • ${item.ruleId}`,
            subtitle: `${item.actor}${item.details ? ` • ${item.details}` : ""}`,
            timestamp: new Date(item.timestamp).toLocaleString(),
            tone: item.action === "triggered" ? "success" : "default",
          }))}
          emptyTitle="No rule history"
          emptyDescription="No rule lifecycle events recorded yet."
        />

        <HistoryListCard
          title="Device History"
          description="Connectivity and device state events"
          items={deviceHistory.slice(0, 5).map((item) => ({
            id: item.id,
            title: `${item.action.toUpperCase()} • ${item.deviceId}`,
            subtitle: `${item.actor}${item.details ? ` • ${item.details}` : ""}`,
            timestamp: new Date(item.timestamp).toLocaleString(),
            tone:
              item.action === "error"
                ? "error"
                : item.action === "recovered" || item.action === "online"
                  ? "success"
                  : item.action === "maintenance"
                    ? "warning"
                    : "default",
          }))}
          emptyTitle="No device history"
          emptyDescription="No device state events recorded yet."
        />
      </div>

      <Card>
        <CardContent className="py-3 text-xs text-gray-600">
          Automation actions: {automationCount} • Manual actions:{" "}
          {actions.length - automationCount}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
