"use client";

import { useMemo, useState } from "react";
import { DeviceSensor } from "@/types";
import { Button } from "@/components/ui/button";

type TopicWidgetCardProps = {
  deviceName: string;
  zoneId: string;
  sensor: DeviceSensor;
  value?: number;
  status?: "online" | "offline" | "error" | "maintenance";
  history?: number[];
  onRemove?: () => void;
  onQuickAction?: (mode: "on" | "off" | "toggle") => void;
};

const VIS_OPTIONS: Array<NonNullable<DeviceSensor["widget"]>> = [
  "gauge",
  "number",
  "graph",
  "line",
  "sparkline",
  "status",
  "led",
  "button",
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizePercent(sensorType: string, value?: number) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  if (sensorType === "co2") return clamp((value / 2000) * 100, 0, 100);
  if (sensorType === "light") return clamp((value / 1500) * 100, 0, 100);
  return clamp(value, 0, 100);
}

export function TopicWidgetCard({
  deviceName,
  zoneId,
  sensor,
  value,
  status,
  history = [],
  onRemove,
  onQuickAction,
}: TopicWidgetCardProps) {
  const [widget, setWidget] = useState<NonNullable<DeviceSensor["widget"]>>(
    sensor.widget || "gauge",
  );

  const usableHistory = useMemo(() => {
    if (history.length > 0) return history.slice(-20);
    if (typeof value === "number") {
      return Array.from({ length: 12 }, (_v, index) =>
        clamp(value + Math.sin(index / 2) * 4, 0, Math.max(100, value + 10)),
      );
    }
    return [];
  }, [history, value]);

  const displayValue = typeof value === "number" ? value.toFixed(1) : "--";
  const unit = sensor.unit || "";
  const percent = normalizePercent(sensor.sensorType, value);
  const ledOn = status === "online" || (typeof value === "number" && value > 0);
  const widgetKind =
    sensor.widgetKind ||
    (sensor.widget === "button" || sensor.widget === "led" ? "action" : "data");

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
            {sensor.label}
          </p>
          <p className="text-[11px] text-gray-500 dark:text-slate-400">
            {deviceName} · {zoneId}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-slate-500">
            {widgetKind} widget
          </p>
        </div>
        <div className="flex items-center gap-1">
          <select
            value={widget}
            onChange={(e) =>
              setWidget(e.target.value as NonNullable<DeviceSensor["widget"]>)
            }
            className="rounded border border-gray-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {VIS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {onRemove ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              onClick={onRemove}
            >
              Remove
            </Button>
          ) : null}
        </div>
      </div>

      {(widget === "number" || widget === "status") && (
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-center dark:border-slate-700 dark:bg-slate-800/60">
          <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
            {displayValue}
            {unit}
          </p>
          <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
            {sensor.sensorType}
          </p>
        </div>
      )}

      {widget === "gauge" && (
        <div className="space-y-2">
          <div className="h-2.5 overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 dark:text-slate-300">
            {displayValue}
            {unit} ({percent.toFixed(0)}%)
          </p>
        </div>
      )}

      {(widget === "line" || widget === "graph" || widget === "sparkline") && (
        <div className="space-y-2">
          <div className="flex h-14 items-end gap-1 rounded bg-gray-50 p-2 dark:bg-slate-800/60">
            {usableHistory.length > 0 ? (
              usableHistory.map((point, index) => {
                const max = Math.max(...usableHistory, 1);
                const height = clamp((point / max) * 100, 8, 100);
                return (
                  <div
                    key={`${sensor.key}-${index}`}
                    className="w-1.5 rounded-sm bg-sky-500"
                    style={{ height: `${height}%` }}
                  />
                );
              })
            ) : (
              <p className="text-[11px] text-gray-500 dark:text-slate-400">
                No history yet
              </p>
            )}
          </div>
          <p className="text-xs text-gray-600 dark:text-slate-300">
            Latest: {displayValue}
            {unit}
          </p>
        </div>
      )}

      {widget === "led" && (
        <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
          <span
            className={`h-3 w-3 rounded-full ${ledOn ? "bg-green-500" : "bg-gray-400"}`}
          />
          <span className="text-xs text-gray-700 dark:text-slate-200">
            {ledOn ? "ON" : "OFF"}
          </span>
        </div>
      )}

      {widget === "button" && (
        <div className="space-y-2">
          <Button
            size="sm"
            className="w-full"
            variant="outline"
            onClick={() =>
              widgetKind === "action" ? onQuickAction?.("toggle") : undefined
            }
          >
            Trigger Topic
          </Button>
          <p className="text-[11px] text-gray-500 dark:text-slate-400">
            Use quick action to trigger this topic behavior.
          </p>
        </div>
      )}

      {onQuickAction && widgetKind === "action" ? (
        <div className="mt-2 grid grid-cols-3 gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-[11px]"
            onClick={() => onQuickAction("on")}
          >
            ON
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-[11px]"
            onClick={() => onQuickAction("off")}
          >
            OFF
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-[11px]"
            onClick={() => onQuickAction("toggle")}
          >
            TOGGLE
          </Button>
        </div>
      ) : null}

      <p className="mt-2 truncate font-mono text-[10px] text-gray-500 dark:text-slate-400">
        {sensor.mqttTopic}
      </p>
    </div>
  );
}
