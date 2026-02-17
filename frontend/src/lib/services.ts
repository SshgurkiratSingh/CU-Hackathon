import api from "@/lib/api";
import {
  mockMarketplacePacks,
} from "@/lib/mock-data";
import {
  ActionLog,
  AlertHistoryItem,
  Alert,
  AutomationRule,
  DeviceSensor,
  DeviceHistoryItem,
  Device,
  MarketplacePack,
  MemoryEntry,
  RuleHistoryItem,
  TelemetryPoint,
  TopicTelemetryRow,
  Zone,
} from "@/types";

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  count?: number;
  [key: string]: unknown;
};

type BackendTelemetry = {
  _id?: string;
  siteId?: string;
  topic?: string;
  deviceId?: string;
  sensorKey?: string;
  sensorType?: string;
  value?: number;
  unit?: string;
  timestamp?: string;
};

type BackendDevice = {
  _id?: string;
  id?: string;
  deviceId?: string;
  name?: string;
  type?: string;
  siteId?: string;
  status?: string;
  primarySensorKey?: string;
  sensors?: Array<{
    key?: string;
    label?: string;
    sensorType?: DeviceSensor["sensorType"];
    unit?: string;
    mqttTopic?: string;
    widget?: DeviceSensor["widget"];
    widgetKind?: DeviceSensor["widgetKind"];
    isPrimary?: boolean;
  }>;
  createdAt?: string;
};

type BackendAlert = {
  _id?: string;
  id?: string;
  siteId?: string;
  severity?: "low" | "medium" | "high" | "critical";
  message?: string;
  resolved?: boolean;
  createdAt?: string;
  resolvedAt?: string;
};

type BackendRule = {
  _id?: string;
  name?: string;
  siteId?: string;
  condition?: { type?: string; value?: string; description?: string };
  action?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type BackendAction = {
  _id?: string;
  name?: string;
  type?: string;
  siteId?: string;
  status?: "pending" | "executing" | "completed" | "failed";
  parameters?: Record<string, unknown>;
  createdAt?: string;
  executedAt?: string;
};

type BackendZone = {
  _id?: string;
  siteId?: string;
  name?: string;
  type?: Zone["type"];
  description?: string;
  crop?: string;
  targets?: {
    temp?: number;
    humidity?: number;
    co2?: number;
  };
  createdAt?: string;
  updatedAt?: string;
};

type BackendThinkingLog = {
  _id?: string;
  ruleId?: string;
  thinking?: string;
  decision?: string;
  confidence?: number;
  timestamp?: string;
};

const DEFAULT_SENSOR_UNITS: Record<string, string> = {
  temperature: "°C",
  humidity: "%",
  co2: "ppm",
  light: "lux",
  dli: "mol/m²/day",
  soil_moisture: "%",
  ec: "dS/m",
  ph: "pH",
};

function unwrapData<T>(value: unknown, fallback: T): T {
  if (value && typeof value === "object" && "data" in value) {
    const payload = (value as ApiEnvelope<T>).data;
    return (payload ?? fallback) as T;
  }
  if (value !== undefined) {
    return value as T;
  }
  return fallback;
}

async function withFallback<T>(request: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await request();
  } catch {
    return fallback;
  }
}

function toIso(value: unknown): string {
  if (!value) return new Date().toISOString();
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function normalizeSeverity(value: BackendAlert["severity"]): Alert["severity"] {
  if (value === "critical" || value === "high") return "critical";
  if (value === "medium") return "warning";
  return "info";
}

function normalizeDeviceStatus(value: string | undefined): Device["status"] {
  if (!value) return "offline";
  if (["online", "active"].includes(value)) return "online";
  if (["error", "failed"].includes(value)) return "error";
  if (["maintenance"].includes(value)) return "maintenance";
  return "offline";
}

function normalizeRuleStatus(active: boolean | undefined): AutomationRule["status"] {
  return active ? "active" : "paused";
}

function aggregateZoneMetrics(siteId: string, telemetry: BackendTelemetry[]) {
  const metricsByType = telemetry.reduce<Record<string, BackendTelemetry[]>>((acc, point) => {
    const key = String(point.sensorType || "unknown").toLowerCase();
    if (!acc[key]) acc[key] = [];
    acc[key].push(point);
    return acc;
  }, {});

  const avg = (sensorType: string, fallback: number) => {
    const points = metricsByType[sensorType] ?? [];
    if (!points.length) return fallback;
    const total = points.reduce((sum, point) => sum + Number(point.value ?? 0), 0);
    return Number((total / points.length).toFixed(1));
  };

  return {
    temp: { value: avg("temperature", 0), unit: DEFAULT_SENSOR_UNITS.temperature, trend: "stable" as const },
    humidity: { value: avg("humidity", 0), unit: DEFAULT_SENSOR_UNITS.humidity, trend: "stable" as const },
    co2: { value: avg("co2", 0), unit: DEFAULT_SENSOR_UNITS.co2, trend: "stable" as const },
    light: { value: avg("light", 0), unit: DEFAULT_SENSOR_UNITS.light, trend: "stable" as const },
    ec: { value: avg("ec", 0), unit: DEFAULT_SENSOR_UNITS.ec, trend: "stable" as const },
    ph: { value: avg("ph", 0), unit: DEFAULT_SENSOR_UNITS.ph, trend: "stable" as const },
    soil_moisture: {
      value: avg("soil_moisture", 0),
      unit: DEFAULT_SENSOR_UNITS.soil_moisture,
      trend: "stable" as const,
    },
    siteId,
  };
}

function statusFromAlertCount(alertCount: number): Zone["status"] {
  if (alertCount > 0) return "critical";
  return "optimal";
}

async function fetchTelemetry(limit = 500): Promise<BackendTelemetry[]> {
  const response = await api.get<ApiEnvelope<BackendTelemetry[]>>("/telemetry", {
    headers: {},
  });
  const telemetry = unwrapData<BackendTelemetry[]>(response.data, []);
  return Array.isArray(telemetry) ? telemetry.slice(0, limit) : [];
}

async function fetchDevices(): Promise<BackendDevice[]> {
  const response = await api.get<ApiEnvelope<BackendDevice[]>>("/devices");
  const devices = unwrapData<BackendDevice[]>(response.data, []);
  return Array.isArray(devices) ? devices : [];
}

async function fetchAlerts(): Promise<BackendAlert[]> {
  const response = await api.get<ApiEnvelope<BackendAlert[]>>("/alerts");
  const alerts = unwrapData<BackendAlert[]>(response.data, []);
  return Array.isArray(alerts) ? alerts : [];
}

async function fetchZones(): Promise<BackendZone[]> {
  const response = await api.get<ApiEnvelope<BackendZone[]>>("/zones");
  const zones = unwrapData<BackendZone[]>(response.data, []);
  return Array.isArray(zones) ? zones : [];
}

export const dataService = {
  zones: async (): Promise<Zone[]> => {
    const [backendZones, telemetry, devices, alerts] = await Promise.all([
      withFallback(fetchZones, [] as BackendZone[]),
      fetchTelemetry(),
      fetchDevices(),
      fetchAlerts(),
    ]);

    const configuredZones = new Map<string, BackendZone>();
    backendZones.forEach((zone) => {
      if (zone.siteId) configuredZones.set(zone.siteId, zone);
    });

    const siteIds = new Set<string>();
    configuredZones.forEach((_zone, siteId) => siteIds.add(siteId));
    telemetry.forEach((t) => t.siteId && siteIds.add(t.siteId));
    devices.forEach((d) => d.siteId && siteIds.add(d.siteId));
    alerts.forEach((a) => a.siteId && siteIds.add(a.siteId));

    return Array.from(siteIds).map((siteId, index) => {
      const configuredZone = configuredZones.get(siteId);
      const siteTelemetry = telemetry.filter((point) => point.siteId === siteId);
      const siteDevices = devices.filter((device) => device.siteId === siteId);
      const siteAlerts = alerts.filter((alert) => alert.siteId === siteId && !alert.resolved);
      const metrics = aggregateZoneMetrics(siteId, siteTelemetry);

      return {
        id: siteId,
        name: configuredZone?.name || `Zone ${index + 1} (${siteId})`,
        type: configuredZone?.type || "vegetative",
        description: configuredZone?.description || "",
        crop: configuredZone?.crop || "",
        targets: configuredZone?.targets,
        status: statusFromAlertCount(siteAlerts.length),
        metrics,
        deviceCount: siteDevices.length,
        alerts: siteAlerts.length,
        lastUpdated: siteTelemetry[0]?.timestamp || configuredZone?.updatedAt
          ? toIso(siteTelemetry[0]?.timestamp || configuredZone?.updatedAt)
          : new Date().toISOString(),
      } satisfies Zone;
    });
  },
  devices: async (): Promise<Device[]> => {
    const devices = await fetchDevices();
    return devices.map((device) => ({
      id: String(device.deviceId || device.id || device._id || crypto.randomUUID()),
      zoneId: String(device.siteId || "unknown"),
      name: device.name || "Unnamed Device",
      type: (device.type as Device["type"]) || "sensor",
      subType: device.type || "generic",
      status: normalizeDeviceStatus(device.status),
      lastSeen: device.createdAt ? new Date(device.createdAt).toLocaleString() : "N/A",
      primarySensorKey: device.primarySensorKey,
      sensors: Array.isArray(device.sensors)
        ? device.sensors
            .filter((sensor) => sensor?.mqttTopic)
            .map((sensor, index) => ({
              key: String(sensor?.key || `sensor_${index + 1}`),
              label: String(sensor?.label || sensor?.key || `Sensor ${index + 1}`),
              sensorType: (sensor?.sensorType || "custom") as DeviceSensor["sensorType"],
              unit: sensor?.unit || "",
              mqttTopic: String(sensor?.mqttTopic || ""),
              widget: (sensor?.widget || "gauge") as DeviceSensor["widget"],
              widgetKind: (sensor?.widgetKind || "data") as DeviceSensor["widgetKind"],
              isPrimary: Boolean(sensor?.isPrimary),
            }))
        : [],
      meta: { backendId: device._id },
    }));
  },
  alerts: async (): Promise<Alert[]> => {
    const alerts = await fetchAlerts();
    return alerts.map((alert) => ({
      id: String(alert.id || alert._id || crypto.randomUUID()),
      zoneId: String(alert.siteId || "unknown"),
      severity: normalizeSeverity(alert.severity),
      title: alert.message ? alert.message.slice(0, 60) : "Alert",
      message: alert.message || "No message",
      timestamp: toIso(alert.createdAt),
      acknowledged: Boolean(alert.resolved),
    }));
  },
  rules: async (): Promise<AutomationRule[]> => {
    const response = await api.get<ApiEnvelope<BackendRule[]>>("/rules");
    const rules = unwrapData<BackendRule[]>(response.data, []);
    return (Array.isArray(rules) ? rules : []).map((rule) => ({
      id: String(rule._id || crypto.randomUUID()),
      zoneId: String(rule.siteId || "unknown"),
      name: rule.name || "Untitled Rule",
      when: rule.condition?.description || rule.condition?.value || "N/A",
      then: rule.action || "No action",
      status: normalizeRuleStatus(rule.active),
    }));
  },
  actions: async (): Promise<ActionLog[]> => {
    const response = await api.get<ApiEnvelope<BackendAction[]>>("/actions");
    const actions = unwrapData<BackendAction[]>(response.data, []);
    return (Array.isArray(actions) ? actions : []).map((action) => ({
      id: String(action._id || crypto.randomUUID()),
      zoneId: String(action.siteId || "unknown"),
      action: action.name || action.type || "Unnamed Action",
      source: "manual",
      status: action.status === "failed" ? "failed" : "success",
      time: action.createdAt ? new Date(action.createdAt).toLocaleTimeString() : "N/A",
      timestamp: toIso(action.createdAt),
      actor: "operator",
      durationMs: action.executedAt && action.createdAt
        ? Math.max(0, new Date(action.executedAt).getTime() - new Date(action.createdAt).getTime())
        : undefined,
    }));
  },
  alertHistory: async (): Promise<AlertHistoryItem[]> => {
    const alerts = await fetchAlerts();
    return alerts.slice(0, 25).map((alert) => ({
      id: String(alert._id || crypto.randomUUID()),
      zoneId: String(alert.siteId || "unknown"),
      alertId: String(alert._id || "unknown"),
      action: alert.resolved ? "resolved" : "created",
      actor: "system",
      timestamp: toIso(alert.resolvedAt || alert.createdAt),
      note: alert.message,
    }));
  },
  ruleHistory: async (): Promise<RuleHistoryItem[]> => {
    const response = await api.get<ApiEnvelope<BackendRule[]>>("/rules");
    const rules = unwrapData<BackendRule[]>(response.data, []);
    return (Array.isArray(rules) ? rules : []).slice(0, 25).map((rule) => ({
      id: String(rule._id || crypto.randomUUID()),
      zoneId: String(rule.siteId || "unknown"),
      ruleId: String(rule._id || "unknown"),
      action: rule.active ? "activated" : "paused",
      actor: "system",
      timestamp: toIso(rule.updatedAt || rule.createdAt),
      details: rule.condition?.description || rule.condition?.value,
    }));
  },
  deviceHistory: async (): Promise<DeviceHistoryItem[]> => {
    const devices = await fetchDevices();
    return devices.slice(0, 25).map((device) => ({
      id: String(device._id || crypto.randomUUID()),
      zoneId: String(device.siteId || "unknown"),
      deviceId: String(device.deviceId || device._id || "unknown"),
      action: normalizeDeviceStatus(device.status) === "online" ? "online" : "offline",
      actor: "system",
      timestamp: toIso(device.createdAt),
      details: `${device.name || "Device"} status: ${device.status || "unknown"}`,
    }));
  },
  memory: async (): Promise<MemoryEntry[]> => {
    const response = await api.get<ApiEnvelope<BackendThinkingLog[]>>("/memory/thinking");
    const logs = unwrapData<BackendThinkingLog[]>(response.data, []);
    return (Array.isArray(logs) ? logs : []).map((item) => ({
      id: String(item._id || crypto.randomUUID()),
      zoneId: String(item.ruleId || "unknown"),
      summary: item.thinking || item.decision || "No summary available",
      confidence: typeof item.confidence === "number" ? item.confidence : 0.5,
      createdAt: item.timestamp ? new Date(item.timestamp).toLocaleString() : "N/A",
    }));
  },
  marketplace: () =>
    withFallback(async () => unwrapData<MarketplacePack[]>((await api.get<ApiEnvelope<MarketplacePack[]>>("/marketplace")).data, mockMarketplacePacks), mockMarketplacePacks),

  telemetrySeries: async (zoneId: string, hours = 24): Promise<TelemetryPoint[]> => {
    const telemetry = await fetchTelemetry(1000);
    const points = telemetry
      .filter((t) => t.siteId === zoneId)
      .slice(0, hours * 8)
      .reverse();

    const bucketMap = new Map<string, { temp?: number; humidity?: number; co2?: number; light?: number }>();
    points.forEach((point) => {
      const ts = new Date(point.timestamp || Date.now());
      const bucket = `${String(ts.getHours()).padStart(2, "0")}:${String(ts.getMinutes()).padStart(2, "0")}`;
      const row = bucketMap.get(bucket) || {};
      const type = String(point.sensorType || "").toLowerCase();
      if (type === "temperature") row.temp = Number(point.value ?? 0);
      if (type === "humidity") row.humidity = Number(point.value ?? 0);
      if (type === "co2") row.co2 = Number(point.value ?? 0);
      if (type === "light") row.light = Number(point.value ?? 0);
      bucketMap.set(bucket, row);
    });

    return Array.from(bucketMap.entries())
      .slice(-hours)
      .map(([timestamp, value]) => ({
        timestamp,
        temp: Number(value.temp ?? 0),
        humidity: Number(value.humidity ?? 0),
        co2: value.co2,
        light: value.light,
      }));
  },

  recentTopicTelemetry: async (limit = 300): Promise<TopicTelemetryRow[]> => {
    const response = await api.get<ApiEnvelope<BackendTelemetry[]>>(
      `/telemetry?limit=${encodeURIComponent(String(limit))}`,
    );
    const rows = unwrapData<BackendTelemetry[]>(response.data, []);
    return (Array.isArray(rows) ? rows : [])
      .filter((row) => row.siteId && row.sensorType && row.value !== undefined)
      .map((row) => ({
        id: String(row._id || crypto.randomUUID()),
        siteId: String(row.siteId),
        topic: String(row.topic || ""),
        deviceId: row.deviceId ? String(row.deviceId) : undefined,
        sensorKey: row.sensorKey ? String(row.sensorKey) : undefined,
        sensorType: String(row.sensorType),
        value: Number(row.value ?? 0),
        unit: row.unit ? String(row.unit) : undefined,
        timestamp: toIso(row.timestamp),
      }));
  },

  acknowledgeAlert: async (id: string) => {
    const response = await api.post<ApiEnvelope<BackendAlert>>(`/alerts/${id}/acknowledge`);
    return unwrapData(response.data, null);
  },

  toggleRule: async (id: string) => {
    const response = await api.patch<ApiEnvelope<BackendRule>>(`/rules/${id}/toggle`);
    return unwrapData(response.data, null);
  },

  createRule: async (payload: {
    name: string;
    siteId: string;
    condition: { type: string; value: string; description?: string };
    action: string;
  }) => {
    const response = await api.post<ApiEnvelope<BackendRule>>("/rules", payload);
    return unwrapData(response.data, null);
  },

  createDevice: async (payload: {
    deviceId: string;
    name: string;
    type: string;
    siteId: string;
    primarySensorKey?: string;
    sensors?: DeviceSensor[];
  }) => {
    const response = await api.post<ApiEnvelope<BackendDevice>>("/devices", payload);
    return unwrapData(response.data, null);
  },

  updateDevicePrimarySensor: async (id: string, sensorKey: string) => {
    const response = await api.patch<ApiEnvelope<BackendDevice>>(
      `/devices/${encodeURIComponent(id)}/main-sensor`,
      { sensorKey },
    );
    return unwrapData(response.data, null);
  },

  updateDevice: async (
    id: string,
    payload: {
      name?: string;
      type?: string;
      siteId?: string;
      status?: string;
      primarySensorKey?: string;
      sensors?: DeviceSensor[];
      metadata?: Record<string, unknown>;
    },
  ) => {
    const response = await api.put<ApiEnvelope<BackendDevice>>(
      `/devices/${encodeURIComponent(id)}`,
      payload,
    );
    return unwrapData(response.data, null);
  },

  pingDeviceSensorTopic: async (
    id: string,
    sensorKey: string,
    mqttTopic?: string,
    siteId?: string,
  ) => {
    const response = await api.post<
      ApiEnvelope<{
        deviceId: string;
        sensorKey: string;
        topic: string;
      }>
    >(`/devices/${encodeURIComponent(id)}/sensors/${encodeURIComponent(sensorKey)}/ping`, {
      mqttTopic,
      siteId,
    });
    return unwrapData(response.data, null);
  },

  sendDeviceOledCommand: async (
    id: string,
    payload: {
      topic?: string;
      rotationSec?: number;
      brightness?: number;
      pages?: string[][];
    },
  ) => {
    const response = await api.post<
      ApiEnvelope<{
        deviceId: string;
        topic: string;
        payload: {
          rotationSec: number;
          brightness: number;
          pages: string[][];
        };
      }>
    >(`/devices/${encodeURIComponent(id)}/oled/command`, payload);
    return unwrapData(response.data, null);
  },

  createAction: async (payload: {
    name: string;
    type: string;
    siteId: string;
    parameters?: Record<string, unknown>;
  }) => {
    const response = await api.post<ApiEnvelope<BackendAction>>("/actions", payload);
    return unwrapData(response.data, null);
  },

  createZone: async (payload: {
    siteId: string;
    name: string;
    type: Zone["type"];
    description?: string;
    crop?: string;
    targetTemp?: number;
    targetHumidity?: number;
    targetCo2?: number;
  }) => {
    const response = await api.post<ApiEnvelope<BackendZone>>("/zones", payload);
    return unwrapData(response.data, null);
  },

  updateZone: async (
    id: string,
    payload: {
      name?: string;
      type?: Zone["type"];
      description?: string;
      crop?: string;
      targetTemp?: number;
      targetHumidity?: number;
      targetCo2?: number;
    },
  ) => {
    const response = await api.put<ApiEnvelope<BackendZone>>(
      `/zones/${encodeURIComponent(id)}`,
      payload,
    );
    return unwrapData(response.data, null);
  },

  deleteZone: async (id: string) => {
    const response = await api.delete<ApiEnvelope<{ success: boolean }>>(
      `/zones/${encodeURIComponent(id)}`,
    );
    return unwrapData(response.data, null);
  },

  executeAction: async (id: string) => {
    const response = await api.post<ApiEnvelope<BackendAction>>(`/actions/${id}/execute`);
    return unwrapData(response.data, null);
  },

  settings: async (): Promise<Record<string, unknown>> => {
    const response = await api.get<ApiEnvelope<Record<string, unknown>>>("/settings");
    return unwrapData<Record<string, unknown>>(response.data, {});
  },

  updateSetting: async (key: string, value: unknown) => {
    const response = await api.put<ApiEnvelope<{ key: string; value: unknown }>>(`/settings/${encodeURIComponent(key)}`, { value });
    return unwrapData(response.data, null);
  },

  createMemoryEntry: async (payload: {
    ruleId?: string;
    thinking: string;
    decision?: string;
    confidence?: number;
  }) => {
    const response = await api.post<ApiEnvelope<BackendThinkingLog>>("/memory/thinking", payload);
    return unwrapData(response.data, null);
  },
};
