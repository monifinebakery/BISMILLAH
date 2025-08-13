// src/components/profitAnalysis/tabs/RincianTab.tsx

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Import from RincianTab folder
import {
  CostOverview,
  OpexDetailTab,
  CogsDetailTab,
  AnalysisTab,
  useRincianCalculations,
  type BaseRincianProps
} from './RincianTab';

interface RincianTabProps extends BaseRincianProps {
  className?: string;
}

export const RincianTab: React.FC<RincianTabProps> = ({
  profitData,
  calculations,
  isMobile,
  className
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  // Use calculations hook
  const rincianCalculations = useRincianCalculations({
    profitData,
    calculations
  });

  return (
    <div className={cn("w-full", className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={cn(
          "grid w-full",
          isMobile ? "grid-cols-2" : "grid-cols-4",
          isMobile && "h-auto"
        )}>
          <TabsTrigger 
            value="overview" 
            className={cn(isMobile && "text-xs py-2")}
          >
            {isMobile ? "Overview" : "Ringkasan Biaya"}
          </TabsTrigger>
          <TabsTrigger 
            value="cogs" 
            className={cn(isMobile && "text-xs py-2")}
          >
            {isMobile ? "COGS" : "Detail HPP"}
          </TabsTrigger>
          <TabsTrigger 
            value="opex" 
            className={cn(isMobile && "text-xs py-2")}
          >
            {isMobile ? "OPEX" : "Detail OPEX"}
          </TabsTrigger>
          <TabsTrigger 
            value="analysis" 
            className={cn(isMobile && "text-xs py-2")}
          >
            {isMobile ? "Analisis" : "Analisis & Target"}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className={cn("mt-6", isMobile && "mt-4")}>
          <CostOverview
            profitData={profitData}
            calculations={rincianCalculations}
            isMobile={isMobile}
          />
        </TabsContent>

        {/* COGS Detail Tab */}
        <CogsDetailTab
          profitData={profitData}
          calculations={rincianCalculations}
          isMobile={isMobile}
        />

        {/* OPEX Detail Tab */}
        <OpexDetailTab
          profitData={profitData}
          calculations={rincianCalculations}
          isMobile={isMobile}
        />

        {/* Analysis Tab */}
        <AnalysisTab
          profitData={profitData}
          calculations={rincianCalculations}
          isMobile={isMobile}
        />
      </Tabs>
    </div>
  );
};