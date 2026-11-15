import { formatClock } from "@/components/runs/format";

export type Metric = "paceSecondsPerKm" | "elevationMeters" | "gradePercent" | "heartRate";
export type XAxis = "distance" | "time";
// Axis IDs must stay attached to their metric when other metrics are toggled.
export const METRICS: { key: Metric; axisId: number; label: string; unit: string; color: string }[] = [
  { key: "paceSecondsPerKm", axisId: 0, label: "Pace", unit: "/km", color: "#c45127" },
  { key: "elevationMeters", axisId: 1, label: "Elevation", unit: "m", color: "#307d57" },
  { key: "gradePercent", axisId: 2, label: "Grade", unit: "%", color: "#8053ad" },
  { key: "heartRate", axisId: 3, label: "Heart rate", unit: "bpm", color: "#cd3452" },
];

export function metricValue(key: Metric, value: number) {
  if (key === "paceSecondsPerKm") return `${formatClock(value)} /km`;
  if (key === "gradePercent") return `${value.toFixed(1)}%`;
  return `${Math.round(value)} ${key === "elevationMeters" ? "m" : "bpm"}`;
}
