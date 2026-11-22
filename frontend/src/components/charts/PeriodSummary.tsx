import type { ChartTotals } from "@/lib/chartsService";
import { formatClock } from "@/components/runs/format";
import { formatDuration } from "@/components/charts/chartPeriods";

type Props = {
  totals: ChartTotals;
  omittedWithoutTimestamp: number;
};

export function PeriodSummary({ totals, omittedWithoutTimestamp }: Props) {
  return (
    <section className="card" aria-label="Period summary">
      <dl className="run-summary charts-summary">
        <div>
          <dt>Runs</dt>
          <dd>{totals.runCount}</dd>
        </div>
        <div>
          <dt>Distance</dt>
          <dd>{(totals.distanceMeters / 1000).toFixed(2)} km</dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd>{totals.durationSeconds > 0 ? formatDuration(totals.durationSeconds) : "—"}</dd>
        </div>
        <div>
          <dt>Avg pace</dt>
          <dd>{totals.averagePaceSecondsPerKm != null ? `${formatClock(totals.averagePaceSecondsPerKm)} /km` : "—"}</dd>
        </div>
        <div>
          <dt>Elevation gain</dt>
          <dd>{totals.elevationGainMeters > 0 ? `${Math.round(totals.elevationGainMeters)} m` : "—"}</dd>
        </div>
        <div>
          <dt>Avg heart rate</dt>
          <dd>{totals.averageHeartRate != null ? `${Math.round(totals.averageHeartRate)} bpm` : "—"}</dd>
        </div>
      </dl>
      {omittedWithoutTimestamp > 0 && (
        <small className="charts-note">
          {omittedWithoutTimestamp} {omittedWithoutTimestamp === 1 ? "run" : "runs"} without timestamps omitted from time charts.
        </small>
      )}
    </section>
  );
}
