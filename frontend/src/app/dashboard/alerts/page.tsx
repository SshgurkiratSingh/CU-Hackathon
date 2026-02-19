"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Alert as AlertType } from "@/types";
import {
  useAcknowledgeAlert,
  useAlerts,
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
import { Bell, Siren, ShieldCheck } from "lucide-react";
import { PageLayout } from "@/components/dashboard/PageLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function severityStyle(severity: AlertType["severity"]) {
  if (severity === "critical") return "bg-red-50 text-red-700 border-red-200";
  if (severity === "warning")
    return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-blue-50 text-blue-700 border-blue-200";
}

export default function AlertsPage() {
  const { data: alerts = [], isLoading } = useAlerts();
  const { data: zones = [] } = useZones();
  const acknowledgeMutation = useAcknowledgeAlert();
  const critical = alerts.filter((a) => a.severity === "critical").length;
  const unresolved = alerts.filter((a) => !a.acknowledged).length;

  const severityPie = useMemo(() => {
    const counts = {
      critical: 0,
      warning: 0,
      info: 0,
    };
    for (const alert of alerts) {
      if (alert.severity === "critical") counts.critical += 1;
      else if (alert.severity === "warning") counts.warning += 1;
      else counts.info += 1;
    }
    return [
      { name: "Critical", value: counts.critical, color: "#dc2626" },
      { name: "Warning", value: counts.warning, color: "#d97706" },
      { name: "Info", value: counts.info, color: "#2563eb" },
    ].filter((entry) => entry.value > 0);
  }, [alerts]);

  const zoneUnresolved = useMemo(() => {
    return zones
      .map((zone) => ({
        zone: zone.name,
        unresolved: alerts.filter(
          (alert) => alert.zoneId === zone.id && !alert.acknowledged,
        ).length,
      }))
      .filter((entry) => entry.unresolved > 0)
      .slice(0, 8);
  }, [alerts, zones]);

  const acknowledgeAll = () => {
    alerts
      .filter((alert) => !alert.acknowledged)
      .forEach((alert) => acknowledgeMutation.mutate(alert.id));
  };

  return (
    <PageLayout>
      <PageHeader
        title="Alerts Center"
        description={`Live incidents and acknowledgement workflow${isLoading ? " (loading...)" : ""}.`}
        actions={
          <Button
            onClick={acknowledgeAll}
            disabled={acknowledgeMutation.isPending || unresolved === 0}
          >
            Mark All Acknowledged
          </Button>
        }
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
            <CardDescription>Current alert mix by severity level.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              {severityPie.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityPie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      label
                    >
                      {severityPie.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No alert data available.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unresolved by Zone</CardTitle>
            <CardDescription>
              Zones with pending incident acknowledgements.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              {zoneUnresolved.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={zoneUnresolved} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="zone" fontSize={11} tickLine={false} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="unresolved" fill="#dc2626" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">
                  All zones are currently clear.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Incident Feed</CardTitle>
          <CardDescription>
            Newest alerts first. Connect to backend alerts endpoint next.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.length > 0 ? (
            alerts.map((alert) => {
              const zone = zones.find((z) => z.id === alert.zoneId);
              return (
                <div key={alert.id} className="rounded-lg border bg-white p-4">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {alert.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {zone?.name ?? "Unknown Zone"} •{" "}
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={severityStyle(alert.severity)}
                    >
                      {alert.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700">{alert.message}</p>
                  <div className="mt-3 flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/zones/${alert.zoneId}`}>
                        View Zone
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant={alert.acknowledged ? "secondary" : "default"}
                      disabled={
                        acknowledgeMutation.isPending || alert.acknowledged
                      }
                      onClick={() => acknowledgeMutation.mutate(alert.id)}
                    >
                      {alert.acknowledged ? "Acknowledged" : "Acknowledge"}
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
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
