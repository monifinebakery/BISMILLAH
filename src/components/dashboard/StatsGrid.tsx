// components/dashboard/StatsGrid.tsx
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
  bgColor: string;
  iconColor: string;
  valueColor?: string;
  isLoading?: boolean;
  tooltip?: string;
}> = ({ 
  icon, 
  label, 
  value, 
  description, 
  bgColor, 
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
    <Card className="bg-white border-0 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer relative group">
      <CardContent className="p-4 sm:p-6 flex items-center">
        {/* 🎨 Icon */}
        <div className={`${bgColor} p-2 sm:p-3 rounded-full mr-3 sm:mr-4 flex-shrink-0`}>
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
              <Info className="h-3 w-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
            )}
          </div>
          
          {isLoading ? (
            <div className="h-5 sm:h-6 bg-gray-200 animate-pulse rounded mt-1"></div>
          ) : (
            <p className={`text-lg sm:text-xl font-semibold ${valueColor} truncate`}>
              {value}
            </p>
          )}
          
          {description && (
            <p className="text-xs text-gray-500 mt-1 truncate">
              {description}
            </p>
          )}
        </div>

        {/* Mobile Tooltip Indicator */}
        {tooltip && isMobile && (
          <div className="absolute top-2 right-2 bg-gray-100 rounded-full p-1 opacity-60 group-hover:opacity-100 transition-opacity">
            <Info className="h-3 w-3 text-gray-500" />
          </div>
        )}
      </CardContent>

      {/* Mobile Tooltip - Show on tap/hover */}
      {tooltip && isMobile && (
        <div className="absolute inset-x-0 top-full mt-2 mx-4 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-900 rotate-45"></div>
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
            className="max-w-xs sm:max-w-sm md:max-w-md z-50 px-3 py-2 text-sm bg-gray-900 text-white rounded-md shadow-lg border-0"
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
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
      tooltip: 'Total pendapatan kotor dari semua pesanan dalam periode yang dipilih. Ini adalah jumlah sebelum dikurangi biaya operasional dan HPP (Harga Pokok Penjualan).'
    },
    {
      key: 'orders',
      icon: <Package className="h-6 w-6" />,
      label: 'Total Pesanan',
      value: stats.orders.toLocaleString('id-ID'),
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      tooltip: 'Jumlah total pesanan yang telah dibuat dalam periode yang dipilih. Setiap pesanan dihitung sebagai satu transaksi terlepas dari jumlah item di dalamnya.'
    },
    {
      key: 'profit',
      icon: <Calculator className="h-6 w-6" />,
      label: 'Estimasi Laba Bersih',
      value: formatCurrency(stats.profit),
      description: '(Estimasi 30%)',
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
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
      bgColor: 'bg-amber-100',
      iconColor: 'text-amber-600',
      valueColor: stats.mostUsedIngredient?.name ? 'text-gray-900' : 'text-gray-500',
      tooltip: 'Bahan baku yang paling sering digunakan dalam resep berdasarkan jumlah pesanan yang telah dibuat. Data ini membantu untuk perencanaan stok dan identifikasi bahan baku kritis.'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statsConfig.map((stat) => (
        <StatCard
          key={stat.key}
          icon={stat.icon}
          label={stat.label}
          value={stat.value}
          description={stat.description}
          bgColor={stat.bgColor}
          iconColor={stat.iconColor}
          valueColor={stat.valueColor}
          isLoading={isLoading}
          tooltip={stat.tooltip}
        />
      ))}
    </div>
  );
};

export default StatsGrid;