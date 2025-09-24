// src/components/recipe/hooks/useIngredientManager.ts
import { useState, useCallback } from 'react';
import { BahanResep, NewRecipe } from '../types';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatUtils';

interface NewIngredient {
  selectedBahanId: string;
  jumlah: number;
}

interface BahanBakuItem {
  id: string;
  nama: string;
  satuan: string;
  hargaSatuan: number;
}

interface UseIngredientManagerProps {
  bahanBaku: BahanBakuItem[];
  formData: NewRecipe;
  setFormData: React.Dispatch<React.SetStateAction<NewRecipe>>;
}

export const useIngredientManager = ({
  bahanBaku,
  formData,
  setFormData,
}: UseIngredientManagerProps) => {
  const [newIngredient, setNewIngredient] = useState<NewIngredient>({
    selectedBahanId: "",
    jumlah: 0,
  });

  const handleIngredientSelectionChange = useCallback((bahanId: string) => {
    const selectedBahan = bahanBaku.find(item => item.id === bahanId);
    setNewIngredient({
      selectedBahanId: bahanId,
      jumlah: 0,
    });
    
    if (selectedBahan) {
      toast.info(`${selectedBahan.nama} dipilih - ${formatCurrency(selectedBahan.hargaSatuan)}/${selectedBahan.satuan}`);
    }
  }, [bahanBaku]);

  const addIngredient = useCallback(() => {
    if (!newIngredient.selectedBahanId || newIngredient.jumlah <= 0) {
      toast.error("Pilih bahan dari warehouse dan masukkan jumlah yang valid");
      return;
    }

    const selectedBahan = bahanBaku.find(item => item.id === newIngredient.selectedBahanId);
    if (!selectedBahan) {
      toast.error("Bahan baku tidak ditemukan di warehouse");
      return;
    }

    // Check if ingredient already exists
    const existingIngredient = formData.bahanResep.find(item => item.id === selectedBahan.id);
    if (existingIngredient) {
      toast.error("Bahan sudah ditambahkan. Edit jumlahnya jika diperlukan.");
      return;
    }

    const hargaSatuan = Number(selectedBahan.hargaSatuan) || 0;
    const totalHarga = hargaSatuan * newIngredient.jumlah;

    const ingredientToAdd: BahanResep = {
      id: selectedBahan.id,
      nama: selectedBahan.nama,
      jumlah: newIngredient.jumlah,
      satuan: selectedBahan.satuan,
      harga_satuan: hargaSatuan,
      hargaSatuan,
      total_harga: totalHarga,
      totalHarga,
      warehouse_id: selectedBahan.id,
      warehouseId: selectedBahan.id,
    };

    setFormData(prev => ({
      ...prev,
      bahanResep: [...prev.bahanResep, ingredientToAdd],
    }));

    setNewIngredient({
      selectedBahanId: "",
      jumlah: 0,
    });

    toast.success(`${selectedBahan.nama} berhasil ditambahkan`);
  }, [newIngredient, bahanBaku, formData.bahanResep, setFormData]);

  const removeIngredient = useCallback((ingredientId: string) => {
    const ingredient = formData.bahanResep.find(item => item.id === ingredientId);
    
    setFormData(prev => ({
      ...prev,
      bahanResep: prev.bahanResep.filter(item => item.id !== ingredientId),
    }));

    if (ingredient) {
      toast.success(`${ingredient.nama} dihapus dari resep`);
    }
  }, [formData.bahanResep, setFormData]);

  const updateIngredientQuantity = useCallback((ingredientId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      toast.error("Jumlah harus lebih dari 0");
      return;
    }

    setFormData(prev => ({
      ...prev,
      bahanResep: prev.bahanResep.map(item => {
        if (item.id === ingredientId) {
          const currentPrice = Number(item.harga_satuan ?? item.hargaSatuan) || 0;
          const newTotal = currentPrice * newQuantity;

          return {
            ...item,
            jumlah: newQuantity,
            harga_satuan: currentPrice,
            hargaSatuan: currentPrice,
            total_harga: newTotal,
            totalHarga: newTotal
          };
        }
        return item;
      })
    }));
  }, [setFormData]);

  const refreshIngredientPrices = useCallback(() => {
    let hasChanges = false;
    const updatedIngredients = formData.bahanResep.map(ingredient => {
      const currentBahan = bahanBaku.find(b => b.id === ingredient.id);
      if (currentBahan) {
        const hargaSatuanTerbaru = Number(currentBahan.hargaSatuan) || 0;
        const hargaSatuanLama = Number(ingredient.harga_satuan ?? ingredient.hargaSatuan) || 0;

        if (hargaSatuanTerbaru !== hargaSatuanLama) {
          hasChanges = true;
          return {
            ...ingredient,
            harga_satuan: hargaSatuanTerbaru,
            hargaSatuan: hargaSatuanTerbaru,
            total_harga: ingredient.jumlah * hargaSatuanTerbaru,
            totalHarga: ingredient.jumlah * hargaSatuanTerbaru,
          };
        }
      }
      return ingredient;
    });

    if (hasChanges) {
      setFormData(prev => ({ ...prev, bahanResep: updatedIngredients }));
      toast.success("Harga bahan baku diperbarui sesuai data gudang");
    } else {
      toast.info("Semua harga sudah menggunakan data terkini");
    }
  }, [formData.bahanResep, bahanBaku, setFormData]);

  return {
    newIngredient,
    setNewIngredient,
    handleIngredientSelectionChange,
    addIngredient,
    removeIngredient,
    updateIngredientQuantity,
    refreshIngredientPrices,
  };
};