
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Recipe, NewRecipe } from '@/types/recipe';
import { toast } from 'sonner';

export const useRecipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecipes = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('hpp_recipes')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading recipes:', error);
        toast.error('Gagal memuat resep');
        return;
      }

      const formattedRecipes = data?.map((item: any) => {
        // Handle ingredients parsing more safely
        let ingredients = [];
        try {
          if (typeof item.ingredients === 'string') {
            ingredients = JSON.parse(item.ingredients);
          } else if (Array.isArray(item.ingredients)) {
            ingredients = item.ingredients;
          } else if (item.ingredients && typeof item.ingredients === 'object') {
            ingredients = item.ingredients;
          }
        } catch (e) {
          console.error('Error parsing ingredients for recipe:', item.id, e);
          ingredients = [];
        }

        return {
          id: item.id,
          namaResep: item.nama_resep,
          deskripsi: item.deskripsi,
          porsi: item.porsi,
          ingredients: ingredients,
          biayaTenagaKerja: parseFloat(item.biaya_tenaga_kerja) || 0,
          biayaOverhead: parseFloat(item.biaya_overhead) || 0,
          totalHPP: parseFloat(item.total_hpp) || 0,
          hppPerPorsi: parseFloat(item.hpp_per_porsi) || 0,
          marginKeuntungan: parseFloat(item.margin_keuntungan) || 0,
          hargaJualPerPorsi: parseFloat(item.harga_jual_per_porsi) || 0,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
        };
      }) || [];

      setRecipes(formattedRecipes);
    } catch (error) {
      console.error('Error in loadRecipes:', error);
      toast.error('Gagal memuat resep');
    } finally {
      setLoading(false);
    }
  };

  const addRecipe = async (recipe: NewRecipe) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk menambah resep');
        return false;
      }

      const totalBahanBaku = recipe.ingredients.reduce((sum, ing) => sum + ing.totalHarga, 0);
      const totalHPP = totalBahanBaku + recipe.biayaTenagaKerja + recipe.biayaOverhead;
      const hppPerPorsi = totalHPP / recipe.porsi;
      const hargaJualPerPorsi = hppPerPorsi * (1 + recipe.marginKeuntungan / 100);

      const { data, error } = await supabase
        .from('hpp_recipes')
        .insert({
          user_id: session.user.id,
          nama_resep: recipe.namaResep,
          deskripsi: recipe.deskripsi,
          porsi: recipe.porsi,
          ingredients: recipe.ingredients as any,
          biaya_tenaga_kerja: recipe.biayaTenagaKerja,
          biaya_overhead: recipe.biayaOverhead,
          total_hpp: totalHPP,
          hpp_per_porsi: hppPerPorsi,
          margin_keuntungan: recipe.marginKeuntungan,
          harga_jual_per_porsi: hargaJualPerPorsi,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding recipe:', error);
        toast.error('Gagal menambah resep');
        return false;
      }

      await loadRecipes();
      toast.success('Resep berhasil ditambahkan');
      return true;
    } catch (error) {
      console.error('Error in addRecipe:', error);
      toast.error('Gagal menambah resep');
      return false;
    }
  };

  const updateRecipe = async (id: string, updates: Partial<Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk mengupdate resep');
        return false;
      }

      const totalBahanBaku = updates.ingredients?.reduce((sum, ing) => sum + ing.totalHarga, 0) || 0;
      const totalHPP = totalBahanBaku + (updates.biayaTenagaKerja || 0) + (updates.biayaOverhead || 0);
      const hppPerPorsi = totalHPP / (updates.porsi || 1);
      const hargaJualPerPorsi = hppPerPorsi * (1 + (updates.marginKeuntungan || 0) / 100);

      const { error } = await supabase
        .from('hpp_recipes')
        .update({
          nama_resep: updates.namaResep,
          deskripsi: updates.deskripsi,
          porsi: updates.porsi,
          ingredients: updates.ingredients as any,
          biaya_tenaga_kerja: updates.biayaTenagaKerja,
          biaya_overhead: updates.biayaOverhead,
          total_hpp: totalHPP,
          hpp_per_porsi: hppPerPorsi,
          margin_keuntungan: updates.marginKeuntungan,
          harga_jual_per_porsi: hargaJualPerPorsi,
        })
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error updating recipe:', error);
        toast.error('Gagal mengupdate resep');
        return false;
      }

      await loadRecipes();
      toast.success('Resep berhasil diupdate');
      return true;
    } catch (error) {
      console.error('Error in updateRecipe:', error);
      toast.error('Gagal mengupdate resep');
      return false;
    }
  };

  const deleteRecipe = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Anda harus login untuk menghapus resep');
        return false;
      }

      const { error } = await supabase
        .from('hpp_recipes')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error deleting recipe:', error);
        toast.error('Gagal menghapus resep');
        return false;
      }

      setRecipes(prev => prev.filter(recipe => recipe.id !== id));
      toast.success('Resep berhasil dihapus');
      return true;
    } catch (error) {
      console.error('Error in deleteRecipe:', error);
      toast.error('Gagal menghapus resep');
      return false;
    }
  };

  useEffect(() => {
    loadRecipes();
  }, []);

  return {
    recipes,
    loading,
    loadRecipes,
    addRecipe,
    updateRecipe,
    deleteRecipe,
  };
};
