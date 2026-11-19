import type { ChartPoint } from "@/components/runs/chartData";
import type { Metric } from "@/components/runs/metrics";

export function nonNegative(metric: Metric) {
  return metric !== "elevationMeters" && metric !== "gradePercent";
}

export function chartDomain(data: ChartPoint[], metric: Metric): [number, number] {
  const values = data.map(point => point[metric])
    .filter((value): value is number => value != null && Number.isFinite(value)).sort((a, b) => a - b);
  if (!values.length) return [0, 1];
  let low = values[0], high = values[values.length - 1];
  if (values.length >= 5) {
    const q1 = percentile(values, .25), q3 = percentile(values, .75);
    // Wide Tukey fences retain ordinary variation without letting isolated pauses
    // or GPS spikes dictate the entire axis. Constant recordings need a fallback spread.
    const spread = q3 - q1 || Math.max(Math.abs(q1) * .1, 1);
    low = Math.max(low, q1 - 3 * spread);
    high = Math.min(high, q3 + 3 * spread);
  }
  const padding = (high - low) * .05 || Math.max(Math.abs(low) * .05, 1);
  low -= padding;
  high += padding;
  if (nonNegative(metric)) low = Math.max(0, low);
  return [low, high];
}

function percentile(values: number[], fraction: number): number {
  const index = (values.length - 1) * fraction;
  const lower = Math.floor(index), upper = Math.ceil(index);
  return values[lower] + (values[upper] - values[lower]) * (index - lower);
}

export type Domain = [number, number];

export function scaleDomain(domain: Domain, factor: number, nonNegative = false): Domain {
  const center = (domain[0] + domain[1]) / 2;
  const minimum = Math.max(Math.abs(center) * Number.EPSILON * 32, 1e-6);
  const span = Math.max(minimum, (domain[1] - domain[0]) * Math.max(.0001, Math.min(10000, factor)));
  return validDomain([center - span / 2, center + span / 2], domain, nonNegative);
}

export function shiftDomain(domain: Domain, fraction: number, nonNegative = false): Domain {
  const shift = (domain[1] - domain[0]) * fraction;
  return validDomain([domain[0] + shift, domain[1] + shift], domain, nonNegative);
}

function validDomain(next: Domain, previous: Domain, nonNegative: boolean): Domain {
  if (!next.every(Number.isFinite) || next[1] <= next[0]) return previous;
  return nonNegative && next[0] < 0 ? [0, next[1] - next[0]] : next;
}
