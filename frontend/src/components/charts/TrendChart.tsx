import { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import type { ChartBucket, ChartGranularity } from "@/lib/chartsService";
import { formatBucketLabel, formatBucketTick } from "@/components/charts/chartPeriods";
import {
  TREND_METRICS,
  availableTrendMetrics,
  formatTrendValue,
  trendAxes,
  type TrendMetric,
} from "@/components/charts/chartMetrics";

type Props = {
  granularity: ChartGranularity;
  buckets: ChartBucket[];
  selected: TrendMetric[];
  onToggle: (metric: TrendMetric) => void;
};

const AXIS_WIDTH = 74;

export function TrendChart({ granularity, buckets, selected, onToggle }: Props) {
  const available = useMemo(() => new Set(availableTrendMetrics(buckets)), [buckets]);
  const activeMetrics = useMemo(
    () => TREND_METRICS.filter(metric => selected.includes(metric.key) && available.has(metric.key)),
    [selected, available],
  );
  const axes = useMemo(() => trendAxes(buckets, activeMetrics), [buckets, activeMetrics]);
  const data = useMemo(
    () => buckets.map(bucket => ({
      tick: formatBucketTick(granularity, bucket),
      label: formatBucketLabel(granularity, bucket),
      ...Object.fromEntries(TREND_METRICS.map(metric => [metric.key, metric.read(bucket)])),
    })),
    [buckets, granularity],
  );

  return (
    <section className="run-graph-panel" aria-label="Trend chart">
      <div className="run-graph-toolbar charts-panel-toolbar">
        <h2>Trends</h2>
      </div>
      <div className="charts-metric-options charts-metric-picker" role="group" aria-label="Trend metrics">
        {TREND_METRICS.map(metric => {
          const hasData = available.has(metric.key);
          const checked = selected.includes(metric.key);
          return (
            <label key={metric.key} className={`run-option charts-metric-option${hasData ? "" : " charts-metric-empty"}`}>
              <input
                type="checkbox"
                checked={checked}
                disabled={!hasData}
                onChange={() => onToggle(metric.key)}
              />
              <span className="charts-swatch" style={{ background: metric.color }} aria-hidden="true" />
              <span>{metric.label}</span>
            </label>
          );
        })}
      </div>
      {!selected.length ? (
        <p className="charts-empty">Select at least one metric to plot.</p>
      ) : !activeMetrics.length ? (
        <p className="charts-empty">No data for the selected metrics in this period.</p>
      ) : (
        <div className="run-chart-scroll">
          <div className="charts-chart" style={{ minWidth: Math.max(450, axes.length * AXIS_WIDTH + 200) }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="tick" tick={{ fontSize: 12, fill: "#505459" }} minTickGap={16} />
                {axes.map((axis, index) => (
                  <YAxis
                    key={axis.id}
                    yAxisId={axis.id}
                    orientation={index % 2 ? "right" : "left"}
                    width={AXIS_WIDTH}
                    domain={axis.domain}
                    reversed={axis.reversed}
                    tick={{ fontSize: 11, fill: axis.color }}
                    tickFormatter={value => formatTrendValue(axis.sampleKey, Number(value))}
                  />
                ))}
                <Tooltip
                  labelFormatter={(_label, payload) => payload?.[0]?.payload?.label ?? ""}
                  formatter={(value, name) => {
                    const metric = activeMetrics.find(item => item.label === name);
                    return [metric && typeof value === "number" ? formatTrendValue(metric.key, value) : "—", name];
                  }}
                />
                <Legend verticalAlign="top" height={32} />
                {activeMetrics.map(metric => (
                  <Line
                    key={metric.key}
                    dataKey={metric.key}
                    yAxisId={metric.unit}
                    name={metric.label}
                    stroke={metric.color}
                    strokeWidth={1.75}
                    dot={{ r: 3, fill: metric.color, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  );
}
