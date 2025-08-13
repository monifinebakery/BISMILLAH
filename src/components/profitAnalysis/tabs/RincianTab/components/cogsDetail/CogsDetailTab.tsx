// src/components/profitAnalysis/tabs/rincianTab/components/cogsDetail/CogsDetailTab.tsx

import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import { CogsDetailTabProps } from '../../types/components';
import { MaterialCostsCard } from './MaterialCostsCard';
import { LaborCostsCard } from './LaborCostsCard';
import { MaterialUsageAnalytics } from './MaterialUsageAnalytics';
import { hasDetailedMaterialCosts, hasDetailedLaborCosts } from '../../utils/validators';

export const CogsDetailTab: React.FC<CogsDetailTabProps> = ({
  profitData,
  calculations,
  showDetailedBreakdown,
  isMobile,
  className
}) => {
  const { cogsBreakdown } = profitData;
  const { costAnalysis, materialUsageStats } = calculations;

  return (
    <TabsContent value="cogs" className={cn("mt-6", isMobile && "mt-4", className)}>
      <div className={cn("grid grid-cols-1 gap-6", !isMobile && "lg:grid-cols-2")}>
        
        {/* Material Costs Detail */}
        {hasDetailedMaterialCosts(profitData) && (
          <MaterialCostsCard
            materialCosts={cogsBreakdown.materialCosts!}
            totalMaterialCost={cogsBreakdown.totalMaterialCost}
            costAnalysis={costAnalysis}
            isMobile={isMobile}
          />
        )}

        {/* Labor Costs Detail */}
        {hasDetailedLaborCosts(profitData) && (
          <LaborCostsCard
            directLaborCosts={cogsBreakdown.directLaborCosts!}
            totalDirectLaborCost={cogsBreakdown.totalDirectLaborCost}
            costAnalysis={costAnalysis}
            isMobile={isMobile}
          />
        )}
      </div>

      {/* Material Usage Analytics (if detailed view is enabled and data is available) */}
      {showDetailedBreakdown && materialUsageStats && (
        <MaterialUsageAnalytics
          materialUsageStats={materialUsageStats}
          isMobile={isMobile}
        />
      )}

      {/* No Detail Available Message */}
      {!hasDetailedMaterialCosts(profitData) && !hasDetailedLaborCosts(profitData) && (
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="text-gray-400 mb-2">📊</div>
            <p className="text-gray-500 font-medium">Detail HPP Tidak Tersedia</p>
            <p className="text-sm text-gray-400 mt-1">
              Data detail material dan labor costs belum diinput
            </p>
          </div>
        </div>
      )}
    </TabsContent>
  );
};