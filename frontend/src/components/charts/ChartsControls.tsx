import type { ChartGranularity } from "@/lib/chartsService";
import { formatWindowLabel, type DateWindow } from "@/components/charts/chartPeriods";

type Props = {
  granularity: ChartGranularity;
  window: DateWindow;
  isLatest: boolean;
  onGranularityChange: (granularity: ChartGranularity) => void;
  onShift: (direction: -1 | 1) => void;
  onResetLatest: () => void;
};

const GRANULARITIES: { value: ChartGranularity; label: string }[] = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
];

export function ChartsControls({ granularity, window, isLatest, onGranularityChange, onShift, onResetLatest }: Props) {
  return (
    <div className="card charts-toolbar">
      <div className="charts-group" role="group" aria-label="Chart granularity">
        {GRANULARITIES.map(item => (
          <button
            key={item.value}
            type="button"
            className={granularity === item.value ? "charts-button-active" : undefined}
            aria-pressed={granularity === item.value}
            onClick={() => onGranularityChange(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="charts-group charts-range" role="group" aria-label="Date range">
        <button type="button" onClick={() => onShift(-1)} aria-label="Previous period">Previous</button>
        <span className="charts-range-label">{formatWindowLabel(granularity, window.from, window.to)}</span>
        <button type="button" onClick={() => onShift(1)} aria-label="Next period">Next</button>
        {!isLatest && <button type="button" onClick={onResetLatest}>Latest</button>}
      </div>
    </div>
  );
}
