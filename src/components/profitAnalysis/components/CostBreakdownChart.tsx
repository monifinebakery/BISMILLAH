// src/components/profitAnalysis/components/CostBreakdownChart.tsx
// ✅ UPDATED - Material Usage Integration Compatible

import React from 'react';
import { cn } from '@/lib/utils';

// ✅ Import updated types
import { 
  COGSBreakdown, 
  OPEXBreakdown, 
  ProfitMarginData,
  MaterialCostDetail,
  LaborCostDetail,
  OperationalExpenseDetail,
  ProfitInsight 
} from '../types';

// ✅ Enhanced props with detailed breakdown data
interface CostBreakdownChartProps {
  // Core data
  profitMarginData: ProfitMarginData;
  cogsBreakdown: COGSBreakdown;
  opexBreakdown: OPEXBreakdown;
  
  // Display options
  showMaterialUsageIndicator?: boolean;
  showDataQualityInfo?: boolean;
  compactMode?: boolean;
  insights?: ProfitInsight[];
}

// ✅ Helper types for chart items
interface ChartItem {
  label: string;
  amount: number;
  color: string;
  percentage: number;
  details?: string;
  isProfit?: boolean;
  dataSource?: 'actual' | 'estimated' | 'mixed';
}

export const CostBreakdownChart: React.FC<CostBreakdownChartProps> = ({
  profitMarginData,
  cogsBreakdown,
  opexBreakdown,
  showMaterialUsageIndicator = true,
  showDataQualityInfo = true,
  compactMode = false,
  insights = []
}) => {
  const { revenue, cogs, opex, netProfit } = profitMarginData;
  
  // ✅ Return early if no revenue
  if (revenue === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        <div className="text-center">
          <p className="text-sm">Belum ada data pendapatan</p>
          <p className="text-xs mt-1">Pastikan ada transaksi penjualan di periode ini</p>
        </div>
      </div>
    );
  }

  // ✅ Enhanced formatting with better currency display
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);

  const formatPercentage = (amount: number) => {
    const percentage = (amount / revenue) * 100;
    return Math.max(0, percentage).toFixed(1);
  };

  // ✅ Build chart items with enhanced data
  const chartItems: ChartItem[] = [
    { 
      label: 'Material', 
      amount: cogsBreakdown.totalMaterialCost, 
      color: 'bg-red-500', 
      percentage: parseFloat(formatPercentage(cogsBreakdown.totalMaterialCost)),
      details: `${cogsBreakdown.materialCosts.length} jenis material`,
      dataSource: cogsBreakdown.dataSource
    },
    { 
      label: 'Tenaga Kerja', 
      amount: cogsBreakdown.totalDirectLaborCost, 
      color: 'bg-orange-500', 
      percentage: parseFloat(formatPercentage(cogsBreakdown.totalDirectLaborCost)),
      details: `${cogsBreakdown.directLaborCosts.length} kategori labor`
    },
    { 
      label: 'Overhead', 
      amount: cogsBreakdown.manufacturingOverhead, 
      color: 'bg-yellow-500', 
      percentage: parseFloat(formatPercentage(cogsBreakdown.manufacturingOverhead)),
      details: `Metode: ${cogsBreakdown.overheadAllocationMethod}`
    },
    { 
      label: 'OPEX', 
      amount: opex, 
      color: 'bg-purple-500', 
      percentage: parseFloat(formatPercentage(opex)),
      details: `${[
        ...opexBreakdown.administrativeExpenses,
        ...opexBreakdown.sellingExpenses,
        ...opexBreakdown.generalExpenses
      ].length} biaya operasional`
    },
    { 
      label: 'Laba Bersih', 
      amount: netProfit, 
      color: netProfit >= 0 ? 'bg-green-500' : 'bg-red-600', 
      percentage: parseFloat(formatPercentage(netProfit)),
      isProfit: true,
      details: netProfit >= 0 ? 'Menguntungkan' : 'Merugi'
    }
  ];

  // ✅ Get data quality insights
  const dataQualityInsights = insights.filter(insight => 
    insight.category === 'efficiency' && insight.message.includes('data')
  );

  // ✅ Determine if using actual material usage
  const hasActualMaterialData = cogsBreakdown.dataSource === 'actual' || 
                                cogsBreakdown.dataSource === 'mixed';

  return (
    <div className="space-y-4">
      {/* ✅ Enhanced Header with Data Quality Indicator */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Breakdown Biaya</h4>
        
        {showMaterialUsageIndicator && (
          <div className="flex items-center gap-2 text-xs">
            {hasActualMaterialData ? (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Data Aktual</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                <span>Data Estimasi</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ✅ Enhanced Waterfall Chart */}
      <div className="space-y-3">
        {/* Visual Bar */}
        <div className="relative">
          <div className="flex h-8 bg-gray-100 rounded overflow-hidden">
            {chartItems.map((item, index) => {
              const width = Math.max(Math.abs(item.percentage), 0.5);
              return (
                <div
                  key={index}
                  className={cn(
                    item.color,
                    item.isProfit && item.amount < 0 ? 'opacity-80' : '',
                    "transition-all duration-300 hover:brightness-110"
                  )}
                  style={{ width: `${width}%` }}
                  title={`${item.label}: ${item.percentage}% (${formatCurrency(item.amount)})`}
                />
              );
            })}
          </div>
          
          {/* ✅ Profit/Loss Indicator */}
          <div className="absolute -top-2 right-0 text-xs">
            {netProfit >= 0 ? (
              <span className="text-green-600 font-medium">↗ Profit</span>
            ) : (
              <span className="text-red-600 font-medium">↘ Loss</span>
            )}
          </div>
        </div>

        {/* ✅ Enhanced Legend with Details */}
        <div className={cn(
          "grid gap-3",
          compactMode ? "grid-cols-1" : "grid-cols-2"
        )}>
          {chartItems.map((item, index) => (
            <div 
              key={index} 
              className={cn(
                "flex items-center justify-between p-2 rounded-lg border",
                item.isProfit ? (
                  item.amount >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                ) : "bg-gray-50 border-gray-200"
              )}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={cn("w-3 h-3 rounded flex-shrink-0", item.color)} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{item.label}</span>
                    {/* ✅ Data Source Indicator */}
                    {item.dataSource && showMaterialUsageIndicator && (
                      <span className={cn(
                        "text-xs px-1 py-0.5 rounded",
                        item.dataSource === 'actual' ? "bg-green-100 text-green-600" :
                        item.dataSource === 'mixed' ? "bg-yellow-100 text-yellow-600" :
                        "bg-gray-100 text-gray-600"
                      )}>
                        {item.dataSource === 'actual' ? 'Real' : 
                         item.dataSource === 'mixed' ? 'Mix' : 'Est'}
                      </span>
                    )}
                  </div>
                  {!compactMode && item.details && (
                    <p className="text-xs text-gray-500 truncate">{item.details}</p>
                  )}
                </div>
              </div>
              
              <div className="text-right flex-shrink-0">
                <p className={cn(
                  "font-medium text-sm",
                  item.isProfit ? (
                    item.amount >= 0 ? "text-green-700" : "text-red-700"
                  ) : "text-gray-700"
                )}>
                  {item.percentage}%
                </p>
                <p className="text-xs text-gray-500">
                  {formatCurrency(item.amount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Enhanced Summary & Tips */}
      <div className="space-y-3">
        {/* Profit Health Indicator */}
        <div className={cn(
          "p-3 rounded-lg text-sm",
          netProfit >= revenue * 0.15 ? "bg-green-50 border border-green-200" :
          netProfit >= revenue * 0.10 ? "bg-yellow-50 border border-yellow-200" :
          netProfit >= 0 ? "bg-orange-50 border border-orange-200" :
          "bg-red-50 border border-red-200"
        )}>
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {netProfit >= revenue * 0.15 ? "🎉" :
               netProfit >= revenue * 0.10 ? "👍" :
               netProfit >= 0 ? "⚠️" : "🚨"}
            </span>
            <div>
              <p className="font-medium">
                Status Profitabilitas: {" "}
                <span className={cn(
                  netProfit >= revenue * 0.15 ? "text-green-700" :
                  netProfit >= revenue * 0.10 ? "text-yellow-700" :
                  netProfit >= 0 ? "text-orange-700" : "text-red-700"
                )}>
                  {netProfit >= revenue * 0.15 ? "Sangat Sehat" :
                   netProfit >= revenue * 0.10 ? "Sehat" :
                   netProfit >= 0 ? "Perlu Perhatian" : "Bermasalah"}
                </span>
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Margin bersih: {formatPercentage(netProfit)}% 
                {netProfit < revenue * 0.10 && " (Target minimal: 10%)"}
              </p>
            </div>
          </div>
        </div>

        {/* ✅ Data Quality Info */}
        {showDataQualityInfo && dataQualityInsights.length > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg text-xs border border-blue-200">
            <p className="font-medium text-blue-800 flex items-center gap-2">
              <span>📊</span>
              Kualitas Data:
            </p>
            <div className="mt-2 space-y-1">
              {dataQualityInsights.slice(0, 2).map((insight, index) => (
                <p key={index} className="text-blue-700">
                  • {insight.message}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Reading Guide */}
        <div className="bg-blue-50 p-3 rounded-lg text-xs border border-blue-200">
          <p className="font-medium text-blue-800 flex items-center gap-2">
            <span>💡</span>
            Cara Membaca Chart:
          </p>
          <div className="text-blue-700 mt-2 space-y-1">
            <p>• <strong>Semakin besar area hijau</strong> = bisnis semakin sehat</p>
            <p>• <strong>Target ideal:</strong> Laba bersih ≥ 10% dari pendapatan</p>
            <p>• <strong>Material cost</strong> idealnya &lt; 50% dari pendapatan</p>
            {hasActualMaterialData && (
              <p>• <strong>Data aktual</strong> memberikan akurasi lebih tinggi</p>
            )}
          </div>
        </div>

        {/* ✅ Quick Action Insights */}
        {insights.length > 0 && (
          <div className="bg-amber-50 p-3 rounded-lg text-xs border border-amber-200">
            <p className="font-medium text-amber-800 mb-2">🔍 Insight Cepat:</p>
            <div className="space-y-1">
              {insights
                .filter(insight => insight.impact === 'high' || insight.type === 'critical')
                .slice(0, 2)
                .map((insight, index) => (
                  <p key={index} className="text-amber-700">
                    • {insight.title}: {insight.message}
                  </p>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ Enhanced variant for dashboard/summary view
export const CostBreakdownSummary: React.FC<{
  profitMarginData: ProfitMarginData;
  cogsBreakdown: COGSBreakdown;
  className?: string;
}> = ({ 
  profitMarginData, 
  cogsBreakdown, 
  className 
}) => {
  return (
    <div className={cn("p-4 bg-white rounded-lg border", className)}>
      <CostBreakdownChart
        profitMarginData={profitMarginData}
        cogsBreakdown={cogsBreakdown}
        opexBreakdown={{
          administrativeExpenses: [],
          totalAdministrative: 0,
          sellingExpenses: [],
          totalSelling: 0,
          generalExpenses: [],
          totalGeneral: 0,
          totalOPEX: profitMarginData.opex
        }}
        compactMode={true}
        showDataQualityInfo={false}
      />
    </div>
  );
};

export default CostBreakdownChart;