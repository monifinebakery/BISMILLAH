// src/components/profitAnalysis/components/tabs/WawasanTabContent.tsx

import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import AdvancedMetricsSection, { AdvancedMetricsData } from '../sections/AdvancedMetricsSection';
import CompetitiveBenchmarkSection, { BenchmarkData } from '../sections/CompetitiveBenchmarkSection';

// Import F&B insights component
const FNBInsights = React.lazy(() => import('../FNBInsights'));

// ==============================================
// TYPES
// ==============================================

export interface WawasanTabContentProps {
  currentAnalysis: any;
  previousAnalysis: any;
  isLoading: boolean;
  effectiveCogs?: number;
  hppBreakdown?: any[];
  advancedMetrics?: AdvancedMetricsData | null;
  benchmark?: BenchmarkData | null;
}

// ==============================================
// COMPONENT
// ==============================================

const WawasanTabContent: React.FC<WawasanTabContentProps> = ({
  currentAnalysis,
  previousAnalysis,
  isLoading,
  effectiveCogs,
  hppBreakdown = [],
  advancedMetrics,
  benchmark
}) => {
  return (
    <TabsContent value="wawasan" className="space-y-4 sm:space-y-6 mt-6">
      {/* F&B INSIGHTS - Smart recommendations for warung */}
      <React.Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg" />}>
        <FNBInsights 
          currentAnalysis={currentAnalysis}
          previousAnalysis={previousAnalysis}
          effectiveCogs={effectiveCogs ?? currentAnalysis?.cogs_data?.total ?? 0}
          hppBreakdown={hppBreakdown}
        />
      </React.Suspense>
      
      {/* Advanced Metrics */}
      <AdvancedMetricsSection 
        data={advancedMetrics}
        isLoading={isLoading}
      />

      {/* Competitive Benchmark */}
      <CompetitiveBenchmarkSection 
        data={benchmark}
        isLoading={isLoading}
      />
    </TabsContent>
  );
};

export default WawasanTabContent;
