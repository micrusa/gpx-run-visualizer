import type { RunPoint } from "@/lib/runService";

export type RunSelection = { start: number; end: number };
export type SelectionSummary = {
  distanceMeters: number; durationSeconds: number | null; paceSecondsPerKm: number | null;
  elevationMeters: number | null; gradePercent: number | null; heartRate: number | null;
};

export function selectRange(points: RunPoint[], axis: "time" | "distance", from: number, to: number,
    within: RunSelection | null = null): RunSelection | null {
  if (!Number.isFinite(from) || !Number.isFinite(to) || from === to) return null;
  const low = Math.min(from, to), high = Math.max(from, to);
  const x = (point: RunPoint) => axis === "time" ? point.timeSeconds : point.distanceMeters / 1000;
  let start = -1, end = -1, leftDistance = Infinity, rightDistance = Infinity;
  for (let index = within?.start ?? 0; index <= (within?.end ?? points.length - 1); index++) {
    const value = x(points[index]);
    if (value == null || !Number.isFinite(value)) continue;
    const left = Math.abs(value - low), right = Math.abs(value - high);
    if (left < leftDistance) { start = index; leftDistance = left; }
    if (right <= rightDistance) { end = index; rightDistance = right; }
  }
  if (start < 0 || end <= start) return null;
  const startValue = x(points[start]), endValue = x(points[end]);
  return startValue != null && endValue != null && endValue > startValue ? { start, end } : null;
}

export function selectionSummary(points: RunPoint[], selection: RunSelection): SelectionSummary {
  const samples = points.slice(selection.start, selection.end + 1);
  const first = samples[0], last = samples[samples.length - 1];
  const distance = Math.max(0, last.distanceMeters - first.distanceMeters);
  const duration = first.timeSeconds != null && last.timeSeconds != null ? last.timeSeconds - first.timeSeconds : null;
  let rise = 0, gradeDistance = 0;
  for (let index = 1; index < samples.length; index++) {
    const point = samples[index], previous = samples[index - 1];
    const step = point.distanceMeters - previous.distanceMeters;
    if (point.segment === previous.segment && step > 0 && point.gradePercent != null && Number.isFinite(point.gradePercent)) {
      rise += point.gradePercent * step; gradeDistance += step;
    }
  }
  const average = (field: "elevationMeters" | "heartRate") => {
    const values = samples.map(point => point[field]).filter((value): value is number => value != null && Number.isFinite(value));
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  };
  return { distanceMeters: distance, durationSeconds: duration,
    paceSecondsPerKm: duration != null && duration > 0 && distance > 0 ? duration * 1000 / distance : null,
    elevationMeters: average("elevationMeters"), gradePercent: gradeDistance > 0 ? rise / gradeDistance : null,
    heartRate: average("heartRate") };
}
