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
      ? "bg-gradient-to-br from-green-50 to-white border-green-200"
      : zone.status === "warning"
        ? "bg-gradient-to-br from-yellow-50 to-white border-yellow-200"
        : "bg-gradient-to-br from-red-50 to-white border-red-200";

  const statusColor =
    zone.status === "optimal"
      ? "bg-green-100 text-green-800"
      : zone.status === "warning"
        ? "bg-yellow-100 text-yellow-800"
        : "bg-red-100 text-red-800";

  return (
    <Card
      className={`hover:shadow-md transition-shadow duration-200 ${gradient}`}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sprout className="w-5 h-5 text-green-600" />
          {zone.name}
        </CardTitle>
        <Badge className={statusColor} variant="outline">
          {zone.status.toUpperCase()}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm mt-2">
          <div className="flex items-center gap-2 text-gray-700">
            <Thermometer className="w-4 h-4 text-blue-500" />
            <span className="font-semibold">
              {zone.metrics.temp.value}
              {zone.metrics.temp.unit}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Droplets className="w-4 h-4 text-blue-400" />
            <span className="font-semibold">
              {zone.metrics.humidity.value}
              {zone.metrics.humidity.unit}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            <span className="font-semibold">
              {zone.metrics.light.value}
              {zone.metrics.light.unit}
            </span>
          </div>
          <div className="text-gray-500 text-xs flex items-center col-span-2 mt-2">
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
