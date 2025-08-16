// src/components/warehouse/components/ProfitSummaryCards.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DollarSign, TrendingUp, Calculator, ShoppingCart,
  ArrowUp, ArrowDown, Minus, Package, Info, AlertTriangle, HelpCircle
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  /** ⬇️ WAC-aware COGS dari useProfitAnalysis */
  effectiveCogs?: number;
  /** ⬇️ Nilai stok WAC dari warehouse */
  wacStockValue?: number;
  /** ⬇️ label/tooltip WAC */
  labels?: { hppLabel: string; hppHint: string };
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
  helpText?: string; // 🍽️ Penjelasan dalam bahasa sederhana
  alert?: string;    // 🚨 Alert khusus untuk F&B
}

// ==============================================
// HELPER FUNCTIONS OUTSIDE COMPONENT
// ==============================================

const calculateMetrics = (currentAnalysis: RealTimeProfitCalculation | null, effectiveCogs?: number) => {
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

  const revenue = currentAnalysis.revenue_data?.total ?? 0;
  // ✅ UPDATE: Gunakan effectiveCogs kalau ada
  const cogs = (typeof effectiveCogs === 'number' ? effectiveCogs : currentAnalysis.cogs_data?.total) ?? 0;
  const opex = currentAnalysis.opex_data?.total ?? 0;
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
};

const calculateChanges = (
  metrics: ReturnType<typeof calculateMetrics>, 
  previousAnalysis: RealTimeProfitCalculation | undefined,
  effectiveCogs?: number
) => {
  if (!previousAnalysis) {
    return {
      revenueChange: 0,
      grossProfitChange: 0,
      netProfitChange: 0,
      cogsChange: 0
    };
  }

  const prevRevenue = previousAnalysis.revenue_data?.total ?? 0;
  // ✅ UPDATE: Gunakan effectiveCogs kalau ada
  const prevCogs = (typeof effectiveCogs === 'number' ? effectiveCogs : previousAnalysis.cogs_data?.total) ?? 0;
  const prevOpex = previousAnalysis.opex_data?.total ?? 0;
  const prevGrossProfit = prevRevenue - prevCogs;
  const prevNetProfit = prevGrossProfit - prevOpex;

  return {
    revenueChange: calculateGrowth(metrics.revenue, prevRevenue),
    grossProfitChange: calculateGrowth(metrics.grossProfit, prevGrossProfit),
    netProfitChange: calculateGrowth(metrics.netProfit, prevNetProfit),
    cogsChange: calculateGrowth(metrics.cogs, prevCogs)
  };
};

// 🍽️ Helper untuk emoji kategori F&B
const getFoodCategoryEmoji = (percentage: number) => {
  if (percentage > 60) return '🔴'; // Alert - terlalu tinggi
  if (percentage > 40) return '🟡'; // Warning - perlu perhatian  
  return '🟢'; // Good - sehat
};

const generateCards = (
  metrics: ReturnType<typeof calculateMetrics>, 
  changes: ReturnType<typeof calculateChanges>,
  wacStockValue?: number,
  labels?: { hppLabel: string; hppHint: string }
) => {
  const cogsPercentage = (metrics.cogs / Math.max(metrics.revenue, 1)) * 100;
  const opexPercentage = (metrics.opex / Math.max(metrics.revenue, 1)) * 100;
  
  const cards = [
    {
      title: '💰 Penjualan Bulan Ini',
      value: metrics.revenue,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      subtitle: 'Total omset dari semua penjualan',
      change: changes.revenueChange,
      changeType: getGrowthStatus(changes.revenueChange).status,
      helpText: 'Semua uang yang masuk dari jualan makanan & minuman'
    },
    {
      title: '📈 Untung Kotor',
      value: metrics.grossProfit,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      subtitle: `${formatPercentage(metrics.grossMargin)} dari penjualan`,
      change: changes.grossProfitChange,
      changeType: getGrowthStatus(changes.grossProfitChange).status,
      helpText: 'Untung sebelum dipotong biaya operasional (listrik, sewa, gaji)'
    },
    {
      title: '💵 Untung Bersih (Take Home)',
      value: metrics.netProfit,
      icon: Calculator,
      color: metrics.netProfit >= 0 ? 'text-orange-700' : 'text-red-600',
      bgColor: metrics.netProfit >= 0 ? 'bg-orange-50' : 'bg-red-50',
      subtitle: `${formatPercentage(metrics.netMargin)} margin akhir`,
      change: changes.netProfitChange,
      changeType: getGrowthStatus(changes.netProfitChange).status,
      helpText: 'Untung beneran yang bisa dibawa pulang setelah semua biaya'
    },
    {
      title: `🛒 Modal Bahan Baku ${getFoodCategoryEmoji(cogsPercentage)}`,
      value: metrics.cogs,
      icon: ShoppingCart,
      color: cogsPercentage > 60 ? 'text-red-600' : cogsPercentage > 40 ? 'text-orange-600' : 'text-green-600',
      bgColor: cogsPercentage > 60 ? 'bg-red-50' : cogsPercentage > 40 ? 'bg-orange-50' : 'bg-green-50',
      subtitle: `${formatPercentage(cogsPercentage)} dari penjualan`,
      change: changes.cogsChange,
      changeType: getGrowthStatus(changes.cogsChange * -1).status,
      helpText: 'Uang yang keluar untuk beli bahan makanan & minuman',
      alert: cogsPercentage > 60 ? 'Modal bahan terlalu tinggi! Cari supplier lebih murah atau naikin harga jual' : 
             cogsPercentage > 40 ? 'Modal bahan agak tinggi, perlu diperhatikan' : 'Modal bahan sehat'
    }
  ];

  // ✅ TAMBAH: Card baru untuk Nilai Stok WAC
  if (typeof wacStockValue === 'number' && wacStockValue > 0) {
    cards.splice(3, 0, {
      title: 'Nilai Stok Bahan Baku',
      value: wacStockValue,
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      subtitle: labels?.hppLabel ? `${labels.hppLabel} aktif` : 'Harga rata-rata',
      change: undefined,
      changeType: 'neutral'
    });
  }

  return cards;
};

// ==============================================
// CHANGE ICON COMPONENT
// ==============================================

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

// ==============================================
// MAIN COMPONENT
// ==============================================

const ProfitSummaryCards: React.FC<ProfitSummaryCardsProps> = ({
  currentAnalysis,
  previousAnalysis,
  isLoading,
  className = '',
  effectiveCogs,
  wacStockValue,
  labels
}) => {
  
  // ✅ NO useMemo - Extract primitive values directly
  const currentRevenue = currentAnalysis?.revenue_data?.total ?? 0;
  const currentCogs = (typeof effectiveCogs === 'number' ? effectiveCogs : currentAnalysis?.cogs_data?.total) ?? 0;
  const currentOpex = currentAnalysis?.opex_data?.total ?? 0;
  
  const prevRevenue = previousAnalysis?.revenue_data?.total ?? 0;
  const prevCogs = (typeof effectiveCogs === 'number' ? effectiveCogs : previousAnalysis?.cogs_data?.total) ?? 0;
  const prevOpex = previousAnalysis?.opex_data?.total ?? 0;

  // ✅ NO useMemo - Calculate directly
  const metrics = calculateMetrics(currentAnalysis, effectiveCogs);
  const changes = calculateChanges(metrics, previousAnalysis, effectiveCogs);
  const cards = generateCards(metrics, changes, wacStockValue, labels);

  // ✅ LOADING STATE
  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 ${className}`}>
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
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 ${className}`}>
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

  // ✅ MAIN RENDER
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 ${className}`}>
      {cards.map((card, index) => {
        const Icon = card.icon;
        const hasChange = card.change !== undefined && previousAnalysis;
        
        return (
          <Card key={index} className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                {card.title}
                {/* ✅ TAMBAH: Tooltip untuk semua cards dengan helpText */}
                {(card as any).helpText && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3 h-3 text-blue-400 ml-1 cursor-help hover:text-blue-600" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-sm">
                        <p>{(card as any).helpText}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {/* ✅ TAMBAH: Tooltip untuk WAC stock value */}
                {card.title === 'Nilai Stok Bahan Baku' && labels?.hppLabel && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-gray-400 ml-1 inline cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs text-sm">
                        <p>
                          Nilai stok dihitung dari stok × harga beli rata-rata (Weighted Average Cost),
                          yaitu rata-rata harga pembelian terakhir yang sudah termasuk semua pembelian sebelumnya.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="text-lg sm:text-2xl font-bold mb-1">
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
                    vs bulan lalu
                  </span>
                </div>
              )}
              
              {/* ✅ TAMBAH: Alert khusus F&B */}
              {(card as any).alert && (
                <div className="flex items-start space-x-2 mt-2 p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-yellow-800">
                    {(card as any).alert}
                  </p>
                </div>
              )}
              
              {/* No comparison data */}
              {!hasChange && previousAnalysis === undefined && !(card as any).alert && (
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