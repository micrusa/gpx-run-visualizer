import type { RunSelection } from "@/lib/runSelectionService";
import type { RunPoint } from "@/lib/runService";
import type { XAxis } from "@/components/runs/metrics";

export type ChartPoint = {
  x: number; index: number | null; paceSecondsPerKm: number | null;
  elevationMeters: number | null; gradePercent: number | null; heartRate: number | null;
};

export function chartData(points: RunPoint[], axis: XAxis, selection: RunSelection | null = null): ChartPoint[] {
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
    result.push({ x, index, paceSecondsPerKm: point.paceSecondsPerKm, elevationMeters: point.elevationMeters,
      gradePercent: smoothGrade(points, index), heartRate: point.heartRate });
    previousSegment = point.segment; gap = false;
  });
  return result;
}

// Centered five-point average, shortened at segment boundaries and missing samples.
function smoothGrade(points: RunPoint[], index: number): number | null {
  const point = points[index];
  if (point.gradePercent == null || !Number.isFinite(point.gradePercent)) return null;
  let total = point.gradePercent;
  let count = 1;
  for (const direction of [-1, 1]) {
    for (let offset = 1; offset <= 2; offset++) {
      const neighbor = points[index + direction * offset];
      if (!neighbor || neighbor.segment !== point.segment || neighbor.gradePercent == null || !Number.isFinite(neighbor.gradePercent)) break;
      total += neighbor.gradePercent;
      count++;
    }
  }
  return total / count;
}
