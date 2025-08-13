// src/components/profitAnalysis/tabs/RincianTab.tsx
// ✅ UPDATED with Robust Data Validation
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, TrendingUp, Settings, AlertCircle } from 'lucide-react'; // ✅ Added AlertCircle
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/logger'; // ✅ Import logger

// Types
import { ProfitAnalysisResult } from '../types';

// Hooks
import {
  useRincianCalculations
} from './RincianTab/hooks/useRincianCalculations';

import {
  useCostAnalysis,
  useCostAnalysisWithMetadata,
  useCostAnalysisComparison
} from './RincianTab/hooks/useCostAnalysis';

import {
  useEfficiencyMetrics,
  useEfficiencyMetricsWithScoring,
  useEfficiencyTrends
} from './RincianTab/hooks/useEfficiencyMetrics';

import {
  useTargetAnalysis,
  useIndividualTargetAnalysis,
  useActionPlan,
  useGoalTracking
} from './RincianTab/hooks/useTargetAnalysis';

// Components
import { DataQualityIndicator } from './RincianTab/components/DataQualityIndicator';
// import { TabNavigation } from './RincianTab/components/TabNavigation'; // Commented out as not used in current layout

// Overview components
import { CostOverview } from './RincianTab/components/overview/CostOverview';
import { HppSummaryCard } from './RincianTab/components/overview/HppSummaryCard';
import { OpexSummaryCard } from './RincianTab/components/overview/OpexSummaryCard';
import { QuickRatioAnalysis } from './RincianTab/components/overview/QuickRatioAnalysis';

// COGS detail components
import { CogsDetailTab } from './RincianTab/components/cogsDetail/CogsDetailTab';
import { MaterialCostsCard } from './RincianTab/components/cogsDetail/MaterialCostsCard';
import { LaborCostsCard } from './RincianTab/components/cogsDetail/LaborCostsCard';
import { MaterialUsageAnalytics } from './RincianTab/components/cogsDetail/MaterialUsageAnalytics';

// OPEX detail components
import { OpexDetailTab } from './RincianTab/components/opexDetail/OpexDetailTab';
import { ExpenseCard } from './RincianTab/components/opexDetail/ExpenseCard';
import { AdministrativeExpensesCard } from './RincianTab/components/opexDetail/AdministrativeExpensesCard';
import { SellingExpensesCard } from './RincianTab/components/opexDetail/SellingExpensesCard';
import { GeneralExpensesCard } from './RincianTab/components/opexDetail/GeneralExpensesCard';

// Analysis components
import { AnalysisTab } from './RincianTab/components/analysis/AnalysisTab';
import { EfficiencyMetricsCard } from './RincianTab/components/analysis/EfficiencyMetricsCard';
import { TargetVsActualCards } from './RincianTab/components/analysis/TargetVsActualCards';
import { RecommendationsCard } from './RincianTab/components/analysis/RecommendationsCard';
import { ActionItemsCard } from './RincianTab/components/analysis/ActionItemsCard';

interface RincianTabProps {
  profitData: ProfitAnalysisResult | null | undefined; // ✅ Allow null/undefined explicitly
  className?: string;
}

type TabKey = 'overview' | 'cogs' | 'opex' | 'analysis';

export const RincianTab: React.FC<RincianTabProps> = ({
  profitData,
  className
}) => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // ✅ ROBUST VALIDATION AT THE VERY BEGINNING OF THE COMPONENT
  // Check if profitData object itself exists
  if (!profitData) {
    logger.warn("RincianTab: profitData is null or undefined");
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Data tidak tersedia</p>
        </div>
      </div>
    );
  }

  // Check for required top-level properties and their types
  if (
    !profitData.profitMarginData ||
    typeof profitData.profitMarginData !== 'object' ||
    !profitData.cogsBreakdown ||
    typeof profitData.cogsBreakdown !== 'object' ||
    !profitData.opexBreakdown ||
    typeof profitData.opexBreakdown !== 'object'
  ) {
    logger.warn("RincianTab: profitData structure is invalid or missing required properties", { profitData });
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Struktur data tidak valid</p>
        </div>
      </div>
    );
  }

  // Check for required properties within nested objects and ensure they are numbers
  const { profitMarginData, cogsBreakdown, opexBreakdown } = profitData;
  if (
    typeof profitMarginData.revenue !== 'number' || isNaN(profitMarginData.revenue) ||
    typeof profitMarginData.cogs !== 'number' || isNaN(profitMarginData.cogs) ||
    typeof profitMarginData.opex !== 'number' || isNaN(profitMarginData.opex) ||
    typeof profitMarginData.netProfit !== 'number' || isNaN(profitMarginData.netProfit) ||
    typeof profitMarginData.grossMargin !== 'number' || isNaN(profitMarginData.grossMargin) ||
    typeof profitMarginData.netMargin !== 'number' || isNaN(profitMarginData.netMargin) ||
    typeof cogsBreakdown.totalMaterialCost !== 'number' || isNaN(cogsBreakdown.totalMaterialCost) ||
    typeof cogsBreakdown.totalDirectLaborCost !== 'number' || isNaN(cogsBreakdown.totalDirectLaborCost) ||
    typeof cogsBreakdown.manufacturingOverhead !== 'number' || isNaN(cogsBreakdown.manufacturingOverhead) ||
    typeof cogsBreakdown.totalCOGS !== 'number' || isNaN(cogsBreakdown.totalCOGS) ||
    typeof opexBreakdown.totalAdministrative !== 'number' || isNaN(opexBreakdown.totalAdministrative) ||
    typeof opexBreakdown.totalSelling !== 'number' || isNaN(opexBreakdown.totalSelling) ||
    typeof opexBreakdown.totalGeneral !== 'number' || isNaN(opexBreakdown.totalGeneral) ||
    typeof opexBreakdown.totalOPEX !== 'number' || isNaN(opexBreakdown.totalOPEX)
    // Add checks for other critical numeric fields if accessed directly by child components
  ) {
    logger.warn("RincianTab: Required numeric properties are missing, invalid, or NaN", { profitMarginData, cogsBreakdown, opexBreakdown });
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Data numerik tidak lengkap atau tidak valid</p>
        </div>
      </div>
    );
  }

  // ✅ If we reach here, data is valid. Proceed with calculations and rendering.
  // const { profitMarginData, cogsBreakdown, opexBreakdown } = profitData; // Already destructured above with validation

  // Custom hooks for business logic
  // These hooks should also perform internal validation, but the check above provides a strong first line of defense.
  const calculations = useRincianCalculations({ profitData });
  const costAnalysis = useCostAnalysis(profitData);
  const efficiencyMetrics = useEfficiencyMetricsWithScoring(profitData);
  const targetAnalysis = useIndividualTargetAnalysis(profitData);
  const actionPlan = useActionPlan(profitData);

  return (
    <div className={cn("space-y-6", isMobile && "space-y-4", className)}>
      {/* Data Quality Indicator */}
      <DataQualityIndicator profitData={profitData} />

      {/* Main Content */}
      <Card>
        <CardHeader className={cn("p-6", isMobile && "p-4")}>
          <CardTitle className={cn("flex items-center gap-2", isMobile && "text-base")}>
            <Calculator className={cn("h-5 w-5", isMobile && "h-4 w-4")} />
            Rincian Analisis Profitabilitas
          </CardTitle>
        </CardHeader>
        <CardContent className={cn("p-6", isMobile && "p-4")}>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)}>
            <TabsList className={cn(
              "grid w-full",
              isMobile ? "grid-cols-2" : "grid-cols-4",
              isMobile && "h-auto"
            )}>
              <TabsTrigger
                value="overview"
                className={cn(isMobile && "text-xs py-2")}
              >
                {isMobile ? "Overview" : "Ringkasan Biaya"}
              </TabsTrigger>
              <TabsTrigger
                value="cogs"
                className={cn(isMobile && "text-xs py-2")}
              >
                {isMobile ? "COGS" : "Detail HPP"}
              </TabsTrigger>
              <TabsTrigger
                value="opex"
                className={cn(isMobile && "text-xs py-2")}
              >
                {isMobile ? "OPEX" : "Detail OPEX"}
              </TabsTrigger>
              <TabsTrigger
                value="analysis"
                className={cn(isMobile && "text-xs py-2")}
              >
                {isMobile ? "Analisis" : "Analisis & Target"}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className={cn("mt-6", isMobile && "mt-4")}>
              <div className={cn("space-y-6", isMobile && "space-y-4")}>
                {/* Cost Overview */}
                <CostOverview
                  profitData={profitData}
                  calculations={calculations}
                  isMobile={isMobile}
                />

                {/* Summary Cards */}
                <div className={cn("grid grid-cols-1 gap-6", !isMobile && "lg:grid-cols-2")}>
                  <HppSummaryCard
                    profitData={profitData}
                    calculations={calculations}
                    isMobile={isMobile}
                  />
                  <OpexSummaryCard
                    profitData={profitData}
                    calculations={calculations}
                    isMobile={isMobile}
                  />
                </div>

                {/* Quick Ratio Analysis */}
                <QuickRatioAnalysis
                  profitData={profitData}
                  calculations={calculations}
                  isMobile={isMobile}
                />
              </div>
            </TabsContent>

            {/* COGS Detail Tab */}
            <CogsDetailTab
              profitData={profitData}
              calculations={calculations}
              isMobile={isMobile}
            />

            {/* OPEX Detail Tab */}
            <OpexDetailTab
              profitData={profitData}
              calculations={calculations}
              isMobile={isMobile}
            />

            {/* Analysis Tab */}
            <AnalysisTab
              profitData={profitData}
              calculations={calculations}
              costAnalysis={costAnalysis}
              efficiencyMetrics={efficiencyMetrics}
              targetAnalysis={targetAnalysis}
              actionPlan={actionPlan}
              isMobile={isMobile}
            />
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Default export for easier importing
export default RincianTab;