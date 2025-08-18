// src/components/profitAnalysis/components/sections/DashboardHeaderSection.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  RotateCw, 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  Target 
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '../../utils/profitTransformers';

// ==============================================
// TYPES
// ==============================================

export interface PeriodOption {
  value: string;
  label: string;
}

export interface QuickStatusData {
  netProfit: number;
  cogsPercentage: number;
  revenue: number;
}

export interface StatusIndicator {
  type: 'stale' | 'updated' | 'benchmark';
  label: string;
  timestamp?: Date;
  position?: string;
}

export interface DashboardHeaderSectionProps {
  title?: string;
  subtitle?: string;
  currentPeriod: string;
  periodOptions: PeriodOption[];
  isLoading?: boolean;
  hasValidData?: boolean;
  quickStatus?: QuickStatusData;
  statusIndicators?: StatusIndicator[];
  onPeriodChange: (period: string) => void;
  onRefresh: () => void;
  onExportData: () => void;
  // 🆕 Daily/Monthly mode + date range presets
  mode?: 'daily' | 'monthly';
  onModeChange?: (mode: 'daily' | 'monthly') => void;
  dateRange?: { from: Date; to: Date };
  onDateRangeChange?: (range: { from: Date; to: Date }) => void;
}

// ==============================================
// COMPONENT
// ==============================================

const DashboardHeaderSection: React.FC<DashboardHeaderSectionProps> = ({
  title = '💰 Untung Rugi Warung',
  subtitle = 'Lihat untung-rugi bulan ini, modal bahan baku, dan perkiraan bulan depan - semua dalam bahasa yang mudah dimengerti',
  currentPeriod,
  periodOptions,
  isLoading = false,
  hasValidData = false,
  quickStatus,
  statusIndicators = [],
  onPeriodChange,
  onRefresh,
  onExportData,
  mode = 'monthly',
  onModeChange,
  dateRange,
  onDateRangeChange
}) => {
  return (
    <div>
      {/* Main Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-gray-600 text-sm sm:text-base mt-1">{subtitle}</p>
          
          {/* Quick Status Summary */}
          {hasValidData && quickStatus && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-3 space-y-2 sm:space-y-0">
              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                quickStatus.netProfit >= 0 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {quickStatus.netProfit >= 0 ? '📈 Untung' : '📉 Rugi'} {formatCurrency(Math.abs(quickStatus.netProfit))}
              </span>
              <span className="hidden sm:inline text-gray-400">•</span>
              <span className="text-gray-600 text-xs sm:text-sm">
                Modal bahan: <span className="font-medium text-orange-600">{formatPercentage(quickStatus.cogsPercentage)}</span> dari omset
              </span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-4 lg:mt-0">
          {/* Mode Toggle */}
          <div className="flex items-center border rounded-lg overflow-hidden">
            <button
              className={`px-3 py-1 text-sm ${mode==='daily' ? 'bg-orange-100 text-orange-700' : 'bg-transparent text-gray-700'}`}
              onClick={() => onModeChange?.('daily')}
            >Harian</button>
            <button
              className={`px-3 py-1 text-sm ${mode==='monthly' ? 'bg-orange-100 text-orange-700' : 'bg-transparent text-gray-700'}`}
              onClick={() => onModeChange?.('monthly')}
            >Bulanan</button>
          </div>

          {/* Period or Date Range */}
          {mode === 'monthly' ? (
            <Select value={currentPeriod} onValueChange={onPeriodChange}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Pilih periode" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex items-center gap-2">
              {/* Simple preset buttons */}
              <Select onValueChange={(val) => {
                const now = new Date();
                const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const lastOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                const firstOfPrevMonth = new Date(lastOfPrevMonth.getFullYear(), lastOfPrevMonth.getMonth(), 1);
                const last30 = new Date(); last30.setDate(now.getDate() - 29);
                if (val==='this_month') onDateRangeChange?.({ from: firstOfThisMonth, to: now });
                if (val==='last_month') onDateRangeChange?.({ from: firstOfPrevMonth, to: lastOfPrevMonth });
                if (val==='last_30') onDateRangeChange?.({ from: last30, to: now });
              }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Preset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_month">Bulan ini</SelectItem>
                  <SelectItem value="last_month">Bulan kemarin</SelectItem>
                  <SelectItem value="last_30">30 hari terakhir</SelectItem>
                </SelectContent>
              </Select>
              {/* Simple display of current range (custom picker can be added later) */}
              <div className="text-xs text-gray-600">
                {dateRange ? (
                  <span>{dateRange.from.toLocaleDateString('id-ID')} — {dateRange.to.toLocaleDateString('id-ID')}</span>
                ) : (
                  <span>Pilih rentang</span>
                )}
              </div>
            </div>
          )}
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center space-x-1 flex-1 sm:flex-initial"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExportData}
              disabled={!hasValidData}
              className="flex items-center space-x-1 flex-1 sm:flex-initial"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      {statusIndicators.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {statusIndicators.map((indicator, index) => (
            <Badge
              key={index}
              variant={indicator.type === 'benchmark' && indicator.position === 'sangat baik' ? 'default' : 'secondary'}
              className="flex items-center space-x-1"
            >
              {indicator.type === 'stale' && <AlertTriangle className="w-3 h-3" />}
              {indicator.type === 'updated' && <CheckCircle className="w-3 h-3" />}
              {indicator.type === 'benchmark' && <Target className="w-3 h-3" />}
              <span className="text-xs">
                {indicator.type === 'updated' && indicator.timestamp ? (
                  <>
                    <span className="hidden sm:inline">Diperbarui: {indicator.timestamp.toLocaleTimeString('id-ID')}</span>
                    <span className="sm:hidden">Update: {indicator.timestamp.toLocaleTimeString('id-ID', { timeStyle: 'short' })}</span>
                  </>
                ) : (
                  indicator.label
                )}
              </span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardHeaderSection;
