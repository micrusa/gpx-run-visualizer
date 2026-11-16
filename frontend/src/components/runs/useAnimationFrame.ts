import { useCallback, useEffect, useRef } from "react";

// Coalesce pointer updates to the latest value in each animation frame.
export function useAnimationFrame<T>(callback: (value: T) => void) {
  const latest = useRef(callback);
  latest.current = callback;
  const frame = useRef<number | null>(null);
  const pending = useRef<T | null>(null);
  useEffect(() => () => { if (frame.current != null) cancelAnimationFrame(frame.current); }, []);
  return useCallback((value: T) => {
    pending.current = value;
    if (frame.current != null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      latest.current(pending.current as T);
    });
  }, []);
}
