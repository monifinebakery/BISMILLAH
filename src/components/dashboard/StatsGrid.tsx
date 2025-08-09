/ components/dashboard/StatsGrid.tsx - Enhanced with Outline Design

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CircleDollarSign, Package, Calculator, ChefHat, Info } from "lucide-react";
import { formatCurrency } from '@/utils/formatUtils';

interface Stats {
  revenue: number;
  orders: number;
  profit: number;
  mostUsedIngredient: {
    name: string;
    usageCount: number;
  };
}

interface Props {
  stats: Stats;
  isLoading: boolean;
}

// 📊 Individual Stat Card Component  
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  description?: string;
  iconColor: string;
  valueColor?: string;
  isLoading?: boolean;
  tooltip?: string;
}> = ({ 
  icon, 
  label, 
  value, 
  description, 
  iconColor, 
  valueColor = "text-gray-900",
  isLoading = false,
  tooltip
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
    <Card className="bg-white border-2 border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-300 cursor-pointer relative group">
      <CardContent className="p-4 sm:p-6 flex items-center">
        {/* 🎨 Icon with Outline Design */}
        <div className="border-2 border-orange-200 p-3 rounded-xl mr-4 flex-shrink-0 group-hover:border-orange-300 group-hover:bg-orange-50 transition-all duration-300">
          <div className={`h-5 w-5 sm:h-6 sm:w-6 ${iconColor}`}>
            {icon}
          </div>
        </div>
        
        {/* 📈 Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium truncate">
              {label}
            </p>
            {tooltip && (
              <Info className="h-3 w-3 text-gray-400 group-hover:text-orange-500 transition-colors" />
            )}
          </div>
          
          {isLoading ? (
            <div className="h-5 sm:h-6 bg-gray-200 animate-pulse rounded mt-1"></div>
          ) : (
            <p className={`text-lg sm:text-xl font-bold ${valueColor} truncate`}>
              {value}
            </p>
          )}
          
          {description && (
            <p className="text-xs text-gray-500 mt-1 truncate">
              {description}
            </p>
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
            <p className="text-sm leading-relaxed">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return cardContent;
};

const StatsGrid: React.FC<Props> = ({ stats, isLoading }) => {
  // 📊 Stats configuration
  const statsConfig = [
    {
      key: 'revenue',
      icon: <CircleDollarSign className="h-6 w-6" />,
      label: 'Omzet (Pendapatan Kotor)',
      value: formatCurrency(stats.revenue),
      iconColor: 'text-orange-600',
      tooltip: 'Total pendapatan kotor dari semua pesanan dalam periode yang dipilih. Ini adalah jumlah sebelum dikurangi biaya operasional dan HPP (Harga Pokok Penjualan).'
    },
    {
      key: 'orders',
      icon: <Package className="h-6 w-6" />,
      label: 'Total Pesanan',
      value: stats.orders.toLocaleString('id-ID'),
      iconColor: 'text-orange-600',
      tooltip: 'Jumlah total pesanan yang telah dibuat dalam periode yang dipilih. Setiap pesanan dihitung sebagai satu transaksi terlepas dari jumlah item di dalamnya.'
    },
    {
      key: 'profit',
      icon: <Calculator className="h-6 w-6" />,
      label: 'Estimasi Laba Bersih',
      value: formatCurrency(stats.profit),
      description: '(Estimasi 30%)',
      iconColor: 'text-orange-600',
      tooltip: 'Perkiraan laba bersih berdasarkan asumsi margin keuntungan 30% dari omzet. Angka ini adalah estimasi dan dapat berbeda dengan laba aktual setelah dikurangi semua biaya operasional.'
    },
    {
      key: 'mostUsedIngredient',
      icon: <ChefHat className="h-6 w-6" />,
      label: 'Bahan Paling Sering Dipakai',
      value: stats.mostUsedIngredient?.name || 'Belum ada data',
      description: stats.mostUsedIngredient?.usageCount 
        ? `Dipakai ${stats.mostUsedIngredient.usageCount}x` 
        : '',
      iconColor: 'text-orange-600',
      valueColor: stats.mostUsedIngredient?.name ? 'text-gray-900' : 'text-gray-500',
      tooltip: 'Bahan baku yang paling sering digunakan dalam resep berdasarkan jumlah pesanan yang telah dibuat. Data ini membantu untuk perencanaan stok dan identifikasi bahan baku kritis.'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {statsConfig.map((stat) => (
        <StatCard
          key={stat.key}
          icon={stat.icon}
          label={stat.label}
          value={stat.value}
          description={stat.description}
          iconColor={stat.iconColor}
          valueColor={stat.valueColor}
          isLoading={isLoading}
          tooltip={stat.tooltip}
        />
      ))}
    </div>
  );
};

