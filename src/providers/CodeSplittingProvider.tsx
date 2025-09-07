import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useCodeSplitting, useCodeSplittingMetrics } from '@/hooks/useCodeSplitting';
import { BUNDLE_INFO } from '@/config/codeSplitting';

interface CodeSplittingContextType {
  preloadRoute: (route: string) => Promise<void>;
  isChunkLoaded: (chunkName: string) => boolean;
  isChunkLoading: (chunkName: string) => boolean;
  isChunkFailed: (chunkName: string) => boolean;
  loadingStats: {
    total: number;
    loaded: number;
    loading: number;
    failed: number;
  };
  bundleMetrics: {
    totalEstimatedSize: string;
    loadedSize: string;
    loadingProgress: number;
  };
}

const CodeSplittingContext = createContext<CodeSplittingContextType | undefined>(undefined);

interface CodeSplittingProviderProps {
  children: ReactNode;
}

/**
 * Provider untuk mengelola code splitting secara global
 * Menyediakan context untuk tracking loading state dan metrics
 */
export const CodeSplittingProvider: React.FC<CodeSplittingProviderProps> = ({ children }) => {
  const {
    preloadRoute,
    isChunkLoaded,
    isChunkLoading,
    isChunkFailed,
    getLoadingStats
  } = useCodeSplitting();
  
  const { metrics } = useCodeSplittingMetrics();
  const [loadingStats, setLoadingStats] = useState(getLoadingStats());
  const [bundleMetrics, setBundleMetrics] = useState({
    totalEstimatedSize: '0KB',
    loadedSize: '0KB',
    loadingProgress: 0
  });

  // Update loading stats secara berkala
  useEffect(() => {
    const updateStats = () => {
      const stats = getLoadingStats();
      setLoadingStats(stats);
      
      // Hitung bundle metrics
      const totalChunks = Object.keys(BUNDLE_INFO).length;
      const loadedChunks = stats.loaded;
      const progress = totalChunks > 0 ? (loadedChunks / totalChunks) * 100 : 0;
      
      // Estimasi ukuran bundle yang sudah dimuat
      let totalEstimatedKB = 0;
      let loadedEstimatedKB = 0;
      
      Object.entries(BUNDLE_INFO).forEach(([chunkName, info]) => {
        if (info && typeof info === 'object' && 'estimatedSize' in info) {
          const sizeKB = parseInt(String(info.estimatedSize).replace(/[^0-9]/g, '')) || 0;
          totalEstimatedKB += sizeKB;
          
          if (isChunkLoaded(chunkName)) {
            loadedEstimatedKB += sizeKB;
          }
        }
      });
      
      setBundleMetrics({
        totalEstimatedSize: `${totalEstimatedKB}KB`,
        loadedSize: `${loadedEstimatedKB}KB`,
        loadingProgress: progress
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 2000); // Update setiap 2 detik
    
    return () => clearInterval(interval);
  }, [getLoadingStats, isChunkLoaded]);

  // Log metrics untuk debugging (hanya di development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.group('🚀 Code Splitting Metrics');
      console.log('Loading Stats:', loadingStats);
      console.log('Bundle Metrics:', bundleMetrics);
      console.log('Average Load Time:', metrics.chunkLoadTimes.size > 0 ? 
        Array.from(metrics.chunkLoadTimes.values()).reduce((a, b) => a + b, 0) / metrics.chunkLoadTimes.size + 'ms' : 
        'N/A'
      );
      console.groupEnd();
    }
  }, [loadingStats, bundleMetrics, metrics]);

  const contextValue: CodeSplittingContextType = {
    preloadRoute,
    isChunkLoaded,
    isChunkLoading,
    isChunkFailed,
    loadingStats,
    bundleMetrics
  };

  return (
    <CodeSplittingContext.Provider value={contextValue}>
      {children}
    </CodeSplittingContext.Provider>
  );
};

/**
 * Hook untuk menggunakan code splitting context
 */
export const useCodeSplittingContext = (): CodeSplittingContextType => {
  const context = useContext(CodeSplittingContext);
  if (!context) {
    throw new Error('useCodeSplittingContext must be used within a CodeSplittingProvider');
  }
  return context;
};

/**
 * HOC untuk wrapping komponen dengan preloading capability
 */
export const withPreloading = <P extends object>(
  Component: React.ComponentType<P>,
  routeName: string
) => {
  const WrappedComponent = (props: P) => {
    const { preloadRoute } = useCodeSplittingContext();
    
    useEffect(() => {
      // Preload komponen saat component mount
      preloadRoute(routeName).catch(console.error);
    }, [preloadRoute]);
    
    return <Component {...props} />;
  };
  
  WrappedComponent.displayName = `withPreloading(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

/**
 * Komponen untuk menampilkan loading indicator saat code splitting
 */
export const CodeSplittingLoadingIndicator: React.FC<{ 
  show?: boolean;
  className?: string;
}> = ({ 
  show = true, 
  className = 'fixed top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-md text-sm z-50' 
}) => {
  const { loadingStats, bundleMetrics } = useCodeSplittingContext();
  
  if (!show || loadingStats.loading === 0) {
    return null;
  }
  
  return (
    <div className={className}>
      <div className="flex items-center space-x-2">
        <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full" />
        <span>Loading {loadingStats.loading} chunks...</span>
      </div>
      <div className="text-xs mt-1 opacity-75">
        Progress: {Math.round(bundleMetrics.loadingProgress)}%
      </div>
    </div>
  );
};