// src/components/promoCalculator/hooks/usePromoForm.ts
// Custom hooks for promo form state and validation

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { promoService } from '@/components/promoCalculator/services/promoService';
import { usePromoCalculation } from './usePromoCalculation';
import type { 
  PromoFormData, 
  PromoValidationError, 
  PromoStep,
  PromoCalculationResult
} from '../types/promo.types';
import { PROMO_QUERY_KEYS } from '../types/promo.types';

const DEFAULT_FORM_DATA: PromoFormData = {
  namaPromo: '',
  tipePromo: 'discount',
  status: 'draft',
  deskripsi: '',
  tanggalMulai: '',
  tanggalSelesai: '',
  hargaProduk: '',
  hpp: '',
  nilaiDiskon: '',
  resepUtama: '',
  resepGratis: '',
  beli: '1',
  gratis: '1',
  hargaNormal: '',
  hargaBundle: '',
};

const PROMO_STEPS: PromoStep[] = [
  { id: 1, title: 'Informasi Dasar', description: 'Nama dan tipe promo' },
  { id: 2, title: 'Pengaturan Promo', description: 'Detail konfigurasi promo' },
  { id: 3, title: 'Kalkulasi', description: 'Hitung dan review hasil' },
  { id: 4, title: 'Finalisasi', description: 'Simpan dan aktivasi' }
];

export const usePromoForm = (id?: string) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;
  
  // Form state
  const [formData, setFormData] = useState<PromoFormData>(DEFAULT_FORM_DATA);
  const [isSaving, setIsSaving] = useState(false);
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [stepErrors, setStepErrors] = useState<PromoValidationError>({});
  
  // Calculation hook
  const { calculationResult, isCalculating, calculate, autoCalculate, resetCalculation, setCalculationResult } = usePromoCalculation();
  
  // Fetch promo detail jika dalam mode edit
  const promoQuery = useQuery({
    queryKey: PROMO_QUERY_KEYS.detail(id || ''),
    queryFn: async () => {
      if (!id) return null;
      try {
        const promo = await promoService.getById(id);
        return promo;
      } catch (error) {
        console.error('Error fetching promo:', error);
        return null;
      }
    },
    enabled: !!id,
    retry: false,
    refetchOnWindowFocus: false
  });

  // Effect untuk mengisi form ketika data promo berhasil di-fetch
  useEffect(() => {
    if (promoQuery.data && typeof promoQuery.data === 'object') {
      const data = promoQuery.data;
      try {
        setFormData({
          namaPromo: data.namaPromo || data.nama_promo || '',
          tipePromo: data.tipePromo || data.tipe_promo || 'discount',
          status: data.status || 'draft',
          deskripsi: data.deskripsi || '',
          tanggalMulai: data.tanggalMulai || data.tanggal_mulai || '',
          tanggalSelesai: data.tanggalSelesai || data.tanggal_selesai || '',
          hargaProduk: data.hargaProduk?.toString() || data.harga_produk?.toString() || '',
          hpp: data.hpp?.toString() || '',
          nilaiDiskon: data.nilaiDiskon?.toString() || data.nilai_diskon?.toString() || '',
          resepUtama: data.resepUtama || data.resep_utama || '',
          resepGratis: data.resepGratis || data.resep_gratis || '',
          beli: data.beli?.toString() || '1',
          gratis: data.gratis?.toString() || '1',
          hargaNormal: data.hargaNormal?.toString() || data.harga_normal?.toString() || '',
          hargaBundle: data.hargaBundle?.toString() || data.harga_bundle?.toString() || ''
        });
        
        // Jika ada hasil kalkulasi sebelumnya
        if (data.calculationResult) {
          setCalculationResult(data.calculationResult);
        }
      } catch (error) {
        console.error('Error setting form data:', error);
      }
    }
  }, [promoQuery.data, setCalculationResult]);

  // Mutation untuk menyimpan promo
  const savePromoMutation = useMutation({
    mutationFn: async (promoData: PromoFormData) => {
      // Gabungkan formData dengan calculationResult
      const fullPromoData = {
        ...promoData,
        calculationResult
      };

      if (isEditMode) {
        return await promoService.update(id, fullPromoData);
      } else {
        return await promoService.create(fullPromoData);
      }
    },
    onSuccess: (data) => {
      toast.success(isEditMode ? 'Promo berhasil diperbarui!' : 'Promo baru berhasil dibuat!');
      queryClient.invalidateQueries({ queryKey: ['promos'] });
      // Redirect ke halaman daftar atau detail setelah simpan
      navigate('/promo/list');
    },
    onError: (error: any) => {
      console.error("Save promo error:", error);
      toast.error(`Gagal menyimpan promo: ${error.message}`);
    },
  });

  // Validasi untuk setiap step
  const validateStep = useCallback((step: number): string[] => {
    const errors: string[] = [];
    
    switch (step) {
      case 1:
        if (!formData.namaPromo.trim()) {
          errors.push('Nama promo wajib diisi');
        } else if (formData.namaPromo.length < 3) {
          errors.push('Nama promo minimal 3 karakter');
        }
        if (!formData.tipePromo) {
          errors.push('Tipe promo wajib dipilih');
        }
        if (formData.tanggalMulai && formData.tanggalSelesai) {
          const startDate = new Date(formData.tanggalMulai);
          const endDate = new Date(formData.tanggalSelesai);
          if (startDate >= endDate) {
            errors.push('Tanggal selesai harus setelah tanggal mulai');
          }
        }
        break;
      case 2:
        if (!formData.hargaProduk || parseFloat(formData.hargaProduk) <= 0) {
          errors.push('Harga produk harus lebih dari 0');
        }
        if (!formData.hpp || parseFloat(formData.hpp) <= 0) {
          errors.push('HPP harus lebih dari 0');
        }
        if (formData.hargaProduk && formData.hpp) {
          const harga = parseFloat(formData.hargaProduk);
          const hpp = parseFloat(formData.hpp);
          if (hpp >= harga) {
            errors.push('HPP tidak boleh lebih besar atau sama dengan harga jual');
          }
        }
        
        // Validasi spesifik per tipe promo
        if (formData.tipePromo === 'discount') {
          if (!formData.nilaiDiskon || parseFloat(formData.nilaiDiskon) <= 0) {
            errors.push('Nilai diskon harus lebih dari 0');
          } else if (parseFloat(formData.nilaiDiskon) > 100) {
            errors.push('Nilai diskon tidak boleh lebih dari 100%');
          }
        }
        
        if (formData.tipePromo === 'bogo') {
          if (!formData.beli || parseInt(formData.beli) <= 0) {
            errors.push('Jumlah beli harus lebih dari 0');
          }
          if (!formData.gratis || parseInt(formData.gratis) <= 0) {
            errors.push('Jumlah gratis harus lebih dari 0');
          }
        }
        
        if (formData.tipePromo === 'bundle') {
          if (!formData.hargaNormal || parseFloat(formData.hargaNormal) <= 0) {
            errors.push('Harga normal bundle harus lebih dari 0');
          }
          if (!formData.hargaBundle || parseFloat(formData.hargaBundle) <= 0) {
            errors.push('Harga bundle harus lebih dari 0');
          }
          if (formData.hargaNormal && formData.hargaBundle) {
            const normal = parseFloat(formData.hargaNormal);
            const bundle = parseFloat(formData.hargaBundle);
            if (bundle >= normal) {
              errors.push('Harga bundle harus lebih murah dari harga normal');
            }
          }
        }
        break;
      case 3:
        if (!calculationResult) errors.push('Kalkulasi promo belum dilakukan');
        if (!formData.status) errors.push('Status promo wajib dipilih');
        break;
    }
    
    return errors;
  }, [formData, calculationResult]);

  // Handler untuk perubahan input
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!e || !e.target) return;
    
    const { id, value } = e.target;
    if (!id) return;
    
    setFormData(prev => ({ ...prev, [id]: value }));
    
    // Clear errors untuk step saat ini ketika user mengubah input
    setStepErrors(prev => ({ ...prev, [currentStep]: [] }));
    
    // Auto-calculate jika di step 2 dan field yang berubah adalah field kalkulasi
    if (currentStep === 2 && ['hargaProduk', 'hpp', 'nilaiDiskon', 'beli', 'gratis', 'hargaNormal', 'hargaBundle'].includes(id)) {
      // Debounce calculation untuk performa
      setTimeout(() => {
        const newFormData = { ...formData, [id]: value };
        if (autoCalculate && typeof autoCalculate === 'function') {
          autoCalculate(newFormData);
        }
      }, 500);
    }
  }, [formData, currentStep, autoCalculate]);

  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors untuk step saat ini ketika user mengubah input
    setStepErrors(prev => ({ ...prev, [currentStep]: [] }));
    
    // Reset calculation result jika tipe promo berubah
    if (name === 'tipePromo') {
      resetCalculation();
    }
  }, [currentStep, resetCalculation]);

  // Navigasi step
  const goToStep = useCallback((step: number) => {
    if (step < currentStep || completedSteps.includes(step)) {
      setCurrentStep(step);
    }
  }, [currentStep, completedSteps]);

  const nextStep = useCallback(() => {
    const errors = validateStep(currentStep);
    setStepErrors(prev => ({ ...prev, [currentStep]: errors }));
    
    if (errors.length === 0) {
      setCompletedSteps(prev => [...prev.filter(s => s !== currentStep), currentStep]);
      if (currentStep < PROMO_STEPS.length) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      toast.error(`Mohon lengkapi data pada step ${PROMO_STEPS[currentStep - 1].title}`);
    }
  }, [currentStep, validateStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Handler untuk menyimpan promo
  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      
      // Validasi dasar
      if (!formData.namaPromo.trim()) {
        toast.error("Nama promo wajib diisi.");
        return;
      }
      if (!formData.tipePromo) {
        toast.error("Tipe promo wajib dipilih.");
        return;
      }

      let result = calculationResult;
      if (!result) {
        result = calculate(formData);
        if (!result) {
          toast.error("Perhitungan promo gagal. Silakan periksa input.");
          return;
        }
      }

      await savePromoMutation.mutateAsync(formData);
      
      // Update data promo di localStorage setelah berhasil disimpan
      if (result) {
        const promoDataForOrder = {
          kodePromo: formData.namaPromo,
          tipePromo: formData.tipePromo,
          totalDiskon: result.savings || 0,
          hargaSetelahDiskon: result.finalPrice || 0,
          calculatedAt: new Date().toISOString(),
          saved: true
        };
        localStorage.setItem('calculatedPromo', JSON.stringify(promoDataForOrder));
      }
      
    } catch (error) {
      console.error('Error saving promo:', error);
      toast.error('Gagal menyimpan promo');
    } finally {
      setIsSaving(false);
    }
  }, [formData, calculationResult, calculate, savePromoMutation]);

  const handleGoBack = useCallback(() => {
    if (window.confirm("Perubahan yang belum disimpan akan hilang. Lanjutkan?")) {
      navigate(-1);
    }
  }, [navigate]);

  return {
    // Form state
    formData,
    setFormData,
    handleInputChange,
    handleSelectChange,
    
    // Wizard state
    steps: PROMO_STEPS,
    currentStep,
    completedSteps,
    stepErrors,
    goToStep,
    nextStep,
    prevStep,
    
    // Calculation
    calculationResult,
    isCalculating,
    calculate,
    
    // Save
    isSaving,
    handleSave,
    handleGoBack,
    
    // Query states
    isLoading: promoQuery.isLoading || savePromoMutation.isPending,
    isError: promoQuery.isError,
    error: promoQuery.error,
    isEditMode
  };
};