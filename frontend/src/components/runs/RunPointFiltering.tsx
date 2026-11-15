import { useState } from "react";
import { type PointFilter } from "@/components/runs/chartData";
import { RunConfigButton } from "@/components/runs/RunConfigButton";
import { RunSettingsDialog } from "@/components/runs/RunSettingsDialog";

export function RunPointFiltering({ value, onChange }: { value: PointFilter; onChange: (filter: PointFilter) => void }) {
  const [open, setOpen] = useState(false);
  const id = "pace-filter-settings";
  return <fieldset className="run-point-filtering"><legend>Point filtering</legend>
    <div className="run-metric-option">
      <label className="run-option"><input id="pace-filter-enabled" type="checkbox" checked={value.enabled}
        onChange={event => onChange({ ...value, enabled: event.target.checked })} />Filter by pace</label>
      <RunConfigButton label="Configure pace filter" dialogId={id} open={open} onClick={() => setOpen(true)} />
    </div>
    <RunSettingsDialog id={id} title="Filter by pace" open={open} onClose={() => setOpen(false)}>
      <label className="run-option"><input id="pace-filter-dialog-enabled" type="checkbox" checked={value.enabled}
        onChange={event => onChange({ ...value, enabled: event.target.checked })} />Enabled</label>
      <label htmlFor="pace-cutoff">Keep pace below (min/km)</label>
      <input id="pace-cutoff" type="number" min="0" step="any" value={value.maxPaceSecondsPerKm / 60} disabled={!value.enabled}
        onChange={event => {
          const minutes = event.currentTarget.valueAsNumber;
          if (Number.isFinite(minutes * 60) && minutes > 0) onChange({ ...value, maxPaceSecondsPerKm: minutes * 60 });
        }} />
    </RunSettingsDialog>
  </fieldset>;
}
