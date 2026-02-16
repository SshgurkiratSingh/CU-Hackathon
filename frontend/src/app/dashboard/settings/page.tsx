"use client";

import Link from "next/link";
import { ArrowLeft, Bell, Shield, SlidersHorizontal, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-10 w-10">
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">System Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure alerts, safety thresholds, and operator preferences.
            </p>
          </div>
        </div>
        <Button>
          <Save className="h-4 w-4 mr-2" /> Save Changes
        </Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Bell className="h-5 w-5" /> Alerting
            </CardTitle>
            <CardDescription>Notification channels and escalation policy.</CardDescription>
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
            <CardDescription>Fallback limits for zones without custom rules.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div>
              <label className="mb-1 block text-sm text-gray-600">Temperature Warning (°C)</label>
              <input defaultValue={28} type="number" className="w-full rounded-md border bg-white px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">Humidity Warning (%)</label>
              <input defaultValue={65} type="number" className="w-full rounded-md border bg-white px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-600">CO2 Warning (ppm)</label>
              <input defaultValue={1200} type="number" className="w-full rounded-md border bg-white px-3 py-2 text-sm" />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-5 w-5" /> Safety Controls
            </CardTitle>
            <CardDescription>Global protection settings for emergency handling.</CardDescription>
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
    </div>
  );
}
