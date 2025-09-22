// src/components/recipe/components/RecipeFormPage.tsx
// Full page recipe form without dialog wrapper

import React, { useState, useEffect, useRef, Suspense, useCallback, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Save, 
  AlertCircle,
  CheckCircle,
  Calculator,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// Form components
import BasicInfoStep from './RecipeForm/BasicInfoStep';
import IngredientsStep from './RecipeForm/IngredientsStep';

// Lazy load CostCalculationStep
const CostCalculationStep = React.lazy(() => 
  import('./RecipeForm/CostCalculationStep/index')
    .catch(error => {
      console.error('Failed to load CostCalculationStep:', error);
      return { default: () => <div>Error loading cost calculation</div> };
    })
);

// Utils and types
import { validateRecipeData, calculateHPP } from '@/components/recipe/services/recipeUtils';
import { recipeApi } from '@/components/recipe/services/recipeApi';
import {
  type Recipe,
  type NewRecipe,
  type RecipeFormStep,
} from '@/components/recipe/types';

// Import breadcrumb
import RecipeBreadcrumb, { type RecipeViewMode } from './RecipeBreadcrumb';

// Query Keys
export const RECIPE_QUERY_KEYS = {
  all: ['recipes'] as const,
  lists: () => [...RECIPE_QUERY_KEYS.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...RECIPE_QUERY_KEYS.lists(), filters] as const,
  details: () => [...RECIPE_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...RECIPE_QUERY_KEYS.details(), id] as const,
} as const;

interface RecipeFormPageProps {
  mode: 'add' | 'edit';
  initialData?: Recipe | null;
  onNavigate: (view: RecipeViewMode) => void;
  onSuccess?: (recipe: Recipe, isEdit: boolean) => void;
  isLoading?: boolean;
}

const STEPS: { key: RecipeFormStep; title: string; description: string }[] = [
  { key: 'basic', title: 'Informasi Dasar', description: 'Nama, kategori, dan deskripsi resep' },
  { key: 'ingredients', title: 'Bahan-bahan', description: 'Daftar bahan dan takaran yang dibutuhkan' },
  { key: 'costs', title: 'Kalkulasi HPP', description: 'Biaya produksi dan margin keuntungan' },
];

const RecipeFormPage: React.FC<RecipeFormPageProps> = React.memo(({
  mode,
  initialData,
  onNavigate,
  onSuccess,
  isLoading: externalLoading = false,
}) => {
  const [currentStep, setCurrentStep] = useState<RecipeFormStep>('basic');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [isEnhancedHppActive, setIsEnhancedHppActive] = useState(false);
  const queryClient = useQueryClient();
  const contentRef = useRef<HTMLDivElement>(null);

  // Form data state
  const [formData, setFormData] = useState<NewRecipe>({
    namaResep: '',
    jumlahPorsi: 1,
    kategoriResep: '',
    deskripsi: '',
    fotoUrl: '',
    bahanResep: [],
    biayaTenagaKerja: 0,
    biayaOverhead: 0,
    marginKeuntunganPersen: 25,
    jumlahPcsPerPorsi: 1,
  });

  const isEditMode = mode === 'edit' && !!initialData;
  const currentStepIndex = STEPS.findIndex(step => step.key === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  // Create Recipe Mutation
  const createRecipeMutation = useMutation({
    mutationFn: async (data: NewRecipe) => {
      return await recipeApi.createRecipe(data);
    },
    onSuccess: (newRecipe) => {
      if (!newRecipe) {
        const errorMsg = 'Data resep baru tidak diterima dari server';
        logger.error('RecipeFormPage: No recipe data received from create API');
        toast.error(errorMsg);
        return;
      }
      if (!newRecipe.id) {
        const errorMsg = 'Data resep baru tidak valid diterima dari server (ID hilang)';
        logger.error('RecipeFormPage: Invalid recipe data received from create API (missing ID)', newRecipe);
        toast.error(errorMsg);
        return;
      }

      // ✅ PERBAIKAN: Invalidate semua queries terkait recipe untuk memastikan stats ter-update
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.all });
      
      queryClient.setQueryData(
        RECIPE_QUERY_KEYS.detail(newRecipe.id), 
        newRecipe
      );
      toast.success('Resep berhasil ditambahkan!');
      onSuccess?.(newRecipe, false);
      onNavigate('list');
    },
    onError: (error: Error) => {
      logger.error('RecipeFormPage: Error creating recipe:', error);
      toast.error(error.message || 'Gagal menambahkan resep');
    },
  });

  // Update Recipe Mutation
  const updateRecipeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NewRecipe> }) => {
      return await recipeApi.updateRecipe(id, data);
    },
    onSuccess: (updatedRecipe) => {
      if (!updatedRecipe) {
        const errorMsg = 'Data resep tidak diterima dari server';
        logger.error('RecipeFormPage: No recipe data received from update API');
        toast.error(errorMsg);
        return;
      }
      if (!updatedRecipe.id) {
        const errorMsg = 'Data resep tidak valid diterima dari server (ID hilang)';
        logger.error('RecipeFormPage: Invalid recipe data received from update API (missing ID)', updatedRecipe);
        toast.error(errorMsg);
        return;
      }

      // ✅ PERBAIKAN: Invalidate semua queries terkait recipe untuk memastikan stats ter-update
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.all });
      
      // Update cache detail untuk recipe ini
      queryClient.setQueryData(
        RECIPE_QUERY_KEYS.detail(updatedRecipe.id), 
        updatedRecipe
      );
      
      // Update cache list untuk mengupdate data recipe
      queryClient.setQueriesData(
        { queryKey: RECIPE_QUERY_KEYS.lists() },
        (oldData: Recipe[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(recipe => 
            recipe.id === updatedRecipe.id ? updatedRecipe : recipe
          );
        }
      );
      
      toast.success('Resep berhasil diperbarui!');
      onSuccess?.(updatedRecipe, true);
      onNavigate('list');
    },
    onError: (error: Error) => {
      logger.error('RecipeFormPage: Error updating recipe:', error);
      toast.error(error.message || 'Gagal memperbarui resep');
    },
  });

  const isMutationLoading = createRecipeMutation.isPending || updateRecipeMutation.isPending;
  const isLoading = externalLoading || isMutationLoading;

  // Initialize form data
  useEffect(() => {
    if (initialData && isEditMode) {
      const r: any = initialData;
      // Normalize incoming data (support snake_case and camelCase)
      const normalized = {
        namaResep: r.namaResep ?? r.nama_resep ?? '',
        jumlahPorsi: r.jumlahPorsi ?? r.jumlah_porsi ?? 1,
        kategoriResep: r.kategoriResep ?? r.kategori_resep ?? '',
        deskripsi: r.deskripsi ?? '',
        fotoUrl: r.fotoUrl ?? r.foto_url ?? '',
        bahanResep: Array.isArray(r.bahanResep)
          ? [...r.bahanResep]
          : Array.isArray(r.bahan_resep)
            ? [...r.bahan_resep]
            : [],
        biayaTenagaKerja: r.biayaTenagaKerja ?? r.biaya_tenaga_kerja ?? 0,
        biayaOverhead: r.biayaOverhead ?? r.biaya_overhead ?? 0,
        marginKeuntunganPersen: r.marginKeuntunganPersen ?? r.margin_keuntungan_persen ?? 0,
        totalHpp: r.totalHpp ?? r.total_hpp,
        hppPerPorsi: r.hppPerPorsi ?? r.hpp_per_porsi,
        hargaJualPorsi: r.hargaJualPorsi ?? r.harga_jual_porsi,
        jumlahPcsPerPorsi: r.jumlahPcsPerPorsi ?? r.jumlah_pcs_per_porsi ?? 1,
        hppPerPcs: r.hppPerPcs ?? r.hpp_per_pcs,
        hargaJualPerPcs: r.hargaJualPerPcs ?? r.harga_jual_per_pcs,
      } as any;

      setFormData(normalized);
    } else if (!isEditMode) {
      // Reset form for add mode
      setFormData({
        namaResep: '',
        jumlahPorsi: 1,
        kategoriResep: '',
        deskripsi: '',
        fotoUrl: '',
        bahanResep: [],
        biayaTenagaKerja: 0,
        biayaOverhead: 0,
        marginKeuntunganPersen: 25,
        jumlahPcsPerPorsi: 1,
      });
    }
    
    // Reset other states
    setCurrentStep('basic');
    setErrors({});
  }, [initialData, isEditMode, mode]);

  // Auto-calculate HPP when relevant fields change (only if enhanced mode is NOT active)
  useEffect(() => {
    // ✅ FIXED: Skip legacy calculation if enhanced HPP is active
    if (isEnhancedHppActive) {
      console.log('🔥 Legacy HPP calculation skipped - Enhanced mode is active');
      return;
    }

    // Only run legacy calculation if conditions are met AND enhanced mode is off
    const jumlahPorsiNum = typeof formData.jumlahPorsi === 'string' ? parseInt(formData.jumlahPorsi) || 1 : formData.jumlahPorsi;
    if (formData.bahanResep.length > 0 && jumlahPorsiNum > 0) {
      console.log('📊 Running legacy HPP calculation...');
      setIsCalculating(true);
      const timer = setTimeout(() => {
        try {
          const totalBahanBaku = formData.bahanResep.reduce((sum, item) => sum + item.totalHarga, 0);
          const jumlahPcsPerPorsiNum = typeof formData.jumlahPcsPerPorsi === 'string' ? parseInt(formData.jumlahPcsPerPorsi) || 1 : formData.jumlahPcsPerPorsi;
          
          const calculation = calculateHPP(
            formData.bahanResep,
            jumlahPorsiNum,
            formData.biayaTenagaKerja || 0,
            formData.biayaOverhead || 0,
            formData.marginKeuntunganPersen || 0,
            jumlahPcsPerPorsiNum
          );
          
          // ✅ PERBAIKAN: Jangan override harga jual manual user KECUALI user belum input
          setFormData(prev => {
            const updates: any = {
              ...prev,
              totalHpp: calculation.totalHPP,
              hppPerPorsi: calculation.hppPerPorsi,
              hppPerPcs: calculation.hppPerPcs,
            };
            
            // ✅ Hanya update harga jual jika user belum pernah set manual
            // Atau jika harga jual saat ini masih default/kosong
            if (!prev.hargaJualPorsi || prev.hargaJualPorsi === 0) {
              updates.hargaJualPorsi = calculation.hargaJualPorsi;
            }
            if (!prev.hargaJualPerPcs || prev.hargaJualPerPcs === 0) {
              updates.hargaJualPerPcs = calculation.hargaJualPerPcs;
            }
            
            return updates;
          });
        } catch (error) {
          logger.warn('RecipeFormPage: Error calculating HPP:', error);
        } finally {
          setIsCalculating(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [
    formData.bahanResep,
    formData.jumlahPorsi,
    formData.biayaTenagaKerja,
    formData.biayaOverhead,
    formData.marginKeuntunganPersen,
    formData.jumlahPcsPerPorsi,
    isEnhancedHppActive,
  ]);

  // ✅ PERFORMANCE: Memoized callback functions to prevent unnecessary re-renders
  const updateField = useCallback((field: keyof NewRecipe, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  // ✅ PERFORMANCE: Memoized enhanced HPP callback
  const handleEnhancedHppModeChange = useCallback((isActive: boolean) => {
    setIsEnhancedHppActive(isActive);
  }, []);

  // ✅ PERFORMANCE: Memoized step validation
  const validateCurrentStep = useCallback((): boolean => {
    const stepErrors: { [key: string]: string } = {};
    switch (currentStep) {
      case 'basic':
        if (!formData.namaResep.trim()) {
          stepErrors.namaResep = 'Nama resep wajib diisi';
        }
        const jumlahPorsiNum = typeof formData.jumlahPorsi === 'string' ? parseInt(formData.jumlahPorsi) || 0 : formData.jumlahPorsi;
        const jumlahPcsPerPorsiNum = typeof formData.jumlahPcsPerPorsi === 'string' ? parseInt(formData.jumlahPcsPerPorsi) || 0 : (formData.jumlahPcsPerPorsi || 0);
        
        if (jumlahPorsiNum <= 0) {
          stepErrors.jumlahPorsi = 'Jumlah porsi harus lebih dari 0';
        }
        if (jumlahPcsPerPorsiNum <= 0) {
          stepErrors.jumlahPcsPerPorsi = 'Jumlah pcs per porsi harus lebih dari 0';
        }
        break;
      case 'ingredients':
        if (formData.bahanResep.length === 0) {
          stepErrors.bahanResep = 'Minimal harus ada 1 bahan resep';
        } else {
          formData.bahanResep.forEach((bahan, index) => {
            if (!bahan.nama.trim()) {
              stepErrors[`bahan_${index}_nama`] = `Nama bahan ke-${index + 1} wajib diisi`;
            }
            if (bahan.jumlah <= 0) {
              stepErrors[`bahan_${index}_jumlah`] = `Jumlah bahan ke-${index + 1} harus lebih dari 0`;
            }
            if (bahan.hargaSatuan <= 0) {
              stepErrors[`bahan_${index}_harga`] = `Harga bahan ke-${index + 1} harus lebih dari 0`;
            }
          });
        }
        break;
      case 'costs':
        if (formData.biayaTenagaKerja < 0) {
          stepErrors.biayaTenagaKerja = 'Biaya tenaga kerja tidak boleh negatif';
        }
        if (formData.biayaOverhead < 0) {
          stepErrors.biayaOverhead = 'Biaya overhead tidak boleh negatif';
        }
        if (formData.marginKeuntunganPersen < 0) {
          stepErrors.marginKeuntunganPersen = 'Margin keuntungan tidak boleh negatif';
        }
        break;
    }
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  }, [currentStep, formData]);

  // ✅ PERFORMANCE: Memoized navigation functions
  const handleNext = useCallback(() => {
    if (!validateCurrentStep()) {
      toast.error('Mohon perbaiki kesalahan pada form');
      return;
    }
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].key);
    }
  }, [validateCurrentStep, currentStepIndex]);

  const handlePrevious = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].key);
    }
  }, [currentStepIndex]);

  // ✅ PERFORMANCE: Memoized submit handler
  const handleSubmit = useCallback(async () => {
    const validation = validateRecipeData(formData);
    if (!validation.isValid) {
      toast.error(`Form tidak valid: ${validation.errors[0]}`);
      return;
    }
    
    // ✅ DEBUG: Log form data sebelum submit
    console.log('📤 Submitting form data:', {
      hargaJualPorsi: formData.hargaJualPorsi,
      hargaJualPerPcs: formData.hargaJualPerPcs,
      hppPerPorsi: formData.hppPerPorsi,
      hppPerPcs: formData.hppPerPcs,
      namaResep: formData.namaResep,
      isEdit: isEditMode
    });
    
    try {
      if (isEditMode && initialData?.id) {
        await updateRecipeMutation.mutateAsync({
          id: initialData.id,
          data: formData
        });
      } else {
        await createRecipeMutation.mutateAsync(formData);
      }
    } catch (error) {
      logger.error('RecipeFormPage: Error in handleSubmit:', error);
    }
  }, [formData, isEditMode, initialData?.id, createRecipeMutation, updateRecipeMutation]);

  // ✅ PERFORMANCE: Memoized back handler
  const handleBack = useCallback(() => {
    onNavigate('list');
  }, [onNavigate]);

  // Render step content
  const renderStepContent = () => {
    const commonProps = {
      data: formData,
      errors,
      onUpdate: updateField,
      isLoading: isLoading || isCalculating,
    };
    switch (currentStep) {
      case 'basic':
        return <BasicInfoStep {...commonProps} />;
      case 'ingredients':
        return <IngredientsStep {...commonProps} />;
      case 'costs':
        return (
          <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>}>
            <CostCalculationStep 
              {...commonProps} 
              onEnhancedHppModeChange={handleEnhancedHppModeChange}
            />
          </Suspense>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Header with Breadcrumb */}
        <div className="flex flex-col gap-4">
          <RecipeBreadcrumb
            currentView={mode}
            currentRecipe={initialData}
            onNavigate={onNavigate}
          />
          
          {/* Page Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calculator className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditMode ? `Edit Resep: ${initialData?.namaResep}` : 'Tambah Resep Baru'}
              </h1>
              <p className="text-gray-600">
                {STEPS[currentStepIndex].description}
              </p>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader className="border-b bg-white">
            {/* Step Progress */}
            <div className="flex items-center gap-2 sm:gap-4 mt-4 overflow-x-auto">
              {STEPS.map((step, index) => (
                <div key={step.key} className="flex items-center flex-shrink-0">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <div
                      className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-colors ${
                        index <= currentStepIndex
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {index < currentStepIndex ? (
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="hidden sm:block">
                      <p className={`text-xs sm:text-sm font-medium ${
                        index <= currentStepIndex ? 'text-orange-700' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`w-4 sm:w-8 h-0.5 mx-1 sm:mx-2 ${
                      index < currentStepIndex ? 'bg-orange-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Form errors summary */}
            {Object.keys(errors).length > 0 && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription>
                  <div className="text-red-800">
                    <p className="font-medium mb-2">Terdapat kesalahan pada form:</p>
                    <ul className="space-y-1">
                      {Object.values(errors).filter(Boolean).slice(0, 3).map((error, index) => (
                        <li key={index} className="text-sm">• {error}</li>
                      ))}
                      {Object.values(errors).filter(Boolean).length > 3 && (
                        <li className="text-sm">... dan {Object.values(errors).filter(Boolean).length - 3} kesalahan lainnya</li>
                      )}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Step Content */}
            <div ref={contentRef}>
              {renderStepContent()}
            </div>
          </CardContent>

        </Card>
        
        {/* Sticky Footer with Navigation - Mobile Optimized */}
        <div className="sticky bottom-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-t px-4 py-3 mt-6 mb-16 sm:mb-0 sm:static sm:bg-gray-50 sm:backdrop-blur-none sm:border-t-0 sm:px-6 sm:py-4 sm:mt-0 sm:border-t">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Left side - HPP Preview (on cost step) */}
            <div className="flex-1 min-w-0 hidden sm:block">
              {currentStep === 'costs' && (formData.hppPerPorsi || 0) > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Calculator className="h-4 w-4 text-orange-600 flex-shrink-0" />
                  <span className="text-gray-600">HPP per porsi:</span>
                  <Badge variant="outline" className="text-orange-700 border-orange-300 flex-shrink-0">
                    Rp {(formData.hppPerPorsi || 0).toLocaleString()}
                  </Badge>
                  {isCalculating && (
                    <div className="animate-spin h-3 w-3 border border-orange-500 border-t-transparent rounded-full flex-shrink-0" />
                  )}
                </div>
              )}
            </div>
            
            {/* Navigation buttons - Full width on mobile */}
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={isFirstStep ? handleBack : handlePrevious}
                disabled={isLoading}
                className="flex-1 sm:flex-none min-h-[44px] sm:min-h-[auto]"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                <span className="truncate">{isFirstStep ? 'Kembali' : 'Sebelumnya'}</span>
              </Button>
              {isLastStep ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || isCalculating}
                  className="bg-orange-500 hover:bg-orange-600 flex-1 sm:flex-none min-h-[44px] sm:min-h-[auto]"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2 flex-shrink-0" />
                      <span className="truncate">Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{isEditMode ? 'Simpan Perubahan' : 'Simpan Resep'}</span>
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={isLoading}
                  className="bg-orange-500 hover:bg-orange-600 flex-1 sm:flex-none min-h-[44px] sm:min-h-[auto]"
                >
                  <span className="truncate">Selanjutnya</span>
                  <ChevronRight className="h-4 w-4 ml-1 flex-shrink-0" />
                </Button>
              )}
            </div>
            
            {/* Mobile HPP Preview - Bottom on mobile */}
            {currentStep === 'costs' && (formData.hppPerPorsi || 0) > 0 && (
              <div className="w-full sm:hidden mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Calculator className="h-4 w-4 text-orange-600 flex-shrink-0" />
                  <span className="text-gray-600">HPP per porsi:</span>
                  <Badge variant="outline" className="text-orange-700 border-orange-300 flex-shrink-0">
                    Rp {(formData.hppPerPorsi || 0).toLocaleString()}
                  </Badge>
                  {isCalculating && (
                    <div className="animate-spin h-3 w-3 border border-orange-500 border-t-transparent rounded-full flex-shrink-0" />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

RecipeFormPage.displayName = 'RecipeFormPage';

export default RecipeFormPage;
