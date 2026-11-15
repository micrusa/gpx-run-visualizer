import { type Metric } from "@/components/runs/metrics";
import { type Smoothing } from "@/components/runs/chartData";
import { MetricConfiguration } from "@/components/runs/MetricConfiguration";

type Props = {
  metric: { key: Metric; label: string; color: string }; available: boolean; checked: boolean;
  onChecked: (checked: boolean) => void; smoothing: Smoothing; onSmoothing: (value: Smoothing) => void;
};

export function RunMetricOption({ metric, available, checked, onChecked, smoothing, onSmoothing }: Props) {
  return <div className="run-metric-option">
    <label className="run-option"><input type="checkbox" checked={checked} disabled={!available}
      onChange={event => onChecked(event.target.checked)} />
      <span style={{ color: metric.color }}>{metric.label}</span>
      {!available && <small>Unavailable</small>}
    </label>
    <MetricConfiguration metric={metric.key} label={metric.label} value={smoothing} onChange={onSmoothing} />
  </div>;
}
