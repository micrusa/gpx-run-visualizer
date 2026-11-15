import { type ChartSettings } from "@/components/runs/chartData";
import { RunMetricOption } from "@/components/runs/RunMetricOption";
import { RunPointFiltering } from "@/components/runs/RunPointFiltering";
import type { ReactNode } from "react";
import { METRICS, type Metric, type XAxis } from "@/components/runs/metrics";

type Props = {
  settings: ChartSettings; onSettings: (settings: ChartSettings) => void;
  available: Metric[]; selected: Metric[]; onSelected: (metrics: Metric[]) => void;
  xAxis: XAxis; onXAxis: (axis: XAxis) => void; hasTime: boolean; children?: ReactNode;
};

export function RunDisplayControls({ available, selected, onSelected, xAxis, onXAxis, hasTime, children, settings, onSettings }: Props) {
  return <aside className="card run-controls" aria-label="Display options">
    <h2>Display</h2>
    <fieldset><legend>Graph values</legend>
      {METRICS.map(metric => <RunMetricOption key={metric.key} metric={metric} available={available.includes(metric.key)}
        checked={selected.includes(metric.key)} onChecked={checked => onSelected(checked ? [...selected, metric.key] : selected.filter(key => key !== metric.key))}
        smoothing={settings.smoothing[metric.key]} onSmoothing={value => onSettings({ ...settings, smoothing: { ...settings.smoothing, [metric.key]: value } })} />)}
    </fieldset>
    <RunPointFiltering value={settings.pointFilter} onChange={pointFilter => onSettings({ ...settings, pointFilter })} />
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
