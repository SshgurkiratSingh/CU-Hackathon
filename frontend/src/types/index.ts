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

export type ZoneType = 'propagation' | 'vegetative' | 'flowering' | 'drying' | 'curing';
export type ZoneStatus = 'optimal' | 'warning' | 'critical' | 'offline';

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  status: ZoneStatus;
  metrics: EnvironmentalMetrics;
  deviceCount: number;
  alerts: number;
  lastUpdated: string;
}

export type DeviceType = 'sensor' | 'actuator' | 'camera' | 'controller';
export type DeviceStatus = 'online' | 'offline' | 'error' | 'maintenance';

export interface Device {
  id: string;
  zoneId: string;
  name: string;
  type: DeviceType;
  subType: string; // e.g. "DHT22", "SolenoidValve"
  status: DeviceStatus;
  lastSeen: string;
  meta?: Record<string, any>;
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

export interface TelemetryPoint {
  timestamp: string;
  temp: number;
  humidity: number;
  co2?: number;
  light?: number;
}
