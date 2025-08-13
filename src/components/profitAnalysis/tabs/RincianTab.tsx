// src/components/profitAnalysis/tabs/RincianTab.tsx

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

// Types
import { ProfitAnalysisResult } from '../types';

// ✅ Hooks: ambil dari barrel hooks
import {
  useRincianCalculations,
  useCostAnalysis,
  useEfficiencyMetrics,
  useTargetAnalysis,
} from './RincianTab/hooks';

// Components (via barrel components RincianTab)
import {
  CostOverview,
  HppSummaryCard,
  OpexSummaryCard,
  QuickRatioAnalysis,
  CogsDetailTab,
  OpexDetailTab,
  AnalysisTab,
  DataQualityIndicator,
} from './RincianTab';

interface RincianTabProps {
  profitData: ProfitAnalysisResult;
  className?: string;
}

type TabKey = 'overview' | 'cogs' | 'opex' | 'analysis';

export const RincianTab: React.FC<RincianTabProps> = ({ profitData, className }) => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Business logic hooks
  const calculations = useRincianCalculations({ profitData });
  const costAnalysis = useCostAnalysis({ profitData });
  const efficiencyMetrics = useEfficiencyMetrics({ profitData });
  const targetAnalysis = useTargetAnalysis({ profitData });

  return (
    <div className={cn('space-y-6', isMobile && 'space-y-4', className)}>
      {/* Banner/Indicator kualitas data */}
      <DataQualityIndicator profitData={profitData} />

      <Card>
        <CardHeader className={cn('p-6', isMobile && 'p-4')}>
          <CardTitle className={cn('flex items-center gap-2', isMobile && 'text-base')}>
            <Calculator className={cn('h-5 w-5', isMobile && 'h-4 w-4')} />
            Rincian Analisis Profitabilitas
          </CardTitle>
        </CardHeader>

        <CardContent className={cn('p-6', isMobile && 'p-4')}>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
            <TabsList
              className={cn('grid w-full', isMobile ? 'grid-cols-2' : 'grid-cols-4', isMobile && 'h-auto')}
            >
              <TabsTrigger value="overview" className={cn(isMobile && 'text-xs py-2')}>
                {isMobile ? 'Overview' : 'Ringkasan Biaya'}
              </TabsTrigger>
              <TabsTrigger value="cogs" className={cn(isMobile && 'text-xs py-2')}>
                {isMobile ? 'COGS' : 'Detail HPP'}
              </TabsTrigger>
              <TabsTrigger value="opex" className={cn(isMobile && 'text-xs py-2')}>
                {isMobile ? 'OPEX' : 'Detail OPEX'}
              </TabsTrigger>
              <TabsTrigger value="analysis" className={cn(isMobile && 'text-xs py-2')}>
                {isMobile ? 'Analisis' : 'Analisis & Target'}
              </TabsTrigger>
            </TabsList>

            {/* OVERVIEW */}
            <TabsContent value="overview" className={cn('mt-6', isMobile && 'mt-4')}>
              <div className={cn('space-y-6', isMobile && 'space-y-4')}>
                <CostOverview profitData={profitData} calculations={calculations} isMobile={isMobile} />
                <div className={cn('grid grid-cols-1 gap-6', !isMobile && 'lg:grid-cols-2')}>
                  <HppSummaryCard profitData={profitData} calculations={calculations} isMobile={isMobile} />
                  <OpexSummaryCard profitData={profitData} calculations={calculations} isMobile={isMobile} />
                </div>
                <QuickRatioAnalysis profitData={profitData} calculations={calculations} isMobile={isMobile} />
              </div>
            </TabsContent>

            {/* COGS */}
            <TabsContent value="cogs" className={cn('mt-6', isMobile && 'mt-4')}>
              <CogsDetailTab profitData={profitData} calculations={calculations} isMobile={isMobile} />
            </TabsContent>

            {/* OPEX */}
            <TabsContent value="opex" className={cn('mt-6', isMobile && 'mt-4')}>
              <OpexDetailTab profitData={profitData} calculations={calculations} isMobile={isMobile} />
            </TabsContent>

            {/* ANALYSIS */}
            <TabsContent value="analysis" className={cn('mt-6', isMobile && 'mt-4')}>
              <AnalysisTab
                profitData={profitData}
                calculations={calculations}
                costAnalysis={costAnalysis}
                efficiencyMetrics={efficiencyMetrics}
                targetAnalysis={targetAnalysis}
                isMobile={isMobile}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default RincianTab;
