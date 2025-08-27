// src/components/performance/MemoryMonitor.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMemoryMonitor, formatBytes } from '@/hooks/useMemoryMonitor';
import { getMemoryStatistics, clearMemoryTracking } from '@/utils/memoryLeakDetector';
import { Activity, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { logger } from '@/utils/logger';

interface MemoryMonitorProps {
  className?: string;
  showDetailed?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const MemoryMonitor: React.FC<MemoryMonitorProps> = ({
  className = '',
  showDetailed = false,
  autoRefresh = true,
  refreshInterval = 5000
}) => {
  const [leakStats, setLeakStats] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    memoryInfo,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    forceGarbageCollection,
    getMemorySnapshot
  } = useMemoryMonitor({
    enabled: true,
    interval: refreshInterval,
    threshold: 80,
    onThresholdExceeded: (info) => {
      logger.warn('Memory threshold exceeded', info);
    },
    onMemoryLeak: (info) => {
      logger.error('Memory leak detected', info);
    }
  });

  // Update leak statistics
  useEffect(() => {
    const updateStats = () => {
      setLeakStats(getMemoryStatistics());
    };

    updateStats();
    
    if (autoRefresh) {
      const interval = setInterval(updateStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Don't render in production
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const handleClearTracking = () => {
    clearMemoryTracking();
    setLeakStats(getMemoryStatistics());
  };

  const handleRefresh = () => {
    setLeakStats(getMemoryStatistics());
  };

  const getMemoryStatus = () => {
    if (!memoryInfo) return 'unknown';
    if (memoryInfo.usagePercentage > 90) return 'critical';
    if (memoryInfo.usagePercentage > 80) return 'warning';
    if (memoryInfo.usagePercentage > 60) return 'moderate';
    return 'good';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      case 'moderate': return 'outline';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical':
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <Card className={`${className} border-dashed`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Memory Monitor
            {memoryInfo && (
              <Badge variant={getStatusColor(getMemoryStatus())} className="ml-2">
                {getStatusIcon(getMemoryStatus())}
                {memoryInfo.usagePercentage.toFixed(1)}%
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="h-6 w-6 p-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 px-2 text-xs"
            >
              {isExpanded ? 'Less' : 'More'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {/* Memory Usage */}
        {memoryInfo && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Memory Usage</span>
              <span>{formatBytes(memoryInfo.usedJSHeapSize)} / {formatBytes(memoryInfo.jsHeapSizeLimit)}</span>
            </div>
            <Progress 
              value={memoryInfo.usagePercentage} 
              className="h-2"
            />
          </div>
        )}

        {/* Component Tracking */}
        {leakStats && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Components:</span>
              <span className="font-medium">{leakStats.activeComponents}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Potential Leaks:</span>
              <span className={`font-medium ${
                leakStats.leakedComponents > 0 ? 'text-destructive' : 'text-muted-foreground'
              }`}>
                {leakStats.leakedComponents}
              </span>
            </div>
          </div>
        )}

        {/* Expanded Details */}
        {isExpanded && (
          <div className="space-y-3 pt-2 border-t">
            {/* Controls */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={isMonitoring ? stopMonitoring : startMonitoring}
                className="flex-1 h-7 text-xs"
              >
                {isMonitoring ? 'Stop' : 'Start'} Monitoring
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={forceGarbageCollection}
                className="flex-1 h-7 text-xs"
              >
                Force GC
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleClearTracking}
              className="w-full h-7 text-xs flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Clear Tracking
            </Button>

            {/* Detailed Memory Info */}
            {memoryInfo && showDetailed && (
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Used Heap:</span>
                  <span>{formatBytes(memoryInfo.usedJSHeapSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Heap:</span>
                  <span>{formatBytes(memoryInfo.totalJSHeapSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Heap Limit:</span>
                  <span>{formatBytes(memoryInfo.jsHeapSizeLimit)}</span>
                </div>
              </div>
            )}

            {/* Component Breakdown */}
            {leakStats?.componentBreakdown && Object.keys(leakStats.componentBreakdown).length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">Active Components:</div>
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {Object.entries(leakStats.componentBreakdown).map(([component, count]) => (
                    <div key={component} className="flex justify-between text-xs">
                      <span className="truncate">{component}</span>
                      <span className="font-medium">{String(count)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Leak Breakdown */}
            {leakStats?.leakBreakdown && Object.keys(leakStats.leakBreakdown).length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-destructive">Potential Leaks:</div>
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {Object.entries(leakStats.leakBreakdown).map(([component, count]) => (
                    <div key={component} className="flex justify-between text-xs">
                      <span className="truncate text-destructive">{component}</span>
                      <span className="font-medium text-destructive">{String(count)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MemoryMonitor;