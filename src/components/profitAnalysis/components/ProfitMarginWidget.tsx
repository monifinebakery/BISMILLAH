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
        className={cn("h-2", status.color, isMobile && "h-1.5")}
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
  cogs: number;
  opex: number;
  revenue: number;
}> = ({ cogs, opex, revenue }) => {
  const isMobile = useIsMobile();

  // Validasi input untuk mencegah NaN atau undefined
  const validCogs = Number.isFinite(cogs) ? cogs : 0;
  const validOpex = Number.isFinite(opex) ? opex : 0;
  const validRevenue = Number.isFinite(revenue) && revenue > 0 ? revenue : 1; // Avoid division by zero

  const cogsPercentage = (validCogs / validRevenue) * 100;
  const opexPercentage = (validOpex / validRevenue) * 100;

  return (
    <div className={cn("space-y-2", isMobile && "space-y-1")}>
      <div className="flex items-center justify-between">
        <span className={cn("text-sm font-medium", isMobile && "text-xs")}>Struktur Biaya</span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className={cn("text-xs", isMobile && "text-[0.65rem]")}>COGS</span>
          <span className={cn("text-xs font-medium", isMobile && "text-[0.65rem]")}>
            {formatCurrency(validCogs)} ({cogsPercentage.toFixed(1)}%)
          </span>
        </div>
        <Progress 
          value={cogsPercentage} 
          max={100}
          className={cn("h-1.5 bg-blue-200", isMobile && "h-1", cogsPercentage > 60 ? "bg-red-200" : "bg-blue-200")} 
        />
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className={cn("text-xs", isMobile && "text-[0.65rem]")}>OPEX</span>
          <span className={cn("text-xs font-medium", isMobile && "text-[0.65rem]")}>
            {formatCurrency(validOpex)} ({opexPercentage.toFixed(1)}%)
          </span>
        </div>
        <Progress 
          value={opexPercentage} 
          max={100}
          className={cn("h-1.5 bg-purple-200", isMobile && "h-1", opexPercentage > 30 ? "bg-red-200" : "bg-purple-200")} 
        />
      </div>
    </div>
  );
};

// ✅ INSIGHT ITEM
const InsightItem: React.FC<{ insight: ProfitInsight }> = ({ insight }) => {
  const isMobile = useIsMobile();

  const getIcon = () => {
    switch (insight.type) {
      case 'warning':
        return <AlertTriangle className={cn("h-4 w-4 text-yellow-500", isMobile && "h-3 w-3")} />;
      case 'error':
        return <AlertTriangle className={cn("h-4 w-4 text-red-500", isMobile && "h-3 w-3")} />;
      case 'info':
        return <Info className={cn("h-4 w-4 text-blue-500", isMobile && "h-3 w-3")} />;
      default:
        return null;
    }
  };

  return (
    <div className={cn("flex items-start space-x-2 p-2 rounded bg-gray-50", isMobile && "space-x-1 p-1.5")}>
      {getIcon()}
      <div>
        <p className={cn("text-xs font-medium", isMobile && "text-[0.65rem]")}>{insight.title}</p>
        <p className={cn("text-xs text-gray-600", isMobile && "text-[0.6rem]")}>{insight.message}</p>
      </div>
    </div>
  );
};

// ✅ MAIN WIDGET
interface ProfitMarginWidgetProps {
  period?: DatePeriod;
}

export const ProfitMarginWidget: React.FC<ProfitMarginWidgetProps> = ({ period = createDatePeriods.thisMonth() }) => {
  const isMobile = useIsMobile();
  const [exporting, setExporting] = useState(false);
  
  // Gunakan hook dashboard untuk data ringkas
  const { summary, isLoading, error, refetch } = useProfitDashboard();

  // Gunakan hook profit margin untuk perhitungan dan ekspor
  const { profitData, calculateProfit, exportAnalysis } = useProfitMargin(period);

  // Validasi data untuk mencegah error destrukturisasi
  const displayData: ProfitMarginData = summary?.currentMargin || {
    revenue: 0,
    cogs: 0,
    opex: 0,
    grossProfit: 0,
    netProfit: 0,
    grossMargin: 0,
    netMargin: 0,
    calculatedAt: new Date(),
    period: period
  };

  // Validasi insights
  const insights: ProfitInsight[] = summary?.alerts || [];

  // Logging untuk debugging
  if (!summary) {
    logger.warn('ProfitMarginWidget: Tidak ada data summary', {
      hasSummary: !!summary,
      hasCurrentMargin: !!summary?.currentMargin,
      revenueType: summary?.currentMargin ? typeof summary.currentMargin.revenue : 'undefined'
    });
  }

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await refetch();
      await calculateProfit();
      toast.success('Data profit margin diperbarui');
    } catch (err) {
      logger.error('Gagal memperbarui data:', err);
      toast.error('Gagal memperbarui data profit margin');
    }
  };

  // Handle export
  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    if (!profitData) {
      logger.warn('handleExport: Tidak ada data untuk diekspor', { period: period.label });
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    setExporting(true);
    try {
      const response = await exportAnalysis(format, profitData);
      if (response.success) {
        toast.success(`Berhasil mengekspor laporan sebagai ${format.toUpperCase()}`);
      } else {
        throw new Error(response.error || 'Gagal mengekspor laporan');
      }
    } catch (err) {
      logger.error('Gagal mengekspor laporan:', err);
      toast.error('Gagal mengekspor laporan');
    } finally {
      setExporting(false);
    }
  };

  if (isLoading) {
    return <ProfitSkeleton />;
  }

  if (error) {
    logger.error('ProfitMarginWidget: Error memuat data', { error });
    return (
      <Card>
        <CardHeader className={cn("p-4", isMobile && "p-3")}>
          <CardTitle className={cn("text-lg", isMobile && "text-base")}>
            Profit Margin
          </CardTitle>
        </CardHeader>
        <CardContent className={cn("p-4", isMobile && "p-3")}>
          <div className="text-center text-red-500">
            <p className={cn("text-sm", isMobile && "text-xs")}>
              Gagal memuat data: {error.message}
            </p>
            <Button
              variant="outline"
              size={isMobile ? "sm" : "default"}
              onClick={handleRefresh}
              className="mt-4"
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", isMobile && "h-3 w-3")} />
              Coba Lagi
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className={cn("p-4 flex-row items-center justify-between", isMobile && "p-3")}>
        <CardTitle className={cn("text-lg", isMobile && "text-base")}>
          Profit Margin - {displayData.period.label}
        </CardTitle>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size={isMobile ? "sm" : "icon"}
            onClick={handleRefresh}
            title="Perbarui Data"
          >
            <RefreshCw className={cn("h-4 w-4", isMobile && "h-3 w-3")} />
          </Button>
          <Button
            variant="ghost"
            size={isMobile ? "sm" : "icon"}
            title="Pengaturan"
          >
            <Settings className={cn("h-4 w-4", isMobile && "h-3 w-3")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className={cn("space-y-4 p-4", isMobile && "space-y-3 p-3")}>
        <div className="grid grid-cols-1 gap-4">
          <MarginStatus
            margin={displayData.grossMargin}
            type="gross"
            label="Gross Margin"
          />
          <MarginStatus
            margin={displayData.netMargin}
            type="net"
            label="Net Margin"
          />
        </div>

        <CostBreakdown
          cogs={displayData.cogs}
          opex={displayData.opex}
          revenue={displayData.revenue}
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={cn("text-sm font-medium", isMobile && "text-xs")}>
              Total Pendapatan
            </span>
            <span className={cn("text-sm font-bold", isMobile && "text-xs")}>
              {formatCurrency(displayData.revenue)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className={cn("text-sm font-medium", isMobile && "text-xs")}>
              Total Keuntungan
            </span>
            <span className={cn("text-sm font-bold", getMarginColor(displayData.netProfit), isMobile && "text-xs")}>
              {formatCurrency(displayData.netProfit)}
            </span>
          </div>
        </div>

        {insights.length > 0 && (
          <div className={cn("space-y-2", isMobile && "space-y-1")}>
            <span className={cn("text-sm font-medium", isMobile && "text-xs")}>
              Insights
            </span>
            {insights.slice(0, 2).map((insight, index) => (
              <InsightItem key={index} insight={insight} />
            ))}
          </div>
        )}

        <div className="flex space-x-2">
          <Button
            variant="outline"
            size={isMobile ? "sm" : "default"}
            onClick={() => calculateProfit()}
            disabled={isLoading}
          >
            <Calculator className={cn("mr-2 h-4 w-4", isMobile && "h-3 w-3")} />
            Hitung Ulang
          </Button>
          <Button
            variant="outline"
            size={isMobile ? "sm" : "default"}
            onClick={() => handleExport('csv')}
            disabled={exporting || !profitData}
          >
            <Download className={cn("mr-2 h-4 w-4", isMobile && "h-3 w-3")} />
            Ekspor
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfitMarginWidget;