// src/components/performance/PerformanceDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { logger } from '@/utils/logger';
import { safePerformance, safeDom } from '@/utils/browserApiSafeWrappers';


interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

export const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  // Function to capture performance metrics
  const captureMetrics = () => {
    if (typeof window === 'undefined' || !window.performance) return;

    const newMetrics: PerformanceMetric[] = [];
    const now = Date.now();

    // Navigation timing
    const navigation = safePerformance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      newMetrics.push(
        { name: 'Page Load', value: navigation.loadEventEnd - navigation.fetchStart, unit: 'ms', timestamp: now },
        { name: 'DOM Content Loaded', value: navigation.domContentLoadedEventEnd - navigation.fetchStart, unit: 'ms', timestamp: now },
        { name: 'First Paint', value: navigation.loadEventEnd - navigation.fetchStart, unit: 'ms', timestamp: now }
      );
    }

    // Memory usage (if available)
    if ((window as any).performance.memory) {
      const memory = (window as any).performance.memory;
      newMetrics.push(
        { name: 'Used Memory', value: Math.round(memory.usedJSHeapSize / 1048576), unit: 'MB', timestamp: now },
        { name: 'Total Memory', value: Math.round(memory.totalJSHeapSize / 1048576), unit: 'MB', timestamp: now }
      );
    }

    setMetrics(prev => [...newMetrics, ...prev.slice(0, 50)]); // Keep only last 50 metrics
  };

  // Start/stop recording
  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  // Effect for periodic metrics capture
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      captureMetrics(); // Capture immediately
      interval = setInterval(captureMetrics, 5000); // Capture every 5 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Clear metrics
  const clearMetrics = () => {
    setMetrics([]);
  };

  // Export metrics
  const exportMetrics = () => {
    const dataStr = JSON.stringify(metrics, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = safeDom.createElement('a');
    link.href = url;
    link.download = 'performance-metrics.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={toggleRecording} variant={isRecording ? "destructive" : "default"}>
          {isRecording ? "Stop Recording" : "Start Recording"}
        </Button>
        <Button onClick={captureMetrics} variant="outline">
          Capture Now
        </Button>
        <Button onClick={clearMetrics} variant="outline">
          Clear Metrics
        </Button>
        <Button onClick={exportMetrics} variant="outline">
          Export Metrics
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics
          .filter((metric, index, self) => 
            index === self.findIndex(m => m.name === metric.name)
          )
          .map(metric => (
            <Card key={metric.name}>
              <CardHeader>
                <CardTitle>{metric.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metric.value} <span className="text-sm font-normal">{metric.unit}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Last updated: {new Date(metric.timestamp).toLocaleTimeString()}
                </p>
              </CardContent>
            </Card>
          ))}
      </div>

      {metrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Metric</th>
                    <th className="text-left p-2">Value</th>
                    <th className="text-left p-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.slice(0, 20).map((metric, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{metric.name}</td>
                      <td className="p-2">{metric.value} {metric.unit}</td>
                      <td className="p-2">{new Date(metric.timestamp).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};