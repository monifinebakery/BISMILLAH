// src/components/profitAnalysis/tabs/PerbandinganTab/components/Benchmarks/CostRatiosAnalysis.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Factory } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ProfitAnalysisResult, StatusResult } from '../../types';
import { formatPercentage, getBadgeVariant, INDUSTRY_TARGETS } from '../../utils';

interface CostRatiosAnalysisProps {
  profitData: ProfitAnalysisResult;
  ratioStatuses: {
    material: StatusResult;
    labor: StatusResult;
    cogs: StatusResult;
    opex: StatusResult;
  };
  materialEfficiency: number;
}

export const CostRatiosAnalysis: React.FC<CostRatiosAnalysisProps> = ({
  profitData,
  ratioStatuses,
  materialEfficiency
}) => {
  const isMobile = useIsMobile();

  const ratios = {
    'Material Cost': {
      value: (profitData.cogsBreakdown.totalMaterialCost / profitData.profitMarginData.revenue) * 100,
      target: INDUSTRY_TARGETS.materialCost,
      status: ratioStatuses.material
    },
    'Labor Cost': {
      value: (profitData.cogsBreakdown.totalDirectLaborCost / profitData.profitMarginData.revenue) * 100,
      target: INDUSTRY_TARGETS.laborCost,
      status: ratioStatuses.labor
    },
    'Total COGS': {
      value: (profitData.cogsBreakdown.totalCOGS / profitData.profitMarginData.revenue) * 100,
      target: INDUSTRY_TARGETS.totalCOGS,
      status: ratioStatuses.cogs
    },
    'OPEX': {
      value: (profitData.opexBreakdown.totalOPEX / profitData.profitMarginData.revenue) * 100,
      target: INDUSTRY_TARGETS.opex,
      status: ratioStatuses.opex
    }
  };

  return (
    <Card>
      <CardHeader className={cn("p-4", isMobile && "p-3")}>
        <CardTitle className={cn("flex items-center gap-2", isMobile && "text-base")}>
          <Factory className={cn("h-5 w-5", isMobile && "h-4 w-4")} />
          Rasio Biaya vs Industri
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-4 p-4", isMobile && "space-y-3 p-3")}>
        {Object.entries(ratios).map(([key, data]) => (
          <div key={key}>
            <div className={cn("flex justify-between items-center mb-2", isMobile && "mb-1")}>
              <span className={cn("text-sm font-medium", isMobile && "text-xs")}>{key}</span>
              <div className="text-right">
                <span className={cn("text-sm font-bold", isMobile && "text-xs")}>
                  {formatPercentage(data.value)}
                </span>
                <Badge 
                  variant={getBadgeVariant(data.status.color)}
                  className={cn("ml-2 text-xs", isMobile && "text-[0.65rem]")}
                >
                  {data.status.status}
                </Badge>
              </div>
            </div>
            <Progress 
              value={Math.min(data.value, 100)} 
              max={100}
              className={cn("h-2", isMobile && "h-1.5")} 
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Target: {data.target}%</span>
              <span>
                {data.value <= data.target ? 
                  `✅ ${(data.target - data.value).toFixed(1)}% di bawah target` : 
                  `⚠️ ${(data.value - data.target).toFixed(1)}% di atas target`
                }
              </span>
            </div>
          </div>
        ))}

        {/* Material Efficiency Indicator */}
        <div className="bg-blue-50 p-3 rounded mt-4">
          <h5 className={cn("font-medium text-blue-800 mb-2", isMobile && "text-sm")}>
            📊 Material Efficiency Score
          </h5>
          <div className="flex items-center justify-between">
            <span className={cn("text-sm", isMobile && "text-xs")}>
              Based on data quality & usage tracking
            </span>
            <div className="text-right">
              <span className={cn("text-lg font-bold text-blue-700", isMobile && "text-base")}>
                {materialEfficiency}%
              </span>
              <Progress 
                value={materialEfficiency} 
                className="w-20 h-2 mt-1" 
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};