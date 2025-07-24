// hooks/usePromoValidation.ts
import { useMemo, useCallback } from 'react';
import { toast } from 'sonner';

interface ValidationRule {
  id: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  validate: () => boolean;
}

interface PromoValidationParams {
  promoName: string;
  selectedRecipe: any;
  promoType: string;
  discountValue: number;
  bogoBuy: number;
  bogoGet: number;
  promoResult: any;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationRule[];
  warnings: ValidationRule[];
  infos: ValidationRule[];
  canSave: boolean;
  validationSummary: string;
}

export const usePromoValidation = (params: PromoValidationParams): ValidationResult => {
  const {
    promoName,
    selectedRecipe,
    promoType,
    discountValue,
    bogoBuy,
    bogoGet,
    promoResult
  } = params;

  // 📋 Define validation rules
  const validationRules = useMemo<ValidationRule[]>(() => [
    // ❌ Error Rules (Blocking)
    {
      id: 'promo_name_required',
      message: 'Nama promo wajib diisi',
      severity: 'error',
      validate: () => !promoName || promoName.trim().length === 0
    },
    {
      id: 'promo_name_too_short',
      message: 'Nama promo minimal 3 karakter',
      severity: 'error',
      validate: () => promoName && promoName.trim().length > 0 && promoName.trim().length < 3
    },
    {
      id: 'recipe_required',
      message: 'Pilih produk terlebih dahulu',
      severity: 'error',
      validate: () => !selectedRecipe
    },
    {
      id: 'discount_percent_invalid',
      message: 'Diskon persentase harus antara 1-99%',
      severity: 'error',
      validate: () => promoType === 'discount_percent' && (discountValue <= 0 || discountValue >= 100)
    },
    {
      id: 'discount_rp_invalid',
      message: 'Potongan harga harus lebih dari 0',
      severity: 'error',
      validate: () => promoType === 'discount_rp' && discountValue <= 0
    },
    {
      id: 'bogo_buy_invalid',
      message: 'Jumlah beli minimal 1',
      severity: 'error',
      validate: () => promoType === 'bogo' && bogoBuy < 1
    },
    {
      id: 'bogo_get_invalid',
      message: 'Jumlah gratis harus 0 atau lebih',
      severity: 'error',
      validate: () => promoType === 'bogo' && bogoGet < 0
    },
    {
      id: 'promo_calculation_failed',
      message: 'Perhitungan promo gagal, periksa nilai input',
      severity: 'error',
      validate: () => selectedRecipe && !promoResult
    },
    {
      id: 'discount_exceeds_price',
      message: 'Potongan harga melebihi harga asli produk',
      severity: 'error',
      validate: () => {
        if (promoType === 'discount_rp' && selectedRecipe) {
          return discountValue >= selectedRecipe.hargaJualPorsi;
        }
        return false;
      }
    },

    // ⚠️ Warning Rules (Non-blocking but important)
    {
      id: 'negative_margin',
      message: 'Margin negatif - promo akan menyebabkan kerugian',
      severity: 'warning',
      validate: () => promoResult && promoResult.isNegativeMargin
    },
    {
      id: 'high_discount',
      message: 'Diskon terlalu besar (>50%) - pertimbangkan dampak margin',
      severity: 'warning',
      validate: () => promoType === 'discount_percent' && discountValue > 50
    },
    {
      id: 'low_margin',
      message: 'Margin tersisa sangat rendah (<10%)',
      severity: 'warning',
      validate: () => promoResult && promoResult.marginPercent > 0 && promoResult.marginPercent < 0.1
    },
    {
      id: 'excessive_bogo',
      message: 'BOGO terlalu besar - rasio gratis melebihi 50%',
      severity: 'warning',
      validate: () => {
        if (promoType === 'bogo' && bogoBuy > 0 && bogoGet > 0) {
          const ratio = bogoGet / (bogoBuy + bogoGet);
          return ratio > 0.5;
        }
        return false;
      }
    },
    {
      id: 'promo_name_generic',
      message: 'Nama promo terlalu umum - gunakan nama yang lebih spesifik',
      severity: 'warning',
      validate: () => {
        const genericNames = ['promo', 'diskon', 'sale', 'murah', 'hemat'];
        return promoName && genericNames.some(name => 
          promoName.toLowerCase().includes(name.toLowerCase()) && promoName.trim().length < 10
        );
      }
    },

    // ℹ️ Info Rules (Helpful suggestions)
    {
      id: 'optimal_discount_range',
      message: 'Diskon 10-30% biasanya paling efektif untuk penjualan',
      severity: 'info',
      validate: () => promoType === 'discount_percent' && discountValue > 0 && (discountValue < 10 || discountValue > 30)
    },
    {
      id: 'bogo_suggestion',
      message: 'BOGO 2+1 adalah kombinasi yang populer',
      severity: 'info',
      validate: () => promoType === 'bogo' && !(bogoBuy === 2 && bogoGet === 1)
    },
    {
      id: 'promo_name_suggestion',
      message: 'Tambahkan periode waktu pada nama promo (mis: "Weekend Sale")',
      severity: 'info',
      validate: () => {
        const timeWords = ['hari', 'minggu', 'bulan', 'weekend', 'flash', 'terbatas'];
        return promoName && promoName.length > 3 && 
               !timeWords.some(word => promoName.toLowerCase().includes(word));
      }
    }
  ], [promoName, selectedRecipe, promoType, discountValue, bogoBuy, bogoGet, promoResult]);

  // 🎯 Execute validation
  const validationResult = useMemo<ValidationResult>(() => {
    const errors: ValidationRule[] = [];
    const warnings: ValidationRule[] = [];
    const infos: ValidationRule[] = [];

    validationRules.forEach(rule => {
      if (rule.validate()) {
        switch (rule.severity) {
          case 'error':
            errors.push(rule);
            break;
          case 'warning':
            warnings.push(rule);
            break;
          case 'info':
            infos.push(rule);
            break;
        }
      }
    });

    const isValid = errors.length === 0;
    const canSave = isValid; // Can extend this logic
    
    // 📝 Generate validation summary
    let validationSummary = '';
    if (errors.length > 0) {
      validationSummary = `${errors.length} error(s) ditemukan`;
    } else if (warnings.length > 0) {
      validationSummary = `Valid dengan ${warnings.length} peringatan`;
    } else {
      validationSummary = 'Validasi berhasil';
    }

    return {
      isValid,
      errors,
      warnings,
      infos,
      canSave,
      validationSummary
    };
  }, [validationRules]);

  // 🚨 Show validation messages with toast
  const showValidationMessages = useCallback((showAll: boolean = false) => {
    // Always show errors
    validationResult.errors.forEach(error => {
      toast.error(error.message, { id: error.id });
    });

    if (showAll) {
      // Show warnings
      validationResult.warnings.forEach(warning => {
        toast.warning(warning.message, { id: warning.id });
      });

      // Show info (limit to avoid spam)
      validationResult.infos.slice(0, 2).forEach(info => {
        toast.info(info.message, { id: info.id });
      });
    }
  }, [validationResult]);

  // 📊 Get validation by severity
  const getValidationBySeverity = useCallback((severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return validationResult.errors;
      case 'warning':
        return validationResult.warnings;
      case 'info':
        return validationResult.infos;
      default:
        return [];
    }
  }, [validationResult]);

  // 🔍 Check specific validation
  const hasValidation = useCallback((validationId: string): boolean => {
    return validationRules.some(rule => rule.id === validationId && rule.validate());
  }, [validationRules]);

  // 📈 Get validation stats
  const getValidationStats = useCallback(() => {
    return {
      total: validationRules.length,
      passed: validationRules.length - validationResult.errors.length - validationResult.warnings.length - validationResult.infos.length,
      errors: validationResult.errors.length,
      warnings: validationResult.warnings.length,
      infos: validationResult.infos.length,
      passRate: Math.round(((validationRules.length - validationResult.errors.length - validationResult.warnings.length - validationResult.infos.length) / validationRules.length) * 100)
    };
  }, [validationRules.length, validationResult]);

  return {
    ...validationResult,
    showValidationMessages,
    getValidationBySeverity,
    hasValidation,
    getValidationStats
  };
};

// 🎯 Validation context hook
export const usePromoValidationContext = () => {
  const validatePromoName = useCallback((name: string): { isValid: boolean; message?: string } => {
    if (!name || name.trim().length === 0) {
      return { isValid: false, message: 'Nama promo wajib diisi' };
    }
    if (name.trim().length < 3) {
      return { isValid: false, message: 'Nama promo minimal 3 karakter' };
    }
    if (name.length > 100) {
      return { isValid: false, message: 'Nama promo maksimal 100 karakter' };
    }
    return { isValid: true };
  }, []);

  const validateDiscountPercent = useCallback((percent: number): { isValid: boolean; message?: string } => {
    if (percent <= 0) {
      return { isValid: false, message: 'Diskon harus lebih dari 0%' };
    }
    if (percent >= 100) {
      return { isValid: false, message: 'Diskon tidak boleh 100% atau lebih' };
    }
    return { isValid: true };
  }, []);

  const validateDiscountRupiah = useCallback((amount: number, maxPrice: number): { isValid: boolean; message?: string } => {
    if (amount <= 0) {
      return { isValid: false, message: 'Potongan harga harus lebih dari 0' };
    }
    if (amount >= maxPrice) {
      return { isValid: false, message: 'Potongan harga tidak boleh melebihi harga asli' };
    }
    return { isValid: true };
  }, []);

  const validateBOGO = useCallback((buy: number, get: number): { isValid: boolean; message?: string } => {
    if (buy < 1) {
      return { isValid: false, message: 'Jumlah beli minimal 1' };
    }
    if (get < 0) {
      return { isValid: false, message: 'Jumlah gratis tidak boleh negatif' };
    }
    if (buy === 0 && get > 0) {
      return { isValid: false, message: 'Tidak bisa gratis tanpa beli' };
    }
    return { isValid: true };
  }, []);

  return {
    validatePromoName,
    validateDiscountPercent,
    validateDiscountRusiah,
    validateBOGO
  };
};

export default usePromoValidation;