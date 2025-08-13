// src/components/profitAnalysis/tabs/PerbandinganTab/components/CashVsReal/DataAccuracyAnalysis.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, Package2, AlertTriangle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { CashVsRealComparison, ProfitAnalysisResult } from '../../types';
import { formatCurrency } from '../../utils';

interface DataAccuracyAnalysisProps {
  cashVsReal: CashVsRealComparison;
  profitData: ProfitAnalysisResult;
}

export const DataAccuracyAnalysis: React.FC<DataAccuracyAnalysisProps> = ({
  cashVsReal,
  profitData
}) => {
  const isMobile = useIsMobile();

  return (
    <Card>
      <CardHeader className={cn("p-4", isMobile && "p-3")}>
        <CardTitle className={cn("flex items-center gap-2", isMobile && "text-base")}>
          <Database className={cn("h-5 w-5", isMobile && "h-4 w-4")} />
          Analisis Akurasi Data
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-4 p-4", isMobile && "space-y-3 p-3")}>
        {/* Data Source Indicator */}
        <div className={cn(
          "p-3 rounded border-l-4",
          cashVsReal.dataSource === 'actual' ? "bg-green-50 border-green-500" :
          cashVsReal.dataSource === 'mixed' ? "bg-yellow-50 border-yellow-500" :
          "bg-orange-50 border-orange-500"
        )}>
          <div className="flex items-center gap-2 mb-2">
            <Package2 className={cn("h-4 w-4", isMobile && "h-3 w-3")} />
            <span className={cn("font-medium", isMobile && "text-sm")}>
              Data Source: {cashVsReal.dataSource === 'actual' ? 'Aktual' : 
                          cashVsReal.dataSource === 'mixed' ? 'Campuran' : 'Estimasi'}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Akurasi HPP:</span>
              <span className="font-medium">{cashVsReal.accuracyScore}%</span>
            </div>
            <Progress value={cashVsReal.accuracyScore} className="h-2" />
          </div>
        </div>

        {/* Material Usage Stats */}
        {profitData.cogsBreakdown.actualMaterialUsage && (
          <div className="bg-blue-50 p-3 rounded">
            <h5 className={cn("font-medium text-blue-800 mb-2", isMobile && "text-sm")}>
              📦 Material Usage Data
            </h5>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Total Records:</span>
                <span className="font-medium">
                  {profitData.cogsBreakdown.actualMaterialUsage.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Usage Types:</span>
                <span className="font-medium">
                  {Array.from(new Set(profitData.cogsBreakdown.actualMaterialUsage.map(u => u.usage_type))).length}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Production Data Stats */}
        {profitData.cogsBreakdown.productionData && (
          <div className="bg-purple-50 p-3 rounded">
            <h5 className={cn("font-medium text-purple-800 mb-2", isMobile && "text-sm")}>
              🏭 Production Records
            </h5>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Total Batches:</span>
                <span className="font-medium">
                  {profitData.cogsBreakdown.productionData.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Avg Unit Cost:</span>
                <span className="font-medium">
                  {formatCurrency(
                    profitData.cogsBreakdown.productionData.reduce((sum, p) => sum + p.unit_cost, 0) / 
                    profitData.cogsBreakdown.productionData.length
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        <Alert>
          <AlertTriangle className={cn("h-4 w-4", isMobile && "h-3 w-3")} />
          <AlertDescription>
            <strong className={isMobile ? "text-sm" : ""}>Mengapa berbeda?</strong>
            <ul className={cn("mt-2 space-y-1 text-sm", isMobile && "text-xs")}>
              <li>• Alokasi HPP akurat berdasarkan {cashVsReal.dataSource} data</li>
              <li>• Pemisahan COGS dan OPEX yang proper</li>
              <li>• Material costing berdasarkan usage sebenarnya</li>
              <li>• Quality grade considerations dalam production</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};