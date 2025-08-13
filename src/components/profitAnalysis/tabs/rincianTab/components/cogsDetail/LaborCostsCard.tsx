// src/components/profitAnalysis/tabs/rincianTab/components/cogsDetail/LaborCostsCard.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

import { LaborCostsCardProps } from '../../types/components';
import { LaborCostDetail } from '../../../types';
import { formatCurrency, formatCostType, formatAllocationMethod } from '../../utils/formatters';
import { SECTION_TITLES } from '../../constants/messages';
import { CARD_COLORS } from '../../constants/colors';

export const LaborCostsCard: React.FC<LaborCostsCardProps> = ({
  directLaborCosts,
  totalDirectLaborCost,
  costAnalysis,
  isMobile
}) => {
  if (!directLaborCosts || directLaborCosts.length === 0) {
    return null;
  }

  const colors = CARD_COLORS.LABOR;

  return (
    <Card>
      <CardHeader className={cn("p-4", isMobile && "p-3")}>
        <CardTitle className={cn("flex items-center gap-2", isMobile && "text-base")}>
          <Users className={cn("h-5 w-5", isMobile && "h-4 w-4")} />
          {SECTION_TITLES.LABOR_DETAIL}
          <Badge variant="outline" className="text-xs">
            {directLaborCosts.length} categories
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("p-4", isMobile && "p-3")}>
        <div className="space-y-3">
          {directLaborCosts.map((labor: LaborCostDetail, index: number) => (
            <div key={index} className="p-3 bg-gray-50 rounded">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h6 className={cn("font-medium text-sm truncate", isMobile && "text-xs")}>
                    {labor.costName}
                  </h6>
                  <div className={cn("text-xs text-gray-600 mt-1", isMobile && "text-[0.65rem]")}>
                    <p>Jenis: {formatCostType(labor.costType)}</p>
                    <p>Basis Alokasi: {formatAllocationMethod(labor.allocationBasis)}</p>
                    <p>Jumlah Bulanan: {formatCurrency(labor.monthlyAmount)}</p>
                    
                    {/* Additional labor details */}
                    {labor.hourlyRate && (
                      <p>Rate per Jam: {formatCurrency(labor.hourlyRate)}</p>
                    )}
                    {labor.hoursWorked && (
                      <p>Jam Kerja: {labor.hoursWorked.toFixed(1)} jam</p>
                    )}
                  </div>
                  
                  {/* Cost type badge */}
                  <Badge 
                    variant={labor.costType === 'tetap' ? 'default' : 'secondary'} 
                    className={cn("text-xs mt-1", isMobile && "text-[0.65rem]")}
                  >
                    {formatCostType(labor.costType)}
                  </Badge>
                </div>
                
                <div className="text-right ml-3">
                  <p className={cn("font-medium", isMobile && "text-sm")}>
                    {formatCurrency(labor.allocatedAmount)}
                  </p>
                  <p className={cn("text-xs text-gray-500", isMobile && "text-[0.65rem]")}>
                    {((labor.allocatedAmount / totalDirectLaborCost) * 100).toFixed(1)}%
                  </p>
                  
                  {/* Efficiency indicator */}
                  {labor.hoursWorked && (
                    <p className={cn("text-xs text-orange-600", isMobile && "text-[0.65rem]")}>
                      {formatCurrency(labor.allocatedAmount / labor.hoursWorked)}/jam
                    </p>
                  )}
                </div>
              </div>
              
              {/* Allocation details */}
              {labor.allocationPercentage && (
                <div className={cn("mt-2 pt-2 border-t border-gray-200", isMobile && "mt-1 pt-1")}>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Alokasi dari total:</span>
                    <span className="font-medium">{labor.allocationPercentage.toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Total Summary */}
        <div className={cn("p-3 rounded mt-4", colors.bg)}>
          <div className="flex justify-between items-center">
            <span className={cn("font-medium", colors.textDark)}>
              Total Biaya Tenaga Kerja
            </span>
            <span className={cn("font-bold", colors.textDark)}>
              {formatCurrency(totalDirectLaborCost)}
            </span>
          </div>
          <p className={cn("text-xs mt-1", colors.text)}>
            {costAnalysis.laborRatio.toFixed(1)}% dari total pendapatan
          </p>
          
          {/* Labor metrics */}
          <div className={cn("mt-2 grid grid-cols-2 gap-2 text-xs", isMobile && "text-[0.65rem]")}>
            <div>
              <span className="text-gray-600">Avg Cost/Category:</span>
              <span className="font-medium ml-1">
                {formatCurrency(totalDirectLaborCost / directLaborCosts.length)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Efficiency:</span>
              <span className={cn(
                "font-medium ml-1",
                costAnalysis.laborRatio > 20 ? "text-red-600" : "text-green-600"
              )}>
                {costAnalysis.laborRatio > 20 ? 'Needs Review' : 'Good'}
              </span>
            </div>
          </div>
          
          {/* Cost breakdown by type */}
          <div className={cn("mt-2 pt-2 border-t", isMobile && "mt-1 pt-1")}>
            <div className="text-xs text-gray-600">
              <span>Fixed: </span>
              <span className="font-medium">
                {formatCurrency(
                  directLaborCosts
                    .filter(l => l.costType === 'tetap')
                    .reduce((sum, l) => sum + l.allocatedAmount, 0)
                )}
              </span>
              <span className="mx-2">•</span>
              <span>Variable: </span>
              <span className="font-medium">
                {formatCurrency(
                  directLaborCosts
                    .filter(l => l.costType === 'variabel')
                    .reduce((sum, l) => sum + l.allocatedAmount, 0)
                )}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};