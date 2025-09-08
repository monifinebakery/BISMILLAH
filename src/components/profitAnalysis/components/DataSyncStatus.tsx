// src/components/profitAnalysis/components/DataSyncStatus.tsx
// Data synchronization status and freshness indicators

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Wifi,
  WifiOff,
  Database,
  TrendingUp,
  DollarSign
} from 'lucide-react';

interface DataSource {
  name: string;
  label: string;
  lastUpdated: Date | string | null;
  isStale: boolean;
  isLoading: boolean;
  status: 'connected' | 'stale' | 'error' | 'loading';
}

interface DataSyncStatusProps {
  dataSources: DataSource[];
  onRefreshAll?: () => void;
  onRefreshSource?: (sourceName: string) => void;
  isRefreshing?: boolean;
  className?: string;
}

const DataSyncStatus: React.FC<DataSyncStatusProps> = ({
  dataSources,
  onRefreshAll,
  onRefreshSource,
  isRefreshing = false,
  className = ''
}) => {
  const formatRelativeTime = (date: Date | string | null): string => {
    if (!date) return 'Belum pernah';
    
    const updateDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - updateDate.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSeconds < 30) return 'Baru saja';
    if (diffMinutes < 1) return `${diffSeconds} detik lalu`;
    if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari lalu`;
    
    return updateDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSourceIcon = (sourceName: string) => {
    switch (sourceName) {
      case 'analysis':
        return <TrendingUp className="w-3 h-3" />;
      case 'wac':
        return <Database className="w-3 h-3" />;
      case 'financial':
        return <DollarSign className="w-3 h-3" />;
      default:
        return <Database className="w-3 h-3" />;
    }
  };

  const getStatusIcon = (status: DataSource['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'stale':
        return <Clock className="w-3 h-3 text-orange-500" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      case 'loading':
        return <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-3 h-3 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: DataSource['status'], isLoading: boolean) => {
    if (isLoading) {
      return (
        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
          Memuat...
        </Badge>
      );
    }

    switch (status) {
      case 'connected':
        return (
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
            Terkini
          </Badge>
        );
      case 'stale':
        return (
          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-300">
            Perlu Update
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-300">
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            Tidak Diketahui
          </Badge>
        );
    }
  };

  const getOverallStatus = () => {
    const hasError = dataSources.some(source => source.status === 'error');
    const hasStale = dataSources.some(source => source.isStale);
    const allConnected = dataSources.every(source => source.status === 'connected');
    const isLoading = dataSources.some(source => source.isLoading);

    if (hasError) return { status: 'error', label: 'Ada Masalah', color: 'text-red-600' };
    if (isLoading || isRefreshing) return { status: 'loading', label: 'Memuat...', color: 'text-blue-600' };
    if (hasStale) return { status: 'stale', label: 'Perlu Refresh', color: 'text-orange-600' };
    if (allConnected) return { status: 'connected', label: 'Semua Terkini', color: 'text-green-600' };
    
    return { status: 'unknown', label: 'Status Tidak Jelas', color: 'text-gray-600' };
  };

  const overallStatus = getOverallStatus();
  const hasStaleData = dataSources.some(source => source.isStale);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Overall Status Header */}
      <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {overallStatus.status === 'loading' || isRefreshing ? (
              <Wifi className="w-4 h-4 text-blue-500 animate-pulse" />
            ) : overallStatus.status === 'error' ? (
              <WifiOff className="w-4 h-4 text-red-500" />
            ) : (
              <Wifi className="w-4 h-4 text-green-500" />
            )}
            <span className={`text-sm font-medium ${overallStatus.color}`}>
              Status Data: {overallStatus.label}
            </span>
          </div>
          
          {hasStaleData && !isRefreshing && (
            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-300">
              Refresh Diperlukan
            </Badge>
          )}
        </div>

        {onRefreshAll && (
          <Button
            onClick={onRefreshAll}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="flex items-center gap-2 h-8"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="text-xs">{isRefreshing ? 'Memuat...' : 'Refresh Semua'}</span>
          </Button>
        )}
      </div>

      {/* Detailed Source Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {dataSources.map((source) => (
          <div
            key={source.name}
            className="bg-white border border-gray-200 rounded-lg p-3 transition-colors hover:border-gray-300"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {getSourceIcon(source.name)}
                <span className="text-sm font-medium text-gray-700">
                  {source.label}
                </span>
              </div>
              {getStatusIcon(source.status)}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Status:</span>
                {getStatusBadge(source.status, source.isLoading)}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Terakhir:</span>
                <span className="text-xs text-gray-700">
                  {formatRelativeTime(source.lastUpdated)}
                </span>
              </div>

              {onRefreshSource && (
                <Button
                  onClick={() => onRefreshSource(source.name)}
                  variant="ghost"
                  size="sm"
                  disabled={source.isLoading || isRefreshing}
                  className="w-full h-6 text-xs mt-2"
                >
                  {source.isLoading ? (
                    <>
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      Memuat...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Refresh
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Tips */}
      <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
        <p className="mb-1">
          💡 <strong>Tips:</strong> Data diperbarui otomatis setiap 5 menit. 
          Gunakan tombol refresh untuk memperbarui data secara manual.
        </p>
        <p>
          🔄 Data WAC diperbarui setiap 2 menit selama jam kerja (09:00-18:00) untuk akurasi maksimal.
        </p>
      </div>
    </div>
  );
};

export default DataSyncStatus;
