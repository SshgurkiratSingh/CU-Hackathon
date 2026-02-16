"use client";

import { useEffect, useState } from "react";
import React from "react";
import Link from "next/link";
import { mockZones } from "@/lib/mock-data";
import { Zone } from "@/types";
import { ZoneCard } from "@/components/dashboard/ZoneCard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Cpu, Monitor, Settings, Workflow } from "lucide-react";

export default function DashboardPage() {
  const [zones, setZones] = useState<Zone[]>([]);

  useEffect(() => {
    // In a real app, fetch from API
    setZones(mockZones);
  }, []);

  // Compute mock aggregated stats
  const avgTemp =
    zones.reduce((acc, z) => acc + z.metrics.temp.value, 0) /
    (zones.length || 1);
  const avgHumidity =
    zones.reduce((acc, z) => acc + z.metrics.humidity.value, 0) /
    (zones.length || 1);
  const totalAlerts = zones.reduce((acc, z) => acc + z.alerts, 0);

  return (
    <div className="flex flex-col min-h-screen p-8 bg-gray-50/50">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Greenhouse Overview
          </h1>
          <p className="text-muted-foreground mt-2">
            Real-time environment monitoring and control.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300 flex items-center">
            <span className="w-2 h-2 mr-1 bg-green-500 rounded-full animate-pulse"></span>
            System Online
          </span>
          <Link
            href="/dashboard/devices"
            className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <Cpu className="h-3.5 w-3.5" /> Devices
          </Link>
          <Link
            href="/dashboard/rules"
            className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <Workflow className="h-3.5 w-3.5" /> Rules
          </Link>
          <Link
            href="/dashboard/kiosk"
            className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <Monitor className="h-3.5 w-3.5" /> Kiosk
          </Link>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <Settings className="h-3.5 w-3.5" /> Settings
          </Link>
        </div>
      </header>

      {/* KPI Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <MetricCard
          title="Avg Temperature"
          value={avgTemp.toFixed(1)}
          unit="°C"
          trend="stable"
          className="border-blue-100 bg-blue-50/20"
        />
        <MetricCard
          title="Avg Humidity"
          value={avgHumidity.toFixed(0)}
          unit="%"
          trend="up"
          trendValue="2%"
          className="border-green-100 bg-green-50/20"
        />
        <MetricCard
          title="Power Usage"
          value="12.4"
          unit="kW"
          trend="down"
          trendValue="0.8"
          className="border-yellow-100 bg-yellow-50/20"
        />
        <MetricCard
          title="Active Alerts"
          value={totalAlerts}
          unit=""
          trend={totalAlerts > 0 ? "up" : "stable"}
          className="border-red-100 bg-red-50/20"
        />
      </div>

      {/* Zone Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {zones.map((zone) => (
          <ZoneCard key={zone.id} zone={zone} />
        ))}

        {/* Add Zone Placeholder */}
        <div className="border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center h-full min-h-[200px] hover:border-gray-400 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors bg-white/50">
          <div className="text-center">
            <span className="text-4xl block mb-2">+</span>
            <span>Add New Zone</span>
          </div>
        </div>
      </div>
    </div>
  );
}
