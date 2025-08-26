import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Cell, PieChart, Pie
} from 'recharts';
import { HelpCircle } from 'lucide-react';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { formatCurrency, formatLargeNumber } from '../utils/profitTransformers';
import { RealTimeProfitCalculation } from '../types/profitAnalysis.types';
import { CHART_CONFIG } from '../constants';
import { validateFinancialMetrics, logValidationResults } from '@/utils/chartDataValidation';
import { getEffectiveCogs } from '@/utils/cogsCalculation';
import { safeCalculateMargins } from '@/utils/profitValidation';

// ==============================================
// TYPES
// ==============================================

export interface ProfitBreakdownChartProps {
  currentAnalysis: RealTimeProfitCalculation | null;
  isLoading: boolean;
  chartType?: 'bar' | 'pie';
  showComparison?: boolean;
  className?: string;
  /** ⬇️ WAC-aware COGS dari useProfitAnalysis */
  effectiveCogs?: number;
  /** ⬇️ tooltip/label WAC */
  labels?: { hppLabel: string; hppHint: string };
}

interface ChartData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface BarChartData {
  category: string;
  'Omset': number;
  'Modal Bahan': number;
  'Biaya Tetap': number;
  'Untung Kotor': number;
  'Untung Bersih': number;
}

// ==============================================
// HELPER FUNCTIONS OUTSIDE COMPONENT
// ==============================================

const calculateMetrics = (revenue: number, cogs: number, opex: number) => {
  // ✅ IMPROVED: Use centralized calculation for consistency
  const margins = safeCalculateMargins(revenue, cogs, opex);

  return {
    revenue,
    cogs,
    opex,
    grossProfit: margins.grossProfit,
    netProfit: margins.netProfit
  };
};

const generateBarChartData = (metrics: ReturnType<typeof calculateMetrics>) => {
  return [
    {
      category: 'Ringkasan Warung',
      'Omset': metrics.revenue,
      'Modal Bahan': metrics.cogs,
      'Biaya Tetap': metrics.opex,
      'Untung Kotor': metrics.grossProfit,
      'Untung Bersih': metrics.netProfit
    }
  ];
};

const generatePieChartData = (metrics: ReturnType<typeof calculateMetrics>) => {
  const totalOmset = metrics.revenue;
  
  if (totalOmset === 0) {
    return [];
  }

  const data = [
    {
      name: 'Untung Bersih',
      value: metrics.netProfit,
      percentage: (metrics.netProfit / totalOmset) * 100,
      color: CHART_CONFIG.colors.net_profit
    },
    {
      name: 'Modal Bahan Baku',
      value: metrics.cogs,
      percentage: (metrics.cogs / totalOmset) * 100,
      color: CHART_CONFIG.colors.cogs
    },
    {
      name: 'Biaya Bulanan Tetap',
      value: metrics.opex,
      percentage: (metrics.opex / totalOmset) * 100,
      color: CHART_CONFIG.colors.opex
    }
  ];

  return data.filter(item => item.value > 0);
};

const calculateSummaryStats = (metrics: ReturnType<typeof calculateMetrics>) => {
  const grossMargin = metrics.revenue > 0 ? (metrics.grossProfit / metrics.revenue) * 100 : 0;
  const netMargin = metrics.revenue > 0 ? (metrics.netProfit / metrics.revenue) * 100 : 0;
  const cogsRatio = metrics.revenue > 0 ? (metrics.cogs / metrics.revenue) * 100 : 0;
  const opexRatio = metrics.revenue > 0 ? (metrics.opex / metrics.revenue) * 100 : 0;

  return { grossMargin, netMargin, cogsRatio, opexRatio };
};

// ==============================================
// TOOLTIP COMPONENTS
// ==============================================

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  // Create a mapping from dataKey to friendly label
  const dataKeyLabelMap = {
    'Omset': 'Omset',
    'Modal Bahan': 'Modal Bahan',
    'Biaya Tetap': 'Biaya Tetap',
    'Untung Kotor': 'Untung Kotor',
    'Untung Bersih': 'Untung Bersih'
  };

  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg">
      <p className="font-semibold text-gray-800 mb-2">{label}</p>
      {payload && payload.length > 0 && payload.map((entry: any, index: number) => {
        // Pastikan entry ada dan memiliki dataKey
        if (!entry || entry.value === undefined) return null;
        
        const dataKey = entry.dataKey as keyof typeof dataKeyLabelMap;
        const label = dataKeyLabelMap[dataKey] || entry.dataKey;
        const value = entry.value !== undefined ? entry.value : 0;
        
        return (
          <div key={index} className="flex items-center space-x-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color || '#000000' }}
            />
            <span className="text-sm text-gray-600">{label}:</span>
            <span className="text-sm font-medium">
              {formatCurrency(Number(value))}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload;
  
  // Pastikan data ada dan memiliki value
  if (!data || data.value === undefined) return null;
  
  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg">
      <p className="font-semibold text-gray-800">{data.name || 'Unknown'}</p>
      <p className="text-sm text-gray-600">
        {formatCurrency(Number(data.value))} ({Number(data.percentage || 0).toFixed(1)}%)
      </p>
    </div>
  );
};

// ==============================================
// MAIN COMPONENT
// ==============================================

const ProfitBreakdownChart = ({
  currentAnalysis,
  isLoading,
  chartType = 'bar',
  showComparison = false,
  className = '',
  effectiveCogs,
  labels
}: ProfitBreakdownChartProps) => {

  // ✅ IMPROVED: Use centralized COGS calculation with comprehensive validation
  const revenue = currentAnalysis?.revenue_data?.total ?? 0;
  
  const cogsResult = getEffectiveCogs(
    currentAnalysis || {} as RealTimeProfitCalculation,
    effectiveCogs,
    revenue,
    { preferWAC: true, validateRange: true }
  );
  
  const opex = currentAnalysis?.opex_data?.total ?? 0;

  // ✅ IMPROVED: Use safe margin calculation with comprehensive validation
  const validationResult = safeCalculateMargins(revenue, cogsResult.value, opex);
  
  // Log any COGS calculation warnings
  if (import.meta.env.DEV && cogsResult.warnings.length > 0) {
    cogsResult.warnings.forEach(warning => 
      console.warn('[BreakdownChart] COGS warning:', warning)
    );
  }
  
  // Log data quality issues
  if (import.meta.env.DEV && !validationResult.isValid) {
    console.warn('[BreakdownChart] Data validation issues:', {
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      qualityScore: validationResult.qualityScore
    });
  }
  
  if (import.meta.env.DEV && validationResult.qualityScore < 70) {
    console.warn('[BreakdownChart] Low data quality detected:', {
      score: validationResult.qualityScore,
      issues: [...validationResult.errors, ...validationResult.warnings]
    });
  }
  
  // Use the validated metrics directly (safeCalculateMargins returns metrics directly, not in nested structure)
  const finalMetrics = {
    revenue,
    cogs: cogsResult.value,
    opex,
    grossProfit: validationResult.grossProfit,
    netProfit: validationResult.netProfit,
    grossMargin: validationResult.grossMargin,
    netMargin: validationResult.netMargin
  };
  
  const barChartData = generateBarChartData(finalMetrics);
  const pieChartData = generatePieChartData(finalMetrics);
  const summaryStats = calculateSummaryStats(finalMetrics);

  // ✅ PIE LABEL FUNCTION
  const renderPieLabel = (entry: any) => {
    return `${entry.name}: ${entry.percentage.toFixed(1)}%`;
  };

  // ✅ LOADING STATE
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Ringkasan Keuangan Warung</CardTitle>
          <CardDescription>
            Lihat bagaimana omset terbagi: modal bahan, biaya tetap, dan untung bersih
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  // ✅ NO DATA STATE
  if (!currentAnalysis || finalMetrics.revenue === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Ringkasan Keuangan Warung</CardTitle>
          <CardDescription>
            Lihat bagaimana omset terbagi: modal bahan, biaya tetap, dan untung bersih
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 text-lg mb-2">Belum Ada Data Omset</div>
              <div className="text-gray-500 text-sm">
                Pilih periode yang sudah ada transaksi untuk melihat ringkasan keuangan warung
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ✅ BAR CHART RENDER
  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart 
        data={barChartData} 
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="category" 
          tick={{ fontSize: 12 }}
          axisLine={false}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => formatLargeNumber(value)}
          axisLine={false}
        />
        <Tooltip trigger="click" content={<CustomBarTooltip />} />
        <Legend 
          wrapperStyle={{ fontSize: '12px' }}
          iconType="circle"
        />
        
        {/* Bar Omset */}
        <Bar 
          dataKey="Omset" 
          fill={CHART_CONFIG.colors.revenue}
          radius={[2, 2, 0, 0]}
        />
        
        {/* Bar Modal Bahan */}
        <Bar 
          dataKey="Modal Bahan" 
          fill={CHART_CONFIG.colors.cogs}
          radius={[2, 2, 0, 0]}
        />
        
        {/* Bar Biaya Tetap */}
        <Bar 
          dataKey="Biaya Tetap" 
          fill={CHART_CONFIG.colors.opex}
          radius={[2, 2, 0, 0]}
        />
        
        {/* Bar Untung Kotor */}
        <Bar 
          dataKey="Untung Kotor" 
          fill={CHART_CONFIG.colors.gross_profit}
          radius={[2, 2, 0, 0]}
        />
        
        {/* Bar Untung Bersih */}
        <Bar 
          dataKey="Untung Bersih" 
          fill={CHART_CONFIG.colors.net_profit}
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  // ✅ PIE CHART RENDER
  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={pieChartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderPieLabel}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
          animationDuration={1000}
        >
          {pieChartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip trigger="click" content={<CustomPieTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );

  // ✅ MAIN RENDER
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              Ringkasan Keuangan Warung
              <TooltipProvider delayDuration={100}>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <button 
                      type="button"
                      className="p-1 -m-1 touch-manipulation"
                      aria-label="Info ringkasan keuangan"
                    >
                      <HelpCircle className="w-4 h-4 text-orange-500 hover:text-orange-700 transition-colors" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>Grafik ini menunjukkan bagaimana omset warung terbagi menjadi: modal beli bahan, biaya tetap bulanan (listrik, sewa, gaji), dan keuntungan bersih yang bisa dibawa pulang.</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription>
              {chartType === 'bar' 
                ? 'Lihat bagaimana omset terbagi: modal bahan, biaya tetap, dan untung bersih'
                : 'Proporsi omset untuk modal bahan, biaya bulanan, dan keuntungan'
              }
            </CardDescription>

            {/* ⬇️ Tambah badge WAC jika tersedia */}
            {labels?.hppLabel && (
              <div className="mt-1 text-xs text-gray-500">
                <span
                  className="underline decoration-dotted cursor-help"
                  title={labels.hppHint}
                >
                  {labels.hppLabel} aktif
                </span>
              </div>
            )}
          </div>
          
          {/* Quick Stats with Tooltips */}
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <div className="text-xs sm:text-sm text-gray-600">Untung Kotor</div>
              <TooltipProvider delayDuration={100}>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <button 
                      type="button"
                      className="p-1 -m-1 touch-manipulation"
                      aria-label="Info untung kotor"
                    >
                      <HelpCircle className="w-3 h-3 text-orange-500 hover:text-orange-700 transition-colors" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>Untung kotor = Omset dikurangi modal bahan. Ini keuntungan sebelum dipotong biaya tetap seperti listrik, sewa, gaji.</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </div>
            <div className="text-sm sm:text-lg font-bold text-orange-600">
              {summaryStats.grossMargin.toFixed(1)}%
            </div>
            <div className="flex items-center gap-1 justify-end mt-1">
              <div className="text-xs sm:text-sm text-gray-600">Untung Bersih</div>
              <TooltipProvider delayDuration={100}>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <button 
                      type="button"
                      className="p-1 -m-1 touch-manipulation"
                      aria-label="Info untung bersih"
                    >
                      <HelpCircle className="w-3 h-3 text-orange-500 hover:text-orange-700 transition-colors" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>Untung bersih = Omset dikurangi modal bahan dan semua biaya tetap. Ini keuntungan yang benar-benar bisa dibawa pulang.</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </div>
            <div className="text-sm sm:text-lg font-bold text-orange-700">
              {summaryStats.netMargin.toFixed(1)}%
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Charts */}
        <div className="mb-4">
          {chartType === 'bar' ? renderBarChart() : renderPieChart()}
        </div>

        {/* Summary Cards with Tooltips - Responsive grid for all screen sizes */}
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6 pt-4 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <div className="text-xs sm:text-sm text-gray-600">Total Omset</div>
              <TooltipProvider delayDuration={100}>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <button 
                      type="button"
                      className="p-1 -m-1 touch-manipulation"
                      aria-label="Info total omset"
                    >
                      <HelpCircle className="w-3 h-3 text-orange-500 hover:text-orange-700 transition-colors" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>Semua uang yang masuk dari jualan makanan dan minuman dalam periode ini.</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </div>
            <div className="text-sm sm:text-lg font-bold text-green-600">
              {formatCurrency(finalMetrics.revenue)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <div className="text-xs sm:text-sm text-gray-600">Modal Bahan</div>
              <TooltipProvider delayDuration={100}>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <button 
                      type="button"
                      className="p-1 -m-1 touch-manipulation"
                      aria-label="Info modal bahan"
                    >
                      <HelpCircle className="w-3 h-3 text-orange-500 hover:text-orange-700 transition-colors" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>Uang yang keluar untuk beli bahan baku seperti tepung, gula, telur, dll. Idealnya di bawah 40% dari omset.</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </div>
            <div className="text-sm sm:text-lg font-bold text-orange-600">
              {formatCurrency(finalMetrics.cogs)}
            </div>
            <div className="text-xs text-gray-500 hidden sm:block">
              {summaryStats.cogsRatio.toFixed(1)}%
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <div className="text-xs sm:text-sm text-gray-600">Biaya Tetap</div>
              <TooltipProvider delayDuration={100}>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <button 
                      type="button"
                      className="p-1 -m-1 touch-manipulation"
                      aria-label="Info biaya tetap"
                    >
                      <HelpCircle className="w-3 h-3 text-orange-500 hover:text-orange-700 transition-colors" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>Biaya yang harus dibayar tiap bulan seperti listrik, gas, sewa tempat, gaji karyawan, dll.</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </div>
            <div className="text-sm sm:text-lg font-bold text-red-600">
              {formatCurrency(finalMetrics.opex)}
            </div>
            <div className="text-xs text-gray-500 hidden sm:block">
              {summaryStats.opexRatio.toFixed(1)}%
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <div className="text-xs sm:text-sm text-gray-600">Untung Bersih</div>
              <TooltipProvider delayDuration={100}>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <button 
                      type="button"
                      className="p-1 -m-1 touch-manipulation"
                      aria-label="Info untung bersih"
                    >
                      <HelpCircle className="w-3 h-3 text-orange-500 hover:text-orange-700 transition-colors" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p>Keuntungan yang benar-benar bisa dibawa pulang setelah dikurangi modal bahan dan semua biaya tetap.</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </div>
            <div className={`text-sm sm:text-lg font-bold ${
              finalMetrics.netProfit >= 0 ? 'text-orange-700' : 'text-red-600'
            }`}>
              {formatCurrency(finalMetrics.netProfit)}
            </div>
            <div className="text-xs text-gray-500 hidden sm:block">
              {summaryStats.netMargin.toFixed(1)}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfitBreakdownChart;
