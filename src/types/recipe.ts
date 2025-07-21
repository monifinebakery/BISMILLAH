// src/types/recipe.ts

// Interface untuk setiap bahan di dalam resep
export interface RecipeIngredient {
  id: string; // ID unik dari bahan baku (bahan_baku.id)
  namaBahan: string;
  jumlah: number;
  satuan: string;
  hargaSatuan: number;
  totalHarga: number;
}

// Interface untuk objek resep secara keseluruhan
export interface Recipe {
  id: string;
  userId: string; // ✅ PENTING: Ditambahkan untuk relasi ke pengguna
  createdAt: Date;
  
  namaResep: string;
  jumlahPorsi: number;
  kategoriResep: string;
  deskripsi?: string | null;

  bahanResep: RecipeIngredient[];
  
  biayaTenagaKerja: number;
  biayaOverhead: number;
  marginKeuntunganPersen: number; // Lebih deskriptif

  // Hasil kalkulasi
  totalHpp: number;
  hppPerPorsi: number;
  hargaJualPorsi: number;
}

// Tipe untuk resep baru (lebih ringkas menggunakan Omit)
export type NewRecipe = Omit<Recipe, 'id' | 'userId' | 'createdAt'>;