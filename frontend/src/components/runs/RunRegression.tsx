import { memo, useMemo, useState } from "react";
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import type { RunPoint } from "@/lib/runService";
import type { RunSelection } from "@/lib/runSelectionService";
import { chartData, type graphValues, type ChartSettings } from "@/components/runs/chartData";
import { METRICS, metricValue, type Metric } from "@/components/runs/metrics";
import { linearRegression } from "@/components/runs/regression";

import { sampleScatter } from "@/components/runs/chartSampling";

type Props = { values: ReturnType<typeof graphValues>; points: RunPoint[]; selection: RunSelection | null; settings: ChartSettings };

export const RunRegression = memo(function RunRegression({ points, selection, settings, values }: Props) {
  const available = useMemo(() => METRICS.filter(metric => points.some(point => point[metric.key] != null)), [points]);
  const [x, setX] = useState<Metric>(available.find(metric => metric.key === "gradePercent")?.key ?? available[0]?.key ?? "gradePercent");
  const [y, setY] = useState<Metric>(available.find(metric => metric.key === "paceSecondsPerKm" && metric.key !== x)?.key
    ?? available.find(metric => metric.key !== x)?.key ?? "paceSecondsPerKm");
  const data = useMemo(() => chartData(points, "distance", selection, settings, values), [points, selection, settings, values]);
  const fit = useMemo(() => linearRegression(data.flatMap(point => {
    const xv = point[x], yv = point[y];
    return xv != null && yv != null ? [{ x: xv, y: yv }] : [];
  })), [data, x, y]);
  const dots = useMemo(() => sampleScatter(fit?.samples ?? []), [fit]);
  const bounds = useMemo(() => {
    const samples = fit?.samples ?? [];
    return { x: samples.reduce<[number, number]>(([min, max], p) => [Math.min(min, p.x), Math.max(max, p.x)], [Infinity, -Infinity]),
      y: samples.reduce<[number, number]>(([min, max], p) => [Math.min(min, p.y), Math.max(max, p.y)], [Infinity, -Infinity]) };
  }, [fit]);
  const xMetric = METRICS.find(metric => metric.key === x)!;
  const yMetric = METRICS.find(metric => metric.key === y)!;
  function chooseX(value: Metric) {
    setX(value);
    if (value === y) setY(x);
  }
  return <section className="run-graph-panel" aria-labelledby="regression-heading">
    <h2 id="regression-heading">Regression Curves</h2>
    <small>Explore how two measurements relate. Dots are samples; the line is a linear best fit.</small>
    {available.length < 2 ? <p>This run needs at least two recorded measurements to compare.</p> : <>
      <div className="regression-controls">
        <label>X variable<select value={x} onChange={event => chooseX(event.target.value as Metric)}>
          {available.map(metric => <option key={metric.key} value={metric.key}>{metric.label} ({metric.unit})</option>)}
        </select></label>
        <label>Y variable<select value={y} onChange={event => setY(event.target.value as Metric)}>
          {available.filter(metric => metric.key !== x).map(metric => <option key={metric.key} value={metric.key}>{metric.label} ({metric.unit})</option>)}
        </select></label>
      </div>
      <small>{selection ? "Selected period" : "Full run"} · Uses the graph’s filtering and smoothing settings.</small>
      {!fit ? <p role="status">Choose another pair or a wider period. A correlation needs at least three paired samples and variation in both variables.</p> : <>
        <p className="regression-summary" role="status"><strong>r = {fit.r.toFixed(2)}</strong><span>R² = {fit.rSquared.toFixed(2)}</span><span>{fit.samples.length.toLocaleString()} paired samples</span>{dots.length < fit.samples.length && <span>{dots.length.toLocaleString()} dots shown</span>}</p>
        <div className="run-chart-scroll"><div className="run-chart">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <ScatterChart accessibilityLayer margin={{ top: 16, right: 24, bottom: 28, left: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dce3e0" />
              <XAxis type="number" dataKey="x" name={xMetric.label} domain={bounds.x}
                tickFormatter={value => metricValue(x, Number(value))}
                label={{ value: `${xMetric.label} (${xMetric.unit})`, position: "insideBottom", offset: -18 }} />
              <YAxis type="number" dataKey="y" name={yMetric.label} width={85} domain={bounds.y}
                tickFormatter={value => metricValue(y, Number(value))}
                label={{ value: `${yMetric.label} (${yMetric.unit})`, angle: -90, position: "insideLeft", offset: -8 }} />
              <Tooltip formatter={(value, name) => [metricValue(name === xMetric.label ? x : y, Number(value)), name]} />
              <Scatter name="Samples" data={dots} fill="#307d57" fillOpacity={0.35} isAnimationActive={false} />
              <Scatter name="Linear fit" data={fit.line} fill="#c45127" line={{ stroke: "#c45127", strokeWidth: 3 }} shape={() => <g />} isAnimationActive={false} />
            </ScatterChart>
          </ResponsiveContainer>
        </div></div>
      </>}
    </>}
  </section>;
});
