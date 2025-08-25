// 🎯 Preview hasil perhitungan promo (yang belum lengkap sebelumnya)

import React from 'react';
import { Save, TrendingUp, DollarSign, Percent, AlertCircle } from 'lucide-react';

const PromoPreview = ({ type, data, onSave, isLoading }: any) => {
  const { calculationResult } = data;

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const formatPercent = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  if (!type) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <div className="text-gray-400 text-4xl mb-4">📊</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Preview Promo</h3>
        <p className="text-gray-600">Pilih tipe promo untuk melihat preview</p>
      </div>
    );
  }

  if (!calculationResult) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <div className="text-gray-400 text-4xl mb-4">⚡</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Siap Menghitung</h3>
        <p className="text-gray-600">Lengkapi form untuk melihat perhitungan</p>
      </div>
    );
  }

  const marginDiff = calculationResult.promoMargin - calculationResult.normalMargin;
  const isMarginDecreased = marginDiff < 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
        <div className="flex items-center justify-between text-white">
          <h4 className="text-lg font-semibold">Preview Promo</h4>
          <span className="bg-white bg-opacity-20 text-white px-3 py-1 rounded-full text-sm font-medium">
            {type.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Warning jika margin turun drastis */}
        {isMarginDecreased && Math.abs(marginDiff) > 10 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h5 className="text-sm font-medium text-yellow-800">Perhatian Margin</h5>
              <p className="text-sm text-yellow-700">
                Margin turun {Math.abs(marginDiff).toFixed(1)}%. Pastikan promo ini menguntungkan.
              </p>
            </div>
          </div>
        )}

        {/* Calculation Results */}
        <div className="grid grid-cols-2 gap-4">
          {/* HPP Information */}
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <DollarSign className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-900">HPP</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-red-700">Normal:</span>
                <span className="font-semibold text-red-900">
                  {formatCurrency(calculationResult.normalHpp)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-700">Promo:</span>
                <span className="font-semibold text-red-900">
                  {formatCurrency(calculationResult.promoHpp)}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-900">Harga</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Normal:</span>
                <span className="font-semibold text-green-900">
                  {formatCurrency(calculationResult.normalPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Promo:</span>
                <span className="font-semibold text-green-900">
                  {formatCurrency(calculationResult.promoPrice)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profit Analysis */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Percent className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900">Analisis Profit</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-blue-700">Margin Normal:</span>
                <span className="font-semibold text-blue-900">
                  {formatPercent(calculationResult.normalMargin)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Margin Promo:</span>
                <span className="font-semibold text-blue-900">
                  {formatPercent(calculationResult.promoMargin)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-blue-700">Selisih:</span>
                <span className={`font-semibold ${isMarginDecreased ? 'text-red-600' : 'text-green-600'}`}>
                  {isMarginDecreased ? '' : '+'}{formatPercent(marginDiff)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Profit:</span>
                <span className="font-semibold text-blue-900">
                  {formatCurrency(calculationResult.promoProfit || (calculationResult.promoPrice - calculationResult.promoHpp))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Type-specific Information */}
        {type === 'bogo' && calculationResult.effectiveDiscount && (
          <div className="bg-purple-50 rounded-lg p-4">
            <h5 className="font-medium text-purple-900 mb-2">Info BOGO</h5>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-purple-700">Resep Utama:</span>
                <span className="font-medium text-purple-900">{calculationResult.mainRecipe}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">Resep Gratis:</span>
                <span className="font-medium text-purple-900">{calculationResult.freeRecipe}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">Nilai Gratis:</span>
                <span className="font-medium text-purple-900">{formatCurrency(calculationResult.effectiveDiscount)}</span>
              </div>
            </div>
          </div>
        )}

        {type === 'discount' && calculationResult.discountAmount && (
          <div className="bg-purple-50 rounded-lg p-4">
            <h5 className="font-medium text-purple-900 mb-2">Info Diskon</h5>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-purple-700">Tipe Diskon:</span>
                <span className="font-medium text-purple-900">
                  {calculationResult.discountType === 'persentase' ? 'Persentase' : 'Nominal'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">Nilai Diskon:</span>
                <span className="font-medium text-purple-900">
                  {calculationResult.discountType === 'persentase' 
                    ? `${calculationResult.discountValue}%` 
                    : formatCurrency(calculationResult.discountValue)
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">Potongan:</span>
                <span className="font-medium text-purple-900">{formatCurrency(calculationResult.discountAmount)}</span>
              </div>
            </div>
          </div>
        )}

        {type === 'bundle' && calculationResult.savings && (
          <div className="bg-purple-50 rounded-lg p-4">
            <h5 className="font-medium text-purple-900 mb-2">Info Bundle</h5>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-purple-700">Jumlah Item:</span>
                <span className="font-medium text-purple-900">{calculationResult.itemCount} produk</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">Hemat Customer:</span>
                <span className="font-medium text-green-600">{formatCurrency(calculationResult.savings)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-purple-700">Persentase Hemat:</span>
                <span className="font-medium text-green-600">{formatPercent(calculationResult.savingsPercent)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={onSave}
          disabled={isLoading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Simpan Promo</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PromoPreview;