// src/components/recipe/components/RecipeForm/index.tsx

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  AlertCircle,
  CheckCircle,
  Info,
  Calculator
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// Form components
import BasicInfoStep from './BasicInfoStep';
import IngredientsStep from './IngredientsStep';
import CostCalculationStep from './CostCalculationStep';

// Utils and types
import { validateRecipeData, calculateHPP } from '../../services/recipeUtils';
import { RECIPE_CATEGORIES } from '../../types';
import type { Recipe, NewRecipe, RecipeFormStep, BahanResep } from '../../types';

interface RecipeFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Recipe | null;
  onSave: (data: NewRecipe) => Promise<void>;
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
  onSave,
  isLoading = false,
}) => {
  const [currentStep, setCurrentStep] = useState<RecipeFormStep>('basic');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isCalculating, setIsCalculating] = useState(false);

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
        // Reset form for new recipe
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
    }
  }, [isOpen, initialData]);

  // Update form field
  const updateField = (field: keyof NewRecipe, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Auto-calculate HPP when relevant fields change
  useEffect(() => {
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
        if (formData.jumlahPcsPerPorsi <= 0) {
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
    // Validate all data
    const validation = validateRecipeData(formData);
    if (!validation.isValid) {
      toast.error(`Form tidak valid: ${validation.errors[0]}`);
      return;
    }

    try {
      await onSave(formData);
      toast.success(isEditMode ? 'Resep berhasil diperbarui!' : 'Resep berhasil ditambahkan!');
    } catch (error) {
      logger.error('RecipeForm: Error saving recipe:', error);
      toast.error('Gagal menyimpan resep');
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
        return <CostCalculationStep {...commonProps} />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white">
        
        {/* Header */}
        <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-red-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">
                {isEditMode ? 'Edit Resep' : 'Tambah Resep Baru'}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {STEPS[currentStepIndex].description}
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
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
        </CardHeader>

        {/* Content */}
        <CardContent className="p-0 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6">
            {renderStepContent()}
          </div>
        </CardContent>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            
            {/* Left side - HPP Preview (on cost step) */}
            <div className="flex-1">
              {currentStep === 'costs' && formData.hppPerPorsi > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Calculator className="h-4 w-4 text-orange-600" />
                  <span className="text-gray-600">HPP per porsi:</span>
                  <Badge variant="outline" className="text-orange-700 border-orange-300">
                    Rp {formData.hppPerPorsi.toLocaleString()}
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
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Sebelumnya
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

          {/* Form errors summary */}
          {Object.keys(errors).length > 0 && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Terdapat kesalahan pada form:
                  </p>
                  <ul className="text-sm text-red-700 mt-1 space-y-1">
                    {Object.values(errors).filter(Boolean).map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default RecipeForm;