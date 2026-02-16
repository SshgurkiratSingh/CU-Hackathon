"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BrainCircuit, Camera, Plug, ShoppingCart, Sparkles } from "lucide-react";
import { useMarketplace } from "@/hooks/use-dashboard-data";
import { MarketplacePack } from "@/types";

function isCvCategory(category: string): boolean {
  const normalized = category.toLowerCase();
  return normalized.includes("vision") || normalized.includes("cv");
}

function isDecisionCategory(category: string): boolean {
  const normalized = category.toLowerCase();
  return normalized.includes("decision") || normalized.includes("policy") || normalized.includes("reason");
}

function isPluginCategory(category: string): boolean {
  const normalized = category.toLowerCase();
  return normalized.includes("plugin") || normalized.includes("extension") || normalized.includes("integration");
}

export default function MarketplacePage() {
  const { data, isLoading } = useMarketplace();
  const packs: MarketplacePack[] = data ?? [];

  const { cvModels, decisionModels, plugins } = useMemo(() => {
    const cv = packs.filter((pack) => isCvCategory(pack.category));
    const decision = packs.filter((pack) => isDecisionCategory(pack.category));
    const plugin = packs.filter((pack) => isPluginCategory(pack.category));
    return { cvModels: cv, decisionModels: decision, plugins: plugin };
  }, [packs]);

  const hasItems = cvModels.length > 0 || decisionModels.length > 0 || plugins.length > 0;
  const totalInstalls = packs.reduce((acc, pack) => acc + pack.installs, 0);

  return (
    <div className="min-h-screen space-y-6 bg-gradient-to-b from-slate-50 to-gray-50/80 p-6 md:p-8">
      <header className="flex flex-col gap-4 rounded-2xl border border-gray-200/70 bg-white/90 p-5 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-10 w-10">
            <Link href="/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">AI Marketplace</h1>
            <p className="text-sm text-muted-foreground mt-1">Browse and install CV models, decision models, and plugins.</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 font-medium text-blue-700">
                {cvModels.length} CV models
              </span>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                {decisionModels.length} decision models
              </span>
              <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 font-medium text-violet-700">
                {plugins.length} plugins
              </span>
              <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 font-medium text-gray-600">
                {totalInstalls.toLocaleString()} installs
              </span>
            </div>
          </div>
        </div>
        <Button><ShoppingCart className="h-4 w-4 mr-2" /> My Installs</Button>
      </header>

      {isLoading && (
        <Card className="rounded-xl border-gray-200/80 bg-white shadow-sm">
          <CardContent className="py-8 text-sm text-gray-500">Loading marketplace items...</CardContent>
        </Card>
      )}

      {!isLoading && (
        <div className="space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Computer Vision Models</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {cvModels.map((pack) => (
                <Card key={pack.id} className="rounded-xl border-blue-200/70 bg-gradient-to-br from-blue-50/60 to-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardHeader>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{pack.category}</Badge>
                      <span className="text-xs text-gray-500">⭐ {pack.rating}</span>
                    </div>
                    <CardTitle className="text-lg">{pack.name}</CardTitle>
                    <CardDescription>{pack.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-3 flex items-center justify-between text-sm text-gray-600">
                      <span>{pack.installs} installs</span>
                      <span className="inline-flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> Verified</span>
                    </div>
                    <Button className="w-full" variant="outline">Install Model</Button>
                  </CardContent>
                </Card>
              ))}
              {cvModels.length === 0 && (
                <Card className="rounded-xl border-gray-200/80 bg-white md:col-span-2 xl:col-span-3">
                  <CardContent className="py-8 text-sm text-gray-500">No Computer Vision models published yet.</CardContent>
                </Card>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-emerald-600" />
              <h2 className="text-xl font-semibold text-gray-900">Decision Models</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {decisionModels.map((pack) => (
                <Card key={pack.id} className="rounded-xl border-emerald-200/70 bg-gradient-to-br from-emerald-50/60 to-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardHeader>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">{pack.category}</Badge>
                      <span className="text-xs text-gray-500">⭐ {pack.rating}</span>
                    </div>
                    <CardTitle className="text-lg">{pack.name}</CardTitle>
                    <CardDescription>{pack.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-3 flex items-center justify-between text-sm text-gray-600">
                      <span>{pack.installs} installs</span>
                      <span className="inline-flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> Verified</span>
                    </div>
                    <Button className="w-full" variant="outline">Install Model</Button>
                  </CardContent>
                </Card>
              ))}
              {decisionModels.length === 0 && (
                <Card className="rounded-xl border-gray-200/80 bg-white md:col-span-2 xl:col-span-3">
                  <CardContent className="py-8 text-sm text-gray-500">No Decision models published yet.</CardContent>
                </Card>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Plug className="h-5 w-5 text-violet-600" />
              <h2 className="text-xl font-semibold text-gray-900">Plugins</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {plugins.map((pack) => (
                <Card key={pack.id} className="rounded-xl border-violet-200/70 bg-gradient-to-br from-violet-50/60 to-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardHeader>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">{pack.category}</Badge>
                      <span className="text-xs text-gray-500">⭐ {pack.rating}</span>
                    </div>
                    <CardTitle className="text-lg">{pack.name}</CardTitle>
                    <CardDescription>{pack.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-3 flex items-center justify-between text-sm text-gray-600">
                      <span>{pack.installs} installs</span>
                      <span className="inline-flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> Verified</span>
                    </div>
                    <Button className="w-full" variant="outline">Install Plugin</Button>
                  </CardContent>
                </Card>
              ))}
              {plugins.length === 0 && (
                <Card className="rounded-xl border-gray-200/80 bg-white md:col-span-2 xl:col-span-3">
                  <CardContent className="py-8 text-sm text-gray-500">No plugins published yet.</CardContent>
                </Card>
              )}
            </div>
          </section>

          {!hasItems && (
            <Card className="rounded-xl border-gray-200/80 bg-white shadow-sm">
              <CardContent className="py-8 text-sm text-gray-500">No marketplace items available yet.</CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
