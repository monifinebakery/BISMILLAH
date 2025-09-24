// src/components/recipe/components/RecipeForm/CostCalculationStep/components/IngredientCostSummary.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle, Info } from 'lucide-react';
import { formatCurrency } from '@/components/recipe/services/recipeUtils';


interface BahanResep {
  id?: string;
  nama: string;
  jumlah: number;
  satuan: string;
  harga_satuan: number;
  total_harga: number;
}

interface IngredientCostSummaryProps {
  bahan_resep: BahanResep[];
  jumlah_porsi: number;
  jumlah_pcs_per_porsi: number;
  enhancedHppResult?: {
    bahan_per_pcs: number;
    breakdown: {
      ingredients: Array<{
        nama: string;
        jumlah: number;
        harga_satuan: number;
        total_harga: number;
        wac_price?: number;
      }>;
    };
  };
}

export const IngredientCostSummary: React.FC<IngredientCostSummaryProps> = ({
  bahan_resep,
  jumlah_porsi,
  jumlah_pcs_per_porsi,
  enhancedHppResult
}) => {
  // Calculate total ingredient cost from the actual recipe data
  const totalIngredientCost = bahan_resep.reduce((sum, bahan) => sum + bahan.total_harga, 0);
  const total_pcs = jumlah_porsi * jumlah_pcs_per_porsi;
  const ingredient_cost_per_pcs = total_pcs > 0 ? totalIngredientCost / total_pcs : 0;
  const ingredient_cost_per_porsi = jumlah_porsi > 0 ? totalIngredientCost / jumlah_porsi : 0;

  // Check if enhanced result seems reasonable compared to actual ingredient cost
  const isEnhancedResultReasonable = enhancedHppResult ? 
    Math.abs(enhancedHppResult.bahan_per_pcs - ingredient_cost_per_pcs) < (ingredient_cost_per_pcs * 2) : true;

  // Use the more reliable calculation
  const display_bahan_per_pcs = isEnhancedResultReasonable && enhancedHppResult ? 
    enhancedHppResult.bahan_per_pcs : ingredient_cost_per_pcs;

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
                  Terdapat perbedaan antara kalkulasi enhanced ({formatCurrency(enhancedHppResult.bahan_per_pcs)}/pcs) 
                  dengan kalkulasi biaya bahan aktual ({formatCurrency(ingredient_cost_per_pcs)}/pcs). 
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
              {formatCurrency(ingredient_cost_per_porsi)}
            </Badge>
          </div>
          
          {jumlah_pcs_per_porsi > 1 && (
            <div className="flex justify-between items-center">
              <span className="text-blue-700">Biaya per Pcs:</span>
              <Badge variant="outline" className="text-blue-700 border-blue-300">
                {formatCurrency(display_bahan_per_pcs)}
              </Badge>
            </div>
          )}
          
          <div className="text-sm text-blue-600 bg-blue-100 p-2 rounded">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 flex-shrink-0" />
              <div>
                {bahan_resep.length} bahan telah dihitung
                {jumlah_pcs_per_porsi > 1 && (
                  <div className="mt-1 text-xs">
                    Total: {jumlah_porsi} porsi x {jumlah_pcs_per_porsi} pcs = {total_pcs} pcs
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ingredient breakdown (optional, for debugging) */}
        {process.env.NODE_ENV === 'development' && bahan_resep.length > 0 && (
          <details className="text-xs">
            <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
              Detail Bahan (Debug)
            </summary>
            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
              {bahan_resep.map((bahan, index) => (
                <div key={index} className="flex justify-between text-blue-700 bg-blue-50 px-2 py-1 rounded">
                  <span>{bahan.nama} ({bahan.jumlah} {bahan.satuan})</span>
                  <span>{formatCurrency(bahan.total_harga)}</span>
                </div>
              ))}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
};
