import { useRef, type PointerEvent, type KeyboardEvent } from "react";
import { usePlotArea, ZIndexLayer, DefaultZIndexes } from "recharts";
import { nonNegative, scaleDomain, shiftDomain, type Domain } from "@/components/runs/chartScale";
import { isPace, type Metric } from "@/components/runs/metrics";

export const AXIS_WIDTH = 76;
export type ScaleUpdate = { x?: Domain; y?: Partial<Record<Metric, Domain>> };
type Axis = Metric | "x";
type Props = {
  metrics: { key: Metric; label: string }[]; x: Domain; y: Record<Metric, Domain>;
  onChange: (update: ScaleUpdate) => void; onReset: (axis: Axis) => void;
  onDragging: (dragging: boolean) => void;
};
type Drag = {
  axis: Axis; pointer: number; startX: number; startY: number; lastX: number; lastY: number;
  domain: Domain; current: Domain; scaling: boolean;
};

export function RunChartGestures({ metrics, x, y, onChange, onReset, onDragging }: Props) {
  const area = usePlotArea();
  const drag = useRef<Drag | null>(null);
  if (!area || !area.width || !area.height) return null;

  function begin(event: PointerEvent<SVGRectElement>, axis: Axis) {
    if (event.button !== 0 || drag.current) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const domain = axis === "x" ? x : y[axis];
    drag.current = { axis, pointer: event.pointerId, startX: event.clientX, startY: event.clientY,
      lastX: event.clientX, lastY: event.clientY, domain, current: domain, scaling: event.shiftKey };
    onDragging(true);
  }
  function move(event: PointerEvent<SVGRectElement>) {
    const start = drag.current;
    if (!start || start.pointer !== event.pointerId || !area) return;
    if (start.scaling !== event.shiftKey) {
      start.domain = start.current;
      start.startX = start.lastX; start.startY = start.lastY;
      start.scaling = event.shiftKey;
    }
    const dx = (event.clientX - start.startX) / area.width;
    const dy = (event.clientY - start.startY) / area.height;
    if (start.axis === "x") {
      start.current = start.scaling ? scaleDomain(start.domain, Math.exp(-dx * 3), true) : shiftDomain(start.domain, -dx, true);
      onChange({ x: start.current });
    } else {
      start.current = start.scaling ? scaleDomain(start.domain, Math.exp(dy * 3), nonNegative(start.axis))
        : shiftDomain(start.domain, isPace(start.axis) ? -dy : dy, nonNegative(start.axis));
      onChange({ y: { [start.axis]: start.current } });
    }
    start.lastX = event.clientX; start.lastY = event.clientY;
  }
  function end(event: PointerEvent<SVGRectElement>) {
    if (!drag.current || event.pointerId !== drag.current.pointer) return;
    drag.current = null;
    onDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function keyboard(event: KeyboardEvent<SVGRectElement>, axis: Axis) {
    if (event.key === "Home" || event.key === "Enter") { event.preventDefault(); onReset(axis); return; }
    const direction = ["ArrowUp", "ArrowRight"].includes(event.key) ? 1 : ["ArrowDown", "ArrowLeft"].includes(event.key) ? -1 : 0;
    if (!direction) return;
    event.preventDefault();
    if (axis === "x") onChange({ x: event.shiftKey ? scaleDomain(x, Math.exp(-direction * .15), true) : shiftDomain(x, direction * .1, true) });
    else onChange({ y: { [axis]: event.shiftKey ? scaleDomain(y[axis], Math.exp(-direction * .15), nonNegative(axis))
      : shiftDomain(y[axis], (isPace(axis) ? -direction : direction) * .1, nonNegative(axis)) } });
  }
  const handlers = (axis: Axis) => ({
    onPointerDown: (event: PointerEvent<SVGRectElement>) => begin(event, axis),
    onPointerMove: move, onPointerUp: end, onPointerCancel: end, onLostPointerCapture: end,
    onDoubleClick: () => onReset(axis), onKeyDown: (event: KeyboardEvent<SVGRectElement>) => keyboard(event, axis),
    tabIndex: 0, role: "button", fill: "transparent", style: { touchAction: "none" },
  });
  return <ZIndexLayer zIndex={DefaultZIndexes.label + 1}><g className="run-chart-gestures">
    {metrics.map((metric, index) => <rect {...handlers(metric.key)} key={metric.key} className="run-scale-y"
      x={index % 2 ? area.x + area.width + Math.floor(index / 2) * AXIS_WIDTH : area.x - (Math.floor(index / 2) + 1) * AXIS_WIDTH}
      y={area.y} width={AXIS_WIDTH} height={area.height}
      aria-label={`Scale ${metric.label}. Drag vertically to move; hold Shift to scale. Arrow keys follow the same controls. Double-click or press Home to reset.`} />)}
    <rect {...handlers("x")} className="run-scale-x" x={area.x} y={area.y + area.height} width={area.width} height={48}
      aria-label="Scale X axis. Drag horizontally to move; hold Shift to scale. Arrow keys follow the same controls. Double-click or press Home to reset." />
  </g></ZIndexLayer>;
}
