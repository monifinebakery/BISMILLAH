// src/components/profitAnalysis/tabs/rincianTab/components/overview/CostOverview.tsx

import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import { CostOverviewProps } from '../../types/components';
import { HppSummaryCard } from './HppSummaryCard';
import { OpexSummaryCard } from './OpexSummaryCard';
import { QuickRatioAnalysis } from './QuickRatioAnalysis';

export const CostOverview: React.FC<CostOverviewProps> = ({
  profitData,
  calculations,
  isMobile,
  className
}) => {
  const { profitMarginData, cogsBreakdown, opexBreakdown } = profitData;
  const { costAnalysis, opexComposition, costStructureAnalysis } = calculations;

  return (
    <TabsContent value="overview" className={cn("mt-6", isMobile && "mt-4", className)}>
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
    </TabsContent>
  );
};