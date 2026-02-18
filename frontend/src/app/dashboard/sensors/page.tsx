"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTelemetrySensors, useSensorHistory, useZones } from "@/hooks/use-dashboard-data";
import { PageLayout } from "@/components/dashboard/PageLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default function SensorHistoryPage() {
  const { data: sensors } = useTelemetrySensors();
  const { data: zones = [] } = useZones();
  const [selectedSensor, setSelectedSensor] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [limit, setLimit] = useState(50);

  const { data: history = [], isLoading } = useSensorHistory(
    selectedSensor,
    selectedZone,
    limit
  );

  return (
    <PageLayout>
      <PageHeader
        title="Sensor History"
        description="View past sensor readings"
      />

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <select
              value={selectedSensor}
              onChange={(e) => setSelectedSensor(e.target.value)}
              className="rounded border px-3 py-2"
            >
              <option value="">Select Sensor Type</option>
              {sensors?.sensorTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="rounded border px-3 py-2"
            >
              <option value="">All Zones</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>

            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="rounded border px-3 py-2"
            >
              <option value={25}>25 readings</option>
              <option value={50}>50 readings</option>
              <option value={100}>100 readings</option>
              <option value={250}>250 readings</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {selectedSensor && (
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedSensor} History {isLoading && "(loading...)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length > 0 ? (
              <div className="overflow-x-auto">
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
                    {history.map((row) => (
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
              <p className="text-gray-500">No data available</p>
            )}
          </CardContent>
        </Card>
      )}
    </PageLayout>
  );
}
