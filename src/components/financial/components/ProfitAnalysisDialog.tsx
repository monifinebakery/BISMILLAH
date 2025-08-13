// src/components/financial/dialogs/ProfitAnalysisDialog.tsx
// ✅ PROFIT ANALYSIS DIALOG - Detailed Modal

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Factory,
  Building,
  AlertTriangle,
  Info,
  Download,
  RefreshCw,
  Settings,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Hooks
import { useProfitMargin } from '@/hooks/useProfitMargin';
import { createDatePeriods } from '@/services/profitAnalysisApi';

// Types
import { DatePeriod, ProfitInsight } from '@/types/profitAnalysis';

// ✅ LOADING SKELETON
const AnalysisSkeleton = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-gray-200 rounded h-20 animate-pulse" />
      <div className="bg-gray-200 rounded h-20 animate-pulse" />
    </div>
    <div className="bg-gray-200 rounded h-32 animate-pulse" />
    <div className="space-y-2">
      <div className="bg-gray-200 rounded h-4 animate-pulse" />
      <div className="bg-gray-200 rounded h-4 w-3/4 animate-pulse" />
    </div>
  </div>
);

// ✅ METRIC CARD COMPONENT
const MetricCard: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<any>;
  color: 'green' | 'red' | 'blue' | 'purple' | 'orange';
  trend?: number;
}> = ({ title, value, subtitle, icon: Icon, color, trend }) => {
  const colorClasses = {
    green: 'text-green-600 bg-green-50 border-green-200',
    red: 'text-red-600 bg-red-50 border-red-200',
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200',
    orange: 'text-orange-600 bg-orange-50 border-orange-200'
  };

  return (
    <Card className={cn("border-l-4", colorClasses[color])}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Icon className={cn("h-5 w-5", `text-${color}-600`)} />
          {trend !== undefined && (
            <div className="flex items-center gap-1">
              {trend > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : trend < 0 ? (
                <TrendingDown className="h-3 w-3 text-red-500" />
              ) : null}
              <span className={cn(
                "text-xs",
                trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-gray-500"
              )}>
                {trend > 0 ? "+" : ""}{trend.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={cn("text-xl font-bold", `text-${color}-700`)}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ✅ COST BREAKDOWN COMPONENT
const CostBreakdownChart: React.FC<{
  revenue: number;
  materialCost: number;
  laborCost: number;
  overhead: number;
  opex: number;
}> = ({ revenue, materialCost, laborCost, overhead, opex }) => {
  if (revenue === 0) return null;

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);

  const formatPercentage = (amount: number) => ((amount / revenue) * 100).toFixed(1);

  const items = [
    { label: 'Material', amount: materialCost, color: 'bg-red-500', percentage: formatPercentage(materialCost) },
    { label: 'Labor', amount: laborCost, color: 'bg-orange-500', percentage: formatPercentage(laborCost) },
    { label: 'Overhead', amount: overhead, color: 'bg-yellow-500', percentage: formatPercentage(overhead) },
    { label: 'OPEX', amount: opex, color: 'bg-purple-500', percentage: formatPercentage(opex) },
    { label: 'Profit', amount: revenue - materialCost - laborCost - overhead - opex, color: 'bg-green-500', percentage: formatPercentage(revenue - materialCost - laborCost - overhead - opex) }
  ];

  return (
    <div className="space-y-4">
      <h4 className="font-medium">Breakdown Biaya</h4>
      
      {/* Waterfall Chart */}
      <div className="space-y-2">
        <div className="flex h-8 bg-gray-100 rounded overflow-hidden">
          {items.slice(0, -1).map((item, index) => (
            <div
              key={index}
              className={item.color}
              style={{ width: `${item.percentage}%` }}
              title={`${item.label}: ${item.percentage}%`}
            />
          ))}
          <div
            className={items[items.length - 1].color}
            style={{ width: `${items[items.length - 1].percentage}%` }}
            title={`Profit: ${items[items.length - 1].percentage}%`}
          />
        </div>
        
        {/* Legend */}
        <div className="grid grid-cols-2 gap-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded", item.color)} />
                <span>{item.label}</span>
              </div>
              <div className="text-right">
                <p className="font-medium">{item.percentage}%</p>
                <p className="text-xs text-gray-500">{formatCurrency(item.amount)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ✅ INSIGHTS COMPONENT
const InsightsList: React.FC<{
  insights: ProfitInsight[];
}> = ({ insights }) => {
  if (!insights || insights.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Info className="h-8 w-8 mx-auto mb-2" />
        <p>Tidak ada insight tersedia</p>
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success': return <TrendingUp className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'success': return 'bg-green-50 border-green-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="space-y-3">
      {insights.map((insight, index) => (
        <Card key={index} className={cn("border-l-4", getBgColor(insight.type))}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {getIcon(insight.type)}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">{insight.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{insight.message}</p>
                {insight.recommendation && (
                  <p className="text-xs text-blue-600 mt-2 font-medium">
                    💡 {insight.recommendation}
                  </p>
                )}
                <Badge 
                  variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'default' : 'secondary'}
                  className="mt-2 text-xs"
                >
                  Impact: {insight.impact}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// ✅ MAIN DIALOG COMPONENT
export const ProfitAnalysisDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  dateRange?: { from: Date; to: Date };
}> = ({ isOpen, onClose, dateRange }) => {
  const [isCalculating, setIsCalculating] = useState(false);

  // Create period from dateRange
  const period: DatePeriod = dateRange ? {
    from: dateRange.from,
    to: dateRange.to,
    label: `${dateRange.from.toLocaleDateString('id-ID')} - ${dateRange.to.toLocaleDateString('id-ID')}`
  } : createDatePeriods.thisMonth();

  // Use profit margin hook
  const {
    profitData,
    keyMetrics,
    isLoading,
    calculateProfit,
    exportAnalysis,
    error
  } = useProfitMargin(period);

  // Calculate on dialog open
  useEffect(() => {
    if (isOpen && !profitData && !isLoading) {
      handleCalculate();
    }
  }, [isOpen]);

  // ✅ HANDLERS
  const handleCalculate = async () => {
    try {
      setIsCalculating(true);
      await calculateProfit();
      toast.success('Analisis profit margin berhasil dihitung');
    } catch (error: any) {
      toast.error(error.message || 'Gagal menghitung profit margin');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      await exportAnalysis(format);
      toast.success(`Laporan ${format.toUpperCase()} berhasil diekspor`);
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengekspor laporan');
    }
  };

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Analisis Real Profit Margin
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Periode: {period.label}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCalculate}
                disabled={isCalculating || isLoading}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", (isCalculating || isLoading) && "animate-spin")} />
                {isCalculating || isLoading ? 'Menghitung...' : 'Hitung Ulang'}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          {isLoading ? (
            <AnalysisSkeleton />
          ) : error ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 text-red-600">
                  <AlertTriangle className="h-6 w-6" />
                  <div>
                    <h3 className="font-medium">Gagal Memuat Analisis</h3>
                    <p className="text-sm text-red-500 mt-1">{error}</p>
                  </div>
                </div>
                <Button onClick={handleCalculate} variant="outline" className="mt-4">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Coba Lagi
                </Button>
              </CardContent>
            </Card>
          ) : !profitData ? (
            <div className="text-center py-12">
              <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-medium text-gray-600 mb-2">Belum Ada Analisis</h3>
              <p className="text-sm text-gray-500 mb-4">
                Klik "Hitung Ulang" untuk memulai analisis profit margin.
              </p>
            </div>
          ) : (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="comparison">Perbandingan</TabsTrigger>
              </TabsList>

              {/* ✅ OVERVIEW TAB */}
              <TabsContent value="overview" className="space-y-6 mt-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard
                    title="Revenue"
                    value={formatCurrency(profitData.profitMarginData.revenue)}
                    icon={DollarSign}
                    color="blue"
                  />
                  <MetricCard
                    title="Gross Margin"
                    value={`${profitData.profitMarginData.grossMargin.toFixed(1)}%`}
                    subtitle={formatCurrency(profitData.profitMarginData.grossProfit)}
                    icon={TrendingUp}
                    color={profitData.profitMarginData.grossMargin >= 25 ? "green" : profitData.profitMarginData.grossMargin >= 15 ? "orange" : "red"}
                  />
                  <MetricCard
                    title="Net Margin"
                    value={`${profitData.profitMarginData.netMargin.toFixed(1)}%`}
                    subtitle={formatCurrency(profitData.profitMarginData.netProfit)}
                    icon={Calculator}
                    color={profitData.profitMarginData.netMargin >= 10 ? "green" : profitData.profitMarginData.netMargin >= 5 ? "orange" : "red"}
                  />
                  <MetricCard
                    title="Total Costs"
                    value={formatCurrency(profitData.profitMarginData.cogs + profitData.profitMarginData.opex)}
                    subtitle={`${(((profitData.profitMarginData.cogs + profitData.profitMarginData.opex) / profitData.profitMarginData.revenue) * 100).toFixed(1)}% dari revenue`}
                    icon={Factory}
                    color="purple"
                  />
                </div>

                {/* Cost Breakdown Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Struktur Biaya</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CostBreakdownChart
                      revenue={profitData.profitMarginData.revenue}
                      materialCost={profitData.cogsBreakdown.totalMaterialCost}
                      laborCost={profitData.cogsBreakdown.totalDirectLaborCost}
                      overhead={profitData.cogsBreakdown.manufacturingOverhead}
                      opex={profitData.opexBreakdown.totalOPEX}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ✅ BREAKDOWN TAB */}
              <TabsContent value="breakdown" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* COGS Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Factory className="h-5 w-5" />
                        COGS (Cost of Goods Sold)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Material Costs:</span>
                          <span className="font-medium">{formatCurrency(profitData.cogsBreakdown.totalMaterialCost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Direct Labor:</span>
                          <span className="font-medium">{formatCurrency(profitData.cogsBreakdown.totalDirectLaborCost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Manufacturing Overhead:</span>
                          <span className="font-medium">{formatCurrency(profitData.cogsBreakdown.manufacturingOverhead)}</span>
                        </div>