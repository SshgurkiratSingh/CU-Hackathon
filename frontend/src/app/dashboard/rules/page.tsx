"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { mockZones } from "@/lib/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Workflow } from "lucide-react";

type RuleStatus = "active" | "paused";

type AutomationRule = {
  id: string;
  zoneId: string;
  name: string;
  when: string;
  then: string;
  status: RuleStatus;
};

const mockRules: AutomationRule[] = [
  {
    id: "rule-001",
    zoneId: "zone-002",
    name: "Heat Extraction Safety",
    when: "Temp > 28°C for 3 min",
    then: "Enable extraction fan (80%)",
    status: "active",
  },
  {
    id: "rule-002",
    zoneId: "zone-004",
    name: "Drying Vault Humidity Guard",
    when: "Humidity > 60%",
    then: "Start dehumidifier and send alert",
    status: "active",
  },
  {
    id: "rule-003",
    zoneId: "zone-001",
    name: "Propagation Misting Cycle",
    when: "Humidity < 78%",
    then: "Run mister for 2 minutes",
    status: "paused",
  },
];

export default function RulesPage() {
  const params = useSearchParams();
  const initialZone = params.get("zone") ?? "all";
  const [zoneFilter, setZoneFilter] = useState(initialZone);

  const filteredRules = useMemo(() => {
    return mockRules.filter((rule) => zoneFilter === "all" || rule.zoneId === zoneFilter);
  }, [zoneFilter]);

  const activeCount = mockRules.filter((r) => r.status === "active").length;
  const pausedCount = mockRules.filter((r) => r.status === "paused").length;

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Rule Builder</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure zone automation conditions and actions.
            </p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> New Rule
        </Button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{mockRules.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Paused</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-700">{pausedCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <CardTitle>Automation Rules</CardTitle>
            <CardDescription>IF condition is true, THEN run an action.</CardDescription>
          </div>
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="w-full md:w-64 rounded-md border bg-white px-3 py-2 text-sm"
          >
            <option value="all">All zones</option>
            {mockZones.map((zone) => (
              <option value={zone.id} key={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredRules.length > 0 ? (
            filteredRules.map((rule) => {
              const zone = mockZones.find((z) => z.id === rule.zoneId);

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
            <div className="rounded-lg border border-dashed bg-white p-10 text-center text-sm text-gray-500">
              No rules found for selected zone.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
