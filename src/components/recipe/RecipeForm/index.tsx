// src/components/recipe/RecipeForm/index.tsx

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, X } from 'lucide-react';
import { Recipe, NewRecipe } from '@/types/recipe';

// Hooks
import { useRecipeForm } from './hooks/useRecipeForm';
import { useRecipeCalculation } from './hooks/useRecipeCalculation';
import { useRecipeCategories } from '../shared/hooks/useRecipeCategories';

// Components
import { RecipeBasicInfo } from './components/RecipeBasicInfo';
import { RecipeIngredients } from './components/RecipeIngredients';
import { RecipePricing } from './components/RecipePricing';
import { RecipePreview } from './components/RecipePreview';

// Shared components
import { ButtonLoadingState } from '../shared/components/LoadingStates';

interface RecipeFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Recipe | null;
  onSave: (recipe: NewRecipe) => Promise<void>;
  isLoading?: boolean;
}

const RecipeForm: React.FC<RecipeFormProps> = ({
  isOpen,
  onOpenChange,
  initialData = null,
  onSave,
  isLoading = false
}) => {
  const { categories } = useRecipeCategories();

  const {
    formData,
    errors,
    isDirty,
    updateField,
    addIngredient,
    updateIngredient,
    removeIngredient,
    handleSubmit,
    handleCancel,
    isValid
  } = useRecipeForm({
    initialData,
    onSave,
    onCancel: () => onOpenChange(false)
  });

  // Calculate HPP and profits
  const calculation = useRecipeCalculation({
    bahanResep: formData.bahanResep || [],
    jumlahPorsi: formData.jumlahPorsi || 1,
    jumlahPcsPerPorsi: formData.jumlahPcsPerPorsi || 1,
    biayaTenagaKerja: formData.biayaTenagaKerja || 0,
    biayaOverhead: formData.biayaOverhead || 0,
    marginKeuntunganPersen: formData.marginKeuntunganPersen || 30
  });

  const totalIngredientCost = (formData.bahanResep || []).reduce(
    (sum, ingredient) => sum + (ingredient.totalHarga || 0), 
    0
  );

  const profitPerPorsi = (formData.hargaJualPorsi || 0) - (calculation.hppPerPorsi || 0);
  const profitPerPcs = formData.hargaJualPerPcs && calculation.hppPerPcs 
    ? (formData.hargaJualPerPcs || 0) - (calculation.hppPerPcs || 0) 
    : undefined;
  const marginPercentage = (formData.hargaJualPorsi || 0) > 0 
    ? (profitPerPorsi / (formData.hargaJualPorsi || 1)) * 100 
    : 0;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    await handleSubmit();
  };

  // Add first ingredient when form opens if none exist
  React.useEffect(() => {
    if (isOpen && (!formData.bahanResep || formData.bahanResep.length === 0)) {
      addIngredient();
    }
  }, [isOpen, formData.bahanResep, addIngredient]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-[95vw] lg:max-w-7xl h-[95vh] p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b bg-white">
          <DialogTitle className="text-lg sm:text-xl">
            {initialData ? `Edit Resep: ${initialData.namaResep}` : 'Tambah Resep Baru'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Isi detail resep dan kalkulasi HPP per porsi & per pcs akan otomatis diperbarui
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="flex flex-col h-full">
          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 sm:p-6">
                {/* Mobile Layout - Stack vertically */}
                <div className="block lg:hidden space-y-6">
                  {/* Basic Information */}
                  <RecipeBasicInfo
                    namaResep={formData.namaResep || ''}
                    onNamaResepChange={(value) => updateField('namaResep', value)}
                    kategoriResep={formData.kategoriResep}
                    onKategoriResepChange={(value) => updateField('kategoriResep', value)}
                    categories={categories}
                    deskripsi={formData.deskripsi}
                    onDeskripsiChange={(value) => updateField('deskripsi', value)}
                    jumlahPorsi={formData.jumlahPorsi || 1}
                    onJumlahPorsiChange={(value) => updateField('jumlahPorsi', value)}
                    jumlahPcsPerPorsi={formData.jumlahPcsPerPorsi}
                    onJumlahPcsPerPorsiChange={(value) => updateField('jumlahPcsPerPorsi', value)}
                    errors={errors}
                  />

                  {/* Preview - Show early on mobile for immediate feedback */}
                  <RecipePreview
                    namaResep={formData.namaResep || ''}
                    kategoriResep={formData.kategoriResep}
                    jumlahPorsi={formData.jumlahPorsi || 1}
                    jumlahPcsPerPorsi={formData.jumlahPcsPerPorsi}
                    ingredients={formData.bahanResep || []}
                    totalHpp={calculation.totalHpp || 0}
                    hppPerPorsi={calculation.hppPerPorsi || 0}
                    hppPerPcs={calculation.hppPerPcs}
                    hargaJualPorsi={formData.hargaJualPorsi || 0}
                    hargaJualPerPcs={formData.hargaJualPerPcs}
                    profitPerPorsi={profitPerPorsi}
                    profitPerPcs={profitPerPcs}
                    marginPercentage={marginPercentage}
                    isValid={calculation.isValid && isValid}
                    errors={calculation.errors || []}
                  />

                  {/* Ingredients */}
                  <RecipeIngredients
                    ingredients={formData.bahanResep || []}
                    onAddIngredient={addIngredient}
                    onUpdateIngredient={updateIngredient}
                    onRemoveIngredient={removeIngredient}
                    totalCost={totalIngredientCost}
                    errors={errors}
                  />

                  {/* Pricing */}
                  <RecipePricing
                    biayaTenagaKerja={formData.biayaTenagaKerja || 0}
                    onBiayaTenagaKerjaChange={(value) => updateField('biayaTenagaKerja', value)}
                    biayaOverhead={formData.biayaOverhead || 0}
                    onBiayaOverheadChange={(value) => updateField('biayaOverhead', value)}
                    marginKeuntunganPersen={formData.marginKeuntunganPersen || 30}
                    onMarginKeuntunganPersenChange={(value) => updateField('marginKeuntunganPersen', value)}
                    hargaJualPorsi={formData.hargaJualPorsi || 0}
                    onHargaJualPorsiChange={(value) => updateField('hargaJualPorsi', value)}
                    hargaJualPerPcs={formData.hargaJualPerPcs}
                    onHargaJualPerPcsChange={(value) => updateField('hargaJualPerPcs', value)}
                    recommendedPricePerPorsi={calculation.recommendedPricePerPorsi}
                    recommendedPricePerPcs={calculation.recommendedPricePerPcs}
                    hasJumlahPcsPerPorsi={Boolean(formData.jumlahPcsPerPorsi && formData.jumlahPcsPerPorsi > 1)}
                    errors={errors}
                  />
                </div>

                {/* Desktop Layout - Side by side */}
                <div className="hidden lg:grid lg:grid-cols-3 gap-6">
                  {/* Left Column - Basic Info & Ingredients */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Basic Information */}
                    <RecipeBasicInfo
                      namaResep={formData.namaResep || ''}
                      onNamaResepChange={(value) => updateField('namaResep', value)}
                      kategoriResep={formData.kategoriResep}
                      onKategoriResepChange={(value) => updateField('kategoriResep', value)}
                      categories={categories}
                      deskripsi={formData.deskripsi}
                      onDeskripsiChange={(value) => updateField('deskripsi', value)}
                      jumlahPorsi={formData.jumlahPorsi || 1}
                      onJumlahPorsiChange={(value) => updateField('jumlahPorsi', value)}
                      jumlahPcsPerPorsi={formData.jumlahPcsPerPorsi}
                      onJumlahPcsPerPorsiChange={(value) => updateField('jumlahPcsPerPorsi', value)}
                      errors={errors}
                    />

                    {/* Ingredients */}
                    <RecipeIngredients
                      ingredients={formData.bahanResep || []}
                      onAddIngredient={addIngredient}
                      onUpdateIngredient={updateIngredient}
                      onRemoveIngredient={removeIngredient}
                      totalCost={totalIngredientCost}
                      errors={errors}
                    />

                    {/* Pricing */}
                    <RecipePricing
                      biayaTenagaKerja={formData.biayaTenagaKerja || 0}
                      onBiayaTenagaKerjaChange={(value) => updateField('biayaTenagaKerja', value)}
                      biayaOverhead={formData.biayaOverhead || 0}
                      onBiayaOverheadChange={(value) => updateField('biayaOverhead', value)}
                      marginKeuntunganPersen={formData.marginKeuntunganPersen || 30}
                      onMarginKeuntunganPersenChange={(value) => updateField('marginKeuntunganPersen', value)}
                      hargaJualPorsi={formData.hargaJualPorsi || 0}
                      onHargaJualPorsiChange={(value) => updateField('hargaJualPorsi', value)}
                      hargaJualPerPcs={formData.hargaJualPerPcs}
                      onHargaJualPerPcsChange={(value) => updateField('hargaJualPerPcs', value)}
                      recommendedPricePerPorsi={calculation.recommendedPricePerPorsi}
                      recommendedPricePerPcs={calculation.recommendedPricePerPcs}
                      hasJumlahPcsPerPorsi={Boolean(formData.jumlahPcsPerPorsi && formData.jumlahPcsPerPorsi > 1)}
                      errors={errors}
                    />
                  </div>

                  {/* Right Column - Preview (Desktop only, sticky) */}
                  <div className="lg:col-span-1">
                    <div className="sticky top-0">
                      <RecipePreview
                        namaResep={formData.namaResep || ''}
                        kategoriResep={formData.kategoriResep}
                        jumlahPorsi={formData.jumlahPorsi || 1}
                        jumlahPcsPerPorsi={formData.jumlahPcsPerPorsi}
                        ingredients={formData.bahanResep || []}
                        totalHpp={calculation.totalHpp || 0}
                        hppPerPorsi={calculation.hppPerPorsi || 0}
                        hppPerPcs={calculation.hppPerPcs}
                        hargaJualPorsi={formData.hargaJualPorsi || 0}
                        hargaJualPerPcs={formData.hargaJualPerPcs}
                        profitPerPorsi={profitPerPorsi}
                        profitPerPcs={profitPerPcs}
                        marginPercentage={marginPercentage}
                        isValid={calculation.isValid && isValid}
                        errors={calculation.errors || []}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Footer Actions - Sticky bottom */}
          <div className="border-t bg-white px-4 sm:px-6 py-4">
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {isDirty && (
                  <span className="flex items-center gap-1">
                    <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                    Belum disimpan
                  </span>
                )}
                {!calculation.isValid && (
                  <span className="text-red-600">
                    Lengkapi data untuk menyimpan
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex-1 sm:flex-none"
                >
                  <X className="h-4 w-4 mr-2" />
                  Batal
                </Button>
                
                <Button
                  type="submit"
                  disabled={!calculation.isValid || !isValid || isLoading}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 flex-1 sm:flex-none"
                >
                  {isLoading ? (
                    <ButtonLoadingState>
                      {initialData ? 'Memperbarui...' : 'Menyimpan...'}
                    </ButtonLoadingState>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {initialData ? 'Perbarui Resep' : 'Simpan Resep'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RecipeForm;