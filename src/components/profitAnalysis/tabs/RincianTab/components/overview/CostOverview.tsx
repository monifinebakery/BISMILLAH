// src/components/profitAnalysis/tabs/RincianTab/components/overview/CostOverview.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
import { ProfitAnalysisResult } from '../../../types';

interface CostOverviewProps {
  profitData: ProfitAnalysisResult;
  calculations?: any;
  isMobile?: boolean;
  className?: string;
}

export const CostOverview: React.FC<CostOverviewProps> = ({
  profitData,
  calculations,
  isMobile,
  className
}) => {
  const { profitMarginData, cogsBreakdown, opexBreakdown } = profitData;

  // Safe format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Calculate percentages
  const revenue = profitMarginData.revenue || 0;
  const cogsPercentage = revenue > 0 ? (cogsBreakdown.totalCOGS / revenue) * 100 : 0;
  const opexPercentage = revenue > 0 ? (opexBreakdown.totalOPEX / revenue) * 100 : 0;
  const profitPercentage = revenue > 0 ? (profitMarginData.netProfit / revenue) * 100 : 0;

  // Get status colors
  const getStatusColor = (percentage: number, type: 'cogs' | 'opex' | 'profit') => {
    if (type === 'profit') {
      if (percentage >= 15) return 'text-green-600';
      if (percentage >= 10) return 'text-blue-600';
      if (percentage >= 5) return 'text-yellow-600';
      return 'text-red-600';
    }
    
    if (type === 'cogs') {
      if (percentage <= 60) return 'text-green-600';
      if (percentage <= 70) return 'text-yellow-600';
      return 'text-red-600';
    }
    
    // OPEX
    if (percentage <= 20) return 'text-green-600';
    if (percentage <= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBgColor = (percentage: number, type: 'cogs' | 'opex' | 'profit') => {
    if (type === 'profit') {
      if (percentage >= 15) return 'bg-green-50 border-green-200';
      if (percentage >= 10) return 'bg-blue-50 border-blue-200';
      if (percentage >= 5) return 'bg-yellow-50 border-yellow-200';
      return 'bg-red-50 border-red-200';
    }
    
    if (type === 'cogs') {
      if (percentage <= 60) return 'bg-green-50 border-green-200';
      if (percentage <= 70) return 'bg-yellow-50 border-yellow-200';
      return 'bg-red-50 border-red-200';
    }
    
    // OPEX
    if (percentage <= 20) return 'bg-green-50 border-green-200';
    if (percentage <= 30) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const metricsData = [
    {
      title: 'Total Revenue',
      value: formatCurrency(revenue),
      percentage: 100,
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200'
    },
    {
      title: 'Cost of Goods Sold (COGS)',
      value: formatCurrency(cogsBreakdown.totalCOGS),
      percentage: cogsPercentage,
      icon: TrendingDown,
      color: getStatusColor(cogsPercentage, 'cogs'),
      bgColor: getBgColor(cogsPercentage, 'cogs')
    },
    {
      title: 'Operating Expenses (OPEX)',
      value: formatCurrency(opexBreakdown.totalOPEX),
      percentage: opexPercentage,
      icon: TrendingDown,
      color: getStatusColor(opexPercentage, 'opex'),
      bgColor: getBgColor(opexPercentage, 'opex')
    },
    {
      title: 'Net Profit',
      value: formatCurrency(profitMarginData.netProfit),
      percentage: profitPercentage,
      icon: TrendingUp,
      color: getStatusColor(profitPercentage, 'profit'),
      bgColor: getBgColor(profitPercentage, 'profit')
    }
  ];

  return (
    <div className={cn("space-y-6", isMobile && "space-y-4", className)}>
      {/* Metrics Grid */}
      <div className={cn("grid grid-cols-1 gap-4", isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-4")}>
        {metricsData.map((metric, index) => (
          <Card key={index} className={cn("border-l-4", metric.bgColor)}>
            <CardContent className={cn("p-4", isMobile && "p-3")}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className={cn("text-sm font-medium text-gray-600", isMobile && "text-xs")}>
                    {metric.title}
                  </p>
                  <p className={cn("text-xl font-bold mt-1", metric.color, isMobile && "text-lg")}>
                    {metric.value}
                  </p>
                  <p className={cn("text-sm mt-1", metric.color, isMobile && "text-xs")}>
                    {metric.percentage.toFixed(1)}% dari revenue
                  </p>
                </div>
                <metric.icon className={cn("h-8 w-8", metric.color, isMobile && "h-6 w-6")} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cost Breakdown Visual */}
      <Card>
        <CardHeader className={cn("p-4", isMobile && "p-3")}>
          <CardTitle className={cn("flex items-center gap-2", isMobile && "text-base")}>
            <PieChart className={cn("h-5 w-5", isMobile && "h-4 w-4")} />
            Breakdown Struktur Biaya
          </CardTitle>
        </CardHeader>
        <CardContent className={cn("p-4", isMobile && "p-3")}>
          <div className="space-y-4">
            {/* Visual Bar */}
            <div className={cn("flex h-8 bg-gray-100 rounded-lg overflow-hidden", isMobile && "h-6")}>
              <div 
                className="bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${cogsPercentage}%` }}
                title={`COGS: ${cogsPercentage.toFixed(1)}%`}
              >
                {cogsPercentage > 15 && (isMobile ? '' : 'COGS')}
              </div>
              <div 
                className="bg-orange-500 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${opexPercentage}%` }}
                title={`OPEX: ${opexPercentage.toFixed(1)}%`}
              >
                {opexPercentage > 10 && (isMobile ? '' : 'OPEX')}
              </div>
              <div 
                className="bg-green-500 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${profitPercentage}%` }}
                title={`Profit: ${profitPercentage.toFixed(1)}%`}
              >
                {profitPercentage > 10 && (isMobile ? '' : 'Profit')}
              </div>
            </div>

            {/* Legend */}
            <div className={cn("grid grid-cols-3 gap-4", isMobile && "gap-2")}>
              <div className="flex items-center gap-2">
                <div className={cn("w-3 h-3 bg-red-500 rounded", isMobile && "w-2 h-2")} />
                <div>
                  <p className={cn("text-sm font-medium", isMobile && "text-xs")}>COGS</p>
                  <p className={cn("text-xs text-gray-500", isMobile && "text-[10px]")}>
                    {formatCurrency(cogsBreakdown.totalCOGS)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn("w-3 h-3 bg-orange-500 rounded", isMobile && "w-2 h-2")} />
                <div>
                  <p className={cn("text-sm font-medium", isMobile && "text-xs")}>OPEX</p>
                  <p className={cn("text-xs text-gray-500", isMobile && "text-[10px]")}>
                    {formatCurrency(opexBreakdown.totalOPEX)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn("w-3 h-3 bg-green-500 rounded", isMobile && "w-2 h-2")} />
                <div>
                  <p className={cn("text-sm font-medium", isMobile && "text-xs")}>Net Profit</p>
                  <p className={cn("text-xs text-gray-500", isMobile && "text-[10px]")}>
                    {formatCurrency(profitMarginData.netProfit)}
                  </p>
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className={cn("bg-blue-50 p-3 rounded border border-blue-200", isMobile && "p-2")}>
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <PieChart className={cn("h-4 w-4", isMobile && "h-3 w-3")} />
                <span className={cn("text-sm font-medium", isMobile && "text-xs")}>
                  Key Insights
                </span>
              </div>
              <div className={cn("space-y-1 text-xs text-blue-600", isMobile && "text-[10px]")}>
                <p><strong>Gross Margin:</strong> {profitMarginData.grossMargin.toFixed(1)}%</p>
                <p><strong>Net Margin:</strong> {profitMarginData.netMargin.toFixed(1)}%</p>
                <p><strong>Cost Efficiency:</strong> {(100 - cogsPercentage - opexPercentage).toFixed(1)}% profit retention</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};