// components/CalculationResults.tsx - Results Display

import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign,
  Percent,
  Save,
  BarChart3,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';
import { CalculationResultsProps, CalculationResult, Recipe } from '@/types';
import { formatCurrency, formatPercentage } from '@/utils/formatUtils';
import { analyzeMargin } from '@/utils/calculationUtils';

interface CalculationResultsComponent extends React.FC<CalculationResultsProps> {
  Header: React.FC<HeaderProps>;
  PriceComparison: React.FC<PriceComparisonProps>;
  MarginAnalysis: React.FC<MarginAnalysisProps>;
  SaveSection: React.FC<SaveSectionProps>;
  DetailedBreakdown: React.FC<DetailedBreakdownProps>;
}

interface HeaderProps {
  result: CalculationResult;
  recipe: Recipe;
}

interface PriceComparisonProps {
  originalPrice: number;
  promoPrice: number;
  discountAmount?: number;
  discountPercent?: number;
}

interface MarginAnalysisProps {
  marginRp: number;
  marginPercent: number;
  isNegativeMargin: boolean;
  hpp: number;
}

interface SaveSectionProps {
  promoName: string;
  onPromoNameChange: (name: string) => void;
  onSave: () => void;
  isSaving: boolean;
  disabled?: boolean;
}

interface DetailedBreakdownProps {
  isVisible: boolean;
  onToggle: () => void;
  result: CalculationResult;
  recipe: Recipe;
}

// 📊 Header Component
const Header: React.FC<HeaderProps> = ({ result, recipe }) => {
  const getStatusIcon = () => {
    if (result.isNegativeMargin) {
      return <AlertTriangle className="h-6 w-6 text-red-500" />;
    }
    return <CheckCircle className="h-6 w-6 text-green-500" />;
  };

  const getStatusText = () => {
    if (result.isNegativeMargin) {
      return "Margin Negatif - Berpotensi Rugi";
    }
    return "Kalkulasi Berhasil";
  };

  const getStatusColor = () => {
    if (result.isNegativeMargin) {
      return "text-red-600";
    }
    return "text-green-600";
  };

  return (
    <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
      <div className="p-2 bg-white rounded-lg shadow-sm">
        <Calculator className="h-6 w-6 text-blue-600" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {getStatusIcon()}
          <h3 className="text-lg font-semibold text-gray-900">
            Hasil Kalkulasi Promo
          </h3>
        </div>
        
        <p className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </p>
        
        <p className="text-sm text-gray-600 mt-1">
          Produk: <span className="font-medium">{recipe.namaResep}</span>
        </p>
      </div>
    </div>
  );
};

// 💰 Price Comparison Component
const PriceComparison: React.FC<PriceComparisonProps> = ({
  originalPrice,
  promoPrice,
  discountAmount = 0,
  discountPercent = 0
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Original Price */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Harga Asli</span>
        </div>
        <p className="text-xl font-bold text-gray-900">
          {formatCurrency(originalPrice)}
        </p>
      </div>

      {/* Promo Price */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">Harga Promo</span>
        </div>
        <p className="text-xl font-bold text-green-600">
          {formatCurrency(promoPrice)}
        </p>
      </div>

      {/* Savings */}
      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Percent className="h-4 w-4 text-orange-600" />
          <span className="text-sm font-medium text-orange-700">Penghematan</span>
        </div>
        <p className="text-xl font-bold text-orange-600">
          {formatCurrency(discountAmount)}
        </p>
        <p className="text-sm text-orange-600 mt-1">
          ({discountPercent.toFixed(1)}%)
        </p>
      </div>
    </div>
  );
};

// 📈 Margin Analysis Component
const MarginAnalysis: React.FC<MarginAnalysisProps> = ({
  marginRp,
  marginPercent,
  isNegativeMargin,
  hpp
}) => {
  const marginAnalysis = analyzeMargin(marginPercent);

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-gray-900">Analisis Margin</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Margin in Rupiah */}
        <div className={`p-4 border rounded-lg ${marginAnalysis.bgColor}`}>
          <div className="flex items-center gap-2 mb-2">
            {isNegativeMargin ? (
              <TrendingDown className="h-5 w-5 text-red-500" />
            ) : (
              <TrendingUp className="h-5 w-5 text-green-500" />
            )}
            <span className="text-sm font-medium text-gray-700">Margin (Rp)</span>
          </div>
          <p className={`text-2xl font-bold ${marginAnalysis.color}`}>
            {formatCurrency(marginRp)}
          </p>
        </div>

        {/* Margin Percentage */}
        <div className={`p-4 border rounded-lg ${marginAnalysis.bgColor}`}>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Margin (%)</span>
          </div>
          <p className={`text-2xl font-bold ${marginAnalysis.color}`}>
            {formatPercentage(marginPercent)}
          </p>
        </div>
      </div>

      {/* Margin Status */}
      <div className={`p-4 border rounded-lg ${marginAnalysis.bgColor}`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${marginAnalysis.bgColor}`}>
            {isNegativeMargin ? (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
          </div>
          
          <div className="flex-1">
            <h5 className={`font-semibold ${marginAnalysis.color}`}>
              Status: {marginAnalysis.label}
            </h5>
            <p className="text-sm text-gray-600 mt-1">
              {marginAnalysis.recommendation}
            </p>
            
            {isNegativeMargin && (
              <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  <strong>Peringatan:</strong> Harga promo ({formatCurrency(marginRp + hpp)}) 
                  lebih rendah dari HPP ({formatCurrency(hpp)}). 
                  Promo ini akan menyebabkan kerugian sebesar {formatCurrency(Math.abs(marginRp))}.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 💾 Save Section Component
const SaveSection: React.FC<SaveSectionProps> = ({
  promoName,
  onPromoNameChange,
  onSave,
  isSaving,
  disabled = false
}) => {
  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-gray-900">Simpan Promo</h4>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nama Promo
          </label>
          <input
            type="text"
            value={promoName}
            onChange={(e) => onPromoNameChange(e.target.value)}
            placeholder="Masukkan nama promo..."
            disabled={disabled || isSaving}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200 disabled:bg-gray-100 disabled:text-gray-500"
          />
        </div>

        <button
          onClick={onSave}
          disabled={disabled || isSaving || !promoName.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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

// 📋 Detailed Breakdown Component
const DetailedBreakdown: React.FC<DetailedBreakdownProps> = ({
  isVisible,
  onToggle,
  result,
  recipe
}) => {
  const calculationSteps = useMemo(() => {
    const steps = [];
    
    steps.push({
      label: 'Harga Jual Asli',
      value: formatCurrency(recipe.hargaJualPorsi),
      description: 'Harga jual produk sebelum promo'
    });

    steps.push({
      label: 'HPP (Harga Pokok Penjualan)',
      value: formatCurrency(recipe.hppPerPorsi),
      description: 'Biaya produksi per porsi'
    });

    if (result.discountAmount) {
      steps.push({
        label: 'Diskon Diberikan',
        value: formatCurrency(result.discountAmount),
        description: `Potongan harga (${result.discountPercent?.toFixed(1)}%)`
      });
    }

    steps.push({
      label: 'Harga Jual Promo',
      value: formatCurrency(result.price),
      description: 'Harga final setelah promo'
    });

    steps.push({
      label: 'Margin Keuntungan',
      value:urrency(result.marginRp),
      description: `${formatPercentage(result.marginPercent)} dari harga promo`,
      isHighlight: true,
      isNegative: result.isNegativeMargin
    });

    return steps;
  }, [result, recipe]);

  return (
    <div className="space-y-4">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
      >
        {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        <span>{isVisible ? 'Sembunyikan' : 'Tampilkan'} Detail Kalkulasi</span>
      </button>

      {isVisible && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <Info className="h-4 w-4 text-blue-600" />
            <h5 className="font-medium text-gray-900">Langkah Kalkulasi</h5>
          </div>

          <div className="space-y-3">
            {calculationSteps.map((step, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  step.isHighlight
                    ? step.isNegative
                      ? 'bg-red-50 border-red-200'
                      : 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className={`font-medium ${
                      step.isHighlight
                        ? step.isNegative
                          ? 'text-red-800'
                          : 'text-green-800'
                        : 'text-gray-900'
                    }`}>
                      {step.label}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {step.description}
                    </p>
                  </div>
                  <p className={`text-lg font-bold ${
                    step.isHighlight
                      ? step.isNegative
                        ? 'text-red-600'
                        : 'text-green-600'
                      : 'text-gray-900'
                  }`}>
                    {step.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Status Margin:
              </span>
              <span className={`text-sm font-bold ${
                result.isNegativeMargin ? 'text-red-600' : 'text-green-600'
              }`}>
                {result.isNegativeMargin ? 'RUGI' : 'UNTUNG'} {formatCurrency(Math.abs(result.marginRp))}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 🎯 Main Calculation Results Component
const CalculationResults: CalculationResultsComponent = ({
  result,
  recipe,
  promoName,
  onPromoNameChange,
  onSave,
  isSaving,
  showBreakdown = true,
  showWarnings = true
}) => {
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);

  if (!result || !recipe) {
    return (
      <div className="text-center py-8">
        <Calculator className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Belum ada hasil kalkulasi</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Header result={result} recipe={recipe} />

      {/* Price Comparison */}
      <PriceComparison
        originalPrice={recipe.hargaJualPorsi}
        promoPrice={result.price}
        discountAmount={result.discountAmount}
        discountPercent={result.discountPercent}
      />

      {/* Margin Analysis */}
      <MarginAnalysis
        marginRp={result.marginRp}
        marginPercent={result.marginPercent}
        isNegativeMargin={result.isNegativeMargin}
        hpp={recipe.hppPerPorsi}
      />

      {/* Detailed Breakdown */}
      {showBreakdown && (
        <DetailedBreakdown
          isVisible={showDetailedBreakdown}
          onToggle={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
          result={result}
          recipe={recipe}
        />
      )}

      {/* Save Section */}
      <SaveSection
        promoName={promoName}
        onPromoNameChange={onPromoNameChange}
        onSave={onSave}
        isSaving={isSaving}
        disabled={result.isNegativeMargin && showWarnings}
      />

      {/* Warning for negative margin */}
      {result.isNegativeMargin && showWarnings && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800 mb-1">
                Peringatan: Margin Negatif
              </h4>
              <p className="text-sm text-red-700">
                Promo ini akan menyebabkan kerugian. Pertimbangkan untuk mengurangi diskon 
                atau meninjau kembali HPP produk sebelum menyimpan.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Attach sub-components
CalculationResults.Header = Header;
CalculationResults.PriceComparison = PriceComparison;
CalculationResults.MarginAnalysis = MarginAnalysis;
CalculationResults.SaveSection = SaveSection;
CalculationResults.DetailedBreakdown = DetailedBreakdown;

export default CalculationResults;