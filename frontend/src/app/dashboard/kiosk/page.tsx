"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { mockZones } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Clock3, Maximize2, Thermometer, Droplets, Wind } from "lucide-react";

function statusClass(status: string) {
  if (status === "optimal") return "bg-green-100 text-green-700 border-green-200";
  if (status === "warning") return "bg-amber-100 text-amber-700 border-amber-200";
  if (status === "critical") return "bg-red-100 text-red-700 border-red-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
}

export default function KioskPage() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const totals = useMemo(() => {
    const zoneCount = mockZones.length;
    const avgTemp =
      mockZones.reduce((acc, z) => acc + z.metrics.temp.value, 0) / (zoneCount || 1);
    const avgHumidity =
      mockZones.reduce((acc, z) => acc + z.metrics.humidity.value, 0) / (zoneCount || 1);
    const totalAlerts = mockZones.reduce((acc, z) => acc + z.alerts, 0);

    return {
      zoneCount,
      avgTemp: avgTemp.toFixed(1),
      avgHumidity: avgHumidity.toFixed(0),
      totalAlerts,
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="text-white hover:text-white hover:bg-white/10">
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5 mr-2" /> Exit Kiosk
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Greenhouse Kiosk</h1>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/5 px-3 py-1.5">
            <Clock3 className="h-4 w-4" />
            {now.toLocaleTimeString()}
          </span>
          <span className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/5 px-3 py-1.5">
            <Maximize2 className="h-4 w-4" /> Wall Display Mode
          </span>
        </div>
      </header>

      <section className="mb-6 grid gap-4 md:grid-cols-4">
        <Card className="border-white/20 bg-white/5 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Active Zones</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{totals.zoneCount}</CardContent>
        </Card>
        <Card className="border-white/20 bg-white/5 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Avg Temp</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{totals.avgTemp}°C</CardContent>
        </Card>
        <Card className="border-white/20 bg-white/5 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Avg Humidity</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{totals.avgHumidity}%</CardContent>
        </Card>
        <Card className="border-white/20 bg-white/5 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{totals.totalAlerts}</CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {mockZones.map((zone) => (
          <Card key={zone.id} className="border-white/20 bg-white/5 text-white">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-xl">{zone.name}</CardTitle>
                <Badge variant="outline" className={statusClass(zone.status)}>
                  {zone.status.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-md bg-white/5 p-3">
                <span className="inline-flex items-center gap-2 text-white/80">
                  <Thermometer className="h-4 w-4" /> Temperature
                </span>
                <span className="text-lg font-semibold">
                  {zone.metrics.temp.value}
                  {zone.metrics.temp.unit}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-white/5 p-3">
                <span className="inline-flex items-center gap-2 text-white/80">
                  <Droplets className="h-4 w-4" /> Humidity
                </span>
                <span className="text-lg font-semibold">
                  {zone.metrics.humidity.value}
                  {zone.metrics.humidity.unit}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-white/5 p-3">
                <span className="inline-flex items-center gap-2 text-white/80">
                  <Wind className="h-4 w-4" /> CO2
                </span>
                <span className="text-lg font-semibold">
                  {zone.metrics.co2.value} {zone.metrics.co2.unit}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
