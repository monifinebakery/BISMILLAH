// src/components/profitAnalysis/tabs/rincianTab/index.tsx

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs } from '@/components/ui/tabs';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

// Import types
import { ProfitAnalysisResult } from '../types';

// Import hooks
import { useRincianCalculations } from './hooks/useRincianCalculations';

// Import components
import { DataQualityIndicator } from './components/DataQualityIndicator';
import { TabNavigation } from './components/TabNavigation';
import { CostOverview } from './components/overview/CostOverview';
import { CogsDetailTab } from './components/cogsDetail/CogsDetailTab';
import { OpexDetailTab } from './components/opexDetail/OpexDetailTab';
import { AnalysisTab } from './components/analysis/AnalysisTab';

// Import constants
import { SECTION_TITLES, EMPTY_STATE } from './constants/messages';

interface RincianTabProps {
  profitData: ProfitAnalysisResult;
  className?: string;
}

export const RincianTab: React.FC<RincianTabProps> = ({ 
  profitData,
  className 
}) => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('overview');
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);

  // Calculate all rincian data
  const calculations = useRincianCalculations(profitData);

  // Validate data
  if (!profitData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">{EMPTY_STATE.title}</p>
          <p className="text-sm text-gray-400 mt-1">{EMPTY_STATE.description}</p>
        </div>
      </div>
    );
  }

  if (!calculations) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Error dalam perhitungan data</p>
          <p className="text-sm text-gray-400 mt-1">Silakan periksa kembali data input</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", isMobile && "space-y-4", className)}>
      {/* Data Quality Indicator */}
      <DataQualityIndicator
        profitData={profitData}
        dataQuality={calculations.dataQuality}
        showDetailedBreakdown={showDetailedBreakdown}
        onToggleDetailed={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
        isMobile={isMobile}
      />

      {/* Main Content Card with Tabs */}
      <Card>
        <CardHeader className={cn("p-4", isMobile && "p-3")}>
          <CardTitle className={cn(isMobile && "text-base")}>
            📊 {SECTION_TITLES.COST_ANALYSIS}
          </CardTitle>
        </CardHeader>
        <CardContent className={cn("p-4", isMobile && "p-3")}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Tab Navigation */}
            <TabNavigation
              activeTab={activeTab}
              onTabChange={setActiveTab}
              isMobile={isMobile}
            />

            {/* Tab Content */}
            <CostOverview
              profitData={profitData}
              calculations={calculations}
              isMobile={isMobile}
            />

            <CogsDetailTab
              profitData={profitData}
              calculations={calculations}
              showDetailedBreakdown={showDetailedBreakdown}
              isMobile={isMobile}
            />

            <OpexDetailTab
              profitData={profitData}
              calculations={calculations}
              isMobile={isMobile}
            />

            <AnalysisTab
              profitData={profitData}
              calculations={calculations}
              isMobile={isMobile}
            />

          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};