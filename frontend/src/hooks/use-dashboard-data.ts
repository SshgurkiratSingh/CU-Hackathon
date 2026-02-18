"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dataService } from "@/lib/services";
import {
  ActionLog,
  AssistantCapabilitySet,
  AlertHistoryItem,
  Alert,
  AutomationRule,
  DeviceHistoryItem,
  Device,
  DeviceActuatorOutput,
  ImportantActionItem,
  MarketplacePack,
  MemoryEntry,
  RuleHistoryItem,
  TelemetryPoint,
  TopicTelemetryRow,
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

export function useAlertHistory() {
  return useQuery<AlertHistoryItem[]>({
    queryKey: ["alert-history"],
    queryFn: dataService.alertHistory,
  });
}

export function useRuleHistory() {
  return useQuery<RuleHistoryItem[]>({
    queryKey: ["rule-history"],
    queryFn: dataService.ruleHistory,
  });
}

export function useDeviceHistory() {
  return useQuery<DeviceHistoryItem[]>({
    queryKey: ["device-history"],
    queryFn: dataService.deviceHistory,
  });
}

export function useMemory() {
  return useQuery<MemoryEntry[]>({ queryKey: ["memory"], queryFn: dataService.memory });
}

export function useMarketplace() {
  return useQuery<MarketplacePack[]>({ queryKey: ["marketplace"], queryFn: dataService.marketplace });
}

export function useTelemetrySeries(zoneId: string, hours = 24) {
  return useQuery<TelemetryPoint[]>({
    queryKey: ["telemetry-series", zoneId, hours],
    queryFn: () => dataService.telemetrySeries(zoneId, hours),
    enabled: Boolean(zoneId),
  });
}

export function useRecentTopicTelemetry(limit = 300) {
  return useQuery<TopicTelemetryRow[]>({
    queryKey: ["recent-topic-telemetry", limit],
    queryFn: () => dataService.recentTopicTelemetry(limit),
    refetchInterval: 5000,
  });
}

export function useTelemetrySensors() {
  return useQuery<{
    sensorTypes: string[];
    topics: string[];
    sensorKeys: string[];
  }>({ queryKey: ["telemetry-sensors"], queryFn: dataService.telemetrySensors });
}

export function useSensorHistory(sensorType: string, siteId?: string, limit = 100) {
  return useQuery<TopicTelemetryRow[]>({
    queryKey: ["sensor-history", sensorType, siteId, limit],
    queryFn: () => dataService.sensorHistory(sensorType, siteId, limit),
    enabled: Boolean(sensorType),
  });
}

export function useImportantActions(siteId?: string) {
  return useQuery<ImportantActionItem[]>({
    queryKey: ["important-actions", siteId || "all"],
    queryFn: () => dataService.importantActions(siteId),
    refetchInterval: 10000,
  });
}

export function useUpdateImportantActionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "open" | "in_progress" | "done";
    }) => dataService.updateImportantActionStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["important-actions"] });
    },
  });
}

export function useAssistantQuery() {
  return useMutation({
    mutationFn: (payload: {
      prompt: string;
      siteId?: string;
      capabilities?: AssistantCapabilitySet;
      createRule?: Record<string, unknown>;
      createAlert?: Record<string, unknown>;
      createPlan?: Record<string, unknown>;
    }) => dataService.assistantQuery(payload),
  });
}

export function useAssistantPlans(siteId?: string) {
  return useQuery<unknown[]>({
    queryKey: ["assistant-plans", siteId || "all"],
    queryFn: () => dataService.assistantPlans(siteId),
  });
}

export function useCreateAssistantTrigger() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      siteId: string;
      name: string;
      eventType: string;
      customPrompt: string;
      action: string;
      elseAction?: string;
    }) => dataService.createAssistantTrigger(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
      queryClient.invalidateQueries({ queryKey: ["assistant-plans"] });
    },
  });
}

export function useSettings() {
  return useQuery<Record<string, unknown>>({
    queryKey: ["settings"],
    queryFn: dataService.settings,
  });
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dataService.acknowledgeAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alert-history"] });
      queryClient.invalidateQueries({ queryKey: ["zones"] });
    },
  });
}

export function useToggleRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dataService.toggleRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
      queryClient.invalidateQueries({ queryKey: ["rule-history"] });
    },
  });
}

export function useCreateRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dataService.createRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
      queryClient.invalidateQueries({ queryKey: ["rule-history"] });
    },
  });
}

export function useCreateDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dataService.createDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      queryClient.invalidateQueries({ queryKey: ["device-history"] });
    },
  });
}

export function useUpdateDevicePrimarySensor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, sensorKey }: { id: string; sensorKey: string }) =>
      dataService.updateDevicePrimarySensor(id, sensorKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      queryClient.invalidateQueries({ queryKey: ["telemetry-series"] });
    },
  });
}

export function useUpdateDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        name?: string;
        type?: string;
        siteId?: string;
        status?: string;
        primarySensorKey?: string;
        sensors?: Device["sensors"];
        actuatorOutputs?: DeviceActuatorOutput[];
        metadata?: Record<string, unknown>;
      };
    }) => dataService.updateDevice(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["zones"] });
    },
  });
}

export function usePingDeviceSensorTopic() {
  return useMutation({
    mutationFn: ({
      id,
      sensorKey,
      mqttTopic,
      siteId,
    }: {
      id: string;
      sensorKey: string;
      mqttTopic?: string;
      siteId?: string;
    }) => dataService.pingDeviceSensorTopic(id, sensorKey, mqttTopic, siteId),
  });
}

export function useSendDeviceOledCommand() {
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        topic?: string;
        rotationSec?: number;
        brightness?: number;
        pages?: string[][];
      };
    }) => dataService.sendDeviceOledCommand(id, payload),
  });
}

export function useTriggerActuator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      sensorKey,
      payload,
    }: {
      id: string;
      sensorKey: string;
      payload: {
        command?: "on" | "off" | "toggle" | "set";
        value?: number;
        topic?: string;
        notifyPhone?: boolean;
      };
    }) => dataService.triggerActuator(id, sensorKey, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions"] });
      queryClient.invalidateQueries({ queryKey: ["important-actions"] });
    },
  });
}

export function useTriggerActuatorOutput() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      outputKey,
      payload,
    }: {
      id: string;
      outputKey: string;
      payload: {
        command?: "on" | "off" | "toggle" | "set";
        value?: number;
        topic?: string;
        notifyPhone?: boolean;
      };
    }) => dataService.triggerActuatorOutput(id, outputKey, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions"] });
      queryClient.invalidateQueries({ queryKey: ["important-actions"] });
    },
  });
}

export function useCreateAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dataService.createAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions"] });
      queryClient.invalidateQueries({ queryKey: ["zones"] });
    },
  });
}

export function useCreateZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dataService.createZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
    },
  });
}

export function useUpdateZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        name?: string;
        type?: Zone["type"];
        description?: string;
        crop?: string;
        targetTemp?: number;
        targetHumidity?: number;
        targetCo2?: number;
      };
    }) => dataService.updateZone(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
    },
  });
}

export function useDeleteZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dataService.deleteZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["telemetry-series"] });
    },
  });
}

export function useExecuteAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dataService.executeAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actions"] });
    },
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) =>
      dataService.updateSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useCreateMemoryEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dataService.createMemoryEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memory"] });
    },
  });
}

export function useDeleteDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dataService.deleteDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      queryClient.invalidateQueries({ queryKey: ["zones"] });
      queryClient.invalidateQueries({ queryKey: ["device-history"] });
    },
  });
}

export function useDeleteRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dataService.deleteRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rules"] });
      queryClient.invalidateQueries({ queryKey: ["rule-history"] });
    },
  });
}
