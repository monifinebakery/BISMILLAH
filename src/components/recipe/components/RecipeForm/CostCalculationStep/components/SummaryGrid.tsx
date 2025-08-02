// src/components/recipe/components/RecipeForm/CostCalculationStep/components/SummaryGrid.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Target, BarChart3, Info } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import type { CostBreakdown, ProfitAnalysis } from '../utils/types';

interface SummaryGridProps {
  costBreakdown: CostBreakdown;
  profitAnalysis: ProfitAnalysis;
  breakEvenPoint: number;
  totalRevenue: number;
  jumlahPorsi: number;
  marginKeuntunganPersen: number;
}

interface SummaryCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  bgColor: string;
  iconColor: string;
}

const SummaryCardItem: React.FC<SummaryCardProps> = ({
  icon,
  title,
  value,
  subtitle,
  bgColor,
  iconColor,
}) => (
  <div className="bg-white rounded-lg p-4 border border-gray-200">
    <div className="flex items-center gap-2 mb-2">
      <div className={`w-8 h-8 ${bgColor} rounded-lg flex items-center justify-center`}>
        <div className={`w-4 h-4 ${iconColor}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className={`text-xs ${iconColor.replace('text-', 'text-').replace('-600', '-600')} font-medium`}>
          {title}
        </p>
        <p className="text-lg font-bold text-gray-900">
          {value}
        </p>
      </div>
    </div>
    <p className="text-xs text-gray-500">
      {subtitle}
    </p>
  </div>
);

export const SummaryGrid: React.FC<SummaryGridProps> = ({
  costBreakdown,
  profitAnalysis,
  breakEvenPoint,
  totalRevenue,
  jumlahPorsi,
  marginKeuntunganPersen,
}) => {
  const summaryItems = [
    {
      icon: <DollarSign className="w-4 h-4" />,
      title: "TOTAL INVESTASI",
      value: formatCurrency(costBreakdown.totalProductionCost),
      subtitle: `Untuk ${jumlahPorsi} porsi`,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      title: "POTENSI REVENUE",
      value: formatCurrency(totalRevenue),
      subtitle: "Jika semua terjual",
      bgColor: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      icon: <Target className="w-4 h-4" />,
      title: "TOTAL PROFIT",
      value: formatCurrency(profitAnalysis.marginAmount),
      subtitle: `${formatPercentage(marginKeuntunganPersen)} margin`,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600"
    },
    {
      icon: <BarChart3 className="w-4 h-4" />,
      title: "BREAK EVEN",
      value: `${breakEvenPoint} porsi`,
      subtitle: "Untuk balik modal",
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600"
    }
  ];

  return (
    <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Info className="h-5 w-5 text-gray-600" />
          Ringkasan Kalkulasi
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryItems.map((item, index) => (
            <SummaryCardItem
              key={index}
              icon={item.icon}
              title={item.title}
              value={item.value}
              subtitle={item.subtitle}
              bgColor={item.bgColor}
              iconColor={item.iconColor}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};