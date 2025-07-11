
export interface RecipeIngredient {
  id: string;
  nama: string;
  jumlah: number;
  satuan: string;
  hargaPerSatuan: number;
  totalHarga: number;
}

export interface Recipe {
  id: string;
  namaResep: string;
  deskripsi: string;
  porsi: number;
  ingredients: RecipeIngredient[];
  biayaTenagaKerja: number;
  biayaOverhead: number;
  totalHPP: number;
  hppPerPorsi: number;
  marginKeuntungan: number;
  hargaJualPerPorsi: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewRecipe {
  namaResep: string;
  deskripsi: string;
  porsi: number;
  ingredients: RecipeIngredient[];
  biayaTenagaKerja: number;
  biayaOverhead: number;
  marginKeuntungan: number;
}

export interface BahanBaku {
  id: string;
  nama: string;
  kategori: string;
  stok: number;
  satuan: string;
  minimum: number;
  hargaSatuan: number;
  supplier: string;
  createdAt?: Date;
  updatedAt?: Date;
}
