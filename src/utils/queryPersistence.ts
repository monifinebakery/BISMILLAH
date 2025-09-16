// src/utils/queryPersistence.ts - Lightweight React Query cache persistence
import { dehydrate, QueryClient } from '@tanstack/react-query';

const STORAGE_KEY = 'rq-cache-v1';
const MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

type PersistedState = {
  ts: number;
  data: unknown;
};

function safeParse(json: string): PersistedState | null {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function loadPersistedQueryState(): unknown | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = safeParse(raw);
    if (!parsed || typeof parsed.ts !== 'number') return null;
    if (Date.now() - parsed.ts > MAX_AGE_MS) return null; // expired
    return parsed.data ?? null;
  } catch {
    return null;
  }
}

function throttle<T extends (...args: any[]) => void>(fn: T, wait: number) {
  let last = 0;
  let timer: number | null = null;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = wait - (now - last);
    if (remaining <= 0) {
      last = now;
      fn(...args);
    } else if (timer == null) {
      timer = window.setTimeout(() => {
        last = Date.now();
        timer = null;
        fn(...args);
      }, remaining);
    }
  };
}

function persistNow(queryClient: QueryClient) {
  try {
    const dehydrated = dehydrate(queryClient);
    const payload: PersistedState = { ts: Date.now(), data: dehydrated };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Swallow errors silently – persistence is best-effort only
  }
}

export function setupQueryPersistence(queryClient: QueryClient) {
  const persistThrottled = throttle(() => persistNow(queryClient), 2000);

  const unsubQuery = queryClient.getQueryCache().subscribe(() => {
    persistThrottled();
  });
  const unsubMutation = queryClient.getMutationCache().subscribe(() => {
    persistThrottled();
  });

  const handleBeforeUnload = () => persistNow(queryClient);
  window.addEventListener('beforeunload', handleBeforeUnload);

  return () => {
    unsubQuery();
    unsubMutation();
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}

