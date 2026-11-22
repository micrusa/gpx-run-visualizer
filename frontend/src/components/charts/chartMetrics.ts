import type { ChartBucket } from "@/lib/chartsService";

function formatClock(seconds: number): string {
  const rounded = Math.round(seconds);
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`;
}

function formatDuration(seconds: number): string {
  const rounded = Math.round(seconds);
  if (rounded <= 0) return "0m";
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const secs = rounded % 60;
  return hours > 0 ? `${hours}h ${String(minutes).padStart(2, "0")}m` : `${minutes}:${String(secs).padStart(2, "0")}`;
}

export type VolumeMetric = "distanceKm" | "durationMinutes" | "elevationGainMeters" | "runCount";

export type VolumeMetricDefinition = {
  key: VolumeMetric;
  label: string;
  unit: string;
  color: string;
  read: (bucket: ChartBucket) => number;
};

export const VOLUME_METRICS: VolumeMetricDefinition[] = [
  { key: "distanceKm", label: "Distance", unit: "km", color: "#365e86", read: b => b.distanceMeters / 1000 },
  { key: "durationMinutes", label: "Duration", unit: "min", color: "#236b62", read: b => b.durationSeconds / 60 },
  { key: "elevationGainMeters", label: "Elevation", unit: "m", color: "#4f693b", read: b => b.elevationGainMeters },
  { key: "runCount", label: "Runs", unit: "runs", color: "#645873", read: b => b.runCount },
];

export function formatVolumeValue(key: VolumeMetric, value: number): string {
  if (key === "distanceKm") return `${value.toFixed(value >= 100 ? 0 : 1)} km`;
  if (key === "durationMinutes") return formatDuration(value * 60);
  if (key === "elevationGainMeters") return `${Math.round(value)} m`;
  return `${Math.round(value)} ${Math.round(value) === 1 ? "run" : "runs"}`;
}

export function formatVolumeTick(key: VolumeMetric, value: number): string {
  if (key === "distanceKm") return `${Number(value.toFixed(1))}`;
  if (key === "durationMinutes") return value >= 60 ? `${(value / 60).toFixed(1)}h` : `${Math.round(value)}m`;
  return `${Math.round(value)}`;
}

export function volumeAverage(buckets: ChartBucket[], key: VolumeMetric): number | null {
  if (!buckets.length) return null;
  const metric = VOLUME_METRICS.find(m => m.key === key)!;
  const total = buckets.reduce((sum, bucket) => sum + metric.read(bucket), 0);
  return total > 0 ? total / buckets.length : null;
}

export type TrendMetric =
  | VolumeMetric
  | "averagePaceSecondsPerKm"
  | "averageSpeedKmh"
  | "averageHeartRate"
  | "maxHeartRate"
  | "beatsPerKm"
  | "efficiencyFactor"
  | "elevationPerKm";

export type TrendMetricDefinition<Key extends TrendMetric = TrendMetric> = {
  key: Key;
  axisId: number;
  label: string;
  unit: string;
  color: string;
  reversed?: boolean;
  isVolume?: boolean;
  read: (bucket: ChartBucket) => number | null;
};

export const TREND_METRICS: TrendMetricDefinition[] = [
  { key: "distanceKm", axisId: 0, label: "Distance", unit: "km", color: "#365e86", isVolume: true, read: b => b.distanceMeters / 1000 },
  { key: "durationMinutes", axisId: 1, label: "Total duration", unit: "min", color: "#236b62", isVolume: true, read: b => b.durationSeconds / 60 },
  { key: "elevationGainMeters", axisId: 2, label: "Elevation gain", unit: "m", color: "#4f693b", isVolume: true, read: b => b.elevationGainMeters },
  { key: "runCount", axisId: 3, label: "Runs", unit: "runs", color: "#505459", isVolume: true, read: b => b.runCount },
  { key: "averagePaceSecondsPerKm", axisId: 4, label: "Avg pace", unit: "/km", color: "#294f76", reversed: true, read: b => b.averagePaceSecondsPerKm },
  { key: "averageSpeedKmh", axisId: 5, label: "Avg speed", unit: "km/h", color: "#2e7070", read: b => b.averageSpeedKmh },
  { key: "averageHeartRate", axisId: 6, label: "Avg heart rate", unit: "bpm", color: "#943b3b", read: b => b.averageHeartRate },
  { key: "maxHeartRate", axisId: 7, label: "Max heart rate", unit: "bpm", color: "#645873", read: b => b.maxHeartRate },
  { key: "beatsPerKm", axisId: 8, label: "Beats per km", unit: "beats/km", color: "#8b562c", read: b => b.beatsPerKm },
  { key: "efficiencyFactor", axisId: 9, label: "Efficiency factor (EF)", unit: "m/beat", color: "#765184", read: b => b.efficiencyFactor },
  { key: "elevationPerKm", axisId: 10, label: "Elevation per km", unit: "m/km", color: "#5c7a3e", read: b => b.elevationPerKm },
];

export const DEFAULT_TREND_METRICS: TrendMetric[] = ["averagePaceSecondsPerKm", "averageHeartRate"];

export function availableTrendMetrics(buckets: ChartBucket[]): TrendMetric[] {
  return TREND_METRICS
    .filter(metric => buckets.some(bucket => {
      const value = metric.read(bucket);
      return metric.isVolume ? value != null && value > 0 : value != null;
    }))
    .map(metric => metric.key);
}

export function formatTrendValue(key: TrendMetric, value: number): string {
  if (key === "distanceKm" || key === "durationMinutes" || key === "elevationGainMeters" || key === "runCount") {
    return formatVolumeValue(key, value);
  }
  if (key === "averagePaceSecondsPerKm") return `${formatClock(value)} /km`;
  if (key === "averageHeartRate" || key === "maxHeartRate") return `${Math.round(value)} bpm`;
  if (key === "beatsPerKm") return `${Math.round(value)} beats/km`;
  if (key === "efficiencyFactor") return `${value.toFixed(2)} m/beat`;
  if (key === "elevationPerKm") return `${value.toFixed(1)} m/km`;
  return `${value.toFixed(1)} km/h`;
}

export function trendDomain(buckets: ChartBucket[], key: TrendMetric): [number, number] {
  const metric = TREND_METRICS.find(item => item.key === key)!;
  return combinedTrendDomain(buckets, [metric]);
}

export type TrendAxis = {
  id: string;
  unit: string;
  reversed: boolean;
  color: string;
  domain: [number, number];
  sampleKey: TrendMetric;
};

function combinedTrendDomain(buckets: ChartBucket[], metrics: TrendMetricDefinition[]): [number, number] {
  const values: number[] = [];
  for (const metric of metrics) {
    for (const bucket of buckets) {
      const value = metric.read(bucket);
      if (value != null && Number.isFinite(value)) values.push(value);
    }
  }
  if (!values.length) return [0, 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (metrics.every(metric => metric.isVolume)) {
    return [0, max > 0 ? max * 1.12 : 1];
  }
  const span = max - min;
  const pad = span > 0 ? span * 0.12 : Math.max(Math.abs(min) * 0.08, 1);
  return [Math.max(0, min - pad), max + pad];
}

export function trendAxes(buckets: ChartBucket[], metrics: TrendMetricDefinition[]): TrendAxis[] {
  const groups = new Map<string, TrendMetricDefinition[]>();
  for (const metric of metrics) {
    const existing = groups.get(metric.unit);
    if (existing) existing.push(metric);
    else groups.set(metric.unit, [metric]);
  }
  return Array.from(groups.entries()).map(([unit, group]) => ({
    id: unit,
    unit,
    reversed: Boolean(group[0].reversed),
    color: group.length === 1 ? group[0].color : "#505459",
    domain: combinedTrendDomain(buckets, group),
    sampleKey: group[0].key,
  }));
}
