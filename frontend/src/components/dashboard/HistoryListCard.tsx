import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/EmptyState";

export interface HistoryListItem {
  id: string;
  title: string;
  subtitle?: string;
  timestamp: string;
  tone?: "default" | "success" | "warning" | "error";
}

function toneClasses(tone: HistoryListItem["tone"]) {
  if (tone === "success") return "border-green-200 bg-green-50/40";
  if (tone === "warning") return "border-amber-200 bg-amber-50/40";
  if (tone === "error") return "border-red-200 bg-red-50/40";
  return "border-gray-200 bg-white";
}

interface HistoryListCardProps {
  title: string;
  description: string;
  items: HistoryListItem[];
  emptyTitle: string;
  emptyDescription: string;
}

export function HistoryListCard({
  title,
  description,
  items,
  emptyTitle,
  emptyDescription,
}: HistoryListCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              className={`rounded-md border p-3 ${toneClasses(item.tone)}`}
            >
              <p className="text-sm font-medium text-gray-900">{item.title}</p>
              {item.subtitle ? (
                <p className="mt-0.5 text-xs text-gray-600">{item.subtitle}</p>
              ) : null}
              <p className="mt-1 text-[11px] uppercase tracking-wide text-gray-500">
                {item.timestamp}
              </p>
            </div>
          ))
        ) : (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        )}
      </CardContent>
    </Card>
  );
}
