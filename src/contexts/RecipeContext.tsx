// src/contexts/RecipeContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Recipe, HPPResult } from '@/types/recipe'; // Pastikan path ke tipe data Anda benar
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateUUID } from '@/utils/uuid';
import { toSafeISOString, safeParseDate } from '@/utils/dateUtils';

// --- DEPENDENCIES ---
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';

// --- INTERFACE & CONTEXT ---
interface RecipeContextType {
  recipes: Recipe[];
  hppResults: HPPResult[];
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => Promise<boolean>;
  deleteRecipe: (id: string) => Promise<boolean>;
  addHPPResult: (result: Omit<HPPResult, 'id' | 'createdAt' | 'updatedAt' | 'timestamp'>) => Promise<boolean>;
  addHPPCalculation: (result: Omit<HPPResult, 'id' | 'createdAt' | 'updatedAt' | 'timestamp'>) => Promise<void>;
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined);

// --- CONSTANTS ---
const RECIPES_STORAGE_KEY = 'hpp_app_recipes';
const HPP_RESULTS_STORAGE_KEY = 'hpp_app_hpp_results';

// --- PROVIDER COMPONENT ---
export const RecipeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- LOCAL STATE ---
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [hppResults, setHppResults] = useState<HPPResult[]>([]);
  
  // --- DEPENDENCY HOOKS ---
  const { session } = useAuth();
  const { addActivity } = useActivity();

  // --- LOAD & SAVE EFFECTS ---
  // Load & Save untuk Recipes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECIPES_STORAGE_KEY);
      if (stored) {
        setRecipes(JSON.parse(stored).map((item: any) => ({
          ...item,
          createdAt: safeParseDate(item.createdAt),
          updatedAt: safeParseDate(item.updatedAt),
        })));
      }
    } catch (error) { console.error("Gagal memuat resep dari localStorage:", error); }
  }, []);

  useEffect(() => {
    localStorage.setItem(RECIPES_STORAGE_KEY, JSON.stringify(recipes));
  }, [recipes]);

  // Load & Save untuk HPP Results
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HPP_RESULTS_STORAGE_KEY);
      if (stored) {
        setHppResults(JSON.parse(stored).map((item: any) => ({
          ...item,
          timestamp: safeParseDate(item.timestamp),
          createdAt: safeParseDate(item.createdAt),
          updatedAt: safeParseDate(item.updatedAt),
        })));
      }
    } catch (error) { console.error("Gagal memuat hasil HPP dari localStorage:", error); }
  }, []);

  useEffect(() => {
    localStorage.setItem(HPP_RESULTS_STORAGE_KEY, JSON.stringify(hppResults));
  }, [hppResults]);

  // --- RECIPE FUNCTIONS ---
  const addRecipe = async (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    if (!session) {
        toast.error("Anda harus login untuk menambah resep");
        return false;
    }
    // ... Implementasi lengkap sama seperti di AppDataContext asli ...
    // Pastikan menggunakan `session.user.id` dan memanggil `addActivity` dari hook.
    
    // Contoh singkat:
    const newRecipe = { ...recipe, id: generateUUID(), /* ... */ };
    setRecipes(prev => [...prev, newRecipe]);
    addActivity({
        title: "Resep Ditambahkan",
        description: `Resep ${recipe.namaResep} telah ditambahkan`,
        type: 'resep',
        value: null,
    });
    toast.success(`Resep ${recipe.namaResep} berhasil ditambahkan.`);
    return true;
  };
  const updateRecipe = async (id: string, recipe: Partial<Recipe>): Promise<boolean> => { /* ... Implementasi ... */ return true };
  const deleteRecipe = async (id: string): Promise<boolean> => { /* ... Implementasi ... */ return true };
  
  // --- HPP FUNCTIONS ---
  const addHPPResult = async (result: Omit<HPPResult, 'id' | 'createdAt' | 'updatedAt' | 'timestamp'>): Promise<boolean> => {
     if (!session) {
        toast.error("Anda harus login untuk menyimpan hasil HPP");
        return false;
    }
    const newResult: HPPResult = {
        ...result,
        id: generateUUID(),
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    // ... Logika insert ke Supabase ...

    setHppResults(prev => [...prev, newResult]);
    addActivity({
        title: 'HPP Dihitung',
        description: `HPP ${result.nama} = Rp ${result.hppPerPorsi.toLocaleString('id-ID')}/porsi`,
        type: 'hpp',
        value: `HPP: Rp ${result.hppPerPorsi.toLocaleString('id-ID')}`,
    });
    toast.success(`Hasil HPP untuk ${result.nama} berhasil disimpan.`);
    return true;
  };

  const addHPPCalculation = async (result: Omit<HPPResult, 'id' | 'createdAt' | 'updatedAt' | 'timestamp'>) => {
    await addHPPResult(result);
  };
  
  const value: RecipeContextType = {
    recipes,
    hppResults,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    addHPPResult,
    addHPPCalculation,
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