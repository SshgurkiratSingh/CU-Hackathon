// src/lib/mock-data.ts
import { Zone, Device, Alert, TelemetryPoint } from "@/types";

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
