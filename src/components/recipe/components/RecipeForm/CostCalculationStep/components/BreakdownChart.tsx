// src/components/recipe/components/RecipeForm/CostCalculationStep/components/BreakdownChart.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap } from 'lucide-react';
import { useResponsiveTooltip } from '../hooks/useResponsiveTooltip';
import { formatCurrency } from '../utils/formatters';
import { getCostDistribution, getDominantCostComponent } from '../utils/calculations';
import type { CostBreakdown } from '../utils/types';

interface BreakdownChartProps {
  costBreakdown: CostBreakdown;
  isUsingAutoOverhead?: boolean;
}

interface LegendItemProps {
  color: string;
  label: string;
  amount: number;
  percentage: number;
  isAutoCalculated?: boolean;
}

const LegendItem: React.FC<LegendItemProps> = ({
  color,
  label,
  amount,
  percentage,
  isAutoCalculated = false
}) => (
  <div className="flex items-center gap-2 p-2 sm:p-0">
    <div className={`w-4 h-4 ${color} rounded-full flex-shrink-0`} />
    <div className="min-w-0 flex-1">
      <p className="font-medium text-gray-900 flex items-center gap-1">
        {label}
        {isAutoCalculated && (
          <Zap className="h-3 w-3 text-green-600 flex-shrink-0" title="Auto-calculated" />
        )}
      </p>
      <p className="text-gray-600 text-xs sm:text-sm">
        {formatCurrency(amount)} 
        <span className="block sm:inline sm:ml-1">
          ({percentage}%)
        </span>
      </p>
    </div>
  </div>
);

export const BreakdownChart: React.FC<BreakdownChartProps> = ({
  costBreakdown,
  isUsingAutoOverhead = false,
}) => {
  const { isMobile } = useResponsiveTooltip();
  const costDistribution = getCostDistribution(costBreakdown);
  const dominantComponent = getDominantCostComponent(costBreakdown);

  if (costBreakdown.totalProductionCost === 0) {
    return null;
  }

  const chartItems = [
    {
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      label: 'Bahan Baku',
      amount: costBreakdown.ingredientCost,
      percentage: costDistribution.ingredientPercent,
      width: costDistribution.ingredientPercent
    },
    {
      color: 'bg-green-500', 
      hoverColor: 'hover:bg-green-600',
      label: 'Tenaga Kerja',
      amount: costBreakdown.laborCost,
      percentage: costDistribution.laborPercent,
      width: costDistribution.laborPercent
    },
    {
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600', 
      label: 'Overhead',
      amount: costBreakdown.overheadCost,
      percentage: costDistribution.overheadPercent,
      width: costDistribution.overheadPercent,
      isAutoCalculated: isUsingAutoOverhead
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Breakdown Biaya Produksi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          
          {/* Visual Cost Distribution */}
          <div className="flex h-4 sm:h-6 bg-gray-500 rounded-full overflow-hidden">
            {chartItems.map((item, index) => (
              <div
                key={index}
                className={`${item.color} transition-all duration-500 ${item.hoverColor}`}
                style={{ width: `${item.width}%` }}
                title={`${item.label}: ${formatCurrency(item.amount)}`}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
            {chartItems.map((item, index) => (
              <LegendItem
                key={index}
                color={item.color}
                label={item.label}
                amount={item.amount}
                percentage={item.percentage}
                isAutoCalculated={item.isAutoCalculated}
              />
            ))}
          </div>

          {/* Mobile-friendly summary */}
          {isMobile && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-500">
              <h4 className="font-medium text-gray-900 mb-2 text-sm">Ringkasan Biaya</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Biaya Produksi:</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(costBreakdown.totalProductionCost)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Komponen Terbesar:</span>
                  <span className="font-medium text-gray-900">
                    {dominantComponent}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};