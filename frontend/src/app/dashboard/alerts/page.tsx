"use client";

import Link from "next/link";
import { Alert as AlertType } from "@/types";
import { useAlerts, useZones } from "@/hooks/use-dashboard-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Siren, ShieldCheck } from "lucide-react";
import { PageLayout } from "@/components/dashboard/PageLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/dashboard/EmptyState";

function severityStyle(severity: AlertType["severity"]) {
  if (severity === "critical") return "bg-red-50 text-red-700 border-red-200";
  if (severity === "warning") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-blue-50 text-blue-700 border-blue-200";
}

export default function AlertsPage() {
  const { data: alerts = [], isLoading } = useAlerts();
  const { data: zones = [] } = useZones();
  const critical = alerts.filter((a) => a.severity === "critical").length;
  const unresolved = alerts.filter((a) => !a.acknowledged).length;

  return (
    <PageLayout>
      <PageHeader
        title="Alerts Center"
        description={`Live incidents and acknowledgement workflow${isLoading ? " (loading...)" : ""}.`}
        actions={<Button>Mark All Acknowledged</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Open Alerts" value={unresolved} icon={Bell} />
        <StatCard
          title="Critical"
          value={critical}
          icon={Siren}
          accentClassName="border-red-200/70 bg-red-50/40"
        />
        <StatCard
          title="Zones Covered"
          value={zones.length}
          icon={ShieldCheck}
          accentClassName="border-green-200/70 bg-green-50/40"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Incident Feed</CardTitle>
          <CardDescription>Newest alerts first. Connect to backend alerts endpoint next.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.length > 0 ? alerts.map((alert) => {
            const zone = zones.find((z) => z.id === alert.zoneId);
            return (
              <div key={alert.id} className="rounded-lg border bg-white p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{alert.title}</p>
                    <p className="text-xs text-gray-500">{zone?.name ?? "Unknown Zone"} • {new Date(alert.timestamp).toLocaleString()}</p>
                  </div>
                  <Badge variant="outline" className={severityStyle(alert.severity)}>{alert.severity.toUpperCase()}</Badge>
                </div>
                <p className="text-sm text-gray-700">{alert.message}</p>
                <div className="mt-3 flex gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/zones/${alert.zoneId}`}>View Zone</Link>
                  </Button>
                  <Button size="sm" variant={alert.acknowledged ? "secondary" : "default"}>{alert.acknowledged ? "Acknowledged" : "Acknowledge"}</Button>
                </div>
              </div>
            );
          }) : (
            <EmptyState
              title="No alerts"
              description="There are no incidents at the moment."
            />
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
