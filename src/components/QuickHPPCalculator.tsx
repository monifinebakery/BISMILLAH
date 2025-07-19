import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HPPData } from "@/types/hpp";
import { Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import RecipeForm from "./RecipeForm";
import { Recipe } from "@/types/recipe";
import { toast } from "sonner";
// --- IMPOR BARU ---
import { useRecipe } from "@/contexts/RecipeContext";

interface QuickHPPCalculatorProps {
  hppData: HPPData;
  setHppData: (data: HPPData) => void;
}

const QuickHPPCalculator = ({ hppData, setHppData }: QuickHPPCalculatorProps) => {
  // --- MENGGUNAKAN HOOK BARU ---
  const { addRecipe } = useRecipe();
  const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false);

  const handleInputChange = (field: keyof HPPData, value: string) => {
    const numValue = parseFloat(value) || 0;
    const updatedData = { ...hppData, [field]: numValue };
    
    // Hitung HPP secara otomatis
    updatedData.totalHPP = updatedData.bahanBaku + updatedData.tenagaKerja + updatedData.overheadPabrik;
    
    // Hitung harga jual berdasarkan margin
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
  };

  const handleSaveRecipe = async (recipeData: any) => {
    try {
      const totalBahanBaku = hppData.bahanBaku;
      const totalHPP = totalBahanBaku + (recipeData.biayaTenagaKerja || 0) + (recipeData.biayaOverhead || 0);
      const porsi = parseInt(recipeData.porsi) || 1;
      const hppPerPorsi = totalHPP / porsi;
      const marginKeuntungan = parseFloat(recipeData.marginKeuntungan) || 0;
      const hargaJualPerPorsi = hppPerPorsi * (1 + marginKeuntungan / 100);

      // Siapkan data resep baru tanpa id, createdAt, updatedAt
      // karena akan dibuat otomatis oleh fungsi addRecipe
      const newRecipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'> = {
        ...recipeData,
        porsi,
        marginKeuntungan,
        totalHPP,
        hppPerPorsi,
        hargaJualPerPorsi,
      };
      
      const success = await addRecipe(newRecipe);

      if (success) {
        setIsRecipeDialogOpen(false);
        toast.success(`${recipeData.namaResep} berhasil disimpan sebagai resep`);
      }
      // Jika tidak sukses, toast error akan muncul dari dalam fungsi addRecipe

    } catch (error) {
      console.error('Error saving recipe:', error);
      toast.error('Gagal menyimpan resep');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Manual Input Form */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800 text-sm sm:text-base">
          Input Biaya HPP Manual
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
        
        <Dialog open={isRecipeDialogOpen} onOpenChange={setIsRecipeDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline"
              className="flex-1 sm:flex-none bg-white hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300"
              disabled={hppData.totalHPP === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              Simpan sebagai Resep
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                Simpan Kalkulasi sebagai Resep
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
  );
};

export default QuickHPPCalculator;