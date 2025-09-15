// src/components/recipe/components/RecipeForm/CostCalculationStep/components/SummaryGrid.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Target, BarChart3, Info, Package, Utensils } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import type { CostBreakdown, ProfitAnalysis } from '../utils/types';

interface SummaryGridProps {
  costBreakdown: CostBreakdown;
  profitAnalysis: ProfitAnalysis;
  breakEvenPoint: number;
  totalRevenue: number;
  jumlah_porsi: number;
  jumlah_pcs_per_porsi: number; // ✅ Sesuai dengan kolom database: jumlah_pcs_per_porsi
  margin_keuntungan_persen: number;
}

interface SummaryCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  bgColor: string;
  iconColor: string;
  badge?: string; // ✅ Optional badge for additional info
}

const SummaryCardItem: React.FC<SummaryCardProps> = ({
  icon,
  title,
  value,
  subtitle,
  bgColor,
  iconColor,
  badge,
}) => (
  <div className="bg-white rounded-lg p-4 border border-gray-200 relative">
    {/* ✅ Badge for special indicators */}
    {badge && (
      <div className="absolute top-2 right-2">
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
          {badge}
        </span>
      </div>
    )}
    
    <div className="flex items-center gap-2 mb-2">
      <div className={`w-8 h-8 ${bgColor} rounded-lg flex items-center justify-center`}>
        <div className={`w-4 h-4 ${iconColor}`}>
          {icon}
        </div>
      </div>
      <div className="flex-1">
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
  jumlah_porsi,
  jumlah_pcs_per_porsi, // ✅ Gunakan props yang sudah ada
  margin_keuntungan_persen,
}) => {
  // ✅ Calculate total pieces untuk konteks yang lebih baik
  const totalPieces = jumlah_porsi * jumlah_pcs_per_porsi;
  const showPerPcsData = jumlah_pcs_per_porsi > 1;

  const summaryItems = [
    {
      icon: <DollarSign className="w-4 h-4" />,
      title: "TOTAL INVESTASI",
      value: formatCurrency(costBreakdown.totalProductionCost),
      subtitle: `Untuk ${jumlah_porsi} porsi${showPerPcsData ? ` (${totalPieces} pcs)` : ''}`,
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
      subtitle: `${formatPercentage(margin_keuntungan_persen)} margin`,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600"
    },
    {
      icon: <BarChart3 className="w-4 h-4" />,
      title: "BREAK EVEN",
      value: `${breakEvenPoint} porsi`,
      subtitle: showPerPcsData ? `${breakEvenPoint * jumlah_pcs_per_porsi} pcs untuk BEP` : "Untuk balik modal",
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600"
    }
  ];

  // ✅ HPP per unit breakdown cards - sesuaikan dengan struktur database
  const hppBreakdownItems = [
    {
      icon: <Utensils className="w-4 h-4" />,
      title: "HPP PER PORSI",
      value: formatCurrency(costBreakdown.costPerPortion),
      subtitle: `${jumlah_pcs_per_porsi} pcs per porsi`,
      bgColor: "bg-indigo-100",
      iconColor: "text-indigo-600",
      badge: "Per Porsi"
    },
    // ✅ Hanya tampilkan per-pcs jika ada multiple pieces per portion
    ...(showPerPcsData ? [{
      icon: <Package className="w-4 h-4" />,
      title: "HPP PER PCS",
      value: formatCurrency(costBreakdown.costPerPiece),
      subtitle: `Total ${totalPieces} pcs`,
      bgColor: "bg-teal-100",
      iconColor: "text-teal-600",
      badge: "Per Pcs"
    }] : []),
    {
      icon: <DollarSign className="w-4 h-4" />,
      title: "HARGA JUAL PORSI",
      value: formatCurrency(profitAnalysis.sellingPricePerPortion),
      subtitle: `Profit: ${formatCurrency(profitAnalysis.profitPerPortion)}`,
      bgColor: "bg-emerald-100",
      iconColor: "text-emerald-600",
      badge: "Jual Porsi"
    },
    // ✅ Hanya tampilkan selling price per pcs jika ada multiple pieces
    ...(showPerPcsData ? [{
      icon: <Package className="w-4 h-4" />,
      title: "HARGA JUAL PCS",
      value: formatCurrency(profitAnalysis.sellingPricePerPiece),
      subtitle: `Profit: ${formatCurrency(profitAnalysis.profitPerPiece)}`,
      bgColor: "bg-cyan-100",
      iconColor: "text-cyan-600",
      badge: "Jual Pcs"
    }] : [])
  ];

  return (
    <div className="space-y-6">
      {/* Main Summary Grid */}
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

      {/* ✅ HPP & Pricing Breakdown */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Detail HPP & Harga Jual
            {showPerPcsData && (
              <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                {jumlahPcsPerPorsi} pcs/porsi
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`grid grid-cols-1 gap-4 ${
            showPerPcsData ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2'
          }`}>
            {hppBreakdownItems.map((item, index) => (
              <SummaryCardItem
                key={index}
                icon={item.icon}
                title={item.title}
                value={item.value}
                subtitle={item.subtitle}
                bgColor={item.bgColor}
                iconColor={item.iconColor}
                badge={item.badge}
              />
            ))}
          </div>

          {/* ✅ Quick comparison table when per-pcs data exists */}
          {showPerPcsData && (
            <div className="mt-6 bg-white rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                Perbandingan Unit
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="font-medium text-gray-800 border-b pb-1">
                    Per Porsi ({jumlah_pcs_per_porsi} pcs)
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">HPP:</span>
                    <span className="font-medium">
                      {formatCurrency(costBreakdown.costPerPortion)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Harga Jual:</span>
                    <span className="font-medium text-green-700">
                      {formatCurrency(profitAnalysis.sellingPricePerPortion)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Profit:</span>
                    <span className="font-medium text-purple-700">
                      {formatCurrency(profitAnalysis.profitPerPortion)}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="font-medium text-gray-800 border-b pb-1">Per Pcs</div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">HPP:</span>
                    <span className="font-medium">
                      {formatCurrency(costBreakdown.costPerPiece)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Harga Jual:</span>
                    <span className="font-medium text-green-700">
                      {formatCurrency(profitAnalysis.sellingPricePerPiece)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Profit:</span>
                    <span className="font-medium text-purple-700">
                      {formatCurrency(profitAnalysis.profitPerPiece)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-gray-600 font-medium">Total untuk {jumlah_porsi} porsi:</span>
                    <span className="font-bold text-green-700">
                      {formatCurrency(profitAnalysis.sellingPricePerPiece * totalPieces)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};