import type { ReactNode } from "react";
import { METRICS, type Metric, type XAxis } from "@/components/runs/metrics";

type Props = {
  available: Metric[]; selected: Metric[]; onSelected: (metrics: Metric[]) => void;
  xAxis: XAxis; onXAxis: (axis: XAxis) => void; hasTime: boolean; children?: ReactNode;
};

export function RunDisplayControls({ available, selected, onSelected, xAxis, onXAxis, hasTime, children }: Props) {
  return <aside className="card run-controls" aria-label="Display options">
    <h2>Display</h2>
    <fieldset><legend>Graph values</legend>
      {METRICS.map(metric => <label className="run-option" key={metric.key}>
        <input type="checkbox" checked={selected.includes(metric.key)} disabled={!available.includes(metric.key)}
          onChange={event => onSelected(event.target.checked ? [...selected, metric.key] : selected.filter(key => key !== metric.key))} />
        <span style={{ color: metric.color }}>{metric.label}</span>
        {!available.includes(metric.key) && <small>Unavailable</small>}
      </label>)}
    </fieldset>
    <fieldset><legend>X axis</legend>
      <label className="run-option"><input type="radio" name="x-axis" checked={xAxis === "distance"}
        onChange={() => onXAxis("distance")} />Distance</label>
      <label className="run-option"><input type="radio" name="x-axis" checked={xAxis === "time"} disabled={!hasTime}
        onChange={() => onXAxis("time")} />Time</label>
      {!hasTime && <small>Not enough timestamps for a time axis.</small>}
    </fieldset>
    {children}
  </aside>;
}
