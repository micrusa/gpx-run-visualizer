import type { RunSelection } from "@/lib/runSelectionService";
import type { RunPoint } from "@/lib/runService";
import type { Metric, XAxis } from "@/components/runs/metrics";

export type Smoothing = { enabled: boolean; points: number };
export type PointFilter = { enabled: boolean; maxPaceSecondsPerKm: number };
export type ChartSettings = { smoothing: Record<Metric, Smoothing>; pointFilter: PointFilter };
export const DEFAULT_CHART_SETTINGS: ChartSettings = {
  smoothing: {
    paceSecondsPerKm: { enabled: true, points: 5 },
    elevationMeters: { enabled: false, points: 5 },
    gradePercent: { enabled: true, points: 5 },
    heartRate: { enabled: false, points: 5 },
  },
  pointFilter: { enabled: true, maxPaceSecondsPerKm: 12 * 60 },
};
const METRIC_KEYS: Metric[] = ["paceSecondsPerKm", "elevationMeters", "gradePercent", "heartRate"];

export type ChartPoint = {
  x: number; index: number | null; paceSecondsPerKm: number | null;
  elevationMeters: number | null; gradePercent: number | null; heartRate: number | null;
};

export function chartData(points: RunPoint[], axis: XAxis, selection: RunSelection | null = null, settings: ChartSettings = DEFAULT_CHART_SETTINGS): ChartPoint[] {
  const values = graphValues(points, settings);
  const result: ChartPoint[] = [];
  let previousSegment: number | null = null;
  let gap = false;
  points.forEach((point, index) => {
    if (selection && (index < selection.start || index > selection.end)) return;
    const x = axis === "distance" ? point.distanceMeters / 1000 : point.timeSeconds;
    if (x == null) { gap = true; return; }
    if (result.length && (gap || previousSegment !== point.segment)) {
      result.push({ x, index: null, paceSecondsPerKm: null, elevationMeters: null, gradePercent: null, heartRate: null });
    }
    result.push({ x, index, paceSecondsPerKm: values.paceSecondsPerKm[index], elevationMeters: values.elevationMeters[index],
      gradePercent: values.gradePercent[index], heartRate: values.heartRate[index] });
    previousSegment = point.segment; gap = false;
  });
  return result;
}

// Filtering precedes smoothing so a pause cannot bleed into nearby moving samples.
function graphValues(points: RunPoint[], settings: ChartSettings): Record<Metric, (number | null)[]> {
  const filter = settings.pointFilter;
  const excluded = points.map((point, index) => {
    if (!filter.enabled || !Number.isFinite(filter.maxPaceSecondsPerKm) || filter.maxPaceSecondsPerKm <= 0) return false;
    if (point.paceSecondsPerKm != null) return point.paceSecondsPerKm >= filter.maxPaceSecondsPerKm;
    const previous = points[index - 1];
    return !!previous && previous.segment === point.segment && point.timeSeconds != null && previous.timeSeconds != null
      && point.timeSeconds > previous.timeSeconds && point.distanceMeters <= previous.distanceMeters;
  });
  return Object.fromEntries(METRIC_KEYS.map(metric => {
    const raw = points.map((point, index) => excluded[index] || point[metric] == null || !Number.isFinite(point[metric]) ? null : point[metric]);
    const setting = settings.smoothing[metric];
    if (!setting.enabled) return [metric, raw];
    const window = Number.isSafeInteger(setting.points) && setting.points >= 1 ? setting.points : 1;
    return [metric, smooth(points, raw, window)];
  })) as Record<Metric, (number | null)[]>;
}

// Prefix sums keep even very large smoothing windows linear in the number of samples.
function smooth(points: RunPoint[], raw: (number | null)[], window: number): (number | null)[] {
  const result = raw.slice();
  const left = Math.floor((window - 1) / 2), right = window - left - 1;
  let start = 0;
  while (start < points.length) {
    if (raw[start] == null) { start++; continue; }
    let end = start + 1;
    while (end < points.length && raw[end] != null && points[end].segment === points[start].segment) end++;
    const sums = [0];
    for (let index = start; index < end; index++) sums.push(sums[sums.length - 1] + raw[index]!);
    for (let index = start; index < end; index++) {
      const low = Math.max(start, index - left), high = Math.min(end - 1, index + right);
      result[index] = (sums[high - start + 1] - sums[low - start]) / (high - low + 1);
    }
    start = end;
  }
  return result;
}
