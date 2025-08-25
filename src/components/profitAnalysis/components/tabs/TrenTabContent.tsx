// src/components/profitAnalysis/components/tabs/TrenTabContent.tsx

import React, { useState } from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BarChart3, LineChart, Activity } from 'lucide-react';

// Use the new simple chart
import { ProfitChart } from '../../ProfitChart';

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
      <ProfitChart
        profitHistory={profitHistory}
        isLoading={isLoading}
        effectiveCogs={effectiveCogs ?? 0}
        labels={labels}
        className="w-full"
      />
    </TabsContent>
  );
};

export default TrenTabContent;
