// src/types/recipe.ts
// 🧮 UPDATED WITH HPP PER PCS CALCULATION SUPPORT

// Interface untuk setiap bahan di dalam resep
export interface RecipeIngredient {
  id?: string; // ID unik dari bahan baku (bahan_baku.id) - optional untuk new ingredients
  nama: string; // Nama bahan (dari bahan_baku.nama atau manual input)
  jumlah: number; // Jumlah yang digunakan dalam resep
  satuan: string; // Satuan (dari bahan_baku.satuan atau manual input)
  hargaSatuan: number; // Harga per satuan (dari bahan_baku.harga_satuan atau manual input)
  totalHarga: number; // Kalkulasi: jumlah × hargaSatuan
  // 🧮 NEW: Additional fields for better tracking
  isFromInventory?: boolean; // Apakah bahan ini dari inventory atau manual input
  inventoryId?: string; // ID dari bahan_baku table jika ada
  catatan?: string; // Catatan khusus untuk bahan ini
}

// Interface untuk objek resep secara keseluruhan
export interface Recipe {
  id: string;
  userId: string; // ✅ PENTING: Relasi ke pengguna
  createdAt: Date;
  updatedAt?: Date; // 🧮 NEW: Track update time
  
  // Basic Info
  namaResep: string;
  jumlahPorsi: number;
  kategoriResep?: string | null;
  deskripsi?: string | null;
  fotoUrl?: string | null; // 🧮 NEW: Recipe photo
  
  // Ingredients
  bahanResep: RecipeIngredient[];
  
  // Cost Components
  biayaTenagaKerja: number;
  biayaOverhead: number;
  marginKeuntunganPersen: number; // Lebih deskriptif
  
  // 🧮 NEW: Per PCS Calculation Fields
  jumlahPcsPerPorsi?: number; // Berapa pcs dalam 1 porsi (default: 1)
  
  // Calculated Results - Per Porsi
  totalHpp: number; // Total HPP untuk semua porsi
  hppPerPorsi: number; // HPP per porsi
  hargaJualPorsi: number; // Harga jual per porsi
  
  // 🧮 NEW: Calculated Results - Per PCS
  hppPerPcs?: number; // HPP per piece
  hargaJualPerPcs?: number; // Harga jual per piece
  
  // 🧮 NEW: Additional Recipe Metadata
  tingkatKesulitan?: 'mudah' | 'sedang' | 'sulit'; // Difficulty level
  waktuPersiapan?: number; // Prep time in minutes
  waktuMasak?: number; // Cooking time in minutes
  porsiRekomendasi?: number; // Recommended serving size
  tags?: string[]; // Recipe tags for better categorization
  rating?: number; // User rating 1-5
  isPublic?: boolean; // Whether recipe can be shared
  isFavorite?: boolean; // User favorite flag
}

// Tipe untuk resep baru (lebih ringkas menggunakan Omit)
export type NewRecipe = Omit<Recipe, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

// 🧮 NEW: Interface untuk kalkulasi HPP
export interface HPPCalculation {
  // Input values
  bahanResep: RecipeIngredient[];
  jumlahPorsi: number;
  biayaTenagaKerja: number;
  biayaOverhead: number;
  marginKeuntunganPersen: number;
  jumlahPcsPerPorsi: number;
  
  // Calculated values
  totalBahanBaku: number;
  totalHPP: number;
  hppPerPorsi: number;
  hppPerPcs: number;
  marginKeuntungan: number;
  hargaJualPerPorsi: number;
  hargaJualPerPcs: number;
  profitabilitas: number; // Percentage
  
  // Cost breakdown
  persentaseBahanBaku: number; // Percentage of total cost
  persentaseTenagaKerja: number;
  persentaseOverhead: number;
}

// 🧮 NEW: Interface untuk validasi resep
export interface RecipeValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// 🧮 NEW: Interface untuk analisis resep
export interface RecipeAnalysis {
  // Profitability analysis
  marginAnalysis: {
    current: number;
    recommended: number;
    status: 'low' | 'good' | 'excellent';
  };
  
  // Cost efficiency
  costEfficiency: {
    costPerGram?: number;
    costPerMl?: number;
    costPerPorsi: number;
    costPerPcs?: number;
  };
  
  // Comparison with similar recipes
  marketComparison?: {
    averageHPP: number;
    averageSellingPrice: number;
    competitiveness: 'below' | 'average' | 'above';
  };
  
  // Suggestions for improvement
  suggestions: string[];
}

// 🧮 NEW: Interface untuk filter dan pencarian
export interface RecipeFilters {
  kategori?: string;
  tingkatKesulitan?: string;
  waktuMaksimal?: number; // Total cooking time
  hppMaksimal?: number;
  tags?: string[];
  isFavorite?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// 🧮 NEW: Interface untuk sorting
export type RecipeSortField = 
  | 'namaResep' 
  | 'createdAt' 
  | 'updatedAt'
  | 'hppPerPorsi' 
  | 'hargaJualPorsi' 
  | 'totalHpp'
  | 'marginKeuntunganPersen'
  | 'jumlahPorsi'
  | 'waktuTotal'
  | 'rating';

export interface RecipeSortOptions {
  field: RecipeSortField;
  direction: 'asc' | 'desc';
}