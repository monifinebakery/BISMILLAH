import { useState, useCallback, useEffect, useMemo } from 'react';
import { Recipe, NewRecipe } from '@/types/recipe';
import { validateRecipe, hasValidationErrors } from '../../shared/utils/recipeValidators';
import { calculateRecipe } from '../../shared/utils/recipeCalculations';

interface BahanResep {
  id: string;
  nama: string;
  jumlah: number;
  satuan: string;
  hargaSatuan: number;
  totalHarga: number;
}

interface UseRecipeFormProps {
  initialData?: Recipe | null;
  onSave: (recipe: NewRecipe) => Promise<void>;
  onCancel: () => void;
}

export const useRecipeForm = ({ initialData, onSave, onCancel }: UseRecipeFormProps) => {
  const [formData, setFormData] = useState<Partial<NewRecipe>>({
    namaResep: '',
    jumlahPorsi: 1,
    kategoriResep: '',
    deskripsi: '',
    fotoUrl: '',
    bahanResep: [],
    biayaTenagaKerja: 0,
    biayaOverhead: 0,
    marginKeuntunganPersen: 30,
    jumlahPcsPerPorsi: 1,
    totalHpp: 0,
    hppPerPorsi: 0,
    hargaJualPorsi: 0,
    hppPerPcs: 0,
    hargaJualPerPcs: 0
  });

  // Fixed: errors should be just error messages, not validation objects
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Initialize form with existing data
  useEffect(() => {
    if (initialData) {
      setFormData({
        namaResep: initialData.namaResep,
        jumlahPorsi: initialData.jumlahPorsi,
        kategoriResep: initialData.kategoriResep,
        deskripsi: initialData.deskripsi,
        fotoUrl: initialData.fotoUrl,
        bahanResep: initialData.bahanResep || [],
        biayaTenagaKerja: initialData.biayaTenagaKerja,
        biayaOverhead: initialData.biayaOverhead,
        marginKeuntunganPersen: initialData.marginKeuntunganPersen,
        jumlahPcsPerPorsi: initialData.jumlahPcsPerPorsi || 1,
        totalHpp: initialData.totalHpp,
        hppPerPorsi: initialData.hppPerPorsi,
        hargaJualPorsi: initialData.hargaJualPorsi,
        hppPerPcs: initialData.hppPerPcs,
        hargaJualPerPcs: initialData.hargaJualPerPcs
      });
    }
  }, [initialData]);

  // Auto-calculate HPP when relevant fields change
  useEffect(() => {
    if (formData.bahanResep && formData.jumlahPorsi) {
      try {
        const calculation = calculateRecipe(
          formData.bahanResep,
          formData.jumlahPorsi,
          formData.jumlahPcsPerPorsi || 1,
          formData.hargaJualPorsi || 0,
          formData.hargaJualPerPcs || 0
        );

        setFormData(prev => ({
          ...prev,
          totalHpp: calculation.totalHpp,
          hppPerPorsi: calculation.hppPerPorsi,
          hppPerPcs: calculation.hppPerPcs
        }));
      } catch (error) {
        // Handle calculation errors silently
      }
    }
  }, [formData.bahanResep, formData.jumlahPorsi, formData.jumlahPcsPerPorsi]);

  const updateField = useCallback((field: keyof NewRecipe, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const addIngredient = useCallback(() => {
    const newIngredient: BahanResep = {
      id: `ingredient-${Date.now()}`,
      nama: '',
      jumlah: 0,
      satuan: '',
      hargaSatuan: 0,
      totalHarga: 0
    };

    setFormData(prev => ({
      ...prev,
      bahanResep: [...(prev.bahanResep || []), newIngredient]
    }));
    setIsDirty(true);
  }, []);

  const updateIngredient = useCallback((index: number, field: keyof BahanResep, value: any) => {
    setFormData(prev => {
      const newIngredients = [...(prev.bahanResep || [])];
      newIngredients[index] = { 
        ...newIngredients[index], 
        [field]: value 
      };
      
      // Recalculate total for this ingredient
      if (field === 'jumlah' || field === 'hargaSatuan') {
        newIngredients[index].totalHarga = newIngredients[index].jumlah * newIngredients[index].hargaSatuan;
      }
      
      return { ...prev, bahanResep: newIngredients };
    });
    setIsDirty(true);
  }, []);

  const removeIngredient = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      bahanResep: (prev.bahanResep || []).filter((_, i) => i !== index)
    }));
    setIsDirty(true);
  }, []);

  const validateForm = useCallback(() => {
    const validationResult = validateRecipe(formData as NewRecipe);
    
    // Fixed: Convert validation objects to simple error messages
    const errorMessages: Record<string, string> = {};
    Object.entries(validationResult).forEach(([field, validation]) => {
      if (validation && typeof validation === 'object' && 'isValid' in validation) {
        if (!validation.isValid && validation.message) {
          errorMessages[field] = validation.message;
        }
      }
    });
    
    setErrors(errorMessages);
    return Object.keys(errorMessages).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return false;
    }

    try {
      await onSave(formData as NewRecipe);
      setIsDirty(false);
      return true;
    } catch (error) {
      return false;
    }
  }, [formData, validateForm, onSave]);

  const handleCancel = useCallback(() => {
    if (isDirty) {
      const confirmed = window.confirm('Anda memiliki perubahan yang belum disimpan. Yakin ingin keluar?');
      if (!confirmed) return;
    }
    onCancel();
  }, [isDirty, onCancel]);

  // Fixed: Return simple boolean instead of computed from errors object
  const isFormValid = useMemo(() => {
    // Basic required fields
    if (!formData.namaResep || formData.namaResep.trim().length === 0) return false;
    if (!formData.jumlahPorsi || formData.jumlahPorsi <= 0) return false;
    if (!formData.bahanResep || formData.bahanResep.length === 0) return false;
    
    // Check ingredients
    const invalidIngredients = formData.bahanResep.some(ingredient => 
      !ingredient.nama || 
      ingredient.nama.trim().length === 0 ||
      ingredient.jumlah <= 0 ||
      !ingredient.satuan ||
      ingredient.hargaSatuan < 0
    );
    
    if (invalidIngredients) return false;
    
    // Check for validation errors
    const hasErrors = Object.values(errors).some(error => error && error.length > 0);
    if (hasErrors) return false;
    
    return true;
  }, [formData, errors]);

  return {
    formData,
    errors, // Now just string messages, not objects
    isDirty,
    updateField,
    addIngredient,
    updateIngredient,
    removeIngredient,
    validateForm,
    handleSubmit,
    handleCancel,
    isValid: isFormValid // Fixed: simple boolean value
  };
};