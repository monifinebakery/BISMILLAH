// src/components/profitAnalysis/tabs/PerbandinganTab/index.tsx

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { BarChart3 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

// Types
import { ProfitAnalysisResult, ComparisonView } from './types';

// Hooks
import {
  useComparisonCalculations,
  useBenchmarkData,
  useCompetitiveAnalysis,
  useImprovementPotential
} from './hooks';

// Components
import {
  ComparisonViewSelector,
  CashVsRealComparisonCard,
  DataAccuracyAnalysis,
  IndustryBenchmarksCard,
  CostRatiosAnalysis,
  CompetitiveTable,
  CompetitivePositionCards,
  StrategicRecommendations,
  ImprovementInsights,
  ScenarioSimulation
} from './components';

interface PerbandinganTabProps {
  profitData: ProfitAnalysisResult;
  className?: string;
}

export const PerbandinganTab: React.FC<PerbandinganTabProps> = ({ 
  profitData,
  className 
}) => {
  const isMobile = useIsMobile();
  const [comparisonView, setComparisonView] = useState<ComparisonView>('cash-vs-real');

  // Custom hooks for business logic
  const { cashVsReal } = useComparisonCalculations(profitData);
  
  const {
    grossMarginStatus,
    netMarginStatus,
    ratioStatuses,
    materialEfficiency,
    industryBenchmarks
  } = useBenchmarkData(profitData);

  const {
    competitiveAnalysis,
    competitiveRows,
    strengths,
    improvements,
    shortTermTargets
  } = useCompetitiveAnalysis(profitData);

  const {
    improvementPotential,
    totalImprovementPotential,
    revenueImprovementPercentage,
    criticalInsights
  } = useImprovementPotential(profitData);

  return (
    <div className={cn("space-y-6", isMobile && "space-y-4", className)}>
      {/* Comparison View Selector */}
      <Card>
        <CardHeader className={cn("p-6", isMobile && "p-4")}>
          <CardTitle className={cn("flex items-center gap-2", isMobile && "text-base")}>
            <BarChart3 className={cn("h-5 w-5", isMobile && "h-4 w-4")} />
            Jenis Perbandingan
          </CardTitle>
        </CardHeader>
        <CardContent className={cn("p-6", isMobile && "p-4")}>
          <Tabs value={comparisonView} onValueChange={setComparisonView}>
            <ComparisonViewSelector
              value={comparisonView}
              onValueChange={setComparisonView}
            />

            {/* Cash Flow vs Real Profit */}
            <TabsContent value="cash-vs-real" className={cn("mt-6", isMobile && "mt-4")}>
              <div className={cn("grid grid-cols-1 gap-6", !isMobile && "lg:grid-cols-2")}>
                <CashVsRealComparisonCard cashVsReal={cashVsReal} />
                <DataAccuracyAnalysis 
                  cashVsReal={cashVsReal} 
                  profitData={profitData} 
                />
              </div>
            </TabsContent>

            {/* Industry Benchmarks */}
            <TabsContent value="benchmarks" className={cn("mt-6", isMobile && "mt-4")}>
              <div className={cn("grid grid-cols-1 gap-6", !isMobile && "lg:grid-cols-2")}>
                <IndustryBenchmarksCard
                  profitData={profitData}
                  grossMarginStatus={grossMarginStatus}
                  netMarginStatus={netMarginStatus}
                  industryBenchmarks={industryBenchmarks}
                />
                <CostRatiosAnalysis
                  profitData={profitData}
                  ratioStatuses={ratioStatuses}
                  materialEfficiency={materialEfficiency}
                />
              </div>
            </TabsContent>

            {/* Competitive Analysis */}
            <TabsContent value="competitive" className={cn("mt-6", isMobile && "mt-4")}>
              <Card>
                <CardHeader className={cn("p-4", isMobile && "p-3")}>
                  <CardTitle className={cn("flex items-center gap-2", isMobile && "text-base")}>
                    <BarChart3 className={cn("h-5 w-5", isMobile && "h-4 w-4")} />
                    Analisis Kompetitif
                  </CardTitle>
                </CardHeader>
                <CardContent className={cn("p-4", isMobile && "p-3")}>
                  <div className={cn("space-y-6", isMobile && "space-y-4")}>
                    {/* Comparison Table */}
                    <CompetitiveTable competitiveRows={competitiveRows} />

                    {/* Competitive Position */}
                    <CompetitivePositionCards
                      strengths={strengths}
                      improvements={improvements}
                      shortTermTargets={shortTermTargets}
                    />

                    <StrategicRecommendations />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Improvement Potential */}
            <TabsContent value="improvement" className={cn("mt-6", isMobile && "mt-4")}>
              <div className={cn("grid grid-cols-1 gap-6", !isMobile && "lg:grid-cols-2")}>
                <ImprovementInsights
                  profitData={profitData}
                  cashVsReal={cashVsReal}
                  criticalInsights={criticalInsights}
                  dataAccuracyGain={improvementPotential.dataAccuracyGain}
                />
                <ScenarioSimulation
                  improvementPotential={improvementPotential}
                  totalImprovementPotential={totalImprovementPotential}
                  revenueImprovementPercentage={revenueImprovementPercentage}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// Default export for easier importing
export default PerbandinganTab;