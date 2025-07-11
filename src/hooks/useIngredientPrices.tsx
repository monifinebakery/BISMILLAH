
import { useAppData } from '@/contexts/AppDataContext';
import { RecipeIngredient } from '@/types/recipe';
import { toast } from '@/hooks/use-toast';

export const useIngredientPrices = () => {
  const { getBahanBakuByName, reduceStok } = useAppData();

  const getIngredientPrice = (nama: string): number => {
    const bahanBaku = getBahanBakuByName(nama);
    return bahanBaku?.hargaSatuan || 0;
  };

  const validateIngredientAvailability = (ingredients: RecipeIngredient[]): boolean => {
    for (const ingredient of ingredients) {
      const bahanBaku = getBahanBakuByName(ingredient.nama);
      
      if (!bahanBaku) {
        toast({
          title: "Bahan Tidak Tersedia",
          description: `${ingredient.nama} tidak ditemukan di gudang`,
          variant: "destructive",
        });
        return false;
      }

      if (bahanBaku.stok < ingredient.jumlah) {
        toast({
          title: "Stok Tidak Cukup",
          description: `${ingredient.nama} tersisa ${bahanBaku.stok} ${bahanBaku.satuan}, dibutuhkan ${ingredient.jumlah} ${ingredient.satuan}`,
          variant: "destructive",
        });
        return false;
      }
    }
    
    return true;
  };

  const consumeIngredients = (ingredients: RecipeIngredient[]): boolean => {
    if (!validateIngredientAvailability(ingredients)) {
      return false;
    }

    for (const ingredient of ingredients) {
      if (!reduceStok(ingredient.nama, ingredient.jumlah)) {
        return false;
      }
    }

    return true;
  };

  const updateIngredientPrices = (ingredients: RecipeIngredient[]): RecipeIngredient[] => {
    return ingredients.map(ingredient => {
      const currentPrice = getIngredientPrice(ingredient.nama);
      if (currentPrice > 0 && currentPrice !== ingredient.hargaPerSatuan) {
        return {
          ...ingredient,
          hargaPerSatuan: currentPrice,
          totalHarga: ingredient.jumlah * currentPrice,
        };
      }
      return ingredient;
    });
  };

  return {
    getIngredientPrice,
    validateIngredientAvailability,
    consumeIngredients,
    updateIngredientPrices,
  };
};
