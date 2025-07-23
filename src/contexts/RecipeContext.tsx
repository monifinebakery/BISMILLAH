// src/contexts/RecipeContext.tsx
// 🔔 UPDATED WITH NOTIFICATION SYSTEM

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Recipe, NewRecipe } from '@/types/recipe';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
// 🔔 ADD NOTIFICATION IMPORTS
import { useNotification } from './NotificationContext';
import { createNotificationHelper } from '@/utils/notificationHelpers';
import { safeParseDate } from '@/utils/dateUtils';

interface RecipeContextType {
  recipes: Recipe[];
  isLoading: boolean;
  addRecipe: (recipe: NewRecipe) => Promise<boolean>;
  updateRecipe: (id: string, recipe: Partial<NewRecipe>) => Promise<boolean>;
  deleteRecipe: (id: string) => Promise<boolean>;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

export const RecipeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { addActivity } = useActivity();
  // 🔔 ADD NOTIFICATION CONTEXT
  const { addNotification } = useNotification();

  // Mengubah data dari format database (snake_case) ke format aplikasi (camelCase)
  const transformFromDB = (dbItem: any): Recipe => ({
    id: dbItem.id,
    userId: dbItem.user_id,
    createdAt: safeParseDate(dbItem.created_at),
    namaResep: dbItem.nama_resep,
    jumlahPorsi: Number(dbItem.jumlah_porsi),
    kategoriResep: dbItem.kategori_resep,
    deskripsi: dbItem.deskripsi,
    fotoUrl: dbItem.foto_url,
    bahanResep: dbItem.bahan_resep || [],
    biayaTenagaKerja: Number(dbItem.biaya_tenaga_kerja),
    biayaOverhead: Number(dbItem.biaya_overhead),
    marginKeuntunganPersen: Number(dbItem.margin_keuntungan_persen),
    totalHpp: Number(dbItem.total_hpp),
    hppPerPorsi: Number(dbItem.hpp_per_porsi),
    hargaJualPorsi: Number(dbItem.harga_jual_porsi),
  });
  
  // Mengubah data dari format aplikasi (camelCase) ke format database (snake_case)
  const transformToDB = (recipe: Partial<NewRecipe>) => ({
    nama_resep: recipe.namaResep,
    jumlah_porsi: recipe.jumlahPorsi,
    kategori_resep: recipe.kategoriResep,
    deskripsi: recipe.deskripsi,
    foto_url: recipe.fotoUrl,
    bahan_resep: recipe.bahanResep,
    biaya_tenaga_kerja: recipe.biayaTenagaKerja,
    biaya_overhead: recipe.biayaOverhead,
    margin_keuntungan_persen: recipe.marginKeuntunganPersen,
    total_hpp: recipe.totalHpp,
    hpp_per_porsi: recipe.hppPerPorsi,
    harga_jual_porsi: recipe.hargaJualPorsi,
  });

  useEffect(() => {
    if (!user) {
      setRecipes([]);
      setIsLoading(false);
      return;
    }

    const fetchRecipes = async () => {
      setIsLoading(true);
      
      try {
        console.log('[RecipeContext] Fetching recipes for user:', user.id);
        const { data, error } = await supabase
          .from('recipes')
          .select('*')
          .eq('user_id', user.id)
          .order('nama_resep', { ascending: true });

        if (error) {
          console.error('[RecipeContext] Error fetching recipes:', error);
          toast.error(`Gagal memuat resep: ${error.message}`);
          
          // 🔔 CREATE ERROR NOTIFICATION
          await addNotification(createNotificationHelper.systemError(
            `Gagal memuat data resep: ${error.message}`
          ));
        } else {
          setRecipes(data.map(transformFromDB));
          console.log(`[RecipeContext] Loaded ${data.length} recipes`);
        }
      } catch (error) {
        console.error('[RecipeContext] Unexpected error:', error);
        await addNotification(createNotificationHelper.systemError(
          `Error tidak terduga saat memuat resep: ${error instanceof Error ? error.message : 'Unknown error'}`
        ));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecipes();
    
    const channel = supabase.channel(`realtime-recipes-${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'recipes', 
        filter: `user_id=eq.${user.id}` 
      }, (payload) => {
        console.log('[RecipeContext] Real-time event received:', payload);
        
        if (payload.eventType === 'INSERT') {
          setRecipes(current => [transformFromDB(payload.new), ...current].sort((a,b) => a.namaResep.localeCompare(b.namaResep)));
        }
        if (payload.eventType === 'UPDATE') {
          setRecipes(current => current.map(r => r.id === payload.new.id ? transformFromDB(payload.new) : r));
        }
        if (payload.eventType === 'DELETE') {
          setRecipes(current => current.filter(r => r.id !== payload.old.id));
        }
      })
      .subscribe();
      
    return () => {
      console.log('[RecipeContext] Cleaning up real-time channel');
      supabase.removeChannel(channel);
    };
  }, [user, addNotification]); // 🔔 ADD addNotification dependency

  const addRecipe = async (recipe: NewRecipe): Promise<boolean> => {
    if (!user) { 
      toast.error('Anda harus login untuk menambahkan resep.');
      return false;
    }
    
    try {
      console.log('[RecipeContext] Adding recipe:', recipe);
      const { error } = await supabase
        .from('recipes')
        .insert({ ...transformToDB(recipe), user_id: user.id });

      if (error) {
        console.error('[RecipeContext] Error adding recipe:', error);
        throw new Error(error.message);
      }

      // Activity log
      addActivity({ 
        title: 'Resep Baru Dibuat', 
        description: `Resep "${recipe.namaResep}" telah ditambahkan.`,
        type: 'resep',
        value: null
      });

      // Success toast
      toast.success('Resep baru berhasil ditambahkan!');

      // 🔔 CREATE SUCCESS NOTIFICATION
      await addNotification({
        title: '👨‍🍳 Resep Baru Dibuat!',
        message: `Resep "${recipe.namaResep}" berhasil ditambahkan dengan HPP Rp ${recipe.hppPerPorsi?.toLocaleString()}/porsi`,
        type: 'success',
        icon: 'chef-hat',
        priority: 2,
        related_type: 'system',
        action_url: '/resep',
        is_read: false,
        is_archived: false
      });

      return true;
    } catch (error) {
      console.error('[RecipeContext] Error in addRecipe:', error);
      toast.error(`Gagal menambah resep: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // 🔔 CREATE ERROR NOTIFICATION
      await addNotification(createNotificationHelper.systemError(
        `Gagal menambahkan resep "${recipe.namaResep}": ${error instanceof Error ? error.message : 'Unknown error'}`
      ));
      
      return false;
    }
  };

  const updateRecipe = async (id: string, recipe: Partial<NewRecipe>): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk memperbarui resep.');
      return false;
    }
    
    try {
      console.log('[RecipeContext] Updating recipe:', id, recipe);
      const { error } = await supabase
        .from('recipes')
        .update(transformToDB(recipe))
        .eq('id', id);

      if (error) {
        console.error('[RecipeContext] Error updating recipe:', error);
        throw new Error(error.message);
      }
      
      // Activity log
      addActivity({ 
        title: 'Resep Diperbarui', 
        description: `Resep "${recipe.namaResep || '...'}" telah diperbarui.`,
        type: 'resep',
        value: null
      });

      // Success toast
      toast.success('Resep berhasil diperbarui!');

      // 🔔 CREATE UPDATE NOTIFICATION
      await addNotification({
        title: '📝 Resep Diperbarui',
        message: `Resep "${recipe.namaResep || 'resep'}" telah diperbarui`,
        type: 'info',
        icon: 'edit',
        priority: 1,
        related_type: 'system',
        action_url: '/resep',
        is_read: false,
        is_archived: false
      });

      return true;
    } catch (error) {
      console.error('[RecipeContext] Error in updateRecipe:', error);
      toast.error(`Gagal memperbarui resep: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // 🔔 CREATE ERROR NOTIFICATION
      await addNotification(createNotificationHelper.systemError(
        `Gagal memperbarui resep: ${error instanceof Error ? error.message : 'Unknown error'}`
      ));
      
      return false;
    }
  };

  const deleteRecipe = async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menghapus resep.');
      return false;
    }
    
    try {
      const recipeToDelete = recipes.find(r => r.id === id);
      if (!recipeToDelete) {
        toast.error('Resep tidak ditemukan');
        return false;
      }

      console.log('[RecipeContext] Deleting recipe:', id);
      const { error } = await supabase.from('recipes').delete().eq('id', id);

      if (error) {
        console.error('[RecipeContext] Error deleting recipe:', error);
        throw new Error(error.message);
      }
      
      // Activity log
      addActivity({ 
        title: 'Resep Dihapus', 
        description: `Resep "${recipeToDelete.namaResep}" telah dihapus.`,
        type: 'resep',
        value: null
      });

      // Success toast
      toast.success('Resep berhasil dihapus.');

      // 🔔 CREATE DELETE NOTIFICATION
      await addNotification({
        title: '🗑️ Resep Dihapus',
        message: `Resep "${recipeToDelete.namaResep}" telah dihapus dari koleksi`,
        type: 'warning',
        icon: 'trash-2',
        priority: 2,
        related_type: 'system',
        action_url: '/resep',
        is_read: false,
        is_archived: false
      });

      return true;
    } catch (error) {
      console.error('[RecipeContext] Error in deleteRecipe:', error);
      toast.error(`Gagal menghapus resep: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // 🔔 CREATE ERROR NOTIFICATION
      await addNotification(createNotificationHelper.systemError(
        `Gagal menghapus resep: ${error instanceof Error ? error.message : 'Unknown error'}`
      ));
      
      return false;
    }
  };

  return (
    <RecipeContext.Provider value={{ recipes, isLoading, addRecipe, updateRecipe, deleteRecipe }}>
      {children}
    </RecipeContext.Provider>
  );
};

export const useRecipe = () => {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error('useRecipe must be used within a RecipeProvider');
  }
  return context;
};