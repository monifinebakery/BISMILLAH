// PromoCalculatorLayout.jsx - Layout wrapper dengan header orange

import React from 'react';
import { Calculator } from 'lucide-react';
import PromoCalculator from './PromoCalculator';

const PromoCalculatorLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Orange Header */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
              <Calculator className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Kalkulator Promo</h1>
              <p className="text-orange-100 mt-2 text-lg">
                Hitung profit margin dan dampak promo dengan akurat
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PromoCalculator />
      </div>
    </div>
  );
};

export default PromoCalculatorLayout;