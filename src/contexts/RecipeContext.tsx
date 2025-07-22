import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Recipe, NewRecipe } from '@/types/recipe';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
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
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('nama_resep', { ascending: true });

      if (error) {
        toast.error(`Gagal memuat resep: ${error.message}`);
      } else {
        setRecipes(data.map(transformFromDB));
      }
      setIsLoading(false);
    };
    
    fetchRecipes();
    
    const channel = supabase.channel(`realtime-recipes-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recipes', filter: `user_id=eq.${user.id}` }, 
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRecipes(current => [transformFromDB(payload.new), ...current].sort((a,b) => a.namaResep.localeCompare(b.namaResep)));
          }
          if (payload.eventType === 'UPDATE') {
            setRecipes(current => current.map(r => r.id === payload.new.id ? transformFromDB(payload.new) : r));
          }
          if (payload.eventType === 'DELETE') {
            setRecipes(current => current.filter(r => r.id !== payload.old.id));
          }
        }
      ).subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const addRecipe = async (recipe: NewRecipe): Promise<boolean> => {
    if (!user) { 
      toast.error('Anda harus login untuk menambahkan resep.');
      return false;
    }
    
    const { error } = await supabase.from('recipes').insert({ ...transformToDB(recipe), user_id: user.id });

    if (error) {
      toast.error(`Gagal menambah resep: ${error.message}`);
      return false;
    }

    addActivity({ title: 'Resep Baru Dibuat', description: `Resep "${recipe.namaResep}" telah ditambahkan.` });
    toast.success('Resep baru berhasil ditambahkan!');
    return true;
  };

  const updateRecipe = async (id: string, recipe: Partial<NewRecipe>): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk memperbarui resep.');
      return false;
    }
    
    const { error } = await supabase.from('recipes').update(transformToDB(recipe)).eq('id', id);

    if (error) {
      toast.error(`Gagal memperbarui resep: ${error.message}`);
      return false;
    }
    
    addActivity({ title: 'Resep Diperbarui', description: `Resep "${recipe.namaResep || '...'}" telah diperbarui.` });
    toast.success('Resep berhasil diperbarui!');
    return true;
  };

  const deleteRecipe = async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menghapus resep.');
      return false;
    }
    
    const recipeToDelete = recipes.find(r => r.id === id);
    const { error } = await supabase.from('recipes').delete().eq('id', id);

    if (error) {
      toast.error(`Gagal menghapus resep: ${error.message}`);
      return false;
    }
    
    if (recipeToDelete) {
      addActivity({ title: 'Resep Dihapus', description: `Resep "${recipeToDelete.namaResep}" telah dihapus.` });
    }
    toast.success('Resep berhasil dihapus.');
    return true;
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