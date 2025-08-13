// src/components/profitAnalysis/tabs/rincianTab/components/analysis/TargetVsActualCards.tsx

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { TargetVsActualCardsProps } from '../../types/components';
import { formatPercentage, formatCurrency } from '../../utils/formatters';
import { SECTION_TITLES, STATUS_MESSAGES } from '../../constants/messages';
import { CARD_COLORS } from '../../constants/colors';

export const TargetVsActualCards: React.FC<TargetVsActualCardsProps> = ({
  costStructureAnalysis,
  profitMarginData,
  opexBreakdown,
  costAnalysis,
  isMobile
}) => {
  return (
    <div className={cn("grid grid-cols-1 gap-4", !isMobile && "md:grid-cols-3")}>
      
      {/* Target HPP Card */}
      <Card className={cn("border-l-4", CARD_COLORS.HPP.border, CARD_COLORS.HPP.bg)}>
        <CardContent className={cn("p-4", isMobile && "p-3")}>
          <h5 className={cn("font-medium mb-2", CARD_COLORS.HPP.textDark, isMobile && "text-sm")}>
            🎯 {SECTION_TITLES.TARGET_HPP}
          </h5>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Target:</span>
              <span className="font-medium">{"<"}70%</span>
            </div>
            <div className="flex justify-between">
              <span>Aktual:</span>
              <span className={cn(
                "font-medium",
                costAnalysis.cogsRatio < 70 ? "text-green-600" : "text-red-600"
              )}>
                {formatPercentage(costAnalysis.cogsRatio)}
              </span>
            </div>
            <div className="text-xs text-gray-600 mt-2">
              {costAnalysis.cogsRatio < 70 
                ? STATUS_MESSAGES.ON_TARGET.hpp
                : STATUS_MESSAGES.ABOVE_TARGET.hpp}
            </div>
            
            {/* Material vs Labor breakdown */}
            <div className="bg-white p-2 rounded mt-2">
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Material:</span>
                  <span className={cn(
                    "font-medium",
                    costAnalysis.materialRatio <= 40 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatPercentage(costAnalysis.materialRatio)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Labor:</span>
                  <span className={cn(
                    "font-medium",
                    costAnalysis.laborRatio <= 15 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatPercentage(costAnalysis.laborRatio)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Overhead:</span>
                  <span className={cn(
                    "font-medium",
                    costAnalysis.overheadRatio <= 15 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatPercentage(costAnalysis.overheadRatio)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Target OPEX Card */}
      <Card className={cn("border-l-4", CARD_COLORS.OPEX.border, CARD_COLORS.OPEX.bg)}>
        <CardContent className={cn("p-4", isMobile && "p-3")}>
          <h5 className={cn("font-medium mb-2", CARD_COLORS.OPEX.textDark, isMobile && "text-sm")}>
            🎯 {SECTION_TITLES.TARGET_OPEX}
          </h5>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Target:</span>
              <span className="font-medium">{"<"}20%</span>
            </div>
            <div className="flex justify-between">
              <span>Aktual:</span>
              <span className={cn(
                "font-medium",
                costAnalysis.opexRatio < 20 ? "text-green-600" : "text-purple-600"
              )}>
                {formatPercentage(costAnalysis.opexRatio)}
              </span>
            </div>
            <div className="text-xs text-gray-600 mt-2">
              {costAnalysis.opexRatio < 20 
                ? STATUS_MESSAGES.ON_TARGET.opex
                : STATUS_MESSAGES.ABOVE_TARGET.opex}
            </div>
            
            {/* OPEX breakdown */}
            <div className="bg-white p-2 rounded mt-2">
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Admin:</span>
                  <span className="font-medium">
                    {formatPercentage((opexBreakdown.totalAdministrative / profitMarginData.revenue) * 100)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Selling:</span>
                  <span className="font-medium">
                    {formatPercentage((opexBreakdown.totalSelling / profitMarginData.revenue) * 100)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>General:</span>
                  <span className="font-medium">
                    {formatPercentage((opexBreakdown.totalGeneral / profitMarginData.revenue) * 100)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Target Margin Card */}
      <Card className={cn("border-l-4", CARD_COLORS.SUCCESS.border, CARD_COLORS.SUCCESS.bg)}>
        <CardContent className={cn("p-4", isMobile && "p-3")}>
          <h5 className={cn("font-medium mb-2", CARD_COLORS.SUCCESS.textDark, isMobile && "text-sm")}>
            🎯 {SECTION_TITLES.TARGET_MARGIN}
          </h5>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Target Net:</span>
              <span className="font-medium">≥10%</span>
            </div>
            <div className="flex justify-between">
              <span>Aktual:</span>
              <span className={cn(
                "font-medium",
                profitMarginData.netMargin >= 10 ? "text-green-600" : "text-orange-600"
              )}>
                {formatPercentage(profitMarginData.netMargin)}
              </span>
            </div>
            <div className="text-xs text-gray-600 mt-2">
              {profitMarginData.netMargin >= 10 
                ? STATUS_MESSAGES.ON_TARGET.margin
                : STATUS_MESSAGES.ABOVE_TARGET.margin}
            </div>
            
            {/* Margin progression */}
            <div className="bg-white p-2 rounded mt-2">
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Revenue:</span>
                  <span className="font-medium">{formatCurrency(profitMarginData.revenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gross Margin:</span>
                  <span className={cn(
                    "font-medium",
                    profitMarginData.grossMargin >= 30 ? "text-green-600" : "text-orange-600"
                  )}>
                    {formatPercentage(profitMarginData.grossMargin)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Net Profit:</span>
                  <span className={cn(
                    "font-medium",
                    profitMarginData.netProfit >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatCurrency(profitMarginData.netProfit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Margin Gap:</span>
                  <span className="font-medium text-blue-600">
                    {formatPercentage(profitMarginData.grossMargin - profitMarginData.netMargin)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};