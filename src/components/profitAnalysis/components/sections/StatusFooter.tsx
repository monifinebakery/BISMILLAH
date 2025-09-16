// src/components/profitAnalysis/components/sections/StatusFooter.tsx

import React from 'react';
import { CheckCircle } from 'lucide-react';
import { formatCurrency, formatPercentage as formatPercentageUtil } from '../../utils/profitTransformers';

// ==============================================
// TYPES
// ==============================================

export interface StatusFooterData {
  revenue: number;
  netProfit: number;
  netMargin: number;
  dateRange?: { from: Date; to: Date };
}

export interface StatusFooterProps {
  data: StatusFooterData;
  isLoading?: boolean;
  hasValidData?: boolean;
  hppLabel?: string;
  hppHint?: string;
}

// ==============================================
// COMPONENT
// ==============================================

const StatusFooter: React.FC<StatusFooterProps> = ({
  data,
  isLoading = false,
  hasValidData = false,
  hppLabel,
  hppHint
}) => {
  // Don't render if no valid data or loading
  if (!hasValidData || isLoading) return null;
  const periodLabel = data.dateRange
    ? `${data.dateRange.from.toLocaleDateString('id-ID')} — ${data.dateRange.to.toLocaleDateString('id-ID')}`
    : '';

  return (
    <div className="p-3 sm:p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-700">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
          <span className="truncate">
            Analisis {periodLabel}
          </span>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <span className="flex items-center">
            Omset: <span className="font-medium ml-1 text-orange-700">{formatCurrency(data.revenue)}</span>
          </span>
          <span className="hidden sm:inline text-gray-400">•</span>
          <span className="flex items-center">
            Untung: <span className={`font-medium ml-1 ${
              data.netProfit >= 0 ? 'text-green-700' : 'text-red-600'
            }`}>{formatCurrency(data.netProfit)}</span>
          </span>
          <span className="hidden sm:inline text-gray-400">•</span>
          <span className="flex items-center">
            Margin: <span className="font-medium ml-1 text-blue-700">{formatPercentageUtil(data.netMargin)}</span>
          </span>
          
          {/* WAC active badge */}
          {hppLabel && (
            <>
              <span className="hidden sm:inline text-gray-400">•</span>
              <span 
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full" 
                title={hppHint}
              >
                {hppLabel}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusFooter;
