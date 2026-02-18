"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Radio, Search, Settings2, Download, RefreshCw, Pause, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useDevices, useRecentTopicTelemetry, useZones } from "@/hooks/use-dashboard-data";

function formatAgo(ts: string) {
  const diffMs = Date.now() - new Date(ts).getTime();
  const sec = Math.max(0, Math.floor(diffMs / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  return `${hrs}h ago`;
}

export default function TopicTelemetryPage() {
  const [bufferSize, setBufferSize] = useState(400);
  const { data: telemetry = [], isLoading, refetch } = useRecentTopicTelemetry(bufferSize);
  const { data: devices = [] } = useDevices();
  const { data: zones = [] } = useZones();

  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [displayLimit, setDisplayLimit] = useState(50);
  const [sortBy, setSortBy] = useState<"time" | "value" | "topic">("time");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      refetch?.();
    }, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refetch]);

  const zoneMap = useMemo(() => new Map(zones.map((zone) => [zone.id, zone.name])), [zones]);

  const topicDeviceMap = useMemo(() => {
    const map = new Map<string, { deviceName: string; zoneId: string; sensorLabel: string }>();
    devices.forEach((device) => {
      (device.sensors || []).forEach((sensor) => {
        map.set(sensor.mqttTopic, {
          deviceName: device.name,
          zoneId: device.zoneId,
          sensorLabel: sensor.label,
        });
      });
    });
    return map;
  }, [devices]);

  const latestByTopic = useMemo(() => {
    const groups = new Map<string, typeof telemetry>();
    telemetry.forEach((row) => {
      const key = row.topic || `${row.siteId}/${row.sensorType}/${row.sensorKey || "unknown"}`;
      const current = groups.get(key) || [];
      current.push(row);
      groups.set(key, current);
    });

    return Array.from(groups.entries()).map(([topicKey, rows]) => {
      const sorted = [...rows].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      const latest = sorted[0];
      const previous = sorted[1];
      const delta = previous ? latest.value - previous.value : 0;
      const linked = topicDeviceMap.get(latest.topic);
      return {
        topicKey,
        latest,
        previous,
        delta,
        trend: delta > 0 ? "up" : delta < 0 ? "down" : "stable",
        deviceName: linked?.deviceName || latest.deviceId || "Unknown device",
        zoneId: linked?.zoneId || latest.siteId,
        sensorLabel: linked?.sensorLabel || latest.sensorKey || latest.sensorType,
      };
    });
  }, [telemetry, topicDeviceMap]);

  const filtered = useMemo(() => {
    let result = latestByTopic.filter((row) => {
      const matchZone = zoneFilter === "all" || row.zoneId === zoneFilter;
      const q = search.trim().toLowerCase();
      const matchSearch =
        q.length === 0 ||
        row.topicKey.toLowerCase().includes(q) ||
        row.deviceName.toLowerCase().includes(q) ||
        row.sensorLabel.toLowerCase().includes(q);
      return matchZone && matchSearch;
    });

    result.sort((a, b) => {
      if (sortBy === "time") return new Date(b.latest.timestamp).getTime() - new Date(a.latest.timestamp).getTime();
      if (sortBy === "value") return b.latest.value - a.latest.value;
      return a.topicKey.localeCompare(b.topicKey);
    });

    return result.slice(0, displayLimit);
  }, [latestByTopic, search, zoneFilter, displayLimit, sortBy]);

  const activeTopics = latestByTopic.length;
  const staleTopics = latestByTopic.filter(
    (row) => Date.now() - new Date(row.latest.timestamp).getTime() > 2 * 60 * 1000,
  ).length;

  const handleExport = () => {
    const csv = [
      ["Topic", "Device", "Zone", "Sensor", "Value", "Unit", "Trend", "Delta", "Timestamp"],
      ...filtered.map(row => [
        row.topicKey,
        row.deviceName,
        zoneMap.get(row.zoneId) || row.zoneId,
        row.sensorLabel,
        row.latest.value.toFixed(2),
        row.latest.unit || "",
        row.trend,
        row.delta.toFixed(2),
        row.latest.timestamp
      ])
    ].map(r => r.join(",")).join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `topics-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen space-y-6 bg-linear-to-b from-slate-50 to-gray-50/80 p-6 md:p-8">
      <header className="flex items-center justify-between rounded-2xl border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Live Topic Telemetry</h1>
            <p className="text-xs text-gray-500">Live topic stream with mapped device, zone, and quick insights. Showing {filtered.length} of {activeTopics} topics.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <Radio className="h-3.5 w-3.5" /> {autoRefresh ? `auto-refresh ${refreshInterval}s` : "paused"}
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
            <Settings2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
            {autoRefresh ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch?.()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={filtered.length === 0}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Topics</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{activeTopics}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Stale (&gt;2m)</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{staleTopics}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Records (buffer)</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{telemetry.length}</CardContent></Card>
      </div>

      <Card>
        <CardHeader className="gap-3">
          <CardTitle>Topic Insights</CardTitle>
          
          {showSettings && (
            <div className="rounded-lg border bg-gray-50 p-4 space-y-3">
              <h4 className="font-medium text-sm">Display Settings</h4>
              <div className="grid gap-3 md:grid-cols-4">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Display Limit</label>
                  <Select value={displayLimit.toString()} onChange={(e) => setDisplayLimit(Number(e.target.value))}>
                    <option value="10">10 topics</option>
                    <option value="25">25 topics</option>
                    <option value="50">50 topics</option>
                    <option value="100">100 topics</option>
                    <option value="250">250 topics</option>
                    <option value="500">500 topics</option>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Sort By</label>
                  <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as "time" | "value" | "topic")}>
                    <option value="time">Latest First</option>
                    <option value="value">Highest Value</option>
                    <option value="topic">Topic Name</option>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Refresh Interval</label>
                  <Select value={refreshInterval.toString()} onChange={(e) => setRefreshInterval(Number(e.target.value))}>
                    <option value="3">3 seconds</option>
                    <option value="5">5 seconds</option>
                    <option value="10">10 seconds</option>
                    <option value="30">30 seconds</option>
                    <option value="60">60 seconds</option>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Buffer Size</label>
                  <Select value={bufferSize.toString()} onChange={(e) => setBufferSize(Number(e.target.value))}>
                    <option value="100">100 records</option>
                    <option value="200">200 records</option>
                    <option value="400">400 records</option>
                    <option value="1000">1000 records</option>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search topic, device, sensor"
                className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm"
              />
            </div>
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="all">All zones</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>{zone.name}</option>
              ))}
            </select>
            <Select
              value={displayLimit.toString()}
              onChange={(e) => setDisplayLimit(Number(e.target.value))}
            >
              <option value="10">Show 10</option>
              <option value="25">Show 25</option>
              <option value="50">Show 50</option>
              <option value="100">Show 100</option>
              <option value="250">Show 250</option>
              <option value="500">Show 500</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-3 font-medium">Topic</th>
                  <th className="p-3 font-medium">Device</th>
                  <th className="p-3 font-medium">Zone</th>
                  <th className="p-3 font-medium">Sensor</th>
                  <th className="p-3 font-medium">Latest</th>
                  <th className="p-3 font-medium">Insight</th>
                  <th className="p-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr><td className="p-6 text-gray-500" colSpan={7}>Loading live telemetry...</td></tr>
                ) : filtered.length > 0 ? (
                  filtered.map((row) => (
                    <tr key={row.topicKey} className="hover:bg-gray-50">
                      <td className="p-3 font-mono text-[11px] text-gray-600">{row.topicKey}</td>
                      <td className="p-3 text-gray-800">{row.deviceName}</td>
                      <td className="p-3 text-gray-700">{zoneMap.get(row.zoneId) || row.zoneId}</td>
                      <td className="p-3 text-gray-700">{row.sensorLabel}</td>
                      <td className="p-3 font-semibold text-gray-900">{row.latest.value.toFixed(2)} {row.latest.unit || ""}</td>
                      <td className="p-3">
                        <Badge
                          variant="outline"
                          className={
                            row.trend === "up"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : row.trend === "down"
                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                : "border-gray-200 bg-gray-50 text-gray-700"
                          }
                        >
                          {row.trend} ({row.delta >= 0 ? "+" : ""}{row.delta.toFixed(2)})
                        </Badge>
                      </td>
                      <td className="p-3 text-gray-600">{formatAgo(row.latest.timestamp)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td className="p-6 text-gray-500" colSpan={7}>No topic telemetry matched filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
