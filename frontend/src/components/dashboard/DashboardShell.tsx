"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Activity,
  Bell,
  Bot,
  BrainCircuit,
  Cpu,
  Database,
  Gauge,
  LayoutGrid,
  Logs,
  Map,
  Monitor,
  Radio,
  Settings,
  ShoppingBag,
  Workflow,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useWebSocket } from "@/hooks/use-websocket";

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/telemetry", label: "Telemetry", icon: Gauge },
  { href: "/dashboard/topics", label: "Live Topics", icon: Radio },
  { href: "/dashboard/devices", label: "Devices", icon: Cpu },
  { href: "/dashboard/zones", label: "Zones", icon: Map },
  { href: "/dashboard/rules", label: "Rules", icon: Workflow },
  { href: "/dashboard/actions", label: "Actions", icon: Activity },
  { href: "/dashboard/logs", label: "Logs", icon: Logs },
  { href: "/dashboard/alerts", label: "Alerts", icon: Bell },
  { href: "/dashboard/ai", label: "AI Assistant", icon: BrainCircuit },
  { href: "/dashboard/memory", label: "Memory", icon: Database },
  { href: "/dashboard/marketplace", label: "Marketplace", icon: ShoppingBag },
  { href: "/dashboard/kiosk", label: "Kiosk", icon: Monitor },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { status } = useWebSocket({ autoConnect: true });
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("dashboard.sidebar.collapsed");
    if (saved === "1") {
      setIsCollapsed(true);
    }
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "dashboard.sidebar.collapsed",
          next ? "1" : "0",
        );
      }
      return next;
    });
  };

  return (
    <div className="dashboard-theme min-h-screen bg-gray-50 dark:bg-slate-950 dark:text-slate-100">
      <div
        className={cn(
          "mx-auto grid max-w-400 grid-cols-1",
          isCollapsed ? "lg:grid-cols-[84px_1fr]" : "lg:grid-cols-[260px_1fr]",
        )}
      >
        <aside className="border-r bg-white p-4 lg:sticky lg:top-0 lg:h-screen dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              onClick={toggleSidebar}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-gray-600 hover:bg-gray-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className="mb-4 rounded-lg border bg-linear-to-br from-emerald-50 to-white p-4 dark:border-slate-700 dark:from-emerald-950/30 dark:to-slate-900">
            {!isCollapsed ? (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                  Greenhouse OS
                </p>
                <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-slate-100">
                  Control Console
                </h2>
              </>
            ) : null}
            <p className="mt-2 inline-flex items-center gap-2 rounded-md bg-white px-2.5 py-1 text-xs text-gray-600 ring-1 ring-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
              <Bot className="h-3.5 w-3.5" />
              {!isCollapsed ? `WS: ${status}` : status}
            </p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    isCollapsed && "justify-center px-2",
                    active
                      ? "bg-slate-900 text-white"
                      : "text-gray-700 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800",
                  )}
                  title={item.label}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      active
                        ? "text-white"
                        : "text-gray-500 group-hover:text-gray-700 dark:text-slate-400 dark:group-hover:text-slate-200",
                    )}
                  />
                  {!isCollapsed ? item.label : null}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}
