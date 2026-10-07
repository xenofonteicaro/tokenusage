import { useCallback, useEffect, useRef, useState } from "react";
import type { UsagePayload } from "../../lib/usage-snapshot";

export interface SnapshotState {
  snapshot: UsagePayload | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// Loads on mount, then every `intervalMs` and on demand. A failed refresh keeps
// the last good snapshot and only records the error.
export function useSnapshot(
  load: () => Promise<UsagePayload>,
  intervalMs = 60_000,
): SnapshotState {
  const [snapshot, setSnapshot] = useState<UsagePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const alive = useRef(true);
  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    try {
      const next = await load();
      if (alive.current) {
        setSnapshot(next);
        setError(null);
      }
    } catch (failure) {
      if (alive.current)
        setError(
          failure instanceof Error ? failure.message : "Falha na coleta local.",
        );
    } finally {
      busy.current = false;
      if (alive.current) setLoading(false);
    }
  }, [load]);
  useEffect(() => {
    alive.current = true;
    const first = setTimeout(() => void refresh(), 0);
    const timer = setInterval(() => void refresh(), intervalMs);
    return () => {
      alive.current = false;
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [refresh, intervalMs]);
  return { snapshot, loading, error, refresh: () => void refresh() };
}
