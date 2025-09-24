// src/components/recipe/components/RecipeForm/ingredients-step/components/ConversionInfo.tsx

import React from 'react';
import { Calculator } from 'lucide-react';
import type { IngredientConversionResult } from '../hooks/useIngredientConversion';
import { formatCurrency } from '../../../../services/recipeUtils';

interface ConversionInfoProps {
  conversionInfo: IngredientConversionResult | null;
  className?: string;
}

export const ConversionInfo: React.FC<ConversionInfoProps> = ({
  conversionInfo,
  className = '',
}) => {
  if (!conversionInfo || !conversionInfo.isConverted) {
    return null;
  }

  // Create conversion display text for new interface
  const getConversionDisplayText = (conversion: IngredientConversionResult): string => {
    if (!conversion.isConverted) {
      return `Menggunakan satuan asli: ${conversion.originalUnit}`;
    }

    return `Dikonversi dari ${conversion.originalUnit} ke ${conversion.convertedUnit} (1 ${conversion.originalUnit} = ${conversion.conversionMultiplier} ${conversion.convertedUnit})`;
  };

  return (
    <div className={`mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <Calculator className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1 space-y-2">
          <h4 className="font-medium text-blue-900 text-sm">🆕 Konversi Satuan Otomatis</h4>
          <p className="text-blue-700 text-xs leading-relaxed">
            {getConversionDisplayText(conversionInfo)}
          </p>
          <div className="text-xs text-blue-600 space-y-1">
            <div className="flex justify-between items-center">
              <span>Harga asli:</span>
              <span className="font-medium">
                {formatCurrency(conversionInfo.originalPrice)}/{conversionInfo.originalUnit}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Harga per {conversionInfo.convertedUnit}:</span>
              <span className="font-medium text-green-600">
                {formatCurrency(conversionInfo.convertedPrice)}/{conversionInfo.convertedUnit}
              </span>
            </div>
          </div>
          <div className="text-xs text-blue-500 italic">
            Ini memudahkan input takaran resep dengan satuan yang lebih kecil dan presisi.
          </div>
        </div>
      </div>
    </div>
  );
};
