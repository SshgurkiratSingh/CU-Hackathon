"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDevices, useSendDeviceOledCommand } from "@/hooks/use-dashboard-data";

function parsePages(input: string) {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) =>
      line
        .split(",")
        .map((field) => field.trim())
        .filter(Boolean)
        .slice(0, 6),
    )
    .slice(0, 6);
}

function OledCommandPageContent() {
  const params = useSearchParams();
  const { data: devices = [] } = useDevices();
  const oledMutation = useSendDeviceOledCommand();

  const requestedDeviceId = params.get("device") || "";
  const defaultDevice = devices.find((d) => d.id === requestedDeviceId) || devices[0];

  const [deviceId, setDeviceId] = useState<string>(requestedDeviceId || "");
  const [rotationSec, setRotationSec] = useState(3);
  const [brightness, setBrightness] = useState(255);
  const [topicOverride, setTopicOverride] = useState("");
  const [pagesText, setPagesText] = useState(
    "humidity,co2\nlight,soil_moisture,mmwave_presence",
  );

  const selectedDevice = useMemo(
    () => devices.find((d) => d.id === (deviceId || defaultDevice?.id)) || defaultDevice,
    [devices, deviceId, defaultDevice],
  );

  const defaultTopic = selectedDevice
    ? `greenhouse/${selectedDevice.zoneId}/command/oled/${selectedDevice.id}`
    : "";

  const payloadPreview = useMemo(
    () => ({
      topic: topicOverride.trim() || defaultTopic,
      rotationSec,
      brightness,
      pages: parsePages(pagesText),
    }),
    [topicOverride, defaultTopic, rotationSec, brightness, pagesText],
  );

  const sendCommand = () => {
    if (!selectedDevice) return;
    oledMutation.mutate({
      id: selectedDevice.id,
      payload: {
        topic: topicOverride.trim() || undefined,
        rotationSec,
        brightness,
        pages: parsePages(pagesText),
      },
    });
  };

  return (
    <div className="min-h-screen space-y-6 bg-linear-to-b from-slate-50 to-gray-50/80 p-6 md:p-8">
      <header className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/devices">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">OLED Hardware Command</h1>
            <p className="text-xs text-gray-500">Update ESP32 OLED pages and rotation using MQTT command topic.</p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader><CardTitle>OLED Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <select
              value={selectedDevice?.id || ""}
              onChange={(e) => setDeviceId(e.target.value)}
              className="rounded border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name} ({device.id})
                </option>
              ))}
            </select>

            <input
              value={topicOverride}
              onChange={(e) => setTopicOverride(e.target.value)}
              placeholder={defaultTopic || "topic override (optional)"}
              className="rounded border border-gray-200 px-3 py-2 text-sm font-mono"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="number"
              min={1}
              max={60}
              value={rotationSec}
              onChange={(e) => setRotationSec(Number(e.target.value || 3))}
              className="rounded border border-gray-200 px-3 py-2 text-sm"
              placeholder="rotationSec"
            />
            <input
              type="number"
              min={0}
              max={255}
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value || 255))}
              className="rounded border border-gray-200 px-3 py-2 text-sm"
              placeholder="brightness"
            />
          </div>

          <textarea
            value={pagesText}
            onChange={(e) => setPagesText(e.target.value)}
            rows={6}
            className="w-full rounded border border-gray-200 px-3 py-2 text-xs font-mono"
            placeholder="One page per line, fields comma-separated"
          />

          <div className="rounded border border-gray-200 bg-gray-50 p-3">
            <p className="mb-1 text-xs font-medium text-gray-600">Payload Preview</p>
            <pre className="overflow-auto text-[11px] text-gray-700">{JSON.stringify(payloadPreview, null, 2)}</pre>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={sendCommand} disabled={oledMutation.isPending || !selectedDevice}>
              {oledMutation.isPending ? "Sending..." : "Send OLED Command"}
            </Button>
            {oledMutation.isSuccess ? (
              <span className="text-xs text-emerald-600">Command sent.</span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OledCommandPage() {
  return (
    <Suspense fallback={<div className="min-h-screen p-6">Loading...</div>}>
      <OledCommandPageContent />
    </Suspense>
  );
}
