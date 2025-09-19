// src/components/recipe/components/RecipeForm/components/IngredientSummary.tsx

import React from 'react';
import { Calculator, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface CostSummary {
  totalCost: string;
  costPerPortion: string;
  costPerPiece: string;
  showCostPerPiece: boolean;
  ingredientCount: number;
}

interface IngredientSummaryProps {
  costSummary: CostSummary;
  isCalculationReady: boolean;
  className?: string;
}

export const IngredientSummary: React.FC<IngredientSummaryProps> = ({
  costSummary,
  isCalculationReady,
  className = ""
}) => {
  
  if (!isCalculationReady || costSummary.ingredientCount === 0) {
    return null;
  }

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      
      {/* Cost Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="h-5 w-5 text-blue-600" />
            <h4 className="font-medium text-blue-900">Ringkasan Biaya Bahan</h4>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Total Biaya Bahan:</span>
              <span className="font-semibold text-blue-900">
                {costSummary.totalCost}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-blue-700">Biaya per Porsi:</span>
              <span className="font-semibold text-blue-900">
                {costSummary.costPerPortion}
              </span>
            </div>

            {costSummary.showCostPerPiece && (
              <div className="flex justify-between">
                <span className="text-blue-700">Biaya per Pcs:</span>
                <span className="font-semibold text-blue-900">
                  {costSummary.costPerPiece}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-orange-50 border-orange-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Info className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <h4 className="font-medium text-orange-900 mb-2">
                🆕 Tips Menambah Bahan
              </h4>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>• 🆕 Satuan besar (kg, liter) otomatis dikonversi ke satuan kecil (gram, ml)</li>
                <li>• Pilih bahan dari warehouse untuk sinkronisasi harga otomatis</li>
                <li>• Harga akan disesuaikan secara proporsional saat konversi</li>
                <li>• Pastikan bahan sudah tersedia di warehouse sebelum membuat resep</li>
                <li>• Update data warehouse untuk akurasi harga terbaru</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};