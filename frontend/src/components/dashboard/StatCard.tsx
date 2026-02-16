import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  accentClassName?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  accentClassName,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "border border-border bg-card text-card-foreground",
        accentClassName,
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <span className="text-2xl font-bold">{value}</span>
        {Icon ? <Icon className="h-5 w-5 text-muted-foreground" /> : null}
      </CardContent>
    </Card>
  );
}
