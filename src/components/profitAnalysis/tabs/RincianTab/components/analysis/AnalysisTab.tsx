// src/components/profitAnalysis/tabs/rincianTab/components/analysis/AnalysisTab.tsx

import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import { AnalysisTabProps } from '../../types/components';
import { EfficiencyMetricsCard } from './EfficiencyMetricsCard';
import { TargetVsActualCards } from './TargetVsActualCards';
import { RecommendationsCard } from './RecommendationsCard';
import { ActionItemsCard } from './ActionItemsCard';

export const AnalysisTab: React.FC<AnalysisTabProps> = ({
  profitData,
  calculations,
  isMobile,
  className
}) => {
  const { profitMarginData, cogsBreakdown, opexBreakdown } = profitData;
  const { 
    efficiencyMetrics, 
    costAnalysis, 
    costStructureAnalysis, 
    recommendations 
  } = calculations;

  return (
    <TabsContent value="analysis" className={cn("mt-6", isMobile && "mt-4", className)}>
      <div className="space-y-6">
        
        {/* Efficiency Metrics */}
        <EfficiencyMetricsCard
          efficiencyMetrics={efficiencyMetrics}
          costAnalysis={costAnalysis}
          isMobile={isMobile}
        />

        {/* Target vs Actual Analysis */}
        <TargetVsActualCards
          costStructureAnalysis={costStructureAnalysis}
          profitMarginData={profitMarginData}
          opexBreakdown={opexBreakdown}
          costAnalysis={costAnalysis}
          isMobile={isMobile}
        />

        {/* Recommendations */}
        <RecommendationsCard
          recommendations={recommendations}
          costStructureAnalysis={costStructureAnalysis}
          dataSource={cogsBreakdown.dataSource || 'estimated'}
          isMobile={isMobile}
        />

        {/* Summary & Action Items */}
        <ActionItemsCard
          profitData={profitData}
          costAnalysis={costAnalysis}
          costStructureAnalysis={costStructureAnalysis}
          isMobile={isMobile}
        />
      </div>
    </TabsContent>
  );
};