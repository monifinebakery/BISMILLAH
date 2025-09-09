// src/components/profitAnalysis/components/tabs/BreakdownTabContent.tsx

import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { SafeSuspense } from '@/components/common/UniversalErrorBoundary';

// Use lazy wrapper to keep code-splitting without mixing imports
import DetailedBreakdownTable from '../lazy/LazyDetailedBreakdownTable';

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
      <SafeSuspense loadingMessage="Memuat tabel breakdown...">
        <DetailedBreakdownTable
          currentAnalysis={currentAnalysis}
          isLoading={isLoading}
          // HPP total & breakdown WAC with fallback
          effectiveCogs={effectiveCogs ?? currentAnalysis?.cogs_data?.total ?? 0}
          hppBreakdown={hppBreakdown}
          labels={labels}
        />
      </SafeSuspense>
    </TabsContent>
  );
};

export default BreakdownTabContent;
