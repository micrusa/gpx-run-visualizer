import type { RunSelection } from "@/lib/runSelectionService";
import type { RunPoint } from "@/lib/runService";
import type { Metric, RecordedMetric, XAxis } from "@/components/runs/metrics";

export type Smoothing = { enabled: boolean; points: number };
export type PointFilter = { enabled: boolean; maxPaceSecondsPerKm: number };
export type HeartRateDelay = { enabled: boolean; seconds: number };
export type ChartSettings = {
  smoothing: Record<Metric, Smoothing>; pointFilter: PointFilter; heartRateDelay: HeartRateDelay;
};
export const DEFAULT_CHART_SETTINGS: ChartSettings = {
  smoothing: {
    paceSecondsPerKm: { enabled: true, points: 10 },
    elevationMeters: { enabled: false, points: 5 },
    gradePercent: { enabled: true, points: 5 },
    heartRate: { enabled: false, points: 5 },
    gradeAdjustedPace: { enabled: false, points: 5 },
    beatsPerKm: { enabled: true, points: 10 },
    efficiencyFactor: { enabled: true, points: 10 },
  },
  pointFilter: { enabled: false, maxPaceSecondsPerKm: 12 * 60 },
  heartRateDelay: { enabled: false, seconds: 5 },
};

export type ChartPoint = { x: number; index: number | null } & Record<Metric, number | null>;

export function availableMetrics(points: RunPoint[]): Metric[] {
  const values = graphValues(points, DEFAULT_CHART_SETTINGS);
  return (Object.keys(values) as Metric[]).filter(key => values[key].some(value => value != null));
}

export function chartData(points: RunPoint[], axis: XAxis, selection: RunSelection | null = null, settings: ChartSettings = DEFAULT_CHART_SETTINGS, values = graphValues(points, settings)): ChartPoint[] {
  const result: ChartPoint[] = [];
  let previousSegment: number | null = null;
  let gap = false;
  points.forEach((point, index) => {
    if (selection && (index < selection.start || index > selection.end)) return;
    const x = axis === "distance" ? point.distanceMeters / 1000 : point.timeSeconds;
    if (x == null) { gap = true; return; }
    if (result.length && (gap || previousSegment !== point.segment)) {
      result.push(chartPoint(x, null, values));
    }
    result.push(chartPoint(x, index, values));
    previousSegment = point.segment; gap = false;
  });
  return result;
}

function chartPoint(x: number, index: number | null, values: ReturnType<typeof graphValues>): ChartPoint {
  return {
    x, index,
    paceSecondsPerKm: index == null ? null : values.paceSecondsPerKm[index],
    elevationMeters: index == null ? null : values.elevationMeters[index],
    gradePercent: index == null ? null : values.gradePercent[index],
    heartRate: index == null ? null : values.heartRate[index],
    gradeAdjustedPace: index == null ? null : values.gradeAdjustedPace[index],
    beatsPerKm: index == null ? null : values.beatsPerKm[index],
    efficiencyFactor: index == null ? null : values.efficiencyFactor[index],
  };
}

export function paceFilterExclusions(points: RunPoint[], filter: PointFilter): boolean[] {
  return points.map((point, index) => {
    if (!filter.enabled || !Number.isFinite(filter.maxPaceSecondsPerKm) || filter.maxPaceSecondsPerKm <= 0) return false;
    if (point.paceSecondsPerKm != null) return point.paceSecondsPerKm >= filter.maxPaceSecondsPerKm;
    const previous = points[index - 1];
    return !!previous && previous.segment === point.segment && point.timeSeconds != null && previous.timeSeconds != null
      && point.timeSeconds > previous.timeSeconds && point.distanceMeters <= previous.distanceMeters;
  });
}

// Filtering precedes smoothing so a pause cannot bleed into nearby moving samples.
export function graphValues(points: RunPoint[], settings: ChartSettings,
    excluded = paceFilterExclusions(points, settings.pointFilter)): Record<Metric, (number | null)[]> {
  function raw(metric: RecordedMetric) {
    return points.map((point, index) => {
      const value = point[metric];
      return excluded[index] || value == null || !Number.isFinite(value) ? null : value;
    });
  }

  function applySmoothing(metric: Metric, samples: (number | null)[]) {
    const { enabled, points: window } = settings.smoothing[metric];
    return enabled && Number.isSafeInteger(window) && window > 1 ? smooth(points, samples, window) : samples;
  }

  const pace = raw("paceSecondsPerKm");
  const hr = raw("heartRate");
  const gradePercent = applySmoothing("gradePercent", raw("gradePercent"));
  const adjusted = pace.map((value, index) => {
    const grade = gradePercent[index];
    if (value == null || value <= 0 || grade == null) return null;
    // Minetti et al. (2002), doi:10.1152/japplphysiol.01177.2001. Limit the fit to measured slopes.
    const slope = Math.max(-0.45, Math.min(0.45, grade / 100));
    const cost = ((((155.4 * slope - 30.4) * slope - 43.3) * slope + 46.3) * slope + 19.5) * slope + 3.6;
    return value * (3.6 / cost);
  });

  function efficiency(metric: "beatsPerKm" | "efficiencyFactor", source: (number | null)[]) {
    const speed = source.map(value => value != null && value > 0 ? 60000 / value : null);
    const aligned = alignSpeed(points, speed, settings.heartRateDelay);
    const pairedHr = hr.map((value, index) => value != null && value > 0 && aligned[index] != null ? value : null);
    const pairedSpeed = aligned.map((value, index) => pairedHr[index] == null ? null : value);
    const avgSpeed = applySmoothing(metric, pairedSpeed);
    const avgHr = applySmoothing(metric, pairedHr);
    return avgSpeed.map((value, index) => {
      const rate = avgHr[index];
      if (value == null || value <= 0 || rate == null || rate <= 0) return null;
      return metric === "beatsPerKm" ? 1000 * rate / value : value / rate;
    });
  }

  return {
    paceSecondsPerKm: applySmoothing("paceSecondsPerKm", pace),
    elevationMeters: applySmoothing("elevationMeters", raw("elevationMeters")),
    gradePercent,
    heartRate: applySmoothing("heartRate", hr),
    gradeAdjustedPace: applySmoothing("gradeAdjustedPace", adjusted),
    beatsPerKm: efficiency("beatsPerKm", pace),
    efficiencyFactor: efficiency("efficiencyFactor", adjusted),
  };
}

function alignSpeed(points: RunPoint[], speed: (number | null)[], delay: HeartRateDelay) {
  if (!delay.enabled || !Number.isFinite(delay.seconds) || delay.seconds <= 0) return speed;
  let start = 0, left = 0;
  return points.map((point, index) => {
    const time = point.timeSeconds;
    if (time == null || !Number.isFinite(time) || speed[index] == null) {
      start = left = index + 1;
      return null;
    }
    const previous = points[index - 1];
    if (index > start && (point.segment !== previous.segment || time <= (previous.timeSeconds ?? time))) {
      start = left = index;
    }
    const target = time - delay.seconds;
    if (target < points[start].timeSeconds!) return null;
    while (left < index && points[left + 1].timeSeconds! <= target) left++;
    const leftTime = points[left].timeSeconds!;
    const leftSpeed = speed[left]!;
    if (leftTime === target || left === index) return leftSpeed;
    const fraction = (target - leftTime) / (points[left + 1].timeSeconds! - leftTime);
    return leftSpeed + fraction * (speed[left + 1]! - leftSpeed);
  });
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
