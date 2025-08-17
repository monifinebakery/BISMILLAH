// src/components/profitAnalysis/components/tabs/IkhtisarTabContent.tsx

import React from 'react';
import { TabsContent } from '@/components/ui/tabs';

// Use lazy wrappers to keep code-splitting without mixing imports
import ProfitBreakdownChart from '../lazy/LazyProfitBreakdownChart';
import ProfitTrendChart from '../lazy/LazyProfitTrendChart';

// ==============================================
// TYPES
// ==============================================

export interface IkhtisarTabContentProps {
  currentAnalysis: any;
  profitHistory: any[];
  isLoading: boolean;
  selectedChartType: string;
  effectiveCogs?: number;
  labels?: { hppLabel: string; hppHint: string };
}

// ==============================================
// COMPONENT
// ==============================================

const IkhtisarTabContent: React.FC<IkhtisarTabContentProps> = ({
  currentAnalysis,
  profitHistory,
  isLoading,
  selectedChartType,
  effectiveCogs,
  labels
}) => {
  return (
    <TabsContent value="ikhtisar" className="space-y-4 sm:space-y-6 mt-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <React.Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg" />}>
          <ProfitBreakdownChart 
            currentAnalysis={currentAnalysis} 
            isLoading={isLoading} 
            chartType={selectedChartType} 
            // Use effective COGS with fallback
            effectiveCogs={effectiveCogs ?? currentAnalysis?.cogs_data?.total ?? 0}
            labels={labels}
          />
        </React.Suspense>

        <React.Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg" />}>
          <ProfitTrendChart
            profitHistory={profitHistory}
            isLoading={isLoading}
            chartType="line"
            showMetrics={['revenue', 'grossProfit', 'netProfit']}
            // Add effective COGS and labels with fallback
            effectiveCogs={effectiveCogs ?? currentAnalysis?.cogs_data?.total ?? 0}
            labels={labels}
          />
        </React.Suspense>
      </div>
    </TabsContent>
  );
};

export default IkhtisarTabContent;
