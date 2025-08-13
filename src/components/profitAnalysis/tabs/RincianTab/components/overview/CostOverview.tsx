// src/components/profitAnalysis/tabs/rincianTab/components/overview/CostOverview.tsx
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// ✅ Import correct types from the established type system
import { CostOverviewProps } from '../../types/components';
import { useCostAnalysisWithMetadata } from '../../hooks/useCostAnalysis';

// ✅ Individual summary card components using correct calculation structure
const HppSummaryCard: React.FC<{
  cogsBreakdown: any;
  costAnalysis: any;
  isMobile?: boolean;
}> = ({ cogsBreakdown, costAnalysis, isMobile }) => {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);

  return (
    <div className="bg-white p-6 rounded-lg border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Harga Pokok Penjualan (HPP)</h3>
        <div className="text-2xl font-bold text-red-600">
          {formatCurrency(cogsBreakdown.totalCOGS)}
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Material</span>
          <div className="text-right">
            <div className="font-medium">{formatCurrency(cogsBreakdown.totalMaterialCost)}</div>
            <div className="text-xs text-gray-500">{costAnalysis.materialRatio.toFixed(1)}% dari revenue</div>
          </div>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Tenaga Kerja Langsung</span>
          <div className="text-right">
            <div className="font-medium">{formatCurrency(cogsBreakdown.totalDirectLaborCost)}</div>
            <div className="text-xs text-gray-500">{costAnalysis.laborRatio.toFixed(1)}% dari revenue</div>
          </div>
        </div>
        
        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-gray-600">Overhead Manufaktur</span>
          <div className="text-right">
            <div className="font-medium">{formatCurrency(cogsBreakdown.manufacturingOverhead)}</div>
            <div className="text-xs text-gray-500">{costAnalysis.overheadRatio.toFixed(1)}% dari revenue</div>
          </div>
        </div>
      </div>
      
      <div className={cn(
        "mt-4 p-3 rounded-lg",
        costAnalysis.cogsRatio <= 60 ? "bg-green-50 border border-green-200" :
        costAnalysis.cogsRatio <= 75 ? "bg-yellow-50 border border-yellow-200" :
        "bg-red-50 border border-red-200"
      )}>
        <div className="flex items-center gap-2">
          <span className="text-lg">
            {costAnalysis.cogsRatio <= 60 ? "✅" :
             costAnalysis.cogsRatio <= 75 ? "⚠️" : "🚨"}
          </span>
          <div>
            <p className="text-sm font-medium">
              Rasio HPP: {costAnalysis.cogsRatio.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-600">
              {costAnalysis.cogsRatio <= 60 ? "Efisiensi baik" :
               costAnalysis.cogsRatio <= 75 ? "Perlu optimasi" :
               "Perlu perhatian serius"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const OpexSummaryCard: React.FC<{
  opexBreakdown: any;
  profitMarginData: any;
  opexComposition: any;
  isMobile?: boolean;
}> = ({ opexBreakdown, profitMarginData, opexComposition, isMobile }) => {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);

  const opexRatio = profitMarginData.revenue > 0 
    ? (opexBreakdown.totalOPEX / profitMarginData.revenue) * 100 
    : 0;

  return (
    <div className="bg-white p-6 rounded-lg border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Biaya Operasional (OPEX)</h3>
        <div className="text-2xl font-bold text-purple-600">
          {formatCurrency(opexBreakdown.totalOPEX)}
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Administratif</span>
          <div className="text-right">
            <div className="font-medium">{formatCurrency(opexBreakdown.totalAdministrative)}</div>
            <div className="text-xs text-gray-500">{opexComposition.adminRatio.toFixed(1)}% dari OPEX</div>
          </div>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Penjualan</span>
          <div className="text-right">
            <div className="font-medium">{formatCurrency(opexBreakdown.totalSelling)}</div>
            <div className="text-xs text-gray-500">{opexComposition.sellingRatio.toFixed(1)}% dari OPEX</div>
          </div>
        </div>
        
        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-gray-600">Umum</span>
          <div className="text-right">
            <div className="font-medium">{formatCurrency(opexBreakdown.totalGeneral)}</div>
            <div className="text-xs text-gray-500">{opexComposition.generalRatio.toFixed(1)}% dari OPEX</div>
          </div>
        </div>
      </div>
      
      <div className={cn(
        "mt-4 p-3 rounded-lg",
        opexRatio <= 20 ? "bg-green-50 border border-green-200" :
        opexRatio <= 35 ? "bg-yellow-50 border border-yellow-200" :
        "bg-red-50 border border-red-200"
      )}>
        <div className="flex items-center gap-2">
          <span className="text-lg">
            {opexRatio <= 20 ? "✅" :
             opexRatio <= 35 ? "⚠️" : "🚨"}
          </span>
          <div>
            <p className="text-sm font-medium">
              Rasio OPEX: {opexRatio.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-600">
              {opexRatio <= 20 ? "Terkendali dengan baik" :
               opexRatio <= 35 ? "Masih dalam batas wajar" :
               "Terlalu tinggi, perlu dikurangi"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickRatioAnalysis: React.FC<{
  costAnalysis: any;
  costStructureAnalysis: any;
  isMobile?: boolean;
  className?: string;
}> = ({ costAnalysis, costStructureAnalysis, isMobile, className }) => {
  // ✅ Calculate net margin from existing data
  const netMarginRatio = 100 - costAnalysis.totalCostRatio;
  
  const ratios = [
    {
      label: "Margin Keuntungan",
      value: netMarginRatio,
      format: "percentage",
      benchmark: { good: 15, fair: 10 },
      trend: "higher_better"
    },
    {
      label: "Efisiensi Material",
      value: costAnalysis.materialRatio,
      format: "percentage", 
      benchmark: { good: 40, fair: 55 },
      trend: "lower_better"
    },
    {
      label: "Efisiensi HPP",
      value: costAnalysis.cogsRatio,
      format: "percentage",
      benchmark: { good: 60, fair: 75 },
      trend: "lower_better"
    },
    {
      label: "Kontrol OPEX",
      value: costAnalysis.opexRatio,
      format: "percentage",
      benchmark: { good: 20, fair: 35 },
      trend: "lower_better"
    }
  ];

  const getStatusColor = (value: number, benchmark: any, trend: string) => {
    if (trend === "higher_better") {
      return value >= benchmark.good ? "text-green-600" :
             value >= benchmark.fair ? "text-yellow-600" : "text-red-600";
    } else {
      return value <= benchmark.good ? "text-green-600" :
             value <= benchmark.fair ? "text-yellow-600" : "text-red-600";
    }
  };

  const getStatusText = (value: number, benchmark: any, trend: string) => {
    if (trend === "higher_better") {
      return value >= benchmark.good ? "Baik" :
             value >= benchmark.fair ? "Cukup" : "Perlu Perbaikan";
    } else {
      return value <= benchmark.good ? "Baik" :
             value <= benchmark.fair ? "Cukup" : "Perlu Perbaikan";
    }
  };

  return (
    <div className={cn("bg-white p-6 rounded-lg border", className)}>
      <h3 className="font-semibold text-lg mb-4">Analisis Rasio Cepat</h3>
      
      <div className={cn(
        "grid gap-4",
        isMobile ? "grid-cols-1" : "grid-cols-2 md:grid-cols-4"
      )}>
        {ratios.map((ratio, index) => (
          <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">{ratio.label}</div>
            <div className={cn(
              "text-2xl font-bold mb-1",
              getStatusColor(ratio.value, ratio.benchmark, ratio.trend)
            )}>
              {ratio.value.toFixed(1)}%
            </div>
            <div className="text-xs">
              {getStatusText(ratio.value, ratio.benchmark, ratio.trend)}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800 font-medium mb-2">💡 Insight Cepat:</p>
        <div className="text-xs text-blue-700 space-y-1">
          <p>• Margin ideal: >15% untuk bisnis yang sehat</p>
          <p>• Material cost idealnya <40% dari revenue</p>
          <p>• Total HPP sebaiknya <60% untuk profitabilitas optimal</p>
          <p>• OPEX ratio idealnya <20% dari revenue</p>
        </div>
      </div>
      
      {/* ✅ Health Score from Cost Structure Analysis */}
      {costStructureAnalysis?.overall?.healthScore && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Skor Kesehatan Bisnis</span>
            <div className={cn(
              "text-lg font-bold",
              costStructureAnalysis.overall.healthScore >= 80 ? "text-green-600" :
              costStructureAnalysis.overall.healthScore >= 60 ? "text-yellow-600" :
              "text-red-600"
            )}>
              {costStructureAnalysis.overall.healthScore.toFixed(0)}/100
            </div>
          </div>
          {costStructureAnalysis.overall.criticalIssues?.length > 0 && (
            <div className="mt-2 text-xs text-gray-600">
              {costStructureAnalysis.overall.criticalIssues.length} area memerlukan perhatian
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ✅ Main CostOverview component with enhanced flexibility
export const CostOverview: React.FC<CostOverviewProps> = ({
  profitData,
  calculations,
  isMobile = false,
  className
}) => {
  const { profitMarginData, cogsBreakdown, opexBreakdown } = profitData;
  
  // ✅ Use calculations if provided, otherwise calculate independently
  let costAnalysis, opexComposition, costStructureAnalysis;
  
  if (calculations) {
    ({ costAnalysis, opexComposition, costStructureAnalysis } = calculations);
  }
  
  // ✅ Fallback: Use dedicated cost analysis hook for enhanced metadata
  const costAnalysisWithMetadata = useCostAnalysisWithMetadata(profitData);
  
  // ✅ Use fallback if main calculations not available
  if (!costAnalysis && costAnalysisWithMetadata) {
    costAnalysis = costAnalysisWithMetadata;
    
    // ✅ Calculate basic opexComposition if not provided
    if (!opexComposition && opexBreakdown.totalOPEX > 0) {
      opexComposition = {
        adminRatio: (opexBreakdown.totalAdministrative / opexBreakdown.totalOPEX) * 100,
        sellingRatio: (opexBreakdown.totalSelling / opexBreakdown.totalOPEX) * 100,
        generalRatio: (opexBreakdown.totalGeneral / opexBreakdown.totalOPEX) * 100,
      };
    }
  }
  
  // ✅ Early return if still no data
  if (!costAnalysis) {
    return (
      <TabsContent value="overview" className={cn("mt-6", isMobile && "mt-4", className)}>
        <div className="flex items-center justify-center p-8 text-gray-500">
          <div className="text-center">
            <p className="text-sm">Data tidak dapat diproses</p>
            <p className="text-xs mt-1">Pastikan data profit analysis sudah lengkap</p>
          </div>
        </div>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="overview" className={cn("mt-6", isMobile && "mt-4", className)}>
      {/* ✅ Enhanced Business Health Alert (if metadata available) */}
      {costAnalysisWithMetadata?.metadata && (
        <div className={cn(
          "mb-6 p-4 rounded-lg border",
          costAnalysisWithMetadata.metadata.costStructureHealth.isHealthy 
            ? "bg-green-50 border-green-200" 
            : costAnalysisWithMetadata.metadata.costStructureHealth.riskLevel === 'high'
            ? "bg-red-50 border-red-200"
            : "bg-yellow-50 border-yellow-200"
        )}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">
              {costAnalysisWithMetadata.metadata.costStructureHealth.isHealthy ? "🎯" :
               costAnalysisWithMetadata.metadata.costStructureHealth.riskLevel === 'high' ? "🚨" : "⚠️"}
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">
                  Status Kesehatan Bisnis: {" "}
                  <span className={cn(
                    costAnalysisWithMetadata.metadata.costStructureHealth.isHealthy ? "text-green-700" :
                    costAnalysisWithMetadata.metadata.costStructureHealth.riskLevel === 'high' ? "text-red-700" :
                    "text-yellow-700"
                  )}>
                    {costAnalysisWithMetadata.metadata.costStructureHealth.isHealthy ? "Sehat" :
                     costAnalysisWithMetadata.metadata.costStructureHealth.riskLevel === 'high' ? "Berisiko Tinggi" :
                     "Perlu Perhatian"}
                  </span>
                </h3>
                <div className="text-right text-sm">
                  <div className="font-medium">
                    Profitabilitas: {costAnalysisWithMetadata.metadata.profitability.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-600">
                    Efisiensi: {costAnalysisWithMetadata.metadata.costEfficiency.toFixed(2)}x
                  </div>
                </div>
              </div>
              
              {/* Quick Recommendations */}
              {costAnalysisWithMetadata.metadata.costStructureHealth.recommendations.length > 0 && (
                <div className="text-xs space-y-1">
                  {costAnalysisWithMetadata.metadata.costStructureHealth.recommendations
                    .slice(0, 2)
                    .map((rec, index) => (
                      <p key={index} className="flex items-start gap-1">
                        <span>•</span>
                        <span>{rec}</span>
                      </p>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HPP and OPEX Summary Cards */}
      <div className={cn("grid grid-cols-1 gap-6", !isMobile && "md:grid-cols-2")}>
        <HppSummaryCard
          cogsBreakdown={cogsBreakdown}
          costAnalysis={costAnalysis}
          isMobile={isMobile}
        />
        <OpexSummaryCard
          opexBreakdown={opexBreakdown}
          profitMarginData={profitMarginData}
          opexComposition={opexComposition}
          isMobile={isMobile}
        />
      </div>
      
      {/* Quick Ratio Analysis */}
      <QuickRatioAnalysis
        costAnalysis={costAnalysis}
        costStructureAnalysis={costStructureAnalysis}
        isMobile={isMobile}
        className={cn("mt-6", isMobile && "mt-4")}
      />
      
      {/* ✅ Enhanced Break-Even Analysis (if metadata available) */}
      {costAnalysisWithMetadata?.metadata && (
        <div className="mt-6 bg-white p-6 rounded-lg border">
          <h3 className="font-semibold text-lg mb-4">Analisis Break-Even</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-xs text-blue-600 mb-1">Break-Even Point</div>
              <div className="text-lg font-bold text-blue-700">
                {new Intl.NumberFormat('id-ID', { 
                  style: 'currency', 
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(costAnalysisWithMetadata.metadata.breakEvenPoint)}
              </div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-xs text-green-600 mb-1">Margin of Safety</div>
              <div className="text-lg font-bold text-green-700">
                {new Intl.NumberFormat('id-ID', { 
                  style: 'currency', 
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(costAnalysisWithMetadata.metadata.marginSafety)}
              </div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-xs text-purple-600 mb-1">Cost Efficiency Ratio</div>
              <div className="text-lg font-bold text-purple-700">
                {costAnalysisWithMetadata.metadata.costEfficiency.toFixed(2)}x
              </div>
              <div className="text-xs text-purple-600 mt-1">
                {costAnalysisWithMetadata.metadata.costEfficiency >= 1.5 ? "Sangat Efisien" :
                 costAnalysisWithMetadata.metadata.costEfficiency >= 1.2 ? "Efisien" :
                 costAnalysisWithMetadata.metadata.costEfficiency >= 1.0 ? "Cukup" : "Perlu Perbaikan"}
              </div>
            </div>
          </div>
        </div>
      )}
    </TabsContent>
  );
};