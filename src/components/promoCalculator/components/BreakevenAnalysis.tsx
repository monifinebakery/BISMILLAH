import React from 'react';
import { TrendingUp, Calculator } from 'lucide-react';
import { formatters } from '../utils/formatters';

const BreakevenAnalysis = ({ breakeven, className = '' }: any) => {
  if (!breakeven) return null;

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-2">
        <Calculator className="h-4 w-4 text-blue-600" />
        <h4 className="font-medium text-blue-900">Analisis Break Even</h4>
      </div>
      
      <div className="space-y-2 text-sm">
        {breakeven.additionalSalesNeeded > 0 ? (
          <>
            <div className="flex justify-between">
              <span className="text-blue-700">Penjualan tambahan dibutuhkan:</span>
              <span className="font-semibold text-blue-900">
                {breakeven.additionalSalesNeeded} unit
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Kehilangan profit per unit:</span>
              <span className="font-semibold text-blue-900">
                {formatters.currency(breakeven.profitLoss)}
              </span>
            </div>
            <p className="text-blue-600 text-xs mt-2 italic">
              {breakeven.message}
            </p>
          </>
        ) : (
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <p className="text-green-700 font-medium">
              {breakeven.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BreakevenAnalysis;