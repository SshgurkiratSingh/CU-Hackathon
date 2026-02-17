"use client";

import { useMemo, useState } from "react";
import { Activity, Thermometer, Droplets } from "lucide-react";
import { useTelemetrySeries, useZones } from "@/hooks/use-dashboard-data";
import { useWebSocket } from "@/hooks/use-websocket";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const { status, lastMessage } = useWebSocket({ autoConnect: true });
  const selectedZoneId = zoneId || zones[0]?.id || "";
  const { data: history = [] } = useTelemetrySeries(selectedZoneId, 24);

  const selectedZone = zones.find((z) => z.id === selectedZoneId);

  const avgTemp = useMemo(() => {
    if (!history.length) return 0;
    return history.reduce((sum, point) => sum + point.temp, 0) / history.length;
  }, [history]);

  const avgHumidity = useMemo(() => {
    if (!history.length) return 0;
    return (
      history.reduce((sum, point) => sum + point.humidity, 0) / history.length
    );
  }, [history]);

  const isDarkMode =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");
  const chartGrid = isDarkMode ? "#334155" : "#e5e7eb";
  const chartAxis = isDarkMode ? "#94a3b8" : "#9ca3af";
  const chartTooltipStyle = {
    backgroundColor: isDarkMode ? "#0f172a" : "#ffffff",
    border: `1px solid ${isDarkMode ? "#334155" : "#e5e7eb"}`,
    color: isDarkMode ? "#f8fafc" : "#0f172a",
  };

  return (
    <PageLayout>
      <PageHeader
        title="Telemetry Explorer"
        description="Live + historical environmental signals."
        actions={
          <>
            <span className="rounded-md bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground ring-1 ring-border">
              WS: {status}
            </span>
            <Select
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
              className="w-56"
            >
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
        <StatCard
          title="Signal Streams"
          value={selectedZone ? 4 : 0}
          icon={Activity}
        />
        <StatCard
          title="Avg Temp (24h)"
          value={`${avgTemp.toFixed(1)}°C`}
          icon={Thermometer}
        />
        <StatCard
          title="Avg Humidity (24h)"
          value={`${avgHumidity.toFixed(0)}%`}
          icon={Droplets}
        />
      </div>

      {lastMessage ? (
        <Card>
          <CardContent className="py-3 text-xs text-muted-foreground">
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
          <div className="h-90 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={history}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={chartGrid}
                />
                <XAxis
                  dataKey="timestamp"
                  stroke={chartAxis}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={30}
                />
                <YAxis
                  yAxisId="left"
                  stroke={chartAxis}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}°`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke={chartAxis}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend
                  wrapperStyle={{
                    fontSize: "12px",
                    paddingTop: "10px",
                    color: isDarkMode ? "#cbd5e1" : "#475569",
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="temp"
                  name="Temperature"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="humidity"
                  name="Humidity"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
