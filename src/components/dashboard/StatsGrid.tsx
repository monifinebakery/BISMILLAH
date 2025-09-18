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
  AlertCircle,
  AlertTriangle
} from "lucide-react";
import { formatCurrency, formatPercentage } from '@/utils/formatUtils';
import { safeDom } from '@/utils/browserApiSafeWrappers';


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

// ✅ ENHANCED: Sync Status Indicator Component with quality indicators
const SyncStatusIndicator: React.FC<{
  syncStatus: {
    isAccurate?: boolean; // ✅ FIXED: Make optional to match usage
    source: string;
    lastUpdated?: Date;
    cogsSource?: string;
    dataQuality?: 'high' | 'medium' | 'low';
  } | null;
  className?: string;
}> = ({ syncStatus, className = "" }) => {
  if (!syncStatus) return null;

  // ✅ Provide defaults for optional properties
  const isAccurate = syncStatus.isAccurate ?? false;
  const dataQuality = syncStatus.dataQuality ?? 'low';

  const getStatusIcon = () => {
    if (dataQuality === 'high') {
      return <CheckCircle className="h-3 w-3" />;
    } else if (dataQuality === 'medium') {
      return <AlertCircle className="h-3 w-3" />;
    } else {
      return <AlertTriangle className="h-3 w-3" />;
    }
  };

  const getStatusColor = () => {
    if (dataQuality === 'high') {
      return 'text-green-600 bg-green-50 border-green-200';
    } else if (dataQuality === 'medium') {
      return 'text-blue-600 bg-blue-50 border-blue-200';
    } else {
      return 'text-amber-600 bg-amber-50 border-amber-200';
    }
  };

  const getStatusLabel = () => {
    if (dataQuality === 'high') {
      const cogsLabel = syncStatus.cogsSource === 'wac' ? 'WAC' : 'Akurat';
      return cogsLabel;
    } else if (dataQuality === 'medium') {
      return 'Inv';
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
    isAccurate?: boolean; // ✅ FIXED: Make optional to match usage
    source: string;
    lastUpdated?: Date;
    cogsSource?: string;
    dataQuality?: 'high' | 'medium' | 'low'; // ✅ ADD: Support quality indicator
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
  const [showMobileTooltip, setShowMobileTooltip] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    safeDom.addEventListener(window, 'resize', checkMobile);
    return () => safeDom.removeEventListener(window, 'resize', checkMobile);
  }, []);

  const handleMobileTooltipToggle = () => {
    if (isMobile && tooltip) {
      setShowMobileTooltip(!showMobileTooltip);
      // Auto hide after 3 seconds
      if (!showMobileTooltip) {
        setTimeout(() => setShowMobileTooltip(false), 3000);
      }
    }
  };

  const cardContent = (
    <Card 
      className="bg-white/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 relative group h-full cursor-pointer"
      onClick={handleMobileTooltipToggle}
    >
      <CardContent className="card-stats h-full relative">
        {/* Inset Border Effect */}
        <div className="absolute inset-0 rounded-lg border-[1.5px] border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        
        {/* Content */}
        <div className="relative h-full flex flex-col">
          {/* 🎨 Icon dan Trend - Top row */}
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="bg-white/90 backdrop-blur-sm border border-gray-300 p-2.5 sm:p-3 rounded-xl flex-shrink-0 group-hover:border-gray-300 group-hover:bg-gray-50 transition-all duration-300 flex items-center justify-center">
              <div className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600">
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
            <div className="flex items-start gap-2">
              <div className="card-label-responsive uppercase tracking-wide font-medium leading-relaxed break-words line-clamp-2 text-gray-600">
                {shortLabel || label}
              </div>
              {tooltip && (
                <Info className="h-3 w-3 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0 mt-0.5" />
              )}
            </div>
          </div>
          
          {/* 💰 Value */}
          <div className="mb-2 flex-1">
            {isLoading ? (
              <div className="h-6 sm:h-7 lg:h-8 bg-gray-200 animate-pulse rounded w-full"></div>
            ) : (
              <div className="w-full">
                <p className={`card-value-responsive ${valueColor} text-overflow-safe leading-tight`}>
                  {value}
                </p>
              </div>
            )}
          </div>
          
          {/* 📝 Description */}
          {description && (
            <div className="mt-auto">
              <p className="card-description-responsive leading-tight break-words">
                {description}
              </p>
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  );

  // Show different tooltip behavior for mobile vs desktop
  if (tooltip) {
    if (isMobile) {
      // Mobile: Return card content with modal tooltip
      return (
        <>
          {cardContent}
          {/* Mobile Tooltip - Modal style */}
          {showMobileTooltip && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-sm" 
                onClick={() => setShowMobileTooltip(false)}
              />
              {/* Tooltip content */}
              <div className="modal-tooltip-centered z-[9999] p-4 bg-gray-900/95 backdrop-blur-md text-white text-sm rounded-xl shadow-2xl">
                <div className="text-center">
                  <p className="leading-relaxed break-words mb-3">{tooltip}</p>
                  {trend && trend.previousValue && (
                    <div className="border-t border-gray-600 pt-3 mt-3">
                      <p className="text-xs text-gray-300">
                        Periode sebelumnya: {
                          typeof trend.previousValue === 'number' && trend.previousValue > 1000 
                            ? formatCurrency(trend.previousValue)
                            : trend.previousValue.toLocaleString('id-ID')
                        }
                      </p>
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <button 
                      onClick={() => setShowMobileTooltip(false)}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      ✕ Tutup
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      );
    } else {
      // Desktop: Use Radix UI tooltip
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {cardContent}
            </TooltipTrigger>
            <TooltipContent 
              side="top" 
              align="center"
              className="max-w-xs sm:max-w-sm md:max-w-md z-[9999] px-4 py-3 text-sm bg-gray-900 text-white rounded-lg border-2 border-gray-700"
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
      iconColor: 'text-blue-600',
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
      iconColor: isFromProfitAnalysis ? 'text-green-600' : 'text-blue-600',
      trend: stats.trends?.profit,
      tooltip: isFromProfitAnalysis 
        ? `Laba bersih berdasarkan analisis profit akurat dengan data COGS dari ${syncInfo?.cogsSource === 'wac' ? 'WAC (Weighted Average Cost)' : syncInfo?.cogsSource === 'inventory' ? 'nilai stok gudang' : 'estimasi'}. Data ini dihitung berdasarkan pendapatan dikurangi COGS dan biaya operasional.`
        : 'Perkiraan laba bersih berdasarkan asumsi margin keuntungan 30% dari omzet. Angka ini adalah estimasi dan dapat berbeda dengan laba aktual setelah dikurangi semua biaya operasional.',
      syncStatus: {
        isAccurate: isFromProfitAnalysis,
        source: isFromProfitAnalysis ? 'Analisis Profit' : 'Estimasi',
        lastUpdated: syncInfo?.lastSynced,
        cogsSource: syncInfo?.cogsSource,
        // ✅ FIXED: Derive dataQuality from cogsSource since it doesn't exist on syncInfo yet
        dataQuality: syncInfo?.cogsSource === 'wac' ? 'high' as const : 
                    syncInfo?.cogsSource === 'inventory' ? 'medium' as const : 
                    'low' as const
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
    <div className="space-y-4 mb-8">
      {statsConfig.map((stat) => (
        <Card key={stat.key} className="border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
                  {stat.shortLabel || stat.label}
                </p>
                <div className="flex items-baseline gap-2 mb-1">
                  <p className={`text-2xl font-bold ${stat.valueColor}`}>
                    {isLoading ? '-' : stat.value}
                  </p>
                </div>
                {stat.description && (
                  <p className="text-xs text-gray-500">
                    {stat.description}
                  </p>
                )}
              </div>
              
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center ml-4 flex-shrink-0">
                <div className="text-orange-600 w-6 h-6 flex items-center justify-center">
                  {stat.icon}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsGrid;