// ==============================================
// CHART RENDERERS
// ==============================================

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
}) => {
  // Enhanced color palette for better visual distinction
  const enhancedColors = {
    revenue: '#10b981', // Emerald green
    grossProfit: '#3b82f6', // Blue
    netProfit: '#8b5cf6', // Purple
    cogs: '#f59e0b', // Amber
    opex: '#ef4444', // Red
    grossMargin: '#06b6d4', // Cyan
    netMargin: '#84cc16', // Lime
    stockValue: '#f97316' // Orange
  };

  // Apply enhanced colors to metric configs
  const enhancedMetricConfigs = {
    ...metricConfigs,
    revenue: { ...metricConfigs.revenue, color: enhancedColors.revenue },
    grossProfit: { ...metricConfigs.grossProfit, color: enhancedColors.grossProfit },
    netProfit: { ...metricConfigs.netProfit, color: enhancedColors.netProfit },
    cogs: { ...metricConfigs.cogs, color: enhancedColors.cogs },
    opex: { ...metricConfigs.opex, color: enhancedColors.opex },
    grossMargin: { ...metricConfigs.grossMargin, color: enhancedColors.grossMargin },
    netMargin: { ...metricConfigs.netMargin, color: enhancedColors.netMargin },
    stockValue: { ...metricConfigs.stockValue, color: enhancedColors.stockValue }
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart 
        data={trendData} 
        margin={{ top: 30, right: 40, left: 20, bottom: 20 }}
      >
        {/* Enhanced grid with subtle styling */}
        <CartesianGrid 
          strokeDasharray="2 4" 
          stroke="#d1d5db" 
          strokeOpacity={0.4}
          horizontal={true}
          vertical={false}
          strokeWidth={0.8}
        />
        
        {/* Enhanced X-axis */}
        <XAxis 
          dataKey="periodLabel"
          tick={{ 
            fontSize: 11, 
            fill: '#6b7280',
            fontWeight: 500
          }}
          axisLine={false}
          tickLine={false}
          dy={10}
        />
        
        {/* Enhanced Y-axis */}
        <YAxis 
          tick={{ 
            fontSize: 11, 
            fill: '#6b7280',
            fontWeight: 500
          }}
          tickFormatter={(value) => viewType === 'margins' ? `${value}%` : formatLargeNumber(value)}
          axisLine={false}
          tickLine={false}
          dx={-10}
        />
        
        {/* Enhanced tooltip */}
        <Tooltip 
          trigger="hover" 
          content={(props) => <CustomTooltip {...props} viewType={viewType} />}
          cursor={{ 
            stroke: '#9ca3af', 
            strokeWidth: 2, 
            strokeDasharray: '6 6',
            strokeOpacity: 0.8
          }}
          wrapperStyle={{
            outline: 'none',
            zIndex: 1000
          }}
        />
        
        {/* Enhanced legend */}
        <Legend 
          content={(props) => (
            <div className="flex flex-wrap justify-center gap-6 mt-6 p-4 bg-gray-50 rounded-lg">
              {props.payload?.map((entry: any, index: number) => {
                const metricLabelMap = {
                  revenue: 'Omset',
                  cogs: 'Modal Bahan',
                  opex: 'Biaya Tetap',
                  grossProfit: 'Untung Kotor',
                  netProfit: 'Untung Bersih',
                  stockValue: 'Nilai Stok (WAC)',
                  grossMargin: 'Margin Kotor',
                  netMargin: 'Margin Bersih'
                };
                const dataKey = entry.dataKey as keyof typeof metricLabelMap;
                const label = metricLabelMap[dataKey] || entry.dataKey;
                return (
                  <div key={index} className="flex items-center space-x-3 px-3 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div 
                      className="w-4 h-4 rounded-full shadow-sm" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm font-semibold text-gray-800">{label}</span>
                  </div>
                );
              })}
            </div>
          )}
        />
        
        {/* Render multiple lines with enhanced styling */}
        {selectedMetrics.filter(metric => !hiddenMetrics.has(metric)).map((metric, index) => {
          const config = enhancedMetricConfigs[metric as keyof typeof enhancedMetricConfigs];
          if (!config) {
            console.warn(`Line chart: Metric config not found for: ${metric}`);
            return null;
          }
          
          const isHighlighted = hoveredMetric === metric;
          const baseOpacity = hoveredMetric ? (isHighlighted ? 1 : 0.4) : 1;
          
          // Different line styles for better distinction
          const lineStyles = [
            { strokeDasharray: 'none' }, // Solid
            { strokeDasharray: '8 4' }, // Dashed
            { strokeDasharray: '4 4' }, // Dotted
            { strokeDasharray: '12 4 4 4' }, // Dash-dot
            { strokeDasharray: '2 2' }, // Fine dotted
          ];
          
          const lineStyle = lineStyles[index % lineStyles.length];
          
          return (
            <Line
              key={metric}
              type="monotone"
              dataKey={config.key}
              stroke={config.color}
              strokeWidth={isHighlighted ? 4 : 3}
              strokeOpacity={baseOpacity}
              strokeDasharray={lineStyle.strokeDasharray}
              dot={{ 
                fill: config.color, 
                stroke: '#ffffff',
                strokeWidth: 2, 
                r: isHighlighted ? 6 : 4,
                fillOpacity: baseOpacity
              }}
              activeDot={{ 
                r: 8, 
                stroke: config.color, 
                strokeWidth: 3,
                fill: '#ffffff',
                fillOpacity: 1,
                style: {
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                }
              }}
              name={config.label}
              connectNulls={false}
            />
          );
        }).filter(Boolean)}
      </LineChart>
    </ResponsiveContainer>
  );
};

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
      
      {/* Revenue Area */}
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
      
      {/* OPEX Area */}
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
  // Transform data for candlestick visualization
  const candlestickData = trendData.map((item, index) => {
    const revenue = item.revenue || 0;
    const grossProfit = item.grossProfit || 0;
    const netProfit = item.netProfit || 0;
    const cogs = item.cogs || 0;
    
    // Create OHLC-like data from profit metrics
    const values = [revenue, grossProfit, netProfit, cogs].filter(v => v > 0);
    const open = revenue;
    const high = Math.max(...values);
    const low = Math.min(...values);
    const close = netProfit;
    
    return {
      ...item,
      open,
      high,
      low,
      close,
      isPositive: close >= open
    };
  });

  const CandlestickBar = ({ payload, x, y, width, height }: any) => {
    if (!payload) return null;
    
    const { open, high, low, close, isPositive } = payload;
    const color = isPositive ? '#10b981' : '#ef4444';
    const bodyHeight = Math.abs(close - open);
    const bodyY = Math.min(close, open);
    
    return (
      <g>
        {/* Wick line */}
        <line
          x1={x + width / 2}
          y1={high}
          x2={x + width / 2}
          y2={low}
          stroke={color}
          strokeWidth={1}
        />
        {/* Body rectangle */}
        <rect
          x={x + width * 0.2}
          y={bodyY}
          width={width * 0.6}
          height={bodyHeight || 2}
          fill={isPositive ? color : 'white'}
          stroke={color}
          strokeWidth={1}
        />
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={candlestickData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
        <Tooltip content={(props) => <CandlestickTooltip {...props} />} />
        
        {/* Render custom candlestick bars */}
        {candlestickData.map((item, index) => (
          <CandlestickBar
            key={index}
            payload={item}
            x={index * (100 / candlestickData.length)}
            y={0}
            width={100 / candlestickData.length}
            height={300}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

// ==============================================
// HEATMAP CHART RENDERER
// ==============================================

export const HeatmapChartRenderer: React.FC<BaseChartProps> = ({
  trendData
}) => {
  // Transform data for heatmap visualization
  const heatmapData = trendData.map((item, index) => {
    const metrics = ['revenue', 'grossProfit', 'netProfit', 'cogs', 'opex'];
    const values = metrics.map(metric => Number(item[metric as keyof typeof item]) || 0);
    const maxValue = Math.max(...values);
    
    return {
      ...item,
      normalizedRevenue: maxValue > 0 ? (item.revenue || 0) / maxValue : 0,
      normalizedGrossProfit: maxValue > 0 ? (item.grossProfit || 0) / maxValue : 0,
      normalizedNetProfit: maxValue > 0 ? (item.netProfit || 0) / maxValue : 0,
      normalizedCogs: maxValue > 0 ? (item.cogs || 0) / maxValue : 0,
      normalizedOpex: maxValue > 0 ? (item.opex || 0) / maxValue : 0
    };
  });

  const HeatmapCell = ({ x, y, width, height, value, metric }: any) => {
    const intensity = Math.min(value || 0, 1);
    const colors = {
      revenue: `rgba(16, 185, 129, ${intensity})`,
      grossProfit: `rgba(59, 130, 246, ${intensity})`,
      netProfit: `rgba(139, 92, 246, ${intensity})`,
      cogs: `rgba(245, 158, 11, ${intensity})`,
      opex: `rgba(239, 68, 68, ${intensity})`
    };
    
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={colors[metric as keyof typeof colors] || '#e5e7eb'}
        stroke="white"
        strokeWidth={1}
      />
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <div className="relative">
        <svg width="100%" height="100%">
          {/* Render heatmap cells */}
          {heatmapData.map((item, periodIndex) => {
            const metrics = ['normalizedRevenue', 'normalizedGrossProfit', 'normalizedNetProfit', 'normalizedCogs', 'normalizedOpex'];
            return metrics.map((metric, metricIndex) => (
              <HeatmapCell
                key={`${periodIndex}-${metricIndex}`}
                x={periodIndex * (100 / heatmapData.length)}
                y={metricIndex * (300 / metrics.length)}
                width={100 / heatmapData.length}
                height={300 / metrics.length}
                value={item[metric as keyof typeof item]}
                metric={metric.replace('normalized', '').toLowerCase()}
              />
            ));
          })}
        </svg>
        <Tooltip content={(props) => <HeatmapTooltip {...props} />} />
      </div>
    </ResponsiveContainer>
  );
};