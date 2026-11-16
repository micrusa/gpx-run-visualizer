import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { type RunSelection } from "@/lib/runSelectionService";
import { RunSelectionSummary } from "@/components/runs/RunSelectionSummary";
import { type RunDetail } from "@/lib/runService";
import { formatClock, formatStartDate } from "@/components/runs/format";
import { METRICS, type Metric, type XAxis } from "@/components/runs/metrics";
import { RunDisplayControls } from "@/components/runs/RunDisplayControls";
import { DEFAULT_CHART_SETTINGS, graphValues } from "@/components/runs/chartData";
import { RunGraph } from "@/components/runs/RunGraph";

import { useAnimationFrame } from "@/components/runs/useAnimationFrame";
import { RunRegression } from "@/components/runs/RunRegression";

const RunMap = dynamic(() => import("@/components/runs/RunMap"), {
  ssr: false, loading: () => <div className="run-map-loading" role="status">Loading map…</div>,
});

export function RunExplorer({ run }: { run: RunDetail }) {
  const available = useMemo(() => METRICS.filter(metric => run.points.some(point => point[metric.key] != null)).map(metric => metric.key), [run.points]);
  const [selected, setSelected] = useState<Metric[]>(() => {
    const defaults = available.filter(key => key === "paceSecondsPerKm" || key === "elevationMeters");
    return defaults.length ? defaults : available.slice(0, 1);
  });
  const [settings, setSettings] = useState(DEFAULT_CHART_SETTINGS);
  const values = useMemo(() => graphValues(run.points, settings), [run.points, settings]);
  const [xAxis, setXAxis] = useState<XAxis>("distance");
  const [hovered, setHovered] = useState<number | null>(null);
  const [selections, setSelections] = useState<RunSelection[]>([]);
  const selection = selections[selections.length - 1] ?? null;
  const onHover = useAnimationFrame(setHovered);
  const selectPeriod = useCallback((range: RunSelection) => {
    if (selection?.start === range.start && selection.end === range.end) return;
    onHover(null); setSelections(previous => [...previous, range]);
  }, [selection, onHover]);
  const back = useCallback(() => { onHover(null); setSelections(previous => previous.slice(0, -1)); }, [onHover]);
  const hasTime = useMemo(() => {
    let count = 0;
    for (let index = selection?.start ?? 0; index <= (selection?.end ?? run.points.length - 1); index++) {
      if (run.points[index].timeSeconds != null && ++count >= 2) return true;
    }
    return false;
  }, [run.points, selection]);
  return <>
    <h1>Run</h1>
    <p className="run-detail-summary">
      {run.summary.startedAt && <time dateTime={run.summary.startedAt}>{formatStartDate(run.summary.startedAt)}</time>}
      <span>{(run.summary.distanceMeters / 1000).toFixed(2)} km</span>
      {run.summary.durationSeconds != null && <span>{formatClock(run.summary.durationSeconds)} elapsed</span>}
    </p>
    <div className="run-explorer">
      <div className="run-visuals">
        <section aria-label="Run route"><RunMap points={run.points} hovered={hovered} selection={selection} /></section>
        <section className="run-graph-panel" aria-label="Run graph">
          <RunGraph key={selection ? `${selection.start}:${selection.end}` : "full"} points={run.points}
            selected={selected} xAxis={xAxis} settings={settings} values={values} onHover={onHover} selection={selection} onSelect={selectPeriod} onBack={back} />
        </section>
        <RunRegression points={run.points} selection={selection} settings={settings} values={values} />
      </div>
      <RunDisplayControls settings={settings} onSettings={setSettings} available={available} selected={selected} onSelected={setSelected}
        xAxis={xAxis} onXAxis={axis => { onHover(null); setXAxis(axis); }} hasTime={hasTime}>
        {selection && <RunSelectionSummary points={run.points} selection={selection} />}
      </RunDisplayControls>
    </div>
  </>;
}
