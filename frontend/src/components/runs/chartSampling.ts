import type { ChartPoint } from "@/components/runs/chartData";
import type { Metric } from "@/components/runs/metrics";

// Keep real samples (and their original indices), extrema and both sides of gaps.
export function sampleChart(data: ChartPoint[], metrics: Metric[], width: number, domain: [number, number]) {
  const visible = data.filter((point, index) => point.x >= domain[0] && point.x <= domain[1]
    || point.x < domain[0] && data[index + 1]?.x >= domain[0]
    || point.x > domain[1] && data[index - 1]?.x <= domain[1]);
  const budget = Math.max(100, Math.floor(width * 2));
  if (visible.length <= budget) return visible;
  const keep = new Set<number>([0, visible.length - 1]);
  const bucketSize = Math.ceil(visible.length / Math.max(1, Math.floor(budget / (2 + 2 * metrics.length))));
  for (let start = 0; start < visible.length; start += bucketSize) {
    const end = Math.min(visible.length, start + bucketSize);
    keep.add(start); keep.add(end - 1);
    for (const metric of metrics) {
      let min = start, max = start;
      for (let index = start; index < end; index++) {
        const value = visible[index][metric];
        if (value == null) continue;
        if (visible[min][metric] == null || value < visible[min][metric]!) min = index;
        if (visible[max][metric] == null || value > visible[max][metric]!) max = index;
      }
      keep.add(min); keep.add(max);
    }
  }
  visible.forEach((point, index) => {
    if (index === 0) return;
    const previous = visible[index - 1];
    if (point.index == null || previous.index == null
      || metrics.some(metric => (point[metric] == null) !== (previous[metric] == null))) {
      keep.add(index - 1); keep.add(index);
    }
  });
  return [...keep].sort((a, b) => a - b).map(index => visible[index]);
}

// Deterministic stratified sampling without sorting or changing the full dataset.
export function sampleScatter<T>(data: T[], limit = 1000): T[] {
  if (data.length <= limit) return data;
  return Array.from({ length: limit }, (_, index) => {
    const start = Math.floor(index * data.length / limit);
    const end = Math.floor((index + 1) * data.length / limit);
    const fraction = ((index + 1) * 0.618033988749895) % 1;
    return data[start + Math.floor(fraction * (end - start))];
  });
}
