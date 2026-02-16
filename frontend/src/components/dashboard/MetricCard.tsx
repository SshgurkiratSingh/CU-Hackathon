
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  className?: string;
}

export function MetricCard({ title, value, unit, trend, trendValue, className }: MetricCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {trend === "up" && <ArrowUp className="h-4 w-4 text-green-500" />}
        {trend === "down" && <ArrowDown className="h-4 w-4 text-red-500" />}
        {trend === "stable" && <Minus className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
          {unit && <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>}
        </div>
        {trendValue && (
          <p className="text-xs text-muted-foreground mt-1">
            {trend === "up" ? "+" : trend === "down" ? "-" : ""}{trendValue} from last hour
          </p>
        )}
      </CardContent>
    </Card>
  );
}
