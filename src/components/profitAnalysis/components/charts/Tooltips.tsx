// src/components/profitAnalysis/components/charts/Tooltips.tsx

import React from 'react';
import { formatCurrency } from '../../utils/profitTransformers';
import { TooltipProps } from './types';

// ==============================================
// CUSTOM TOOLTIP COMPONENT
// ==============================================

export const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label, viewType }) => {
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
    <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-xl backdrop-blur-sm">
      <div className="border-b border-gray-100 pb-2 mb-3">
        <p className="font-bold text-gray-900 text-base">{String(label)}</p>
      </div>
      <div className="space-y-2">
        {payload && payload.length > 0 && payload.map((entry: any, index: number) => {
          if (!entry || entry.value === undefined) return null;
          
          const dataKey = entry.dataKey as keyof typeof metricLabelMap;
          const label = metricLabelMap[dataKey] || entry.dataKey;
          const value = entry.value !== undefined ? entry.value : 0;
          
          return (
            <div key={index} className="flex items-center justify-between space-x-3 py-1">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full shadow-sm" 
                  style={{ backgroundColor: entry.color || '#000000' }}
                />
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </div>
              <span className="text-sm font-bold text-gray-900 min-w-0">
                {viewType === 'margins' && (dataKey === 'grossMargin' || dataKey === 'netMargin') 
                  ? `${Number(value).toFixed(1)}%`
                  : formatCurrency(Number(value))
                }
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==============================================
// CANDLESTICK TOOLTIP
// ==============================================

export const CandlestickTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
      <p className="font-semibold text-gray-800 mb-3">{String(label)}</p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Volume (Omset):</span>
          <span className="font-medium">{formatCurrency(data.volume)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Open (Gross):</span>
          <span className="font-medium">{formatCurrency(data.open)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">High:</span>
          <span className="font-medium text-green-600">{formatCurrency(data.high)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Low:</span>
          <span className="font-medium text-red-600">{formatCurrency(data.low)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Close (Net):</span>
          <span className="font-medium">{formatCurrency(data.close)}</span>
        </div>
      </div>
    </div>
  );
};

// ==============================================
// HEATMAP TOOLTIP
// ==============================================

export const HeatmapTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
      <p className="font-semibold text-gray-800 mb-3">{String(label)}</p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Intensitas Omset:</span>
          <span className="font-medium">{(data.revenueIntensity * 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Intensitas Margin:</span>
          <span className="font-medium">{(data.marginIntensity * 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Intensitas Net Margin:</span>
          <span className="font-medium">{(data.netMarginIntensity * 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Intensitas Efisiensi:</span>
          <span className="font-medium">{(data.efficiencyIntensity * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};