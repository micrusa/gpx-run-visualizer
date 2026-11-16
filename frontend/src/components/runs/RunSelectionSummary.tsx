import { useMemo } from "react";
import { type RunPoint } from "@/lib/runService";
import { selectionSummary, type RunSelection } from "@/lib/runSelectionService";
import { formatClock } from "@/components/runs/format";
import { METRICS, metricValue } from "@/components/runs/metrics";

export function RunSelectionSummary({ points, selection }: { points: RunPoint[]; selection: RunSelection }) {
  const summary = useMemo(() => selectionSummary(points, selection), [points, selection]);
  return <section className="run-selection-summary" aria-label="Selected period averages">
    <h2>Selection</h2>
    <small>Original samples</small>
    <dl>
      <div><dt>Distance</dt><dd>{(summary.distanceMeters / 1000).toFixed(2)} km</dd></div>
      <div><dt>Elapsed time</dt><dd>{summary.durationSeconds == null ? "—" : formatClock(summary.durationSeconds)}</dd></div>
      {METRICS.map(metric => {
        const value = summary[metric.key];
        const label = metric.key === "paceSecondsPerKm" ? "Elapsed pace" : `Avg. ${metric.label.toLowerCase()}`;
        return <div key={metric.key}><dt>{label}</dt>
          <dd>{value == null ? "—" : metricValue(metric.key, value)}</dd></div>;
      })}
    </dl>
  </section>;
}
