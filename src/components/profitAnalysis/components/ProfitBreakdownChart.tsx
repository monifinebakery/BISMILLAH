import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

import { formatCurrency, formatLargeNumber } from '../utils/profitTransformers';
import { RealTimeProfitCalculation } from '../types/profitAnalysis.types';
import { CHART_CONFIG } from '../constants';

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

interface PieData {
  key: string;
  label: string;
  value: number;
  percentage: number;
}

interface BarChartData {
  category: string;
  revenue: number;
  cogs: number;
  opex: number;
  grossProfit: number;
  netProfit: number;
}

// ==============================================
// HELPER FUNCTIONS OUTSIDE COMPONENT
// ==============================================

const calculateMetrics = (revenue: number, cogs: number, opex: number) => {
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - opex;

  return {
    revenue,
    cogs,
    opex,
    grossProfit,
    netProfit
  };
};

const generateBarChartData = (metrics: ReturnType<typeof calculateMetrics>) => {
  return [
    {
      category: '🍽️ Ringkasan Warung',
      revenue: metrics.revenue,
      cogs: metrics.cogs,
      opex: metrics.opex,
      grossProfit: metrics.grossProfit,
      netProfit: metrics.netProfit,
    },
  ];
};

const generatePieChartData = (metrics: ReturnType<typeof calculateMetrics>) => {
  const totalRevenue = metrics.revenue;

  if (totalRevenue === 0) {
    return [];
  }

  const data: PieData[] = [
    {
      key: 'netProfit',
      label: '💎 Untung Bersih',
      value: metrics.netProfit,
      percentage: (metrics.netProfit / totalRevenue) * 100,
    },
    {
      key: 'cogs',
      label: '🥘 Modal Bahan Baku',
      value: metrics.cogs,
      percentage: (metrics.cogs / totalRevenue) * 100,
    },
    {
      key: 'opex',
      label: '🏪 Biaya Bulanan Tetap',
      value: metrics.opex,
      percentage: (metrics.opex / totalRevenue) * 100,
    },
  ];

  return data.filter((item) => item.value > 0);
};

const calculateSummaryStats = (metrics: ReturnType<typeof calculateMetrics>) => {
  const grossMargin = metrics.revenue > 0 ? (metrics.grossProfit / metrics.revenue) * 100 : 0;
  const netMargin = metrics.revenue > 0 ? (metrics.netProfit / metrics.revenue) * 100 : 0;
  const cogsRatio = metrics.revenue > 0 ? (metrics.cogs / metrics.revenue) * 100 : 0;
  const opexRatio = metrics.revenue > 0 ? (metrics.opex / metrics.revenue) * 100 : 0;

  return { grossMargin, netMargin, cogsRatio, opexRatio };
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

  // ✅ UPDATE: Pakai effectiveCogs kalau ada
  const revenue = currentAnalysis?.revenue_data?.total ?? 0;
  const cogs = (typeof effectiveCogs === 'number' ? effectiveCogs : currentAnalysis?.cogs_data?.total) ?? 0;
  const opex = currentAnalysis?.opex_data?.total ?? 0;

  // Calculate all metrics directly
  const metrics = calculateMetrics(revenue, cogs, opex);
  const barChartData = generateBarChartData(metrics);
  const pieChartData = generatePieChartData(metrics);
  const summaryStats = calculateSummaryStats(metrics);

  const chartConfig: ChartConfig = {
    revenue: { label: 'Omset', color: CHART_CONFIG.colors.revenue },
    cogs: { label: 'Modal Bahan', color: CHART_CONFIG.colors.cogs },
    opex: { label: 'Biaya Tetap', color: CHART_CONFIG.colors.opex },
    grossProfit: { label: 'Untung Kotor', color: CHART_CONFIG.colors.gross_profit },
    netProfit: { label: 'Untung Bersih', color: CHART_CONFIG.colors.net_profit },
  };

  // ✅ PIE LABEL FUNCTION
  const renderPieLabel = (entry: PieData) => {
    return `${entry.label}: ${entry.percentage.toFixed(1)}%`;
  };

  // ✅ LOADING STATE
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>🍽️ Ringkasan Keuangan Warung</CardTitle>
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
  if (!currentAnalysis || metrics.revenue === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>🍽️ Ringkasan Keuangan Warung</CardTitle>
          <CardDescription>
            Lihat bagaimana omset terbagi: modal bahan, biaya tetap, dan untung bersih
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 text-lg mb-2">📊 Belum Ada Data Omset</div>
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
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <BarChart
        data={barChartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis dataKey="category" tick={{ fontSize: 12 }} axisLine={false} />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => formatLargeNumber(value)}
          axisLine={false}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value: number) => formatCurrency(value)}
            />
          }
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} iconType="circle" />

        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[2, 2, 0, 0]} name="Omset" />
        <Bar dataKey="cogs" fill="var(--color-cogs)" radius={[2, 2, 0, 0]} name="Modal Bahan" />
        <Bar dataKey="opex" fill="var(--color-opex)" radius={[2, 2, 0, 0]} name="Biaya Tetap" />
        <Bar dataKey="grossProfit" fill="var(--color-grossProfit)" radius={[2, 2, 0, 0]} name="Untung Kotor" />
        <Bar dataKey="netProfit" fill="var(--color-netProfit)" radius={[2, 2, 0, 0]} name="Untung Bersih" />
      </BarChart>
    </ChartContainer>
  );

  // ✅ PIE CHART RENDER
  const renderPieChart = () => (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <PieChart>
        <Pie
          data={pieChartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderPieLabel}
          outerRadius={120}
          dataKey="value"
          nameKey="label"
          animationDuration={1000}
        >
          {pieChartData.map((entry) => (
            <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
          ))}
        </Pie>
        <ChartTooltip
          content={
            <ChartTooltipContent
              nameKey="key"
              formatter={(value: number) => formatCurrency(value)}
            />
          }
        />
      </PieChart>
    </ChartContainer>
  );

  // ✅ MAIN RENDER
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>🍽️ Ringkasan Keuangan Warung</CardTitle>
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
          
          {/* Quick Stats */}
          <div className="text-right">
            <div className="text-xs sm:text-sm text-gray-600">🎯 Untung Kotor</div>
            <div className="text-sm sm:text-lg font-bold text-orange-600">
              {summaryStats.grossMargin.toFixed(1)}%
            </div>
            <div className="text-xs sm:text-sm text-gray-600 mt-1">💎 Untung Bersih</div>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6 pt-4 border-t">
          <div className="text-center">
            <div className="text-xs sm:text-sm text-gray-600">💰 Total Omset</div>
            <div className="text-sm sm:text-lg font-bold text-green-600">
              {formatCurrency(metrics.revenue)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs sm:text-sm text-gray-600">🥘 Modal Bahan</div>
            <div className="text-sm sm:text-lg font-bold text-orange-600">
              {formatCurrency(metrics.cogs)}
            </div>
            <div className="text-xs text-gray-500 hidden sm:block">
              {summaryStats.cogsRatio.toFixed(1)}%
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs sm:text-sm text-gray-600">🏪 Biaya Tetap</div>
            <div className="text-sm sm:text-lg font-bold text-red-600">
              {formatCurrency(metrics.opex)}
            </div>
            <div className="text-xs text-gray-500 hidden sm:block">
              {summaryStats.opexRatio.toFixed(1)}%
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs sm:text-sm text-gray-600">💎 Untung Bersih</div>
            <div className={`text-sm sm:text-lg font-bold ${
              metrics.netProfit >= 0 ? 'text-orange-700' : 'text-red-600'
            }`}>
              {formatCurrency(metrics.netProfit)}
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