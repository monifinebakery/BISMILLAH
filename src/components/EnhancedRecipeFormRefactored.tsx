// src/components/EnhancedRecipeFormRefactored.tsx
// 🔄 REFACTORED VERSION - Modular and maintainable
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Recipe, NewRecipe } from "@/components/recipe/types";
import { toast } from "sonner";
import { Info } from 'lucide-react';

// Auto-Sync HPP Integration
import AutoSyncRecipeDisplay from '@/components/operational-costs/components/AutoSyncRecipeDisplay';

// Hooks
import { useBahanBaku } from '@/components/warehouse/context/WarehouseContext';
import { useRecipe } from "@/contexts/RecipeContext";
import { useIngredientManager, useHppCalculation } from './recipe/hooks';

// Components
import { BasicInfoSection, IngredientsSection, CostCalculationSection } from './recipe/components';

interface EnhancedRecipeFormProps {
  initialData?: Recipe | null;
  onSave: (data: NewRecipe) => void;
  onCancel: () => void;
}

const EnhancedRecipeFormRefactored = ({ initialData, onSave, onCancel }: EnhancedRecipeFormProps) => {
  // Add defensive check for useBahanBaku
  let bahanBaku: any[] = [];
  try {
    const warehouseContext = useBahanBaku();
    bahanBaku = warehouseContext?.bahanBaku || [];
  } catch (error) {
    console.warn('Failed to get warehouse data in RecipeForm:', error);
    bahanBaku = [];
  }
  
  const { validateRecipeData } = useRecipe();

  // Main form state
  const [formData, setFormData] = useState<NewRecipe>({
    namaResep: "",
    jumlahPorsi: 1,
    kategoriResep: '',
    deskripsi: "",
    fotoUrl: '',
    bahanResep: [],
    biayaTenagaKerja: 0,
    biayaOverhead: 0,
    marginKeuntunganPersen: 30,
    jumlahPcsPerPorsi: 1,
    // Calculated fields
    totalHpp: 0,
    hppPerPorsi: 0,
    hargaJualPorsi: 0,
    hppPerPcs: 0,
    hargaJualPerPcs: 0,
  });

  // Initialize form with existing data
  useEffect(() => {
    if (initialData) {
      const r: any = initialData;
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
        marginKeuntunganPersen: r.marginKeuntunganPersen ?? r.margin_keuntungan_persen ?? 30,
        jumlahPcsPerPorsi: r.jumlahPcsPerPorsi ?? r.jumlah_pcs_per_porsi ?? 1,
        totalHpp: r.totalHpp ?? r.total_hpp ?? 0,
        hppPerPorsi: r.hppPerPorsi ?? r.hpp_per_porsi ?? 0,
        hargaJualPorsi: r.hargaJualPorsi ?? r.harga_jual_porsi ?? 0,
        hppPerPcs: r.hppPerPcs ?? r.hpp_per_pcs ?? 0,
        hargaJualPerPcs: r.hargaJualPerPcs ?? r.harga_jual_per_pcs ?? 0,
      } as any;
      setFormData(normalized);
    }
  }, [initialData]);

  // Hooks for ingredient management
  const {
    newIngredient,
    setNewIngredient,
    handleIngredientSelectionChange,
    addIngredient,
    removeIngredient,
    updateIngredientQuantity,
    refreshIngredientPrices,
  } = useIngredientManager({
    bahanBaku,
    formData,
    setFormData,
  });

  // Hooks for HPP calculation
  const {
    calculationResults,
    recipeDataForHpp,
    totalPcsProduced,
    totalIngredientCost,
    handleEnhancedHppChange,
  } = useHppCalculation({
    formData,
    setFormData,
  });

  // Form input handler
  const handleInputChange = useCallback((field: keyof NewRecipe, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean up form data - convert string values to numbers before validation and submission
    const cleanFormData = {
      ...formData,
      jumlahPorsi: typeof formData.jumlahPorsi === 'number' ? formData.jumlahPorsi : parseInt(formData.jumlahPorsi) || 1,
      jumlahPcsPerPorsi: typeof formData.jumlahPcsPerPorsi === 'number' ? formData.jumlahPcsPerPorsi : parseInt(formData.jumlahPcsPerPorsi as string) || 1,
    };
    
    // Validate using context validation
    const validation = validateRecipeData(cleanFormData);
    if (!validation.isValid) {
      toast.error(`Data resep tidak valid: ${validation.errors.join(', ')}`);
      return;
    }

    onSave(cleanFormData);
  }, [formData, validateRecipeData, onSave]);

  return (
    <div className="space-y-6 recipe-form-mobile">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Section */}
        <BasicInfoSection
          formData={formData}
          totalPcsProduced={totalPcsProduced}
          onInputChange={handleInputChange}
        />

        {/* Ingredients Section */}
        <IngredientsSection
          formData={formData}
          bahanBaku={bahanBaku}
          newIngredient={newIngredient}
          totalIngredientCost={totalIngredientCost}
          onNewIngredientChange={setNewIngredient}
          onIngredientSelectionChange={handleIngredientSelectionChange}
          onAddIngredient={addIngredient}
          onRemoveIngredient={removeIngredient}
          onUpdateIngredientQuantity={updateIngredientQuantity}
          onRefreshIngredientPrices={refreshIngredientPrices}
        />

        {/* Cost Calculation Section */}
        <CostCalculationSection
          formData={formData}
          calculationResults={calculationResults}
          onInputChange={handleInputChange}
        />

        {/* Enhanced HPP Information */}
        <Alert className="border-green-200 bg-green-50">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-green-800">
            <strong>🤖 Smart HPP Calculator:</strong> Sistem otomatis menghitung HPP menggunakan biaya produksi (overhead + operasional) dari{' '}
            <strong>Biaya Operasional → Kalkulator Biaya Produksi</strong>. Hasil kalkulasi lebih akurat dan real-time!
          </AlertDescription>
        </Alert>

        {/* Auto-Sync HPP Integration */}
        <AutoSyncRecipeDisplay
          recipeData={recipeDataForHpp}
          onResultChange={handleEnhancedHppChange}
        />

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            size="lg"
            className="w-full sm:w-auto"
          >
            Batal
          </Button>
          <Button 
            type="submit" 
            size="lg"
            disabled={!formData.namaResep || formData.bahanResep.length === 0}
            className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
            {initialData ? 'Update Resep' : 'Simpan Resep'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EnhancedRecipeFormRefactored;