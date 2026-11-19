import type { Metric } from "@/components/runs/metrics";
import type { RunSelection } from "@/lib/runSelectionService";
import type { RunPoint } from "@/lib/runService";

type MetricValues = Record<Metric, (number | null)[]>;
type ExportColumn = {
  name: string;
  description: string;
  value: (point: RunPoint, index: number, values: MetricValues) => string | number | null;
};

export const GEO_CSV_COLUMNS: ExportColumn[] = [
  { name: "WKT", description: "WGS 84 point (longitude latitude)",
    value: point => `POINT (${point.longitude} ${point.latitude})` },
  { name: "point_index", description: "Original point index", value: point => point.index },
  { name: "segment", description: "Original track segment", value: point => point.segment },
  { name: "distance_m", description: "Distance from run start (m)", value: point => point.distanceMeters },
  { name: "elapsed_s", description: "Elapsed time from run start (s)", value: point => point.timeSeconds },
  { name: "pace_s_per_km", description: "Pace (s/km)", value: (_, index, values) => values.paceSecondsPerKm[index] },
  { name: "elevation_m", description: "Elevation (m)", value: (_, index, values) => values.elevationMeters[index] },
  { name: "grade_pct", description: "Grade (%)", value: (_, index, values) => values.gradePercent[index] },
  { name: "heart_rate_bpm", description: "Heart rate (bpm)", value: (_, index, values) => values.heartRate[index] },
  { name: "gap_s_per_km", description: "Grade-adjusted pace (s/km)", value: (_, index, values) => values.gradeAdjustedPace[index] },
  { name: "beats_per_km", description: "Beats per km", value: (_, index, values) => values.beatsPerKm[index] },
  { name: "efficiency_m_per_beat", description: "Efficiency Factor (m/beat)", value: (_, index, values) => values.efficiencyFactor[index] },
];

export function exportPointIndices(excluded: boolean[], selection: RunSelection | null) {
  const indices: number[] = [];
  for (let index = selection?.start ?? 0; index <= (selection?.end ?? excluded.length - 1); index++) {
    if (!excluded[index]) indices.push(index);
  }
  return indices;
}

export function runGeoCsv(points: RunPoint[], values: MetricValues, indices: number[]) {
  const lines = [GEO_CSV_COLUMNS.map(column => column.name).join(",")];
  for (const index of indices) {
    lines.push(GEO_CSV_COLUMNS.map(column => {
      const value = column.value(points[index], index, values);
      if (typeof value === "string") return `"${value.replaceAll('"', '""')}"`;
      return value != null && Number.isFinite(value) ? String(value) : "";
    }).join(","));
  }
  return lines.join("\r\n") + "\r\n";
}

export function downloadRunGeoCsv(runId: number, points: RunPoint[], values: MetricValues, indices: number[]) {
  const url = URL.createObjectURL(new Blob([runGeoCsv(points, values, indices)], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `run-${runId}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
