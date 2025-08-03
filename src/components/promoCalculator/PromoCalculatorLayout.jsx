// PromoCalculatorLayout.jsx - Layout wrapper dengan header orange
import React from 'react';
import { Calculator } from 'lucide-react';
import PromoCalculator from './calculator/PromoCalculator';

const PromoCalculatorLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Orange Header */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center space-x-6">
            <div className="p-4 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
              <Calculator className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Kalkulator Promo</h1>
              <p className="text-orange-100 mt-3 text-lg">
                Hitung profit margin dan dampak promo dengan akurat
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <PromoCalculator />
      </div>
    </div>
  );
};

export default PromoCalculatorLayout;