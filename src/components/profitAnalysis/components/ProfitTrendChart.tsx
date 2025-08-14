import React, { useState } from 'react';
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

// ==============================================
// TYPES
// ==============================================

export interface ProfitTrendChartProps {
  profitHistory: RealTimeProfitCalculation[];
  isLoading: boolean;
  chartType?: 'line' | 'area';
  showMetrics?: ('revenue' | 'grossProfit' | 'netProfit' | 'margins')[];
  className?: string;
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
}

// ==============================================
// HELPER FUNCTIONS OUTSIDE COMPONENT
// ==============================================

const processTrendData = (profitHistory) => {
  if (!profitHistory || profitHistory.length === 0) return [];

  // Create copy of array to avoid mutation
  const sortedHistory = [...profitHistory].sort((a, b) => a.period.localeCompare(b.period));
  
  return sortedHistory.map(analysis => {
    const revenue = analysis.revenue_data?.total || 0;
    const cogs = analysis.cogs_data?.total || 0;
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
      netMargin
    };
  });
};

const analyzeTrend = (trendData) => {
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

const CustomTooltip = ({ active, payload, label, viewType }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg min-w-48">
      <p className="font-semibold text-gray-800 mb-3">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center justify-between space-x-4 mb-1">
          <div className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600">{entry.dataKey}:</span>
          </div>
          <span className="text-sm font-medium">
            {viewType === 'margins' && entry.dataKey.includes('Margin')
              ? `${entry.value.toFixed(1)}%`
              : formatCurrency(entry.value)
            }
          </span>
        </div>
      ))}
    </div>
  );
};

// ==============================================
// MAIN COMPONENT
// ==============================================

const ProfitTrendChart = ({
  profitHistory,
  isLoading,
  chartType = 'line',
  showMetrics = ['revenue', 'grossProfit', 'netProfit'],
  className = ''
}) => {
  
  const [selectedMetrics, setSelectedMetrics] = useState(['revenue', 'grossProfit', 'netProfit']);
  const [viewType, setViewType] = useState('values');

  // ✅ NO useMemo - Calculate directly on each render
  const trendData = processTrendData(profitHistory);
  const trendAnalysis = analyzeTrend(trendData);

  // ✅ METRIC CONFIGURATIONS
  const metricConfigs = {
    revenue: { key: 'revenue', label: 'Pendapatan', color: CHART_CONFIG.colors.revenue },
    grossProfit: { key: 'grossProfit', label: 'Laba Kotor', color: CHART_CONFIG.colors.gross_profit },
    netProfit: { key: 'netProfit', label: 'Laba Bersih', color: CHART_CONFIG.colors.net_profit },
    cogs: { key: 'cogs', label: 'HPP', color: CHART_CONFIG.colors.cogs },
    opex: { key: 'opex', label: 'Biaya Ops', color: CHART_CONFIG.colors.opex },
    grossMargin: { key: 'grossMargin', label: 'Margin Kotor', color: CHART_CONFIG.colors.gross_profit },
    netMargin: { key: 'netMargin', label: 'Margin Bersih', color: CHART_CONFIG.colors.net_profit }
  };

  // ✅ EVENT HANDLERS
  const toggleMetric = (metric) => {
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
          <CardTitle>Tren Profit</CardTitle>
          <CardDescription>
            Performa historis profit dan tren dari waktu ke waktu
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
          <CardTitle>Tren Profit</CardTitle>
          <CardDescription>
            Performa historis profit dan tren dari waktu ke waktu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 text-lg mb-2">Tidak Ada Data Historis</div>
              <div className="text-gray-500 text-sm">
                Tren profit akan muncul setelah Anda memiliki data dari beberapa periode
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ✅ LINE CHART RENDER
  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={350}>
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
        <Tooltip content={(props) => <CustomTooltip {...props} viewType={viewType} />} />
        <Legend 
          wrapperStyle={{ fontSize: '12px' }}
          iconType="circle"
        />
        
        {/* Render selected metrics */}
        {selectedMetrics.map(metric => {
          const config = metricConfigs[metric];
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
    <ResponsiveContainer width="100%" height={350}>
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
        <Tooltip content={(props) => <CustomTooltip {...props} viewType={viewType} />} />
        <Legend 
          wrapperStyle={{ fontSize: '12px' }}
          iconType="circle"
        />
        
        {/* Revenue Area */}
        {selectedMetrics.includes('revenue') && (
          <Area
            type="monotone"
            dataKey="revenue"
            stackId="1"
            stroke={metricConfigs.revenue.color}
            fill={metricConfigs.revenue.color}
            fillOpacity={0.6}
            name="Pendapatan"
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
            name="HPP"
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
            name="Biaya Ops"
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
            <CardTitle>Tren Profit</CardTitle>
            <CardDescription>
              Performa historis profit dan tren dari waktu ke waktu ({trendData.length} periode)
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
        <div className="flex flex-wrap gap-2 mt-4">
          {(viewType === 'values' 
            ? ['revenue', 'grossProfit', 'netProfit', 'cogs', 'opex'] 
            : ['grossMargin', 'netMargin']
          ).map(metric => {
            const config = metricConfigs[metric];
            const isSelected = selectedMetrics.includes(metric);
            
            return (
              <Button
                key={metric}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleMetric(metric)}
                className="text-xs"
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            {/* Revenue Growth */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                {trendAnalysis.revenueGrowth >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm text-gray-600">Pertumbuhan Pendapatan</span>
              </div>
              <div className={`text-lg font-bold ${
                trendAnalysis.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {trendAnalysis.revenueGrowth > 0 ? '+' : ''}{trendAnalysis.revenueGrowth.toFixed(1)}%
              </div>
            </div>

            {/* Profit Growth */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                {trendAnalysis.profitGrowth >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm text-gray-600">Pertumbuhan Profit</span>
              </div>
              <div className={`text-lg font-bold ${
                trendAnalysis.profitGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {trendAnalysis.profitGrowth > 0 ? '+' : ''}{trendAnalysis.profitGrowth.toFixed(1)}%
              </div>
            </div>

            {/* Best Month */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">Bulan Terbaik</span>
              </div>
              <div className="text-lg font-bold text-blue-600">
                {trendAnalysis.bestMonth?.periodLabel || 'N/A'}
              </div>
              <div className="text-xs text-gray-500">
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