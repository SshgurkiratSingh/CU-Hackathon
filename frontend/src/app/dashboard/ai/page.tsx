"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Bot, Lightbulb, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { PageLayout } from "@/components/dashboard/PageLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  useAssistantPlans,
  useAssistantQuery,
  useCreateAssistantTrigger,
  useImportantActions,
  useZones,
} from "@/hooks/use-dashboard-data";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type AnalyzeResponse = {
  data?: {
    analysis?: string;
  };
};

type DecideResponse = {
  data?: {
    decision?: string;
  };
};

const suggestions = [
  "Reduce humidity in Drying Vault by increasing dehumidifier runtime to 70% for 20 minutes.",
  "Apply 5-minute extraction pulse in Vegetative Room A every 30 minutes during heat peak.",
  "Lower mist cycle frequency in Propagation Station to avoid over-saturation.",
];

export default function AiPage() {
  const { data: zones = [] } = useZones();
  const defaultZone = zones[0]?.id || "default";
  const [siteId, setSiteId] = useState(defaultZone);
  const [prompt, setPrompt] = useState("");
  const [generatedSuggestions, setGeneratedSuggestions] =
    useState<string[]>(suggestions);
  const [assistantResponse, setAssistantResponse] = useState("");
  const [capabilities, setCapabilities] = useState({
    useAI: true,
    accessDevices: true,
    accessTopics: true,
    accessTelemetry: true,
    createRules: true,
    createPlans: true,
    createAlerts: true,
  });
  const [triggerEventType, setTriggerEventType] = useState("telemetry");
  const [triggerPrompt, setTriggerPrompt] = useState("");
  const [triggerAction, setTriggerAction] = useState(
    "Create high-priority alert",
  );

  const assistantQueryMutation = useAssistantQuery();
  const triggerMutation = useCreateAssistantTrigger();
  const { data: importantActions = [] } = useImportantActions(siteId);
  const { data: assistantPlans = [] } = useAssistantPlans(siteId);

  const analyzeMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await api.post<AnalyzeResponse>("/ai/analyze", {
        condition: text,
        context: "dashboard",
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (
        typeof data?.data?.analysis === "string" &&
        data.data.analysis.length > 0
      ) {
        setGeneratedSuggestions([
          data.data.analysis,
          ...suggestions.slice(0, 2),
        ]);
      }
    },
    onError: () => {
      const fallback = prompt.trim()
        ? [`Fallback recommendation for: ${prompt}`, ...suggestions.slice(0, 2)]
        : suggestions;
      setGeneratedSuggestions(fallback);
    },
  });

  const draftRuleMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await api.post<DecideResponse>("/ai/decide", {
        condition: text,
        options: ["irrigation", "ventilation", "lighting"],
        farm_id: "default",
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data?.data?.decision) {
        setGeneratedSuggestions([
          `Draft recommendation: ${data.data.decision}`,
          ...generatedSuggestions.slice(0, 2),
        ]);
        return;
      }

      setGeneratedSuggestions([
        "Draft rule generated. Review and convert into automation in Rules module.",
        ...generatedSuggestions.slice(0, 2),
      ]);
    },
    onError: () => {
      setGeneratedSuggestions([
        "Draft rule unavailable from API. You can still create one manually in Rule Builder.",
        ...generatedSuggestions.slice(0, 2),
      ]);
    },
  });

  const runAssistant = () => {
    assistantQueryMutation.mutate(
      {
        prompt,
        siteId,
        capabilities,
        createPlan: {
          enabled: true,
        },
      },
      {
        onSuccess: (data) => {
          setAssistantResponse(data.assistantText);
        },
      },
    );
  };

  const createEventTrigger = () => {
    if (!siteId || !triggerPrompt.trim() || !triggerAction.trim()) return;
    triggerMutation.mutate({
      siteId,
      name: `AI Trigger ${new Date().toLocaleTimeString()}`,
      eventType: triggerEventType,
      customPrompt: triggerPrompt,
      action: triggerAction,
      elseAction: "No action",
    });
  };

  return (
    <PageLayout>
      <PageHeader
        title="AI Control Assistant"
        description="Generate recommendations and automated actions."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" /> Ask the Assistant
          </CardTitle>
          <CardDescription>
            Assistant can access devices, topics, telemetry, rules and alerts,
            then create plans/actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-4">
            <Select
              value={siteId}
              onChange={(event) => setSiteId(event.target.value)}
            >
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </Select>
            {(
              [
                ["useAI", "Use AI"],
                ["accessTelemetry", "Telemetry"],
                ["createRules", "Rules"],
                ["createAlerts", "Alerts"],
              ] as const
            ).map(([key, label]) => (
              <Button
                key={key}
                variant={capabilities[key] ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setCapabilities((prev) => ({ ...prev, [key]: !prev[key] }))
                }
              >
                {label}
              </Button>
            ))}
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Example: optimize Zone 004 for drying quality over next 4 hours"
            className="min-h-28"
          />
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={runAssistant}
              disabled={assistantQueryMutation.isPending || !prompt.trim()}
            >
              {assistantQueryMutation.isPending
                ? "Running..."
                : "Assistant Query"}
            </Button>
            <Button
              onClick={() => analyzeMutation.mutate(prompt)}
              disabled={analyzeMutation.isPending || !prompt.trim()}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {analyzeMutation.isPending ? "Analyzing..." : "Analyze"}
            </Button>
            <Button
              variant="outline"
              onClick={() => draftRuleMutation.mutate(prompt)}
              disabled={draftRuleMutation.isPending || !prompt.trim()}
            >
              {draftRuleMutation.isPending
                ? "Drafting..."
                : "Generate Rule Draft"}
            </Button>
          </div>
          {assistantResponse ? (
            <div className="rounded-md border bg-slate-50 p-3 text-sm text-slate-700">
              {assistantResponse}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assistant Event Trigger</CardTitle>
          <CardDescription>
            Run a custom prompt when a specific event occurs, and execute
            action/notification flow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <Select
              value={triggerEventType}
              onChange={(event) => setTriggerEventType(event.target.value)}
            >
              <option value="telemetry">Telemetry</option>
              <option value="alert">Alert</option>
              <option value="issue">Issue</option>
              <option value="timer">Timer</option>
            </Select>
            <Input
              value={triggerAction}
              onChange={(event) => setTriggerAction(event.target.value)}
              placeholder="Action to execute"
            />
            <Button
              onClick={createEventTrigger}
              disabled={triggerMutation.isPending}
            >
              {triggerMutation.isPending ? "Saving..." : "Save Trigger"}
            </Button>
          </div>
          <Textarea
            value={triggerPrompt}
            onChange={(event) => setTriggerPrompt(event.target.value)}
            placeholder="Custom prompt to call when this event occurs"
            className="min-h-20"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" /> Suggested Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {generatedSuggestions.map((item, idx) => (
            <div
              key={idx}
              className="rounded-md border bg-white p-3 text-sm text-gray-700"
            >
              {item}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Important Actions Queue</CardTitle>
          <CardDescription>
            Engine-detected high priority actions requiring attention.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {importantActions.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="rounded-md border bg-white p-3 text-sm"
            >
              <p className="font-medium">{item.title}</p>
              <p className="text-gray-600">{item.message}</p>
            </div>
          ))}
          {importantActions.length === 0 ? (
            <div className="text-sm text-gray-500">
              No pending important actions.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assistant Plans</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {assistantPlans.slice(0, 5).map((plan, idx) => (
            <pre
              key={idx}
              className="overflow-auto rounded-md border bg-slate-50 p-2 text-xs"
            >
              {JSON.stringify(plan, null, 2)}
            </pre>
          ))}
          {assistantPlans.length === 0 ? (
            <div className="text-sm text-gray-500">
              No assistant plans saved yet.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
