"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import {
  MockDevice,
  generateInitialDevices,
  generateRandomDevice,
  updateDeviceTelemetry,
} from "../../../lib/mock-data";
import { RefreshCw, AlertTriangle, Plus, Activity } from "lucide-react";

// Dynamically import the map component with ssr: false
const MockMap = dynamic(() => import("@/components/MockMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100 min-h-[400px]">
      Loading Map...
    </div>
  ),
});

export default function MockPage() {
  const [devices, setDevices] = useState<MockDevice[]>(() =>
    generateInitialDevices(5),
  );
  const [lastUpdated, setLastUpdated] = useState<string>(() =>
    new Date().toLocaleTimeString(),
  );

  const handleRandomize = () => {
    const updated = devices.map((d) => updateDeviceTelemetry(d));
    setDevices(updated);
    setLastUpdated(new Date().toLocaleTimeString());
  };

  const handleTriggerAlert = () => {
    if (devices.length === 0) return;
    const randomIndex = Math.floor(Math.random() * devices.length);
    const newDevices = [...devices];
    // Toggle relevant status
    const isCritical = newDevices[randomIndex].status === "critical";

    newDevices[randomIndex] = {
      ...newDevices[randomIndex],
      status: isCritical ? "normal" : "critical",
      telemetry: {
        ...newDevices[randomIndex].telemetry,
        temperature: isCritical ? 22.0 : 95.0,
      },
    };
    setDevices(newDevices);
  };

  const handleAddDevice = () => {
    const newDevice = generateRandomDevice(devices.length);
    setDevices([...devices, newDevice]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-8 h-8 text-blue-600" />
          Device Simulator
        </h1>
        <p className="text-gray-500">
          Manage mock telemetry and device states for testing the frontend.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
        {/* Left Column: Control Panel & Telemetry List */}
        <div className="lg:col-span-1 flex flex-col gap-6 overflow-hidden max-h-screen">
          {/* Controls */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 shrink-0">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Control Panel
            </h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleRandomize}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Randomize Values
              </button>

              <button
                onClick={handleTriggerAlert}
                className="w-full flex items-center justify-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium py-2 px-4 rounded border border-amber-200 transition-colors"
              >
                <AlertTriangle className="w-4 h-4" /> Trigger Alert (Random)
              </button>

              <button
                onClick={handleAddDevice}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded border border-gray-300 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Device
              </button>
            </div>
            <div className="mt-4 text-xs text-center text-gray-400">
              Last Updated: {lastUpdated}
            </div>
          </div>

          {/* Device List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h2 className="font-semibold text-gray-800">
                Telemetry Stream ({devices.length})
              </h2>
            </div>
            <div className="overflow-y-auto p-2">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 bg-white sticky top-0">
                  <tr>
                    <th className="px-3 py-2">Device</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Temp</th>
                    <th className="px-3 py-2 text-right">Bat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {devices.map((device) => (
                    <tr
                      key={device.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-3 py-3 font-medium text-gray-900">
                        {device.name}
                        <div className="text-[10px] text-gray-400 font-mono">
                          {device.type}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            device.status === "critical"
                              ? "bg-red-100 text-red-800"
                              : device.status === "warning"
                                ? "bg-yellow-100 text-yellow-800"
                                : device.status === "offline"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-green-100 text-green-800"
                          }`}
                        >
                          {device.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-gray-600 font-mono">
                        {device.telemetry.temperature.toFixed(1)}°
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums text-gray-600 font-mono">
                        {device.telemetry.battery}%
                      </td>
                    </tr>
                  ))}
                  {devices.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center py-8 text-gray-400"
                      >
                        No devices active
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Map */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative flex flex-col">
          <div className="flex-1 min-h-[500px]">
            <MockMap devices={devices} />
          </div>
        </div>
      </div>
    </div>
  );
}
