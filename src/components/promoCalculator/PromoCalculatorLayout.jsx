// PromoCalculatorLayout.jsx - Simple wrapper for mobile compatibility
import React from 'react';
import PromoCalculator from './calculator/PromoCalculator';

const PromoCalculatorLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content Container */}
      <div className="max-w-7xl mx-auto">
        <PromoCalculator />
      </div>
    </div>
  );
};

export default PromoCalculatorLayout;