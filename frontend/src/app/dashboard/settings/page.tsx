"use client";

import {
  Bell,
  Paintbrush,
  Shield,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageLayout } from "@/components/dashboard/PageLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useUiPreferences } from "@/components/ui-preferences-provider";
import type {
  AccentPreference,
  BackgroundPreference,
  DensityPreference,
  ThemePreference,
} from "@/lib/ui-preferences";

export default function SettingsPage() {
  const { preferences, updatePreferences, resetPreferences } =
    useUiPreferences();

  return (
    <PageLayout>
      <PageHeader
        title="System Settings"
        description="Configure alerts, safety thresholds, and operator preferences."
        actions={
          <Button variant="outline" onClick={resetPreferences}>
            <RotateCcw className="h-4 w-4 mr-2" /> Reset UI Preferences
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Paintbrush className="h-5 w-5" /> UI Customization
            </CardTitle>
            <CardDescription>
              Personalize dashboard theme, density, and accent color.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-gray-600">Theme</label>
              <Select
                value={preferences.theme}
                onChange={(e) =>
                  updatePreferences({
                    theme: e.target.value as ThemePreference,
                  })
                }
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-600">
                Display Density
              </label>
              <Select
                value={preferences.density}
                onChange={(e) =>
                  updatePreferences({
                    density: e.target.value as DensityPreference,
                  })
                }
              >
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-600">
                Accent Color
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(
                  [
                    {
                      value: "emerald",
                      className: "bg-emerald-500",
                      label: "Emerald",
                    },
                    {
                      value: "violet",
                      className: "bg-violet-500",
                      label: "Violet",
                    },
                    { value: "sky", className: "bg-sky-500", label: "Sky" },
                    { value: "rose", className: "bg-rose-500", label: "Rose" },
                  ] as const
                ).map((accent) => (
                  <button
                    key={accent.value}
                    type="button"
                    title={accent.label}
                    onClick={() =>
                      updatePreferences({
                        accent: accent.value as AccentPreference,
                      })
                    }
                    className={`h-9 rounded-md border-2 ${accent.className} ${
                      preferences.accent === accent.value
                        ? "border-gray-900"
                        : "border-transparent"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm text-gray-600">
                Background Style
              </label>
              <Select
                value={preferences.background}
                onChange={(e) =>
                  updatePreferences({
                    background: e.target.value as BackgroundPreference,
                  })
                }
              >
                <option value="plain">Plain</option>
                <option value="back1">Back 1</option>
                <option value="back2">Back 2</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Bell className="h-5 w-5" /> Alerting
            </CardTitle>
            <CardDescription>
              Notification channels and escalation policy.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center justify-between rounded-md border bg-white p-3 text-sm">
              <span>Email alerts enabled</span>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </label>
            <label className="flex items-center justify-between rounded-md border bg-white p-3 text-sm">
              <span>SMS for critical alarms</span>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </label>
            <label className="flex items-center justify-between rounded-md border bg-white p-3 text-sm">
              <span>Suppress non-critical at night</span>
              <input type="checkbox" className="h-4 w-4" />
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <SlidersHorizontal className="h-5 w-5" /> Default Thresholds
            </CardTitle>
            <CardDescription>
              Fallback limits for zones without custom rules.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div>
              <label className="mb-1 block text-sm text-gray-600">
                Temperature Warning (°C)
              </label>
              <Input defaultValue={28} type="number" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">
                Humidity Warning (%)
              </label>
              <Input defaultValue={65} type="number" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">
                CO2 Warning (ppm)
              </label>
              <Input defaultValue={1200} type="number" />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-5 w-5" /> Safety Controls
            </CardTitle>
            <CardDescription>
              Global protection settings for emergency handling.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center justify-between rounded-md border bg-white p-3 text-sm">
              <span>Require confirmation for emergency stop</span>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </label>
            <label className="flex items-center justify-between rounded-md border bg-white p-3 text-sm">
              <span>Auto-disable irrigation on leak alert</span>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </label>
            <label className="flex items-center justify-between rounded-md border bg-white p-3 text-sm">
              <span>Fail-safe ventilation on controller loss</span>
              <input type="checkbox" defaultChecked className="h-4 w-4" />
            </label>
            <label className="flex items-center justify-between rounded-md border bg-white p-3 text-sm">
              <span>Allow remote override outside schedule</span>
              <input type="checkbox" className="h-4 w-4" />
            </label>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
