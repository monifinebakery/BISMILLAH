// PromoCalculatorLayout.jsx - Proper layout wrapper with padding and constraints
import React from 'react';
import PromoCalculator from './calculator/PromoCalculator';

const PromoCalculatorLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content Container with proper constraints */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <PromoCalculator />
      </div>
    </div>
  );
};

export default PromoCalculatorLayout;