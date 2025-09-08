// src/components/profitAnalysis/components/ModeIndicator.tsx
// Clear indicators for profit analysis calculation modes

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  Info, 
  Settings,
  Clock,
  Database
} from 'lucide-react';

interface ModeIndicatorProps {
  mode: 'daily' | 'monthly' | 'yearly';
  dateRange?: { from: Date; to: Date } | undefined;
  isAggregated?: boolean;
  dataSource?: 'financial_transactions' | 'aggregated' | 'daily_breakdown';
  periodLabel?: string;
  onModeChange?: (mode: 'daily' | 'monthly' | 'yearly') => void;
  className?: string;
}

const ModeIndicator: React.FC<ModeIndicatorProps> = ({
  mode,
  dateRange,
  isAggregated = false,
  dataSource = 'financial_transactions',
  periodLabel,
  onModeChange,
  className = ''
}) => {
  const formatPeriodRange = (from: Date, to: Date): string => {
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'short',
      year: from.getFullYear() !== to.getFullYear() ? 'numeric' : undefined
    };
    
    const fromStr = from.toLocaleDateString('id-ID', options);
    const toStr = to.toLocaleDateString('id-ID', options);
    
    return `${fromStr} - ${toStr}`;
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'daily':
        return <Calendar className="h-4 w-4" />;
      case 'monthly':
        return <BarChart3 className="h-4 w-4" />;
      case 'yearly':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getModeLabel = () => {
    switch (mode) {
      case 'daily':
        return 'Mode Harian';
      case 'monthly':
        return 'Mode Bulanan';
      case 'yearly':
        return 'Mode Tahunan';
      default:
        return 'Mode Bulanan';
    }
  };

  const getDataSourceLabel = () => {
    switch (dataSource) {
      case 'financial_transactions':
        return 'Data Transaksi Langsung';
      case 'aggregated':
        return 'Data Agregat';
      case 'daily_breakdown':
        return 'Rincian Harian';
      default:
        return 'Data Transaksi';
    }
  };

  const getModeDescription = () => {
    if (mode === 'daily' && dateRange) {
      const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      
      if (isAggregated) {
        return `Menampilkan total gabungan untuk ${daysDiff + 1} hari (${formatPeriodRange(dateRange.from, dateRange.to)})`;
      } else {
        return `Menampilkan rincian per hari untuk ${daysDiff + 1} hari (${formatPeriodRange(dateRange.from, dateRange.to)})`;
      }
    }
    
    if (mode === 'monthly') {
      return `Menampilkan data bulanan${periodLabel ? ` untuk ${periodLabel}` : ''}`;
    }
    
    if (mode === 'yearly') {
      return `Menampilkan data tahunan${periodLabel ? ` untuk ${periodLabel}` : ''}`;
    }
    
    return 'Menampilkan data profit';
  };

  const getAlertColor = () => {
    if (mode === 'daily' && isAggregated) {
      return 'border-amber-200 bg-amber-50';
    }
    return 'border-blue-200 bg-blue-50';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Mode Indicator */}
      <Alert className={`${getAlertColor()} transition-colors duration-200`}>
        <div className="flex items-center gap-2">
          {getModeIcon()}
          {mode === 'daily' && isAggregated && (
            <Database className="h-4 w-4 text-amber-600" />
          )}
        </div>
        <AlertDescription>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-800">
                  📊 {getModeLabel()} Aktif
                </span>
                <Badge variant="outline" className="text-xs">
                  {getDataSourceLabel()}
                </Badge>
                {mode === 'daily' && isAggregated && (
                  <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300">
                    Agregasi Otomatis
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {getModeDescription()}
              </p>
              {mode === 'daily' && isAggregated && (
                <p className="text-xs text-amber-700 mt-1">
                  ⚡ Menggunakan agregasi otomatis untuk performa optimal dengan rentang tanggal besar
                </p>
              )}
            </div>
            
            {onModeChange && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant={mode === 'monthly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onModeChange('monthly')}
                  className="text-xs h-7"
                >
                  Bulanan
                </Button>
                <Button
                  variant={mode === 'daily' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onModeChange('daily')}
                  className="text-xs h-7"
                >
                  Harian
                </Button>
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {/* Data Source Details */}
      {mode === 'daily' && dateRange && (
        <div className="text-xs text-gray-500 flex items-center gap-4 px-3">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Periode: {formatPeriodRange(dateRange.from, dateRange.to)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Settings className="w-3 h-3" />
            <span>Sumber: {getDataSourceLabel()}</span>
          </div>
        </div>
      )}

      {/* Help Text for Mode Switching */}
      {mode === 'daily' && (
        <div className="text-xs text-blue-600 flex items-start gap-2 px-3">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>
            💡 <strong>Tips:</strong> Untuk melihat tren jangka panjang, gunakan mode bulanan. 
            Mode harian cocok untuk analisis detail dalam periode singkat.
          </span>
        </div>
      )}
    </div>
  );
};

export default ModeIndicator;
