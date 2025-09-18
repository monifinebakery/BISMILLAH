// src/utils/queryPersistence.ts - IndexedDB-backed React Query cache persistence
import { dehydrate, QueryClient } from '@tanstack/react-query';

const DB_NAME = 'rqCacheDB';
const STORE_NAME = 'rqCacheStore';
const STORAGE_KEY = 'rq-cache-v1';
const MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

type PersistedState = {
  ts: number;
  data: unknown;
};

// ---------------------------
// IndexedDB helpers
// ---------------------------
let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (e) {
      reject(e);
    }
  });
  return dbPromise;
}

async function idbGet<T = unknown>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function idbSet<T = unknown>(key: string, value: T): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value as any, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // best-effort
  }
}

function safeParse(json: string): PersistedState | null {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// ---------------------------
// Public API
// ---------------------------
export async function loadPersistedQueryState(): Promise<unknown | null> {
  // Try IndexedDB
  const fromIDB = await idbGet<PersistedState>(STORAGE_KEY);
  if (fromIDB && typeof fromIDB.ts === 'number' && Date.now() - fromIDB.ts <= MAX_AGE_MS) {
    return fromIDB.data ?? null;
  }
  // Fallback to localStorage (legacy)
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = safeParse(raw);
    if (!parsed || typeof parsed.ts !== 'number') return null;
    if (Date.now() - parsed.ts > MAX_AGE_MS) return null;
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

async function persistNow(queryClient: QueryClient) {
  try {
    const dehydrated = dehydrate(queryClient);
    const payload: PersistedState = { ts: Date.now(), data: dehydrated };
    await idbSet(STORAGE_KEY, payload);
    // Keep legacy localStorage as a tiny fallback (optional)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (storageError) {
      console.warn('queryPersistence: failed to persist cache to localStorage', storageError);
    }
  } catch (error) {
    console.warn('queryPersistence: failed to persist cache to IndexedDB', error);
  }
}

export function setupQueryPersistence(queryClient: QueryClient) {
  const persistThrottled = throttle(() => { void persistNow(queryClient); }, 2000);

  const unsubQuery = queryClient.getQueryCache().subscribe(() => {
    persistThrottled();
  });
  const unsubMutation = queryClient.getMutationCache().subscribe(() => {
    persistThrottled();
  });

  const handleBeforeUnload = () => { void persistNow(queryClient); };
  window.addEventListener('beforeunload', handleBeforeUnload);

  return () => {
    unsubQuery();
    unsubMutation();
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}

// Clear persisted state (IndexedDB + localStorage fallback)
export async function clearPersistedQueryState() {
  try {
    // Clear IDB
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(STORAGE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.warn('queryPersistence: failed to remove cached state from IndexedDB', error);
  }
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (storageError) {
    console.warn('queryPersistence: failed to remove cached state from localStorage', storageError);
  }
}
