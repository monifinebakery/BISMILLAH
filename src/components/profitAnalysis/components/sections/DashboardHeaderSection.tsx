// src/components/profitAnalysis/components/sections/DashboardHeaderSection.tsx

import React, { lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCw, CheckCircle, AlertTriangle, Target, BarChart3, Info } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../../utils/profitTransformers';
import { useIsMobile } from '@/hooks/use-mobile';

// Lazy load DateRangePicker
const DateRangePicker = lazy(() => import('@/components/ui/DateRangePicker'));

// ==============================================
// TYPES
// ==============================================

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
  isLoading?: boolean;
  hasValidData?: boolean;
  quickStatus?: QuickStatusData;
  statusIndicators?: StatusIndicator[];
  onRefresh: () => void;

  dateRange?: { from: Date; to: Date };
  onDateRangeChange?: (range: { from: Date; to: Date } | undefined) => void;
  onStartOnboarding: () => void;
}

// ==============================================
// COMPONENT
// ==============================================

const DashboardHeaderSection: React.FC<DashboardHeaderSectionProps> = ({
  title = 'Untung Rugi Warung',
  subtitle = 'Lihat untung-rugi bulan ini, modal bahan baku, dan perkiraan bulan depan - semua dalam bahasa yang mudah dimengerti',
  isLoading = false,
  hasValidData = false,
  quickStatus,
  statusIndicators = [],
  onRefresh,
  dateRange,
  onDateRangeChange,
  onStartOnboarding,
}) => {
  const isMobile = useIsMobile();
  
  // Convert dateRange format for DateRangePicker component
  const dateRangeForPicker = dateRange && dateRange.from && dateRange.to ? {
    from: dateRange.from,
    to: dateRange.to
  } : undefined;

  // Extract Controls as a separate component to avoid binding issues
  const renderControls = () => (
    <>
      <div className="flex items-center gap-2">
        <Suspense fallback={
          <div className="w-full md:w-64 h-11 bg-white bg-opacity-20 rounded-lg animate-pulse" />
        }>
          <DateRangePicker
            dateRange={dateRangeForPicker}
            onDateRangeChange={onDateRangeChange}
            placeholder="Pilih periode laporan"
            isMobile={isMobile}
            className="bg-white text-gray-900 border-none hover:bg-gray-200 min-w-[200px] md:min-w-[260px]"
          />
        </Suspense>
      </div>

        <Button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 font-medium px-4 py-2 rounded-lg transition-all backdrop-blur-sm w-full md:w-auto justify-center"
        >
          <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
    </>
  );

  return (
    <div>
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 mb-6 text-white border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">{title}</h1>
              <p className="text-white opacity-90">{subtitle}</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            {renderControls()}
          </div>
        </div>

        <div className="flex md:hidden flex-col gap-3 mt-6">
          {renderControls()}
        </div>
      </div>

      {/* Quick Status Summary */}
      {hasValidData && quickStatus && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mb-4 space-y-2 sm:space-y-0">
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
              quickStatus.netProfit >= 0
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {quickStatus.netProfit >= 0 ? 'Untung' : 'Rugi'}
            {" "}
            {formatCurrency(Math.abs(quickStatus.netProfit))}
          </span>
          <span className="hidden sm:inline text-gray-400">•</span>
          <span className="text-gray-600 text-xs sm:text-sm">
            Modal bahan:
            <span className="font-medium text-orange-600">
              {formatPercentage(quickStatus.cogsPercentage)}
            </span>{' '}
            dari omset
          </span>
        </div>
      )}

      {/* Status Indicators */}
      {statusIndicators.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {statusIndicators.map((indicator, index) => (
            <Badge
              key={index}
              variant={
                indicator.type === 'benchmark' && indicator.position === 'sangat baik'
                  ? 'default'
                  : 'secondary'
              }
              className="flex items-center space-x-1"
            >
              {indicator.type === 'stale' && (
                <AlertTriangle className="w-3 h-3" />
              )}
              {indicator.type === 'updated' && (
                <CheckCircle className="w-3 h-3" />
              )}
              {indicator.type === 'benchmark' && <Target className="w-3 h-3" />}
              <span className="text-xs">
                {indicator.type === 'updated' && indicator.timestamp ? (
                  <>
                    <span className="hidden sm:inline">
                      Diperbarui: {indicator.timestamp.toLocaleTimeString('id-ID')}
                    </span>
                    <span className="sm:hidden">
                      Update:{' '}
                      {indicator.timestamp.toLocaleTimeString('id-ID', {
                        timeStyle: 'short'
                      })}
                    </span>
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
