// components/dashboard/StatsGrid.tsx - Enhanced with Better Text Display

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  CircleDollarSign, 
  Package, 
  Calculator, 
  ChefHat, 
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { formatCurrency } from '@/utils/formatUtils';

interface TrendData {
  type: 'up' | 'down' | 'flat';
  percentage: number;
  previousValue?: number;
  period?: string;
}

interface Stats {
  revenue: number;
  orders: number;
  profit: number;
  mostUsedIngredient: {
    name: string;
    usageCount: number;
  };
  // Trend data untuk perbandingan periode
  trends?: {
    revenue?: TrendData;
    orders?: TrendData;
    profit?: TrendData;
    mostUsedIngredient?: TrendData;
  };
  // ✅ NEW: Sync status for enhanced accuracy display
  isFromProfitAnalysis?: boolean;
  profitAnalysisSync?: {
    currentPeriod: string;
    lastSynced: Date;
    grossMargin: number;
    netMargin: number;
    cogsSource: 'wac' | 'inventory' | 'estimated';
  };
}

interface Props {
  stats: Stats;
  isLoading: boolean;
}

// 📈 Trend Indicator Component
const TrendIndicator: React.FC<{
  trend?: TrendData;
  className?: string;
}> = ({ trend, className = "" }) => {
  if (!trend) return null;

  const getTrendIcon = () => {
    switch (trend.type) {
      case 'up':
        return <TrendingUp className="h-3 w-3" />;
      case 'down':
        return <TrendingDown className="h-3 w-3" />;
      case 'flat':
        return <Minus className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend.type) {
      case 'up':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'down':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'flat':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatPercentage = (percentage: number) => {
    const sign = trend.type === 'up' ? '+' : trend.type === 'down' ? '-' : '';
    return `${sign}${Math.abs(percentage).toFixed(1)}%`;
  };

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium ${getTrendColor()} ${className}`}>
      {getTrendIcon()}
      <span>{formatPercentage(trend.percentage)}</span>
    </div>
  );
};

// ✅ NEW: Sync Status Indicator Component
const SyncStatusIndicator: React.FC<{
  syncStatus: {
    isAccurate: boolean;
    source: string;
    lastUpdated?: Date;
    cogsSource?: string;
  } | null;
  className?: string;
}> = ({ syncStatus, className = "" }) => {
  if (!syncStatus) return null;

  const getStatusIcon = () => {
    if (syncStatus.isAccurate) {
      return <CheckCircle className="h-3 w-3" />;
    } else {
      return <AlertCircle className="h-3 w-3" />;
    }
  };

  const getStatusColor = () => {
    if (syncStatus.isAccurate) {
      return 'text-green-600 bg-green-50 border-green-200';
    } else {
      return 'text-amber-600 bg-amber-50 border-amber-200';
    }
  };

  const getStatusLabel = () => {
    if (syncStatus.isAccurate) {
      const cogsLabel = syncStatus.cogsSource === 'wac' ? 'WAC' : 
                       syncStatus.cogsSource === 'inventory' ? 'Inv' : 'Akurat';
      return cogsLabel;
    } else {
      return 'Est';
    }
  };

  return (
    <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${getStatusColor()} ${className}`}>
      {getStatusIcon()}
      <span>{getStatusLabel()}</span>
    </div>
  );
};

// 📊 Individual Stat Card Component  
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  shortLabel?: string; // Label pendek untuk mobile
  value: string | number;
  description?: string;
  iconColor: string;
  valueColor?: string;
  isLoading?: boolean;
  tooltip?: string;
  trend?: TrendData;
  syncStatus?: {
    isAccurate: boolean;
    source: string;
    lastUpdated?: Date;
    cogsSource?: string;
  } | null;
}> = ({ 
  icon, 
  label, 
  shortLabel,
  value, 
  description, 
  iconColor, 
  valueColor = "text-gray-900",
  isLoading = false,
  tooltip,
  trend,
  syncStatus
}) => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const cardContent = (
    <Card className="bg-white border-1.5 border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-300 cursor-pointer relative group h-full">
      <CardContent className="p-3 sm:p-4 lg:p-5 h-full">
        {/* Layout berbeda untuk mobile vs desktop */}
        <div className="h-full flex flex-col">
          {/* 🎨 Icon dan Trend - Top row */}
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="border-2 border-orange-200 p-2 sm:p-2.5 rounded-xl flex-shrink-0 group-hover:border-orange-300 group-hover:bg-orange-50 transition-all duration-300">
              <div className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColor}`}>
                {icon}
              </div>
            </div>
            
            {/* 📊 Trend and Sync Indicators */}
            <div className="flex items-center gap-1.5">
              {trend && (
                <TrendIndicator trend={trend} />
              )}
              {syncStatus && (
                <SyncStatusIndicator syncStatus={syncStatus} />
              )}
            </div>
          </div>

          {/* 🏷️ Label - Full width */}
          <div className="mb-2 sm:mb-3">
            <div className="flex items-start gap-1">
              <div className="text-xs text-gray-500 uppercase tracking-wide font-medium leading-relaxed break-words line-clamp-2">
                {shortLabel || label}
              </div>
              {tooltip && (
                <Info className="h-3 w-3 text-gray-400 group-hover:text-orange-500 transition-colors flex-shrink-0 mt-0.5" />
              )}
            </div>
          </div>
          
          {/* 💰 Value */}
          <div className="mb-2 flex-1">
            {isLoading ? (
              <div className="h-6 sm:h-7 lg:h-8 bg-gray-200 animate-pulse rounded w-full"></div>
            ) : (
              <div className="w-full">
                <p className={`text-base sm:text-lg lg:text-xl font-bold ${valueColor} break-words leading-tight`}>
                  {value}
                </p>
              </div>
            )}
          </div>
          
          {/* 📝 Description */}
          {description && (
            <div className="mt-auto">
              <p className="text-xs text-gray-500 leading-tight break-words">
                {description}
              </p>
            </div>
          )}
        </div>

        {/* Hover Accent */}
        <div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-orange-100 transition-colors duration-300 pointer-events-none"></div>
      </CardContent>

      {/* Mobile Tooltip */}
      {tooltip && isMobile && (
        <div className="absolute inset-x-0 top-full mt-2 mx-4 p-3 bg-gray-900 text-white text-sm rounded-lg border-2 border-gray-700 z-50 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-900 border-l-2 border-t-2 border-gray-700 rotate-45"></div>
          <p className="leading-relaxed">{tooltip}</p>
        </div>
      )}
    </Card>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {cardContent}
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            align="center"
            className="max-w-xs sm:max-w-sm md:max-w-md z-50 px-4 py-3 text-sm bg-gray-900 text-white rounded-lg border-2 border-gray-700"
            sideOffset={8}
            avoidCollisions={true}
            collisionPadding={16}
          >
            <div className="space-y-2">
              <p className="text-sm leading-relaxed">{tooltip}</p>
              {trend && trend.previousValue && (
                <div className="border-t border-gray-600 pt-2">
                  <p className="text-xs text-gray-300">
                    Periode sebelumnya: {
                      typeof trend.previousValue === 'number' && trend.previousValue > 1000 
                        ? formatCurrency(trend.previousValue)
                        : trend.previousValue.toLocaleString('id-ID')
                    }
                  </p>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
};

const StatsGrid: React.FC<Props> = ({ stats, isLoading }) => {
  // ✅ NEW: Extract sync information for enhanced display
  const isFromProfitAnalysis = stats.isFromProfitAnalysis;
  const syncInfo = stats.profitAnalysisSync;
  
  // 📊 Enhanced stats configuration with sync-aware labels and descriptions
  const statsConfig = [
    {
      key: 'revenue',
      icon: <CircleDollarSign className="h-full w-full" />,
      label: 'Omzet',
      shortLabel: 'Omzet',
      value: formatCurrency(stats.revenue),
      iconColor: 'text-orange-600',
      trend: stats.trends?.revenue,
      tooltip: 'Total pendapatan kotor dari semua pesanan dalam periode yang dipilih. Ini adalah jumlah sebelum dikurangi biaya operasional dan HPP (Harga Pokok Penjualan).',
      syncStatus: null // Revenue is always from orders, no sync needed
    },
    {
      key: 'orders',
      icon: <Package className="h-full w-full" />,
      label: 'Total Pesanan',
      shortLabel: 'Total Pesanan',
      value: stats.orders.toLocaleString('id-ID'),
      iconColor: 'text-orange-600',
      trend: stats.trends?.orders,
      tooltip: 'Jumlah total pesanan yang telah dibuat dalam periode yang dipilih. Setiap pesanan dihitung sebagai satu transaksi terlepas dari jumlah item di dalamnya.',
      syncStatus: null // Orders count is always from orders, no sync needed
    },
    {
      key: 'profit',
      icon: <Calculator className="h-full w-full" />,
      label: isFromProfitAnalysis ? 'Laba Bersih' : 'Estimasi Laba Bersih',
      shortLabel: isFromProfitAnalysis ? 'Laba Bersih' : 'Est. Laba Bersih',
      value: formatCurrency(stats.profit),
      description: isFromProfitAnalysis 
        ? syncInfo ? `(Margin: ${syncInfo.netMargin.toFixed(1)}%)` : '(Data Akurat)'
        : '(Estimasi 30%)',
      iconColor: isFromProfitAnalysis ? 'text-green-600' : 'text-orange-600',
      trend: stats.trends?.profit,
      tooltip: isFromProfitAnalysis 
        ? `Laba bersih berdasarkan analisis profit akurat dengan data COGS dari ${syncInfo?.cogsSource === 'wac' ? 'WAC (Weighted Average Cost)' : syncInfo?.cogsSource === 'inventory' ? 'nilai stok gudang' : 'estimasi'}. Data ini dihitung berdasarkan pendapatan dikurangi COGS dan biaya operasional.`
        : 'Perkiraan laba bersih berdasarkan asumsi margin keuntungan 30% dari omzet. Angka ini adalah estimasi dan dapat berbeda dengan laba aktual setelah dikurangi semua biaya operasional.',
      syncStatus: {
        isAccurate: isFromProfitAnalysis,
        source: isFromProfitAnalysis ? 'Analisis Profit' : 'Estimasi',
        lastUpdated: syncInfo?.lastSynced,
        cogsSource: syncInfo?.cogsSource
      }
    },
    {
      key: 'mostUsedIngredient',
      icon: <ChefHat className="h-full w-full" />,
      label: 'Bahan Paling Sering Dipakai',
      shortLabel: 'Bahan Paling Sering Dipakai',
      value: stats.mostUsedIngredient?.name || 'Belum ada data',
      description: stats.mostUsedIngredient?.usageCount 
        ? `Dipakai ${stats.mostUsedIngredient.usageCount}x` 
        : '',
      iconColor: 'text-orange-600',
      valueColor: stats.mostUsedIngredient?.name ? 'text-gray-900' : 'text-gray-500',
      trend: stats.trends?.mostUsedIngredient,
      tooltip: 'Bahan baku yang paling sering digunakan dalam resep berdasarkan jumlah pesanan yang telah dibuat. Data ini membantu untuk perencanaan stok dan identifikasi bahan baku kritis.',
      syncStatus: null // Ingredient usage is always from recipe analysis
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8">
      {statsConfig.map((stat) => (
        <StatCard
          key={stat.key}
          icon={stat.icon}
          label={stat.label}
          shortLabel={stat.shortLabel}
          value={stat.value}
          description={stat.description}
          iconColor={stat.iconColor}
          valueColor={stat.valueColor}
          isLoading={isLoading}
          tooltip={stat.tooltip}
          trend={stat.trend}
          syncStatus={stat.syncStatus}
        />
      ))}
    </div>
  );
};

export default StatsGrid;