import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import type { ChartBucket, ChartGranularity } from "@/lib/chartsService";
import { formatBucketLabel, formatBucketTick } from "@/components/charts/chartPeriods";
import {
  VOLUME_METRICS,
  formatVolumeTick,
  formatVolumeValue,
  volumeAverage,
  type VolumeMetric,
} from "@/components/charts/chartMetrics";

type Props = {
  granularity: ChartGranularity;
  buckets: ChartBucket[];
  metric: VolumeMetric;
  onMetricChange: (metric: VolumeMetric) => void;
};

export function VolumeChart({ granularity, buckets, metric, onMetricChange }: Props) {
  const definition = VOLUME_METRICS.find(item => item.key === metric) ?? VOLUME_METRICS[0];
  const average = useMemo(() => volumeAverage(buckets, metric), [buckets, metric]);
  const data = useMemo(
    () => buckets.map(bucket => ({
      bucket,
      tick: formatBucketTick(granularity, bucket),
      label: formatBucketLabel(granularity, bucket),
      value: definition.read(bucket),
    })),
    [buckets, granularity, definition],
  );

  return (
    <section className="run-graph-panel" aria-label="Volume chart">
      <div className="run-graph-toolbar charts-panel-toolbar">
        <h2>Volume ({definition.unit})</h2>
        <div className="charts-group" role="group" aria-label="Volume metric">
          {VOLUME_METRICS.map(item => (
            <button
              key={item.key}
              type="button"
              className={metric === item.key ? "charts-button-active" : undefined}
              aria-pressed={metric === item.key}
              onClick={() => onMetricChange(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {average != null && (
        <small className="charts-note">
          Average per {granularity === "DAILY" ? "day" : granularity === "WEEKLY" ? "week" : "month"}: {formatVolumeValue(metric, average)}
        </small>
      )}
      <div className="run-chart-scroll">
        <div className="charts-chart">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={data} margin={{ top: 10, right: 12, bottom: 8, left: 4 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="tick" tick={{ fontSize: 12, fill: "#505459" }} minTickGap={16} />
              <YAxis
                width={52}
                allowDecimals={metric === "distanceKm"}
                tick={{ fontSize: 12, fill: definition.color }}
                tickFormatter={value => formatVolumeTick(metric, Number(value))}
              />
              <Tooltip
                labelFormatter={(_label, payload) => payload?.[0]?.payload?.label ?? ""}
                formatter={value => [typeof value === "number" ? formatVolumeValue(metric, value) : "—", definition.label]}
              />
              {average != null && (
                <ReferenceLine y={average} stroke={definition.color} strokeDasharray="4 4" strokeOpacity={0.65} />
              )}
              <Bar dataKey="value" name={definition.label} fill={definition.color} maxBarSize={36} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
