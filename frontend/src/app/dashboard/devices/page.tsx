"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { mockDevices, mockZones } from "@/lib/mock-data";
import { DeviceStatus } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Cpu, Search, ShieldAlert, Wrench } from "lucide-react";

const statusStyles: Record<DeviceStatus, string> = {
  online: "bg-green-50 text-green-700 border-green-200",
  offline: "bg-gray-100 text-gray-700 border-gray-200",
  error: "bg-red-50 text-red-700 border-red-200",
  maintenance: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function DeviceManagementPage() {
  const params = useSearchParams();
  const initialZone = params.get("zone") ?? "all";

  const [zoneFilter, setZoneFilter] = useState<string>(initialZone);
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | "all">("all");
  const [query, setQuery] = useState("");

  const filteredDevices = useMemo(() => {
    return mockDevices.filter((device) => {
      const matchZone = zoneFilter === "all" || device.zoneId === zoneFilter;
      const matchStatus = statusFilter === "all" || device.status === statusFilter;
      const matchQuery =
        query.trim().length === 0 ||
        device.name.toLowerCase().includes(query.toLowerCase()) ||
        device.subType.toLowerCase().includes(query.toLowerCase()) ||
        device.id.toLowerCase().includes(query.toLowerCase());

      return matchZone && matchStatus && matchQuery;
    });
  }, [zoneFilter, statusFilter, query]);

  const onlineCount = mockDevices.filter((d) => d.status === "online").length;
  const errorCount = mockDevices.filter((d) => d.status === "error").length;
  const maintenanceCount = mockDevices.filter((d) => d.status === "maintenance").length;

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
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Device Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor and control sensors and actuators across all zones.
            </p>
          </div>
        </div>
        <Button>Add Device</Button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Online</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-bold">{onlineCount}</p>
            <Cpu className="h-5 w-5 text-green-600" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Maintenance</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-bold">{maintenanceCount}</p>
            <Wrench className="h-5 w-5 text-amber-600" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Error</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-bold">{errorCount}</p>
            <ShieldAlert className="h-5 w-5 text-red-600" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="gap-4">
          <CardTitle className="text-lg">Inventory</CardTitle>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, type, or id"
                className="w-full rounded-md border bg-white py-2 pl-9 pr-3 text-sm outline-none ring-offset-white focus:border-slate-400"
              />
            </div>

            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="w-full rounded-md border bg-white px-3 py-2 text-sm"
            >
              <option value="all">All zones</option>
              {mockZones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as DeviceStatus | "all")}
              className="w-full rounded-md border bg-white px-3 py-2 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="maintenance">Maintenance</option>
              <option value="error">Error</option>
            </select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm text-left bg-white">
              <thead className="bg-gray-50 border-b text-gray-500">
                <tr>
                  <th className="p-3 font-medium">Device</th>
                  <th className="p-3 font-medium">Type</th>
                  <th className="p-3 font-medium">Zone</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Last Seen</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredDevices.length > 0 ? (
                  filteredDevices.map((device) => {
                    const zone = mockZones.find((z) => z.id === device.zoneId);

                    return (
                      <tr key={device.id} className="hover:bg-gray-50">
                        <td className="p-3">
                          <p className="font-medium text-gray-900">{device.name}</p>
                          <p className="text-xs text-gray-500 font-mono">{device.id}</p>
                        </td>
                        <td className="p-3">
                          <p className="text-gray-700 capitalize">{device.type}</p>
                          <p className="text-xs text-gray-500">{device.subType}</p>
                        </td>
                        <td className="p-3 text-gray-700">{zone?.name ?? "Unknown"}</td>
                        <td className="p-3">
                          <Badge variant="outline" className={statusStyles[device.status]}>
                            {device.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-3 text-gray-600">{device.lastSeen}</td>
                        <td className="p-3 text-right">
                          <Link href={`/dashboard/zones/${device.zoneId}`}>
                            <Button variant="ghost" size="sm" className="h-8">
                              Open Zone
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-gray-400">
                      No devices match your current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
