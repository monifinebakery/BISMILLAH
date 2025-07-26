// 🎯 Preview hasil perhitungan promo

import React from 'react';
import { Save, TrendingUp, DollarSign, Percent } from 'lucide-react';

const PromoPreview = ({ type, data, onSave, isLoading }) => {
  const { calculationResult } = data;

  if (!type) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <div className="text-gray-400 text-4xl mb-4">📊</div>
        <p className="text-gray-600">Pilih tipe promo untuk melihat preview</p>
      </div>
    );
  }

  if (!calculationResult) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <div className="text-gray-400 text-4xl mb-4">⚡</div>
        <p className="text-gray-600">Lengkapi form untuk melihat perhitungan</p>
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900">Preview Promo</h4>
        <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-sm font-medium">
          {type.toUpperCase()}
        </span>
      </div>

      {/* Calculation Results */}
      <div className="space-y-4">
        {/* HPP Information */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-900">HPP Analysis</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-blue-700">HPP Normal</p>
              <p className="font-semibold text-blue-900">
                {formatCurrency(calculationResult.normalHpp)}
              </p>
            </div>
            <div>
              <p className="text-blue-700">HPP Promo</p>
              <p className="font-semibold text-blue-900">
                {formatCurrency(calculationResult.promoHpp)}
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Information */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-900">Pricing</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-green-700">Harga Normal</p>
              <p className="font-semibold text-green-900">
                {formatCurrency(calculationResult.normalPrice)}
              </p>
            </div>
            <div>
              <p className="text-green-700">Harga Promo</p>
              <p className="font-semibold text-green-900">
                {formatCurrency(calculationResult.promoPrice)}
              </p>
            </div>
          </div>
        </div>

        {/* Profit Analysis */}
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Percent className="h-4 w-4 text-orange-600" />
            <span className="font-medium text-orange-900">Profit Analysis</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-orange-700">Margin Normal</p>
              <p className="font-semibold text-orange-900">
                {formatPercent(calculationResult.normalMargin)}
              </p>
            </div>
            <div>
              <p className="text-orange-700">Margin Promo</p>
              <p className="font-semibold text-orange-900">
                {formatPercent(calculationResult.promoMargin)}
              </p>
            </div>
          </div>
        </div>

        {/* Impact Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 mb-2">Ringkasan Dampak</h5>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700">Pengurangan Harga:</span>
              <span className="font-semibold text-red-600">
                {formatCurrency(calculationResult.normalPrice - calculationResult.promoPrice)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Dampak Margin:</span>
              <span className={`font-semibold ${
                calculationResult.promoMargin < calculationResult.normalMargin 
                  ? 'text-red-600' 
                  : 'text-green-600'
              }`}>
                {calculationResult.promoMargin < calculationResult.normalMargin ? '-' : '+'}
                {formatPercent(Math.abs(calculationResult.promoMargin - calculationResult.normalMargin))}
              </span>
            </div>
          </div>
        </div>
      </div>

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
  );
};

export default PromoPreview;