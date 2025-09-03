// Performance monitoring component
// Tracks bundle loading, component render times, and memory usage

import React, { useState, useEffect } from 'react';
import { Activity, Clock, HardDrive, Zap } from 'lucide-react';

interface PerformanceMetrics {
  bundleLoadTime: number;
  componentRenderTime: number;
  memoryUsage: number;
  networkRequests: number;
  routeLoadTime: number;
}

interface BundleInfo {
  name: string;
  size: number;
  loadTime: number;
  cached: boolean;
}

const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    bundleLoadTime: 0,
    componentRenderTime: 0,
    memoryUsage: 0,
    networkRequests: 0,
    routeLoadTime: 0
  });
  
  const [bundleInfo, setBundleInfo] = useState<BundleInfo[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const calculateMetrics = () => {
      // Get performance timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const resources = performance.getEntriesByType('resource');
      
      // Bundle load time
      const jsResources = resources.filter(r => r.name.includes('.js'));
      const bundleLoadTime = jsResources.reduce((total, resource) => {
        return total + (resource.responseEnd - resource.startTime);
      }, 0);

      // Network requests count
      const networkRequests = resources.length;

      // Route load time (DOM content loaded)
      const routeLoadTime = navigation.domContentLoadedEventEnd - navigation.fetchStart;

      // Memory usage (if available)
      const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;

      // Bundle information
      const bundles: BundleInfo[] = jsResources.map(resource => ({
        name: resource.name.split('/').pop() || 'unknown',
        size: resource.transferSize || 0,
        loadTime: resource.responseEnd - resource.startTime,
        cached: resource.transferSize === 0
      }));

      setMetrics({
        bundleLoadTime: Math.round(bundleLoadTime),
        componentRenderTime: 0, // Will be calculated by component renders
        memoryUsage: Math.round(memoryUsage / 1024 / 1024), // MB
        networkRequests,
        routeLoadTime: Math.round(routeLoadTime)
      });

      setBundleInfo(bundles);
    };

    // Calculate metrics after initial load
    setTimeout(calculateMetrics, 1000);

    // Update memory usage periodically
    const memoryInterval = setInterval(() => {
      if ((performance as any).memory) {
        setMetrics(prev => ({
          ...prev,
          memoryUsage: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)
        }));
      }
    }, 5000);

    return () => clearInterval(memoryInterval);
  }, []);

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  const formatTime = (ms: number) => `${ms}ms`;
  const formatSize = (bytes: number) => {
    if (bytes === 0) return 'cached';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${Math.round(bytes / 1024 / 1024)}MB`;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full shadow-lg transition-colors"
        title="Performance Monitor"
      >
        <Activity className="h-4 w-4" />
      </button>

      {isVisible && (
        <div className="absolute bottom-12 right-0 w-80 bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-h-96 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold text-gray-900">Performance Monitor</h3>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700">Route Load</span>
              </div>
              <div className="text-lg font-bold text-blue-900">
                {formatTime(metrics.routeLoadTime)}
              </div>
            </div>

            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-700">Bundle Load</span>
              </div>
              <div className="text-lg font-bold text-green-900">
                {formatTime(metrics.bundleLoadTime)}
              </div>
            </div>

            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <HardDrive className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-purple-700">Memory</span>
              </div>
              <div className="text-lg font-bold text-purple-900">
                {metrics.memoryUsage}MB
              </div>
            </div>

            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-orange-700">Requests</span>
              </div>
              <div className="text-lg font-bold text-orange-900">
                {metrics.networkRequests}
              </div>
            </div>
          </div>

          {/* Bundle Information */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Bundles Loaded</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {bundleInfo
                .sort((a, b) => b.size - a.size)
                .slice(0, 10)
                .map((bundle, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded"
                  >
                    <div className="flex-1 truncate pr-2">
                      <span className="font-mono text-xs">{bundle.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        bundle.cached 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {formatSize(bundle.size)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(bundle.loadTime)}
                      </span>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Performance Tips */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-600">
              <div className="mb-1">
                <strong>Performance Tips:</strong>
              </div>
              <ul className="space-y-1">
                {metrics.bundleLoadTime > 3000 && (
                  <li className="text-orange-600">• Bundle load time is high (&gt;3s)</li>
                )}
                {metrics.memoryUsage > 50 && (
                  <li className="text-red-600">• Memory usage is high (&gt;50MB)</li>
                )}
                {metrics.networkRequests > 50 && (
                  <li className="text-yellow-600">• Many network requests ({metrics.networkRequests})</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;
