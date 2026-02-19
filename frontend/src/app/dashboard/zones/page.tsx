"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageLayout } from "@/components/dashboard/PageLayout";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { StatCard } from "@/components/dashboard/StatCard";
import {
  useCreateZone,
  useDeleteZone,
  useUpdateZone,
  useZones,
} from "@/hooks/use-dashboard-data";
import type { Zone } from "@/types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ZoneDraft = {
  siteId: string;
  name: string;
  type: string;
  description: string;
  crop: string;
  targetTemp: string;
  targetHumidity: string;
  targetCo2: string;
};

const DEFAULT_DRAFT: ZoneDraft = {
  siteId: "",
  name: "",
  type: "vegetative",
  description: "",
  crop: "",
  targetTemp: "",
  targetHumidity: "",
  targetCo2: "",
};

function parseOptionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toDraft(zone: Zone): ZoneDraft {
  return {
    siteId: zone.id,
    name: zone.name,
    type: zone.type,
    description: zone.description || "",
    crop: zone.crop || "",
    targetTemp: zone.targets?.temp?.toString() || "",
    targetHumidity: zone.targets?.humidity?.toString() || "",
    targetCo2: zone.targets?.co2?.toString() || "",
  };
}

export default function ZonesManagementPage() {
  const { data: zones = [], isLoading } = useZones();
  const createZoneMutation = useCreateZone();
  const updateZoneMutation = useUpdateZone();
  const deleteZoneMutation = useDeleteZone();

  const [draft, setDraft] = useState<ZoneDraft>(DEFAULT_DRAFT);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<ZoneDraft>(DEFAULT_DRAFT);

  const customTypeCount = useMemo(
    () =>
      zones.filter(
        (zone) =>
          ![
            "propagation",
            "vegetative",
            "flowering",
            "drying",
            "curing",
          ].includes(zone.type),
      ).length,
    [zones],
  );

  const zoneTypeDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    zones.forEach((zone) => {
      counts.set(zone.type, (counts.get(zone.type) || 0) + 1);
    });
    const palette = ["#2563eb", "#7c3aed", "#16a34a", "#d97706", "#dc2626", "#0f766e"];
    return Array.from(counts.entries()).map(([name, value], index) => ({
      name,
      value,
      color: palette[index % palette.length],
    }));
  }, [zones]);

  const zoneMetricsComparison = useMemo(() => {
    return zones.slice(0, 10).map((zone) => ({
      zone: zone.name,
      temp: Number(zone.metrics.temp.value || 0),
      humidity: Number(zone.metrics.humidity.value || 0),
    }));
  }, [zones]);

  const handleCreate = () => {
    if (!draft.siteId.trim() || !draft.name.trim()) return;
    createZoneMutation.mutate(
      {
        siteId: draft.siteId.trim(),
        name: draft.name.trim(),
        type: draft.type.trim() || "vegetative",
        description: draft.description.trim() || undefined,
        crop: draft.crop.trim() || undefined,
        targetTemp: parseOptionalNumber(draft.targetTemp),
        targetHumidity: parseOptionalNumber(draft.targetHumidity),
        targetCo2: parseOptionalNumber(draft.targetCo2),
      },
      {
        onSuccess: () => setDraft(DEFAULT_DRAFT),
      },
    );
  };

  const startEdit = (zone: Zone) => {
    setEditingZoneId(zone.id);
    setEditingDraft(toDraft(zone));
  };

  const saveEdit = () => {
    if (!editingZoneId) return;
    updateZoneMutation.mutate(
      {
        id: editingZoneId,
        payload: {
          name: editingDraft.name.trim(),
          type: editingDraft.type.trim() || "vegetative",
          description: editingDraft.description.trim() || undefined,
          crop: editingDraft.crop.trim() || undefined,
          targetTemp: parseOptionalNumber(editingDraft.targetTemp),
          targetHumidity: parseOptionalNumber(editingDraft.targetHumidity),
          targetCo2: parseOptionalNumber(editingDraft.targetCo2),
        },
      },
      {
        onSuccess: () => {
          setEditingZoneId(null);
          setEditingDraft(DEFAULT_DRAFT);
        },
      },
    );
  };

  return (
    <PageLayout>
      <PageHeader
        title="Zone Management"
        description={`Create, edit, and delete zones with custom types${isLoading ? " (loading...)" : ""}.`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Zones" value={zones.length} />
        <StatCard title="Custom Types" value={customTypeCount} />
        <StatCard
          title="Default Types"
          value={zones.length - customTypeCount}
          accentClassName="border-sky-200/70 bg-sky-50/40"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Zone Type Distribution</CardTitle>
            <CardDescription>
              Breakdown of configured greenhouse zone types.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              {zoneTypeDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={zoneTypeDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      label
                    >
                      {zoneTypeDistribution.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No zones available for visualization.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Temp/Humidity by Zone</CardTitle>
            <CardDescription>
              Quick comparison of primary climate metrics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              {zoneMetricsComparison.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={zoneMetricsComparison} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="zone" fontSize={11} tickLine={false} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="temp" fill="#2563eb" radius={[5, 5, 0, 0]} />
                    <Bar dataKey="humidity" fill="#06b6d4" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No metrics available yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Zone</CardTitle>
          <CardDescription>
            Use default types or any custom type (for example nursery, lab,
            mother-room).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Input
            value={draft.siteId}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, siteId: e.target.value }))
            }
            placeholder="Zone ID (siteId)"
          />
          <Input
            value={draft.name}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Zone name"
          />
          <Input
            value={draft.type}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, type: e.target.value }))
            }
            placeholder="Type (custom allowed)"
          />
          <Input
            value={draft.crop}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, crop: e.target.value }))
            }
            placeholder="Crop"
          />
          <Input
            value={draft.targetTemp}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, targetTemp: e.target.value }))
            }
            placeholder="Target temp"
            type="number"
          />
          <Input
            value={draft.targetHumidity}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, targetHumidity: e.target.value }))
            }
            placeholder="Target humidity"
            type="number"
          />
          <Input
            value={draft.targetCo2}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, targetCo2: e.target.value }))
            }
            placeholder="Target CO2"
            type="number"
          />
          <Input
            value={draft.description}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Description"
          />
          <div className="md:col-span-4 flex justify-end">
            <Button
              onClick={handleCreate}
              disabled={createZoneMutation.isPending}
            >
              {createZoneMutation.isPending ? "Creating..." : "Create Zone"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zones</CardTitle>
          <CardDescription>Edit or delete existing zones.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {zones.length === 0 ? (
            <EmptyState
              title="No zones"
              description="Create your first zone above."
            />
          ) : (
            zones.map((zone) => {
              const isEditing = editingZoneId === zone.id;
              const current = isEditing ? editingDraft : toDraft(zone);

              return (
                <div key={zone.id} className="rounded-lg border bg-white p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{zone.name}</p>
                      <p className="text-xs text-gray-500">ID: {zone.id}</p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {zone.type}
                    </Badge>
                  </div>

                  <div className="grid gap-3 md:grid-cols-4">
                    <Input
                      value={current.name}
                      onChange={(e) =>
                        setEditingDraft((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      placeholder="Name"
                    />
                    <Input
                      value={current.type}
                      onChange={(e) =>
                        setEditingDraft((prev) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      placeholder="Type"
                    />
                    <Input
                      value={current.crop}
                      onChange={(e) =>
                        setEditingDraft((prev) => ({
                          ...prev,
                          crop: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      placeholder="Crop"
                    />
                    <Input
                      value={current.description}
                      onChange={(e) =>
                        setEditingDraft((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      placeholder="Description"
                    />
                    <Input
                      value={current.targetTemp}
                      onChange={(e) =>
                        setEditingDraft((prev) => ({
                          ...prev,
                          targetTemp: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      type="number"
                      placeholder="Target temp"
                    />
                    <Input
                      value={current.targetHumidity}
                      onChange={(e) =>
                        setEditingDraft((prev) => ({
                          ...prev,
                          targetHumidity: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      type="number"
                      placeholder="Target humidity"
                    />
                    <Input
                      value={current.targetCo2}
                      onChange={(e) =>
                        setEditingDraft((prev) => ({
                          ...prev,
                          targetCo2: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      type="number"
                      placeholder="Target CO2"
                    />
                  </div>

                  <div className="mt-3 flex justify-end gap-2">
                    {!isEditing ? (
                      <Button variant="outline" onClick={() => startEdit(zone)}>
                        Edit
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingZoneId(null);
                            setEditingDraft(DEFAULT_DRAFT);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={saveEdit}
                          disabled={updateZoneMutation.isPending}
                        >
                          {updateZoneMutation.isPending ? "Saving..." : "Save"}
                        </Button>
                      </>
                    )}
                    <Button
                      variant="destructive"
                      onClick={() => deleteZoneMutation.mutate(zone.id)}
                      disabled={deleteZoneMutation.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
