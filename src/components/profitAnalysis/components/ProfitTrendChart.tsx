// src/components/warehouse/components/ProfitTrendChart.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

import { formatCurrency, formatLargeNumber, getShortPeriodLabel } from '../utils/profitTransformers';
import { RealTimeProfitCalculation } from '../types/profitAnalysis.types';
import { CHART_CONFIG } from '../constants';

// ==============================================
// TYPES
// ==============================================

export interface ProfitTrendChartProps {
  profitHistory: RealTimeProfitCalculation[];
  isLoading: boolean;
  chartType?: 'line' | 'area';
  showMetrics?: ('revenue' | 'grossProfit' | 'netProfit' | 'margins')[];
  className?: string;
  /** ⬇️ WAC-aware COGS dari useProfitAnalysis */
  effectiveCogs?: number;
  /** ⬇️ Nilai stok WAC dari warehouse */
  wacStockValue?: number;
  /** ⬇️ label/tooltip WAC */
  labels?: { hppLabel: string; hppHint: string };
}

interface TrendData {
  period: string;
  periodLabel: string;
  revenue: number;
  cogs: number;
  opex: number;
  grossProfit: number;
  netProfit: number;
  grossMargin: number;
  netMargin: number;
  // ✅ TAMBAH: Field baru untuk nilai stok WAC
  stockValue?: number;
}

// ==============================================
// HELPER FUNCTIONS OUTSIDE COMPONENT
// ==============================================

const processTrendData = (
  profitHistory: RealTimeProfitCalculation[], 
  effectiveCogs?: number,
  wacStockValue?: number
) => {
  if (!profitHistory || profitHistory.length === 0) return [];

  // Create copy of array to avoid mutation
  const sortedHistory = [...profitHistory].sort((a, b) => a.period.localeCompare(b.period));
  
  return sortedHistory.map(analysis => {
    const revenue = analysis.revenue_data?.total || 0;
    // ✅ UPDATE: Gunakan effectiveCogs kalau ada
    const cogs = (typeof effectiveCogs === 'number' ? effectiveCogs : analysis.cogs_data?.total) || 0;
    const opex = analysis.opex_data?.total || 0;
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - opex;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return {
      period: analysis.period,
      periodLabel: getShortPeriodLabel(analysis.period),
      revenue,
      cogs,
      opex,
      grossProfit,
      netProfit,
      grossMargin,
      netMargin,
      // ✅ TAMBAH: Nilai stok WAC
      stockValue: wacStockValue
    };
  });
};

const analyzeTrend = (trendData: TrendData[]) => {
  if (trendData.length < 2) {
    return {
      revenueGrowth: 0,
      profitGrowth: 0,
      marginTrend: 'stabil',
      bestMonth: null,
      worstMonth: null
    };
  }

  const firstPeriod = trendData[0];
  const lastPeriod = trendData[trendData.length - 1];
  
  const revenueGrowth = firstPeriod.revenue > 0 
    ? ((lastPeriod.revenue - firstPeriod.revenue) / firstPeriod.revenue) * 100 
    : 0;
  
  const profitGrowth = firstPeriod.netProfit > 0 
    ? ((lastPeriod.netProfit - firstPeriod.netProfit) / firstPeriod.netProfit) * 100 
    : 0;

  // Analyze margin trend
  const marginTrend = lastPeriod.netMargin > firstPeriod.netMargin + 2 ? 'membaik' :
                     lastPeriod.netMargin < firstPeriod.netMargin - 2 ? 'menurun' : 'stabil';

  // Best and worst performing months
  const bestMonth = trendData.reduce((best, current) => 
    current.netProfit > best.netProfit ? current : best
  );
  
  const worstMonth = trendData.reduce((worst, current) => 
    current.netProfit < worst.netProfit ? current : worst
  );

  return {
    revenueGrowth,
    profitGrowth,
    marginTrend,
    bestMonth,
    worstMonth
  };
};

// ==============================================
// MAIN COMPONENT
// ==============================================

const ProfitTrendChart: React.FC<ProfitTrendChartProps> = ({
  profitHistory,
  isLoading,
  chartType = 'line',
  showMetrics = ['revenue', 'grossProfit', 'netProfit'],
  className = '',
  effectiveCogs,
  wacStockValue,
  labels
}) => {
  
  const [selectedMetrics, setSelectedMetrics] = useState(['revenue', 'grossProfit', 'netProfit']);
  const [viewType, setViewType] = useState('values');

  // ✅ NO useMemo - Calculate directly on each render
  const trendData = processTrendData(profitHistory, effectiveCogs, wacStockValue);
  const trendAnalysis = analyzeTrend(trendData);

  // ✅ METRIC CONFIGURATIONS - UPDATE dengan orange dominan
  const metricConfigs = {
    revenue: { key: 'revenue', label: '💰 Omset', color: CHART_CONFIG.colors.revenue },
    grossProfit: { key: 'grossProfit', label: '🎯 Untung Kotor', color: CHART_CONFIG.colors.primary },
    netProfit: { key: 'netProfit', label: '💎 Untung Bersih', color: '#dc2626' },
    cogs: { key: 'cogs', label: '🥘 Modal Bahan', color: CHART_CONFIG.colors.cogs },
    opex: { key: 'opex', label: '🏪 Biaya Tetap', color: CHART_CONFIG.colors.opex },
    grossMargin: { key: 'grossMargin', label: '📈 % Untung Kotor', color: CHART_CONFIG.colors.primary },
    netMargin: { key: 'netMargin', label: '📊 % Untung Bersih', color: '#dc2626' },
    // ✅ TAMBAH: Entry baru untuk stockValue
    stockValue: { key: 'stockValue', label: '📦 Nilai Stok (WAC)', color: CHART_CONFIG.colors.warning }
  };

  const chartConfig: ChartConfig = {
    revenue: { label: '💰 Omset', color: CHART_CONFIG.colors.revenue },
    grossProfit: { label: '🎯 Untung Kotor', color: CHART_CONFIG.colors.primary },
    netProfit: { label: '💎 Untung Bersih', color: '#dc2626' },
    cogs: { label: '🥘 Modal Bahan', color: CHART_CONFIG.colors.cogs },
    opex: { label: '🏪 Biaya Tetap', color: CHART_CONFIG.colors.opex },
    grossMargin: { label: '📈 % Untung Kotor', color: CHART_CONFIG.colors.primary },
    netMargin: { label: '📊 % Untung Bersih', color: '#dc2626' },
    stockValue: { label: '📦 Nilai Stok (WAC)', color: CHART_CONFIG.colors.warning },
  };

  // ✅ EVENT HANDLERS
  const toggleMetric = (metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  // ✅ LOADING STATE
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>📈 Grafik Perkembangan Untung Warung</CardTitle>
          <CardDescription>
            Lihat bagaimana omset dan keuntungan warung berkembang dari waktu ke waktu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  // ✅ NO DATA STATE
  if (!trendData || trendData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>📈 Grafik Perkembangan Untung Warung</CardTitle>
          <CardDescription>
            Lihat bagaimana omset dan keuntungan warung berkembang dari waktu ke waktu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 text-lg mb-2">📊 Belum Ada Riwayat Bulanan</div>
              <div className="text-gray-500 text-sm">
                Grafik perkembangan warung akan muncul setelah ada data beberapa bulan
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ✅ LINE CHART RENDER
  const renderLineChart = () => (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis dataKey="periodLabel" tick={{ fontSize: 12 }} axisLine={false} />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(value) =>
            viewType === 'margins' ? `${value}%` : formatLargeNumber(value)
          }
          axisLine={false}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value: number) =>
                viewType === 'margins'
                  ? `${value.toFixed(1)}%`
                  : formatCurrency(value)
              }
            />
          }
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} iconType="circle" />

        {selectedMetrics.map((metric) => {
          const config = metricConfigs[metric as keyof typeof metricConfigs];
          if (!config) return null;
          return (
            <Line
              key={metric}
              type="monotone"
              dataKey={config.key}
              stroke={`var(--color-${config.key})`}
              strokeWidth={2}
              dot={{ fill: `var(--color-${config.key})`, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: `var(--color-${config.key})`, strokeWidth: 2 }}
              name={config.label}
            />
          );
        })}
      </LineChart>
    </ChartContainer>
  );

  // ✅ AREA CHART RENDER
  const renderAreaChart = () => (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis dataKey="periodLabel" tick={{ fontSize: 12 }} axisLine={false} />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => formatLargeNumber(value)}
          axisLine={false}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent formatter={(value: number) => formatCurrency(value)} />
          }
        />
        <Legend wrapperStyle={{ fontSize: '12px' }} iconType="circle" />

        {selectedMetrics.includes('revenue') && (
          <Area
            type="monotone"
            dataKey="revenue"
            stackId="1"
            stroke={`var(--color-revenue)`}
            fill={`var(--color-revenue)`}
            fillOpacity={0.6}
            name="💰 Omset"
          />
        )}

        {selectedMetrics.includes('cogs') && (
          <Area
            type="monotone"
            dataKey="cogs"
            stackId="1"
            stroke={`var(--color-cogs)`}
            fill={`var(--color-cogs)`}
            fillOpacity={0.6}
            name="🥘 Modal Bahan"
          />
        )}

        {selectedMetrics.includes('opex') && (
          <Area
            type="monotone"
            dataKey="opex"
            stackId="1"
            stroke={`var(--color-opex)`}
            fill={`var(--color-opex)`}
            fillOpacity={0.6}
            name="🏪 Biaya Tetap"
          />
        )}

        {selectedMetrics.includes('stockValue') && (
          <Area
            type="monotone"
            dataKey="stockValue"
            stackId="2"
            stroke={`var(--color-stockValue)`}
            fill={`var(--color-stockValue)`}
            fillOpacity={0.4}
            name="📦 Nilai Stok (WAC)"
          />
        )}
      </AreaChart>
    </ChartContainer>
  );

  // ✅ MAIN RENDER
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>📈 Grafik Perkembangan Untung Warung</CardTitle>
            <CardDescription>
              Lihat bagaimana omset dan keuntungan warung berkembang dari waktu ke waktu ({trendData.length} periode)
            </CardDescription>
          </div>
          
          {/* Controls */}
          <div className="flex space-x-2">
            <Button
              variant={viewType === 'values' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('values')}
            >
              Nilai
            </Button>
            <Button
              variant={viewType === 'margins' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('margins')}
            >
              Persen
            </Button>
          </div>
        </div>

        {/* Metric Toggles */}
        <div className="flex flex-wrap gap-1 sm:gap-2 mt-3 sm:mt-4">
          {(viewType === 'values' 
            ? ['revenue', 'grossProfit', 'netProfit', 'cogs', 'opex', 'stockValue'] 
            : ['grossMargin', 'netMargin']
          ).map(metric => {
            const config = metricConfigs[metric as keyof typeof metricConfigs];
            const isSelected = selectedMetrics.includes(metric);
            
            return (
              <Button
                key={metric}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleMetric(metric)}
                className="text-xs px-2 py-1"
                style={{
                  backgroundColor: isSelected ? config.color : undefined,
                  borderColor: config.color
                }}
              >
                {config.label}
              </Button>
            );
          })}
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Chart */}
        <div className="mb-6">
          {chartType === 'line' ? renderLineChart() : renderAreaChart()}
        </div>

        {/* Trend Analysis */}
        {trendData.length >= 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-4 border-t">
            {/* Revenue Growth */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                {trendAnalysis.revenueGrowth >= 0 ? (
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                )}
                <span className="text-xs sm:text-sm text-gray-600">📈 Pertumbuhan Omset</span>
              </div>
              <div className={`text-sm sm:text-lg font-bold ${
                trendAnalysis.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {trendAnalysis.revenueGrowth > 0 ? '+' : ''}{trendAnalysis.revenueGrowth.toFixed(1)}%
              </div>
            </div>

            {/* Profit Growth */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                {trendAnalysis.profitGrowth >= 0 ? (
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                )}
                <span className="text-xs sm:text-sm text-gray-600">💎 Pertumbuhan Untung</span>
              </div>
              <div className={`text-sm sm:text-lg font-bold ${
                trendAnalysis.profitGrowth >= 0 ? 'text-orange-600' : 'text-red-600'
              }`}>
                {trendAnalysis.profitGrowth > 0 ? '+' : ''}{trendAnalysis.profitGrowth.toFixed(1)}%
              </div>
            </div>

            {/* Best Month */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                <span className="text-xs sm:text-sm text-gray-600">🏆 Bulan Terbaik</span>
              </div>
              <div className="text-sm sm:text-lg font-bold text-orange-600">
                {trendAnalysis.bestMonth?.periodLabel || 'N/A'}
              </div>
              <div className="text-xs text-gray-500 hidden sm:block">
                {formatCurrency(trendAnalysis.bestMonth?.netProfit || 0)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfitTrendChart;