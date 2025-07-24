// components/PromoTypeForm.tsx - Dynamic Promo Forms

import React, { useState, useEffect, useMemo } from 'react';
import { Percent, DollarSign, Gift, Target, Calculator, AlertTriangle } from 'lucide-react';
import { PromoType, PromoDetails, Recipe } from '@/types';
import { formatCurrency, formatPercentage } from '@/utils/formatUtils';
import { calculatePromoResult } from '@/utils/calculationUtils';

interface PromoTypeFormProps {
  promoType: PromoType;
  recipe: Recipe | null;
  value: PromoDetails;
  onChange: (details: PromoDetails) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  showPreview?: boolean;
}

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
  helpText?: string;
}

interface PreviewCardProps {
  recipe: Recipe;
  promoDetails: PromoDetails;
  className?: string;
}

// 📝 Form Field Wrapper
const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  children,
  required = false,
  helpText
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {helpText && !error && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}
      {error && (
        <div className="flex items-center gap-1 text-sm text-red-600">
          <AlertTriangle className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

// 👁️ Preview Card Component
const PreviewCard: React.FC<PreviewCardProps> = ({
  recipe,
  promoDetails,
  className = ""
}) => {
  const calculation = useMemo(() => {
    if (!recipe) return null;
    
    let discountValue = 0;
    let bogoBuy = 1;
    let bogoGet = 0;

    if (promoDetails.type === 'discount_percent') {
      discountValue = promoDetails.value;
    } else if (promoDetails.type === 'discount_rp') {
      discountValue = promoDetails.value;
    } else if (promoDetails.type === 'bogo') {
      bogoBuy = promoDetails.buy;
      bogoGet = promoDetails.get;
    }

    return calculatePromoResult({
      originalPrice: recipe.hargaJualPorsi,
      originalHpp: recipe.hppPerPorsi,
      promoType: promoDetails.type,
      discountValue,
      bogoBuy,
      bogoGet
    });
  }, [recipe, promoDetails]);

  if (!calculation) return null;

  const getMarginColor = (marginPercent: number) => {
    if (marginPercent < 0) return 'text-red-600 bg-red-50';
    if (marginPercent < 0.1) return 'text-orange-600 bg-orange-50';
    if (marginPercent < 0.2) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className={`p-4 bg-blue-50 border border-blue-200 rounded-lg ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="h-4 w-4 text-blue-600" />
        <h4 className="text-sm font-medium text-blue-800">Preview Promo</h4>
      </div>

      <div className="space-y-3">
        {/* Price Comparison */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-600">Harga Asli:</span>
            <p className="font-medium">{formatCurrency(recipe.hargaJualPorsi)}</p>
          </div>
          <div>
            <span className="text-blue-600">Harga Promo:</span>
            <p className="font-medium">{formatCurrency(calculation.price)}</p>
          </div>
        </div>

        {/* Discount Information */}
        {calculation.discountAmount && (
          <div className="text-sm">
            <span className="text-blue-600">Penghematan:</span>
            <p className="font-medium">
              {formatCurrency(calculation.discountAmount)} 
              ({calculation.discountPercent?.toFixed(1)}%)
            </p>
          </div>
        )}

        {/* Margin Information */}
        <div className="flex items-center justify-between pt-2 border-t border-blue-200">
          <span className="text-sm text-blue-600">Margin:</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {formatCurrency(calculation.marginRp)}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMarginColor(calculation.marginPercent)}`}>
              {formatPercentage(calculation.marginPercent)}
            </span>
          </div>
        </div>

        {/* Warning for negative margin */}
        {calculation.isNegativeMargin && (
          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            <AlertTriangle className="h-4 w-4" />
            <span>Peringatan: Margin negatif - promo ini akan menyebabkan kerugian!</span>
          </div>
        )}
      </div>
    </div>
  );
};

// 📊 Discount Percent Form
const DiscountPercentForm: React.FC<{
  value: number;
  onChange: (value: number) => void;
  error?: string;
  disabled?: boolean;
}> = ({ value, onChange, error, disabled }) => {
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/[^0-9.,]/g, '');
    setInputValue(newValue);

    const numericValue = parseFloat(newValue.replace(',', '.'));
    if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 99) {
      onChange(numericValue);
    }
  };

  const handleBlur = () => {
    const numericValue = parseFloat(inputValue.replace(',', '.'));
    if (isNaN(numericValue) || numericValue < 0) {
      setInputValue('0');
      onChange(0);
    } else if (numericValue > 99) {
      setInputValue('99');
      onChange(99);
    } else {
      setInputValue(numericValue.toString());
      onChange(numericValue);
    }
  };

  return (
    <div className="space-y-4">
      <FormField
        label="Persentase Diskon"
        error={error}
        required
        helpText="Masukkan persentase diskon (0-99%)"
      >
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="0"
            disabled={disabled}
            className={`
              w-full px-3 py-2 pr-8 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200
              ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'}
              ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
            `}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Percent className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </FormField>

      {/* Quick preset buttons */}
      {!disabled && (
        <div className="space-y-2">
          <span className="text-xs text-gray-500">Preset populer:</span>
          <div className="flex flex-wrap gap-2">
            {[5, 10, 15, 20, 25, 30, 40, 50].map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setInputValue(preset.toString());
                  onChange(preset);
                }}
                className={`
                  px-3 py-1 text-xs rounded-full border transition-colors
                  ${value === preset
                    ? 'bg-orange-600 text-white border-orange-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }
                `}
              >
                {preset}%
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Calculation helper */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Info Diskon</span>
        </div>
        <p className="text-sm text-gray-600">
          Diskon {value}% akan mengurangi harga jual sebesar {formatPercentage(value / 100)} dari harga asli
        </p>
      </div>
    </div>
  );
};

// 💰 Discount Rupiah Form
const DiscountRpForm: React.FC<{
  value: number;
  onChange: (value: number) => void;
  error?: string;
  disabled?: boolean;
  maxPrice?: number;
}> = ({ value, onChange, error, disabled, maxPrice }) => {
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/[^0-9]/g, '');
    setInputValue(newValue);

    const numericValue = parseInt(newValue) || 0;
    if (numericValue >= 0) {
      onChange(numericValue);
    }
  };

  const handleBlur = () => {
    const numericValue = parseInt(inputValue) || 0;
    const finalValue = Math.max(0, numericValue);
    setInputValue(finalValue.toString());
    onChange(finalValue);
  };

  return (
    <div className="space-y-4">
      <FormField
        label="Nominal Diskon"
        error={error}
        required
        helpText={`Masukkan nominal diskon dalam rupiah${maxPrice ? ` (maksimal ${formatCurrency(maxPrice)})` : ''}`}
      >
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 text-sm">Rp</span>
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="0"
            disabled={disabled}
            className={`
              w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200
              ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'}
              ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
            `}
          />
        </div>
      </FormField>

      {/* Quick preset buttons */}
      {!disabled && (
        <div className="space-y-2">
          <span className="text-xs text-gray-500">Preset populer:</span>
          <div className="flex flex-wrap gap-2">
            {[1000, 2500, 5000, 7500, 10000, 15000, 20000, 25000].map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setInputValue(preset.toString());
                  onChange(preset);
                }}
                className={`
                  px-3 py-1 text-xs rounded-full border transition-colors
                  ${value === preset
                    ? 'bg-orange-600 text-white border-orange-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }
                `}
              >
                {formatCurrency(preset)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Calculation helper */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Info Diskon</span>
        </div>
        <p className="text-sm text-gray-600">
          Potongan {formatCurrency(value)} akan dikurangkan dari harga asli
        </p>
        {maxPrice && value > maxPrice && (
          <p className="text-sm text-red-600 mt-1">
            ⚠️ Diskon melebihi harga produk ({formatCurrency(maxPrice)})
          </p>
        )}
      </div>
    </div>
  );
};

// 🎁 BOGO Form
const BOGOForm: React.FC<{
  buy: number;
  get: number;
  onBuyChange: (value: number) => void;
  onGetChange: (value: number) => void;
  errors?: { buy?: string; get?: string };
  disabled?: boolean;
}> = ({ buy, get, onBuyChange, onGetChange, errors, disabled }) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Jumlah Beli"
          error={errors?.buy}
          required
          helpText="Minimal 1 item"
        >
          <input
            type="number"
            value={buy}
            onChange={(e) => onBuyChange(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            max="10"
            disabled={disabled}
            className={`
              w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200
              ${errors?.buy ? 'border-red-300 bg-red-50' : 'border-gray-300'}
              ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
            `}
          />
        </FormField>

        <FormField
          label="Jumlah Gratis"
          error={errors?.get}
          required
          helpText="Minimal 0 item"
        >
          <input
            type="number"
            value={get}
            onChange={(e) => onGetChange(Math.max(0, parseInt(e.target.value) || 0))}
            min="0"
            max="10"
            disabled={disabled}
            className={`
              w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200
              ${errors?.get ? 'border-red-300 bg-red-50' : 'border-gray-300'}
              ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
            `}
          />
        </FormField>
      </div>

      {/* Quick preset buttons */}
      {!disabled && (
        <div className="space-y-2">
          <span className="text-xs text-gray-500">Template populer:</span>
          <div className="flex flex-wrap gap-2">
            {[
              { buy: 1, get: 1, label: 'Buy 1 Get 1' },
              { buy: 2, get: 1, label: 'Buy 2 Get 1' },
              { buy: 3, get: 1, label: 'Buy 3 Get 1' },
              { buy: 2, get: 2, label: 'Buy 2 Get 2' },
              { buy: 3, get: 2, label: 'Buy 3 Get 2' }
            ].map(({ buy: b, get: g, label }) => (
              <button
                key={label}
                onClick={() => {
                  onBuyChange(b);
                  onGetChange(g);
                }}
                className={`
                  px-3 py-1 text-xs rounded-full border transition-colors
                  ${buy === b && get === g
                    ? 'bg-orange-600 text-white border-orange-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }
                `}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* BOGO Preview */}
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">Preview BOGO</span>
        </div>
        <div className="space-y-1 text-sm text-green-700">
          <p>
            <span className="font-semibold">Beli {buy}</span> produk, 
            <span className="font-semibold"> gratis {get}</span> produk
          </p>
          <p className="text-xs">
            Total: {buy + get} produk dengan harga {buy} produk
            {get > 0 && (
              <span className="ml-2 text-green-600">
                (Hemat {((get / (buy + get)) * 100).toFixed(0)}%)
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

// 🎯 Main Promo Type Form Component
const PromoTypeForm: React.FC<PromoTypeFormProps> = ({
  promoType,
  recipe,
  value,
  onChange,
  errors = {},
  disabled = false,
  showPreview = true
}) => {
  const handleDiscountPercentChange = (discountValue: number) => {
    onChange({ type: 'discount_percent', value: discountValue });
  };

  const handleDiscountRpChange = (discountValue: number) => {
    onChange({ type: 'discount_rp', value: discountValue });
  };

  const handleBOGOChange = (buy: number, get: number) => {
    onChange({ type: 'bogo', buy, get });
  };

  return (
    <div className="space-y-6">
      {/* Form based on promo type */}
      {promoType === 'discount_percent' && (
        <DiscountPercentForm
          value={value.type === 'discount_percent' ? value.value : 0}
          onChange={handleDiscountPercentChange}
          error={errors.discountValue}
          disabled={disabled}
        />
      )}

      {promoType === 'discount_rp' && (
        <DiscountRpForm
          value={value.type === 'discount_rp' ? value.value : 0}
          onChange={handleDiscountRpChange}
          error={errors.discountValue}
          disabled={disabled}
          maxPrice={recipe?.hargaJualPorsi}
        />
      )}

      {promoType === 'bogo' && (
        <BOGOForm
          buy={value.type === 'bogo' ? value.buy : 2}
          get={value.type === 'bogo' ? value.get : 1}
          onBuyChange={(buy) => handleBOGOChange(buy, value.type === 'bogo' ? value.get : 1)}
          onGetChange={(get) => handleBOGOChange(value.type === 'bogo' ? value.buy : 2, get)}
          errors={{
            buy: errors.bogoBuy,
            get: errors.bogoGet
          }}
          disabled={disabled}
        />
      )}

      {/* Preview */}
      {showPreview && recipe && (
        <PreviewCard
          recipe={recipe}
          promoDetails={value}
        />
      )}
    </div>
  );
};

export default PromoTypeForm;