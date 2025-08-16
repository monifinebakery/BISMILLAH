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
  onExportData
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
