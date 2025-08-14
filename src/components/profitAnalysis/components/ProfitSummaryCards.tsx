import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DollarSign, TrendingUp, Calculator, ShoppingCart,
  ArrowUp, ArrowDown, Minus
} from 'lucide-react';

import { formatCurrency, formatPercentage, calculateGrowth, getGrowthStatus } from '../utils/profitTransformers';
import { RealTimeProfitCalculation } from '../types/profitAnalysis.types';

// ==============================================
// TYPES
// ==============================================

interface ProfitSummaryCardsProps {
  currentAnalysis: RealTimeProfitCalculation | null;
  previousAnalysis?: RealTimeProfitCalculation | null;
  isLoading: boolean;
  className?: string;
}

interface MetricCard {
  title: string;
  value: number;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  subtitle?: string;
  change?: number;
  changeType: 'positive' | 'negative' | 'neutral';
}

// ==============================================
// PROFIT SUMMARY CARDS COMPONENT
// ==============================================

const ProfitSummaryCards: React.FC<ProfitSummaryCardsProps> = ({
  currentAnalysis,
  previousAnalysis,
  isLoading,
  className = ''
}) => {
  
  // ✅ CALCULATE METRICS
  const metrics = useMemo(() => {
    if (!currentAnalysis) {
      return {
        revenue: 0,
        cogs: 0,
        opex: 0,
        grossProfit: 0,
        netProfit: 0,
        grossMargin: 0,
        netMargin: 0
      };
    }

    const revenue = currentAnalysis.revenue_data.total;
    const cogs = currentAnalysis.cogs_data.total;
    const opex = currentAnalysis.opex_data.total;
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - opex;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return {
      revenue,
      cogs,
      opex,
      grossProfit,
      netProfit,
      grossMargin,
      netMargin
    };
  }, [currentAnalysis]);

  // ✅ CALCULATE CHANGES vs PREVIOUS PERIOD
  const changes = useMemo(() => {
    if (!previousAnalysis) {
      return {
        revenueChange: 0,
        grossProfitChange: 0,
        netProfitChange: 0,
        cogsChange: 0
      };
    }

    const prevRevenue = previousAnalysis.revenue_data.total;
    const prevGrossProfit = prevRevenue - previousAnalysis.cogs_data.total;
    const prevNetProfit = prevGrossProfit - previousAnalysis.opex_data.total;
    const prevCogs = previousAnalysis.cogs_data.total;

    return {
      revenueChange: calculateGrowth(metrics.revenue, prevRevenue),
      grossProfitChange: calculateGrowth(metrics.grossProfit, prevGrossProfit),
      netProfitChange: calculateGrowth(metrics.netProfit, prevNetProfit),
      cogsChange: calculateGrowth(metrics.cogs, prevCogs)
    };
  }, [metrics, previousAnalysis]);

  // ✅ GENERATE CARDS DATA
  const cards = useMemo((): MetricCard[] => {
    return [
      {
        title: 'Total Revenue',
        value: metrics.revenue,
        icon: DollarSign,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        change: changes.revenueChange,
        changeType: getGrowthStatus(changes.revenueChange).status
      },
      {
        title: 'Gross Profit',
        value: metrics.grossProfit,
        icon: TrendingUp,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        subtitle: `${formatPercentage(metrics.grossMargin)} margin`,
        change: changes.grossProfitChange,
        changeType: getGrowthStatus(changes.grossProfitChange).status
      },
      {
        title: 'Net Profit',
        value: metrics.netProfit,
        icon: Calculator,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        subtitle: `${formatPercentage(metrics.netMargin)} margin`,
        change: changes.netProfitChange,
        changeType: getGrowthStatus(changes.netProfitChange).status
      },
      {
        title: 'Total COGS',
        value: metrics.cogs,
        icon: ShoppingCart,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        subtitle: `${formatPercentage((metrics.cogs / metrics.revenue) * 100)} of revenue`,
        change: changes.cogsChange,
        changeType: getGrowthStatus(changes.cogsChange * -1).status // Invert for COGS (lower is better)
      }
    ];
  }, [metrics, changes]);

  // ✅ CHANGE ICON COMPONENT
  const getChangeIcon = (type: 'positive' | 'negative' | 'neutral') => {
    const iconProps = "w-4 h-4";
    
    switch (type) {
      case 'positive':
        return <ArrowUp className={`${iconProps} text-green-600`} />;
      case 'negative':
        return <ArrowDown className={`${iconProps} text-red-600`} />;
      default:
        return <Minus className={`${iconProps} text-gray-600`} />;
    }
  };

  // ✅ LOADING STATE
  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // ✅ NO DATA STATE
  if (!currentAnalysis) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="opacity-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-gray-50`}>
                  <Icon className="w-4 h-4 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-400 mb-1">
                  {formatCurrency(0)}
                </div>
                <p className="text-sm text-gray-400">No data available</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // ✅ MAIN RENDER
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {cards.map((card, index) => {
        const Icon = card.icon;
        const hasChange = card.change !== undefined && previousAnalysis;
        
        return (
          <Card key={index} className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">
                {formatCurrency(card.value)}
              </div>
              
              {/* Subtitle (margin info) */}
              {card.subtitle && (
                <p className="text-sm text-gray-600 mb-1">
                  {card.subtitle}
                </p>
              )}
              
              {/* Change indicator */}
              {hasChange && (
                <div className="flex items-center space-x-1">
                  {getChangeIcon(card.changeType)}
                  <span className={`text-sm font-medium ${
                    card.changeType === 'positive' ? 'text-green-600' : 
                    card.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {formatPercentage(Math.abs(card.change || 0))}
                  </span>
                  <span className="text-sm text-gray-500">
                    vs prev month
                  </span>
                </div>
              )}
              
              {/* No comparison data */}
              {!hasChange && previousAnalysis === undefined && (
                <p className="text-xs text-gray-400">
                  No previous data for comparison
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ProfitSummaryCards;