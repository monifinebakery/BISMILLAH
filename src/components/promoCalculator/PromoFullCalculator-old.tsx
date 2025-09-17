// src/components/promoCalculator/PromoFullCalculator.tsx
// Refactored PromoFullCalculator using modular components

import React from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, AlertCircle } from 'lucide-react';

// Refactored components and hooks
import { usePromoForm } from './hooks/usePromoForm';
import { 
  PromoWizard,
  PromoCalculationDisplay,
  PromoNavigation,
  PromoBasicInfoStep,
  PromoSettingsStep,
  PromoStatusStep
} from './components';

// Component now uses types from types/promo.types.ts

// Calculation logic moved to hooks/usePromoCalculation.ts

const PromoFullCalculator = () => {
  const { id } = useParams();
  const {
    // Form state
    formData,
    handleInputChange,
    handleSelectChange,
    
    // Wizard state
    steps,
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
    isLoading,
    isError,
    error,
    isEditMode
  } = usePromoForm(id);

  // Render function for step content
  const renderStepContent = () => {
    const stepProps = {
      formData,
      stepErrors: stepErrors[currentStep] || [],
      onInputChange: handleInputChange,
      onSelectChange: handleSelectChange,
    };

    switch (currentStep) {
      case 1:
        return <PromoBasicInfoStep {...stepProps} />;
      case 2:
        return <PromoSettingsStep {...stepProps} />;
      case 3:
        return <PromoStatusStep {...stepProps} />;
      default:
        return <PromoBasicInfoStep {...stepProps} />;
    }
  };

  // State untuk hasil kalkulasi
  const [calculationResult, setCalculationResult] = useState<PromoCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [stepErrors, setStepErrors] = useState<{[key: number]: string[]}>({});

  // ✅ Fetch promo detail jika dalam mode edit
  const promoQuery = useQuery({
    queryKey: PROMO_QUERY_KEYS.detail(id || ''),
    queryFn: async () => {
      if (!id) return null;
      const promo = await promoService.getById(id);
      return promo;
    },
    enabled: !!id
  });

  // ✅ Effect untuk mengisi form ketika data promo berhasil di-fetch
  useEffect(() => {
    if (promoQuery.data) {
      const data = promoQuery.data;
      setFormData({
        namaPromo: data.nama_promo || '',
        tipePromo: data.tipe_promo || 'discount',
        status: data.status || 'draft',
        deskripsi: data.deskripsi || '',
        tanggalMulai: data.tanggal_mulai || '',
        tanggalSelesai: data.tanggal_selesai || '',
        hargaProduk: data.harga_produk?.toString() || '',
        hpp: data.hpp?.toString() || '',
        nilaiDiskon: data.nilai_diskon?.toString() || '',
        resepUtama: data.resep_utama || '',
        resepGratis: data.resep_gratis || '',
        beli: data.beli?.toString() || '1',
        gratis: data.gratis?.toString() || '1',
        hargaNormal: data.harga_normal?.toString() || '',
        hargaBundle: data.harga_bundle?.toString() || ''
      });
      // Jika ada hasil kalkulasi sebelumnya
      if (data.calculationResult) {
        setCalculationResult(data.calculationResult);
      }
    }
  }, [promoQuery.data]);

  // ✅ Mutation untuk menyimpan (create/update) promo
  const savePromoMutation = useMutation({
    mutationFn: async (promoData: PromoFormData) => {
      // Gabungkan formData dengan calculationResult
      const fullPromoData = {
        ...promoData,
        calculationResult // Tambahkan hasil kalkulasi
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
    onError: (error) => {
      console.error("Save promo error:", error);
      toast.error(`Gagal menyimpan promo: ${error.message}`);
    },
  });

  // ✅ Isi form jika sedang edit dan data sudah dimuat
  useEffect(() => {
    if (isEditMode && promoQuery.data) {
      // Data sudah diisi di onSuccess query
    }
  }, [isEditMode, promoQuery.data]);

  // ✅ Validasi untuk setiap step dengan feedback yang lebih detail
  const validateStep = (step: number): string[] => {
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
  };

  // ✅ Navigasi step
  const goToStep = (step: number) => {
    if (step < currentStep || completedSteps.includes(step)) {
      setCurrentStep(step);
    }
  };

  const nextStep = () => {
    const errors = validateStep(currentStep);
    setStepErrors(prev => ({ ...prev, [currentStep]: errors }));
    
    if (errors.length === 0) {
      setCompletedSteps(prev => [...prev.filter(s => s !== currentStep), currentStep]);
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      toast.error(`Mohon lengkapi data pada step ${steps[currentStep - 1].title}`);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // ✅ Handler perubahan input dengan validasi real-time
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
    
    // Clear errors untuk step saat ini ketika user mengubah input
    setStepErrors(prev => ({ ...prev, [currentStep]: [] }));
    
    // Auto-calculate jika di step 2 dan field yang berubah adalah field kalkulasi
    if (currentStep === 2 && ['hargaProduk', 'hpp', 'nilaiDiskon', 'beli', 'gratis', 'hargaNormal', 'hargaBundle'].includes(id)) {
      // Debounce calculation untuk performa
      setTimeout(() => {
        try {
          const newFormData = { ...formData, [id]: value };
          const result = calculatePromo(newFormData);
          if (result) {
            setCalculationResult(result);
          }
        } catch (error) {
          // Ignore calculation errors during typing
          console.log('Auto-calculation skipped:', error);
        }
      }, 500);
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors untuk step saat ini ketika user mengubah input
    setStepErrors(prev => ({ ...prev, [currentStep]: [] }));
    
    // Reset calculation result jika tipe promo berubah
    if (name === 'tipePromo') {
      setCalculationResult(null);
    }
  };

  // ✅ Handler untuk tombol kembali
  const handleGoBack = () => {
    if (window.confirm("Perubahan yang belum disimpan akan hilang. Lanjutkan?")) {
      navigate(-1); // Kembali ke halaman sebelumnya
      // Atau bisa juga: navigate('/promo/list');
    }
  };

  // ✅ Handler untuk tombol simpan
  const handleSave = async () => {
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
        result = calculatePromo(formData);
        if (!result) {
          toast.error("Perhitungan promo gagal. Silakan periksa input.");
          return;
        }
        setCalculationResult(result);
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
  };

  // ✅ Handler untuk tombol kalkulasi
  const handleCalculate = () => {
    setIsCalculating(true);
    
    try {
      const result = calculatePromo(formData);
      setCalculationResult(result);
      
      // Simpan data promo ke localStorage untuk sinkronisasi dengan order form
      const promoDataForOrder = {
        kodePromo: formData.namaPromo,
        tipePromo: formData.tipePromo,
        totalDiskon: result?.savings || 0,
        hargaSetelahDiskon: result?.finalPrice || 0,
        calculatedAt: new Date().toISOString()
      };
      localStorage.setItem('calculatedPromo', JSON.stringify(promoDataForOrder));
      
      toast.success("Promo berhasil dihitung dan siap untuk diimpor!");
    } catch (error: any) {
      console.error("Error calculating promo:", error);
      toast.error(error.message || "Terjadi kesalahan saat menghitung promo.");
      setCalculationResult(null);
    } finally {
      setIsCalculating(false);
    }
  };

  const isLoading = promoQuery.isLoading || savePromoMutation.isPending;

  // ✅ Tampilkan loading state jika perlu
  if (isEditMode && promoQuery.isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <Skeleton className="h-12 w-32" />
      </div>
    );
  }

  // ✅ Tampilkan error state jika perlu
  if (isEditMode && promoQuery.isError) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Gagal Memuat Data Promo
            </h2>
            <p className="text-gray-600 mb-4">
              {promoQuery.error?.message || 'Terjadi kesalahan saat memuat data promo untuk diedit.'}
            </p>
            <Button onClick={() => navigate('/promo/list')} variant="outline">
              Kembali ke Daftar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Render step indicator
  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div 
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 cursor-pointer transition-all ${
                currentStep === step.id 
                  ? 'bg-orange-500 border-orange-500 text-white' 
                  : completedSteps.includes(step.id)
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'bg-white border-gray-300 text-gray-500'
              }`}
              onClick={() => goToStep(step.id)}
            >
              {completedSteps.includes(step.id) ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <span className="text-sm font-semibold">{step.id}</span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-2 ${
                completedSteps.includes(step.id) ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 text-center">
        <h2 className="text-xl font-semibold text-gray-900">
          {steps[currentStep - 1].title}
        </h2>
        <p className="text-gray-600 mt-1">
          {steps[currentStep - 1].description}
        </p>
        {stepErrors[currentStep] && stepErrors[currentStep].length > 0 && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Mohon perbaiki kesalahan berikut:</span>
            </div>
            <ul className="mt-1 text-sm text-red-600 list-disc list-inside">
              {stepErrors[currentStep].map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <Button onClick={handleGoBack} variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Promo' : 'Buat Promo Baru'}
          </h1>
          <div></div> {/* Spacer untuk flex */}
        </div>

        {renderStepIndicator()}

        {/* Render konten berdasarkan step */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-6">
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-orange-500" />
                    Informasi Dasar Promo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="namaPromo" className="text-base font-medium">
                      Nama Promo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                       id="namaPromo"
                       value={formData.namaPromo}
                       onChange={handleInputChange}
                       placeholder="Contoh: Diskon Akhir Tahun 25%"
                       className={`mt-1 ${
                         stepErrors[1]?.some(error => error.includes('Nama promo')) 
                           ? 'border-red-500 focus:border-red-500' 
                           : formData.namaPromo.length >= 3 
                           ? 'border-green-500' 
                           : ''
                       }`}
                     />
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800 font-medium mb-1">💡 Panduan Tipe Promo:</p>
                      <ul className="text-xs text-blue-700 space-y-1">
                        <li>• <strong>Diskon:</strong> Potongan harga dalam persen atau nominal</li>
                        <li>• <strong>BOGO:</strong> Beli sejumlah produk, gratis sejumlah produk</li>
                        <li>• <strong>Bundle:</strong> Paket produk dengan harga khusus</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tipePromo" className="text-base font-medium">
                      Tipe Promo <span className="text-red-500">*</span>
                      <div className="group relative inline-block ml-2">
                        <Info className="h-4 w-4 text-gray-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          Pilih jenis promo yang ingin dibuat
                        </div>
                      </div>
                    </Label>
                    <Select
                      value={formData.tipePromo}
                      onValueChange={(value) => handleSelectChange('tipePromo', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Pilih tipe promo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="discount">
                          <div className="flex flex-col">
                            <span className="font-medium">Diskon Persentase</span>
                            <span className="text-sm text-gray-500">Potongan harga dalam persen</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="bogo">
                          <div className="flex flex-col">
                            <span className="font-medium">Buy One Get One</span>
                            <span className="text-sm text-gray-500">Beli sejumlah, dapat gratis</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="bundle">
                          <div className="flex flex-col">
                            <span className="font-medium">Paket Bundle</span>
                            <span className="text-sm text-gray-500">Harga khusus untuk paket produk</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="deskripsi" className="text-base font-medium flex items-center gap-2">
                      Deskripsi Promo
                      <div className="group relative">
                        <Info className="h-4 w-4 text-gray-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          Jelaskan syarat, ketentuan, dan detail promo
                        </div>
                      </div>
                    </Label>
                    <Textarea
                      id="deskripsi"
                      value={formData.deskripsi}
                      onChange={handleInputChange}
                      placeholder="Contoh: Berlaku untuk pembelian minimal 2 item, tidak dapat digabung dengan promo lain..."
                      rows={4}
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      💡 Tip: Semakin jelas deskripsi, semakin mudah customer memahami promo
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tanggalMulai" className="text-base font-medium">
                        Tanggal Mulai
                      </Label>
                      <Input
                        id="tanggalMulai"
                        type="date"
                        value={formData.tanggalMulai}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tanggalSelesai" className="text-base font-medium">
                        Tanggal Selesai
                      </Label>
                      <Input
                        id="tanggalSelesai"
                        type="date"
                        value={formData.tanggalSelesai}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-orange-500" />
                    Pengaturan Promo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Harga Dasar */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-3">Informasi Harga Dasar</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="hargaProduk" className="text-base font-medium">
                          Harga Jual Normal <span className="text-red-500">*</span>
                        </Label>
                        <Input
                       id="hargaProduk"
                       type="number"
                       value={formData.hargaProduk}
                       onChange={handleInputChange}
                       placeholder="50000"
                       className={`mt-1 ${
                         stepErrors[2]?.some(error => error.includes('Harga produk')) 
                           ? 'border-red-500 focus:border-red-500' 
                           : formData.hargaProduk && parseFloat(formData.hargaProduk) > 0 
                           ? 'border-green-500' 
                           : ''
                       }`}
                     />
                        <p className="text-sm text-gray-500 mt-1">
                          Harga jual produk sebelum promo
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="hpp" className="text-base font-medium flex items-center gap-2">
                          HPP (Harga Pokok Penjualan) <span className="text-red-500">*</span>
                          <div className="group relative">
                            <Info className="h-4 w-4 text-gray-400 cursor-help" />
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                              Biaya produksi + operasional per unit
                            </div>
                          </div>
                        </Label>
                        <Input
                       id="hpp"
                       type="number"
                       value={formData.hpp}
                       onChange={handleInputChange}
                       placeholder="30000"
                       className={`mt-1 ${
                         stepErrors[2]?.some(error => error.includes('HPP')) 
                           ? 'border-red-500 focus:border-red-500' 
                           : formData.hpp && parseFloat(formData.hpp) > 0 && formData.hargaProduk && parseFloat(formData.hpp) < parseFloat(formData.hargaProduk)
                           ? 'border-green-500' 
                           : ''
                       }`}
                     />
                        <p className="text-sm text-gray-500 mt-1">
                          💡 HPP harus lebih kecil dari harga jual untuk mendapat profit
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Pengaturan Spesifik Tipe Promo */}
                  {formData.tipePromo === 'discount' && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="font-medium text-green-900 mb-3">Pengaturan Diskon</h3>
                      <div>
                        <Label htmlFor="nilaiDiskon" className="text-base font-medium">
                          Persentase Diskon <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="nilaiDiskon"
                          type="number"
                          value={formData.nilaiDiskon}
                          onChange={handleInputChange}
                          placeholder="25"
                          min="0"
                          max="100"
                          className={`mt-1 ${
                            stepErrors[2]?.some(error => error.includes('Nilai diskon')) 
                              ? 'border-red-500 focus:border-red-500' 
                              : formData.nilaiDiskon && parseFloat(formData.nilaiDiskon) > 0 && parseFloat(formData.nilaiDiskon) <= 100
                              ? 'border-green-500' 
                              : ''
                          }`}
                        />
                        <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                          <p className="text-xs text-yellow-800">
                            ⚠️ Diskon terlalu besar dapat mengurangi profit secara signifikan
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.tipePromo === 'bogo' && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <h3 className="font-medium text-purple-900 mb-3">Pengaturan Buy One Get One</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="beli" className="text-base font-medium">
                              Jumlah Beli <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="beli"
                              type="number"
                              value={formData.beli}
                              onChange={handleInputChange}
                              placeholder="2"
                              min="1"
                              className={`mt-1 ${
                                stepErrors[2]?.some(error => error.includes('Jumlah beli')) 
                                  ? 'border-red-500 focus:border-red-500' 
                                  : formData.beli && parseInt(formData.beli) > 0
                                  ? 'border-green-500' 
                                  : ''
                              }`}
                            />
                            <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                              <p className="text-xs text-green-800">
                                💡 Contoh: Beli 2 Gratis 1 = customer beli 2, dapat 1 gratis
                              </p>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="gratis" className="text-base font-medium">
                              Jumlah Gratis <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="gratis"
                              type="number"
                              value={formData.gratis}
                              onChange={handleInputChange}
                              placeholder="1"
                              min="1"
                              className={`mt-1 ${
                                stepErrors[2]?.some(error => error.includes('Jumlah gratis')) 
                                  ? 'border-red-500 focus:border-red-500' 
                                  : formData.gratis && parseInt(formData.gratis) > 0
                                  ? 'border-green-500' 
                                  : ''
                              }`}
                            />
                            <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                              <p className="text-xs text-green-800">
                                💡 Produk gratis yang akan diberikan kepada customer
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.tipePromo === 'bundle' && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h3 className="font-medium text-yellow-900 mb-3">Pengaturan Bundle</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="hargaNormal" className="text-base font-medium">
                            Harga Normal Total <span className="text-red-500">*</span>
                          </Label>
                          <Input
                             id="hargaNormal"
                             type="number"
                             value={formData.hargaNormal}
                             onChange={handleInputChange}
                             placeholder="100000"
                             className={`mt-1 ${
                               stepErrors[2]?.some(error => error.includes('Harga normal')) 
                                 ? 'border-red-500 focus:border-red-500' 
                                 : formData.hargaNormal && parseFloat(formData.hargaNormal) > 0
                                 ? 'border-green-500' 
                                 : ''
                             }`}
                           />
                           <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                             <p className="text-xs text-blue-800">
                               💡 Total harga jika customer beli produk satu per satu
                             </p>
                           </div>
                         </div>
                         <div>
                           <Label htmlFor="hargaBundle" className="text-base font-medium">
                             Harga Bundle <span className="text-red-500">*</span>
                           </Label>
                           <Input
                             id="hargaBundle"
                             type="number"
                             value={formData.hargaBundle}
                             onChange={handleInputChange}
                             placeholder="80000"
                             className={`mt-1 ${
                               stepErrors[2]?.some(error => error.includes('Harga bundle')) 
                                 ? 'border-red-500 focus:border-red-500' 
                                 : formData.hargaBundle && parseFloat(formData.hargaBundle) > 0 && formData.hargaNormal && parseFloat(formData.hargaBundle) < parseFloat(formData.hargaNormal)
                                 ? 'border-green-500' 
                                 : ''
                             }`}
                           />
                           <div className="mt-2 p-2 bg-orange-50 rounded border border-orange-200">
                             <p className="text-xs text-orange-800">
                               ⚡ Harga bundle harus lebih murah dari harga normal
                             </p>
                           </div>
                         </div>
                       </div>
                     </div>
                   )}
                 </CardContent>
               </Card>
             )}

             {currentStep === 3 && (
               <Card>
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <CheckCircle className="w-5 h-5 text-orange-500" />
                     Status dan Konfirmasi
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-6">
                   <div>
                     <Label htmlFor="status" className="text-base font-medium">
                       Status Promo <span className="text-red-500">*</span>
                     </Label>
                     <Select
                       value={formData.status}
                       onValueChange={(value) => handleSelectChange('status', value)}
                     >
                       <SelectTrigger className="mt-1">
                         <SelectValue placeholder="Pilih status" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="draft">
                           <div className="flex flex-col">
                             <span className="font-medium">Draft</span>
                             <span className="text-sm text-gray-500">Promo belum aktif, masih bisa diedit</span>
                           </div>
                         </SelectItem>
                         <SelectItem value="aktif">
                           <div className="flex flex-col">
                             <span className="font-medium">Aktif</span>
                             <span className="text-sm text-gray-500">Promo langsung berjalan</span>
                           </div>
                         </SelectItem>
                         <SelectItem value="nonaktif">
                           <div className="flex flex-col">
                             <span className="font-medium">Nonaktif</span>
                             <span className="text-sm text-gray-500">Promo tidak berjalan</span>
                           </div>
                         </SelectItem>
                       </SelectContent>
                     </Select>
                   </div>

                   {/* Preview Ringkasan */}
                   <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                     <h3 className="font-medium text-gray-900 mb-3">Ringkasan Promo</h3>
                     <div className="space-y-2 text-sm">
                       <div className="flex justify-between">
                         <span className="text-gray-600">Nama:</span>
                         <span className="font-medium">{formData.namaPromo || 'Belum diisi'}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600">Tipe:</span>
                         <span className="font-medium">
                           {formData.tipePromo === 'discount' && 'Diskon Persentase'}
                           {formData.tipePromo === 'bogo' && 'Buy One Get One'}
                           {formData.tipePromo === 'bundle' && 'Paket Bundle'}
                           {!formData.tipePromo && 'Belum dipilih'}
                         </span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-gray-600">Harga Normal:</span>
                         <span className="font-medium">
                           {formData.hargaProduk ? `Rp ${parseInt(formData.hargaProduk).toLocaleString('id-ID')}` : 'Belum diisi'}
                         </span>
                       </div>
                       {formData.tipePromo === 'discount' && (
                         <div className="flex justify-between">
                           <span className="text-gray-600">Diskon:</span>
                           <span className="font-medium">{formData.nilaiDiskon || '0'}%</span>
                         </div>
                       )}
                     </div>
                   </div>
                 </CardContent>
               </Card>
             )}

            {/* Hasil Kalkulasi */}
            {calculationResult && (
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
            )}
          </div>

          {/* Action Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Navigasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Step Navigation */}
                <div className="space-y-3">
                  {currentStep > 1 && (
                    <Button
                      onClick={prevStep}
                      variant="outline"
                      className="w-full"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Kembali
                    </Button>
                  )}

                  {currentStep < steps.length && (
                    <Button
                      onClick={nextStep}
                      className="w-full"
                      disabled={stepErrors[currentStep] && stepErrors[currentStep].length > 0}
                    >
                      Lanjut
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}

                  {currentStep === steps.length && (
                    <>
                      <Button
                        onClick={handleCalculate}
                        disabled={isCalculating || (stepErrors[currentStep] && stepErrors[currentStep].length > 0)}
                        className="w-full"
                        variant="outline"
                      >
                        {isCalculating ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Menghitung...
                          </>
                        ) : (
                          <>
                            <Calculator className="w-4 h-4 mr-2" />
                            Hitung Promo
                          </>
                        )}
                      </Button>

                      <Button
                         onClick={handleSave}
                         disabled={isSaving || !calculationResult || (stepErrors[currentStep] && stepErrors[currentStep].length > 0)}
                         className="w-full bg-orange-500 hover:bg-orange-600"
                       >
                         {isSaving ? (
                           <>
                             <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                             Menyimpan...
                           </>
                         ) : (
                           <>
                             <Save className="w-4 h-4 mr-2" />
                             Simpan Promo
                           </>
                         )}
                       </Button>
                    </>
                  )}
                </div>

                {/* Progress Info */}
                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-600 mb-2">
                    Step {currentStep} dari {steps.length}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(currentStep / steps.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Help Text */}
                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
                      <div>
                        {currentStep === 1 && "Isi informasi dasar promo seperti nama, tipe, dan periode berlaku."}
                        {currentStep === 2 && "Tentukan harga dan pengaturan spesifik sesuai tipe promo yang dipilih."}
                        {currentStep === 3 && "Pilih status promo dan review ringkasan sebelum menyimpan."}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoFullCalculator;