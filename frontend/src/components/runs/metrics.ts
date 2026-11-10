import { formatClock } from "@/components/runs/format";

export type Metric = "paceSecondsPerKm" | "elevationMeters" | "gradePercent" | "heartRate";
export type XAxis = "distance" | "time";
export const METRICS: { key: Metric; label: string; unit: string; color: string }[] = [
  { key: "paceSecondsPerKm", label: "Pace", unit: "/km", color: "#c45127" },
  { key: "elevationMeters", label: "Elevation", unit: "m", color: "#307d57" },
  { key: "gradePercent", label: "Grade", unit: "%", color: "#8053ad" },
  { key: "heartRate", label: "Heart rate", unit: "bpm", color: "#cd3452" },
];

export function metricValue(key: Metric, value: number) {
  if (key === "paceSecondsPerKm") return `${formatClock(value)} /km`;
  if (key === "gradePercent") return `${value.toFixed(1)}%`;
  return `${Math.round(value)} ${key === "elevationMeters" ? "m" : "bpm"}`;
}
