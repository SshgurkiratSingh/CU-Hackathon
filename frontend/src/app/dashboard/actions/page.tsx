"use client";

import Link from "next/link";
import { PlayCircle, CheckCircle2, XCircle } from "lucide-react";
import { useActions, useZones } from "@/hooks/use-dashboard-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/dashboard/PageLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";

export default function ActionsPage() {
  const { data: actions = [], isLoading } = useActions();
  const { data: zones = [] } = useZones();

  return (
    <PageLayout>
      <PageHeader
        title="Action Center"
        description={`Execution history for automation and manual commands${isLoading ? " (loading...)" : ""}.`}
        actions={<Button><PlayCircle className="h-4 w-4 mr-2" /> Trigger Action</Button>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Recent Executions</CardTitle>
          <CardDescription>Latest action outcomes across all zones.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {actions.length > 0 ? actions.map((entry) => {
            const zone = zones.find((z) => z.id === entry.zoneId);
            const ok = entry.status === "success";
            return (
              <div key={entry.id} className="rounded-lg border bg-white p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{entry.action}</p>
                    <p className="text-xs text-gray-500">{zone?.name ?? "Unknown Zone"} • Source: {entry.source} • {entry.time}</p>
                  </div>
                  <Badge variant="outline" className={ok ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}>
                    {ok ? "SUCCESS" : "FAILED"}
                  </Badge>
                </div>
                <div className="text-sm text-gray-700 inline-flex items-center gap-2">
                  {ok ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                  {ok ? "Execution completed" : "Device timeout, retry recommended"}
                </div>
              </div>
            );
          }) : (
            <EmptyState
              title="No action history"
              description="No actions have been executed yet."
            />
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
