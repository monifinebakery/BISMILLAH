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

export interface ProfitSummaryCardsProps {
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
// KARTU RINGKASAN PROFIT COMPONENT
// ==============================================

const ProfitSummaryCards: React.FC<ProfitSummaryCardsProps> = ({
  currentAnalysis,
  previousAnalysis,
  isLoading,
  className = ''
}) => {
  
  // ✅ FIX: Extract primitive values to avoid nested object access in dependencies
  const currentRevenue = currentAnalysis?.revenue_data?.total ?? 0;
  const currentCogs = currentAnalysis?.cogs_data?.total ?? 0;
  const currentOpex = currentAnalysis?.opex_data?.total ?? 0;
  
  const prevRevenue = previousAnalysis?.revenue_data?.total ?? 0;
  const prevCogs = previousAnalysis?.cogs_data?.total ?? 0;
  const prevOpex = previousAnalysis?.opex_data?.total ?? 0;

  // ✅ HITUNG METRIK - Fixed dependencies
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

    const grossProfit = currentRevenue - currentCogs;
    const netProfit = grossProfit - currentOpex;
    const grossMargin = currentRevenue > 0 ? (grossProfit / currentRevenue) * 100 : 0;
    const netMargin = currentRevenue > 0 ? (netProfit / currentRevenue) * 100 : 0;

    return {
      revenue: currentRevenue,
      cogs: currentCogs,
      opex: currentOpex,
      grossProfit,
      netProfit,
      grossMargin,
      netMargin
    };
  }, [currentRevenue, currentCogs, currentOpex, currentAnalysis]); // ✅ Use primitive values

  // ✅ HITUNG PERUBAHAN vs PERIODE SEBELUMNYA - Fixed dependencies  
  const changes = useMemo(() => {
    if (!previousAnalysis) {
      return {
        revenueChange: 0,
        grossProfitChange: 0,
        netProfitChange: 0,
        cogsChange: 0
      };
    }

    const prevGrossProfit = prevRevenue - prevCogs;
    const prevNetProfit = prevGrossProfit - prevOpex;

    return {
      revenueChange: calculateGrowth(metrics.revenue, prevRevenue),
      grossProfitChange: calculateGrowth(metrics.grossProfit, prevGrossProfit),
      netProfitChange: calculateGrowth(metrics.netProfit, prevNetProfit),
      cogsChange: calculateGrowth(metrics.cogs, prevCogs)
    };
  }, [
    metrics.revenue,
    metrics.grossProfit,
    metrics.netProfit,
    metrics.cogs,
    prevRevenue,
    prevCogs,
    prevOpex,
    previousAnalysis
  ]); // ✅ Use primitive values

  // ✅ GENERATE DATA KARTU
  const cards = useMemo((): MetricCard[] => {
    return [
      {
        title: 'Total Pendapatan',
        value: metrics.revenue,
        icon: DollarSign,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        change: changes.revenueChange,
        changeType: getGrowthStatus(changes.revenueChange).status
      },
      {
        title: 'Laba Kotor',
        value: metrics.grossProfit,
        icon: TrendingUp,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        subtitle: `${formatPercentage(metrics.grossMargin)} margin`,
        change: changes.grossProfitChange,
        changeType: getGrowthStatus(changes.grossProfitChange).status
      },
      {
        title: 'Laba Bersih',
        value: metrics.netProfit,
        icon: Calculator,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        subtitle: `${formatPercentage(metrics.netMargin)} margin`,
        change: changes.netProfitChange,
        changeType: getGrowthStatus(changes.netProfitChange).status
      },
      {
        title: 'Total HPP',
        value: metrics.cogs,
        icon: ShoppingCart,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        subtitle: `${formatPercentage((metrics.cogs / metrics.revenue) * 100)} dari pendapatan`,
        change: changes.cogsChange,
        changeType: getGrowthStatus(changes.cogsChange * -1).status // Invert untuk HPP (lebih rendah = lebih baik)
      }
    ];
  }, [metrics, changes]);

  // ✅ KOMPONEN IKON PERUBAHAN
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

  // ✅ STATUS LOADING
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

  // ✅ STATUS TIDAK ADA DATA
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
                <p className="text-sm text-gray-400">Data tidak tersedia</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  // ✅ RENDER UTAMA
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
              
              {/* Subtitle (info margin) */}
              {card.subtitle && (
                <p className="text-sm text-gray-600 mb-1">
                  {card.subtitle}
                </p>
              )}
              
              {/* Indikator perubahan */}
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
                    vs bulan lalu
                  </span>
                </div>
              )}
              
              {/* Tidak ada data perbandingan */}
              {!hasChange && previousAnalysis === undefined && (
                <p className="text-xs text-gray-400">
                  Tidak ada data sebelumnya untuk perbandingan
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