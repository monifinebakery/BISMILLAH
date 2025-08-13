// src/components/profitAnalysis/components/ProfitMarginWidget.tsx
// ✅ PROFIT MARGIN WIDGET - Fixed and Enhanced Version

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Info, 
  Calculator,
  RefreshCw,
  Settings,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { logger } from '@/utils/logger';

// Hooks
import { useProfitMargin, useProfitDashboard } from '../hooks/useProfitMargin';
import { createDatePeriods } from '../services/profitAnalysisApi';

// ✅ UPDATED IMPORT - Menggunakan utility dari profit-analysis
import { 
  formatCurrency, 
  getMarginStatus, 
  getMarginColor 
} from '@/components/profitAnalysis/utils/formatters';

// Types
import { ProfitMarginData, ProfitInsight } from '../types';

// ✅ LOADING SKELETON
const ProfitSkeleton = () => {
  const isMobile = useIsMobile();
  
  return (
    <Card>
      <CardHeader className={cn("p-4", isMobile && "p-3")}>
        <div className="flex items-center justify-between">
          <div className={cn("bg-gray-200 rounded h-6 w-32 animate-pulse", isMobile && "h-5 w-24")} />
          <div className={cn("bg-gray-200 rounded h-8 w-8 animate-pulse", isMobile && "h-6 w-6")} />
        </div>
      </CardHeader>
      <CardContent className={cn("space-y-4 p-4", isMobile && "space-y-3 p-3")}>
        <div className="grid grid-cols-1 gap-4">
          <div className={cn("bg-gray-200 rounded h-16 animate-pulse", isMobile && "h-12")} />
          <div className={cn("bg-gray-200 rounded h-16 animate-pulse", isMobile && "h-12")} />
        </div>
        <div className={cn("bg-gray-200 rounded h-4 animate-pulse", isMobile && "h-3")} />
        <div className={cn("bg-gray-200 rounded h-4 animate-pulse", isMobile && "h-3")} />
      </CardContent>
    </Card>
  );
};

// ✅ MARGIN STATUS INDICATOR
const MarginStatus: React.FC<{
  margin: number;
  type: 'gross' | 'net';
  label: string;
}> = ({ margin, type, label }) => {
  const isMobile = useIsMobile();
  
  const getStatus = (margin: number, type: 'gross' | 'net') => {
    const thresholds = {
      gross: { excellent: 40, good: 25, acceptable: 15, poor: 5 },
      net: { excellent: 15, good: 10, acceptable: 5, poor: 2 }
    };

    const threshold = thresholds[type];

    if (margin >= threshold.excellent) return { status: 'excellent', color: 'bg-green-500', text: 'text-green-700' };
    if (margin >= threshold.good) return { status: 'good', color: 'bg-blue-500', text: 'text-blue-700' };
    if (margin >= threshold.acceptable) return { status: 'acceptable', color: 'bg-yellow-500', text: 'text-yellow-700' };
    if (margin >= threshold.poor) return { status: 'poor', color: 'bg-orange-500', text: 'text-orange-700' };
    return { status: 'critical', color: 'bg-red-500', text: 'text-red-700' };
  };

  const status = getStatus(margin, type);
  const progress = Math.min(margin, type === 'gross' ? 50 : 20); // Cap progress for visual

  return (
    <div className={cn("space-y-2", isMobile && "space-y-1")}>
      <div className="flex items-center justify-between">
        <span className={cn("text-sm font-medium", isMobile && "text-xs")}>{label}</span>
        <span className={cn("text-lg font-bold", status.text, isMobile && "text-base")}>
          {margin.toFixed(1)}%
        </span>
      </div>
      <Progress 
        value={progress} 
        max={type === 'gross' ? 50 : 20}
        className={cn("h-2", isMobile && "h-1.5")}
      />
      <Badge 
        variant={status.status === 'excellent' || status.status === 'good' ? 'default' : 'secondary'}
        className={cn("text-xs", status.text, isMobile && "text-[0.65rem]")}
      >
        {status.status === 'excellent' && 'Sangat Baik'}
        {status.status === 'good' && 'Baik'}
        {status.status === 'acceptable' && 'Cukup'}
        {status.status === 'poor' && 'Rendah'}
        {status.status === 'critical' && 'Kritis'}
      </Badge>
    </div>
  );
};

// ✅ COST BREAKDOWN MINI CHART
const CostBreakdown: React.FC<{
  revenue: number;
  cogs: number;
  opex: number;
}> = ({ revenue, cogs, opex }) => {
  const isMobile = useIsMobile();
  
  if (revenue === 0) return null;

  const cogsPercentage = (cogs / revenue) * 100;
  const opexPercentage = (opex / revenue) * 100;
  const profitPercentage = 100 - cogsPercentage - opexPercentage;

  return (
    <div className={cn("space-y-3", isMobile && "space-y-2")}>
      <h4 className={cn("text-sm font-medium", isMobile && "text-xs")}>Breakdown Biaya</h4>
      
      {/* Visual breakdown bar */}
      <div className={cn("flex h-4 bg-gray-100 rounded-full overflow-hidden", isMobile && "h-3")}>
        <div 
          className="bg-red-500" 
          style={{ width: `${cogsPercentage}%` }}
          title={`COGS: ${cogsPercentage.toFixed(1)}%`}
        />
        <div 
          className="bg-orange-500" 
          style={{ width: `${opexPercentage}%` }}
          title={`OPEX: ${opexPercentage.toFixed(1)}%`}
        />
        <div 
          className="bg-green-500" 
          style={{ width: `${profitPercentage}%` }}
          title={`Profit: ${profitPercentage.toFixed(1)}%`}
        />
      </div>

      {/* Legend */}
      <div className={cn("grid grid-cols-3 gap-2 text-xs", isMobile && "text-[0.65rem] gap-1")}>
        <div className="flex items-center gap-1">
          <div className={cn("w-2 h-2 bg-red-500 rounded", isMobile && "w-1.5 h-1.5")} />
          <span>COGS</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={cn("w-2 h-2 bg-orange-500 rounded", isMobile && "w-1.5 h-1.5")} />
          <span>OPEX</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={cn("w-2 h-2 bg-green-500 rounded", isMobile && "w-1.5 h-1.5")} />
          <span>Profit</span>
        </div>
      </div>

      {/* Values */}
      <div className={cn("space-y-1 text-xs text-gray-600", isMobile && "text-[0.65rem]")}>
        <div className="flex justify-between">
          <span>Revenue:</span>
          <span className="font-medium">{formatCurrency(revenue)}</span>
        </div>
        <div className="flex justify-between">
          <span>COGS:</span>
          <span className="text-red-600">{formatCurrency(cogs)}</span>
        </div>
        <div className="flex justify-between">
          <span>OPEX:</span>
          <span className="text-orange-600">{formatCurrency(opex)}</span>
        </div>
      </div>
    </div>
  );
};

// ✅ INSIGHTS DISPLAY
const InsightsDisplay: React.FC<{
  insights: ProfitInsight[];
  maxShow?: number;
}> = ({ insights, maxShow = 3 }) => {
  const isMobile = useIsMobile();
  
  if (!insights || insights.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className={cn("h-4 w-4 text-red-500", isMobile && "h-3 w-3")} />;
      case 'warning': return <AlertTriangle className={cn("h-4 w-4 text-yellow-500", isMobile && "h-3 w-3")} />;
      case 'success': return <TrendingUp className={cn("h-4 w-4 text-green-500", isMobile && "h-3 w-3")} />;
      default: return <Info className={cn("h-4 w-4 text-blue-500", isMobile && "h-3 w-3")} />;
    }
  };

  const priorityInsights = insights
    .sort((a, b) => {
      const priority = { critical: 4, warning: 3, info: 2, success: 1 };
      return priority[b.type] - priority[a.type];
    })
    .slice(0, maxShow);

  return (
    <div className={cn("space-y-2", isMobile && "space-y-1")}>
      <h4 className={cn("text-sm font-medium", isMobile && "text-xs")}>Insights</h4>
      <div className={cn("space-y-2", isMobile && "space-y-1")}>
        {priorityInsights.map((insight, index) => (
          <div 
            key={index}
            className={cn("flex items-start gap-2 p-2 bg-gray-50 rounded text-xs", isMobile && "gap-1 p-1.5 text-[0.65rem]")}
          >
            {getIcon(insight.type)}
            <div className="flex-1 min-w-0">
              <p className={cn("font-medium truncate", isMobile && "text-[0.65rem]")}>{insight.title}</p>
              <p className={cn("text-gray-600 text-xs", isMobile && "text-[0.6rem]")}>{insight.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ✅ MAIN PROFIT MARGIN WIDGET
export const ProfitMarginWidget: React.FC<{
  dateRange?: { from: Date; to: Date };
  className?: string;
}> = ({ dateRange, className }) => {
  const isMobile = useIsMobile();
  const [isCalculating, setIsCalculating] = useState(false);

  // Use dashboard summary for quick overview
  const { summary, isLoading: isDashboardLoading, error: dashboardError, refetch } = useProfitDashboard();

  // Use detailed analysis for current period
  const currentPeriod = dateRange ? {
    from: dateRange.from,
    to: dateRange.to,
    label: `${dateRange.from.toLocaleDateString('id-ID')} - ${dateRange.to.toLocaleDateString('id-ID')}`
  } : createDatePeriods.thisMonth();

  const { 
    profitData, 
    keyMetrics, 
    calculateProfit, 
    exportAnalysis,
    isLoading: isProfitLoading,
    error: profitError
  } = useProfitMargin(currentPeriod);

  const isLoading = isDashboardLoading || isProfitLoading;
  const error = dashboardError || profitError;

  // ✅ HANDLERS
  const handleRecalculate = async () => {
    try {
      setIsCalculating(true);
      await calculateProfit();
      toast.success('Profit margin berhasil dihitung ulang');
      logger.info('Profit margin recalculated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghitung profit margin');
      logger.error('Failed to recalculate profit margin:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleExport = async () => {
    try {
      if (!profitData) {
        throw new Error('Tidak ada data untuk diekspor');
      }
      await exportAnalysis('excel', profitData);
      toast.success('Laporan berhasil diekspor');
      logger.info('Profit analysis exported successfully');
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengekspor laporan');
      logger.error('Failed to export profit analysis:', error);
    }
  };

  // ✅ LOADING STATE
  if (isLoading) {
    return <ProfitSkeleton />;
  }

  // ✅ ERROR STATE
  if (error) {
    return (
      <Card className={className}>
        <CardContent className={cn("p-6", isMobile && "p-4")}>
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle className={cn("h-6 w-6", isMobile && "h-5 w-5")} />
            <div>
              <h3 className={cn("font-medium", isMobile && "text-sm")}>Gagal Memuat Profit Margin</h3>
              <p className={cn("text-sm text-red-500 mt-1", isMobile && "text-xs")}>
                {error instanceof Error ? error.message : String(error)}
              </p>
            </div>
          </div>
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            className={cn("mt-4", isMobile && "mt-3 text-xs w-full")}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", isMobile && "h-3 w-3")} />
            Coba Lagi
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Use detailed data if available, otherwise summary
  const displayData = keyMetrics || (summary?.currentMargin as any);

  // ✅ NO DATA STATE
  if (!displayData) {
    return (
      <Card className={className}>
        <CardHeader className={cn("p-4", isMobile && "p-3")}>
          <CardTitle className={cn("flex items-center gap-2", isMobile && "text-base")}>
            <Calculator className={cn("h-5 w-5", isMobile && "h-4 w-4")} />
            Real Profit Margin
          </CardTitle>
        </CardHeader>
        <CardContent className={cn("p-4", isMobile && "p-3")}>
          <div className={cn("text-center py-8", isMobile && "py-6")}>
            <Calculator className={cn("h-12 w-12 text-gray-400 mx-auto mb-4", isMobile && "h-8 w-8 mb-3")} />
            <h3 className={cn("font-medium text-gray-600 mb-2", isMobile && "text-sm")}>Belum Ada Data</h3>
            <p className={cn("text-sm text-gray-500 mb-4", isMobile && "text-xs mb-3")}>
              Tambahkan transaksi dan biaya operasional untuk melihat analisis profit margin.
            </p>
            <Button 
              onClick={handleRecalculate} 
              disabled={isCalculating}
              className={cn(isMobile && "text-xs w-full")}
            >
              <Calculator className={cn("mr-2 h-4 w-4", isMobile && "h-3 w-3")} />
              Hitung Profit Margin
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Validate required data fields
  const hasRequiredData = displayData.revenue !== undefined && 
                         displayData.cogs !== undefined && 
                         displayData.opex !== undefined;

  return (
    <Card className={className}>
      <CardHeader className={cn("p-4", isMobile && "p-3")}>
        <div className="flex items-center justify-between">
          <CardTitle className={cn("flex items-center gap-2", isMobile && "text-base")}>
            <Calculator className={cn("h-5 w-5", isMobile && "h-4 w-4")} />
            Real Profit Margin
            <Badge variant="outline" className={cn("text-xs", isMobile && "text-[0.65rem]")}>
              {currentPeriod.label}
            </Badge>
          </CardTitle>
          
          <div className={cn("flex items-center gap-1", isMobile && "gap-0.5")}>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRecalculate}
              disabled={isCalculating}
              className={cn(isMobile && "p-1")}
              title="Hitung Ulang"
            >
              <RefreshCw className={cn("h-4 w-4", isCalculating && "animate-spin", isMobile && "h-3 w-3")} />
            </Button>
            
            {profitData && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleExport}
                className={cn(isMobile && "p-1")}
                title="Ekspor"
              >
                <Download className={cn("h-4 w-4", isMobile && "h-3 w-3")} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("space-y-6 p-4", isMobile && "space-y-4 p-3")}>
        {/* ✅ MAIN METRICS */}
        <div className="grid grid-cols-1 gap-4">
          <MarginStatus 
            margin={displayData.grossMargin || 0}
            type="gross"
            label="Gross Margin"
          />
          <MarginStatus 
            margin={displayData.netMargin || 0}
            type="net"
            label="Net Margin"
          />
        </div>

        {/* ✅ COST BREAKDOWN */}
        {hasRequiredData && (
          <CostBreakdown 
            revenue={displayData.revenue}
            cogs={displayData.cogs}
            opex={displayData.opex}
          />
        )}

        {/* ✅ INSIGHTS */}
        {displayData.insights && (
          <InsightsDisplay insights={displayData.insights} />
        )}

        {/* ✅ ALERT INDICATORS */}
        {summary?.alerts && summary.alerts.length > 0 && (
          <div className={cn("bg-yellow-50 border border-yellow-200 rounded p-3", isMobile && "p-2")}>
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className={cn("h-4 w-4", isMobile && "h-3 w-3")} />
              <span className={cn("text-sm font-medium", isMobile && "text-xs")}>
                {summary.alerts.length} peringatan ditemukan
              </span>
            </div>
          </div>
        )}

        {/* ✅ HELP TEXT */}
        <div className={cn("text-xs text-gray-500 bg-blue-50 p-3 rounded", isMobile && "text-[0.65rem] p-2")}>
          <p className={cn("font-medium text-blue-700 mb-1", isMobile && "text-[0.65rem]")}>💡 Real Profit Margin</p>
          <p>Berbeda dari cash flow, ini menghitung profit sesungguhnya:</p>
          <p><strong>Gross Margin</strong> = (Revenue - HPP) / Revenue</p>
          <p><strong>Net Margin</strong> = (Revenue - HPP - OPEX) / Revenue</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfitMarginWidget;