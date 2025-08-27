import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
        <DialogContent centerMode="overlay" size="md+">
        <div className="dialog-panel dialog-panel-md-plus dialog-no-overflow">
          <DialogHeader className="dialog-header border-b bg-gradient-to-r from-orange-50 to-red-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calculator className="w-4 h-4 text-orange-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-lg sm:text-xl text-gray-900 text-overflow-safe">
                    {isEditMode ? 'Edit Resep' : 'Tambah Resep Baru'}
                  </DialogTitle>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 text-overflow-safe">
                    {STEPS[currentStepIndex].description}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Step Progress */}
            <div className="flex items-center gap-2 sm:gap-4 mt-4 dialog-no-overflow overflow-x-auto">
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
                      <p className={`text-xs sm:text-sm font-medium text-overflow-safe ${
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
          </DialogHeader>

          <div className="dialog-body">
            {/* Form errors summary - Dipindahkan ke atas */}
            {Object.keys(errors).length > 0 && (
              <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-lg dialog-no-overflow">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-red-800 text-overflow-safe">
                      Terdapat kesalahan pada form:
                    </p>
                    <ul className="text-sm text-red-700 mt-1 space-y-1">
                      {Object.values(errors).filter(Boolean).slice(0, 3).map((error, index) => (
                        <li key={index} className="text-overflow-safe">• {error}</li>
                      ))}
                      {Object.values(errors).filter(Boolean).length > 3 && (
                        <li className="text-xs text-overflow-safe">... dan {Object.values(errors).filter(Boolean).length - 3} kesalahan lainnya</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            <div className="dialog-no-overflow">
              {renderStepContent()}
            </div>
          </div>
          
          <DialogFooter className="dialog-footer border-t bg-gray-50">
            <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
              {/* Left side - HPP Preview (on cost step) */}
              <div className="flex-1 min-w-0">
                {currentStep === 'costs' && (formData.hppPerPorsi || 0) > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calculator className="h-4 w-4 text-orange-600 flex-shrink-0" />
                    <span className="text-gray-600 text-overflow-safe">HPP per porsi:</span>
                    <Badge variant="outline" className="text-orange-700 border-orange-300 flex-shrink-0">
                      Rp {(formData.hppPerPorsi || 0).toLocaleString()}
                    </Badge>
                    {isCalculating && (
                      <div className="animate-spin h-3 w-3 border border-orange-500 border-t-transparent rounded-full flex-shrink-0" />
                    )}
                  </div>
                )}
              </div>
              
              {/* Navigation buttons */}
              <div className="dialog-responsive-buttons">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isFirstStep || isLoading}
                  className="input-mobile-safe"
                >
                  <ChevronLeft className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="text-overflow-safe">Sebelumnya</span>
                </Button>
                {isLastStep ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading || isCalculating}
                    className="bg-orange-500 hover:bg-orange-600 input-mobile-safe"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2 flex-shrink-0" />
                        <span className="text-overflow-safe">Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="text-overflow-safe">{isEditMode ? 'Simpan Perubahan' : 'Simpan Resep'}</span>
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={isLoading}
                    className="bg-orange-500 hover:bg-orange-600 input-mobile-safe"
                  >
                    <span className="text-overflow-safe">Selanjutnya</span>
                    <ChevronRight className="h-4 w-4 ml-1 flex-shrink-0" />
                  </Button>
                )}
              </div>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecipeForm;