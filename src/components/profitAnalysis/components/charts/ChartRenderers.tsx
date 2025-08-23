// src/components/profitAnalysis/components/charts/ChartRenderers.tsx

import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, AreaChart, Area
} from 'recharts';
import { formatLargeNumber } from '../../utils/profitTransformers';
import { BaseChartProps } from './types';
import { CustomTooltip, CandlestickTooltip, HeatmapTooltip } from './Tooltips';

// ==============================================
// LINE CHART RENDERER
// ==============================================

export const LineChartRenderer: React.FC<BaseChartProps> = ({
  trendData,
  selectedMetrics,
  metricConfigs,
  hiddenMetrics,
  hoveredMetric,
  viewType
}) => (
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
      {selectedMetrics.filter(metric => !hiddenMetrics.has(metric)).map(metric => {
        const config = metricConfigs[metric as keyof typeof metricConfigs];
        if (!config) {
          console.warn(`Line chart: Metric config not found for: ${metric}`);
          return null;
        }
        
        const isHighlighted = hoveredMetric === metric;
        
        return (
          <Line
            key={metric}
            type="monotone"
            dataKey={config.key}
            stroke={config.color}
            strokeWidth={isHighlighted ? 4 : 2}
            strokeOpacity={hoveredMetric && !isHighlighted ? 0.3 : 1}
            dot={{ 
              fill: config.color, 
              strokeWidth: 2, 
              r: isHighlighted ? 6 : 4 
            }}
            activeDot={{ 
              r: isHighlighted ? 8 : 6, 
              stroke: config.color, 
              strokeWidth: 2 
            }}
            name={config.label}
          />
        );
      }).filter(Boolean)}
    </LineChart>
  </ResponsiveContainer>
);

// ==============================================
// AREA CHART RENDERER
// ==============================================

export const AreaChartRenderer: React.FC<BaseChartProps> = ({
  trendData,
  selectedMetrics,
  metricConfigs,
  hiddenMetrics,
  hoveredMetric,
  viewType
}) => (
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
      {selectedMetrics.includes('revenue') && !hiddenMetrics.has('revenue') && metricConfigs.revenue && (
        <Area
          type="monotone"
          dataKey="revenue"
          stackId="1"
          stroke={metricConfigs.revenue.color}
          fill={metricConfigs.revenue.color}
          fillOpacity={hoveredMetric === 'revenue' ? 0.8 : hoveredMetric && hoveredMetric !== 'revenue' ? 0.3 : 0.6}
          strokeWidth={hoveredMetric === 'revenue' ? 3 : 2}
          name="Omset"
        />
      )}
      
      {/* COGS Area */}
      {selectedMetrics.includes('cogs') && !hiddenMetrics.has('cogs') && metricConfigs.cogs && (
        <Area
          type="monotone"
          dataKey="cogs"
          stackId="1"
          stroke={metricConfigs.cogs.color}
          fill={metricConfigs.cogs.color}
          fillOpacity={hoveredMetric === 'cogs' ? 0.8 : hoveredMetric && hoveredMetric !== 'cogs' ? 0.3 : 0.6}
          strokeWidth={hoveredMetric === 'cogs' ? 3 : 2}
          name="Modal Bahan"
        />
      )}
      
      {/* OpEx Area */}
      {selectedMetrics.includes('opex') && !hiddenMetrics.has('opex') && metricConfigs.opex && (
        <Area
          type="monotone"
          dataKey="opex"
          stackId="1"
          stroke={metricConfigs.opex.color}
          fill={metricConfigs.opex.color}
          fillOpacity={hoveredMetric === 'opex' ? 0.8 : hoveredMetric && hoveredMetric !== 'opex' ? 0.3 : 0.6}
          strokeWidth={hoveredMetric === 'opex' ? 3 : 2}
          name="Biaya Tetap"
        />
      )}
      
      {/* Gross Profit Area */}
      {selectedMetrics.includes('grossProfit') && !hiddenMetrics.has('grossProfit') && metricConfigs.grossProfit && (
        <Area
          type="monotone"
          dataKey="grossProfit"
          stackId="2"
          stroke={metricConfigs.grossProfit.color}
          fill={metricConfigs.grossProfit.color}
          fillOpacity={hoveredMetric === 'grossProfit' ? 0.9 : hoveredMetric && hoveredMetric !== 'grossProfit' ? 0.3 : 0.7}
          strokeWidth={hoveredMetric === 'grossProfit' ? 3 : 2}
          name="Untung Kotor"
        />
      )}
      
      {/* Net Profit Area */}
      {selectedMetrics.includes('netProfit') && !hiddenMetrics.has('netProfit') && metricConfigs.netProfit && (
        <Area
          type="monotone"
          dataKey="netProfit"
          stackId="2"
          stroke={metricConfigs.netProfit.color}
          fill={metricConfigs.netProfit.color}
          fillOpacity={hoveredMetric === 'netProfit' ? 0.7 : hoveredMetric && hoveredMetric !== 'netProfit' ? 0.3 : 0.5}
          strokeWidth={hoveredMetric === 'netProfit' ? 3 : 2}
          name="Untung Bersih"
        />
      )}
      
      {/* Stock Value Area */}
      {selectedMetrics.includes('stockValue') && !hiddenMetrics.has('stockValue') && metricConfigs.stockValue && (
        <Area
          type="monotone"
          dataKey="stockValue"
          stackId="2"
          stroke={metricConfigs.stockValue.color}
          fill={metricConfigs.stockValue.color}
          fillOpacity={hoveredMetric === 'stockValue' ? 0.6 : hoveredMetric && hoveredMetric !== 'stockValue' ? 0.3 : 0.4}
          strokeWidth={hoveredMetric === 'stockValue' ? 3 : 2}
          name="Nilai Stok (WAC)"
        />
      )}
    </AreaChart>
  </ResponsiveContainer>
);

// ==============================================
// CANDLESTICK CHART RENDERER
// ==============================================

export const CandlestickChartRenderer: React.FC<BaseChartProps> = ({
  trendData
}) => {
  // Transform data for candlestick representation
  const candlestickData = trendData.map((item) => ({
    period: item.periodLabel,
    open: item.grossProfit,
    high: Math.max(item.grossProfit, item.netProfit, item.revenue * 0.1),
    low: Math.min(item.grossProfit, item.netProfit, 0),
    close: item.netProfit,
    volume: item.revenue
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={candlestickData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="period"
          tick={{ fontSize: 12 }}
          axisLine={false}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickFormatter={formatLargeNumber}
          axisLine={false}
        />
        <Tooltip trigger="click" content={(props) => <CandlestickTooltip {...props} />} />
        <Legend wrapperStyle={{ fontSize: '12px' }} iconType="circle" />
        
        {/* Volume (Revenue) as base */}
        <Area
          type="monotone"
          dataKey="volume"
          stackId="1"
          stroke="#16a34a"
          fill="#16a34a"
          fillOpacity={0.1}
          name="Volume (Omset)"
        />
        
        {/* High-Low Range */}
        <Area
          type="monotone"
          dataKey="high"
          stackId="2"
          stroke="#16a34a"
          fill="#16a34a"
          fillOpacity={0.3}
          name="Range Tinggi"
        />
        
        {/* Open-Close Body */}
        <Area
          type="monotone"
          dataKey="close"
          stackId="3"
          stroke="#ea580c"
          fill="#ea580c"
          fillOpacity={0.6}
          name="Untung Bersih (Close)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// ==============================================
// HEATMAP CHART RENDERER
// ==============================================

export const HeatmapChartRenderer: React.FC<BaseChartProps> = ({
  trendData
}) => {
  // Create heatmap data matrix
  const heatmapData = trendData.map((item, index) => {
    const intensity = {
      revenue: Math.min(item.revenue / 10000000, 1), // Normalize to 0-1
      grossMargin: Math.min(item.grossMargin / 100, 1),
      netMargin: Math.min(item.netMargin / 100, 1),
      efficiency: Math.min((item.revenue - item.cogs - item.opex) / item.revenue, 1)
    };
    
    return {
      period: item.periodLabel,
      x: index,
      revenueIntensity: intensity.revenue,
      marginIntensity: intensity.grossMargin,
      netMarginIntensity: intensity.netMargin,
      efficiencyIntensity: intensity.efficiency
    };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={heatmapData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="period"
          tick={{ fontSize: 12 }}
          axisLine={false}
        />
        <YAxis hide />
        <Tooltip trigger="click" content={(props) => <HeatmapTooltip {...props} />} />
        <Legend wrapperStyle={{ fontSize: '12px' }} iconType="rect" />
        
        {/* Revenue Intensity */}
        <Area
          type="monotone"
          dataKey="revenueIntensity"
          stackId="1"
          stroke="#16a34a"
          fill="#16a34a"
          fillOpacity={0.8}
          name="Intensitas Omset"
        />
        
        {/* Margin Intensity */}
        <Area
          type="monotone"
          dataKey="marginIntensity"
          stackId="2"
          stroke="#ea580c"
          fill="#ea580c"
          fillOpacity={0.6}
          name="Intensitas Margin"
        />
        
        {/* Efficiency Intensity */}
        <Area
          type="monotone"
          dataKey="efficiencyIntensity"
          stackId="3"
          stroke="#16a34a"
          fill="#16a34a"
          fillOpacity={0.4}
          name="Intensitas Efisiensi"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};