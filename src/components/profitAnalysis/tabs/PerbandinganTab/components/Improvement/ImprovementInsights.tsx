// src/components/profitAnalysis/tabs/PerbandinganTab/components/Improvement/ImprovementInsights.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, AlertTriangle, Database } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { CashVsRealComparison, ProfitAnalysisResult } from '../../types';
import { formatCurrency } from '../../utils';

interface ImprovementInsightsProps {
  profitData: ProfitAnalysisResult;
  cashVsReal: CashVsRealComparison;
  criticalInsights: any[];
  dataAccuracyGain: number;
}

export const ImprovementInsights: React.FC<ImprovementInsightsProps> = ({
  profitData,
  cashVsReal,
  criticalInsights,
  dataAccuracyGain
}) => {
  const isMobile = useIsMobile();

  return (
    <Card>
      <CardHeader className={cn("p-4", isMobile && "p-3")}>
        <CardTitle className={cn("flex items-center gap-2", isMobile && "text-base")}>
          <TrendingUp className={cn("h-5 w-5", isMobile && "h-4 w-4")} />
          Potensi Perbaikan
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-4 p-4", isMobile && "space-y-3 p-3")}>
        {/* Critical Insights from Data */}
        {criticalInsights.map((insight, index) => (
          <Alert key={index}>
            <AlertTriangle className={cn(
              `h-4 w-4 ${insight.type === 'critical' ? 'text-red-600' : 'text-yellow-600'}`,
              isMobile && "h-3 w-3"
            )} />
            <AlertDescription>
              <strong className={isMobile ? "text-sm" : ""}>{insight.title}</strong>
              <p className={cn("text-sm", isMobile && "text-xs")}>{insight.message}</p>
              {insight.recommendation && (
                <p className={cn("text-xs text-gray-600 mt-1", isMobile && "text-[0.65rem]")}>
                  💡 {insight.recommendation}
                </p>
              )}
              {insight.value !== undefined && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    Impact: {formatCurrency(insight.value)}
                  </Badge>
                </div>
              )}
            </AlertDescription>
          </Alert>
        ))}

        {/* Data Quality Improvement */}
        {profitData.cogsBreakdown.dataSource !== 'actual' && (
          <Alert>
            <Database className={cn("h-4 w-4 text-blue-600", isMobile && "h-3 w-3")} />
            <AlertDescription>
              <strong className={isMobile ? "text-sm" : ""}>Data Quality Improvement</strong>
              <p className={cn("text-sm", isMobile && "text-xs")}>
                Implement material usage tracking untuk akurasi HPP +{100 - cashVsReal.accuracyScore}%
              </p>
              <p className={cn("text-xs text-gray-600 mt-1", isMobile && "text-[0.65rem]")}>
                💡 Potensi saving: {formatCurrency(dataAccuracyGain)}
              </p>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};