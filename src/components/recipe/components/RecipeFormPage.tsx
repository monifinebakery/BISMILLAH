// src/components/recipe/components/RecipeFormPage.tsx
// Full page recipe form without dialog wrapper

import React, { useState, useEffect, useRef } from 'react';
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
import CostCalculationStep from './RecipeForm/CostCalculationStep/index';

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

const RecipeFormPage: React.FC<RecipeFormPageProps> = ({
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

      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.lists() });
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
      logger.error('RecipeFormPage: Error in handleSubmit:', error);
    }
  };

  // Handle back to list
  const handleBack = () => {
    onNavigate('list');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
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
          <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-red-50">
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

          {/* Footer with Navigation */}
          <div className="border-t bg-gray-50 px-6 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Left side - HPP Preview (on cost step) */}
              <div className="flex-1 min-w-0">
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
              
              {/* Navigation buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={isFirstStep ? handleBack : handlePrevious}
                  disabled={isLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {isFirstStep ? 'Kembali' : 'Sebelumnya'}
                </Button>
                {isLastStep ? (
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading || isCalculating}
                    className="bg-orange-500 hover:bg-orange-600"
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
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    Selanjutnya
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RecipeFormPage;
