// src/components/recipe/components/RecipeForm/CostCalculationStep/components/IngredientCostSummary.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle, Info } from 'lucide-react';
import { formatCurrency } from '@/utils/formatUtils';

interface BahanResep {
  id?: string;
  nama: string;
  jumlah: number;
  satuan: string;
  hargaSatuan: number;
  totalHarga: number;
}

interface IngredientCostSummaryProps {
  bahanResep: BahanResep[];
  jumlahPorsi: number;
  jumlahPcsPerPorsi: number;
  enhancedHppResult?: {
    bahanPerPcs: number;
    breakdown: {
      ingredients: Array<{
        nama: string;
        jumlah: number;
        hargaSatuan: number;
        totalHarga: number;
        wacPrice?: number;
      }>;
    };
  };
}

export const IngredientCostSummary: React.FC<IngredientCostSummaryProps> = ({
  bahanResep,
  jumlahPorsi,
  jumlahPcsPerPorsi,
  enhancedHppResult
}) => {
  // Calculate total ingredient cost from the actual recipe data
  const totalIngredientCost = bahanResep.reduce((sum, bahan) => sum + bahan.totalHarga, 0);
  const totalPcs = jumlahPorsi * jumlahPcsPerPorsi;
  const ingredientCostPerPcs = totalPcs > 0 ? totalIngredientCost / totalPcs : 0;
  const ingredientCostPerPorsi = jumlahPorsi > 0 ? totalIngredientCost / jumlahPorsi : 0;

  // Check if enhanced result seems reasonable compared to actual ingredient cost
  const isEnhancedResultReasonable = enhancedHppResult ? 
    Math.abs(enhancedHppResult.bahanPerPcs - ingredientCostPerPcs) < (ingredientCostPerPcs * 2) : true;

  // Use the more reliable calculation
  const displayBahanPerPcs = isEnhancedResultReasonable && enhancedHppResult ? 
    enhancedHppResult.bahanPerPcs : ingredientCostPerPcs;

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-600" />
          Ringkasan Biaya Bahan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Warning if enhanced result seems unreasonable */}
        {!isEnhancedResultReasonable && enhancedHppResult && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Perhatian: Perhitungan Tidak Konsisten</p>
                <p className="text-yellow-700 mt-1">
                  Terdapat perbedaan antara kalkulasi enhanced ({formatCurrency(enhancedHppResult.bahanPerPcs)}/pcs) 
                  dengan kalkulasi biaya bahan aktual ({formatCurrency(ingredientCostPerPcs)}/pcs). 
                  Menggunakan kalkulasi aktual yang lebih dapat dipercaya.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-blue-700 font-medium">Total Biaya Bahan:</span>
            <Badge className="bg-blue-100 text-blue-900 border-blue-300">
              {formatCurrency(totalIngredientCost)}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-blue-700">Biaya per Porsi:</span>
            <Badge variant="outline" className="text-blue-700 border-blue-300">
              {formatCurrency(ingredientCostPerPorsi)}
            </Badge>
          </div>
          
          {jumlahPcsPerPorsi > 1 && (
            <div className="flex justify-between items-center">
              <span className="text-blue-700">Biaya per Pcs:</span>
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                {formatCurrency(displayBahanPerPcs)}
              </Badge>
            </div>
          )}
          
          <div className="text-sm text-blue-600 bg-blue-100 p-2 rounded">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 flex-shrink-0" />
              <div>
                {bahanResep.length} bahan telah dihitung
                {jumlahPcsPerPorsi > 1 && (
                  <div className="mt-1 text-xs">
                    Total: {jumlahPorsi} porsi × {jumlahPcsPerPorsi} pcs = {totalPcs} pcs
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ingredient breakdown (optional, for debugging) */}
        {process.env.NODE_ENV === 'development' && bahanResep.length > 0 && (
          <details className="text-xs">
            <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
              Detail Bahan (Debug)
            </summary>
            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
              {bahanResep.map((bahan, index) => (
                <div key={index} className="flex justify-between text-blue-700 bg-blue-50 px-2 py-1 rounded">
                  <span>{bahan.nama} ({bahan.jumlah} {bahan.satuan})</span>
                  <span>{formatCurrency(bahan.totalHarga)}</span>
                </div>
              ))}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
};
