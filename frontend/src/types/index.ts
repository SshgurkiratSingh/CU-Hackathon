// src/types/index.ts

// --- Core Entities ---

export interface Metric {
  value: number;
  unit: string;
  trend?: 'up' | 'down' | 'stable';
  color?: string; // Optional color override
}

export interface EnvironmentalMetrics {
  temp: Metric;
  humidity: Metric;
  co2: Metric;
  light: Metric;
  soil_moisture?: Metric;
  ph?: Metric;
  ec?: Metric;
}

export type ZoneType =
  | 'propagation'
  | 'vegetative'
  | 'flowering'
  | 'drying'
  | 'curing'
  | (string & {});
export type ZoneStatus = 'optimal' | 'warning' | 'critical' | 'offline';

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  status: ZoneStatus;
  description?: string;
  crop?: string;
  targets?: {
    temp?: number;
    humidity?: number;
    co2?: number;
  };
  metrics: EnvironmentalMetrics;
  deviceCount: number;
  alerts: number;
  lastUpdated: string;
}

export type DeviceType =
  | 'sensor'
  | 'actuator'
  | 'hybrid'
  | 'combined'
  | 'camera'
  | 'controller';
export type DeviceStatus = 'online' | 'offline' | 'error' | 'maintenance';
export type SensorType =
  | 'temperature'
  | 'humidity'
  | 'co2'
  | 'light'
  | 'soil_moisture'
  | 'barometer'
  | 'mmwave_presence'
  | 'vpd'
  | 'custom';

export interface DeviceSensor {
  key: string;
  label: string;
  sensorType: SensorType;
  unit?: string;
  mqttTopic: string;
  widget?:
    | 'gauge'
    | 'line'
    | 'graph'
    | 'status'
    | 'sparkline'
    | 'number'
    | 'button'
    | 'led';
  widgetKind?: 'data' | 'action';
  isPrimary?: boolean;
}

export interface Device {
  id: string;
  zoneId: string;
  name: string;
  type: DeviceType;
  subType: string; // e.g. "DHT22", "SolenoidValve"
  status: DeviceStatus;
  lastSeen: string;
  sensors?: DeviceSensor[];
  primarySensorKey?: string;
  meta?: Record<string, unknown>;
}

export interface Alert {
  id: string;
  zoneId: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

export type RuleStatus = 'active' | 'paused';

export interface AutomationRule {
  id: string;
  zoneId: string;
  name: string;
  when: string;
  then: string;
  status: RuleStatus;
}

export interface ActionLog {
  id: string;
  zoneId: string;
  action: string;
  source: string;
  status: 'success' | 'failed';
  time: string;
  timestamp?: string;
  actor?: string;
  durationMs?: number;
  targetDeviceId?: string;
}

export interface AlertHistoryItem {
  id: string;
  zoneId: string;
  alertId: string;
  action: 'created' | 'acknowledged' | 'resolved';
  actor: string;
  timestamp: string;
  note?: string;
}

export interface RuleHistoryItem {
  id: string;
  zoneId: string;
  ruleId: string;
  action: 'created' | 'updated' | 'paused' | 'activated' | 'triggered';
  actor: string;
  timestamp: string;
  details?: string;
}

export interface DeviceHistoryItem {
  id: string;
  zoneId: string;
  deviceId: string;
  action: 'online' | 'offline' | 'maintenance' | 'error' | 'recovered';
  actor: string;
  timestamp: string;
  details?: string;
}

export interface MemoryEntry {
  id: string;
  zoneId: string;
  summary: string;
  confidence: number;
  createdAt: string;
}

export interface MarketplacePack {
  id: string;
  name: string;
  category: string;
  installs: number;
  rating: number;
  description: string;
}

export interface TelemetryPoint {
  timestamp: string;
  temp: number;
  humidity: number;
  co2?: number;
  light?: number;
}

export interface TopicTelemetryRow {
  id: string;
  siteId: string;
  topic: string;
  deviceId?: string;
  sensorKey?: string;
  sensorType: string;
  value: number;
  unit?: string;
  timestamp: string;
}
