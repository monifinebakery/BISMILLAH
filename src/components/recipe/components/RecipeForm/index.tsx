import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  AlertCircle,
  CheckCircle,
  Calculator
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
// Form components
import BasicInfoStep from './BasicInfoStep';
import IngredientsStep from './IngredientsStep';
import CostCalculationStep from './CostCalculationStep/index';
// Utils and types
import { validateRecipeData, calculateHPP } from '../../services/recipeUtils';
import { recipeApi } from '../../services/recipeApi';
import {
  RECIPE_CATEGORIES,
  type Recipe,
  type NewRecipe,
  type RecipeFormStep,
  type BahanResep,
} from '../../types';

// Query Keys
export const RECIPE_QUERY_KEYS = {
  all: ['recipes'] as const,
  lists: () => [...RECIPE_QUERY_KEYS.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...RECIPE_QUERY_KEYS.lists(), filters] as const,
  details: () => [...RECIPE_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...RECIPE_QUERY_KEYS.details(), id] as const,
} as const;

interface RecipeFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Recipe | null;
  onSuccess?: (recipe: Recipe, isEdit: boolean) => void;
  isLoading?: boolean;
}

const STEPS: { key: RecipeFormStep; title: string; description: string }[] = [
  { key: 'basic', title: 'Informasi Dasar', description: 'Nama, kategori, dan deskripsi resep' },
  { key: 'ingredients', title: 'Bahan-bahan', description: 'Daftar bahan dan takaran yang dibutuhkan' },
  { key: 'costs', title: 'Kalkulasi HPP', description: 'Biaya produksi dan margin keuntungan' },
];

const RecipeForm: React.FC<RecipeFormProps> = ({
  isOpen,
  onOpenChange,
  initialData,
  onSuccess,
  isLoading: externalLoading = false,
}) => {
  const [currentStep, setCurrentStep] = useState<RecipeFormStep>('basic');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const [isEnhancedHppActive, setIsEnhancedHppActive] = useState(false); // Track enhanced HPP state
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

  const isEditMode = !!initialData;
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
        logger.error('RecipeForm: No recipe data received from create API');
        toast.error(errorMsg);
        return;
      }
      if (!newRecipe.id) {
        const errorMsg = 'Data resep baru tidak valid diterima dari server (ID hilang)';
        logger.error('RecipeForm: Invalid recipe data received from create API (missing ID)', newRecipe);
        toast.error(errorMsg);
        return;
      }

      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.lists() });
      queryClient.setQueryData(
        RECIPE_QUERY_KEYS.detail(newRecipe.id), 
        newRecipe
      );
      toast.success('Resep berhasil ditambahkan!');
      onSuccess?.(newRecipe, false);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      logger.error('RecipeForm: Error creating recipe:', error);
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
        logger.error('RecipeForm: No recipe data received from update API');
        toast.error(errorMsg);
        return;
      }
      if (!updatedRecipe.id) {
        const errorMsg = 'Data resep tidak valid diterima dari server (ID hilang)';
        logger.error('RecipeForm: Invalid recipe data received from update API (missing ID)', updatedRecipe);
        toast.error(errorMsg);
        return;
      }

      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.lists() });
      queryClient.setQueryData(
        RECIPE_QUERY_KEYS.detail(updatedRecipe.id), 
        updatedRecipe
      );
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
      onOpenChange(false);
    },
    onError: (error: Error) => {
      logger.error('RecipeForm: Error updating recipe:', error);
      toast.error(error.message || 'Gagal memperbarui resep');
    },
  });

  const isMutationLoading = createRecipeMutation.isPending || updateRecipeMutation.isPending;
  const isLoading = externalLoading || isMutationLoading;

  // Initialize form data
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          namaResep: initialData.namaResep,
          jumlahPorsi: initialData.jumlahPorsi,
          kategoriResep: initialData.kategoriResep || '',
          deskripsi: initialData.deskripsi || '',
          fotoUrl: initialData.fotoUrl || '',
          bahanResep: [...initialData.bahanResep],
          biayaTenagaKerja: initialData.biayaTenagaKerja,
          biayaOverhead: initialData.biayaOverhead,
          marginKeuntunganPersen: initialData.marginKeuntunganPersen,
          totalHpp: initialData.totalHpp,
          hppPerPorsi: initialData.hppPerPorsi,
          hargaJualPorsi: initialData.hargaJualPorsi,
          jumlahPcsPerPorsi: initialData.jumlahPcsPerPorsi || 1,
          hppPerPcs: initialData.hppPerPcs,
          hargaJualPerPcs: initialData.hargaJualPerPcs,
        });
      } else {
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
      setCurrentStep('basic');
      setErrors({});
      setIsFooterVisible(false);
    }
  }, [isOpen, initialData]);

  // Scroll handler for footer visibility
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;
        setIsFooterVisible(isAtBottom);
      }
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
      handleScroll();
    }

    return () => {
      if (contentElement) {
        contentElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [isOpen]);

  // Update form field
  const updateField = (field: keyof NewRecipe, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Enhanced HPP callback to track when enhanced mode is active
  const handleEnhancedHppModeChange = (isActive: boolean) => {
    setIsEnhancedHppActive(isActive);
  };

  // Auto-calculate HPP when relevant fields change (only if enhanced mode is NOT active)
  useEffect(() => {
    // Skip legacy calculation if enhanced HPP is active
    if (isEnhancedHppActive) {
      return;
    }

    if (formData.bahanResep.length > 0 && formData.jumlahPorsi > 0) {
      setIsCalculating(true);
      const timer = setTimeout(() => {
        try {
          const calculation = calculateHPP(
            formData.bahanResep,
            formData.jumlahPorsi,
            formData.biayaTenagaKerja || 0,
            formData.biayaOverhead || 0,
            formData.marginKeuntunganPersen || 0,
            formData.jumlahPcsPerPorsi || 1
          );
          setFormData(prev => ({
            ...prev,
            totalHpp: calculation.totalHPP,
            hppPerPorsi: calculation.hppPerPorsi,
            hargaJualPorsi: calculation.hargaJualPorsi,
            hppPerPcs: calculation.hppPerPcs,
            hargaJualPerPcs: calculation.hargaJualPerPcs,
          }));
        } catch (error) {
          logger.warn('RecipeForm: Error calculating HPP:', error);
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
    isEnhancedHppActive, // Add dependency to re-run when enhanced mode changes
  ]);

  // Validate current step
  const validateCurrentStep = (): boolean => {
    const stepErrors: { [key: string]: string } = {};
    switch (currentStep) {
      case 'basic':
        if (!formData.namaResep.trim()) {
          stepErrors.namaResep = 'Nama resep wajib diisi';
        }
        if (formData.jumlahPorsi <= 0) {
          stepErrors.jumlahPorsi = 'Jumlah porsi harus lebih dari 0';
        }
        if ((formData.jumlahPcsPerPorsi || 0) <= 0) {
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
  };

  // Navigate to next step
  const handleNext = () => {
    if (!validateCurrentStep()) {
      toast.error('Mohon perbaiki kesalahan pada form');
      return;
    }
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].key);
    }
  };

  // Navigate to previous step
  const handlePrevious = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].key);
    }
  };

  // Submit form
  const handleSubmit = async () => {
    const validation = validateRecipeData(formData);
    if (!validation.isValid) {
      toast.error(`Form tidak valid: ${validation.errors[0]}`);
      return;
    }
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
      logger.error('RecipeForm: Error in handleSubmit:', error);
    }
  };

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
          <CostCalculationStep 
            {...commonProps} 
            onEnhancedHppModeChange={handleEnhancedHppModeChange}
          />
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="dialog-overlay-center">
        <div className="dialog-panel max-w-4xl">
          <DialogHeader className="dialog-header-pad border-b bg-gradient-to-r from-orange-50 to-red-50">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  {isEditMode ? 'Edit Resep' : 'Tambah Resep Baru'}
                </DialogTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {STEPS[currentStepIndex].description}
                </p>
              </div>
            </div>
          {/* Step Progress */}
          <div className="flex items-center gap-4 mt-4">
            {STEPS.map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      index <= currentStepIndex
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index < currentStepIndex ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <p className={`text-sm font-medium ${
                      index <= currentStepIndex ? 'text-orange-700' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    index < currentStepIndex ? 'bg-orange-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>

        {/* Content with extra bottom padding for mobile */}
        <div 
          className="dialog-body overflow-y-auto"
          style={{ 
            paddingBottom: '120px' // ✅ Extra space untuk menghindari bottom bar
          }}
          ref={contentRef}
        >
          <div className="p-6">
            {renderStepContent()}
          </div>
        </div>

        {/* ✅ Footer - Fixed positioning with proper spacing for bottom navigation */}
        <div className="border-t bg-gray-50 p-4 sm:relative sm:bottom-auto">
          {/* ✅ Desktop: normal footer */}
          <div className="hidden sm:block">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              {/* Left side - HPP Preview (on cost step) */}
              <div className="flex-1">
                {currentStep === 'costs' && (formData.hppPerPorsi || 0) > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calculator className="h-4 w-4 text-orange-600" />
                    <span className="text-gray-600">HPP per porsi:</span>
                    <Badge variant="outline" className="text-orange-700 border-orange-300">
                      Rp {(formData.hppPerPorsi || 0).toLocaleString()}
                    </Badge>
                    {isCalculating && (
                      <div className="animate-spin h-3 w-3 border border-orange-500 border-t-transparent rounded-full" />
                    )}
                  </div>
                )}
              </div>
              {/* Navigation buttons */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isFirstStep || isLoading}
                  className="px-4"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Sebelumnya
                </Button>
                {isLastStep ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading || isCalculating}
                    className="bg-orange-500 hover:bg-orange-600 px-4"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {isEditMode ? 'Simpan Perubahan' : 'Simpan Resep'}
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={isLoading}
                    className="bg-orange-500 hover:bg-orange-600 px-4"
                  >
                    Selanjutnya
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* ✅ Mobile: Fixed footer dengan spacing untuk bottom nav */}
          <div className="sm:hidden">
            {/* ✅ Fixed footer positioned above bottom navigation */}
            <div 
              className="fixed left-0 right-0 bg-white border-t border z-[60]"
              style={{
                bottom: '80px', // ✅ Positioned 80px from bottom (above bottom nav)
                paddingBottom: 'env(safe-area-inset-bottom, 0px)'
              }}
            >
              <div className="p-4">
                {/* HPP Preview on mobile */}
                {currentStep === 'costs' && (formData.hppPerPorsi || 0) > 0 && (
                  <div className="flex items-center justify-center gap-2 text-sm mb-3 py-2 bg-orange-50 rounded-lg">
                    <Calculator className="h-4 w-4 text-orange-600" />
                    <span className="text-gray-600">HPP:</span>
                    <Badge variant="outline" className="text-orange-700 border-orange-300">
                      Rp {(formData.hppPerPorsi || 0).toLocaleString()}
                    </Badge>
                    {isCalculating && (
                      <div className="animate-spin h-3 w-3 border border-orange-500 border-t-transparent rounded-full" />
                    )}
                  </div>
                )}

                {/* Navigation buttons */}
                <div className="flex items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={isFirstStep || isLoading}
                    className="flex-1"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Sebelumnya
                  </Button>
                  {isLastStep ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={isLoading || isCalculating}
                      className="bg-orange-500 hover:bg-orange-600 flex-1"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1" />
                          Simpan...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-1" />
                          {isEditMode ? 'Update' : 'Simpan'}
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      disabled={isLoading}
                      className="bg-orange-500 hover:bg-orange-600 flex-1"
                    >
                      Selanjutnya
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Form errors summary - Mobile Optimized */}
          {Object.keys(errors).length > 0 && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg max-w-4xl mx-auto">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-red-800">
                    Terdapat kesalahan pada form:
                  </p>
                  <ul className="text-sm text-red-700 mt-1 space-y-1">
                    {Object.values(errors).filter(Boolean).slice(0, 3).map((error, index) => (
                      <li key={index} className="truncate">• {error}</li>
                    ))}
                    {Object.values(errors).filter(Boolean).length > 3 && (
                      <li className="text-xs">... dan {Object.values(errors).filter(Boolean).length - 3} kesalahan lainnya</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecipeForm;