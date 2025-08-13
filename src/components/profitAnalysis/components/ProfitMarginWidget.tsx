// src/components/profitAnalysis/components/ProfitMarginWidget.tsx
// ✅ PROFIT MARGIN WIDGET - Dashboard Integration

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
const ProfitSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="bg-gray-200 rounded h-6 w-32 animate-pulse" />
        <div className="bg-gray-200 rounded h-8 w-8 animate-pulse" />
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-200 rounded h-16 animate-pulse" />
        <div className="bg-gray-200 rounded h-16 animate-pulse" />
      </div>
      <div className="bg-gray-200 rounded h-4 animate-pulse" />
      <div className="bg-gray-200 rounded h-4 animate-pulse" />
    </CardContent>
  </Card>
);

// ✅ MARGIN STATUS INDICATOR
const MarginStatus: React.FC<{
  margin: number;
  type: 'gross' | 'net';
  label: string;
}> = ({ margin, type, label }) => {
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className={cn("text-lg font-bold", status.text)}>
          {margin.toFixed(1)}%
        </span>
      </div>
      <Progress 
        value={progress} 
        max={type === 'gross' ? 50 : 20}
        className="h-2"
      />
      <Badge 
        variant={status.status === 'excellent' || status.status === 'good' ? 'default' : 'secondary'}
        className={cn("text-xs", status.text)}
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
  if (revenue === 0) return null;

  const cogsPercentage = (cogs / revenue) * 100;
  const opexPercentage = (opex / revenue) * 100;
  const profitPercentage = 100 - cogsPercentage - opexPercentage;

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Breakdown Biaya</h4>
      
      {/* Visual breakdown bar */}
      <div className="flex h-4 bg-gray-100 rounded-full overflow-hidden">
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
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded" />
          <span>COGS</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-orange-500 rounded" />
          <span>OPEX</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded" />
          <span>Profit</span>
        </div>
      </div>

      {/* Values */}
      <div className="space-y-1 text-xs text-gray-600">
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
  if (!insights || insights.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success': return <TrendingUp className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const priorityInsights = insights
    .sort((a, b) => {
      const priority = { critical: 4, warning: 3, info: 2, success: 1 };
      return priority[b.type] - priority[a.type];
    })
    .slice(0, maxShow);

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Insights</h4>
      <div className="space-y-2">
        {priorityInsights.map((insight, index) => (
          <div 
            key={index}
            className="flex items-start gap-2 p-2 bg-gray-50 rounded text-xs"
          >
            {getIcon(insight.type)}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{insight.title}</p>
              <p className="text-gray-600 text-xs">{insight.message}</p>
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
  const [isCalculating, setIsCalculating] = useState(false);

  // Use dashboard summary for quick overview
  const { summary, isLoading, error, refetch } = useProfitDashboard();

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
    exportAnalysis 
  } = useProfitMargin(currentPeriod);

  // ✅ HANDLERS
  const handleRecalculate = async () => {
    try {
      setIsCalculating(true);
      await calculateProfit();
      toast.success('Profit margin berhasil dihitung ulang');
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghitung profit margin');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleExport = async () => {
    try {
      await exportAnalysis('excel');
      toast.success('Laporan berhasil diekspor');
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengekspor laporan');
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
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle className="h-6 w-6" />
            <div>
              <h3 className="font-medium">Gagal Memuat Profit Margin</h3>
              <p className="text-sm text-red-500 mt-1">{error}</p>
            </div>
          </div>
          <Button onClick={() => refetch()} variant="outline" className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Coba Lagi
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Use detailed data if available, otherwise summary
  const displayData = keyMetrics || summary?.currentMargin;

  // ✅ NO DATA STATE
  if (!displayData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Real Profit Margin
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-600 mb-2">Belum Ada Data</h3>
            <p className="text-sm text-gray-500 mb-4">
              Tambahkan transaksi dan biaya operasional untuk melihat analisis profit margin.
            </p>
            <Button onClick={handleRecalculate} disabled={isCalculating}>
              <Calculator className="mr-2 h-4 w-4" />
              Hitung Profit Margin
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Real Profit Margin
            <Badge variant="outline" className="text-xs">
              {currentPeriod.label}
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRecalculate}
              disabled={isCalculating}
            >
              <RefreshCw className={cn("h-4 w-4", isCalculating && "animate-spin")} />
            </Button>
            
            {profitData && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleExport}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ✅ MAIN METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        {displayData.revenue && displayData.cogs !== undefined && displayData.opex !== undefined && (
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
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <div className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {summary.alerts.length} peringatan ditemukan
              </span>
            </div>
          </div>
        )}

        {/* ✅ HELP TEXT */}
        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
          <p className="font-medium text-blue-700 mb-1">💡 Real Profit Margin</p>
          <p>Berbeda dari cash flow, ini menghitung profit sesungguhnya:</p>
          <p><strong>Gross Margin</strong> = (Revenue - HPP) / Revenue</p>
          <p><strong>Net Margin</strong> = (Revenue - HPP - OPEX) / Revenue</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfitMarginWidget;