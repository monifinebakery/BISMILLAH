// src/components/profitAnalysis/components/tabs/TrenTabContent.tsx

import React from 'react';
import { TabsContent } from '@/components/ui/tabs';

// Import chart component
const ProfitTrendChart = React.lazy(() => import('../ProfitTrendChart'));

// ==============================================
// TYPES
// ==============================================

export interface TrenTabContentProps {
  profitHistory: any[];
  isLoading: boolean;
  effectiveCogs?: number;
  labels?: { hppLabel: string; hppHint: string };
}

// ==============================================
// COMPONENT
// ==============================================

const TrenTabContent: React.FC<TrenTabContentProps> = ({
  profitHistory,
  isLoading,
  effectiveCogs,
  labels
}) => {
  return (
    <TabsContent value="tren" className="space-y-4 sm:space-y-6 mt-6">
      <React.Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-lg" />}>
        <ProfitTrendChart
          profitHistory={profitHistory}
          isLoading={isLoading}
          chartType="area"
          showMetrics={['revenue', 'grossProfit', 'netProfit', 'cogs', 'opex']}
          // Add effective COGS and labels with fallback
          effectiveCogs={effectiveCogs ?? 0}
          labels={labels}
        />
      </React.Suspense>
    </TabsContent>
  );
};

export default TrenTabContent;
