import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Cell, PieChart, Pie
} from 'recharts';

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
}

interface ChartData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface BarChartData {
  category: string;
  Pendapatan: number;
  HPP: number;
  BiayaOps: number;
  'Laba Kotor': number;
  'Laba Bersih': number;
}

// ==============================================
// HELPER FUNCTIONS OUTSIDE COMPONENT
// ==============================================

const calculateMetrics = (revenue, cogs, opex) => {
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

const generateBarChartData = (metrics) => {
  return [
    {
      category: 'Breakdown Keuangan',
      Pendapatan: metrics.revenue,
      HPP: metrics.cogs,
      BiayaOps: metrics.opex,
      'Laba Kotor': metrics.grossProfit,
      'Laba Bersih': metrics.netProfit
    }
  ];
};

const generatePieChartData = (metrics) => {
  const totalRevenue = metrics.revenue;
  
  if (totalRevenue === 0) {
    return [];
  }

  const data = [
    {
      name: 'Laba Bersih',
      value: metrics.netProfit,
      percentage: (metrics.netProfit / totalRevenue) * 100,
      color: CHART_CONFIG.colors.net_profit
    },
    {
      name: 'HPP',
      value: metrics.cogs,
      percentage: (metrics.cogs / totalRevenue) * 100,
      color: CHART_CONFIG.colors.cogs
    },
    {
      name: 'Biaya Operasional',
      value: metrics.opex,
      percentage: (metrics.opex / totalRevenue) * 100,
      color: CHART_CONFIG.colors.opex
    }
  ];

  return data.filter(item => item.value > 0);
};

const calculateSummaryStats = (metrics) => {
  const grossMargin = metrics.revenue > 0 ? (metrics.grossProfit / metrics.revenue) * 100 : 0;
  const netMargin = metrics.revenue > 0 ? (metrics.netProfit / metrics.revenue) * 100 : 0;
  const cogsRatio = metrics.revenue > 0 ? (metrics.cogs / metrics.revenue) * 100 : 0;
  const opexRatio = metrics.revenue > 0 ? (metrics.opex / metrics.revenue) * 100 : 0;

  return { grossMargin, netMargin, cogsRatio, opexRatio };
};

// ==============================================
// TOOLTIP COMPONENTS
// ==============================================

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
      <p className="font-semibold text-gray-800 mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center space-x-2 mb-1">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-600">{entry.dataKey}:</span>
          <span className="text-sm font-medium">
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  
  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
      <p className="font-semibold text-gray-800">{data.name}</p>
      <p className="text-sm text-gray-600">
        {formatCurrency(data.value)} ({data.percentage.toFixed(1)}%)
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
  className = ''
}) => {

  // ✅ NO useMemo - Calculate directly on each render
  const revenue = currentAnalysis?.revenue_data?.total ?? 0;
  const cogs = currentAnalysis?.cogs_data?.total ?? 0;
  const opex = currentAnalysis?.opex_data?.total ?? 0;

  // Calculate all metrics directly
  const metrics = calculateMetrics(revenue, cogs, opex);
  const barChartData = generateBarChartData(metrics);
  const pieChartData = generatePieChartData(metrics);
  const summaryStats = calculateSummaryStats(metrics);

  // ✅ PIE LABEL FUNCTION
  const renderPieLabel = (entry) => {
    return `${entry.name}: ${entry.percentage.toFixed(1)}%`;
  };

  // ✅ LOADING STATE
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Breakdown Profit</CardTitle>
          <CardDescription>
            Breakdown keuangan menampilkan pendapatan, biaya, dan margin profit
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
          <CardTitle>Breakdown Profit</CardTitle>
          <CardDescription>
            Breakdown keuangan menampilkan pendapatan, biaya, dan margin profit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-400 text-lg mb-2">Data Tidak Tersedia</div>
              <div className="text-gray-500 text-sm">
                Pilih periode yang memiliki data keuangan untuk melihat breakdown
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ✅ BAR CHART RENDER
  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={350}>
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
        <Tooltip content={<CustomBarTooltip />} />
        <Legend 
          wrapperStyle={{ fontSize: '12px' }}
          iconType="circle"
        />
        
        {/* Bar Pendapatan */}
        <Bar 
          dataKey="Pendapatan" 
          fill={CHART_CONFIG.colors.revenue}
          radius={[2, 2, 0, 0]}
        />
        
        {/* Bar HPP */}
        <Bar 
          dataKey="HPP" 
          fill={CHART_CONFIG.colors.cogs}
          radius={[2, 2, 0, 0]}
        />
        
        {/* Bar Biaya Ops */}
        <Bar 
          dataKey="BiayaOps" 
          fill={CHART_CONFIG.colors.opex}
          radius={[2, 2, 0, 0]}
        />
        
        {/* Bar Laba Kotor */}
        <Bar 
          dataKey="Laba Kotor" 
          fill={CHART_CONFIG.colors.gross_profit}
          radius={[2, 2, 0, 0]}
        />
        
        {/* Bar Laba Bersih */}
        <Bar 
          dataKey="Laba Bersih" 
          fill={CHART_CONFIG.colors.net_profit}
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  // ✅ PIE CHART RENDER
  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={350}>
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
        <Tooltip content={<CustomPieTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );

  // ✅ MAIN RENDER
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Breakdown Profit</CardTitle>
            <CardDescription>
              {chartType === 'bar' 
                ? 'Breakdown keuangan menampilkan pendapatan, biaya, dan margin profit'
                : 'Alokasi pendapatan antara biaya dan profit'
              }
            </CardDescription>
          </div>
          
          {/* Quick Stats */}
          <div className="text-right">
            <div className="text-sm text-gray-600">Margin Kotor</div>
            <div className="text-lg font-bold text-blue-600">
              {summaryStats.grossMargin.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 mt-1">Margin Bersih</div>
            <div className="text-lg font-bold text-purple-600">
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-4 border-t">
          <div className="text-center">
            <div className="text-sm text-gray-600">Pendapatan</div>
            <div className="text-lg font-bold text-green-600">
              {formatCurrency(metrics.revenue)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-600">HPP</div>
            <div className="text-lg font-bold text-amber-600">
              {formatCurrency(metrics.cogs)}
            </div>
            <div className="text-xs text-gray-500">
              {summaryStats.cogsRatio.toFixed(1)}% dari pendapatan
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-600">Biaya Ops</div>
            <div className="text-lg font-bold text-red-600">
              {formatCurrency(metrics.opex)}
            </div>
            <div className="text-xs text-gray-500">
              {summaryStats.opexRatio.toFixed(1)}% dari pendapatan
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm text-gray-600">Laba Bersih</div>
            <div className={`text-lg font-bold ${
              metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(metrics.netProfit)}
            </div>
            <div className="text-xs text-gray-500">
              {summaryStats.netMargin.toFixed(1)}% margin
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfitBreakdownChart;