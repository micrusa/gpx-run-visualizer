import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getCharts,
  getChartsErrorMessage,
  type ChartGranularity,
  type ChartsData,
} from "@/lib/chartsService";
import { defaultWindow, shiftWindow, todayIsoDate, type DateWindow } from "@/components/charts/chartPeriods";
import { DEFAULT_TREND_METRICS, type TrendMetric, type VolumeMetric } from "@/components/charts/chartMetrics";
import { ChartsControls } from "@/components/charts/ChartsControls";
import { PeriodSummary } from "@/components/charts/PeriodSummary";
import { VolumeChart } from "@/components/charts/VolumeChart";
import { TrendChart } from "@/components/charts/TrendChart";
import { PeriodTable } from "@/components/charts/PeriodTable";

function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function ChartsPanel() {
  const [granularity, setGranularity] = useState<ChartGranularity>("WEEKLY");
  const [window, setWindow] = useState<DateWindow>(() => defaultWindow("WEEKLY"));
  const [volumeMetric, setVolumeMetric] = useState<VolumeMetric>("distanceKm");
  const [selectedTrends, setSelectedTrends] = useState<TrendMetric[]>(DEFAULT_TREND_METRICS);
  const [data, setData] = useState<ChartsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const tz = useMemo(browserTimeZone, []);
  const latestWindow = useMemo(() => defaultWindow(granularity, todayIsoDate()), [granularity]);
  const isLatest = window.from === latestWindow.from && window.to === latestWindow.to;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getCharts({ granularity, from: window.from, to: window.to, tz })
      .then(result => { if (active) setData(result); })
      .catch(err => { if (active) setError(getChartsErrorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [granularity, window.from, window.to, tz, attempt]);

  function handleGranularityChange(next: ChartGranularity) {
    if (next === granularity) return;
    setGranularity(next);
    setWindow(defaultWindow(next));
  }

  function handleToggleTrend(metric: TrendMetric) {
    setSelectedTrends(previous =>
      previous.includes(metric) ? previous.filter(item => item !== metric) : [...previous, metric],
    );
  }

  return (
    <div className="charts-stack">
      <h1>Charts</h1>
      <ChartsControls
        granularity={granularity}
        window={window}
        isLatest={isLatest}
        onGranularityChange={handleGranularityChange}
        onShift={direction => setWindow(previous => shiftWindow(granularity, previous, direction))}
        onResetLatest={() => setWindow(defaultWindow(granularity))}
      />
      {loading && !data ? (
        <p role="status">Loading charts…</p>
      ) : error ? (
        <p role="alert" className="error">
          {error} <button type="button" onClick={() => setAttempt(value => value + 1)}>Retry</button>
        </p>
      ) : data ? (
        <>
          <PeriodSummary totals={data.totals} omittedWithoutTimestamp={data.omittedWithoutTimestamp} />
          {data.totals.runCount === 0 ? (
            <div className="card">
              <p>
                No runs recorded in this period. Try an earlier range or <Link href="/imports">import GPX files</Link>.
              </p>
            </div>
          ) : (
            <>
              <VolumeChart
                granularity={data.granularity}
                buckets={data.buckets}
                metric={volumeMetric}
                onMetricChange={setVolumeMetric}
              />
              <TrendChart
                granularity={data.granularity}
                buckets={data.buckets}
                selected={selectedTrends}
                onToggle={handleToggleTrend}
              />
              <PeriodTable granularity={data.granularity} buckets={data.buckets} />
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
