"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DeviceStatus } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Cpu, Search, ShieldAlert, Wrench } from "lucide-react";
import { useDevices, useZones } from "@/hooks/use-dashboard-data";

const statusStyles: Record<DeviceStatus, string> = {
  online: "bg-green-50 text-green-700 border-green-200",
  offline: "bg-gray-100 text-gray-700 border-gray-200",
  error: "bg-red-50 text-red-700 border-red-200",
  maintenance: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function DeviceManagementPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50/50 p-6 md:p-8" />}>
      <DeviceManagementPageContent />
    </Suspense>
  );
}

function DeviceManagementPageContent() {
  const { data: devices = [], isLoading } = useDevices();
  const { data: zones = [] } = useZones();

  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | "all">("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const zone = params.get("zone");
    if (zone) {
      setZoneFilter(zone);
    }
  }, []);
  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchZone = zoneFilter === "all" || device.zoneId === zoneFilter;
      const matchStatus = statusFilter === "all" || device.status === statusFilter;
      const matchQuery =
        query.trim().length === 0 ||
        device.name.toLowerCase().includes(query.toLowerCase()) ||
        device.subType.toLowerCase().includes(query.toLowerCase()) ||
        device.id.toLowerCase().includes(query.toLowerCase());

      return matchZone && matchStatus && matchQuery;
    });
  }, [devices, zoneFilter, statusFilter, query]);

  const onlineCount = devices.filter((d) => d.status === "online").length;
  const errorCount = devices.filter((d) => d.status === "error").length;
  const maintenanceCount = devices.filter((d) => d.status === "maintenance").length;
  const offlineCount = devices.filter((d) => d.status === "offline").length;

  return (
    <div className="min-h-screen space-y-6 bg-gradient-to-b from-slate-50 to-gray-50/80 p-6 md:p-8">
      <header className="flex flex-col gap-4 rounded-2xl border border-gray-200/70 bg-white/90 p-5 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
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
              Monitor and control sensors and actuators across all zones
              {isLoading ? " (loading...)" : ""}.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                {onlineCount} online
              </span>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
                {maintenanceCount} maintenance
              </span>
              <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 font-medium text-red-700">
                {errorCount} error
              </span>
              <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 font-medium text-gray-600">
                {offlineCount} offline
              </span>
            </div>
          </div>
        </div>
        <Button>Add Device</Button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-xl border-emerald-200/70 bg-gradient-to-br from-emerald-50/70 to-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Online</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-bold">{onlineCount}</p>
            <Cpu className="h-5 w-5 text-green-600" />
          </CardContent>
        </Card>
        <Card className="rounded-xl border-amber-200/70 bg-gradient-to-br from-amber-50/70 to-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Maintenance</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-bold">{maintenanceCount}</p>
            <Wrench className="h-5 w-5 text-amber-600" />
          </CardContent>
        </Card>
        <Card className="rounded-xl border-red-200/70 bg-gradient-to-br from-red-50/70 to-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Error</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-bold">{errorCount}</p>
            <ShieldAlert className="h-5 w-5 text-red-600" />
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl border-gray-200/80 bg-white shadow-sm">
        <CardHeader className="gap-4">
          <CardTitle className="text-lg text-gray-900">Inventory</CardTitle>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, type, or id"
                className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none ring-offset-white transition-colors focus:border-slate-400"
              />
            </div>

            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="all">All zones</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as DeviceStatus | "all")}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
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
          <div className="overflow-hidden rounded-lg border border-gray-200">
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
                    const zone = zones.find((z) => z.id === device.zoneId);

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
