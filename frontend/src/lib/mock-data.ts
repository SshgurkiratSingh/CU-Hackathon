// src/lib/mock-data.ts
import {
  Zone,
  Device,
  Alert,
  TelemetryPoint,
  AutomationRule,
  ActionLog,
  MemoryEntry,
  MarketplacePack,
  AlertHistoryItem,
  RuleHistoryItem,
  DeviceHistoryItem,
} from "@/types";

export type MockDeviceStatus = "normal" | "warning" | "critical" | "offline";

export interface MockDevice {
  id: string;
  name: string;
  type: "sensor" | "actuator" | "hybrid" | "combined" | "camera" | "controller";
  status: MockDeviceStatus;
  lat: number;
  lng: number;
  telemetry: {
    temperature: number;
    humidity: number;
    battery: number;
  };
}

// --- Mock Zones ---
export const mockZones: Zone[] = [
  {
    id: "zone-001",
    name: "Propagation Station",
    type: "propagation",
    status: "optimal",
    metrics: {
      temp: { value: 24.2, unit: "°C", trend: "stable" },
      humidity: { value: 82, unit: "%", trend: "up" },
      co2: { value: 450, unit: "ppm", trend: "stable" },
      light: { value: 220, unit: "µmol", trend: "stable" },
    },
    deviceCount: 8,
    alerts: 0,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "zone-002",
    name: "Vegetative Room A",
    type: "vegetative",
    status: "warning",
    metrics: {
      temp: { value: 27.5, unit: "°C", trend: "up" },
      humidity: { value: 55, unit: "%", trend: "down" },
      co2: { value: 850, unit: "ppm", trend: "stable" },
      light: { value: 750, unit: "µmol", trend: "up" },
      ph: { value: 6.2, unit: "pH", trend: "stable" },
    },
    deviceCount: 15,
    alerts: 2,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "zone-003",
    name: "Flowering Room B",
    type: "flowering",
    status: "optimal",
    metrics: {
      temp: { value: 22.4, unit: "°C", trend: "down" },
      humidity: { value: 48, unit: "%", trend: "stable" },
      co2: { value: 1100, unit: "ppm", trend: "up" },
      light: { value: 1050, unit: "µmol", trend: "stable" },
      ec: { value: 2.1, unit: "dS/m", trend: "down" },
    },
    deviceCount: 22,
    alerts: 0,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "zone-004",
    name: "Drying Vault",
    type: "drying",
    status: "critical",
    metrics: {
      temp: { value: 19.8, unit: "°C", trend: "stable" },
      humidity: { value: 65, unit: "%", trend: "up" }, // Too high for drying
      co2: { value: 420, unit: "ppm", trend: "stable" },
      light: { value: 0, unit: "lux", trend: "stable" },
    },
    deviceCount: 4,
    alerts: 1,
    lastUpdated: new Date().toISOString(),
  },
];

// --- Mock Devices ---
export const mockDevices: Device[] = [
  // Zone 1
  { id: "dev-001", zoneId: "zone-001", name: "Prop Temp/Hum A", type: "sensor", subType: "DHT22", status: "online", lastSeen: "now" },
  { id: "dev-002", zoneId: "zone-001", name: "Mister Unit 1", type: "actuator", subType: "Humidifier", status: "online", lastSeen: "now" },
  // Zone 2
  { id: "dev-003", zoneId: "zone-002", name: "Main Temp Sensor", type: "sensor", subType: "SHT31", status: "maintenance", lastSeen: "2h ago" },
  // Zone 4
  { id: "dev-004", zoneId: "zone-004", name: "Dehumidifier XL", type: "actuator", subType: "Dehumidifier", status: "error", lastSeen: "5m ago" },
];

// --- Helper Functions ---
export const getZoneById = (id: string): Zone | undefined => mockZones.find((z) => z.id === id);

export const getDevicesByZoneId = (zoneId: string): Device[] => mockDevices.filter((d) => d.zoneId === zoneId);

export const getMockTelemetryHistory = (zoneId: string, hours: number = 24): TelemetryPoint[] => {
  const zone = getZoneById(zoneId);
  if (!zone) return [];
  
  const baseTemp = zone.metrics.temp.value;
  const baseHum = zone.metrics.humidity.value;
  const baseCo2 = zone.metrics.co2.value;

  return Array.from({ length: hours }, (_, i) => {
    // Generate timestamps relative to now, going back
    const date = new Date();
    date.setHours(date.getHours() - (hours - i));
    
    return {
      timestamp: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temp: Number((baseTemp + (Math.random() - 0.5) * 4).toFixed(1)),
      humidity: Math.floor(baseHum + (Math.random() - 0.5) * 10),
      co2: Math.floor(baseCo2 + (Math.random() - 0.5) * 50),
      light: zone.type === 'drying' ? 0 : Math.floor(Math.random() * 1000), // Only light if not drying
    };
  });
};

// --- Mock Alerts ---
export const mockAlerts: Alert[] = [
  {
    id: "alert-001",
    zoneId: "zone-004",
    severity: "critical",
    title: "Humidity threshold breached",
    message: "Drying vault humidity above 60% for 15 minutes.",
    timestamp: new Date().toISOString(),
    acknowledged: false,
  },
  {
    id: "alert-002",
    zoneId: "zone-002",
    severity: "warning",
    title: "Temperature rising",
    message: "Zone temperature trending upward, approaching warning threshold.",
    timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    acknowledged: false,
  },
  {
    id: "alert-003",
    zoneId: "zone-001",
    severity: "info",
    title: "Misting cycle complete",
    message: "Propagation misting cycle completed successfully.",
    timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    acknowledged: true,
  },
];

// --- Mock Rules ---
export const mockRules: AutomationRule[] = [
  {
    id: "rule-001",
    zoneId: "zone-002",
    name: "Heat Extraction Safety",
    when: "Temp > 28°C for 3 min",
    then: "Enable extraction fan (80%)",
    status: "active",
  },
  {
    id: "rule-002",
    zoneId: "zone-004",
    name: "Drying Vault Humidity Guard",
    when: "Humidity > 60%",
    then: "Start dehumidifier and send alert",
    status: "active",
  },
  {
    id: "rule-003",
    zoneId: "zone-001",
    name: "Propagation Misting Cycle",
    when: "Humidity < 78%",
    then: "Run mister for 2 minutes",
    status: "paused",
  },
];

// --- Mock Actions ---
export const mockActionLog: ActionLog[] = [
  {
    id: "act-001",
    zoneId: "zone-004",
    action: "Start dehumidifier",
    source: "rule-002",
    status: "success",
    time: "1m ago",
    timestamp: new Date(Date.now() - 1000 * 60 * 1).toISOString(),
    actor: "automation-engine",
    durationMs: 1400,
    targetDeviceId: "dev-004",
  },
  {
    id: "act-002",
    zoneId: "zone-002",
    action: "Enable extraction fan",
    source: "manual",
    status: "success",
    time: "10m ago",
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    actor: "operator@growhub",
    durationMs: 890,
  },
  {
    id: "act-003",
    zoneId: "zone-001",
    action: "Run misting cycle",
    source: "rule-003",
    status: "failed",
    time: "24m ago",
    timestamp: new Date(Date.now() - 1000 * 60 * 24).toISOString(),
    actor: "automation-engine",
    durationMs: 4200,
    targetDeviceId: "dev-002",
  },
  {
    id: "act-004",
    zoneId: "zone-003",
    action: "Reduce light intensity to 80%",
    source: "manual",
    status: "success",
    time: "42m ago",
    timestamp: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    actor: "shift-supervisor",
    durationMs: 760,
  },
  {
    id: "act-005",
    zoneId: "zone-004",
    action: "Emergency ventilation burst",
    source: "rule-002",
    status: "success",
    time: "1h ago",
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    actor: "automation-engine",
    durationMs: 2300,
  },
  {
    id: "act-006",
    zoneId: "zone-002",
    action: "Pause irrigation valve",
    source: "manual",
    status: "failed",
    time: "2h ago",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    actor: "operator@growhub",
    durationMs: 5100,
    targetDeviceId: "dev-003",
  },
];

// --- Mock History Streams ---
export const mockAlertHistory: AlertHistoryItem[] = [
  {
    id: "ah-001",
    zoneId: "zone-004",
    alertId: "alert-001",
    action: "created",
    actor: "system",
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    note: "Humidity crossed threshold 60%",
  },
  {
    id: "ah-002",
    zoneId: "zone-004",
    alertId: "alert-001",
    action: "acknowledged",
    actor: "operator@growhub",
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: "ah-003",
    zoneId: "zone-002",
    alertId: "alert-002",
    action: "created",
    actor: "system",
    timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
  },
];

export const mockRuleHistory: RuleHistoryItem[] = [
  {
    id: "rh-001",
    zoneId: "zone-002",
    ruleId: "rule-001",
    action: "triggered",
    actor: "automation-engine",
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    details: "Temp 28.3°C > 28°C",
  },
  {
    id: "rh-002",
    zoneId: "zone-001",
    ruleId: "rule-003",
    action: "paused",
    actor: "operator@growhub",
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: "rh-003",
    zoneId: "zone-004",
    ruleId: "rule-002",
    action: "updated",
    actor: "agronomist",
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    details: "Adjusted humidity trigger from 62% to 60%",
  },
];

export const mockDeviceHistory: DeviceHistoryItem[] = [
  {
    id: "dh-001",
    zoneId: "zone-004",
    deviceId: "dev-004",
    action: "error",
    actor: "system",
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    details: "Compressor pressure fault",
  },
  {
    id: "dh-002",
    zoneId: "zone-003",
    deviceId: "dev-010",
    action: "online",
    actor: "system",
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    details: "Recovered after network reconnect",
  },
  {
    id: "dh-003",
    zoneId: "zone-002",
    deviceId: "dev-003",
    action: "maintenance",
    actor: "field-tech",
    timestamp: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    details: "Sensor calibration started",
  },
];

// --- Mock Memory ---
export const mockMemoryEntries: MemoryEntry[] = [
  {
    id: "mem-001",
    zoneId: "zone-001",
    summary: "Humidity stable around 80-83% after misting adjustments.",
    confidence: 0.92,
    createdAt: "2h ago",
  },
  {
    id: "mem-002",
    zoneId: "zone-004",
    summary: "Drying quality decreases when humidity exceeds 60% for >20 min.",
    confidence: 0.95,
    createdAt: "5h ago",
  },
  {
    id: "mem-003",
    zoneId: "zone-002",
    summary: "Ventilation pulse of 5 min keeps temperature under 28°C.",
    confidence: 0.88,
    createdAt: "1d ago",
  },
];

// --- Mock Marketplace ---
export const mockMarketplacePacks: MarketplacePack[] = [
  {
    id: "pack-001",
    name: "Leaf Disease Detector",
    category: "Computer Vision",
    installs: 318,
    rating: 4.9,
    description: "Analyzes canopy camera feeds to detect early signs of mildew and nutrient stress.",
  },
  {
    id: "pack-002",
    name: "Growth Stage Classifier",
    category: "CV",
    installs: 204,
    rating: 4.7,
    description: "Classifies plant growth stages from images and updates zone operation targets.",
  },
  {
    id: "pack-003",
    name: "Irrigation Decision Engine",
    category: "Decision Model",
    installs: 267,
    rating: 4.8,
    description: "Recommends irrigation actions from humidity, substrate, and evapotranspiration signals.",
  },
  {
    id: "pack-004",
    name: "Climate Setpoint Policy",
    category: "Decision",
    installs: 189,
    rating: 4.6,
    description: "Optimizes HVAC and ventilation setpoints using forecast and zone trend history.",
  },
  {
    id: "pack-005",
    name: "Camera Drift Monitor",
    category: "Computer Vision",
    installs: 146,
    rating: 4.5,
    description: "Detects blur, angle drift, and low-light degradation across greenhouse cameras.",
  },
  {
    id: "pack-006",
    name: "Harvest Window Recommender",
    category: "Decision Policy",
    installs: 121,
    rating: 4.4,
    description: "Ranks harvest windows based on stress signals, growth pace, and quality constraints.",
  },
  {
    id: "pack-007",
    name: "MQTT Device Bridge",
    category: "Plugin",
    installs: 233,
    rating: 4.7,
    description: "Bridges external MQTT telemetry streams into zone-level model inputs and alerts.",
  },
  {
    id: "pack-008",
    name: "ERP Yield Sync",
    category: "Integration Plugin",
    installs: 88,
    rating: 4.3,
    description: "Syncs batch outcomes and quality grades to enterprise systems for closed-loop decisions.",
  },
];

// --- Device Simulator Data (for /debug/mock) ---
const MOCK_DEVICE_TYPES: Array<MockDevice["type"]> = [
  "sensor",
  "actuator",
  "hybrid",
  "camera",
  "controller",
];

const MOCK_DEVICE_NAMES = [
  "Temp Sensor",
  "Humidity Probe",
  "Irrigation Valve",
  "Exhaust Fan",
  "Grow Camera",
  "Climate Controller",
  "CO₂ Sensor",
  "Light Meter",
];

const MAP_CENTER = { lat: 51.505, lng: -0.09 };

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const randomFrom = <T,>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)];

const randomInRange = (min: number, max: number): number =>
  min + Math.random() * (max - min);

const toDeviceName = (index: number): string =>
  `${randomFrom(MOCK_DEVICE_NAMES)} ${index + 1}`;

export const generateRandomDevice = (index: number): MockDevice => {
  const statusRoll = Math.random();
  const status: MockDeviceStatus =
    statusRoll < 0.72
      ? "normal"
      : statusRoll < 0.88
        ? "warning"
        : statusRoll < 0.97
          ? "critical"
          : "offline";

  return {
    id: `mock-dev-${Date.now()}-${index}`,
    name: toDeviceName(index),
    type: randomFrom(MOCK_DEVICE_TYPES),
    status,
    lat: MAP_CENTER.lat + randomInRange(-0.03, 0.03),
    lng: MAP_CENTER.lng + randomInRange(-0.03, 0.03),
    telemetry: {
      temperature: Number(randomInRange(18, 32).toFixed(1)),
      humidity: Math.round(randomInRange(35, 85)),
      battery: Math.round(randomInRange(25, 100)),
    },
  };
};

export const generateInitialDevices = (count: number = 5): MockDevice[] =>
  Array.from({ length: Math.max(0, count) }, (_, i) => generateRandomDevice(i));

export const updateDeviceTelemetry = (device: MockDevice): MockDevice => {
  if (device.status === "offline") {
    return {
      ...device,
      telemetry: {
        ...device.telemetry,
        battery: clamp(device.telemetry.battery - 1, 0, 100),
      },
    };
  }

  const nextTemperature = clamp(
    device.telemetry.temperature + randomInRange(-1.4, 1.4),
    10,
    95
  );
  const nextHumidity = clamp(
    Math.round(device.telemetry.humidity + randomInRange(-4, 4)),
    10,
    100
  );
  const nextBattery = clamp(device.telemetry.battery - randomInRange(0, 1.8), 0, 100);

  let status: MockDeviceStatus = device.status;
  if (nextTemperature >= 40 || nextHumidity >= 90 || nextBattery <= 10) {
    status = "critical";
  } else if (nextTemperature >= 33 || nextHumidity >= 80 || nextBattery <= 20) {
    status = "warning";
  } else {
    status = "normal";
  }

  return {
    ...device,
    status,
    telemetry: {
      temperature: Number(nextTemperature.toFixed(1)),
      humidity: nextHumidity,
      battery: Math.round(nextBattery),
    },
  };
};
