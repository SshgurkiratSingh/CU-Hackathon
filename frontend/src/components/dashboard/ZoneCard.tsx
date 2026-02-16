"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zone } from "@/types";
import { Thermometer, Droplets, Lightbulb, Sprout } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ZoneCardProps {
  zone: Zone;
}

export function ZoneCard({ zone }: ZoneCardProps) {
  // Determine gradient based on status
  const gradient =
    zone.status === "optimal"
      ? "bg-gradient-to-br from-green-50 to-white border-green-200 dark:from-green-950/35 dark:to-slate-900 dark:border-green-900/70"
      : zone.status === "warning"
        ? "bg-gradient-to-br from-yellow-50 to-white border-yellow-200 dark:from-yellow-950/35 dark:to-slate-900 dark:border-yellow-900/70"
        : "bg-gradient-to-br from-red-50 to-white border-red-200 dark:from-red-950/35 dark:to-slate-900 dark:border-red-900/70";

  const statusColor =
    zone.status === "optimal"
      ? "bg-green-100 text-green-800"
      : zone.status === "warning"
        ? "bg-yellow-100 text-yellow-800"
        : "bg-red-100 text-red-800";

  const statusDot =
    zone.status === "optimal"
      ? "bg-green-500"
      : zone.status === "warning"
        ? "bg-yellow-500"
        : "bg-red-500";

  return (
    <Card
      className={`border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${gradient}`}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-gray-900 dark:text-slate-100">
          <Sprout className="w-5 h-5 text-green-600 dark:text-green-400" />
          {zone.name}
        </CardTitle>
        <Badge
          className={`inline-flex items-center gap-1.5 ${statusColor}`}
          variant="outline"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`}></span>
          {zone.status.toUpperCase()}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50/60 px-2.5 py-2 text-gray-700 dark:border-blue-900/70 dark:bg-blue-950/30 dark:text-slate-200">
            <Thermometer className="w-4 h-4 text-blue-500" />
            <span className="font-semibold">
              {zone.metrics.temp.value}
              {zone.metrics.temp.unit}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-cyan-100 bg-cyan-50/60 px-2.5 py-2 text-gray-700 dark:border-cyan-900/70 dark:bg-cyan-950/30 dark:text-slate-200">
            <Droplets className="w-4 h-4 text-blue-400" />
            <span className="font-semibold">
              {zone.metrics.humidity.value}
              {zone.metrics.humidity.unit}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-amber-100 bg-amber-50/70 px-2.5 py-2 text-gray-700 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-slate-200">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            <span className="font-semibold">
              {zone.metrics.light.value}
              {zone.metrics.light.unit}
            </span>
          </div>
          <div className="col-span-2 mt-1 flex items-center text-xs text-gray-500 dark:text-slate-400">
            Updated: {new Date(zone.lastUpdated).toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Link href={`/dashboard/zones/${zone.id}`} className="w-full">
          <Button className="w-full" variant="outline" size="sm">
            Manage Zone
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
