import { useState } from "react";
import { RunConfigButton } from "@/components/runs/RunConfigButton";
import { RunSettingsDialog } from "@/components/runs/RunSettingsDialog";
import { type Metric } from "@/components/runs/metrics";
import { type Smoothing } from "@/components/runs/chartData";

type Props = { metric: Metric; label: string; value: Smoothing; onChange: (value: Smoothing) => void };

export function MetricConfiguration({ metric, label, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const id = `settings-${metric}`;
  return <>
    <RunConfigButton label={`Configure ${label.toLowerCase()}`} dialogId={id} open={open} onClick={() => setOpen(true)} />
    <RunSettingsDialog id={id} title={`${label} smoothing`} open={open} onClose={() => setOpen(false)}>
      <label className="run-option"><input type="checkbox" checked={value.enabled}
        onChange={event => onChange({ ...value, enabled: event.target.checked })} />Smoothing</label>
      <label htmlFor={`${id}-points`}>Points</label>
      <input id={`${id}-points`} type="number" min="1" step="1" disabled={!value.enabled} value={value.points}
        onChange={event => {
          const points = event.currentTarget.valueAsNumber;
          if (Number.isSafeInteger(points) && points >= 1) onChange({ ...value, points });
        }} />
    </RunSettingsDialog>
  </>;
}
