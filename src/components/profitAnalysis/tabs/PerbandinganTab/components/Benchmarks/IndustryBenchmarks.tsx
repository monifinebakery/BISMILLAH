// src/components/profitAnalysis/tabs/PerbandinganTab/components/Benchmarks/IndustryBenchmarks.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Target } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ProfitAnalysisResult, StatusResult, IndustryBenchmarks } from '../../types';
import { formatPercentage, getBadgeVariant } from '../../utils';

interface IndustryBenchmarksProps {
  profitData: ProfitAnalysisResult;
  grossMarginStatus: StatusResult;
  netMarginStatus: StatusResult;
  industryBenchmarks: IndustryBenchmarks;
}

export const IndustryBenchmarksCard: React.FC<IndustryBenchmarksProps> = ({
  profitData,
  grossMarginStatus,
  netMarginStatus,
  industryBenchmarks
}) => {
  const isMobile = useIsMobile();

  return (
    <Card>
      <CardHeader className={cn("p-4", isMobile && "p-3")}>
        <CardTitle className={cn("flex items-center gap-2", isMobile && "text-base")}>
          <Target className={cn("h-5 w-5", isMobile && "h-4 w-4")} />
          Patokan Margin Industri
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-6 p-4", isMobile && "space-y-4 p-3")}>
        <div>
          <div className={cn("flex justify-between items-center mb-2", isMobile && "mb-1")}>
            <span className={cn("text-sm font-medium", isMobile && "text-xs")}>Margin Kotor</span>
            <div className="text-right">
              <span className={cn("text-sm font-bold", isMobile && "text-xs")}>
                {formatPercentage(profitData.profitMarginData.grossMargin)}
              </span>
              <Badge 
                variant={getBadgeVariant(grossMarginStatus.color)}
                className={cn("ml-2 text-xs", isMobile && "text-[0.65rem]")}
              >
                {grossMarginStatus.status}
              </Badge>
            </div>
          </div>
          <Progress 
            value={Math.max(0, profitData.profitMarginData.grossMargin)} 
            max={50}
            className={cn("h-2", isMobile && "h-1.5")} 
          />
          <p className={cn("text-xs text-gray-600 mt-1", isMobile && "text-[0.65rem]")}>
            {grossMarginStatus.description}
          </p>
        </div>

        <div>
          <div className={cn("flex justify-between items-center mb-2", isMobile && "mb-1")}>
            <span className={cn("text-sm font-medium", isMobile && "text-xs")}>Margin Bersih</span>
            <div className="text-right">
              <span className={cn("text-sm font-bold", isMobile && "text-xs")}>
                {formatPercentage(profitData.profitMarginData.netMargin)}
              </span>
              <Badge 
                variant={getBadgeVariant(netMarginStatus.color)}
                className={cn("ml-2 text-xs", isMobile && "text-[0.65rem]")}
              >
                {netMarginStatus.status}
              </Badge>
            </div>
          </div>
          <Progress 
            value={Math.max(0, profitData.profitMarginData.netMargin)} 
            max={30}
            className={cn("h-2", isMobile && "h-1.5")} 
          />
          <p className={cn("text-xs text-gray-600 mt-1", isMobile && "text-[0.65rem]")}>
            {netMarginStatus.description}
          </p>
        </div>

        <Alert>
          <Target className={cn("h-4 w-4", isMobile && "h-3 w-3")} />
          <AlertDescription>
            <strong className={isMobile ? "text-sm" : ""}>Target Industri:</strong>
            <ul className={cn("mt-2 space-y-1 text-sm", isMobile && "text-xs")}>
              <li>• Margin Kotor Excellent: ≥{industryBenchmarks.grossMargin.excellent}%</li>
              <li>• Margin Bersih Excellent: ≥{industryBenchmarks.netMargin.excellent}%</li>
              <li>• Material Cost Target: ≤40%</li>
              <li>• COGS Target: ≤70%</li>
              <li>• OPEX Target: ≤20%</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};