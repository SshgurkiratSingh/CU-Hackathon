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
  const [prompt, setPrompt] = useState("");
  const [generatedSuggestions, setGeneratedSuggestions] =
    useState<string[]>(suggestions);

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
            Integrated with AI analyze/decide endpoints, with fallback behavior.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Example: optimize Zone 004 for drying quality over next 4 hours"
            className="min-h-28"
          />
          <div className="flex gap-2">
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
    </PageLayout>
  );
}
