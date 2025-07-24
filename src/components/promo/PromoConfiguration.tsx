// components/PromoConfiguration.tsx - Promo Configuration Component

import React, { useState, useCallback } from 'react';
import { Percent, DollarSign, Gift, AlertCircle, Info, Zap } from 'lucide-react';
import { PromoConfigurationProps, PromoType } from '@/types';
import { formatCurrency } from '@/utils/formatUtils';
import { PROMO_TYPE_LABELS, VALIDATION_RULES } from '@/utils/constants';

interface PromoConfigurationComponent extends React.FC<PromoConfigurationProps> {
  TypeSelector: React.FC<TypeSelectorProps>;
  DiscountInput: React.FC<DiscountInputProps>;
  BOGOInput: React.FC<BOGOInputProps>;
  ValidationMessage: React.FC<ValidationMessageProps>;
}

interface TypeSelectorProps {
  selectedType: PromoType;
  onTypeChange: (type: PromoType) => void;
  disabled?: boolean;
}

interface DiscountInputProps {
  type: 'percent' | 'rp';
  value: number;
  onChange: (value: number) => void;
  error?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
}

interface BOGOInputProps {
  buy: number;
  get: number;
  onBuyChange: (value: number) => void;
  onGetChange: (value: number) => void;
  errors?: { buy?: string; get?: string };
  disabled?: boolean;
}

interface ValidationMessageProps {
  type: 'error' | 'warning' | 'info';
  message: string;
}

// 🎯 Type Selector Component
const TypeSelector: React.FC<TypeSelectorProps> = ({
  selectedType,
  onTypeChange,
  disabled = false
}) => {
  const promoTypes = [
    {
      type: 'discount_percent' as PromoType,
      icon: Percent,
      title: 'Diskon Persentase',
      description: 'Berikan diskon dalam bentuk persentase dari harga asli',
      example: 'Contoh: Diskon 20% dari harga Rp 15.000'
    },
    {
      type: 'discount_rp' as PromoType,
      icon: DollarSign,
      title: 'Diskon Nominal',
      description: 'Berikan potongan harga dalam rupiah',
      example: 'Contoh: Potongan Rp 5.000 dari harga asli'
    },
    {
      type: 'bogo' as PromoType,
      icon: Gift,
      title: 'Beli X Gratis Y',
      description: 'Program beli sejumlah item dan dapat gratis',
      example: 'Contoh: Beli 2 Gratis 1 (BOGO)'
    }
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">Jenis Promo</h3>
      <div className="grid gap-3">
        {promoTypes.map(({ type, icon: Icon, title, description, example }) => (
          <button
            key={type}
            onClick={() => onTypeChange(type)}
            disabled={disabled}
            className={`
              p-4 border rounded-lg text-left transition-all duration-200 group
              ${selectedType === type
                ? 'border-orange-500 bg-orange-50 shadow-sm'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-start gap-3">
              <div className={`
                p-2 rounded-lg transition-colors
                ${selectedType === type
                  ? 'bg-orange-100 text-orange-600'
                  : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                }
              `}>
                <Icon className="h-5 w-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900">{title}</h4>
                  {selectedType === type && (
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{description}</p>
                
                <p className="text-xs text-gray-500 italic">{example}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// 💰 Discount Input Component
const DiscountInput: React.FC<DiscountInputProps> = ({
  type,
  value,
  onChange,
  error,
  disabled = false,
  min,
  max
}) => {
  const [inputValue, setInputValue] = useState(value.toString());

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/[^0-9.,]/g, '');
    setInputValue(newValue);
    
    const numericValue = parseFloat(newValue.replace(',', '.'));
    if (!isNaN(numericValue)) {
      onChange(numericValue);
    }
  }, [onChange]);

  const handleInputBlur = useCallback(() => {
    const numericValue = parseFloat(inputValue.replace(',', '.'));
    if (isNaN(numericValue)) {
      setInputValue('0');
      onChange(0);
    } else {
      setInputValue(numericValue.toString());
    }
  }, [inputValue, onChange]);

  const formatPlaceholder = () => {
    if (type === 'percent') return 'Masukkan persentase (0-99)';
    return 'Masukkan nominal rupiah';
  };

  const formatPrefix = () => {
    if (type === 'rp') return 'Rp';
    return '';
  };

  const formatSuffix = () => {
    if (type === 'percent') return '%';
    return '';
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {type === 'percent' ? 'Persentase Diskon' : 'Nominal Diskon'}
      </label>
      
      <div className="relative">
        {formatPrefix() && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 text-sm">{formatPrefix()}</span>
          </div>
        )}
        
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={formatPlaceholder()}
          disabled={disabled}
          min={min}
          max={max}
          className={`
            w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200
            ${formatPrefix() ? 'pl-8' : ''}
            ${formatSuffix() ? 'pr-8' : ''}
            ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'}
            ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
          `}
        />
        
        {formatSuffix() && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 text-sm">{formatSuffix()}</span>
          </div>
        )}
      </div>

      {error && (
        <ValidationMessage type="error" message={error} />
      )}

      {/* Quick preset buttons for percentage */}
      {type === 'percent' && !disabled && (
        <div className="flex gap-2">
          <span className="text-xs text-gray-500 self-center">Cepat:</span>
          {[10, 15, 20, 25, 30].map((preset) => (
            <button
              key={preset}
              onClick={() => {
                setInputValue(preset.toString());
                onChange(preset);
              }}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              {preset}%
            </button>
          ))}
        </div>
      )}

      {/* Quick preset buttons for rupiah */}
      {type === 'rp' && !disabled && (
        <div className="flex gap-2">
          <span className="text-xs text-gray-500 self-center">Cepat:</span>
          {[1000, 2500, 5000, 10000].map((preset) => (
            <button
              key={preset}
              onClick={() => {
                setInputValue(preset.toString());
                onChange(preset);
              }}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
            >
              {formatCurrency(preset)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// 🎁 BOGO Input Component
const BOGOInput: React.FC<BOGOInputProps> = ({
  buy,
  get,
  onBuyChange,
  onGetChange,
  errors,
  disabled = false
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Buy Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Jumlah Beli
          </label>
          <div className="relative">
            <input
              type="number"
              value={buy}
              onChange={(e) => onBuyChange(parseInt(e.target.value) || 1)}
              min="1"
              max="10"
              disabled={disabled}
              className={`
                w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200
                ${errors?.buy ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
              `}
            />
          </div>
          {errors?.buy && (
            <ValidationMessage type="error" message={errors.buy} />
          )}
        </div>

        {/* Get Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Jumlah Gratis
          </label>
          <div className="relative">
            <input
              type="number"
              value={get}
              onChange={(e) => onGetChange(parseInt(e.target.value) || 0)}
              min="0"
              max="10"
              disabled={disabled}
              className={`
                w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all duration-200
                ${errors?.get ? 'border-red-300 bg-red-50' : 'border-gray-300'}
                ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
              `}
            />
          </div>
          {errors?.get && (
            <ValidationMessage type="error" message={errors.get} />
          )}
        </div>
      </div>

      {/* BOGO Preview */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Preview BOGO</span>
        </div>
        <p className="text-sm text-blue-700">
          Beli <span className="font-semibold">{buy}</span> produk, 
          dapatkan <span className="font-semibold">{get}</span> produk gratis
        </p>
        {get > 0 && (
          <p className="text-xs text-blue-600 mt-1">
            Total: {buy + get} produk dengan harga {buy} produk
          </p>
        )}
      </div>

      {/* Quick presets */}
      {!disabled && (
        <div className="space-y-2">
          <span className="text-xs text-gray-500">Template populer:</span>
          <div className="flex gap-2">
            {[
              { buy: 1, get: 1, label: 'Buy 1 Get 1' },
              { buy: 2, get: 1, label: 'Buy 2 Get 1' },
              { buy: 3, get: 1, label: 'Buy 3 Get 1' },
              { buy: 2, get: 2, label: 'Buy 2 Get 2' }
            ].map(({ buy: b, get: g, label }) => (
              <button
                key={label}
                onClick={() => {
                  onBuyChange(b);
                  onGetChange(g);
                }}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ⚠️ Validation Message Component
const ValidationMessage: React.FC<ValidationMessageProps> = ({ type, message }) => {
  const getIcon = () => {
    switch (type) {
      case 'error': return AlertCircle;
      case 'warning': return AlertCircle;
      case 'info': return Info;
      default: return Info;
    }
  };

  const getColorClasses = () => {
    switch (type) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const Icon = getIcon();

  return (
    <div className={`flex items-start gap-2 p-2 border rounded text-sm ${getColorClasses()}`}>
      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
};

// 🎯 Main Promo Configuration Component
const PromoConfiguration: PromoConfigurationComponent = ({
  promoType,
  discountValue,
  bogoBuy,
  bogoGet,
  onPromoTypeChange,
  onDiscountValueChange,
  onBOGOChange,
  disabled = false
}) => {
  const [errors, setErrors] = useState<{
    discountValue?: string;
    bogoBuy?: string;
    bogoGet?: string;
  }>({});

  // Validation
  const validateDiscountValue = useCallback((value: number, type: PromoType) => {
    if (type === 'discount_percent') {
      if (value <= 0) return 'Diskon harus lebih dari 0%';
      if (value > VALIDATION_RULES.DISCOUNT_PERCENT.MAX) {
        return `Diskon maksimal ${VALIDATION_RULES.DISCOUNT_PERCENT.MAX}%`;
      }
    } else if (type === 'discount_rp') {
      if (value <= 0) return 'Diskon harus lebih dari 0';
      if (value > VALIDATION_RULES.DISCOUNT_RP.MAX) {
        return `Diskon maksimal ${formatCurrency(VALIDATION_RULES.DISCOUNT_RP.MAX)}`;
      }
    }
    return undefined;
  }, []);

  const validateBOGO = useCallback((buy: number, get: number) => {
    const errors: { buy?: string; get?: string } = {};
    
    if (buy < VALIDATION_RULES.BOGO.MIN_BUY) {
      errors.buy = `Minimal beli ${VALIDATION_RULES.BOGO.MIN_BUY}`;
    }
    if (buy > VALIDATION_RULES.BOGO.MAX_BUY) {
      errors.buy = `Maksimal beli ${VALIDATION_RULES.BOGO.MAX_BUY}`;
    }
    if (get < VALIDATION_RULES.BOGO.MIN_GET) {
      errors.get = `Minimal gratis ${VALIDATION_RULES.BOGO.MIN_GET}`;
    }
    if (get > VALIDATION_RULES.BOGO.MAX_GET) {
      errors.get = `Maksimal gratis ${VALIDATION_RULES.BOGO.MAX_GET}`;
    }
    
    return errors;
  }, []);

  // Handle discount value change with validation
  const handleDiscountValueChange = useCallback((value: number) => {
    const error = validateDiscountValue(value, promoType);
    setErrors(prev => ({ ...prev, discountValue: error }));
    onDiscountValueChange(value);
  }, [promoType, validateDiscountValue, onDiscountValueChange]);

  // Handle BOGO changes with validation
  const handleBOGOChange = useCallback((buy: number, get: number) => {
    const bogoErrors = validateBOGO(buy, get);
    setErrors(prev => ({ 
      ...prev, 
      bogoBuy: bogoErrors.buy, 
      bogoGet: bogoErrors.get 
    }));
    onBOGOChange(buy, get);
  }, [validateBOGO, onBOGOChange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Zap className="h-5 w-5 text-orange-500" />
        <h2 className="text-lg font-semibold text-gray-900">
          Konfigurasi Promo
        </h2>
      </div>

      {/* Type Selection */}
      <TypeSelector
        selectedType={promoType}
        onTypeChange={onPromoTypeChange}
        disabled={disabled}
      />

      {/* Configuration Inputs */}
      <div className="space-y-4">
        {promoType === 'discount_percent' && (
          <DiscountInput
            type="percent"
            value={discountValue}
            onChange={handleDiscountValueChange}
            error={errors.discountValue}
            disabled={disabled}
            min={VALIDATION_RULES.DISCOUNT_PERCENT.MIN}
            max={VALIDATION_RULES.DISCOUNT_PERCENT.MAX}
          />
        )}

        {promoType === 'discount_rp' && (
          <DiscountInput
            type="rp"
            value={discountValue}
            onChange={handleDiscountValueChange}
            error={errors.discountValue}
            disabled={disabled}
            min={VALIDATION_RULES.DISCOUNT_RP.MIN}
            max={VALIDATION_RULES.DISCOUNT_RP.MAX}
          />
        )}

        {promoType === 'bogo' && (
          <BOGOInput
            buy={bogoBuy}
            get={bogoGet}
            onBuyChange={(buy) => handleBOGOChange(buy, bogoGet)}
            onGetChange={(get) => handleBOGOChange(bogoBuy, get)}
            errors={{
              buy: errors.bogoBuy,
              get: errors.bogoGet
            }}
            disabled={disabled}
          />
        )}
      </div>

      {/* Configuration Summary */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Ringkasan Konfigurasi</h4>
        <div className="text-sm text-gray-600">
          <p><span className="font-medium">Jenis:</span> {PROMO_TYPE_LABELS[promoType]}</p>
          {promoType === 'discount_percent' && (
            <p><span className="font-medium">Diskon:</span> {discountValue}% dari harga asli</p>
          )}
          {promoType === 'discount_rp' && (
            <p><span className="font-medium">Potongan:</span> {formatCurrency(discountValue)}</p>
          )}
          {promoType === 'bogo' && (
            <p><span className="font-medium">BOGO:</span> Beli {bogoBuy} Gratis {bogoGet}</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Attach sub-components
PromoConfiguration.TypeSelector = TypeSelector;
PromoConfiguration.DiscountInput = DiscountInput;
PromoConfiguration.BOGOInput = BOGOInput;
PromoConfiguration.ValidationMessage = ValidationMessage;

export default PromoConfiguration;