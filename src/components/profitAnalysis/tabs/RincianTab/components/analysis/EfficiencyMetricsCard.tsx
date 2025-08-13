// src/components/profitAnalysis/tabs/rincianTab/components/analysis/EfficiencyMetricsCard.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { EfficiencyMetricsCardProps } from '../../types/components';
import { formatRatio, formatPercentage } from '../../utils/formatters';
import { SECTION_TITLES } from '../../constants/messages';

export const EfficiencyMetricsCard: React.FC<EfficiencyMetricsCardProps> = ({
  efficiencyMetrics,
  costAnalysis,
  isMobile
}) => {
  return (
    <Card>
      <CardHeader className={cn("p-4", isMobile && "p-3")}>
        <CardTitle className={cn(isMobile && "text-base")}>
          📊 {SECTION_TITLES.EFFICIENCY_METRICS}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("p-4", isMobile && "p-3")}>
        <div className={cn("grid grid-cols-1 gap-4", !isMobile && "md:grid-cols-3")}>
          
          {/* Revenue Efficiency */}
          <div>
            <h5 className={cn("font-medium mb-3", isMobile && "text-sm mb-2")}>
              Efisiensi Revenue
            </h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Revenue per Total Cost:</span>
                <span className={cn(
                  "font-medium",
                  efficiencyMetrics.revenuePerCost >= 1.2 ? "text-green-600" : "text-red-600"
                )}>
                  {formatRatio(efficiencyMetrics.revenuePerCost)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Revenue per COGS:</span>
                <span className={cn(
                  "font-medium",
                  efficiencyMetrics.cogsEfficiency >= 1.4 ? "text-green-600" : "text-red-600"
                )}>
                  {formatRatio(efficiencyMetrics.cogsEfficiency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Revenue per OPEX:</span>
                <span className={cn(
                  "font-medium",
                  efficiencyMetrics.opexEfficiency >= 5.0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatRatio(efficiencyMetrics.opexEfficiency)}
                </span>
              </div>
            </div>
          </div>

          {/* Component Efficiency */}
          <div>
            <h5 className={cn("font-medium mb-3", isMobile && "text-sm mb-2")}>
              Efisiensi Komponen
            </h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Revenue per Material:</span>
                <span className={cn(
                  "font-medium",
                  efficiencyMetrics.materialEfficiency >= 2.5 ? "text-green-600" : "text-red-600"
                )}>
                  {formatRatio(efficiencyMetrics.materialEfficiency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Revenue per Labor:</span>
                <span className={cn(
                  "font-medium",
                  efficiencyMetrics.laborEfficiency >= 5.0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatRatio(efficiencyMetrics.laborEfficiency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Overhead Rate:</span>
                <span className={cn(
                  "font-medium",
                  efficiencyMetrics.overheadRate <= 25 ? "text-green-600" : "text-red-600"
                )}>
                  {formatPercentage(efficiencyMetrics.overheadRate)}
                </span>
              </div>
            </div>
          </div>

          {/* Target vs Actual */}
          <div>
            <h5 className={cn("font-medium mb-3", isMobile && "text-sm mb-2")}>
              Target vs Aktual
            </h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Material Target:</span>
                <span className={cn(
                  "font-medium",
                  costAnalysis.materialRatio <= 40 ? "text-green-600" : "text-red-600"
                )}>
                  {"<"}40% vs {formatPercentage(costAnalysis.materialRatio)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>COGS Target:</span>
                <span className={cn(
                  "font-medium",
                  costAnalysis.cogsRatio <= 70 ? "text-green-600" : "text-red-600"
                )}>
                  {"<"}70% vs {formatPercentage(costAnalysis.cogsRatio)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>OPEX Target:</span>
                <span className={cn(
                  "font-medium",
                  costAnalysis.opexRatio <= 20 ? "text-green-600" : "text-red-600"
                )}>
                  {"<"}20% vs {formatPercentage(costAnalysis.opexRatio)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Efficiency Summary */}
        <div className={cn("mt-4 p-3 bg-blue-50 rounded", isMobile && "mt-3")}>
          <h5 className={cn("font-medium text-blue-800 mb-2", isMobile && "text-sm")}>
            📈 Efficiency Summary
          </h5>
          <div className={cn("grid grid-cols-2 gap-4 text-xs", !isMobile && "md:grid-cols-4")}>
            <div>
              <span className="text-blue-600">Cost Control:</span>
              <p className={cn(
                "font-medium",
                efficiencyMetrics.revenuePerCost >= 1.2 ? "text-green-600" : "text-red-600"
              )}>
                {efficiencyMetrics.revenuePerCost >= 1.2 ? 'Good' : 'Needs Improvement'}
              </p>
            </div>
            <div>
              <span className="text-blue-600">Material Efficiency:</span>
              <p className={cn(
                "font-medium",
                costAnalysis.materialRatio <= 40 ? "text-green-600" : "text-red-600"
              )}>
                {costAnalysis.materialRatio <= 40 ? 'Optimal' : 'High'}
              </p>
            </div>
            <div>
              <span className="text-blue-600">Labor Productivity:</span>
              <p className={cn(
                "font-medium",
                efficiencyMetrics.laborEfficiency >= 5.0 ? "text-green-600" : "text-red-600"
              )}>
                {efficiencyMetrics.laborEfficiency >= 5.0 ? 'Productive' : 'Low'}
              </p>
            </div>
            <div>
              <span className="text-blue-600">Overall Score:</span>
              <p className={cn(
                "font-medium",
                (efficiencyMetrics.revenuePerCost >= 1.2 && 
                 costAnalysis.materialRatio <= 40 && 
                 costAnalysis.opexRatio <= 20) ? "text-green-600" : "text-yellow-600"
              )}>
                {(efficiencyMetrics.revenuePerCost >= 1.2 && 
                  costAnalysis.materialRatio <= 40 && 
                  costAnalysis.opexRatio <= 20) ? 'Excellent' : 'Fair'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};