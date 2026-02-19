"use client";

import React from "react";
import Link from "next/link";
import { ZoneCard } from "@/components/dashboard/ZoneCard";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { TopicWidgetCard } from "@/components/dashboard/TopicWidgetCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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
import {
  useCreateAction,
  useCreateZone,
  useDevices,
  useImportantActions,
  useZones,
} from "@/hooks/use-dashboard-data";
import { SensorType, Zone, ZoneType } from "@/types";

function metricForSensorType(
  zone: Zone,
  sensorType: SensorType,
): number | undefined {
  if (sensorType === "temperature") return zone.metrics.temp.value;
  if (sensorType === "humidity") return zone.metrics.humidity.value;
  if (sensorType === "co2") return zone.metrics.co2.value;
  if (sensorType === "light") return zone.metrics.light.value;
  if (sensorType === "soil_moisture") return zone.metrics.soil_moisture?.value;
  return undefined;
}

export default function DashboardPage() {
  const { data: zones = [], isLoading } = useZones();
  const { data: devices = [] } = useDevices();
  const { data: importantActions = [] } = useImportantActions();
  const createZoneMutation = useCreateZone();
  const createActionMutation = useCreateAction();
  const [showZoneForm, setShowZoneForm] = React.useState(false);
  const [zoneName, setZoneName] = React.useState("");
  const [zoneId, setZoneId] = React.useState("");
  const [zoneType, setZoneType] = React.useState<ZoneType>("vegetative");
  const [zoneDescription, setZoneDescription] = React.useState("");
  const [zoneCrop, setZoneCrop] = React.useState("");
  const [targetTemp, setTargetTemp] = React.useState("");
  const [targetHumidity, setTargetHumidity] = React.useState("");
  const [targetCo2, setTargetCo2] = React.useState("");
  const [widgetManagerOpen, setWidgetManagerOpen] = React.useState(false);
  const [selectedWidgetKeys, setSelectedWidgetKeys] = React.useState<string[]>(
    [],
  );

  const suggestedZoneId = React.useMemo(() => {
    return `zone-${zones.length + 1}`;
  }, [zones.length]);

  const handleCreateZone = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const siteId = zoneId.trim() || suggestedZoneId;
    const name = zoneName.trim() || `Zone ${zones.length + 1}`;

    createZoneMutation.mutate(
      {
        siteId,
        name,
        type: zoneType,
        description: zoneDescription.trim() || undefined,
        crop: zoneCrop.trim() || undefined,
        targetTemp: targetTemp.trim() ? Number(targetTemp) : undefined,
        targetHumidity: targetHumidity.trim()
          ? Number(targetHumidity)
          : undefined,
        targetCo2: targetCo2.trim() ? Number(targetCo2) : undefined,
      },
      {
        onSuccess: () => {
          setShowZoneForm(false);
          setZoneName("");
          setZoneId("");
          setZoneType("vegetative");
          setZoneDescription("");
          setZoneCrop("");
          setTargetTemp("");
          setTargetHumidity("");
          setTargetCo2("");
        },
      },
    );
  };

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
  const suspectedProblems = importantActions.filter(
    (item) => item.source === "suspected_problem_engine",
  );

  const zoneHealthData = React.useMemo(() => {
    const critical = zones.filter((zone) => zone.status === "critical").length;
    const warning = zones.filter((zone) => zone.status === "warning").length;
    const healthy = zones.filter((zone) => zone.status === "optimal").length;
    const offline = zones.filter((zone) => zone.status === "offline").length;
    return [
      { name: "Healthy", value: healthy, color: "#16a34a" },
      { name: "Warning", value: warning, color: "#d97706" },
      { name: "Critical", value: critical, color: "#dc2626" },
      { name: "Offline", value: offline, color: "#64748b" },
    ].filter((entry) => entry.value > 0);
  }, [zones]);

  const zoneClimateData = React.useMemo(() => {
    return zones.slice(0, 8).map((zone) => ({
      zone: zone.name,
      temp: Number(zone.metrics.temp.value || 0),
      humidity: Number(zone.metrics.humidity.value || 0),
    }));
  }, [zones]);

  const allWidgetCandidates = React.useMemo(() => {
    const zoneById = new Map(zones.map((zone) => [zone.id, zone]));

    return devices.flatMap((device) => {
      const zone = zoneById.get(device.zoneId);
      if (!zone) return [];
      return (device.sensors || []).map((sensor) => ({
        key: `${device.id}-${sensor.key}`,
        zone,
        device,
        sensor,
        value: metricForSensorType(zone, sensor.sensorType),
      }));
    }) as Array<{
      key: string;
      zone: Zone;
      device: (typeof devices)[number];
      sensor: NonNullable<(typeof devices)[number]["sensors"]>[number];
      value?: number;
    }>;
  }, [devices, zones]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("dashboard_widget_keys_v1");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed))
        setSelectedWidgetKeys(
          parsed.filter((entry) => typeof entry === "string"),
        );
    } catch {
      // ignore invalid local preference format
    }
  }, []);

  React.useEffect(() => {
    setSelectedWidgetKeys((prev) => {
      if (allWidgetCandidates.length === 0) {
        return prev.length === 0 ? prev : [];
      }

      const validSet = new Set(allWidgetCandidates.map((entry) => entry.key));
      const validPrev = prev.filter((key) => validSet.has(key));
      const next =
        validPrev.length > 0
          ? validPrev
          : allWidgetCandidates.slice(0, 6).map((entry) => entry.key);

      const unchanged =
        next.length === prev.length &&
        next.every((key, index) => key === prev[index]);

      return unchanged ? prev : next;
    });
  }, [allWidgetCandidates]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "dashboard_widget_keys_v1",
      JSON.stringify(selectedWidgetKeys),
    );
  }, [selectedWidgetKeys]);

  const widgetCards = React.useMemo(() => {
    const selectedSet = new Set(selectedWidgetKeys);
    return allWidgetCandidates
      .filter((entry) => selectedSet.has(entry.key))
      .slice(0, 12);
  }, [allWidgetCandidates, selectedWidgetKeys]);

  const addWidgetCard = (key: string) => {
    setSelectedWidgetKeys((prev) =>
      prev.includes(key) ? prev : [...prev, key],
    );
  };

  const removeWidgetCard = (key: string) => {
    setSelectedWidgetKeys((prev) => prev.filter((entry) => entry !== key));
  };

  const runWidgetQuickAction = (
    entry: (typeof allWidgetCandidates)[number],
    mode: "on" | "off" | "toggle",
  ) => {
    createActionMutation.mutate({
      name: `Widget ${mode.toUpperCase()} · ${entry.sensor.label}`,
      type: "manual",
      siteId: entry.zone.id,
      parameters: {
        mode,
        sensorKey: entry.sensor.key,
        sensorType: entry.sensor.sensorType,
        mqttTopic: entry.sensor.mqttTopic,
        widget: entry.sensor.widget || "gauge",
        targetDeviceId: entry.device.id,
      },
    });
  };

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
    <div className="flex min-h-screen flex-col bg-linear-to-b from-slate-50 to-gray-50/80 p-6 md:p-8 dark:from-slate-950 dark:to-slate-900">
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
          className="border-blue-200/70 bg-linear-to-br from-blue-50/80 to-white dark:border-blue-900/70 dark:from-blue-950/40 dark:to-slate-900"
        />
        <MetricCard
          title="Avg Humidity"
          value={avgHumidity.toFixed(0)}
          unit="%"
          trend="up"
          trendValue="2%"
          className="border-emerald-200/70 bg-linear-to-br from-emerald-50/70 to-white dark:border-emerald-900/70 dark:from-emerald-950/40 dark:to-slate-900"
        />
        <MetricCard
          title="Power Usage"
          value="12.4"
          unit="kW"
          trend="down"
          trendValue="0.8"
          className="border-amber-200/70 bg-linear-to-br from-amber-50/70 to-white dark:border-amber-900/70 dark:from-amber-950/40 dark:to-slate-900"
        />
        <MetricCard
          title="Active Alerts"
          value={totalAlerts}
          unit=""
          trend={totalAlerts > 0 ? "up" : "stable"}
          className="border-rose-200/70 bg-linear-to-br from-rose-50/70 to-white dark:border-rose-900/70 dark:from-rose-950/40 dark:to-slate-900"
        />
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Zone Health Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              {zoneHealthData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={zoneHealthData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label
                    >
                      {zoneHealthData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-500">No zone health data.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Zone Climate Snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              {zoneClimateData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={zoneClimateData} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="zone" fontSize={11} tickLine={false} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="temp" fill="#2563eb" radius={[5, 5, 0, 0]} />
                    <Bar dataKey="humidity" fill="#06b6d4" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-gray-500">No climate data available.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <Card className="border-rose-200/70 bg-rose-50/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Important Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {importantActions.slice(0, 4).map((item) => (
              <div key={item.id} className="rounded-md border bg-white p-2">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-gray-600">{item.message}</p>
              </div>
            ))}
            {importantActions.length === 0 ? (
              <p className="text-sm text-gray-500">
                No important actions pending.
              </p>
            ) : null}
            <Link
              href="/dashboard/ai"
              className="text-xs text-rose-700 hover:underline"
            >
              Open assistant queue
            </Link>
          </CardContent>
        </Card>

        <Card className="border-amber-200/70 bg-amber-50/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Suspected Problem Engine</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {suspectedProblems.slice(0, 4).map((item) => (
              <div key={item.id} className="rounded-md border bg-white p-2">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-gray-600">{item.message}</p>
              </div>
            ))}
            {suspectedProblems.length === 0 ? (
              <p className="text-sm text-gray-500">
                No suspected problems detected.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Module Shortcuts */}
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
            Quick Modules
          </h2>
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
                  <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-md border ${shortcut.badgeClass}`}
                  >
                    <Icon className={`h-4 w-4 ${shortcut.iconClass}`} />
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                  {shortcut.label}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                  {shortcut.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Topic Widgets */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
          Device Topic Widgets
        </h2>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setWidgetManagerOpen(true)}
          >
            Add Widget
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedWidgetKeys([])}
            disabled={selectedWidgetKeys.length === 0}
          >
            Remove All
          </Button>
        </div>
      </div>
      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {widgetCards.length > 0 ? (
          widgetCards.map((entry) => (
            <TopicWidgetCard
              key={entry.key}
              deviceName={entry.device.name}
              zoneId={entry.zone.id}
              sensor={entry.sensor}
              value={entry.value}
              status={entry.device.status}
              onRemove={() => removeWidgetCard(entry.key)}
              onQuickAction={(mode) => runWidgetQuickAction(entry, mode)}
            />
          ))
        ) : (
          <div className="col-span-full rounded-lg border border-dashed bg-white p-5 text-sm text-gray-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            Configure device sensors and widgets to render topic cards here.
          </div>
        )}
      </div>

      {widgetManagerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-3xl rounded-xl border border-gray-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">
                Manage Dashboard Widgets
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWidgetManagerOpen(false)}
              >
                Close
              </Button>
            </div>

            <div className="max-h-[70vh] space-y-2 overflow-auto">
              {allWidgetCandidates.length > 0 ? (
                allWidgetCandidates.map((entry) => {
                  const selected = selectedWidgetKeys.includes(entry.key);
                  return (
                    <div
                      key={entry.key}
                      className="flex items-center justify-between rounded-md border border-gray-200 p-2 dark:border-slate-700"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                          {entry.device.name} · {entry.sensor.label}
                        </p>
                        <p className="font-mono text-[11px] text-gray-500 dark:text-slate-400">
                          {entry.sensor.mqttTopic}
                        </p>
                      </div>
                      {selected ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeWidgetCard(entry.key)}
                        >
                          Remove
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => addWidgetCard(entry.key)}
                        >
                          Add
                        </Button>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  No device topics available yet.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Zone Grid */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
          Zones
        </h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {zones.map((zone) => (
          <ZoneCard key={zone.id} zone={zone} />
        ))}

        {/* Add Zone Placeholder */}
        <div className="border-2 border-dashed border-gray-300 rounded-xl h-full min-h-50 transition-colors bg-white/50 dark:border-slate-700 dark:bg-slate-900/60 p-4">
          {!showZoneForm ? (
            <button
              type="button"
              className="flex h-full min-h-42 w-full items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-400 cursor-pointer transition-colors dark:text-slate-500 dark:hover:text-slate-300"
              onClick={() => setShowZoneForm(true)}
            >
              <div className="text-center">
                <span className="text-4xl block mb-2">+</span>
                <span>Add New Zone</span>
              </div>
            </button>
          ) : (
            <form onSubmit={handleCreateZone} className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                Create Zone
              </h3>
              <Input
                value={zoneName}
                onChange={(event) => setZoneName(event.target.value)}
                placeholder="Zone Name (e.g. Flower Room A)"
                maxLength={80}
              />
              <Input
                value={zoneId}
                onChange={(event) => setZoneId(event.target.value)}
                placeholder={`Zone ID (default: ${suggestedZoneId})`}
                maxLength={40}
              />
              <Input
                value={zoneDescription}
                onChange={(event) => setZoneDescription(event.target.value)}
                placeholder="Description (optional)"
                maxLength={160}
              />
              <Input
                value={zoneCrop}
                onChange={(event) => setZoneCrop(event.target.value)}
                placeholder="Crop (optional, e.g. Tomato)"
                maxLength={60}
              />
              <Select
                value={zoneType}
                onChange={(event) =>
                  setZoneType(event.target.value as ZoneType)
                }
              >
                <option value="propagation">Propagation</option>
                <option value="vegetative">Vegetative</option>
                <option value="flowering">Flowering</option>
                <option value="drying">Drying</option>
                <option value="curing">Curing</option>
              </Select>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  value={targetTemp}
                  onChange={(event) => setTargetTemp(event.target.value)}
                  placeholder="Temp °C"
                  type="number"
                  min={0}
                  step="0.1"
                />
                <Input
                  value={targetHumidity}
                  onChange={(event) => setTargetHumidity(event.target.value)}
                  placeholder="Humidity %"
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                />
                <Input
                  value={targetCo2}
                  onChange={(event) => setTargetCo2(event.target.value)}
                  placeholder="CO2 ppm"
                  type="number"
                  min={0}
                  step="1"
                />
              </div>
              {createZoneMutation.isError ? (
                <p className="text-xs text-red-600">
                  Unable to create zone. Check site ID and try again.
                </p>
              ) : null}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={createZoneMutation.isPending}
                  className="flex-1"
                >
                  {createZoneMutation.isPending ? "Creating..." : "Create"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowZoneForm(false)}
                  disabled={createZoneMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
