import { useState } from "react";
import { RunConfigButton } from "@/components/runs/RunConfigButton";
import { RunSettingsDialog } from "@/components/runs/RunSettingsDialog";
import { type Metric } from "@/components/runs/metrics";
import { type HeartRateDelay, type Smoothing } from "@/components/runs/chartData";

type Props = {
  metric: Metric; label: string; value: Smoothing; onChange: (value: Smoothing) => void;
  delay?: { value: HeartRateDelay; onChange: (value: HeartRateDelay) => void };
};

const METRIC_DESCRIPTIONS: Record<Metric, string> = {
  paceSecondsPerKm: "Time taken to cover one kilometer.",
  elevationMeters: "Height above sea level in meters.",
  gradePercent: "Uphill or downhill slope as a percentage.",
  heartRate: "Heartbeats per minute.",
  gradeAdjustedPace: "Estimated equivalent pace on flat ground, using smoothed grade.",
  beatsPerKm: "Heartbeats per kilometer at your recorded pace.",
  efficiencyFactor: "Grade-adjusted speed divided by heart rate, in meters per beat.",
};

export function MetricConfiguration({ metric, label, value, onChange, delay }: Props) {
  const [open, setOpen] = useState(false);
  const id = `settings-${metric}`;
  return <>
    <RunConfigButton label={`Configure ${label.toLowerCase()}`} dialogId={id} open={open} onClick={() => setOpen(true)} />
    <RunSettingsDialog id={id} title={delay ? `${label} settings` : `${label} smoothing`} open={open} onClose={() => setOpen(false)}>
      <p className="run-settings-description">{METRIC_DESCRIPTIONS[metric]}</p>
      <label className="run-option"><input type="checkbox" checked={value.enabled}
        aria-describedby={`${id}-smoothing-description`}
        onChange={event => onChange({ ...value, enabled: event.target.checked })} />Smoothing</label>
      <p className="run-settings-description" id={`${id}-smoothing-description`}>
        {delay ? "Averages speed and heart rate separately before calculating the metric." : "Averages nearby samples to reduce short-term fluctuations."}
        {" "}More points give a smoother line.
      </p>
      <label htmlFor={`${id}-points`}>Points</label>
      <input id={`${id}-points`} type="number" min="1" step="1" disabled={!value.enabled} value={value.points}
        onChange={event => {
          const points = event.currentTarget.valueAsNumber;
          if (Number.isSafeInteger(points) && points >= 1) onChange({ ...value, points });
        }} />
      {delay && <div className="run-settings-section">
        <label className="run-option"><input type="checkbox" checked={delay.value.enabled}
          aria-describedby={`${id}-delay-description`}
          onChange={event => delay.onChange({ ...delay.value, enabled: event.target.checked })} />HR delay</label>
        <p className="run-settings-description" id={`${id}-delay-description`}>
          Pairs your current heart rate with earlier pace. A 5-second delay uses pace from 5 seconds ago for both efficiency metrics.
        </p>
        <label htmlFor={`${id}-delay`}>Seconds to look back for pace</label>
        <input id={`${id}-delay`} type="number" min="0" step="any" disabled={!delay.value.enabled} value={delay.value.seconds}
          onChange={event => {
            const seconds = event.currentTarget.valueAsNumber;
            if (Number.isFinite(seconds) && seconds >= 0) delay.onChange({ ...delay.value, seconds });
          }} />
      </div>}
    </RunSettingsDialog>
  </>;
}
