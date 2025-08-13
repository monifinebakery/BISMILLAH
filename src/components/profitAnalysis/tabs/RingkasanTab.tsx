// src/components/profitAnalysis/tabs/RingkasanTab.tsx
// ✅ TAB RINGKASAN - Fixed and Enhanced Version

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Calculator, Factory } from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { CostBreakdownChart } from '../components/CostBreakdownChart';
import { formatCurrency, getMarginStatus, getMarginColor } from '../utils/formatters';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface RingkasanTabProps {
  profitData: any;
}

export const RingkasanTab: React.FC<RingkasanTabProps> = ({ profitData }) => {
  const isMobile = useIsMobile();
  
  // Validasi data
  if (!profitData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Data tidak tersedia</p>
      </div>
    );
  }

  const { profitMarginData, cogsBreakdown, opexBreakdown } = profitData;

  return (
    <div className="space-y-6">
      {/* Metrik Utama */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          title="Pendapatan"
          value={formatCurrency(profitMarginData.revenue)}
          icon={DollarSign}
          color="blue"
        />
        <MetricCard
          title="Margin Kotor"
          value={`${profitMarginData.grossMargin.toFixed(1)}%`}
          subtitle={formatCurrency(profitMarginData.grossProfit)}
          icon={TrendingUp}
          color={getMarginColor(profitMarginData.grossMargin, 'gross')}
          status={getMarginStatus(profitMarginData.grossMargin, 'gross')}
        />
        <MetricCard
          title="Margin Bersih"
          value={`${profitMarginData.netMargin.toFixed(1)}%`}
          subtitle={formatCurrency(profitMarginData.netProfit)}
          icon={Calculator}
          color={getMarginColor(profitMarginData.netMargin, 'net')}
          status={getMarginStatus(profitMarginData.netMargin, 'net')}
        />
        <MetricCard
          title="Total Biaya"
          value={formatCurrency(profitMarginData.cogs + profitMarginData.opex)}
          subtitle={`${(((profitMarginData.cogs + profitMarginData.opex) / profitMarginData.revenue) * 100).toFixed(1)}% dari pendapatan`}
          icon={Factory}
          color="purple"
        />
      </div>

      {/* Chart Breakdown Biaya */}
      <Card>
        <CardHeader>
          <CardTitle>Struktur Biaya</CardTitle>
        </CardHeader>
        <CardContent>
          <CostBreakdownChart
            revenue={profitMarginData.revenue}
            materialCost={cogsBreakdown.totalMaterialCost}
            laborCost={cogsBreakdown.totalDirectLaborCost}
            overhead={cogsBreakdown.manufacturingOverhead}
            opex={opexBreakdown.totalOPEX}
          />
        </CardContent>
      </Card>

      {/* Quick Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <h5 className="font-medium text-red-800 mb-2">🏭 Rasio HPP</h5>
            <p className="text-2xl font-bold text-red-700">
              {((cogsBreakdown.totalCOGS / profitMarginData.revenue) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-red-600">dari total pendapatan</p>
            <p className="text-xs text-gray-600 mt-1">
              Target: {"<"}70% untuk margin sehat
            </p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <h5 className="font-medium text-purple-800 mb-2">🏢 Rasio OPEX</h5>
            <p className="text-2xl font-bold text-purple-700">
              {((opexBreakdown.totalOPEX / profitMarginData.revenue) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-purple-600">dari total pendapatan</p>
            <p className="text-xs text-gray-600 mt-1">
              Target: {"<"}20% untuk efisiensi optimal
            </p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <h5 className="font-medium text-green-800 mb-2">💰 Rasio Laba</h5>
            <p className="text-2xl font-bold text-green-700">
              {profitMarginData.netMargin.toFixed(1)}%
            </p>
            <p className="text-xs text-green-600">margin laba bersih</p>
            <p className="text-xs text-gray-600 mt-1">
              Target: {">"}10% untuk bisnis sehat
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};