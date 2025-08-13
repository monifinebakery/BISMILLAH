// src/components/profitAnalysis/tabs/rincianTab/components/overview/QuickRatioAnalysis.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { QuickRatioAnalysisProps, MetricCardData } from '../../types/components';
import { formatPercentage } from '../../utils/formatters';
import { getStatusColors } from '../../utils/targetAnalysis';
import { ANALYSIS_TARGETS } from '../../constants/targets';
import { SECTION_TITLES } from '../../constants/messages';

export const QuickRatioAnalysis: React.FC<QuickRatioAnalysisProps> = ({
  costAnalysis,
  costStructureAnalysis,
  isMobile,
  className
}) => {
  // Create metric cards data
  const metrics: MetricCardData[] = [
    {
      label: 'Material vs Revenue',
      value: costAnalysis.materialRatio,
      target: ANALYSIS_TARGETS.MATERIAL.target,
      unit: '%',
      status: costStructureAnalysis.material.status,
      color: costStructureAnalysis.material.color
    },
    {
      label: 'Labor vs Revenue',
      value: costAnalysis.laborRatio,
      target: ANALYSIS_TARGETS.LABOR.target,
      unit: '%',
      status: costStructureAnalysis.labor.status,
      color: costStructureAnalysis.labor.color
    },
    {
      label: 'COGS vs Revenue',
      value: costAnalysis.cogsRatio,
      target: ANALYSIS_TARGETS.COGS.target,
      unit: '%',
      status: costStructureAnalysis.cogs.status,
      color: costStructureAnalysis.cogs.color
    },
    {
      label: 'OPEX vs Revenue',
      value: costAnalysis.opexRatio,
      target: ANALYSIS_TARGETS.OPEX.target,
      unit: '%',
      status: costStructureAnalysis.opex.status,
      color: costStructureAnalysis.opex.color
    }
  ];

  return (
    <Card className={className}>
      <CardHeader className={cn("p-4", isMobile && "p-3")}>
        <CardTitle className={cn(isMobile && "text-base")}>⚡ {SECTION_TITLES.QUICK_RATIO}</CardTitle>
      </CardHeader>
      <CardContent className={cn("p-4", isMobile && "p-3")}>
        <div className={cn("grid grid-cols-2 gap-4", !isMobile && "md:grid-cols-4")}>
          {metrics.map((metric, index) => {
            const colors = getStatusColors(metric.color);
            const StatusIcon = costStructureAnalysis[
              index === 0 ? 'material' : 
              index === 1 ? 'labor' : 
              index === 2 ? 'cogs' : 'opex'
            ].icon;

            return (
              <div 
                key={index} 
                className={cn(
                  "p-3 rounded border-l-4",
                  colors.bg,
                  colors.border
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <StatusIcon className={cn(
                    "h-4 w-4",
                    colors.icon,
                    isMobile && "h-3 w-3"
                  )} />
                  <span className={cn(
                    "text-xs font-medium",
                    isMobile && "text-[0.65rem]"
                  )}>
                    {metric.label}
                  </span>
                </div>
                
                <p className={cn("text-lg font-bold", isMobile && "text-base")}>
                  {formatPercentage(metric.value)}
                </p>
                
                <p className={cn("text-xs text-gray-500", isMobile && "text-[0.65rem]")}>
                  Target: {formatPercentage(metric.target)}
                </p>
                
                {/* Variance indicator */}
                <div className={cn("mt-1 flex items-center gap-1", isMobile && "mt-0.5")}>
                  <div className={cn(
                    "text-xs font-medium",
                    metric.value <= metric.target ? colors.text : "text-red-600",
                    isMobile && "text-[0.65rem]"
                  )}>
                    {metric.value > metric.target ? '+' : ''}
                    {formatPercentage(metric.value - metric.target)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Overall Health Score */}
        <div className={cn("mt-4 p-3 bg-gray-50 rounded", isMobile && "mt-3")}>
          <div className="flex justify-between items-center">
            <span className={cn("font-medium text-gray-800", isMobile && "text-sm")}>
              Overall Health Score:
            </span>
            <div className="flex items-center gap-2">
              <div className={cn(
                "px-3 py-1 rounded font-bold",
                costStructureAnalysis.overall.healthScore >= 80 ? "bg-green-100 text-green-800" :
                costStructureAnalysis.overall.healthScore >= 60 ? "bg-yellow-100 text-yellow-800" :
                "bg-red-100 text-red-800",
                isMobile && "px-2 py-0.5 text-sm"
              )}>
                {costStructureAnalysis.overall.healthScore}%
              </div>
            </div>
          </div>
          
          {/* Critical Issues Summary */}
          {costStructureAnalysis.overall.criticalIssues.length > 0 && (
            <div className={cn("mt-2 text-xs text-gray-600", isMobile && "text-[0.65rem]")}>
              <span className="font-medium">Issues: </span>
              {costStructureAnalysis.overall.criticalIssues.slice(0, 2).map((issue, index) => (
                <span key={index} className={cn(
                  "mr-2",
                  issue.severity === 'critical' ? 'text-red-600' :
                  issue.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                )}>
                  {issue.severity === 'critical' ? '🚨' : 
                   issue.severity === 'warning' ? '⚠️' : 'ℹ️'} {issue.name}
                </span>
              ))}
              {costStructureAnalysis.overall.criticalIssues.length > 2 && (
                <span className="text-gray-500">
                  +{costStructureAnalysis.overall.criticalIssues.length - 2} more
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};