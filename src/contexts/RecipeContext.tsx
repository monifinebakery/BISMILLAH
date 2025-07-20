// src/contexts/RecipeContext.tsx
// VERSI REALTIME - FULL UPDATE

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Recipe, HPPResult } from '@/types/recipe';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// --- DEPENDENCIES ---
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';
import { safeParseDate } from '@/utils/dateUtils';

// --- INTERFACE & CONTEXT ---
interface RecipeContextType {
  recipes: Recipe[];
  hppResults: HPPResult[];
  isLoading: boolean;
  addRecipe: (recipe: Omit<Recipe, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateRecipe: (id: string, recipe: Partial<Omit<Recipe, 'id' | 'userId'>>) => Promise<boolean>;
  deleteRecipe: (id: string) => Promise<boolean>;
  addHPPCalculation: (result: Omit<HPPResult, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'timestamp'>) => Promise<boolean>;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---
export const RecipeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- STATE ---
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [hppResults, setHppResults] = useState<HPPResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- DEPENDENCIES ---
  const { user } = useAuth();
  const { addActivity } = useActivity();

  // --- HELPER FUNCTIONS ---
  const transformRecipeFromDB = (dbItem: any): Recipe => ({
    id: dbItem.id,
    namaResep: dbItem.nama_resep,
    porsi: Number(dbItem.porsi) || 1,
    bahan: dbItem.bahan || [],
    totalBiaya: Number(dbItem.total_biaya) || 0,
    hppPerPorsi: Number(dbItem.hpp_per_porsi) || 0,
    userId: dbItem.user_id,
    createdAt: safeParseDate(dbItem.created_at),
    updatedAt: safeParseDate(dbItem.updated_at),
  });

  const transformHppResultFromDB = (dbItem: any): HPPResult => ({
    id: dbItem.id,
    nama: dbItem.nama,
    hppPerPorsi: Number(dbItem.hpp_per_porsi) || 0,
    timestamp: safeParseDate(dbItem.timestamp),
    userId: dbItem.user_id,
    createdAt: safeParseDate(dbItem.created_at),
    updatedAt: safeParseDate(dbItem.updated_at),
  });

  // --- EFEK UTAMA: FETCH & REALTIME UNTUK DUA TABEL ---
  useEffect(() => {
    if (!user) {
      setRecipes([]);
      setHppResults([]);
      setIsLoading(false);
      return;
    }

    // Mengambil data awal untuk kedua tabel secara bersamaan
    const fetchInitialData = async () => {
      setIsLoading(true);
      const [recipesRes, hppResultsRes] = await Promise.all([
        supabase.from('hpp_recipes').select('*').eq('user_id', user.id),
        supabase.from('hpp_results').select('*').eq('user_id', user.id).order('timestamp', { ascending: false }).limit(50)
      ]);

      if (recipesRes.error) toast.error(`Gagal memuat resep: ${recipesRes.error.message}`);
      else setRecipes(recipesRes.data.map(transformRecipeFromDB));
      
      if (hppResultsRes.error) toast.error(`Gagal memuat hasil HPP: ${hppResultsRes.error.message}`);
      else setHppResults(hppResultsRes.data.map(transformHppResultFromDB));

      setIsLoading(false);
    };

    fetchInitialData();

    // Setup listener untuk tabel 'hpp_recipes'
    const recipesChannel = supabase.channel(`realtime-recipes-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hpp_recipes', filter: `user_id=eq.${user.id}` }, 
        (payload) => {
          const transform = transformRecipeFromDB;
          if (payload.eventType === 'INSERT') setRecipes(current => [transform(payload.new), ...current]);
          if (payload.eventType === 'UPDATE') setRecipes(current => current.map(r => r.id === payload.new.id ? transform(payload.new) : r));
          if (payload.eventType === 'DELETE') setRecipes(current => current.filter(r => r.id !== payload.old.id));
        }
      ).subscribe();

    // Setup listener untuk tabel 'hpp_results' (hanya perlu INSERT)
    const hppResultsChannel = supabase.channel(`realtime-hpp-results-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'hpp_results', filter: `user_id=eq.${user.id}` }, 
        (payload) => {
          setHppResults(current => [transformHppResultFromDB(payload.new), ...current].slice(0, 50));
        }
      ).subscribe();

    // Cleanup untuk KEDUA channel
    return () => {
      supabase.removeChannel(recipesChannel);
      supabase.removeChannel(hppResultsChannel);
    };
  }, [user]);

  // --- RECIPE FUNCTIONS ---
  const addRecipe = async (recipe: Omit<Recipe, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!user) { toast.error("Anda harus login untuk menambah resep"); return false; }

    const recipeToInsert = {
      user_id: user.id,
      nama_resep: recipe.namaResep,
      porsi: recipe.porsi,
      bahan: recipe.bahan,
      total_biaya: recipe.totalBiaya,
      hpp_per_porsi: recipe.hppPerPorsi,
    };
    
    const { error } = await supabase.from('hpp_recipes').insert(recipeToInsert);
    if (error) { toast.error(`Gagal menambah resep: ${error.message}`); return false; }

    addActivity({ title: "Resep Ditambahkan", description: `Resep ${recipe.namaResep} telah ditambahkan`, type: 'resep', value: null });
    toast.success(`Resep ${recipe.namaResep} berhasil ditambahkan.`);
    return true;
  };

  const updateRecipe = async (id: string, recipe: Partial<Omit<Recipe, 'id' | 'userId'>>): Promise<boolean> => {
    if (!user) { toast.error("Anda harus login untuk memperbarui resep"); return false; }

    const recipeToUpdate: { [key: string]: any } = {};
    if (recipe.namaResep !== undefined) recipeToUpdate.nama_resep = recipe.namaResep;
    if (recipe.porsi !== undefined) recipeToUpdate.porsi = recipe.porsi;
    if (recipe.bahan !== undefined) recipeToUpdate.bahan = recipe.bahan;
    if (recipe.totalBiaya !== undefined) recipeToUpdate.total_biaya = recipe.totalBiaya;
    if (recipe.hppPerPorsi !== undefined) recipeToUpdate.hpp_per_porsi = recipe.hppPerPorsi;
    
    const { error } = await supabase.from('hpp_recipes').update(recipeToUpdate).eq('id', id);
    if (error) { toast.error(`Gagal memperbarui resep: ${error.message}`); return false; }
    
    toast.success(`Resep berhasil diperbarui.`);
    return true;
  };
  
  const deleteRecipe = async (id: string): Promise<boolean> => {
    if (!user) { toast.error("Anda harus login untuk menghapus resep"); return false; }
    
    const recipeToDelete = recipes.find(r => r.id === id);
    
    const { error } = await supabase.from('hpp_recipes').delete().eq('id', id);
    if (error) { toast.error(`Gagal menghapus resep: ${error.message}`); return false; }

    if (recipeToDelete) {
      addActivity({ title: 'Resep Dihapus', description: `Resep ${recipeToDelete.namaResep} telah dihapus.`, type: 'resep', value: null });
    }
    toast.success(`Resep berhasil dihapus.`);
    return true;
  };
  
  // --- HPP FUNCTIONS ---
  const addHPPCalculation = async (result: Omit<HPPResult, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'timestamp'>): Promise<boolean> => {
     if (!user) { toast.error("Anda harus login untuk menyimpan hasil HPP"); return false; }
     
     const resultToInsert = {
        user_id: user.id,
        nama: result.nama,
        hpp_per_porsi: result.hppPerPorsi,
        timestamp: new Date(),
     };
     
     const { error } = await supabase.from('hpp_results').insert(resultToInsert);
     if (error) { toast.error(`Gagal menyimpan hasil HPP: ${error.message}`); return false; }

     addActivity({ title: 'HPP Dihitung', description: `HPP ${result.nama} = Rp ${result.hppPerPorsi.toLocaleString('id-ID')}/porsi`, type: 'hpp', value: null });
     toast.success(`Hasil HPP untuk ${result.nama} berhasil disimpan.`);
     return true;
  };

  const value: RecipeContextType = {
    recipes, hppResults, isLoading, addRecipe, updateRecipe, deleteRecipe, addHPPCalculation,
  };

  return <RecipeContext.Provider value={value}>{children}</RecipeContext.Provider>;
};

// --- CUSTOM HOOK ---
export const useRecipe = () => {
  const context = useContext(RecipeContext);
  if (context === undefined) {
    throw new Error('useRecipe must be used within a RecipeProvider');
  }
  return context;
};