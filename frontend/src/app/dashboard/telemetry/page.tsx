"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Activity, Thermometer, Droplets } from "lucide-react";
import { getMockTelemetryHistory } from "@/lib/mock-data";
import { useZones } from "@/hooks/use-dashboard-data";
import { useWebSocket } from "@/hooks/use-websocket";
import { TelemetryPoint } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { PageLayout } from "@/components/dashboard/PageLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Select } from "@/components/ui/select";

export default function TelemetryPage() {
  const { data: zones = [] } = useZones();
  const [zoneId, setZoneId] = useState<string>("");
  const [history, setHistory] = useState<TelemetryPoint[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const { status, lastMessage } = useWebSocket({ autoConnect: true });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!zoneId && zones.length > 0) {
      setZoneId(zones[0].id);
    }
  }, [zoneId, zones]);

  useEffect(() => {
    if (!zoneId) return;
    setHistory(getMockTelemetryHistory(zoneId, 24));
  }, [zoneId]);

  const selectedZone = zones.find((z) => z.id === zoneId);

  const avgTemp = useMemo(() => {
    if (!history.length) return 0;
    return history.reduce((sum, point) => sum + point.temp, 0) / history.length;
  }, [history]);

  const avgHumidity = useMemo(() => {
    if (!history.length) return 0;
    return history.reduce((sum, point) => sum + point.humidity, 0) / history.length;
  }, [history]);

  return (
    <PageLayout>
      <PageHeader
        title="Telemetry Explorer"
        description="Live + historical environmental signals."
        actions={
          <>
            <span className="rounded-md bg-white px-2.5 py-1 text-xs text-gray-600 ring-1 ring-gray-200">
              WS: {status}
            </span>
            <Select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="w-56">
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </Select>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Signal Streams" value={selectedZone ? 4 : 0} icon={Activity} />
        <StatCard title="Avg Temp (24h)" value={`${avgTemp.toFixed(1)}°C`} icon={Thermometer} />
        <StatCard title="Avg Humidity (24h)" value={`${avgHumidity.toFixed(0)}%`} icon={Droplets} />
      </div>

      {lastMessage ? (
        <Card>
          <CardContent className="py-3 text-xs text-gray-600">
            Last live packet: {lastMessage.data?.toString().slice(0, 180)}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Temperature & Humidity</CardTitle>
          <CardDescription>24-hour trend for selected stream.</CardDescription>
        </CardHeader>
        <CardContent className="pl-0">
          <div className="h-[360px] w-full">
            {isMounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="timestamp" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} minTickGap={30} />
                  <YAxis yAxisId="left" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}°`} />
                  <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                  <Line yAxisId="left" type="monotone" dataKey="temp" name="Temperature" stroke="#2563eb" strokeWidth={2.5} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="humidity" name="Humidity" stroke="#06b6d4" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">Preparing chart...</div>
            )}
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
