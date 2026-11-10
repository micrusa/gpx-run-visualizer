import { useRef, useState, type PointerEvent } from "react";
import { usePlotArea, useXAxisInverseScale, ZIndexLayer, DefaultZIndexes } from "recharts";

type Props = { onSelect: (from: number, to: number) => void; onBack: () => void; onDragging: (active: boolean) => void };
type Drag = { pointer: number; start: number; end: number; clientX: number };

export function RunChartSelection({ onSelect, onBack, onDragging }: Props) {
  const area = usePlotArea();
  const inverse = useXAxisInverseScale();
  const drag = useRef<Drag | null>(null);
  const [highlight, setHighlight] = useState<[number, number] | null>(null);
  if (!area || !inverse || !area.width || !area.height) return null;

  function position(event: PointerEvent<SVGRectElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    return area!.x + fraction * area!.width;
  }
  function begin(event: PointerEvent<SVGRectElement>) {
    if (event.button !== 0 || drag.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const x = position(event);
    drag.current = { pointer: event.pointerId, start: x, end: x, clientX: event.clientX };
    setHighlight([x, x]); onDragging(true);
  }
  function move(event: PointerEvent<SVGRectElement>) {
    if (!drag.current || drag.current.pointer !== event.pointerId) return;
    drag.current.end = position(event);
    setHighlight([drag.current.start, drag.current.end]);
  }
  function finish(event: PointerEvent<SVGRectElement>, commit: boolean) {
    const active = drag.current;
    if (!active || active.pointer !== event.pointerId) return;
    const end = position(event);
    drag.current = null; setHighlight(null); onDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (commit && Math.abs(event.clientX - active.clientX) >= 5) {
      const from = inverse!(active.start), to = inverse!(end);
      if (typeof from === "number" && typeof to === "number") onSelect(from, to);
    }
  }
  return <ZIndexLayer zIndex={DefaultZIndexes.label + 1}>
    <rect className="run-select-area" x={area.x} y={area.y} width={area.width} height={area.height}
      fill="transparent" style={{ touchAction: "none", userSelect: "none" }} tabIndex={0} role="button"
      aria-label="Drag horizontally to select a period. Double-click or press Enter to unzoom."
      onPointerDown={begin} onPointerMove={move} onPointerUp={event => finish(event, true)}
      onPointerCancel={event => finish(event, false)} onLostPointerCapture={event => finish(event, false)}
      onDoubleClick={onBack} onKeyDown={event => { if (event.key === "Enter" || event.key === "Home") { event.preventDefault(); onBack(); } }} />
    {highlight && <rect x={Math.min(...highlight)} y={area.y} width={Math.abs(highlight[1] - highlight[0])} height={area.height}
      fill="#17604e" fillOpacity={.16} stroke="#17604e" pointerEvents="none" />}
  </ZIndexLayer>;
}
