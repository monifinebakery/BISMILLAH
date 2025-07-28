import { RecipeIngredient } from '@/types/recipe';
import { useToast } from '@/components/ui/use-toast'; // Menggunakan useToast dari shadcn
// --- PERUBAHAN ---
import { useBahanBaku } from '@/components/warehouse/context/WarehouseContext';

export const useIngredientPrices = () => {
  // --- MENGGUNAKAN HOOK BARU ---
  const { getBahanBakuByName, reduceStok } = useBahanBaku();
  const { toast } = useToast();

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
          description: `${ingredient.nama} tidak ditemukan di gudang.`,
          variant: "destructive",
        });
        return false;
      }

      if (bahanBaku.stok < ingredient.jumlah) {
        toast({
          title: "Stok Tidak Cukup",
          description: `Stok ${ingredient.nama} hanya ${bahanBaku.stok} ${bahanBaku.satuan}. Dibutuhkan ${ingredient.jumlah}.`,
          variant: "destructive",
        });
        return false;
      }
    }
    
    return true;
  };

  const consumeIngredients = async (ingredients: RecipeIngredient[]): Promise<boolean> => {
    if (!validateIngredientAvailability(ingredients)) {
      return false;
    }

    // Menggunakan Promise.all agar jika satu gagal, proses berhenti
    try {
      await Promise.all(
        ingredients.map(ingredient => {
          const success = reduceStok(ingredient.nama, ingredient.jumlah);
          if (!success) {
            throw new Error(`Gagal mengurangi stok untuk ${ingredient.nama}`);
          }
          return success;
        })
      );
    } catch (error: any) {
      console.error(error.message);
      // Toast error sudah di-handle di dalam `reduceStok`
      return false;
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