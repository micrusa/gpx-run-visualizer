import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { type RunSelection } from "@/lib/runSelectionService";
import { RunSelectionSummary } from "@/components/runs/RunSelectionSummary";
import { type RunDetail } from "@/lib/runService";
import { formatClock, formatStartDate } from "@/components/runs/format";
import { type Metric, type XAxis } from "@/components/runs/metrics";
import { RunDisplayControls } from "@/components/runs/RunDisplayControls";
import { availableMetrics, DEFAULT_CHART_SETTINGS, graphValues, paceFilterExclusions } from "@/components/runs/chartData";
import { RunExport } from "@/components/runs/RunExport";
import { RunGraph } from "@/components/runs/RunGraph";

import { useAnimationFrame } from "@/components/runs/useAnimationFrame";
import { RunRegression } from "@/components/runs/RunRegression";

const RunMap = dynamic(() => import("@/components/runs/RunMap"), {
  ssr: false, loading: () => <div className="run-map-loading" role="status">Loading map…</div>,
});

export function RunExplorer({ run }: { run: RunDetail }) {
  const available = useMemo(() => availableMetrics(run.points), [run.points]);
  const [selected, setSelected] = useState<Metric[]>(() => {
    const defaults = available.filter(key => key === "paceSecondsPerKm" || key === "elevationMeters");
    return defaults.length ? defaults : available.slice(0, 1);
  });
  const [settings, setSettings] = useState(DEFAULT_CHART_SETTINGS);
  const excluded = useMemo(() => paceFilterExclusions(run.points, settings.pointFilter), [run.points, settings.pointFilter]);
  const values = useMemo(() => graphValues(run.points, settings, excluded), [run.points, settings, excluded]);
  const [xAxis, setXAxis] = useState<XAxis>("distance");
  const [hovered, setHovered] = useState<number | null>(null);
  const [selections, setSelections] = useState<RunSelection[]>([]);
  const selection = selections[selections.length - 1] ?? null;
  const filterCounts = useMemo(() => {
    const start = selection?.start ?? 0;
    const end = selection?.end ?? excluded.length - 1;
    let hidden = 0;
    for (let index = start; index <= end; index++) {
      if (excluded[index]) hidden++;
    }
    return { hidden, total: end - start + 1, isSelection: selection != null };
  }, [excluded, selection]);
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
    <div className="run-detail-heading">
      <h1 className="run-title">{run.summary.name?.trim() || "Run"}</h1>
      <RunExport runId={run.summary.id} points={run.points} values={values} excluded={excluded} selection={selection} />
    </div>
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
        <RunRegression metrics={available} points={run.points} selection={selection} values={values} />
      </div>
      <RunDisplayControls settings={settings} onSettings={setSettings} filterCounts={filterCounts} available={available} selected={selected} onSelected={setSelected}
        xAxis={xAxis} onXAxis={axis => { onHover(null); setXAxis(axis); }} hasTime={hasTime}>
        {selection && <RunSelectionSummary points={run.points} selection={selection} values={values} />}
      </RunDisplayControls>
    </div>
  </>;
}
