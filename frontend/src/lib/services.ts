import api from "@/lib/api";
import {
  mockActionLog,
  mockAlerts,
  mockDevices,
  mockMarketplacePacks,
  mockMemoryEntries,
  mockRules,
  mockZones,
} from "@/lib/mock-data";
import {
  ActionLog,
  Alert,
  AutomationRule,
  Device,
  MarketplacePack,
  MemoryEntry,
  Zone,
} from "@/types";

async function withFallback<T>(request: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await request();
  } catch {
    return fallback;
  }
}

export const dataService = {
  zones: () => withFallback(async () => (await api.get<Zone[]>("/zones")).data, mockZones),
  devices: () => withFallback(async () => (await api.get<Device[]>("/devices")).data, mockDevices),
  alerts: () => withFallback(async () => (await api.get<Alert[]>("/alerts")).data, mockAlerts),
  rules: () => withFallback(async () => (await api.get<AutomationRule[]>("/rules")).data, mockRules),
  actions: () => withFallback(async () => (await api.get<ActionLog[]>("/actions")).data, mockActionLog),
  memory: () => withFallback(async () => (await api.get<MemoryEntry[]>("/memory")).data, mockMemoryEntries),
  marketplace: () =>
    withFallback(async () => (await api.get<MarketplacePack[]>("/marketplace")).data, mockMarketplacePacks),
};
