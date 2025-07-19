
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HPPData } from "@/types/hpp";
import { Recipe } from "@/types/recipe";
import { useState } from "react";
import { ChefHat, Save, Calculator } from "lucide-react";
import RecipeForm from "./RecipeForm";
import QuickHPPCalculator from "./QuickHPPCalculator";
import { useIngredientPrices } from "@/hooks/useIngredientPrices";
import { toast } from "sonner";

interface HPPCalculatorProps {
  hppData: HPPData;
  setHppData: (data: HPPData) => void;
  isQuickMode?: boolean;
}

const HPPCalculator = ({ hppData, setHppData, isQuickMode = false }: HPPCalculatorProps) => {
  const { recipes, addRecipe, addHPPCalculation, addActivity } = useAppData();
  const { consumeIngredients } = useIngredientPrices();
  const [selectedRecipe, setSelectedRecipe] = useState<string>("");
  const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false);

  // If in quick mode, use the simplified calculator
  if (isQuickMode) {
    return <QuickHPPCalculator hppData={hppData} setHppData={setHppData} />;
  }

  const handleInputChange = (field: keyof HPPData, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updatedData = { ...hppData, [field]: numValue };
    
    updatedData.totalHPP = updatedData.bahanBaku + updatedData.tenagaKerja + updatedData.overheadPabrik;
    
    if (updatedData.marginKeuntungan > 0) {
      updatedData.hargaJual = updatedData.totalHPP * (1 + updatedData.marginKeuntungan / 100);
    } else {
      updatedData.hargaJual = updatedData.totalHPP;
    }
    
    setHppData(updatedData);
  };

  const resetForm = () => {
    setHppData({
      bahanBaku: 0,
      tenagaKerja: 0,
      overheadPabrik: 0,
      totalHPP: 0,
      marginKeuntungan: 0,
      hargaJual: 0,
    });
    setSelectedRecipe("");
  };

  const loadRecipe = (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe) {
      const totalBahanBaku = recipe.ingredients.reduce((sum, ing) => sum + (ing.totalHarga || 0), 0);
      const updatedData: HPPData = {
        bahanBaku: totalBahanBaku,
        tenagaKerja: recipe.biayaTenagaKerja,
        overheadPabrik: recipe.biayaOverhead,
        totalHPP: recipe.totalHPP,
        marginKeuntungan: recipe.marginKeuntungan,
        hargaJual: recipe.hargaJualPerPorsi,
      };
      setHppData(updatedData);
      setSelectedRecipe(recipeId);
      
      toast.success(`Data resep ${recipe.namaResep} berhasil dimuat`);
    }
  };

  const produceRecipe = () => {
    const recipe = recipes.find(r => r.id === selectedRecipe);
    if (recipe) {
      if (consumeIngredients(recipe.ingredients)) {
        toast.success(`${recipe.namaResep} berhasil diproduksi. Stok bahan baku telah dikurangi.`);
        
        addActivity({
          title: 'Produksi selesai',
          description: `${recipe.namaResep} (${recipe.porsi} porsi) berhasil diproduksi`,
          type: 'hpp',
          value: `HPP: ${formatCurrency(recipe.totalHPP)}`
        });
      }
    }
  };

  const saveAsRecipe = () => {
    setIsRecipeDialogOpen(true);
  };

  const handleSaveRecipe = (recipeData: any) => {
    const totalBahanBaku = recipeData.ingredients.reduce((sum: number, ing: any) => sum + (ing.totalHarga || 0), 0);
    const totalHPP = totalBahanBaku + (recipeData.biayaTenagaKerja || 0) + (recipeData.biayaOverhead || 0);
    const porsi = parseInt(recipeData.porsi) || 1;
    const hppPerPorsi = totalHPP / porsi;
    const marginKeuntungan = parseFloat(recipeData.marginKeuntungan) || 0;
    const hargaJualPerPorsi = hppPerPorsi * (1 + marginKeuntungan / 100);

    const newRecipe: Recipe = {
      id: Date.now().toString(),
      ...recipeData,
      totalHPP,
      hppPerPorsi,
      hargaJualPerPorsi,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    addRecipe(newRecipe);
    setIsRecipeDialogOpen(false);
    
    toast.success(`${recipeData.namaResep} berhasil disimpan`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Recipe Selection */}
      <div className="space-y-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 flex items-center">
            <ChefHat className="h-4 w-4 mr-2" />
            Pilih Resep atau Input Manual
          </h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="recipeSelect" className="text-sm font-medium">
              Resep Tersimpan
            </Label>
            <Select value={selectedRecipe} onValueChange={loadRecipe}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Pilih resep..." />
              </SelectTrigger>
              <SelectContent>
                {recipes.map((recipe) => (
                  <SelectItem key={recipe.id} value={recipe.id}>
                    {recipe.namaResep} ({recipe.porsi} porsi)
                  </SelectItem>
                ))}
                {recipes.length === 0 && (
                  <SelectItem value="no-recipes" disabled>
                    Belum ada resep tersimpan
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end gap-2">
            <Dialog open={isRecipeDialogOpen} onOpenChange={setIsRecipeDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={saveAsRecipe}
                  variant="outline"
                  className="flex-1 bg-white hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300"
                  disabled={hppData.totalHPP === 0}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Resep
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">
                    Simpan HPP sebagai Resep
                  </DialogTitle>
                </DialogHeader>
                <RecipeForm
                  onSave={handleSaveRecipe}
                  onCancel={() => setIsRecipeDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {selectedRecipe && (
          <Button 
            onClick={produceRecipe}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Calculator className="h-4 w-4 mr-2" />
            Produksi & Kurangi Stok
          </Button>
        )}
      </div>

      {/* Manual Input Form */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800 text-sm sm:text-base">
          Input Manual HPP
        </h3>
        
        <div>
          <Label htmlFor="bahanBaku" className="text-sm font-medium">
            Biaya Bahan Baku (Rp)
          </Label>
          <Input
            id="bahanBaku"
            type="number"
            placeholder="0"
            value={hppData.bahanBaku || ''}
            onChange={(e) => handleInputChange('bahanBaku', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="tenagaKerja" className="text-sm font-medium">
            Biaya Tenaga Kerja (Rp)
          </Label>
          <Input
            id="tenagaKerja"
            type="number"
            placeholder="0"
            value={hppData.tenagaKerja || ''}
            onChange={(e) => handleInputChange('tenagaKerja', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="overheadPabrik" className="text-sm font-medium">
            Biaya Overhead (Rp)
          </Label>
          <Input
            id="overheadPabrik"
            type="number"
            placeholder="0"
            value={hppData.overheadPabrik || ''}
            onChange={(e) => handleInputChange('overheadPabrik', e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="marginKeuntungan" className="text-sm font-medium">
            Margin Keuntungan (%)
          </Label>
          <Input
            id="marginKeuntungan"
            type="number"
            placeholder="0"
            value={hppData.marginKeuntungan || ''}
            onChange={(e) => handleInputChange('marginKeuntungan', e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button 
          onClick={resetForm}
          variant="outline"
          className="flex-1 sm:flex-none"
        >
          Reset
        </Button>
      </div>
    </div>
  );
};

export default HPPCalculator;
