// src/components/financial/profit-analysis/components/CostBreakdownChart.tsx
// ✅ KOMPONEN CHART BREAKDOWN BIAYA

import React from 'react';
import { cn } from '@/lib/utils';

interface CostBreakdownChartProps {
  revenue: number;
  materialCost: number;
  laborCost: number;
  overhead: number;
  opex: number;
}

export const CostBreakdownChart: React.FC<CostBreakdownChartProps> = ({
  revenue,
  materialCost,
  laborCost,
  overhead,
  opex
}) => {
  if (revenue === 0) return null;

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);

  const formatPercentage = (amount: number) => ((amount / revenue) * 100).toFixed(1);

  const items = [
    { 
      label: 'Material', 
      amount: materialCost, 
      color: 'bg-red-500', 
      percentage: parseFloat(formatPercentage(materialCost)) 
    },
    { 
      label: 'Tenaga Kerja', 
      amount: laborCost, 
      color: 'bg-orange-500', 
      percentage: parseFloat(formatPercentage(laborCost)) 
    },
    { 
      label: 'Overhead', 
      amount: overhead, 
      color: 'bg-yellow-500', 
      percentage: parseFloat(formatPercentage(overhead)) 
    },
    { 
      label: 'OPEX', 
      amount: opex, 
      color: 'bg-purple-500', 
      percentage: parseFloat(formatPercentage(opex)) 
    },
    { 
      label: 'Laba', 
      amount: revenue - materialCost - laborCost - overhead - opex, 
      color: 'bg-green-500', 
      percentage: parseFloat(formatPercentage(revenue - materialCost - laborCost - overhead - opex)) 
    }
  ];

  return (
    <div className="space-y-4">
      <h4 className="font-medium">Breakdown Biaya</h4>
      
      {/* Waterfall Chart */}
      <div className="space-y-2">
        <div className="flex h-8 bg-gray-100 rounded overflow-hidden">
          {items.map((item, index) => (
            <div
              key={index}
              className={item.color}
              style={{ width: `${Math.max(item.percentage, 0.5)}%` }}
              title={`${item.label}: ${item.percentage.toFixed(1)}%`}
            />
          ))}
        </div>
        
        {/* Legenda */}
        <div className="grid grid-cols-2 gap-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className={cn("w-3 h-3 rounded", item.color)} />
                <span className="truncate">{item.label}</span>
              </div>
              <div className="text-right">
                <p className="font-medium">{item.percentage.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">{formatCurrency(item.amount)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Info */}
      <div className="bg-blue-50 p-3 rounded text-xs">
        <p className="font-medium text-blue-800">💡 Cara Membaca Chart:</p>
        <p className="text-blue-700 mt-1">
          Semakin besar area hijau (Laba), semakin sehat bisnis Anda. 
          Target ideal: Laba ≥ 10% dari total pendapatan.
        </p>
      </div>
    </div>
  );
};