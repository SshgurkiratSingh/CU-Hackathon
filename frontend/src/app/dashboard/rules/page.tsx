"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRules, useZones } from "@/hooks/use-dashboard-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Workflow } from "lucide-react";
import { PageLayout } from "@/components/dashboard/PageLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Select } from "@/components/ui/select";

export default function RulesPage() {
  const { data: rules = [], isLoading } = useRules();
  const { data: zones = [] } = useZones();
  const [zoneFilter, setZoneFilter] = useState("all");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const zone = params.get("zone");
    if (zone) {
      setZoneFilter(zone);
    }
  }, []);

  const filteredRules = useMemo(() => {
    return rules.filter((rule) => zoneFilter === "all" || rule.zoneId === zoneFilter);
  }, [rules, zoneFilter]);

  const activeCount = rules.filter((r) => r.status === "active").length;
  const pausedCount = rules.filter((r) => r.status === "paused").length;

  return (
    <PageLayout>
      <PageHeader
        title="Rule Builder"
        description={`Configure zone automation conditions and actions${isLoading ? " (loading...)" : ""}.`}
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" /> New Rule
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Rules" value={rules.length} />
        <StatCard title="Active" value={activeCount} accentClassName="border-green-200/70 bg-green-50/40" />
        <StatCard title="Paused" value={pausedCount} accentClassName="border-amber-200/70 bg-amber-50/40" />
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <CardTitle>Automation Rules</CardTitle>
            <CardDescription>IF condition is true, THEN run an action.</CardDescription>
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
                      <p className="text-base font-semibold text-gray-900">{rule.name}</p>
                      <p className="text-xs text-gray-500">{zone?.name ?? "Unknown zone"}</p>
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
                      <span className="font-medium text-gray-600">IF:</span> {rule.when}
                    </p>
                    <p>
                      <span className="font-medium text-gray-600">THEN:</span> {rule.then}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Workflow className="h-4 w-4 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant={rule.status === "active" ? "secondary" : "default"}
                    >
                      {rule.status === "active" ? "Pause" : "Activate"}
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
