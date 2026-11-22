import { ApiError, get } from "@/lib/api";

export type ChartGranularity = "DAILY" | "WEEKLY" | "MONTHLY";

export type ChartBucket = {
  key: string;
  startDate: string;
  endDate: string;
  runCount: number;
  distanceMeters: number;
  durationSeconds: number;
  elevationGainMeters: number;
  averagePaceSecondsPerKm: number | null;
  averageSpeedKmh: number | null;
  averageHeartRate: number | null;
  maxHeartRate: number | null;
  beatsPerKm: number | null;
  efficiencyFactor: number | null;
  elevationPerKm: number | null;
};

export type ChartTotals = {
  runCount: number;
  distanceMeters: number;
  durationSeconds: number;
  elevationGainMeters: number;
  averagePaceSecondsPerKm: number | null;
  averageSpeedKmh: number | null;
  averageHeartRate: number | null;
  maxHeartRate: number | null;
  beatsPerKm: number | null;
  efficiencyFactor: number | null;
  elevationPerKm: number | null;
};

export type ChartsData = {
  granularity: ChartGranularity;
  from: string;
  to: string;
  timeZone: string;
  omittedWithoutTimestamp: number;
  totals: ChartTotals;
  buckets: ChartBucket[];
};

export type ChartsQuery = {
  granularity: ChartGranularity;
  from: string;
  to: string;
  tz?: string;
};

export function getCharts({ granularity, from, to, tz }: ChartsQuery) {
  const params = new URLSearchParams({ granularity, from, to });
  if (tz) params.set("tz", tz);
  return get<ChartsData>(`/api/charts?${params.toString()}`);
}

export function getChartsErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 401) return "Your session expired. Please sign in again.";
  if (error instanceof ApiError && error.status === 400) return error.message || "Invalid chart range.";
  return "Could not load chart data. Please try again.";
}
