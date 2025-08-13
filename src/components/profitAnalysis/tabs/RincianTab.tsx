// src/components/profitAnalysis/tabs/RincianTab.tsx

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, TrendingUp, Settings } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

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
import { TabNavigation } from './RincianTab/components/TabNavigation';

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
  profitData: ProfitAnalysisResult;
  className?: string;
}

type TabKey = 'overview' | 'cogs' | 'opex' | 'analysis';

export const RincianTab: React.FC<RincianTabProps> = ({
  profitData,
  className
}) => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Custom hooks for business logic
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