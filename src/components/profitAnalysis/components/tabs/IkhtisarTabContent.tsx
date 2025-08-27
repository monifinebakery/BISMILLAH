// src/components/profitAnalysis/components/tabs/IkhtisarTabContent.tsx

import React from 'react';
import { TabsContent } from '@/components/ui/tabs';

// Use new components
import ProfitBreakdownChart from '../lazy/LazyProfitBreakdownChart';
import { MarginAnalysis } from '../../MarginAnalysis';

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
        <React.Suspense fallback={<div className="animate-pulse bg-gray-300 h-64 rounded-lg" />}>
          <ProfitBreakdownChart 
            currentAnalysis={currentAnalysis} 
            isLoading={isLoading} 
            chartType={selectedChartType} 
            // Use effective COGS with fallback
            effectiveCogs={effectiveCogs ?? currentAnalysis?.cogs_data?.total ?? 0}
            labels={labels}
          />
        </React.Suspense>

        <MarginAnalysis
          currentAnalysis={currentAnalysis}
          isLoading={isLoading}
          effectiveCogs={effectiveCogs ?? currentAnalysis?.cogs_data?.total ?? 0}
          labels={labels}
        />
      </div>
    </TabsContent>
  );
};

export default IkhtisarTabContent;
