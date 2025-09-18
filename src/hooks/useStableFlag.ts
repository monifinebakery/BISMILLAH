import { useEffect, useRef, useState } from 'react';

/**
 * useStableFlag ensures a boolean flag doesn't flicker by enforcing
 * minimum ON and OFF durations between state changes.
 *
 * - minOnMs: minimum time the flag stays true once it becomes true
 * - minOffMs: minimum time the flag stays false once it becomes false
 */
export function useStableFlag(value: boolean, minOnMs = 300, minOffMs = 120) {
  const [stable, setStable] = useState(value);
  const lastSwitchAt = useRef(performance.now());

  useEffect(() => {
    if (value === stable) return;

    const now = performance.now();
    const elapsed = now - lastSwitchAt.current;

    // If incoming value is true, ensure we honored minOffMs while it was false
    // If incoming value is false, ensure we honored minOnMs while it was true
    const wait = value
      ? Math.max(0, minOffMs - elapsed)
      : Math.max(0, minOnMs - elapsed);

    const t = setTimeout(() => {
      setStable(value);
      lastSwitchAt.current = performance.now();
    }, wait);

    return () => clearTimeout(t);
  }, [value, stable, minOnMs, minOffMs]);

  return stable;
}
