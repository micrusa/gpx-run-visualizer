import { useMemo } from "react";
import { type RunPoint } from "@/lib/runService";
import { selectionSummary, type RunSelection } from "@/lib/runSelectionService";
import { formatClock } from "@/components/runs/format";
import type { graphValues } from "@/components/runs/chartData";
import { DERIVED_METRICS, RECORDED_METRICS, metricValue } from "@/components/runs/metrics";

type Props = { points: RunPoint[]; selection: RunSelection; values: ReturnType<typeof graphValues> };

export function RunSelectionSummary({ points, selection, values }: Props) {
  const summary = useMemo(() => selectionSummary(points, selection), [points, selection]);
  const derived = useMemo(() => DERIVED_METRICS.map(metric => {
    const series = values[metric.key];
    let sum = 0, count = 0;
    for (let index = selection.start; index <= selection.end; index++) {
      const value = series[index];
      if (value == null || !Number.isFinite(value)) continue;
      sum += value;
      count++;
    }
    return { ...metric, average: count ? sum / count : null };
  }), [selection, values]);
  return <section className="run-selection-summary" aria-label="Selected period averages">
    <h2>Selection</h2>
    <small>Original samples</small>
    <dl>
      <div><dt>Distance</dt><dd>{(summary.distanceMeters / 1000).toFixed(2)} km</dd></div>
      <div><dt>Elapsed time</dt><dd>{summary.durationSeconds == null ? "—" : formatClock(summary.durationSeconds)}</dd></div>
      {RECORDED_METRICS.map(metric => {
        const value = summary[metric.key];
        const label = metric.key === "paceSecondsPerKm" ? "Elapsed pace" : `Avg. ${metric.label.toLowerCase()}`;
        return <div key={metric.key}><dt>{label}</dt>
          <dd>{value == null ? "—" : metricValue(metric.key, value)}</dd></div>;
      })}
    </dl>
    <small className="run-selection-chart-averages">Averages using chart settings</small>
    <dl>
      {derived.map(({ key, label, average }) => <div key={key}>
        <dt>{label}</dt><dd>{average == null ? "—" : metricValue(key, average)}</dd>
      </div>)}
    </dl>
  </section>;
}
