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

    const ingredientToAdd: BahanResep = {
      id: selectedBahan.id,
      nama: selectedBahan.nama,
      jumlah: newIngredient.jumlah,
      satuan: selectedBahan.satuan,
      hargaSatuan: selectedBahan.hargaSatuan,
      totalHarga: selectedBahan.hargaSatuan * newIngredient.jumlah,
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
          return {
            ...item,
            jumlah: newQuantity,
            totalHarga: item.hargaSatuan * newQuantity
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
      if (currentBahan && currentBahan.hargaSatuan !== ingredient.hargaSatuan) {
        hasChanges = true;
        return {
          ...ingredient,
          hargaSatuan: currentBahan.hargaSatuan,
          totalHarga: ingredient.jumlah * currentBahan.hargaSatuan,
        };
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