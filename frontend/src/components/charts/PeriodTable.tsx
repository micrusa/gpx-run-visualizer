import type { ChartBucket, ChartGranularity } from "@/lib/chartsService";
import { formatClock } from "@/components/runs/format";
import { formatBucketLabel, formatDuration, percentDiff } from "@/components/charts/chartPeriods";

type Props = {
  granularity: ChartGranularity;
  buckets: ChartBucket[];
};

type Tone = "higher-better" | "lower-better";

function DiffBadge({ current, previous, previousLabel, tone = "higher-better" }: {
  current: number | null;
  previous: number | null;
  previousLabel: string | null;
  tone?: Tone;
}) {
  if (!previousLabel) return null;
  const diff = percentDiff(current, previous);
  if (!diff) return null;
  const positive = (diff.direction === "up") === (tone === "higher-better");
  const title = `${diff.formatted} vs ${previousLabel}`;
  return (
    <span className={`charts-diff ${positive ? "charts-diff-positive" : "charts-diff-negative"}`} title={title}>
      <svg width="8" height="8" viewBox="0 0 10 10" aria-hidden="true">
        {diff.direction === "up"
          ? <path d="M5 2L9 8H1L5 2Z" fill="currentColor" />
          : <path d="M5 8L1 2H9L5 8Z" fill="currentColor" />}
      </svg>
      <span>{diff.formatted}</span>
    </span>
  );
}

export function PeriodTable({ granularity, buckets }: Props) {
  const nonEmpty = [...buckets].filter(bucket => bucket.runCount > 0).reverse();
  if (!nonEmpty.length) return null;
  return (
    <section aria-label="Period breakdown">
      <h2 className="charts-section-heading">Period breakdown</h2>
      <div className="runs-table-scroll">
        <table className="runs-table charts-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Runs</th>
              <th>Distance</th>
              <th>Duration</th>
              <th>Avg pace</th>
              <th>Elev gain</th>
              <th>Avg HR</th>
            </tr>
          </thead>
          <tbody>
            {nonEmpty.map((bucket, index) => {
              const previous = nonEmpty[index + 1] ?? null;
              const previousLabel = previous ? formatBucketLabel(granularity, previous) : null;
              return (
                <tr key={bucket.key}>
                  <td>{formatBucketLabel(granularity, bucket)}</td>
                  <td>{bucket.runCount}</td>
                  <td>
                    {(bucket.distanceMeters / 1000).toFixed(2)} km
                    <DiffBadge current={bucket.distanceMeters} previous={previous?.distanceMeters ?? null} previousLabel={previousLabel} />
                  </td>
                  <td>
                    {bucket.durationSeconds > 0 ? formatDuration(bucket.durationSeconds) : "—"}
                    <DiffBadge
                      current={bucket.durationSeconds > 0 ? bucket.durationSeconds : null}
                      previous={previous && previous.durationSeconds > 0 ? previous.durationSeconds : null}
                      previousLabel={previousLabel}
                    />
                  </td>
                  <td>
                    {bucket.averagePaceSecondsPerKm != null ? `${formatClock(bucket.averagePaceSecondsPerKm)} /km` : "—"}
                    <DiffBadge
                      current={bucket.averagePaceSecondsPerKm}
                      previous={previous?.averagePaceSecondsPerKm ?? null}
                      previousLabel={previousLabel}
                      tone="lower-better"
                    />
                  </td>
                  <td>{bucket.elevationGainMeters > 0 ? `${Math.round(bucket.elevationGainMeters)} m` : "—"}</td>
                  <td>{bucket.averageHeartRate != null ? `${Math.round(bucket.averageHeartRate)} bpm` : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
