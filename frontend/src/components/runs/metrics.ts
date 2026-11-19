import { formatClock } from "@/components/runs/format";

export type RecordedMetric = "paceSecondsPerKm" | "elevationMeters" | "gradePercent" | "heartRate";
export type Metric = RecordedMetric | "gradeAdjustedPace" | "beatsPerKm" | "efficiencyFactor";
export type XAxis = "distance" | "time";
// Axis IDs must stay attached to their metric when other metrics are toggled.
type MetricDefinition<Key extends Metric> = { key: Key; axisId: number; label: string; unit: string; color: string };
export const RECORDED_METRICS: MetricDefinition<RecordedMetric>[] = [
  { key: "paceSecondsPerKm", axisId: 0, label: "Pace", unit: "/km", color: "#365e86" },
  { key: "elevationMeters", axisId: 1, label: "Elevation", unit: "m", color: "#4f693b" },
  { key: "gradePercent", axisId: 2, label: "Grade", unit: "%", color: "#645873" },
  { key: "heartRate", axisId: 3, label: "Heart rate", unit: "bpm", color: "#943b3b" },
];
export const DERIVED_METRICS: MetricDefinition<Exclude<Metric, RecordedMetric>>[] = [
  { key: "gradeAdjustedPace", axisId: 4, label: "Grade-adjusted pace", unit: "/km", color: "#236b62" },
  { key: "beatsPerKm", axisId: 5, label: "Beats per km", unit: "beats/km", color: "#8b562c" },
  { key: "efficiencyFactor", axisId: 6, label: "Efficiency factor (EF)", unit: "m/beat", color: "#765184" },
];
export const METRICS: MetricDefinition<Metric>[] = [...RECORDED_METRICS, ...DERIVED_METRICS];

export function isPace(key: Metric) {
  return key === "paceSecondsPerKm" || key === "gradeAdjustedPace";
}

export function isEfficiency(key: Metric) {
  return key === "beatsPerKm" || key === "efficiencyFactor";
}

export function metricValue(key: Metric, value: number) {
  if (isPace(key)) return `${formatClock(value)} /km`;
  if (key === "gradePercent") return `${value.toFixed(1)}%`;
  if (key === "beatsPerKm") return `${Math.round(value)} beats/km`;
  if (key === "efficiencyFactor") return `${value.toFixed(2)} m/beat`;
  return `${Math.round(value)} ${key === "elevationMeters" ? "m" : "bpm"}`;
}
