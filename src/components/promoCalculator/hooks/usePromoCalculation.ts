// src/components/promoCalculator/hooks/usePromoCalculation.ts
// Business logic for promo calculations

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import type { PromoFormData, PromoCalculationResult } from '../types/promo.types';

export const calculatePromo = (data: PromoFormData): PromoCalculationResult | null => {
  try {
    const { tipePromo, hargaProduk, hpp } = data;
    
    // Validasi input dasar
    if (!hargaProduk || !hpp) {
      throw new Error('Harga produk dan HPP harus diisi');
    }

    const harga = parseFloat(hargaProduk);
    const hppValue = parseFloat(hpp);
    
    if (isNaN(harga) || isNaN(hppValue) || harga <= 0 || hppValue <= 0) {
      throw new Error('Harga produk dan HPP harus berupa angka positif');
    }

    let finalPrice = harga;
    let savings = 0;
    let promoMargin = 0;
    let profit = 0;

    switch (tipePromo) {
      case 'discount':
        const { nilaiDiskon } = data;
        if (!nilaiDiskon) {
          throw new Error('Nilai diskon harus diisi untuk tipe discount');
        }
        const diskon = parseFloat(nilaiDiskon);
        if (isNaN(diskon) || diskon < 0 || diskon > 100) {
          throw new Error('Nilai diskon harus antara 0-100%');
        }
        
        finalPrice = harga * (1 - diskon / 100);
        savings = harga - finalPrice;
        promoMargin = (savings / harga) * 100;
        profit = finalPrice - hppValue;
        break;

      case 'bogo':
        const { beli, gratis } = data;
        if (!beli || !gratis) {
          throw new Error('Jumlah beli dan gratis harus diisi untuk tipe BOGO');
        }
        
        const jumlahBeli = parseInt(beli);
        const jumlahGratis = parseInt(gratis);
        
        if (isNaN(jumlahBeli) || isNaN(jumlahGratis) || jumlahBeli <= 0 || jumlahGratis <= 0) {
          throw new Error('Jumlah beli dan gratis harus berupa angka positif');
        }
        
        // Hitung harga per unit dengan BOGO
        const totalUnit = jumlahBeli + jumlahGratis;
        finalPrice = (harga * jumlahBeli) / totalUnit;
        savings = harga - finalPrice;
        promoMargin = (savings / harga) * 100;
        profit = finalPrice - hppValue;
        break;

      case 'bundle':
        const { hargaNormal, hargaBundle } = data;
        if (!hargaNormal || !hargaBundle) {
          throw new Error('Harga normal dan harga bundle harus diisi untuk tipe bundle');
        }
        
        const normalPrice = parseFloat(hargaNormal);
        const bundlePrice = parseFloat(hargaBundle);
        
        if (isNaN(normalPrice) || isNaN(bundlePrice) || normalPrice <= 0 || bundlePrice <= 0) {
          throw new Error('Harga normal dan bundle harus berupa angka positif');
        }
        
        if (bundlePrice >= normalPrice) {
          throw new Error('Harga bundle harus lebih kecil dari harga normal');
        }
        
        finalPrice = bundlePrice;
        savings = normalPrice - bundlePrice;
        promoMargin = (savings / normalPrice) * 100;
        profit = bundlePrice - hppValue;
        break;

      default:
        throw new Error('Tipe promo tidak valid');
    }

    // Validasi profit tidak boleh negatif (opsional warning)
    if (profit < 0) {
      console.warn('Peringatan: Profit negatif, promo mungkin merugikan');
    }

    return {
      finalPrice: Math.round(finalPrice * 100) / 100,
      promoMargin: Math.round(promoMargin * 100) / 100,
      savings: Math.round(savings * 100) / 100,
      profit: Math.round(profit * 100) / 100
    };

  } catch (error) {
    console.error('Error calculating promo:', error);
    throw error; // Re-throw untuk ditangani di UI
  }
};

export const usePromoCalculation = () => {
  const [calculationResult, setCalculationResult] = useState<PromoCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculate = useCallback((formData: PromoFormData) => {
    setIsCalculating(true);
    
    try {
      const result = calculatePromo(formData);
      setCalculationResult(result);
      
      if (result) {
        // Simpan data promo ke localStorage untuk sinkronisasi dengan order form
        const promoDataForOrder = {
          kodePromo: formData.namaPromo,
          tipePromo: formData.tipePromo,
          totalDiskon: result.savings || 0,
          hargaSetelahDiskon: result.finalPrice || 0,
          calculatedAt: new Date().toISOString()
        };
        localStorage.setItem('calculatedPromo', JSON.stringify(promoDataForOrder));
        
        toast.success("Promo berhasil dihitung dan siap untuk diimpor!");
        return result;
      }
    } catch (error: any) {
      console.error("Error calculating promo:", error);
      toast.error(error.message || "Terjadi kesalahan saat menghitung promo.");
      setCalculationResult(null);
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, []);

  const autoCalculate = useCallback((formData: PromoFormData) => {
    // Auto-calculate untuk real-time feedback (tanpa toast)
    try {
      const result = calculatePromo(formData);
      if (result) {
        setCalculationResult(result);
      }
    } catch (error) {
      // Ignore calculation errors during typing
      console.log('Auto-calculation skipped:', error);
    }
  }, []);

  const resetCalculation = useCallback(() => {
    setCalculationResult(null);
    setIsCalculating(false);
  }, []);

  return {
    calculationResult,
    isCalculating,
    calculate,
    autoCalculate,
    resetCalculation,
    setCalculationResult
  };
};