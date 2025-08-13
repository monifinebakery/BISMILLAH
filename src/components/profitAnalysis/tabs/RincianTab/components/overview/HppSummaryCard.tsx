// src/components/profitAnalysis/tabs/rincianTab/components/overview/HppSummaryCard.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Factory } from 'lucide-react';
import { cn } from '@/lib/utils';

import { HppSummaryCardProps } from '../../types/components';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { SECTION_TITLES } from '../../constants/messages';
import { CARD_COLORS } from '../../constants/colors';

export const HppSummaryCard: React.FC<HppSummaryCardProps> = ({
  cogsBreakdown,
  costAnalysis,
  isMobile
}) => {
  const colors = CARD_COLORS.HPP;

  return (
    <Card>
      <CardHeader className={cn("p-4", isMobile && "p-3")}>
        <CardTitle className={cn("flex items-center gap-2", isMobile && "text-base")}>
          <Factory className={cn("h-5 w-5", isMobile && "h-4 w-4")} />
          {SECTION_TITLES.HPP_SUMMARY}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-4 p-4", isMobile && "space-y-3 p-3")}>
        <div className="space-y-3">
          {/* Material Cost */}
          <div className="flex justify-between items-center">
            <span className={cn("text-sm", isMobile && "text-xs")}>Biaya Material:</span>
            <div className="text-right">
              <span className={cn("font-medium", isMobile && "text-sm")}>
                {formatCurrency(cogsBreakdown.totalMaterialCost)}
              </span>
              <p className={cn("text-xs text-gray-500", isMobile && "text-[0.65rem]")}>
                {formatPercentage(costAnalysis.materialRatio)} dari revenue
              </p>
            </div>
          </div>

          {/* Direct Labor Cost */}
          <div className="flex justify-between items-center">
            <span className={cn("text-sm", isMobile && "text-xs")}>Tenaga Kerja Langsung:</span>
            <div className="text-right">
              <span className={cn("font-medium", isMobile && "text-sm")}>
                {formatCurrency(cogsBreakdown.totalDirectLaborCost)}
              </span>
              <p className={cn("text-xs text-gray-500", isMobile && "text-[0.65rem]")}>
                {formatPercentage(costAnalysis.laborRatio)} dari revenue
              </p>
            </div>
          </div>

          {/* Manufacturing Overhead */}
          <div className="flex justify-between items-center">
            <span className={cn("text-sm", isMobile && "text-xs")}>Overhead Manufaktur:</span>
            <div className="text-right">
              <span className={cn("font-medium", isMobile && "text-sm")}>
                {formatCurrency(cogsBreakdown.manufacturingOverhead)}
              </span>
              <p className={cn("text-xs text-gray-500", isMobile && "text-[0.65rem]")}>
                {formatPercentage(costAnalysis.overheadRatio)} dari revenue
              </p>
            </div>
          </div>

          <Separator />

          {/* Total COGS */}
          <div className="flex justify-between items-center font-bold">
            <span className={cn(isMobile && "text-sm")}>Total HPP:</span>
            <div className="text-right">
              <span className={cn(isMobile && "text-sm")}>
                {formatCurrency(cogsBreakdown.totalCOGS)}
              </span>
              <p className={cn("text-xs text-gray-500 font-normal", isMobile && "text-[0.65rem]")}>
                {formatPercentage(costAnalysis.cogsRatio)} dari revenue
              </p>
            </div>
          </div>
        </div>

        {/* Data Quality & Method Indicator */}
        <div className={cn(
          "p-3 rounded border-l-4",
          cogsBreakdown.dataSource === 'actual' ? "bg-green-50 border-green-500" :
          cogsBreakdown.dataSource === 'mixed' ? "bg-yellow-50 border-yellow-500" :
          "bg-orange-50 border-orange-500"
        )}>
          <h5 className={cn("font-medium mb-2", isMobile && "text-sm")}>
            📊 Metode & Akurasi
          </h5>
          <div className="space-y-1 text-xs">
            <p>
              Alokasi: <strong>{cogsBreakdown.overheadAllocationMethod || 'Standard'}</strong>
            </p>
            <p>
              Data Source: <strong>
                {cogsBreakdown.dataSource === 'actual' ? 'Aktual' :
                 cogsBreakdown.dataSource === 'mixed' ? 'Campuran' : 'Estimasi'}
              </strong>
            </p>
            {cogsBreakdown.materialCosts?.length && (
              <p>
                Materials tracked: <strong>{cogsBreakdown.materialCosts.length}</strong>
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};