"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Device,
  DeviceActuatorOutput,
  DeviceSensor,
  DeviceStatus,
  SensorType,
} from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Cpu, Search, ShieldAlert, Wrench } from "lucide-react";
import {
  useCreateDevice,
  useDevices,
  usePingDeviceSensorTopic,
  useTriggerActuator,
  useTriggerActuatorOutput,
  useUpdateDevice,
  useUpdateDevicePrimarySensor,
  useZones,
  useDeleteDevice,
} from "@/hooks/use-dashboard-data";

const statusStyles: Record<DeviceStatus, string> = {
  online: "bg-green-50 text-green-700 border-green-200",
  offline: "bg-gray-100 text-gray-700 border-gray-200",
  error: "bg-red-50 text-red-700 border-red-200",
  maintenance: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function DeviceManagementPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-gray-50/50 p-6 md:p-8" />}
    >
      <DeviceManagementPageContent />
    </Suspense>
  );
}

function DeviceManagementPageContent() {
  const searchParams = useSearchParams();
  const { data: devices = [], isLoading } = useDevices();
  const { data: zones = [] } = useZones();
  const createDeviceMutation = useCreateDevice();
  const updatePrimarySensorMutation = useUpdateDevicePrimarySensor();
  const updateDeviceMutation = useUpdateDevice();
  const pingTopicMutation = usePingDeviceSensorTopic();
  const triggerActuatorMutation = useTriggerActuator();
  const triggerActuatorOutputMutation = useTriggerActuatorOutput();
  const deleteDeviceMutation = useDeleteDevice();

  const requestedZoneId = searchParams.get("zone");
  const requestedConfigureId = searchParams.get("configure");
  const lastHandledConfigureIdRef = useRef<string | null>(null);
  const configImportInputRef = useRef<HTMLInputElement | null>(null);

  const [zoneFilter, setZoneFilter] = useState<string>(
    requestedZoneId || "all",
  );
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [configOpen, setConfigOpen] = useState(false);
  const [configDeviceId, setConfigDeviceId] = useState<string | null>(null);
  const [configDraft, setConfigDraft] = useState<{
    name: string;
    type: Device["type"];
    siteId: string;
    primarySensorKey: string;
    sensors: DeviceSensor[];
    actuatorOutputs: DeviceActuatorOutput[];
  }>({
    name: "",
    type: "sensor",
    siteId: "",
    primarySensorKey: "",
    sensors: [],
    actuatorOutputs: [],
  });
  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchZone = zoneFilter === "all" || device.zoneId === zoneFilter;
      const matchStatus =
        statusFilter === "all" || device.status === statusFilter;
      const matchQuery =
        query.trim().length === 0 ||
        device.name.toLowerCase().includes(query.toLowerCase()) ||
        device.subType.toLowerCase().includes(query.toLowerCase()) ||
        device.id.toLowerCase().includes(query.toLowerCase());

      return matchZone && matchStatus && matchQuery;
    });
  }, [devices, zoneFilter, statusFilter, query]);

  const onlineCount = devices.filter((d) => d.status === "online").length;
  const errorCount = devices.filter((d) => d.status === "error").length;
  const maintenanceCount = devices.filter(
    (d) => d.status === "maintenance",
  ).length;
  const offlineCount = devices.filter((d) => d.status === "offline").length;

  const sensorTypeOptions: SensorType[] = [
    "temperature",
    "humidity",
    "co2",
    "light",
    "soil_moisture",
    "barometer",
    "mmwave_presence",
    "vpd",
    "custom",
  ];

  const deviceTypeOptions: Device["type"][] = [
    "sensor",
    "actuator",
    "hybrid",
    "combined",
    "camera",
    "controller",
  ];

  const actionWidgetOptions: Array<NonNullable<DeviceSensor["widget"]>> = [
    "button",
    "led",
    "status",
  ];
  const actuatorTypeOptions: Array<NonNullable<DeviceSensor["actuatorType"]>> =
    ["fan", "led_pwm", "fan_pwm", "relay", "custom"];
  const dataWidgetOptions: Array<NonNullable<DeviceSensor["widget"]>> = [
    "gauge",
    "graph",
    "line",
    "sparkline",
    "number",
    "status",
  ];

  const deriveWidgetKind = (sensor: Partial<DeviceSensor>) => {
    if (sensor.widgetKind === "action" || sensor.widgetKind === "data") {
      return sensor.widgetKind;
    }
    return sensor.widget === "button" || sensor.widget === "led"
      ? "action"
      : "data";
  };

  const defaultWidgetByKind = (widgetKind: DeviceSensor["widgetKind"]) =>
    widgetKind === "action" ? "button" : "gauge";

  const widgetOptionsForKind = (widgetKind: DeviceSensor["widgetKind"]) =>
    widgetKind === "action" ? actionWidgetOptions : dataWidgetOptions;

  const supportsPrimarySensor = (deviceType: Device["type"]) =>
    deviceType === "sensor" ||
    deviceType === "hybrid" ||
    deviceType === "combined";

  const normalizeTopicSegment = (value: string) => {
    const normalized = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    return normalized || "sensor";
  };

  const buildSuggestedTopic = (
    sensor: Partial<DeviceSensor>,
    siteId: string,
    fallbackKey: string,
  ) => {
    const zoneToken = normalizeTopicSegment(siteId || "default");
    const sensorToken = normalizeTopicSegment(
      sensor.sensorType && sensor.sensorType !== "custom"
        ? sensor.sensorType
        : sensor.key || fallbackKey,
    );
    const nodeToken = normalizeTopicSegment(
      configDeviceId || fallbackKey || `s${Date.now()}`,
    );
    return `gh/${zoneToken}/${sensorToken}/${nodeToken}`;
  };

  const openConfigModal = (device: Device) => {
    setConfigDeviceId(device.id);
    const sensors = (device.sensors || []).map((sensor, index) => ({
      key: sensor.key || `sensor_${index + 1}`,
      label: sensor.label || `Sensor ${index + 1}`,
      sensorType: (sensor.sensorType || "custom") as SensorType,
      unit: sensor.unit || "",
      mqttTopic: sensor.mqttTopic || "",
      commandTopic: sensor.commandTopic || sensor.mqttTopic || "",
      actuatorType: sensor.actuatorType || "custom",
      actuatorConfig: {
        min: sensor.actuatorConfig?.min ?? 0,
        max: sensor.actuatorConfig?.max ?? 100,
        step: sensor.actuatorConfig?.step ?? 1,
        defaultValue: sensor.actuatorConfig?.defaultValue ?? 0,
      },
      widget: sensor.widget || "gauge",
      widgetKind: deriveWidgetKind(sensor),
      isPrimary: Boolean(sensor.isPrimary),
    }));

    setConfigDraft({
      name: device.name,
      type: device.type,
      siteId: device.zoneId,
      primarySensorKey:
        device.primarySensorKey ||
        sensors.find((sensor) => sensor.isPrimary)?.key ||
        sensors[0]?.key ||
        "",
      sensors: sensors.map((sensor, index) => ({
        ...sensor,
        mqttTopic:
          sensor.mqttTopic ||
          buildSuggestedTopic(
            sensor,
            device.zoneId,
            sensor.key || `sensor_${index + 1}`,
          ),
      })),
      actuatorOutputs: (device.actuatorOutputs || []).map((output, index) => ({
        key: output.key || `output_${index + 1}`,
        label: output.label || `Output ${index + 1}`,
        outputType: output.outputType || "custom",
        commandTopic: output.commandTopic || "",
        unit: output.unit || "",
        min: output.min ?? 0,
        max: output.max ?? 100,
        step: output.step ?? 1,
        defaultValue: output.defaultValue ?? 0,
        linkedSensorKey: output.linkedSensorKey || "",
        enabled: output.enabled !== false,
      })),
    });
    setConfigOpen(true);
  };

  const closeConfigModal = () => {
    setConfigOpen(false);
    setConfigDeviceId(null);
  };

  useEffect(() => {
    if (lastHandledConfigureIdRef.current === requestedConfigureId) return;
    lastHandledConfigureIdRef.current = requestedConfigureId;

    if (!requestedConfigureId) {
      return;
    }

    if (devices.length === 0) return;

    const targetDevice = devices.find(
      (device) => device.id === requestedConfigureId,
    );
    if (targetDevice) {
      setTimeout(() => {
        openConfigModal(targetDevice);
      }, 0);
    }
  }, [devices, requestedConfigureId]);

  const updateSensorRow = (index: number, patch: Partial<DeviceSensor>) => {
    setConfigDraft((prev) => {
      const sensors = [...prev.sensors];
      const current = sensors[index];
      const merged = { ...current, ...patch } as DeviceSensor;

      const patchTouchesTopic = Object.prototype.hasOwnProperty.call(
        patch,
        "mqttTopic",
      );
      const shouldAutofillTopic =
        !patchTouchesTopic && !(current?.mqttTopic || "").trim();

      if (shouldAutofillTopic) {
        merged.mqttTopic = buildSuggestedTopic(
          merged,
          prev.siteId,
          merged.key || `sensor_${index + 1}`,
        );
      }

      sensors[index] = merged;
      return { ...prev, sensors };
    });
  };

  const suggestSensorTopic = (index: number) => {
    setConfigDraft((prev) => {
      const sensors = [...prev.sensors];
      const sensor = sensors[index];
      if (!sensor) return prev;
      sensors[index] = {
        ...sensor,
        mqttTopic: buildSuggestedTopic(
          sensor,
          prev.siteId,
          sensor.key || `sensor_${index + 1}`,
        ),
      };
      return { ...prev, sensors };
    });
  };

  const addSensorRow = () => {
    setConfigDraft((prev) => {
      const nextIndex = prev.sensors.length + 1;
      const nextKey = `sensor_${nextIndex}`;
      return {
        ...prev,
        sensors: [
          ...prev.sensors,
          {
            key: nextKey,
            label: `Sensor ${nextIndex}`,
            sensorType: "custom",
            unit: "",
            mqttTopic: buildSuggestedTopic(
              { key: nextKey, sensorType: "custom" },
              prev.siteId,
              nextKey,
            ),
            commandTopic: "",
            actuatorType: "custom",
            actuatorConfig: {
              min: 0,
              max: 100,
              step: 1,
              defaultValue: 0,
            },
            widget: "gauge",
            widgetKind: "data",
            isPrimary: false,
          },
        ],
        primarySensorKey: prev.primarySensorKey || nextKey,
      };
    });
  };

  const removeSensorRow = (index: number) => {
    setConfigDraft((prev) => {
      const removed = prev.sensors[index];
      const sensors = prev.sensors.filter((_, idx) => idx !== index);
      const nextPrimary =
        prev.primarySensorKey === removed?.key
          ? sensors[0]?.key || ""
          : prev.primarySensorKey;
      return { ...prev, sensors, primarySensorKey: nextPrimary };
    });
  };

  const saveDeviceConfig = () => {
    if (!configDeviceId) return;
    const canUsePrimary = supportsPrimarySensor(configDraft.type);
    const sanitizedSensors = configDraft.sensors
      .filter((sensor) => sensor.mqttTopic.trim())
      .map((sensor) => ({
        ...sensor,
        key: sensor.key.trim(),
        label: sensor.label.trim() || sensor.key.trim(),
        mqttTopic: sensor.mqttTopic.trim(),
        commandTopic: String(
          sensor.commandTopic || sensor.mqttTopic || "",
        ).trim(),
        actuatorType: sensor.actuatorType || "custom",
        actuatorConfig: {
          min: Number(sensor.actuatorConfig?.min ?? 0),
          max: Number(sensor.actuatorConfig?.max ?? 100),
          step: Number(sensor.actuatorConfig?.step ?? 1),
          defaultValue: Number(sensor.actuatorConfig?.defaultValue ?? 0),
        },
        widgetKind: deriveWidgetKind(sensor),
        isPrimary: canUsePrimary
          ? sensor.key.trim() === configDraft.primarySensorKey
          : false,
      }));

    const sanitizedOutputs = (configDraft.actuatorOutputs || [])
      .filter((output) => output.commandTopic.trim())
      .map((output, index) => ({
        key: String(output.key || `output_${index + 1}`).trim(),
        label: String(
          output.label || output.key || `Output ${index + 1}`,
        ).trim(),
        outputType: output.outputType || "custom",
        commandTopic: String(output.commandTopic || "").trim(),
        unit: String(output.unit || "").trim(),
        min: Number(output.min ?? 0),
        max: Number(output.max ?? 100),
        step: Number(output.step ?? 1),
        defaultValue: Number(output.defaultValue ?? 0),
        linkedSensorKey: String(output.linkedSensorKey || "").trim(),
        enabled: output.enabled !== false,
      }));

    const sensorsRequired =
      configDraft.type !== "actuator" && configDraft.type !== "controller";
    if (sensorsRequired && sanitizedSensors.length === 0) return;

    if (
      (configDraft.type === "actuator" ||
        configDraft.type === "hybrid" ||
        configDraft.type === "combined") &&
      sanitizedOutputs.length === 0
    ) {
      return;
    }

    updateDeviceMutation.mutate(
      {
        id: configDeviceId,
        payload: {
          name: configDraft.name.trim(),
          type: configDraft.type,
          siteId: configDraft.siteId,
          primarySensorKey: canUsePrimary
            ? configDraft.primarySensorKey
            : undefined,
          sensors: sanitizedSensors,
          actuatorOutputs: sanitizedOutputs,
        },
      },
      {
        onSuccess: () => {
          closeConfigModal();
        },
      },
    );
  };

  const downloadTextFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadJsonFile = (filename: string, payload: unknown) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const buildTopicListText = () => {
    const title = `Device: ${configDraft.name || configDeviceId || "unknown"}`;
    const zone = `Zone: ${configDraft.siteId || "unknown"}`;
    const lines = configDraft.sensors.map(
      (sensor) =>
        `${sensor.label || sensor.key}\t${sensor.sensorType}\t${sensor.mqttTopic}`,
    );
    return [title, zone, "", "Label\tSensorType\tMQTT Topic", ...lines].join(
      "\n",
    );
  };

  const toCIdentifier = (value: string) => {
    const normalized = value
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    return normalized || "SENSOR";
  };

  const buildEsp32PubSubClientCode = () => {
    const sensors = configDraft.sensors.filter((sensor) =>
      sensor.mqttTopic.trim(),
    );
    const safeDeviceToken =
      (configDeviceId || configDraft.name || "device")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || "device";

    const topicDefines = sensors
      .map(
        (sensor) =>
          `const char* TOPIC_${toCIdentifier(sensor.key || sensor.label || "sensor")} = "${sensor.mqttTopic}";`,
      )
      .join("\n");

    const publishWrappers = sensors
      .map((sensor) => {
        const fn = toCIdentifier(
          sensor.key || sensor.label || "sensor",
        ).toLowerCase();
        const topicConst = `TOPIC_${toCIdentifier(sensor.key || sensor.label || "sensor")}`;
        const sensorType = sensor.sensorType || "custom";
        const unit = sensor.unit || "";
        return `bool publish_${fn}(PubSubClient &client, float value) {
  return publishTelemetry(client, ${topicConst}, "${configDraft.siteId}", "${configDraft.siteId}", "${safeDeviceToken}", "${sensorType}", value, "${unit}", 100);
}`;
      })
      .join("\n\n");

    return `// Auto-generated from Device Configuration UI
// Device: ${configDraft.name || configDeviceId || "unknown"}
// Zone: ${configDraft.siteId || "unknown"}
// Topic Format: gh/{zone}/{sensor}/{node}

#include <WiFi.h>
#include <PubSubClient.h>

${topicDefines}

bool publishTelemetry(
  PubSubClient &client,
  const char* topic,
  const char* siteId,
  const char* zoneId,
  const char* nodeId,
  const char* sensorType,
  float value,
  const char* unit,
  int quality
) {
  char payload[256];
  unsigned long nowSec = millis() / 1000;

  snprintf(
    payload,
    sizeof(payload),
    "{\\\"siteId\\\":\\\"%s\\\",\\\"zoneId\\\":\\\"%s\\\",\\\"nodeId\\\":\\\"%s\\\",\\\"sensorType\\\":\\\"%s\\\",\\\"value\\\":%.2f,\\\"unit\\\":\\\"%s\\\",\\\"quality\\\":%d,\\\"timestamp\\\":%lu}",
    siteId,
    zoneId,
    nodeId,
    sensorType,
    value,
    unit,
    quality,
    nowSec
  );

  return client.publish(topic, payload);
}

${publishWrappers}

// Example usage:
// publish_${toCIdentifier(sensors[0]?.key || "sensor").toLowerCase()}(mqttClient, 28.5f);
`;
  };

  const exportDeviceConfig = () => {
    if (!configDeviceId) return;
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      deviceId: configDeviceId,
      config: {
        name: configDraft.name,
        type: configDraft.type,
        siteId: configDraft.siteId,
        primarySensorKey: configDraft.primarySensorKey,
        sensors: configDraft.sensors,
      },
    };
    downloadJsonFile(`device-config-${configDeviceId}.json`, payload);
  };

  const exportTopicListText = () => {
    const deviceToken = configDeviceId || "device";
    downloadTextFile(`sensor-topics-${deviceToken}.txt`, buildTopicListText());
  };

  const exportEsp32PubSubClientCode = () => {
    const deviceToken = configDeviceId || "device";
    downloadTextFile(
      `esp32-pubsubclient-${deviceToken}.ino`,
      buildEsp32PubSubClientCode(),
    );
  };

  const copyTopicListText = async () => {
    const text = buildTopicListText();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      downloadTextFile("sensor-topics.txt", text);
    }
  };

  const importDeviceConfigFromFile = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = JSON.parse(String(reader.result || "{}")) as {
          config?: {
            name?: string;
            type?: Device["type"];
            siteId?: string;
            primarySensorKey?: string;
            sensors?: DeviceSensor[];
          };
        };
        const imported = raw.config;
        if (!imported) return;

        const sensors = Array.isArray(imported.sensors)
          ? imported.sensors.map((sensor, index) => ({
              key: String(sensor.key || `sensor_${index + 1}`),
              label: String(sensor.label || `Sensor ${index + 1}`),
              sensorType: (sensor.sensorType || "custom") as SensorType,
              unit: sensor.unit || "",
              mqttTopic: String(sensor.mqttTopic || ""),
              widget: sensor.widget || "gauge",
              widgetKind:
                sensor.widgetKind === "action" || sensor.widgetKind === "data"
                  ? sensor.widgetKind
                  : sensor.widget === "button" || sensor.widget === "led"
                    ? "action"
                    : "data",
              isPrimary: Boolean(sensor.isPrimary),
            }))
          : [];

        setConfigDraft((prev) => ({
          ...prev,
          name: imported.name ?? prev.name,
          type: imported.type ?? prev.type,
          siteId: imported.siteId ?? prev.siteId,
          primarySensorKey:
            imported.primarySensorKey ||
            sensors.find((sensor) => sensor.isPrimary)?.key ||
            sensors[0]?.key ||
            prev.primarySensorKey,
          sensors: sensors.length > 0 ? sensors : prev.sensors,
        }));
      } catch {
        // ignore invalid file
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const addDevice = () => {
    const targetZone =
      zoneFilter === "all"
        ? zones[0]?.id
        : zones.some((zone) => zone.id === zoneFilter)
          ? zoneFilter
          : zones[0]?.id;
    if (!targetZone) return;
    const stamp = Date.now();
    const makeDeviceId = () =>
      `dev-${stamp}-${Math.random().toString(36).slice(2, 8)}`;

    const payload: {
      deviceId: string;
      name: string;
      type: Device["type"];
      siteId: string;
      primarySensorKey: string;
      sensors: DeviceSensor[];
    } = {
      deviceId: makeDeviceId(),
      name: `New Device ${new Date().toLocaleTimeString()}`,
      type: "sensor",
      siteId: targetZone,
      primarySensorKey: "humidity",
      sensors: [
        {
          key: "humidity",
          label: "Humidity",
          sensorType: "humidity",
          unit: "%",
          mqttTopic: `gh/${targetZone}/humidity/${stamp}`,
          widget: "gauge",
          widgetKind: "data",
          isPrimary: true,
        },
        {
          key: "co2",
          label: "CO2",
          sensorType: "co2",
          unit: "ppm",
          mqttTopic: `gh/${targetZone}/co2/${stamp}`,
          widget: "line",
          widgetKind: "data",
        },
        {
          key: "light",
          label: "Light",
          sensorType: "light",
          unit: "lux",
          mqttTopic: `gh/${targetZone}/light/${stamp}`,
          widget: "line",
          widgetKind: "data",
        },
        {
          key: "soil_moisture",
          label: "Soil Moisture",
          sensorType: "soil_moisture",
          unit: "%",
          mqttTopic: `gh/${targetZone}/soil_moisture/${stamp}`,
          widget: "gauge",
          widgetKind: "data",
        },
        {
          key: "barometer",
          label: "Barometer",
          sensorType: "barometer",
          unit: "hPa",
          mqttTopic: `gh/${targetZone}/barometer/${stamp}`,
          widget: "number",
          widgetKind: "data",
        },
        {
          key: "mmwave_presence",
          label: "mmWave Presence",
          sensorType: "mmwave_presence",
          unit: "state",
          mqttTopic: `gh/${targetZone}/mmwave/${stamp}`,
          widget: "status",
          widgetKind: "action",
        },
      ],
    };

    createDeviceMutation.mutate(payload, {
      onError: (error: unknown) => {
        const status = (error as { response?: { status?: number } })?.response
          ?.status;
        if (status === 409) {
          createDeviceMutation.mutate({
            ...payload,
            deviceId: makeDeviceId(),
          });
        }
      },
    });
  };

  const addActuatorNode = () => {
    const targetZone =
      zoneFilter === "all"
        ? zones[0]?.id
        : zones.some((zone) => zone.id === zoneFilter)
          ? zoneFilter
          : zones[0]?.id;
    if (!targetZone) return;
    const stamp = Date.now();
    const deviceId = `act-${stamp}-${Math.random().toString(36).slice(2, 8)}`;

    createDeviceMutation.mutate({
      deviceId,
      name: `Actuator Node ${new Date().toLocaleTimeString()}`,
      type: "actuator",
      siteId: targetZone,
      sensors: [],
      actuatorOutputs: [
        {
          key: "fan_pwm_main",
          label: "Main Fan PWM",
          outputType: "fan_pwm",
          commandTopic: `greenhouse/${targetZone}/command/fan_pwm/${deviceId}`,
          unit: "%",
          min: 0,
          max: 100,
          step: 1,
          defaultValue: 60,
          enabled: true,
        },
        {
          key: "led_pwm_main",
          label: "Main LED PWM",
          outputType: "led_pwm",
          commandTopic: `greenhouse/${targetZone}/command/led_pwm/${deviceId}`,
          unit: "%",
          min: 0,
          max: 100,
          step: 1,
          defaultValue: 70,
          enabled: true,
        },
      ],
    });
  };

  const addOutputRow = () => {
    setConfigDraft((prev) => {
      const nextIndex = prev.actuatorOutputs.length + 1;
      const nextKey = `output_${nextIndex}`;
      return {
        ...prev,
        actuatorOutputs: [
          ...prev.actuatorOutputs,
          {
            key: nextKey,
            label: `Output ${nextIndex}`,
            outputType: "custom",
            commandTopic: `greenhouse/${prev.siteId || "default"}/command/custom/${configDeviceId || "device"}/${nextKey}`,
            unit: "%",
            min: 0,
            max: 100,
            step: 1,
            defaultValue: 50,
            linkedSensorKey: "",
            enabled: true,
          },
        ],
      };
    });
  };

  const updateOutputRow = (
    index: number,
    patch: Partial<DeviceActuatorOutput>,
  ) => {
    setConfigDraft((prev) => {
      const outputs = [...prev.actuatorOutputs];
      const current = outputs[index];
      if (!current) return prev;
      outputs[index] = { ...current, ...patch };
      return { ...prev, actuatorOutputs: outputs };
    });
  };

  const removeOutputRow = (index: number) => {
    setConfigDraft((prev) => ({
      ...prev,
      actuatorOutputs: prev.actuatorOutputs.filter((_, idx) => idx !== index),
    }));
  };

  return (
    <div className="min-h-screen space-y-6 bg-linear-to-b from-slate-50 to-gray-50/80 p-6 md:p-8 dark:from-slate-950 dark:to-slate-900">
      <header className="flex flex-col gap-4 rounded-2xl border border-gray-200/70 bg-white/90 p-5 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between dark:border-slate-700/80 dark:bg-slate-900/90">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">
              Device Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor and control sensors and actuators across all zones
              {isLoading ? " (loading...)" : ""}.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                {onlineCount} online
              </span>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
                {maintenanceCount} maintenance
              </span>
              <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 font-medium text-red-700">
                {errorCount} error
              </span>
              <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 font-medium text-gray-600">
                {offlineCount} offline
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={addActuatorNode}
            disabled={createDeviceMutation.isPending || zones.length === 0}
          >
            Add Actuator Node
          </Button>
          <Button
            onClick={addDevice}
            disabled={createDeviceMutation.isPending || zones.length === 0}
          >
            Add Device
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-xl border-emerald-200/70 bg-linear-to-br from-emerald-50/70 to-white shadow-sm dark:border-emerald-900/70 dark:from-emerald-950/35 dark:to-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Online
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-bold">{onlineCount}</p>
            <Cpu className="h-5 w-5 text-green-600" />
          </CardContent>
        </Card>
        <Card className="rounded-xl border-amber-200/70 bg-linear-to-br from-amber-50/70 to-white shadow-sm dark:border-amber-900/70 dark:from-amber-950/35 dark:to-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-bold">{maintenanceCount}</p>
            <Wrench className="h-5 w-5 text-amber-600" />
          </CardContent>
        </Card>
        <Card className="rounded-xl border-red-200/70 bg-linear-to-br from-red-50/70 to-white shadow-sm dark:border-red-900/70 dark:from-red-950/35 dark:to-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Error
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-2xl font-bold">{errorCount}</p>
            <ShieldAlert className="h-5 w-5 text-red-600" />
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl border-gray-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <CardHeader className="gap-4">
          <CardTitle className="text-lg text-gray-900 dark:text-slate-100">
            Inventory
          </CardTitle>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, type, or id"
                className="w-full rounded-md border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none ring-offset-white transition-colors focus:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:ring-offset-slate-900"
              />
            </div>

            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="all">All zones</option>
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as DeviceStatus | "all")
              }
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="all">All statuses</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="maintenance">Maintenance</option>
              <option value="error">Error</option>
            </select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700">
            <table className="w-full text-sm text-left bg-white dark:bg-slate-900">
              <thead className="bg-gray-50 border-b text-gray-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <tr>
                  <th className="p-3 font-medium">Device</th>
                  <th className="p-3 font-medium">Type</th>
                  <th className="p-3 font-medium">Zone</th>
                  <th className="p-3 font-medium">Primary Sensor</th>
                  <th className="p-3 font-medium">Sensor Topics</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Last Seen</th>
                  <th className="p-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredDevices.length > 0 ? (
                  filteredDevices.map((device) => {
                    const zone = zones.find((z) => z.id === device.zoneId);
                    return (
                      <tr
                        key={device.id}
                        className="hover:bg-gray-50 dark:hover:bg-slate-800/70"
                      >
                        <td className="p-3">
                          <p className="font-medium text-gray-900 dark:text-slate-100">
                            {device.name}
                          </p>
                          <p className="text-xs text-gray-500 font-mono dark:text-slate-400">
                            {device.id}
                          </p>
                        </td>
                        <td className="p-3">
                          <p className="text-gray-700 capitalize dark:text-slate-200">
                            {device.type}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">
                            {device.subType}
                          </p>
                        </td>
                        <td className="p-3 text-gray-700 dark:text-slate-300">
                          {zone?.name ?? "Unknown"}
                        </td>
                        <td className="p-3">
                          {supportsPrimarySensor(device.type) ? (
                            <select
                              className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                              value={
                                device.primarySensorKey ||
                                device.sensors?.find(
                                  (sensor) => sensor.isPrimary,
                                )?.key ||
                                device.sensors?.[0]?.key ||
                                ""
                              }
                              onChange={(e) =>
                                updatePrimarySensorMutation.mutate({
                                  id: device.id,
                                  sensorKey: e.target.value,
                                })
                              }
                              disabled={
                                updatePrimarySensorMutation.isPending ||
                                !device.sensors ||
                                device.sensors.length === 0
                              }
                            >
                              {(device.sensors || []).map((sensor) => (
                                <option key={sensor.key} value={sensor.key}>
                                  {sensor.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs text-gray-400 dark:text-slate-500">
                              N/A
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="max-w-sm space-y-1">
                            {(device.sensors || [])
                              .slice(0, 2)
                              .map((sensor) => (
                                <p
                                  key={sensor.key}
                                  className="truncate text-[11px] text-gray-500 dark:text-slate-400"
                                >
                                  {sensor.label}: {sensor.mqttTopic}
                                </p>
                              ))}
                            {(device.sensors || []).length > 2 ? (
                              <p className="text-[11px] text-gray-400 dark:text-slate-500">
                                +{(device.sensors || []).length - 2} more topics
                              </p>
                            ) : null}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge
                            variant="outline"
                            className={statusStyles[device.status]}
                          >
                            {device.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-3 text-gray-600 dark:text-slate-400">
                          {device.lastSeen}
                        </td>
                        <td className="p-3 text-right">
                          <div className="inline-flex gap-2">
                            {(device.actuatorOutputs || [])
                              .slice(0, 1)
                              .map((output) => (
                                <div
                                  key={output.key}
                                  className="inline-flex gap-1"
                                >
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8"
                                    onClick={() =>
                                      triggerActuatorOutputMutation.mutate({
                                        id: device.id,
                                        outputKey: output.key,
                                        payload: {
                                          command: "on",
                                          topic: output.commandTopic,
                                          notifyPhone: true,
                                        },
                                      })
                                    }
                                  >
                                    ON
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8"
                                    onClick={() =>
                                      triggerActuatorOutputMutation.mutate({
                                        id: device.id,
                                        outputKey: output.key,
                                        payload: {
                                          command: "off",
                                          topic: output.commandTopic,
                                          notifyPhone: true,
                                        },
                                      })
                                    }
                                  >
                                    OFF
                                  </Button>
                                </div>
                              ))}
                            {(device.sensors || [])
                              .filter(
                                (sensor) =>
                                  sensor.widgetKind === "action" ||
                                  device.type === "actuator" ||
                                  device.type === "hybrid" ||
                                  device.type === "combined",
                              )
                              .slice(0, 1)
                              .map((sensor) => (
                                <div
                                  key={sensor.key}
                                  className="inline-flex gap-1"
                                >
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8"
                                    onClick={() =>
                                      triggerActuatorMutation.mutate({
                                        id: device.id,
                                        sensorKey: sensor.key,
                                        payload: {
                                          command: "on",
                                          notifyPhone: true,
                                        },
                                      })
                                    }
                                  >
                                    ON
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8"
                                    onClick={() =>
                                      triggerActuatorMutation.mutate({
                                        id: device.id,
                                        sensorKey: sensor.key,
                                        payload: {
                                          command: "off",
                                          notifyPhone: true,
                                        },
                                      })
                                    }
                                  >
                                    OFF
                                  </Button>
                                </div>
                              ))}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => openConfigModal(device)}
                            >
                              Configure
                            </Button>
                            <Link
                              href={`/dashboard/devices/oled?device=${encodeURIComponent(device.id)}`}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8"
                              >
                                OLED
                              </Button>
                            </Link>
                            <Link href={`/dashboard/zones/${device.zoneId}`}>
                              <Button variant="ghost" size="sm" className="h-8">
                                Open Zone
                              </Button>
                            </Link>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-8"
                              onClick={() => {
                                if (confirm(`Delete device "${device.name}"?`)) {
                                  deleteDeviceMutation.mutate(device.id);
                                }
                              }}
                              disabled={deleteDeviceMutation.isPending}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-10 text-center text-gray-400 dark:text-slate-500"
                    >
                      No devices match your current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {configOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-xl border bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                  Sensor Topic Configuration
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Add, manage, delete, and ping sensor topics for this device.
                </p>
              </div>
              <Button variant="ghost" onClick={closeConfigModal}>
                Close
              </Button>
            </div>

            <input
              ref={configImportInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={importDeviceConfigFromFile}
            />

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={exportDeviceConfig}>
                Export Config
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => configImportInputRef.current?.click()}
              >
                Import Config
              </Button>
              <Button variant="outline" size="sm" onClick={exportTopicListText}>
                Export Topic List (.txt)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportEsp32PubSubClientCode}
              >
                Export ESP32 PubSubClient Code
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void copyTopicListText()}
              >
                Copy Topic List
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <input
                value={configDraft.name}
                onChange={(e) =>
                  setConfigDraft((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                placeholder="Device name"
              />
              <select
                value={configDraft.type}
                onChange={(e) =>
                  setConfigDraft((prev) => ({
                    ...prev,
                    type: e.target.value as Device["type"],
                  }))
                }
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {deviceTypeOptions.map((deviceType) => (
                  <option key={deviceType} value={deviceType}>
                    {deviceType === "combined"
                      ? "combined (sensor + actuator)"
                      : deviceType}
                  </option>
                ))}
              </select>
              <select
                value={configDraft.siteId}
                onChange={(e) =>
                  setConfigDraft((prev) => ({
                    ...prev,
                    siteId: e.target.value,
                    sensors: prev.sensors.map((sensor, index) => ({
                      ...sensor,
                      mqttTopic:
                        sensor.mqttTopic ||
                        buildSuggestedTopic(
                          sensor,
                          e.target.value,
                          sensor.key || `sensor_${index + 1}`,
                        ),
                    })),
                  }))
                }
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 space-y-3">
              {configDraft.sensors.map((sensor, index) => (
                <div
                  key={`${sensor.key}-${index}`}
                  className="rounded-lg border border-gray-200 p-3"
                >
                  <div className="grid gap-2 md:grid-cols-7">
                    <input
                      value={sensor.key}
                      onChange={(e) =>
                        updateSensorRow(index, { key: e.target.value })
                      }
                      className="rounded-md border border-gray-200 px-2 py-1.5 text-xs"
                      placeholder="key"
                    />
                    <input
                      value={sensor.label}
                      onChange={(e) =>
                        updateSensorRow(index, { label: e.target.value })
                      }
                      className="rounded-md border border-gray-200 px-2 py-1.5 text-xs"
                      placeholder="label"
                    />
                    <select
                      value={sensor.sensorType}
                      onChange={(e) =>
                        updateSensorRow(index, {
                          sensorType: e.target.value as SensorType,
                        })
                      }
                      className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs"
                    >
                      {sensorTypeOptions.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <input
                      value={sensor.unit || ""}
                      onChange={(e) =>
                        updateSensorRow(index, { unit: e.target.value })
                      }
                      className="rounded-md border border-gray-200 px-2 py-1.5 text-xs"
                      placeholder="unit"
                    />
                    <select
                      value={sensor.actuatorType || "custom"}
                      onChange={(e) =>
                        updateSensorRow(index, {
                          actuatorType: e.target
                            .value as DeviceSensor["actuatorType"],
                        })
                      }
                      className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs"
                    >
                      {actuatorTypeOptions.map((actuatorType) => (
                        <option key={actuatorType} value={actuatorType}>
                          {actuatorType}
                        </option>
                      ))}
                    </select>
                    <select
                      value={deriveWidgetKind(sensor)}
                      onChange={(e) => {
                        const nextKind = e.target
                          .value as DeviceSensor["widgetKind"];
                        updateSensorRow(index, {
                          widgetKind: nextKind,
                          widget: defaultWidgetByKind(nextKind),
                        });
                      }}
                      className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs"
                    >
                      <option value="data">data widget</option>
                      <option value="action">action widget</option>
                    </select>
                    <select
                      value={
                        sensor.widget ||
                        defaultWidgetByKind(deriveWidgetKind(sensor))
                      }
                      onChange={(e) =>
                        updateSensorRow(index, {
                          widget: e.target.value as DeviceSensor["widget"],
                        })
                      }
                      className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs"
                    >
                      {widgetOptionsForKind(deriveWidgetKind(sensor)).map(
                        (widgetOption) => (
                          <option key={widgetOption} value={widgetOption}>
                            {widgetOption}
                          </option>
                        ),
                      )}
                    </select>
                    {supportsPrimarySensor(configDraft.type) ? (
                      <select
                        value={configDraft.primarySensorKey}
                        onChange={(e) =>
                          setConfigDraft((prev) => ({
                            ...prev,
                            primarySensorKey: e.target.value,
                          }))
                        }
                        className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs"
                      >
                        {configDraft.sensors.map((optionSensor) => (
                          <option
                            key={optionSensor.key}
                            value={optionSensor.key}
                          >
                            main: {optionSensor.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="rounded-md border border-gray-200 px-2 py-1.5 text-xs text-gray-400">
                        Primary sensor N/A
                      </div>
                    )}
                  </div>

                  <div className="mt-2 grid gap-2 md:grid-cols-[1fr_1fr_auto_auto_auto]">
                    <input
                      value={sensor.mqttTopic}
                      onChange={(e) =>
                        updateSensorRow(index, { mqttTopic: e.target.value })
                      }
                      className="rounded-md border border-gray-200 px-2 py-1.5 text-xs font-mono"
                      placeholder="MQTT topic"
                    />
                    <input
                      value={sensor.commandTopic || ""}
                      onChange={(e) =>
                        updateSensorRow(index, { commandTopic: e.target.value })
                      }
                      className="rounded-md border border-gray-200 px-2 py-1.5 text-xs font-mono"
                      placeholder="Actuator command topic"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => suggestSensorTopic(index)}
                    >
                      Suggest
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        configDeviceId &&
                        sensor.key &&
                        pingTopicMutation.mutate({
                          id: configDeviceId,
                          sensorKey: sensor.key,
                          mqttTopic: sensor.mqttTopic,
                          siteId: configDraft.siteId,
                        })
                      }
                      disabled={pingTopicMutation.isPending || !sensor.key}
                    >
                      Ping Topic
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        configDeviceId &&
                        sensor.key &&
                        triggerActuatorMutation.mutate({
                          id: configDeviceId,
                          sensorKey: sensor.key,
                          payload: {
                            command: "set",
                            value: Number(
                              sensor.actuatorConfig?.defaultValue ?? 50,
                            ),
                            topic: sensor.commandTopic || sensor.mqttTopic,
                            notifyPhone: true,
                          },
                        })
                      }
                      disabled={
                        triggerActuatorMutation.isPending || !sensor.key
                      }
                    >
                      Actuate
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeSensorRow(index)}
                      disabled={configDraft.sensors.length <= 1}
                    >
                      Delete Sensor
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-800">
                  Actuator Outputs
                </h4>
                <Button variant="outline" size="sm" onClick={addOutputRow}>
                  Add Output
                </Button>
              </div>
              {configDraft.actuatorOutputs.length > 0 ? (
                configDraft.actuatorOutputs.map((output, index) => (
                  <div
                    key={`${output.key}-${index}`}
                    className="rounded-lg border border-gray-200 p-3"
                  >
                    <div className="grid gap-2 md:grid-cols-7">
                      <input
                        value={output.key}
                        onChange={(e) =>
                          updateOutputRow(index, { key: e.target.value })
                        }
                        className="rounded-md border border-gray-200 px-2 py-1.5 text-xs"
                        placeholder="output key"
                      />
                      <input
                        value={output.label}
                        onChange={(e) =>
                          updateOutputRow(index, { label: e.target.value })
                        }
                        className="rounded-md border border-gray-200 px-2 py-1.5 text-xs"
                        placeholder="output label"
                      />
                      <select
                        value={output.outputType}
                        onChange={(e) =>
                          updateOutputRow(index, {
                            outputType: e.target
                              .value as DeviceActuatorOutput["outputType"],
                          })
                        }
                        className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs"
                      >
                        <option value="fan">fan</option>
                        <option value="fan_pwm">fan_pwm</option>
                        <option value="led_pwm">led_pwm</option>
                        <option value="relay">relay</option>
                        <option value="pump">pump</option>
                        <option value="custom">custom</option>
                      </select>
                      <input
                        type="number"
                        value={output.min ?? 0}
                        onChange={(e) =>
                          updateOutputRow(index, {
                            min: Number(e.target.value || 0),
                          })
                        }
                        className="rounded-md border border-gray-200 px-2 py-1.5 text-xs"
                        placeholder="min"
                      />
                      <input
                        type="number"
                        value={output.max ?? 100}
                        onChange={(e) =>
                          updateOutputRow(index, {
                            max: Number(e.target.value || 100),
                          })
                        }
                        className="rounded-md border border-gray-200 px-2 py-1.5 text-xs"
                        placeholder="max"
                      />
                      <input
                        type="number"
                        value={output.step ?? 1}
                        onChange={(e) =>
                          updateOutputRow(index, {
                            step: Number(e.target.value || 1),
                          })
                        }
                        className="rounded-md border border-gray-200 px-2 py-1.5 text-xs"
                        placeholder="step"
                      />
                      <input
                        type="number"
                        value={output.defaultValue ?? 0}
                        onChange={(e) =>
                          updateOutputRow(index, {
                            defaultValue: Number(e.target.value || 0),
                          })
                        }
                        className="rounded-md border border-gray-200 px-2 py-1.5 text-xs"
                        placeholder="default"
                      />
                    </div>
                    <div className="mt-2 grid gap-2 md:grid-cols-[1fr_auto_auto]">
                      <input
                        value={output.commandTopic}
                        onChange={(e) =>
                          updateOutputRow(index, {
                            commandTopic: e.target.value,
                          })
                        }
                        className="rounded-md border border-gray-200 px-2 py-1.5 text-xs font-mono"
                        placeholder="Command topic"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          configDeviceId &&
                          triggerActuatorOutputMutation.mutate({
                            id: configDeviceId,
                            outputKey: output.key,
                            payload: {
                              command: "set",
                              value: Number(output.defaultValue ?? 0),
                              topic: output.commandTopic,
                              notifyPhone: true,
                            },
                          })
                        }
                        disabled={
                          triggerActuatorOutputMutation.isPending || !output.key
                        }
                      >
                        Test Output
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeOutputRow(index)}
                      >
                        Delete Output
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-dashed border-gray-200 p-3 text-xs text-gray-500">
                  No actuator outputs configured.
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Button variant="outline" onClick={addSensorRow}>
                Add Sensor Topic
              </Button>
              <Button
                onClick={saveDeviceConfig}
                disabled={updateDeviceMutation.isPending}
              >
                {updateDeviceMutation.isPending
                  ? "Saving..."
                  : "Save Configuration"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
