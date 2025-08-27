// 🎯 Card untuk menampilkan performa individual promo

import React from 'react';
import { TrendingUp, TrendingDown, Gift, Percent, Package } from 'lucide-react';

const PromoPerformanceCard = ({ promo }: any) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getPromoIcon = (type) => {
    switch (type) {
      case 'bogo': return <Gift className="h-5 w-5 text-green-600" />;
      case 'discount': return <Percent className="h-5 w-5 text-blue-600" />;
      case 'bundle': return <Package className="h-5 w-5 text-purple-600" />;
      default: return <Gift className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPromoTypeLabel = (type) => {
    switch (type) {
      case 'bogo': return 'BOGO';
      case 'discount': return 'Diskon';
      case 'bundle': return 'Bundle';
      default: return type;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'aktif': return 'bg-green-100 text-green-800';
      case 'nonaktif': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-200 text-gray-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const marginDiff = (promo.calculation_result?.promoMargin || 0) - (promo.calculation_result?.normalMargin || 0);
  const isMarginPositive = marginDiff >= 0;

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {getPromoIcon(promo.tipe_promo)}
          <span className="text-xs font-medium text-gray-600 bg-gray-200 px-2 py-1 rounded">
            {getPromoTypeLabel(promo.tipe_promo)}
          </span>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(promo.status)}`}>
          {promo.status}
        </span>
      </div>

      {/* Promo Name */}
      <h4 className="font-semibold text-gray-900 mb-3 line-clamp-2">
        {promo.nama_promo}
      </h4>

      {/* Metrics */}
      <div className="space-y-3">
        {/* HPP vs Harga */}
        <div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">HPP:</span>
            <span className="font-medium text-red-600">
              {formatCurrency(promo.calculation_result?.promoHpp || 0)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Harga Jual:</span>
            <span className="font-medium text-green-600">
              {formatCurrency(promo.calculation_result?.promoPrice || 0)}
            </span>
          </div>
        </div>

        {/* Margin Analysis */}
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Margin Promo:</span>
            <div className="flex items-center space-x-1">
              <span className="font-semibold text-gray-900">
                {(promo.calculation_result?.promoMargin || 0).toFixed(1)}%
              </span>
              {isMarginPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>vs Normal:</span>
            <span className={isMarginPositive ? 'text-green-600' : 'text-red-600'}>
              {isMarginPositive ? '+' : ''}{marginDiff.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Impact Summary */}
        {promo.calculation_result?.savings && (
          <div className="pt-3 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Hemat Customer:</span>
              <span className="font-medium text-orange-600">
                {formatCurrency(promo.calculation_result.savings)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
        Dibuat: {new Date(promo.created_at).toLocaleDateString('id-ID')}
      </div>
    </div>
  );
};

export default PromoPerformanceCard;