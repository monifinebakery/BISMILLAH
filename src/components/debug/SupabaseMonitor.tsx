// src/components/debug/SupabaseMonitor.tsx
// Debug component for monitoring Supabase connection and errors

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, RefreshCw, Database, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SupabaseMonitor } from '@/utils/supabaseErrorHandler';

interface ConnectionStatus {
  isHealthy: boolean;
  latency: number | null;
  lastChecked: Date;
  error?: string;
}

interface PerformanceMetrics {
  avgLatency: number;
  successRate: number;
  totalRequests: number;
  errorCounts: Record<string, number>;
}

export const SupabaseConnectionMonitor: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>({
    isHealthy: false,
    latency: null,
    lastChecked: new Date()
  });
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    avgLatency: 0,
    successRate: 100,
    totalRequests: 0,
    errorCounts: {}
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    const startTime = Date.now();
    
    try {
      // Simple health check query
      const { data, error } = await supabase
        .from('purchases')
        .select('count')
        .limit(1)
        .maybeSingle();
      
      const latency = Date.now() - startTime;
      
      if (error) {
        setStatus({
          isHealthy: false,
          latency,
          lastChecked: new Date(),
          error: error.message
        });
      } else {
        setStatus({
          isHealthy: true,
          latency,
          lastChecked: new Date(),
          error: undefined
        });
      }
    } catch (error: any) {
      const latency = Date.now() - startTime;
      setStatus({
        isHealthy: false,
        latency,
        lastChecked: new Date(),
        error: error.message
      });
    } finally {
      setIsChecking(false);
    }
  };

  const updateMetrics = () => {
    const stats = SupabaseMonitor.getStats();
    const errorCounts = stats.errorCounts;
    const totalErrors = Object.values(errorCounts).reduce((sum, count) => sum + count, 0);
    
    // Simulate some metrics (in real app, these would be tracked)
    const totalRequests = Math.max(100, totalErrors * 10); // Estimate
    const successRate = ((totalRequests - totalErrors) / totalRequests) * 100;
    
    setMetrics({
      avgLatency: status.latency || 0,
      successRate,
      totalRequests,
      errorCounts
    });
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(() => {
      checkConnection();
      updateMetrics();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    updateMetrics();
  }, [status]);

  const getStatusColor = () => {
    if (!status.isHealthy) return 'destructive';
    if (status.latency && status.latency > 2000) return 'warning';
    return 'default';
  };

  const getLatencyColor = () => {
    if (!status.latency) return 'default';
    if (status.latency < 500) return 'default';
    if (status.latency < 1000) return 'secondary';
    if (status.latency < 2000) return 'warning';
    return 'destructive';
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Supabase Connection Monitor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {status.isHealthy ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">
                {status.isHealthy ? 'Connected' : 'Disconnected'}
              </span>
              <Badge variant={getStatusColor()}>
                {status.isHealthy ? 'Healthy' : 'Unhealthy'}
              </Badge>
            </div>
            <Button
              onClick={checkConnection}
              disabled={isChecking}
              variant="outline"
              size="sm"
            >
              {isChecking ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Check
            </Button>
          </div>

          {/* Latency */}
          {status.latency !== null && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>Latency</span>
              </div>
              <Badge variant={getLatencyColor()}>
                {status.latency}ms
              </Badge>
            </div>
          )}

          {/* Error Message */}
          {status.error && (
            <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
              <div className="text-sm text-red-700">
                <div className="font-medium">Error:</div>
                <div className="text-xs break-all">{status.error}</div>
              </div>
            </div>
          )}

          {/* Last Checked */}
          <div className="text-xs text-gray-500">
            Last checked: {status.lastChecked.toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Success Rate</div>
              <div className="text-lg font-semibold">
                {metrics.successRate.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Avg Latency</div>
              <div className="text-lg font-semibold">
                {metrics.avgLatency}ms
              </div>
            </div>
          </div>

          {/* Error Breakdown */}
          {Object.keys(metrics.errorCounts).length > 0 && (
            <div>
              <div className="text-sm text-gray-500 mb-2">Recent Errors</div>
              <div className="space-y-1">
                {Object.entries(metrics.errorCounts).map(([errorType, count]) => (
                  <div key={errorType} className="flex justify-between text-xs">
                    <span className="text-gray-600">
                      {errorType === '503' ? 'Service Unavailable' : errorType}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseConnectionMonitor;