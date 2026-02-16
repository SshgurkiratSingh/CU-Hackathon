// src/lib/mock-data.ts
import { Zone, Device, Alert, TelemetryPoint } from "@/types";

export type MockDeviceStatus = "normal" | "warning" | "critical" | "offline";

export interface MockDevice {
  id: string;
  name: string;
  type: "sensor" | "actuator" | "camera" | "controller";
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

// --- Device Simulator Data (for /debug/mock) ---
const MOCK_DEVICE_TYPES: Array<MockDevice["type"]> = [
  "sensor",
  "actuator",
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
