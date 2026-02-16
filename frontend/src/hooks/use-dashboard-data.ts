"use client";

import { useQuery } from "@tanstack/react-query";
import { dataService } from "@/lib/services";
import {
  ActionLog,
  Alert,
  AutomationRule,
  Device,
  MarketplacePack,
  MemoryEntry,
  Zone,
} from "@/types";

export function useZones() {
  return useQuery<Zone[]>({ queryKey: ["zones"], queryFn: dataService.zones });
}

export function useDevices() {
  return useQuery<Device[]>({ queryKey: ["devices"], queryFn: dataService.devices });
}

export function useAlerts() {
  return useQuery<Alert[]>({ queryKey: ["alerts"], queryFn: dataService.alerts });
}

export function useRules() {
  return useQuery<AutomationRule[]>({ queryKey: ["rules"], queryFn: dataService.rules });
}

export function useActions() {
  return useQuery<ActionLog[]>({ queryKey: ["actions"], queryFn: dataService.actions });
}

export function useMemory() {
  return useQuery<MemoryEntry[]>({ queryKey: ["memory"], queryFn: dataService.memory });
}

export function useMarketplace() {
  return useQuery<MarketplacePack[]>({ queryKey: ["marketplace"], queryFn: dataService.marketplace });
}
