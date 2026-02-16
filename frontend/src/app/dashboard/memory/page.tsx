"use client";

import Link from "next/link";
import { useMemory, useZones } from "@/hooks/use-dashboard-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Database, History, TrendingUp } from "lucide-react";

export default function MemoryPage() {
  const { data: memoryItems = [], isLoading } = useMemory();
  const { data: zones = [] } = useZones();

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
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Memory System
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Historical insights and learned behavior snapshots
              {isLoading ? " (loading...)" : ""}.
            </p>
          </div>
        </div>
        <Button>Generate New Summary</Button>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Knowledge Entries
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-bold">{memoryItems.length}</span>
            <Database className="h-5 w-5 text-indigo-600" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Zones Indexed
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-bold">{zones.length}</span>
            <History className="h-5 w-5 text-slate-600" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Trend Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <span className="text-2xl font-bold">91%</span>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Memory Entries</CardTitle>
          <CardDescription>
            Used by AI decisions and automation recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {memoryItems.map((entry) => {
            const zone = zones.find((z) => z.id === entry.zoneId);
            return (
              <div key={entry.id} className="rounded-lg border bg-white p-4">
                <p className="text-sm text-gray-500 mb-1">
                  {zone?.name ?? "Unknown Zone"} • {entry.createdAt}
                </p>
                <p className="text-gray-900">{entry.summary}</p>
                <p className="mt-2 text-xs text-gray-600">
                  Confidence: {(entry.confidence * 100).toFixed(0)}%
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
