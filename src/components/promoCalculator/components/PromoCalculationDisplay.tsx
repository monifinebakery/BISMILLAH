// src/components/promoCalculator/components/PromoCalculationDisplay.tsx
// Component for displaying promo calculation results

import React from 'react';
import { CheckCircle, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PromoCalculationDisplayProps } from '../types/promo.types';

export const PromoCalculationDisplay: React.FC<PromoCalculationDisplayProps> = ({ 
  calculationResult 
}) => {
  return (
    <Card className="border-2 border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          <CheckCircle className="h-5 w-5" />
          Hasil Kalkulasi Promo
        </CardTitle>
        <p className="text-sm text-green-700 mt-1">
          Kalkulasi berhasil! Berikut adalah ringkasan promo Anda:
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white rounded-lg border border-green-200 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Harga Jual Akhir</p>
            <p className="text-xl font-bold text-green-600">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(calculationResult.finalPrice)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Harga setelah promo</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-blue-200 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Margin Promo</p>
            <p className={`text-xl font-bold ${
              calculationResult.promoMargin < 5 ? 'text-red-600' :
              calculationResult.promoMargin >= 10 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {calculationResult.promoMargin.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Keuntungan dari HPP</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-orange-200 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Hemat Customer</p>
            <p className="text-xl font-bold text-orange-600">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(calculationResult.savings)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Penghematan customer</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-purple-200 shadow-sm">
            <p className="text-sm text-gray-600 mb-1">Profit Bersih</p>
            <p className={`text-xl font-bold ${
              calculationResult.profit > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(calculationResult.profit)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Keuntungan per unit</p>
          </div>
        </div>
        
        {/* Analisis Promo */}
        <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Analisis Promo
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">
                <span className="font-medium">Status Profit:</span> 
                <span className={`ml-1 ${calculationResult.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {calculationResult.profit > 0 ? '✅ Menguntungkan' : '❌ Merugi'}
                </span>
              </p>
              <p className="text-gray-600 mt-1">
                <span className="font-medium">Margin Status:</span> 
                <span className={`ml-1 ${calculationResult.promoMargin > 20 ? 'text-green-600' : calculationResult.promoMargin > 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {calculationResult.promoMargin > 20 ? '🟢 Sangat Baik' : calculationResult.promoMargin > 10 ? '🟡 Cukup' : '🔴 Rendah'}
                </span>
              </p>
            </div>
            <div>
              <p className="text-gray-600">
                <span className="font-medium">Daya Tarik:</span> 
                <span className={`ml-1 ${calculationResult.savings > 10000 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {calculationResult.savings > 10000 ? '🔥 Menarik' : '⚡ Standar'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};