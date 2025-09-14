// src/components/recipe/services/recipeTransformers.ts
// Helpers to convert between camelCase (legacy UI) and snake_case (new standard)

import type { Recipe as RecipeCamel, NewRecipe as NewRecipeCamel, BahanResep } from '@/components/recipe/types';

type AnyRecord = Record<string, any>;

const camel_to_snake_key = (key: string) =>
  key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

const snake_to_camel_key = (key: string) =>
  key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

export type RecipeSnake = {
  id: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
  nama_resep: string;
  jumlah_porsi: number;
  kategori_resep?: string;
  deskripsi?: string;
  foto_url?: string;
  foto_base64?: string;
  bahan_resep: BahanResep[];
  biaya_tenaga_kerja: number;
  biaya_overhead: number;
  margin_keuntungan_persen: number;
  total_hpp: number;
  hpp_per_porsi: number;
  harga_jual_porsi: number;
  jumlah_pcs_per_porsi: number;
  hpp_per_pcs: number;
  harga_jual_per_pcs: number;
};

export type NewRecipeSnake = Omit<RecipeSnake, 'id' | 'created_at' | 'updated_at'>;

const explicit_camel_to_snake: Record<string, string> = {
  userId: 'user_id',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  namaResep: 'nama_resep',
  jumlahPorsi: 'jumlah_porsi',
  kategoriResep: 'kategori_resep',
  fotoUrl: 'foto_url',
  fotoBase64: 'foto_base64',
  bahanResep: 'bahan_resep',
  biayaTenagaKerja: 'biaya_tenaga_kerja',
  biayaOverhead: 'biaya_overhead',
  marginKeuntunganPersen: 'margin_keuntungan_persen',
  totalHpp: 'total_hpp',
  hppPerPorsi: 'hpp_per_porsi',
  hargaJualPorsi: 'harga_jual_porsi',
  jumlahPcsPerPorsi: 'jumlah_pcs_per_porsi',
  hppPerPcs: 'hpp_per_pcs',
  hargaJualPerPcs: 'harga_jual_per_pcs',
};

const explicit_snake_to_camel: Record<string, string> = Object.fromEntries(
  Object.entries(explicit_camel_to_snake).map(([c, s]) => [s, c])
);

export const to_snake_recipe = (recipe: AnyRecord): RecipeSnake => {
  const mapped: AnyRecord = {};
  Object.entries(recipe || {}).forEach(([k, v]) => {
    const key = explicit_camel_to_snake[k] || camel_to_snake_key(k);
    mapped[key] = v;
  });
  return mapped as RecipeSnake;
};

export const from_snake_recipe = (recipe: AnyRecord): RecipeCamel => {
  const mapped: AnyRecord = {};
  Object.entries(recipe || {}).forEach(([k, v]) => {
    const key = explicit_snake_to_camel[k] || snake_to_camel_key(k);
    mapped[key] = v;
  });
  return mapped as RecipeCamel;
};

export const to_snake_new_recipe = (recipe: AnyRecord): NewRecipeSnake => {
  return to_snake_recipe(recipe) as NewRecipeSnake;
};

export const from_snake_new_recipe = (recipe: AnyRecord): NewRecipeCamel => {
  return from_snake_recipe(recipe) as NewRecipeCamel;
};

export default {
  to_snake_recipe,
  from_snake_recipe,
  to_snake_new_recipe,
  from_snake_new_recipe,
};

