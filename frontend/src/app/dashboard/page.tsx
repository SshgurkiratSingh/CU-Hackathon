"use client";

import React from "react";
import Link from "next/link";
import { ZoneCard } from "@/components/dashboard/ZoneCard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import {
  Bell,
  BrainCircuit,
  Cpu,
  Database,
  LineChart,
  Logs,
  Monitor,
  PlayCircle,
  Settings,
  ShoppingBag,
  Workflow,
} from "lucide-react";
import { useZones } from "@/hooks/use-dashboard-data";

export default function DashboardPage() {
  const { data: zones = [], isLoading } = useZones();

  // Compute mock aggregated stats
  const avgTemp =
    zones.reduce((acc, z) => acc + z.metrics.temp.value, 0) /
    (zones.length || 1);
  const avgHumidity =
    zones.reduce((acc, z) => acc + z.metrics.humidity.value, 0) /
    (zones.length || 1);
  const totalAlerts = zones.reduce((acc, z) => acc + z.alerts, 0);
  const criticalZones = zones.filter((z) => z.status === "critical").length;
  const warningZones = zones.filter((z) => z.status === "warning").length;

  const shortcutCards = [
    {
      href: "/dashboard/alerts",
      label: "Alerts",
      description: "Incidents and escalation queue",
      icon: Bell,
      iconClass: "text-red-500",
      badgeClass: "bg-red-50 text-red-700 border-red-200",
    },
    {
      href: "/dashboard/telemetry",
      label: "Telemetry",
      description: "Live environmental charts",
      icon: LineChart,
      iconClass: "text-blue-500",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      href: "/dashboard/actions",
      label: "Actions",
      description: "Manual and scheduled operations",
      icon: PlayCircle,
      iconClass: "text-emerald-500",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      href: "/dashboard/logs",
      label: "Logs",
      description: "Unified event stream",
      icon: Logs,
      iconClass: "text-slate-600",
      badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
    },
    {
      href: "/dashboard/ai",
      label: "AI",
      description: "Assistant and recommendations",
      icon: BrainCircuit,
      iconClass: "text-violet-500",
      badgeClass: "bg-violet-50 text-violet-700 border-violet-200",
    },
    {
      href: "/dashboard/memory",
      label: "Memory",
      description: "Operational knowledge graph",
      icon: Database,
      iconClass: "text-indigo-500",
      badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
    {
      href: "/dashboard/marketplace",
      label: "Marketplace",
      description: "Models and plugins",
      icon: ShoppingBag,
      iconClass: "text-amber-500",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    },
  ] as const;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-gray-50/80 p-6 md:p-8 dark:from-slate-950 dark:to-slate-900">
      <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-gray-200/70 bg-white/90 p-5 shadow-sm backdrop-blur md:mb-8 md:flex-row md:items-center md:justify-between dark:border-slate-700/80 dark:bg-slate-900/80">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
            Greenhouse Overview
          </h1>
          <p className="mt-2 text-muted-foreground">
            Real-time environment monitoring and control.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 font-medium text-red-700">
              {criticalZones} critical zones
            </span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
              {warningZones} warning zones
            </span>
            <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 font-medium text-gray-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {zones.length} total zones
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300 flex items-center">
            <span className="w-2 h-2 mr-1 bg-green-500 rounded-full animate-pulse"></span>
            System Online
          </span>
          <Link
            href="/dashboard/devices"
            className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Cpu className="h-3.5 w-3.5" /> Devices
          </Link>
          <Link
            href="/dashboard/rules"
            className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Workflow className="h-3.5 w-3.5" /> Rules
          </Link>
          <Link
            href="/dashboard/kiosk"
            className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Monitor className="h-3.5 w-3.5" /> Kiosk
          </Link>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Settings className="h-3.5 w-3.5" /> Settings
          </Link>
        </div>
      </header>

      {isLoading ? (
        <div className="mb-8 rounded-lg border border-dashed bg-white p-6 text-sm text-gray-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          Loading dashboard data...
        </div>
      ) : null}

      {/* KPI Section */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Avg Temperature"
          value={avgTemp.toFixed(1)}
          unit="°C"
          trend="stable"
          className="border-blue-200/70 bg-gradient-to-br from-blue-50/80 to-white dark:border-blue-900/70 dark:from-blue-950/40 dark:to-slate-900"
        />
        <MetricCard
          title="Avg Humidity"
          value={avgHumidity.toFixed(0)}
          unit="%"
          trend="up"
          trendValue="2%"
          className="border-emerald-200/70 bg-gradient-to-br from-emerald-50/70 to-white dark:border-emerald-900/70 dark:from-emerald-950/40 dark:to-slate-900"
        />
        <MetricCard
          title="Power Usage"
          value="12.4"
          unit="kW"
          trend="down"
          trendValue="0.8"
          className="border-amber-200/70 bg-gradient-to-br from-amber-50/70 to-white dark:border-amber-900/70 dark:from-amber-950/40 dark:to-slate-900"
        />
        <MetricCard
          title="Active Alerts"
          value={totalAlerts}
          unit=""
          trend={totalAlerts > 0 ? "up" : "stable"}
          className="border-rose-200/70 bg-gradient-to-br from-rose-50/70 to-white dark:border-rose-900/70 dark:from-rose-950/40 dark:to-slate-900"
        />
      </div>

      {/* Module Shortcuts */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Quick Modules</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {shortcutCards.map((shortcut) => {
            const Icon = shortcut.icon;
            return (
              <Link
                key={shortcut.href}
                href={shortcut.href}
                className="group rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-md border ${shortcut.badgeClass}`}>
                    <Icon className={`h-4 w-4 ${shortcut.iconClass}`} />
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{shortcut.label}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{shortcut.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Zone Grid */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">Zones</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {zones.map((zone) => (
          <ZoneCard key={zone.id} zone={zone} />
        ))}

        {/* Add Zone Placeholder */}
        <div className="border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center h-full min-h-[200px] hover:border-gray-400 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors bg-white/50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-500 dark:hover:border-slate-600 dark:hover:text-slate-300">
          <div className="text-center">
            <span className="text-4xl block mb-2">+</span>
            <span>Add New Zone</span>
          </div>
        </div>
      </div>
    </div>
  );
}
