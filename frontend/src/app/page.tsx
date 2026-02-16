import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Leaf,
  Thermometer,
} from "lucide-react";
import { mockZones } from "@/lib/mock-data";

export default function Home() {
  const zoneCount = mockZones.length;
  const criticalCount = mockZones.filter((z) => z.status === "critical").length;
  const warningCount = mockZones.filter((z) => z.status === "warning").length;
  const avgTemp =
    mockZones.reduce((acc, z) => acc + z.metrics.temp.value, 0) /
    (zoneCount || 1);

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-sky-50">
      <section className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-100/70 px-3 py-1 text-xs font-semibold text-emerald-800">
            <Leaf className="h-3.5 w-3.5" />
            Greenhouse Control System
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            Live Monitoring Active
          </div>
        </div>

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">
          Monitor every zone. React in real time. Keep crops safe.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-gray-600 md:text-lg">
          Unified telemetry, alerting, and device control for modern multi-zone
          greenhouse operations.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Open Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/debug/mock"
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Open Simulator
          </Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="mb-2 inline-flex rounded-lg bg-emerald-100 p-2 text-emerald-700">
              <Leaf className="h-4 w-4" />
            </div>
            <p className="text-sm text-gray-500">Active Zones</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{zoneCount}</p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="mb-2 inline-flex rounded-lg bg-blue-100 p-2 text-blue-700">
              <Thermometer className="h-4 w-4" />
            </div>
            <p className="text-sm text-gray-500">Average Temperature</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {avgTemp.toFixed(1)}°C
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="mb-2 inline-flex rounded-lg bg-amber-100 p-2 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <p className="text-sm text-gray-500">Warning Zones</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {warningCount}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="mb-2 inline-flex rounded-lg bg-red-100 p-2 text-red-700">
              <Activity className="h-4 w-4" />
            </div>
            <p className="text-sm text-gray-500">Critical Zones</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {criticalCount}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
