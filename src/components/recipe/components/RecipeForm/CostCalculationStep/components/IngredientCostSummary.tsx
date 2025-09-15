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
  bahan_resep: BahanResep[];\n  jumlah_porsi: number;\n  jumlah_pcs_per_porsi: number;\n  enhancedHppResult?: {\n    bahan_per_pcs: number;\n    breakdown: {\n      ingredients: Array<{\n        nama: string;\n        jumlah: number;\n        harga_satuan: number;\n        total_harga: number;\n        wac_price?: number;\n      }>;\n    };\n  };\n}\n\nexport const IngredientCostSummary: React.FC<IngredientCostSummaryProps> = ({\n  bahan_resep,\n  jumlah_porsi,\n  jumlah_pcs_per_porsi,\n  enhancedHppResult\n}) => {\n  // Calculate total ingredient cost from the actual recipe data\n  const totalIngredientCost = bahan_resep.reduce((sum, bahan) => sum + bahan.total_harga, 0);\n  const total_pcs = jumlah_porsi * jumlah_pcs_per_porsi;\n  const ingredient_cost_per_pcs = total_pcs > 0 ? totalIngredientCost / total_pcs : 0;\n  const ingredient_cost_per_porsi = jumlah_porsi > 0 ? totalIngredientCost / jumlah_porsi : 0;\n\n  // Check if enhanced result seems reasonable compared to actual ingredient cost\n  const isEnhancedResultReasonable = enhancedHppResult ? \n    Math.abs(enhancedHppResult.bahan_per_pcs - ingredient_cost_per_pcs) < (ingredient_cost_per_pcs * 2) : true;\n\n  // Use the more reliable calculation\n  const display_bahan_per_pcs = isEnhancedResultReasonable && enhancedHppResult ? \n    enhancedHppResult.bahan_per_pcs : ingredient_cost_per_pcs;\n\n  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-600" />
          Ringkasan Biaya Bahan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Warning if enhanced result seems unreasonable */}
        {!isEnhancedResultReasonable && enhancedHppResult && (\n            <div className=\"bg-yellow-50 border border-yellow-200 rounded-lg p-3\">\n              <div className=\"flex items-start gap-2\">\n                <AlertTriangle className=\"h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0\" />\n                <div className=\"text-sm\">\n                  <p className=\"font-medium text-yellow-800\">Perhatian: Perhitungan Tidak Konsisten</p>\n                  <p className=\"text-yellow-700 mt-1\">\n                    Terdapat perbedaan antara kalkulasi enhanced ({formatCurrency(enhancedHppResult.bahan_per_pcs)}/pcs) \n                    dengan kalkulasi biaya bahan aktual ({formatCurrency(ingredient_cost_per_pcs)}/pcs). \n                    Menggunakan kalkulasi aktual yang lebih dapat dipercaya.\n                  </p>\n                </div>\n              </div>\n            </div>\n          )}\n
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
          
          {jumlah_pcs_per_porsi > 1 && (\n            <div className=\"flex justify-between items-center\">\n              <span className=\"text-blue-700\">Biaya per Pcs:</span>\n              <Badge variant=\"outline\" className=\"text-blue-700 border-blue-300\">\n                {formatCurrency(display_bahan_per_pcs)}\n              </Badge>\n            </div>\n          )}\n          \n          <div className=\"text-sm text-blue-600 bg-blue-100 p-2 rounded\">\n            <div className=\"flex items-center gap-2\">\n              <Info className=\"h-4 w-4 flex-shrink-0\" />\n              <div>\n                {bahan_resep.length} bahan telah dihitung\n                {jumlah_pcs_per_porsi > 1 && (\n                  <div className=\"mt-1 text-xs\">\n                    Total: {jumlah_porsi} porsi × {jumlah_pcs_per_porsi} pcs = {total_pcs} pcs\n                  </div>\n                )}\n              </div>\n            </div>\n          </div>
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
