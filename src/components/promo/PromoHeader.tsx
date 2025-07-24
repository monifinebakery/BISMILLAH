// components/promo/PromoHeader.tsx
import React from 'react';
import { Calculator } from 'lucide-react';

const PromoHeader: React.FC = () => {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl shadow-lg">
          <Calculator className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Kalkulator & Analisis Promo
          </h1>
          <p className="text-gray-600 mt-1">
            Hitung dampak promo terhadap margin keuntungan Anda
          </p>
        </div>
      </div>
    </div>
  );
};

export default PromoHeader;