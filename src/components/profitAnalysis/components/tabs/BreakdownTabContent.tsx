// src/components/profitAnalysis/components/tabs/BreakdownTabContent.tsx

import React from 'react';
import { TabsContent } from '@/components/ui/tabs';

// Import breakdown table component
const DetailedBreakdownTable = React.lazy(() => import('../DetailedBreakdownTable'));

// ==============================================
// TYPES
// ==============================================

export interface BreakdownTabContentProps {
  currentAnalysis: any;
  isLoading: boolean;
  effectiveCogs?: number;
  hppBreakdown?: any[];
  labels?: { hppLabel: string; hppHint: string };
}

// ==============================================
// COMPONENT
// ==============================================

const BreakdownTabContent: React.FC<BreakdownTabContentProps> = ({
  currentAnalysis,
  isLoading,
  effectiveCogs,
  hppBreakdown = [],
  labels
}) => {
  return (
    <TabsContent value="breakdown" className="space-y-4 sm:space-y-6 mt-6">
      <React.Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-lg" />}>
        <DetailedBreakdownTable 
          currentAnalysis={currentAnalysis} 
          isLoading={isLoading} 
          showExport={true} 
          // HPP total & breakdown WAC with fallback
          effectiveCogs={effectiveCogs ?? currentAnalysis?.cogs_data?.total ?? 0}
          hppBreakdown={hppBreakdown}
          labels={labels}
        />
      </React.Suspense>
    </TabsContent>
  );
};

export default BreakdownTabContent;
