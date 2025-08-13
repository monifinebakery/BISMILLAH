// src/components/profitAnalysis/tabs/RingkasanTab.tsx
// ✅ TAB RINGKASAN - Overview metrics dan chart

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Calculator, Factory } from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { CostBreakdownChart } from '../components/CostBreakdownChart';
import { formatCurrency, getMarginStatus, getMarginColor } from '../utils/formatters';

interface RingkasanTabProps {
  profitData: any;
}

export const RingkasanTab: React.FC<RingkasanTabProps> = ({ profitData }) => {
  return (
    <div className="space-y-6">
      {/* Metrik Utama */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Pendapatan"
          value={formatCurrency(profitData.profitMarginData.revenue)}
          icon={DollarSign}
          color="blue"
        />
        <MetricCard
          title="Margin Kotor"
          value={`${profitData.profitMarginData.grossMargin.toFixed(1)}%`}
          subtitle={formatCurrency(profitData.profitMarginData.grossProfit)}
          icon={TrendingUp}
          color={getMarginColor(profitData.profitMarginData.grossMargin, 'gross')}
          status={getMarginStatus(profitData.profitMarginData.grossMargin, 'gross')}
        />
        <MetricCard
          title="Margin Bersih"
          value={`${profitData.profitMarginData.netMargin.toFixed(1)}%`}
          subtitle={formatCurrency(profitData.profitMarginData.netProfit)}
          icon={Calculator}
          color={getMarginColor(profitData.profitMarginData.netMargin, 'net')}
          status={getMarginStatus(profitData.profitMarginData.netMargin, 'net')}
        />
        <MetricCard
          title="Total Biaya"
          value={formatCurrency(profitData.profitMarginData.cogs + profitData.profitMarginData.opex)}
          subtitle={`${(((profitData.profitMarginData.cogs + profitData.profitMarginData.opex) / profitData.profitMarginData.revenue) * 100).toFixed(1)}% dari pendapatan`}
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
            revenue={profitData.profitMarginData.revenue}
            materialCost={profitData.cogsBreakdown.totalMaterialCost}
            laborCost={profitData.cogsBreakdown.totalDirectLaborCost}
            overhead={profitData.cogsBreakdown.manufacturingOverhead}
            opex={profitData.opexBreakdown.totalOPEX}
          />
        </CardContent>
      </Card>

      {/* Quick Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <h5 className="font-medium text-red-800 mb-2">🏭 Rasio HPP</h5>
            <p className="text-2xl font-bold text-red-700">
              {((profitData.cogsBreakdown.totalCOGS / profitData.profitMarginData.revenue) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-red-600">dari total pendapatan</p>
            <p className="text-xs text-gray-600 mt-1">
              Target: &lt;70% untuk margin sehat
            </p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <h5 className="font-medium text-purple-800 mb-2">🏢 Rasio OPEX</h5>
            <p className="text-2xl font-bold text-purple-700">
              {((profitData.opexBreakdown.totalOPEX / profitData.profitMarginData.revenue) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-purple-600">dari total pendapatan</p>
            <p className="text-xs text-gray-600 mt-1">
              Target: &lt;20% untuk efisiensi optimal
            </p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <h5 className="font-medium text-green-800 mb-2">💰 Rasio Laba</h5>
            <p className="text-2xl font-bold text-green-700">
              {profitData.profitMarginData.netMargin.toFixed(1)}%
            </p>
            <p className="text-xs text-green-600">margin laba bersih</p>
            <p className="text-xs text-gray-600 mt-1">
              Target: &gt;10% untuk bisnis sehat
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};