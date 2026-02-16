"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getZoneById,
  getMockTelemetryHistory,
  getDevicesByZoneId,
} from "@/lib/mock-data";
import { Zone, TelemetryPoint, Device } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Thermometer,
  Droplets,
  Fan,
  Wind,
  Sun,
  Activity,
  Zap,
} from "lucide-react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Badge } from "@/components/ui/badge";

export default function ZoneDetailPage() {
  const { zoneId } = useParams<{ zoneId: string }>();
  const [zone, setZone] = useState<Zone | null>(null);
  const [history, setHistory] = useState<TelemetryPoint[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    if (zoneId) {
      const foundZone = getZoneById(zoneId);
      if (foundZone) {
        setZone(foundZone);
        setHistory(getMockTelemetryHistory(zoneId));
        setDevices(getDevicesByZoneId(zoneId));
      }
    }
  }, [zoneId]);

  if (!zone) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        <div className="text-center">
          <Activity className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-500" />
          <p>Loading Zone Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50 p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              {zone.name}
              <Badge
                variant={zone.status === "optimal" ? "default" : "destructive"}
                className={
                  zone.status === "optimal"
                    ? "bg-green-600 hover:bg-green-700"
                    : zone.status === "warning"
                      ? "bg-yellow-600 hover:bg-yellow-700"
                      : "bg-red-600 hover:bg-red-700"
                }
              >
                {zone.status.toUpperCase()}
              </Badge>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium uppercase tracking-wide">
              Type: <span className="text-gray-900">{zone.type}</span> • ID:{" "}
              <span className="font-mono text-xs">{zone.id}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/rules?zone=${zone.id}`}>Schedule Rules</Link>
          </Button>
          <Button variant="destructive">Emergency Stop</Button>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-blue-100 bg-blue-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">
              Temperature
            </CardTitle>
            <Thermometer className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-950">
              {zone.metrics.temp.value}
              {zone.metrics.temp.unit}
            </div>
            <p className="text-xs text-blue-600/80 mt-1">Target: 24.0°C</p>
          </CardContent>
        </Card>
        <Card className="border-cyan-100 bg-cyan-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-cyan-900">
              Humidity
            </CardTitle>
            <Droplets className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-950">
              {zone.metrics.humidity.value}
              {zone.metrics.humidity.unit}
            </div>
            <p className="text-xs text-cyan-600/80 mt-1">Target: 60%</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-100 bg-yellow-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-yellow-900">
              Light Intensity
            </CardTitle>
            <Sun className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-950">
              {zone.metrics.light.value} {zone.metrics.light.unit}
            </div>
            <p className="text-xs text-yellow-600/80 mt-1">DLI: 12.4 mol/m²</p>
          </CardContent>
        </Card>
        <Card className="border-green-100 bg-green-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-900">
              CO2 Level
            </CardTitle>
            <Wind className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-950">
              {zone.metrics.co2.value} {zone.metrics.co2.unit}
            </div>
            <p className="text-xs text-green-600/80 mt-1">Target: 800ppm</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area: Charts & Controls */}
      <div className="grid gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {/* Charts Column (Left) */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Environmental Trends (24h)</CardTitle>
              <CardDescription>
                Temperature and humidity fluctuation.
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-0">
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={history}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="timestamp"
                      stroke="#9ca3af"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={30}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="#9ca3af"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}°`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#9ca3af"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      itemStyle={{ fontSize: "12px" }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="temp"
                      name="Temperature (°C)"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 6, fill: "#2563eb", strokeWidth: 0 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="humidity"
                      name="Humidity (%)"
                      stroke="#06b6d4"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 6, fill: "#06b6d4", strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Connected Devices List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Connected Devices</CardTitle>
                <CardDescription>
                  Hardware deployed in {zone.name}.
                </CardDescription>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/dashboard/devices?zone=${zone.id}`}>
                  <Zap className="w-4 h-4 mr-2" /> Add Device
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b text-gray-500">
                    <tr>
                      <th className="p-3 font-medium">Device Name</th>
                      <th className="p-3 font-medium">Type</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y bg-white">
                    {devices.length > 0 ? (
                      devices.map((device) => (
                        <tr
                          key={device.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="p-3 font-medium text-gray-900">
                            {device.name}
                          </td>
                          <td className="p-3 text-gray-500 font-mono text-xs">
                            {device.subType}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant="outline"
                              className={
                                device.status === "online"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : device.status === "error"
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : "bg-gray-100 text-gray-600"
                              }
                            >
                              {device.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <Button variant="ghost" size="sm" className="h-8">
                              Configure
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-8 text-center text-gray-400"
                        >
                          No devices found in this zone.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls Sidebar (Right) */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" /> Quick Actions
              </CardTitle>
              <CardDescription>Manual overrides</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 block">
                  Irrigation
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button className="w-full" variant="outline" size="sm">
                    Run 2m
                  </Button>
                  <Button className="w-full" variant="outline" size="sm">
                    Run 5m
                  </Button>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <label className="text-sm font-medium text-gray-700 block">
                  Ventilation
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="justify-start"
                  >
                    <Wind className="w-4 h-4 mr-2" /> Force Extraction
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="justify-start"
                  >
                    <Fan className="w-4 h-4 mr-2" /> Circulate Air
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Lighting Mode
                </label>
                <select className="w-full border rounded-md p-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none">
                  <option>Auto (Schedule)</option>
                  <option>Manual ON</option>
                  <option>Manual OFF</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
