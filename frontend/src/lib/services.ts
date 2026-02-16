import api from "@/lib/api";
import {
  mockActionLog,
  mockAlertHistory,
  mockAlerts,
  mockDeviceHistory,
  mockDevices,
  mockMarketplacePacks,
  mockMemoryEntries,
  mockRuleHistory,
  mockRules,
  mockZones,
} from "@/lib/mock-data";
import {
  ActionLog,
  AlertHistoryItem,
  Alert,
  AutomationRule,
  DeviceHistoryItem,
  Device,
  MarketplacePack,
  MemoryEntry,
  RuleHistoryItem,
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
  alertHistory: () =>
    withFallback(async () => (await api.get<AlertHistoryItem[]>("/alerts/history")).data, mockAlertHistory),
  ruleHistory: () =>
    withFallback(async () => (await api.get<RuleHistoryItem[]>("/rules/history")).data, mockRuleHistory),
  deviceHistory: () =>
    withFallback(async () => (await api.get<DeviceHistoryItem[]>("/devices/history")).data, mockDeviceHistory),
  memory: () => withFallback(async () => (await api.get<MemoryEntry[]>("/memory")).data, mockMemoryEntries),
  marketplace: () =>
    withFallback(async () => (await api.get<MarketplacePack[]>("/marketplace")).data, mockMarketplacePacks),
};
