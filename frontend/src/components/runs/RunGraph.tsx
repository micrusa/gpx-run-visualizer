import { memo, useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis as ChartXAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { selectRange, type RunSelection } from "@/lib/runSelectionService";
import { RunChartSelection } from "@/components/runs/RunChartSelection";
import { type RunPoint } from "@/lib/runService";
import { chartData, type graphValues, type ChartSettings } from "@/components/runs/chartData";
import { chartDomain, type Domain } from "@/components/runs/chartScale";
import { RunChartGestures, AXIS_WIDTH, type ScaleUpdate } from "@/components/runs/RunChartGestures";
import { formatClock } from "@/components/runs/format";
import { METRICS, metricValue, type Metric, type XAxis } from "@/components/runs/metrics";

import { sampleChart } from "@/components/runs/chartSampling";
import { useAnimationFrame } from "@/components/runs/useAnimationFrame";

type Props = {
  values: ReturnType<typeof graphValues>;
  settings: ChartSettings; points: RunPoint[]; selected: Metric[]; xAxis: XAxis; onHover: (index: number | null) => void;
  selection: RunSelection | null; onSelect: (selection: RunSelection) => void; onBack: () => void;
};

export const RunGraph = memo(function RunGraph({ points, selected, xAxis, onHover, selection, onSelect, onBack, settings, values }: Props) {
  const data = useMemo(() => chartData(points, xAxis, selection, settings, values), [points, xAxis, selection, settings, values]);
  const domains = useMemo(() => Object.fromEntries(METRICS.map(metric =>
    [metric.key, chartDomain(data, metric.key)])) as Record<Metric, [number, number]>, [data]);
  const [manual, setManual] = useState<Partial<Record<Metric | XAxis, Domain>>>({});
  const [dragging, setDragging] = useState(false);
  const automaticX = useMemo<Domain>(() => {
    const min = data[0]?.x ?? 0, max = data[data.length - 1]?.x ?? min;
    return max > min ? [min, max] : [Math.max(0, min - .5), min + .5];
  }, [data]);
  const visibleX = manual[xAxis] ?? automaticX;
  const visibleY = { ...domains, ...manual } as Record<Metric, Domain>;
  const [width, setWidth] = useState(800);
  const rendered = useMemo(() => sampleChart(data, selected, width, visibleX), [data, selected, width, visibleX]);
  const changeScales = useAnimationFrame((update: ScaleUpdate) => {
    setManual(previous => ({ ...previous, ...update.y, ...(update.x ? { [xAxis]: update.x } : {}) }));
  });
  function resetScales(axis: Metric | "x") {
    setManual(previous => {
      const next = { ...previous };
      delete next[axis === "x" ? xAxis : axis];
      return next;
    });
  }
  const metrics = METRICS.filter(metric => selected.includes(metric.key));
  const header = <div className="run-graph-toolbar"><h2>Run graph</h2>
    {selection && <button onClick={onBack}>Back</button>}</div>;
  if (!selected.length) return <>{header}<p>Select a metric.</p></>;
  if (!data.length) return <>{header}<p>No samples on this axis.</p></>;
  if (!metrics.some(metric => data.some(point => point[metric.key] != null)))
    return <>{header}<p>No data for these settings</p></>;
  return <>
    {header}
    <ul className="run-graph-hints">
      <li>Drag plot to select</li>
      <li>Drag axis to pan · Shift-drag to scale</li>
      <li>Double-click to reset</li>
    </ul>
    <div className="run-chart-scroll"><div className="run-chart">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} onResize={setWidth}>
        <LineChart data={rendered} accessibilityLayer margin={{ top: 12, right: 8, bottom: 24, left: 8 }}
          onMouseMove={state => {
            if (dragging) return;
            const index = state.activeTooltipIndex == null ? null : Number(state.activeTooltipIndex);
            onHover(index == null ? null : rendered[index]?.index ?? null);
          }} onMouseLeave={() => onHover(null)}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dce3e0" />
          <ChartXAxis dataKey="x" type="number" domain={visibleX} allowDataOverflow
            tickFormatter={value => xAxis === "time" ? formatClock(Number(value)) : Number(value).toFixed(1)}
            label={{ value: xAxis === "time" ? "Time (min:sec)" : "Distance (km)", position: "insideBottom", offset: -14 }} />
          {metrics.map((metric, index) => <YAxis key={metric.key} yAxisId={metric.axisId}
            orientation={index % 2 ? "right" : "left"} width={AXIS_WIDTH} domain={visibleY[metric.key]} allowDataOverflow
            reversed={metric.key === "paceSecondsPerKm"} tick={{ fill: metric.color, fontSize: 12 }}
            tickFormatter={value => metricValue(metric.key, Number(value))} />)}
          <Tooltip active={dragging ? false : undefined} labelFormatter={value => xAxis === "time" ? `${formatClock(Number(value))} elapsed` : `${Number(value).toFixed(2)} km`}
            formatter={(value, name) => {
              const metric = metrics.find(metric => metric.label === name);
              return [metric && typeof value === "number" ? metricValue(metric.key, value) : "—", name];
            }} />
          <Legend verticalAlign="top" height={36} />
          {metrics.map(metric => <Line key={metric.key} dataKey={metric.key} yAxisId={metric.axisId} name={metric.label}
            stroke={metric.color} strokeWidth={1.5} dot={false} connectNulls={false} isAnimationActive={false} />)}
          <RunChartSelection onSelect={(from, to) => {
            const range = selectRange(points, xAxis, from, to, selection);
            if (range) onSelect(range);
          }} onBack={() => { setManual({}); onBack(); }}
            onDragging={active => { setDragging(active); if (active) onHover(null); }} />
          <RunChartGestures metrics={metrics} x={visibleX} y={visibleY} onChange={changeScales} onReset={resetScales}
            onDragging={active => { setDragging(active); if (active) onHover(null); }} />
        </LineChart>
      </ResponsiveContainer>
    </div></div>
  </>;
});
