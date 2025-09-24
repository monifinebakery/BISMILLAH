// src/components/orders/components/OrderStats.tsx - Statistics Header for Orders Page

import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  FileText,
  CircleDollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Package,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar
} from "lucide-react";
import { formatPercentage } from '@/lib/shared';import { useCurrency } from '@/contexts/CurrencyContext';
import { safeDom } from '@/utils/browserApiSafeWrappers';


interface OrderStatsData {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  todayOrders: number;
  averageOrderValue: number;
  // Trend data untuk perbandingan
  trends?: {
    totalOrders?: TrendData;
    totalRevenue?: TrendData;
    pendingOrders?: TrendData;
    completedOrders?: TrendData;
  };
}

interface TrendData {
  type: 'up' | 'down' | 'flat';
  percentage: number;
  previousValue?: number;
  period?: string;
}

interface Props {
  stats: OrderStatsData;
  isLoading: boolean;
}

// 📈 Trend Indicator Component
const TrendIndicator: React.FC<{
  trend?: TrendData;
  className?: string;
}> = ({ trend, className = "" }) => {
  if (!trend) return null;

  const getTrendIcon = () => {
  const { formatCurrency } = useCurrency();    switch (trend.type) {
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
  const { formatCurrency } = useCurrency();    switch (trend.type) {
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

  const formatTrendPercentage = (percentage: number) => {
  const { formatCurrency } = useCurrency();    const sign = trend.type === 'up' ? '+' : trend.type === 'down' ? '-' : '';
    return `${sign}${Math.abs(percentage).toFixed(1)}%`;
  };

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium ${getTrendColor()} ${className}`}>
      {getTrendIcon()}
      <span>{formatTrendPercentage(trend.percentage)}</span>
    </div>
  );
};

// 📊 Simple Stat Item Component (tanpa card)
const OrderStatItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  shortLabel?: string;
  value: string | number;
  description?: string;
  iconColor: string;
  valueColor?: string;
  isLoading?: boolean;
  tooltip?: string;
  trend?: TrendData;
}> = ({ 
  icon, 
  label, 
  shortLabel,
  value, 
  description, 
  iconColor, 
  valueColor = "text-white",
  isLoading = false,
  tooltip,
  trend
}) => {
  const [isMobile, setIsMobile] = React.useState(false);
  const [showMobileTooltip, setShowMobileTooltip] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
  const { formatCurrency } = useCurrency();      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    safeDom.addEventListener(window, 'resize', checkMobile);
    return () => safeDom.removeEventListener(window, 'resize', checkMobile);
  }, []);

  const handleMobileTooltipToggle = () => {
  const { formatCurrency } = useCurrency();    if (isMobile && tooltip) {
      setShowMobileTooltip(!showMobileTooltip);
      // Auto hide after 3 seconds
      if (!showMobileTooltip) {
        setTimeout(() => setShowMobileTooltip(false), 3000);
      }
    }
  };

  const statContent = (
    <div 
      className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 hover:bg-opacity-20 transition-all duration-200 h-full cursor-pointer"
      onClick={handleMobileTooltipToggle}
    >
      <div className="h-full flex flex-col">
        {/* 🎨 Icon dan Trend */}
        <div className="flex items-center justify-between mb-3">
          <div className="bg-white bg-opacity-20 p-2 rounded-lg flex-shrink-0">
            <div className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColor}`}>
              {icon}
            </div>
          </div>
          
          {/* 📊 Trend Indicator */}
          {trend && (
            <TrendIndicator trend={trend} />
          )}
        </div>

        {/* 🏷️ Label */}
        <div className="mb-2">
          <div className="text-xs sm:text-sm font-medium text-white text-opacity-90 uppercase tracking-wide leading-relaxed">
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{shortLabel || label}</span>
          </div>
        </div>
        
        {/* 💰 Value */}
        <div className="mb-2 flex-1">
          {isLoading ? (
            <div className="h-6 sm:h-7 lg:h-8 bg-white bg-opacity-30 animate-pulse rounded w-full"></div>
          ) : (
            <div className="w-full">
              <p className={`text-lg sm:text-xl lg:text-2xl font-bold ${valueColor} leading-tight`}>
                {value}
              </p>
            </div>
          )}
        </div>
        
        {/* 📝 Description */}
        {description && (
          <div className="mt-auto">
            <p className="text-xs text-white text-opacity-75 leading-tight">
              {description}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // Show different tooltip behavior for mobile vs desktop
  if (tooltip) {
    if (isMobile) {
      // Mobile: Return content with modal-style tooltip
      return (
        <>
          {statContent}
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
              {statContent}
            </TooltipTrigger>
            <TooltipContent 
              side="bottom" 
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

  return statContent;
};

const OrderStats: React.FC<Props> = ({ stats, isLoading }) => {
  const { formatCurrency } = useCurrency();  // 📊 Stats configuration dengan brand orange dan white text untuk header gradient
  const statsConfig = [
    {
      key: 'totalOrders',
      icon: <FileText className="h-full w-full" />,
      label: 'Total Pesanan',
      shortLabel: 'Total',
      value: isLoading ? '-' : stats.totalOrders.toLocaleString('id-ID'),
      iconColor: 'text-white',
      trend: stats.trends?.totalOrders,
      tooltip: 'Jumlah total pesanan yang telah dibuat dalam periode yang dipilih.',
      description: 'Semua pesanan'
    },
    {
      key: 'totalRevenue',
      icon: <CircleDollarSign className="h-full w-full" />,
      label: 'Total Pendapatan',
      shortLabel: 'Pendapatan',
      value: isLoading ? '-' : formatCurrency(stats.totalRevenue),
      iconColor: 'text-white',
      trend: stats.trends?.totalRevenue,
      tooltip: 'Total pendapatan dari semua pesanan dalam periode yang dipilih.',
      description: 'Revenue'
    },
    {
      key: 'pendingOrders',
      icon: <Clock className="h-full w-full" />,
      label: 'Pesanan Pending',
      shortLabel: 'Pending',
      value: isLoading ? '-' : stats.pendingOrders.toLocaleString('id-ID'),
      iconColor: 'text-white',
      trend: stats.trends?.pendingOrders,
      tooltip: 'Jumlah pesanan yang sedang menunggu konfirmasi atau proses.',
      description: 'Butuh perhatian'
    },
    {
      key: 'completedOrders',
      icon: <CheckCircle className="h-full w-full" />,
      label: 'Pesanan Selesai',
      shortLabel: 'Selesai',
      value: isLoading ? '-' : stats.completedOrders.toLocaleString('id-ID'),
      iconColor: 'text-white',
      trend: stats.trends?.completedOrders,
      tooltip: 'Jumlah pesanan yang sudah berhasil diselesaikan dan diterima pelanggan.',
      description: 'Completed'
    },
    {
      key: 'todayOrders',
      icon: <Calendar className="h-full w-full" />,
      label: 'Pesanan Hari Ini',
      shortLabel: 'Hari Ini',
      value: isLoading ? '-' : stats.todayOrders.toLocaleString('id-ID'),
      iconColor: 'text-white',
      tooltip: 'Jumlah pesanan yang dibuat pada hari ini.',
      description: 'Orders hari ini'
    },
    {
      key: 'averageOrderValue',
      icon: <Package className="h-full w-full" />,
      label: 'Rata-rata Nilai Pesanan',
      shortLabel: 'AOV',
      value: isLoading ? '-' : formatCurrency(stats.averageOrderValue),
      iconColor: 'text-white',
      tooltip: 'Nilai rata-rata per pesanan (Average Order Value).',
      description: 'Per pesanan'
    }
  ];

  return (
    <div className="mt-6 mb-6">
      {/* Stats Grid - Responsive untuk mobile, tablet, dan desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {statsConfig.map((stat) => (
          <OrderStatItem
            key={stat.key}
            icon={stat.icon}
            label={stat.label}
            shortLabel={stat.shortLabel}
            value={stat.value}
            description={stat.description}
            iconColor={stat.iconColor}
            valueColor="text-white"
            isLoading={isLoading}
            tooltip={stat.tooltip}
            trend={stat.trend}
          />
        ))}
      </div>
    </div>
  );
};

export default OrderStats;
