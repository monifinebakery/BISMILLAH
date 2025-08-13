// src/components/profitAnalysis/tabs/rincianTab/components/analysis/ActionItemsCard.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { ActionItemsCardProps } from '../../types/components';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { SECTION_TITLES } from '../../constants/messages';

export const ActionItemsCard: React.FC<ActionItemsCardProps> = ({
  profitData,
  costAnalysis,
  costStructureAnalysis,
  isMobile
}) => {
  const { profitMarginData, cogsBreakdown, opexBreakdown } = profitData;

  // Generate dynamic action items based on analysis
  const generateActionItems = () => {
    const items = [];

    // Critical issues first
    if (costAnalysis.materialRatio > 50) {
      items.push({
        priority: 'critical',
        title: '🚨 Critical: Material Cost',
        description: 'Immediate supplier review required',
        impact: `Reduce ${formatPercentage(costAnalysis.materialRatio - 40)} from revenue`
      });
    }

    if (profitMarginData.netMargin < 5) {
      items.push({
        priority: 'critical',
        title: '🚨 Critical: Low Profit',
        description: 'Urgent margin improvement needed',
        impact: `Increase margin by ${formatPercentage(10 - profitMarginData.netMargin)}`
      });
    }

    // Medium priority items
    if (cogsBreakdown.dataSource !== 'actual') {
      items.push({
        priority: 'medium',
        title: '⚠️ Medium: Data Quality',
        description: 'Implement material tracking system',
        impact: 'Improve decision making accuracy by 25%'
      });
    }

    if (costAnalysis.opexRatio > 25) {
      items.push({
        priority: 'medium',
        title: '⚠️ Medium: OPEX Control',
        description: 'Review non-essential operational costs',
        impact: `Potential savings: ${formatPercentage(costAnalysis.opexRatio - 20)} of revenue`
      });
    }

    // Target optimization
    const focusArea = costAnalysis.materialRatio > 40 ? 'Material' : 
                     costAnalysis.opexRatio > 20 ? 'OPEX' : 'Efficiency';
    
    items.push({
      priority: 'target',
      title: `🎯 Target: ${focusArea} Optimization`,
      description: `Focus on ${focusArea.toLowerCase()} optimization`,
      impact: 'Achieve industry benchmark performance'
    });

    return items;
  };

  const actionItems = generateActionItems();

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'target':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader className={cn("p-4", isMobile && "p-3")}>
        <CardTitle className={cn(isMobile && "text-base")}>
          📋 {SECTION_TITLES.ACTION_ITEMS}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("p-4", isMobile && "p-3")}>
        <div className={cn("grid grid-cols-1 gap-6", !isMobile && "md:grid-cols-2")}>
          
          {/* Cost Composition Summary */}
          <div>
            <h5 className={cn("font-medium mb-3", isMobile && "text-sm mb-2")}>
              📊 Komposisi Biaya
            </h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between p-2 bg-red-50 rounded">
                <span>HPP Total:</span>
                <span className="font-medium">{formatCurrency(cogsBreakdown.totalCOGS)}</span>
              </div>
              <div className="flex justify-between p-2 bg-purple-50 rounded">
                <span>OPEX Total:</span>
                <span className="font-medium">{formatCurrency(opexBreakdown.totalOPEX)}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span>Total Biaya:</span>
                <span className="font-medium">
                  {formatCurrency(cogsBreakdown.totalCOGS + opexBreakdown.totalOPEX)}
                </span>
              </div>
              <div className="flex justify-between p-2 bg-green-50 rounded">
                <span>Laba Bersih:</span>
                <span className={cn(
                  "font-medium",
                  profitMarginData.netProfit >= 0 ? "text-green-600" : "text-red-600"
                )}>
                  {formatCurrency(profitMarginData.netProfit)}
                </span>
              </div>
            </div>

            {/* Key Ratios */}
            <div className={cn("mt-4 p-3 bg-blue-50 rounded", isMobile && "mt-3")}>
              <h6 className={cn("font-medium text-blue-800 mb-2", isMobile && "text-sm")}>
                🔢 Key Ratios
              </h6>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Material/Revenue:</span>
                  <span className={cn(
                    "font-medium",
                    costAnalysis.materialRatio <= 40 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatPercentage(costAnalysis.materialRatio)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>COGS/Revenue:</span>
                  <span className={cn(
                    "font-medium",
                    costAnalysis.cogsRatio <= 70 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatPercentage(costAnalysis.cogsRatio)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>OPEX/Revenue:</span>
                  <span className={cn(
                    "font-medium",
                    costAnalysis.opexRatio <= 20 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatPercentage(costAnalysis.opexRatio)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Net Margin:</span>
                  <span className={cn(
                    "font-medium",
                    profitMarginData.netMargin >= 10 ? "text-green-600" : "text-red-600"
                  )}>
                    {formatPercentage(profitMarginData.netMargin)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Priority Actions */}
          <div>
            <h5 className={cn("font-medium mb-3", isMobile && "text-sm mb-2")}>
              🎯 Priority Actions
            </h5>
            <div className="space-y-2 text-sm">
              {actionItems.map((item, index) => (
                <div key={index} className={cn(
                  "p-2 rounded border",
                  getPriorityStyle(item.priority)
                )}>
                  <p className="font-medium">{item.title}</p>
                  <p className={cn("text-xs mt-1", isMobile && "text-[0.65rem]")}>
                    {item.description}
                  </p>
                  <p className={cn("text-xs mt-1 font-medium", isMobile && "text-[0.65rem]")}>
                    💡 {item.impact}
                  </p>
                </div>
              ))}
            </div>

            {/* Health Score Summary */}
            <div className={cn("mt-4 p-3 rounded", isMobile && "mt-3", 
              costStructureAnalysis.overall.healthScore >= 80 ? "bg-green-50" :
              costStructureAnalysis.overall.healthScore >= 60 ? "bg-yellow-50" : "bg-red-50"
            )}>
              <div className="flex justify-between items-center">
                <span className={cn("font-medium", isMobile && "text-sm")}>
                  Overall Health Score:
                </span>
                <span className={cn(
                  "text-lg font-bold",
                  costStructureAnalysis.overall.healthScore >= 80 ? "text-green-600" :
                  costStructureAnalysis.overall.healthScore >= 60 ? "text-yellow-600" : "text-red-600",
                  isMobile && "text-base"
                )}>
                  {costStructureAnalysis.overall.healthScore}%
                </span>
              </div>
              <p className={cn("text-xs mt-1", isMobile && "text-[0.65rem]")}>
                {costStructureAnalysis.overall.healthScore >= 80 ? 
                  "✅ Excellent cost structure performance" :
                  costStructureAnalysis.overall.healthScore >= 60 ?
                  "⚠️ Good performance with room for improvement" :
                  "🚨 Requires immediate attention and optimization"
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};