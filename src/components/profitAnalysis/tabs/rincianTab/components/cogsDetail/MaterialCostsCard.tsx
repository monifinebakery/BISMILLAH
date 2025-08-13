// src/components/profitAnalysis/tabs/rincianTab/components/cogsDetail/MaterialCostsCard.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';
import { cn } from '@/lib/utils';

import { MaterialCostsCardProps } from '../../types/components';
import { MaterialCostDetail } from '../../../types';
import { formatCurrency, formatUsageType } from '../../utils/formatters';
import { SECTION_TITLES } from '../../constants/messages';
import { CARD_COLORS } from '../../constants/colors';

export const MaterialCostsCard: React.FC<MaterialCostsCardProps> = ({
  materialCosts,
  totalMaterialCost,
  costAnalysis,
  isMobile
}) => {
  if (!materialCosts || materialCosts.length === 0) {
    return null;
  }

  const colors = CARD_COLORS.MATERIAL;

  return (
    <Card>
      <CardHeader className={cn("p-4", isMobile && "p-3")}>
        <CardTitle className={cn("flex items-center gap-2", isMobile && "text-base")}>
          <Package className={cn("h-5 w-5", isMobile && "h-4 w-4")} />
          {SECTION_TITLES.MATERIAL_DETAIL}
          <Badge variant="outline" className="text-xs">
            {materialCosts.length} items
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("p-4", isMobile && "p-3")}>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {materialCosts.map((material: MaterialCostDetail, index: number) => (
            <div key={index} className="p-3 bg-gray-50 rounded">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h6 className={cn("font-medium text-sm truncate", isMobile && "text-xs")}>
                    {material.materialName}
                  </h6>
                  <div className={cn("text-xs text-gray-600 mt-1", isMobile && "text-[0.65rem]")}>
                    <p>Supplier: {material.supplier}</p>
                    <p>Kategori: {material.category}</p>
                    
                    {/* Quantity and Unit Cost */}
                    {material.quantityUsed > 0 && (
                      <p>
                        Qty: {material.quantityUsed.toFixed(2)} | 
                        Unit: {formatCurrency(material.unitCost)}
                      </p>
                    )}
                    
                    {/* Usage Type */}
                    {material.usageType && (
                      <p>Usage: {formatUsageType(material.usageType)}</p>
                    )}
                  </div>
                  
                  {/* Estimate indicator */}
                  {material.isEstimate && (
                    <Badge variant="secondary" className={cn("text-xs mt-1", isMobile && "text-[0.65rem]")}>
                      Estimasi
                    </Badge>
                  )}
                </div>
                
                <div className="text-right ml-3">
                  <p className={cn("font-medium", isMobile && "text-sm")}>
                    {formatCurrency(material.totalCost)}
                  </p>
                  <p className={cn("text-xs text-gray-500", isMobile && "text-[0.65rem]")}>
                    {((material.totalCost / totalMaterialCost) * 100).toFixed(1)}%
                  </p>
                  
                  {/* Cost efficiency indicator */}
                  {material.quantityUsed > 0 && (
                    <p className={cn("text-xs text-blue-600", isMobile && "text-[0.65rem]")}>
                      {formatCurrency(material.totalCost / material.quantityUsed)}/unit
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Total Summary */}
        <div className={cn("p-3 rounded mt-4", colors.bg)}>
          <div className="flex justify-between items-center">
            <span className={cn("font-medium", colors.textDark)}>
              Total Biaya Material
            </span>
            <span className={cn("font-bold", colors.textDark)}>
              {formatCurrency(totalMaterialCost)}
            </span>
          </div>
          <p className={cn("text-xs mt-1", colors.text)}>
            {costAnalysis.materialRatio.toFixed(1)}% dari total pendapatan
          </p>
          
          {/* Efficiency metrics */}
          <div className={cn("mt-2 grid grid-cols-2 gap-2 text-xs", isMobile && "text-[0.65rem]")}>
            <div>
              <span className="text-gray-600">Avg Cost/Item:</span>
              <span className="font-medium ml-1">
                {formatCurrency(totalMaterialCost / materialCosts.length)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Cost Variance:</span>
              <span className={cn(
                "font-medium ml-1",
                costAnalysis.materialRatio > 40 ? "text-red-600" : "text-green-600"
              )}>
                {costAnalysis.materialRatio > 40 ? 'High' : 'Normal'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};