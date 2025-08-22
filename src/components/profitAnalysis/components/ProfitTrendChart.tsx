// src/components/warehouse/components/ProfitTrendChart.tsx
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, AreaChart, Area
} from 'recharts';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

import { formatCurrency, formatLargeNumber, getShortPeriodLabel } from '../utils/profitTransformers';
import { RealTimeProfitCalculation } from '../types/profitAnalysis.types';
import { CHART_CONFIG } from '../constants';
import { validateChartData, logValidationResults } from '@/utils/chartDataValidation';

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
  const sortedHistory = [...profitHistory].sort((a, b) => {
    // ✅ IMPROVED: More robust period sorting with error handling
    try {
      // Handle both monthly format (YYYY-MM) and daily format (YYYY-MM-DD)
      if (a.period.includes('-') && a.period.split('-').length === 3) {
        // Daily format - convert to date for sorting
        const dateA = new Date(a.period);
        const dateB = new Date(b.period);
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          // Fallback to string comparison if date parsing fails
          return a.period.localeCompare(b.period);
        }
        return dateA.getTime() - dateB.getTime();
      } else {
        // Monthly format - use lexicographic sorting for YYYY-MM format
        return a.period.localeCompare(b.period);
      }
    } catch (error) {
      console.warn('Period sorting error:', error);
      return a.period.localeCompare(b.period);
    }
  });
  
  return sortedHistory.map((analysis, index) => {
    const revenue = analysis.revenue_data?.total || 0;
    
    // ✅ IMPROVED: Enhanced COGS calculation with validation
    let cogs: number;
    if (typeof effectiveCogs === 'number' && effectiveCogs >= 0) {
      // Use effectiveCogs (WAC data) if available and valid
      cogs = effectiveCogs;
    } else {
      // Fallback to analysis COGS data
      cogs = analysis.cogs_data?.total || 0;
    }
    
    // ✅ ADD: Data validation to prevent logical inconsistencies
    if (cogs > revenue && revenue > 0) {
      console.warn(`Period ${analysis.period}: COGS (${cogs}) > Revenue (${revenue}) - using capped value`);
      cogs = Math.min(cogs, revenue * 0.95); // Cap COGS at 95% of revenue
    }
    
    const opex = analysis.opex_data?.total || 0;
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - opex;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    // ✅ IMPROVED: Period-specific stock value calculation
    let periodStockValue = wacStockValue || 0;
    // Note: stock_data property may not exist in current type definition
    // Using fallback to provided wacStockValue for now
    try {
      if ((analysis as any).stock_data?.wac_value) {
        // Use period-specific WAC stock value if available
        periodStockValue = (analysis as any).stock_data.wac_value;
      }
    } catch (error) {
      // Silently fall back to provided wacStockValue
    }

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
      // ✅ FIXED: Use period-specific stock value, not static value
      stockValue: periodStockValue
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
// TOOLTIP COMPONENT
// ==============================================

const CustomTooltip = ({ active, payload, label, viewType }: any) => {
  if (!active || !payload || !payload.length) return null;

  // Create a mapping from dataKey to friendly label
  const metricLabelMap = {
    revenue: 'Omset',
    grossProfit: 'Untung Kotor',
    netProfit: 'Untung Bersih',
    cogs: 'Modal Bahan',
    opex: 'Biaya Tetap',
    grossMargin: 'Margin Kotor',
    netMargin: 'Margin Bersih',
    stockValue: 'Nilai Stok (WAC)'
  };

  return (
    <div className="bg-white p-4 border border-gray-200 rounded-lg min-w-48">
      <p className="font-semibold text-gray-800 mb-3">{label}</p>
      {payload && payload.length > 0 && payload.map((entry: any, index: number) => {
        // Pastikan entry ada dan memiliki dataKey
        if (!entry || !entry.dataKey) return null;
        
        const dataKey = entry.dataKey as keyof typeof metricLabelMap;
        const label = metricLabelMap[dataKey] || entry.dataKey;
        const value = entry.value !== undefined ? entry.value : 0;
        
        return (
          <div key={index} className="flex items-center justify-between space-x-4 mb-1">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color || '#000000' }}
              />
              <span className="text-sm text-gray-600">{label}:</span>
            </div>
            <span className="text-sm font-medium">
              {viewType === 'margins' && (dataKey === 'grossMargin' || dataKey === 'netMargin')
                ? `${Number(value).toFixed(1)}%`
                : dataKey === 'stockValue'
                ? formatCurrency(Number(value))
                : viewType === 'margins' 
                ? `${Number(value).toFixed(1)}%`
                : formatCurrency(Number(value))
              }
            </span>
          </div>
        );
      })}
    </div>
  );
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

  // ✅ IMPROVED: Add memoization with proper dependencies and validation
  const trendData = useMemo(() => {
    const rawData = processTrendData(profitHistory, effectiveCogs, wacStockValue);
    
    // ✅ ADD: Comprehensive validation of chart data
    const validationResult = validateChartData(rawData, 'line', selectedMetrics);
    logValidationResults(validationResult, 'Profit Trend Chart');
    
    // Log any data quality issues
    if (!validationResult.isValid) {
      console.error('Profit Trend Chart: Data validation failed', validationResult.errors);
    }
    
    return rawData;
  }, [profitHistory, effectiveCogs, wacStockValue, selectedMetrics]);
  
  const trendAnalysis = useMemo(() => {
    return analyzeTrend(trendData);
  }, [trendData]);

  // ✅ METRIC CONFIGURATIONS - UPDATE dengan orange dominan
  const metricConfigs = {
    revenue: { key: 'revenue', label: 'Omset', color: CHART_CONFIG.colors.revenue },
    grossProfit: { key: 'grossProfit', label: 'Untung Kotor', color: CHART_CONFIG.colors.primary },
    netProfit: { key: 'netProfit', label: 'Untung Bersih', color: '#dc2626' },
    cogs: { key: 'cogs', label: 'Modal Bahan', color: CHART_CONFIG.colors.cogs },
    opex: { key: 'opex', label: 'Biaya Tetap', color: CHART_CONFIG.colors.opex },
    grossMargin: { key: 'grossMargin', label: 'Margin Kotor', color: CHART_CONFIG.colors.primary },
    netMargin: { key: 'netMargin', label: 'Margin Bersih', color: '#dc2626' },
    // ✅ TAMBAH: Entry baru untuk stockValue
    stockValue: { key: 'stockValue', label: 'Nilai Stok (WAC)', color: CHART_CONFIG.colors.warning }
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
          <CardTitle>Grafik Perkembangan Untung Warung</CardTitle>
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
          <CardTitle>Grafik Perkembangan Untung Warung</CardTitle>
          <CardDescription>
            Lihat bagaimana omset dan keuntungan warung berkembang dari waktu ke waktu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 text-lg mb-2">Belum Ada Riwayat Bulanan</div>
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
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="periodLabel"
          tick={{ fontSize: 12 }}
          axisLine={false}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => viewType === 'margins' ? `${value}%` : formatLargeNumber(value)}
          axisLine={false}
        />
        <Tooltip trigger="click" content={(props) => <CustomTooltip {...props} viewType={viewType} />} />
        <Legend 
          wrapperStyle={{ fontSize: '12px' }}
          iconType="circle"
        />
        
        {/* Render selected metrics */}
        {selectedMetrics.map(metric => {
          const config = metricConfigs[metric as keyof typeof metricConfigs];
          if (!config) return null;
          
          return (
            <Line
              key={metric}
              type="monotone"
              dataKey={config.key}
              stroke={config.color}
              strokeWidth={2}
              dot={{ fill: config.color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: config.color, strokeWidth: 2 }}
              name={config.label}
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );

  // ✅ AREA CHART RENDER
  const renderAreaChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="periodLabel"
          tick={{ fontSize: 12 }}
          axisLine={false}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => formatLargeNumber(value)}
          axisLine={false}
        />
        <Tooltip trigger="click" content={(props) => <CustomTooltip {...props} viewType={viewType} />} />
        <Legend 
          wrapperStyle={{ fontSize: '12px' }}
          iconType="circle"
        />
        
        {/* Omset Area */}
        {selectedMetrics.includes('revenue') && (
          <Area
            type="monotone"
            dataKey="revenue"
            stackId="1"
            stroke={metricConfigs.revenue.color}
            fill={metricConfigs.revenue.color}
            fillOpacity={0.6}
            name="Omset"
          />
        )}
        
        {/* COGS Area */}
        {selectedMetrics.includes('cogs') && (
          <Area
            type="monotone"
            dataKey="cogs"
            stackId="1"
            stroke={metricConfigs.cogs.color}
            fill={metricConfigs.cogs.color}
            fillOpacity={0.6}
            name="Modal Bahan"
          />
        )}
        
        {/* OPEX Area */}
        {selectedMetrics.includes('opex') && (
          <Area
            type="monotone"
            dataKey="opex"
            stackId="1"
            stroke={metricConfigs.opex.color}
            fill={metricConfigs.opex.color}
            fillOpacity={0.6}
            name="Biaya Tetap"
          />
        )}
        
        {/* Stock Value Area */}
        {selectedMetrics.includes('stockValue') && (
          <Area
            type="monotone"
            dataKey="stockValue"
            stackId="2"
            stroke={metricConfigs.stockValue.color}
            fill={metricConfigs.stockValue.color}
            fillOpacity={0.4}
            name="Nilai Stok (WAC)"
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );

  // ✅ MAIN RENDER
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Grafik Perkembangan Untung Warung</CardTitle>
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
              Margin
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
            {/* Omset Growth */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                {trendAnalysis.revenueGrowth >= 0 ? (
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                )}
                <span className="text-xs sm:text-sm text-gray-600">Pertumbuhan Omset</span>
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
                <span className="text-xs sm:text-sm text-gray-600">Pertumbuhan Untung</span>
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
                <span className="text-xs sm:text-sm text-gray-600">Bulan Terbaik</span>
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