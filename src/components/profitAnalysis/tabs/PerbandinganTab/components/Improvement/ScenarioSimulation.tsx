// src/components/profitAnalysis/tabs/PerbandinganTab/components/Improvement/ScenarioSimulation.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ImprovementPotential } from '../../types';
import { formatCurrency } from '../../utils';

interface ScenarioSimulationProps {
  improvementPotential: ImprovementPotential;
  totalImprovementPotential: number;
  revenueImprovementPercentage: number;
}

export const ScenarioSimulation: React.FC<ScenarioSimulationProps> = ({
  improvementPotential,
  totalImprovementPotential,
  revenueImprovementPercentage
}) => {
  const isMobile = useIsMobile();

  const handleSimulationClick = () => {
    alert('Advanced scenario simulation coming soon!');
  };

  return (
    <Card>
      <CardHeader className={cn("p-4", isMobile && "p-3")}>
        <CardTitle className={cn("flex items-center gap-2", isMobile && "text-base")}>
          <Calculator className={cn("h-5 w-5", isMobile && "h-4 w-4")} />
          Simulasi Skenario
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-4 p-4", isMobile && "space-y-3 p-3")}>
        <div>
          <h5 className={cn("font-medium mb-3", isMobile && "text-sm mb-2")}>💰 Potensi Saving</h5>
          <div className="space-y-3">
            <div className="bg-green-50 p-3 rounded">
              <div className="flex justify-between">
                <span className={cn("text-green-800", isMobile && "text-sm")}>Material Optimization (15%)</span>
                <span className={cn("font-medium text-green-700", isMobile && "text-sm")}>
                  +{formatCurrency(improvementPotential.materialOptimization)}
                </span>
              </div>
              <p className={cn("text-xs text-green-600 mt-1", isMobile && "text-[0.65rem]")}>
                Supplier negotiation + waste reduction
              </p>
            </div>

            <div className="bg-blue-50 p-3 rounded">
              <div className="flex justify-between">
                <span className={cn("text-blue-800", isMobile && "text-sm")}>Labor Efficiency (8%)</span>
                <span className={cn("font-medium text-blue-700", isMobile && "text-sm")}>
                  +{formatCurrency(improvementPotential.laborEfficiency)}
                </span>
              </div>
              <p className={cn("text-xs text-blue-600 mt-1", isMobile && "text-[0.65rem]")}>
                Productivity improvements + automation
              </p>
            </div>

            <div className="bg-purple-50 p-3 rounded">
              <div className="flex justify-between">
                <span className={cn("text-purple-800", isMobile && "text-sm")}>OPEX Reduction (10%)</span>
                <span className={cn("font-medium text-purple-700", isMobile && "text-sm")}>
                  +{formatCurrency(improvementPotential.opexReduction10)}
                </span>
              </div>
              <p className={cn("text-xs text-purple-600 mt-1", isMobile && "text-[0.65rem]")}>
                Administrative efficiency + cost control
              </p>
            </div>

            {improvementPotential.dataAccuracyGain > 0 && (
              <div className="bg-yellow-50 p-3 rounded">
                <div className="flex justify-between">
                  <span className={cn("text-yellow-800", isMobile && "text-sm")}>Data Accuracy Gain</span>
                  <span className={cn("font-medium text-yellow-700", isMobile && "text-sm")}>
                    +{formatCurrency(improvementPotential.dataAccuracyGain)}
                  </span>
                </div>
                <p className={cn("text-xs text-yellow-600 mt-1", isMobile && "text-[0.65rem]")}>
                  Better decision making through accurate data
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Total Potential */}
        <div className="bg-gray-50 p-4 rounded border-2 border-dashed border-gray-300">
          <div className="text-center">
            <h5 className={cn("font-medium text-gray-800 mb-2", isMobile && "text-sm")}>
              💎 Total Improvement Potential
            </h5>
            <p className={cn("text-3xl font-bold text-gray-700", isMobile && "text-xl")}>
              {formatCurrency(totalImprovementPotential)}
            </p>
            <p className={cn("text-sm text-gray-600 mt-1", isMobile && "text-xs")}>
              ~{revenueImprovementPercentage.toFixed(1)}% revenue improvement
            </p>
          </div>
        </div>

        <Button 
          variant="outline" 
          className={cn("w-full", isMobile && "text-xs")}
          onClick={handleSimulationClick}
        >
          <Calculator className={cn("h-4 w-4 mr-2", isMobile && "h-3 w-3")} />
          Simulasi Skenario Detail
        </Button>
      </CardContent>
    </Card>
  );
};