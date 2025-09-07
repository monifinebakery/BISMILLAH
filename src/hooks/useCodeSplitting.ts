import { useState, useEffect, useCallback } from 'react';
import { preloadComponents } from '@/config/codeSplitting';

interface CodeSplittingState {
  loadedChunks: Set<string>;
  loadingChunks: Set<string>;
  failedChunks: Set<string>;
}

interface UseCodeSplittingReturn {
  preloadRoute: (route: string) => Promise<void>;
  isChunkLoaded: (chunkName: string) => boolean;
  isChunkLoading: (chunkName: string) => boolean;
  isChunkFailed: (chunkName: string) => boolean;
  getLoadingStats: () => {
    total: number;
    loaded: number;
    loading: number;
    failed: number;
  };
}

/**
 * Hook untuk mengelola code splitting dan lazy loading komponen
 * Menyediakan preloading, status tracking, dan error handling
 */
export const useCodeSplitting = (): UseCodeSplittingReturn => {
  const [state, setState] = useState<CodeSplittingState>({
    loadedChunks: new Set(),
    loadingChunks: new Set(),
    failedChunks: new Set()
  });

  // Preload komponen berdasarkan route
  const preloadRoute = useCallback(async (route: string) => {
    if (state.loadedChunks.has(route) || state.loadingChunks.has(route)) {
      return;
    }

    setState(prev => ({
      ...prev,
      loadingChunks: new Set([...prev.loadingChunks, route])
    }));

    try {
      await preloadComponents.byRoute(route);
      setState(prev => ({
        ...prev,
        loadedChunks: new Set([...prev.loadedChunks, route]),
        loadingChunks: new Set([...prev.loadingChunks].filter(chunk => chunk !== route)),
        failedChunks: new Set([...prev.failedChunks].filter(chunk => chunk !== route))
      }));
    } catch (error) {
      console.error(`Failed to preload route: ${route}`, error);
      setState(prev => ({
        ...prev,
        loadingChunks: new Set([...prev.loadingChunks].filter(chunk => chunk !== route)),
        failedChunks: new Set([...prev.failedChunks, route])
      }));
    }
  }, [state.loadedChunks, state.loadingChunks]);

  // Status checking functions
  const isChunkLoaded = useCallback((chunkName: string) => {
    return state.loadedChunks.has(chunkName);
  }, [state.loadedChunks]);

  const isChunkLoading = useCallback((chunkName: string) => {
    return state.loadingChunks.has(chunkName);
  }, [state.loadingChunks]);

  const isChunkFailed = useCallback((chunkName: string) => {
    return state.failedChunks.has(chunkName);
  }, [state.failedChunks]);

  // Get loading statistics
  const getLoadingStats = useCallback(() => {
    const total = state.loadedChunks.size + state.loadingChunks.size + state.failedChunks.size;
    return {
      total,
      loaded: state.loadedChunks.size,
      loading: state.loadingChunks.size,
      failed: state.failedChunks.size
    };
  }, [state]);

  // Preload komponen prioritas tinggi saat mount
  useEffect(() => {
    const preloadHighPriorityComponents = async () => {
      const highPriorityRoutes = ['dashboard', 'orders', 'profit-analysis'];
      
      // Preload secara bertahap untuk menghindari blocking
      for (const route of highPriorityRoutes) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
        preloadRoute(route).catch(console.error);
      }
    };

    // Delay preloading untuk tidak mengganggu initial render
    const timer = setTimeout(preloadHighPriorityComponents, 1000);
    return () => clearTimeout(timer);
  }, [preloadRoute]);

  return {
    preloadRoute,
    isChunkLoaded,
    isChunkLoading,
    isChunkFailed,
    getLoadingStats
  };
};

/**
 * Hook untuk preloading komponen saat hover (untuk UX yang lebih baik)
 */
export const useHoverPreload = () => {
  const { preloadRoute } = useCodeSplitting();

  const handleMouseEnter = useCallback((route: string) => {
    preloadRoute(route).catch(console.error);
  }, [preloadRoute]);

  return { handleMouseEnter };
};

/**
 * Hook untuk monitoring performa code splitting
 */
export const useCodeSplittingMetrics = () => {
  const [metrics, setMetrics] = useState({
    chunkLoadTimes: new Map<string, number>(),
    totalBundleSize: 0,
    loadedBundleSize: 0
  });

  const recordChunkLoadTime = useCallback((chunkName: string, loadTime: number) => {
    setMetrics(prev => ({
      ...prev,
      chunkLoadTimes: new Map([...prev.chunkLoadTimes, [chunkName, loadTime]])
    }));
  }, []);

  const getAverageLoadTime = useCallback(() => {
    const times = Array.from(metrics.chunkLoadTimes.values());
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }, [metrics.chunkLoadTimes]);

  return {
    metrics,
    recordChunkLoadTime,
    getAverageLoadTime
  };
};