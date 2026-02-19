"use client";

import { useMemo, useState } from "react";
import { Activity, Thermometer, Droplets } from "lucide-react";
import { useTelemetrySeries, useZones, useTelemetrySensors, useSensorHistory } from "@/hooks/use-dashboard-data";
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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { PageLayout } from "@/components/dashboard/PageLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Select } from "@/components/ui/select";

export default function TelemetryPage() {
  const { data: zones = [] } = useZones();
  const { data: sensors } = useTelemetrySensors();
  const [zoneId, setZoneId] = useState<string>("");
  const [selectedSensor, setSelectedSensor] = useState("");
  const [historyLimit, setHistoryLimit] = useState(50);
  const { status, lastMessage } = useWebSocket({ autoConnect: true });
  const selectedZoneId = zoneId || zones[0]?.id || "";
  const { data: history = [] } = useTelemetrySeries(selectedZoneId, 24);
  const { data: sensorHistory = [], isLoading } = useSensorHistory(
    selectedSensor,
    zoneId,
    historyLimit
  );

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

  const sensorHistoryChartData = useMemo(() => {
    return [...sensorHistory]
      .reverse()
      .map((row) => ({
        time: new Date(row.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        value: Number(row.value ?? 0),
        zone: zones.find((z) => z.id === row.siteId)?.name || row.siteId,
      }));
  }, [sensorHistory, zones]);

  const signalCoverageData = useMemo(() => {
    const coverage = {
      temperature: 0,
      humidity: 0,
      co2: 0,
      light: 0,
    };
    for (const point of history) {
      if (typeof point.temp === "number") coverage.temperature += 1;
      if (typeof point.humidity === "number") coverage.humidity += 1;
      if (typeof point.co2 === "number") coverage.co2 += 1;
      if (typeof point.light === "number") coverage.light += 1;
    }
    return [
      { name: "Temp", value: coverage.temperature },
      { name: "Humidity", value: coverage.humidity },
      { name: "CO2", value: coverage.co2 },
      { name: "Light", value: coverage.light },
    ].filter((item) => item.value > 0);
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
  const pieColors = ["#2563eb", "#06b6d4", "#16a34a", "#f59e0b"];

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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Multi-signal Overview</CardTitle>
            <CardDescription>
              Combined 24-hour trend for temperature and humidity.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-72 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                  <XAxis dataKey="timestamp" stroke={chartAxis} fontSize={10} />
                  <YAxis stroke={chartAxis} fontSize={12} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="temp"
                    name="Temp"
                    stroke="#2563eb"
                    fill="#93c5fd"
                    fillOpacity={0.35}
                  />
                  <Area
                    type="monotone"
                    dataKey="humidity"
                    name="Humidity"
                    stroke="#0891b2"
                    fill="#67e8f9"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Signal Coverage</CardTitle>
            <CardDescription>
              Share of available points by signal in selected zone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full min-w-0">
              {signalCoverageData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={signalCoverageData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      label
                    >
                      {signalCoverageData.map((entry, index) => (
                        <Cell
                          key={`${entry.name}-${index}`}
                          fill={pieColors[index % pieColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Not enough points for a coverage chart.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sensor History</CardTitle>
          <CardDescription>View past readings by sensor type</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Select
              value={selectedSensor}
              onChange={(e) => setSelectedSensor(e.target.value)}
            >
              <option value="">Select Sensor</option>
              {sensors?.sensorTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
            <Select
              value={zoneId}
              onChange={(e) => setZoneId(e.target.value)}
            >
              <option value="">All Zones</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </Select>
            <Select
              value={historyLimit.toString()}
              onChange={(e) => setHistoryLimit(Number(e.target.value))}
            >
              <option value="25">25 readings</option>
              <option value="50">50 readings</option>
              <option value="100">100 readings</option>
              <option value="250">250 readings</option>
            </Select>
          </div>

          {selectedSensor && (
            <div className="overflow-x-auto">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : sensorHistory.length > 0 ? (
                <div className="space-y-4">
                  <div className="h-80 w-full min-w-0 rounded-lg border bg-white/60 p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sensorHistoryChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                        <XAxis dataKey="time" stroke={chartAxis} fontSize={11} />
                        <YAxis stroke={chartAxis} fontSize={12} />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="value"
                          name={selectedSensor}
                          stroke="#7c3aed"
                          strokeWidth={2.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="p-2 text-left">Time</th>
                        <th className="p-2 text-left">Zone</th>
                        <th className="p-2 text-right">Value</th>
                        <th className="p-2 text-left">Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sensorHistory.map((row) => (
                        <tr key={row.id} className="border-b">
                          <td className="p-2">
                            {new Date(row.timestamp).toLocaleString()}
                          </td>
                          <td className="p-2">
                            {zones.find((z) => z.id === row.siteId)?.name || row.siteId}
                          </td>
                          <td className="p-2 text-right font-mono">
                            {row.value.toFixed(2)}
                          </td>
                          <td className="p-2">{row.unit || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No data available</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
