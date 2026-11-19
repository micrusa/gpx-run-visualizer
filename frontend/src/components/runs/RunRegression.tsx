import { memo, useMemo, useState } from "react";
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import type { RunPoint } from "@/lib/runService";
import type { RunSelection } from "@/lib/runSelectionService";
import type { graphValues } from "@/components/runs/chartData";
import { formatClock } from "@/components/runs/format";
import { METRICS, metricValue, type Metric } from "@/components/runs/metrics";
import { linearRegression } from "@/components/runs/regression";

import { sampleScatter } from "@/components/runs/chartSampling";

type RegressionVariable = Metric | "timeSeconds";
const VARIABLES: { key: RegressionVariable; label: string; unit: string }[] = [
  ...METRICS, { key: "timeSeconds", label: "Time", unit: "min:sec" },
];
type Props = { metrics: Metric[]; values: ReturnType<typeof graphValues>; points: RunPoint[]; selection: RunSelection | null };

function variableValue(key: RegressionVariable, value: number) {
  return key === "timeSeconds" ? formatClock(value) : metricValue(key, value);
}

export const RunRegression = memo(function RunRegression({ metrics, points, selection, values }: Props) {
  const available = useMemo(() => {
    const firstTime = points.find(point => Number.isFinite(point.timeSeconds))?.timeSeconds;
    const hasTime = points.some(point => Number.isFinite(point.timeSeconds) && point.timeSeconds !== firstTime);
    return VARIABLES.filter(variable => variable.key === "timeSeconds" ? hasTime : metrics.includes(variable.key));
  }, [metrics, points]);
  const [x, setX] = useState<RegressionVariable>(available.find(metric => metric.key === "gradePercent")?.key ?? available[0]?.key ?? "gradePercent");
  const [y, setY] = useState<RegressionVariable>(available.find(metric => metric.key === "paceSecondsPerKm" && metric.key !== x)?.key
    ?? available.find(metric => metric.key !== x)?.key ?? "paceSecondsPerKm");
  const fit = useMemo(() => {
    const paired = [];
    for (let index = selection?.start ?? 0; index <= (selection?.end ?? points.length - 1); index++) {
      const xv = x === "timeSeconds" ? points[index].timeSeconds : values[x][index];
      const yv = y === "timeSeconds" ? points[index].timeSeconds : values[y][index];
      if (xv != null && yv != null) paired.push({ x: xv, y: yv });
    }
    return linearRegression(paired);
  }, [points, selection, values, x, y]);
  const dots = useMemo(() => sampleScatter(fit?.samples ?? []), [fit]);
  const bounds = useMemo(() => {
    const samples = fit?.samples ?? [];
    return { x: samples.reduce<[number, number]>(([min, max], p) => [Math.min(min, p.x), Math.max(max, p.x)], [Infinity, -Infinity]),
      y: samples.reduce<[number, number]>(([min, max], p) => [Math.min(min, p.y), Math.max(max, p.y)], [Infinity, -Infinity]) };
  }, [fit]);
  const xMetric = VARIABLES.find(metric => metric.key === x)!;
  const yMetric = VARIABLES.find(metric => metric.key === y)!;
  function chooseX(value: RegressionVariable) {
    setX(value);
    if (value === y) setY(x);
  }
  return <section className="run-graph-panel" aria-labelledby="regression-heading">
    <h2 id="regression-heading">Regression</h2>
    {available.length < 2 ? <p>Two metrics needed.</p> : <>
      <div className="regression-controls">
        <label>X variable<select value={x} onChange={event => chooseX(event.target.value as RegressionVariable)}>
          {available.map(metric => <option key={metric.key} value={metric.key}>{metric.label} ({metric.unit})</option>)}
        </select></label>
        <label>Y variable<select value={y} onChange={event => setY(event.target.value as RegressionVariable)}>
          {available.filter(metric => metric.key !== x).map(metric => <option key={metric.key} value={metric.key}>{metric.label} ({metric.unit})</option>)}
        </select></label>
      </div>
      <small>{selection ? "Selected period" : "Full run"} · Filtered and smoothed when enabled</small>
      {!fit ? <p role="status">Need 3+ paired samples with variation</p> : <>
        <p className="regression-summary" role="status"><strong>r = {fit.r.toFixed(2)}</strong><span>R² = {fit.rSquared.toFixed(2)}</span><span>{fit.samples.length.toLocaleString()} paired samples</span>{dots.length < fit.samples.length && <span>{dots.length.toLocaleString()} dots shown</span>}</p>
        <div className="run-chart-scroll"><div className="run-chart">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <ScatterChart accessibilityLayer margin={{ top: 16, right: 24, bottom: 28, left: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dce3e0" />
              <XAxis type="number" dataKey="x" name={xMetric.label} domain={bounds.x}
                tickFormatter={value => variableValue(x, Number(value))}
                label={{ value: `${xMetric.label} (${xMetric.unit})`, position: "insideBottom", offset: -18 }} />
              <YAxis type="number" dataKey="y" name={yMetric.label} width={85} domain={bounds.y}
                tickFormatter={value => variableValue(y, Number(value))}
                label={{ value: `${yMetric.label} (${yMetric.unit})`, angle: -90, position: "insideLeft", offset: -8 }} />
              <Tooltip formatter={(value, name) => [variableValue(name === xMetric.label ? x : y, Number(value)), name]} />
              <Scatter name="Samples" data={dots} fill="#307d57" fillOpacity={0.35} isAnimationActive={false} />
              <Scatter name="Linear fit" data={fit.line} fill="#c45127" line={{ stroke: "#c45127", strokeWidth: 3 }} shape={() => <g />} isAnimationActive={false} />
            </ScatterChart>
          </ResponsiveContainer>
        </div></div>
      </>}
    </>}
  </section>;
});
