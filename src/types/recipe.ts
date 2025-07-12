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
  category: string; // MODIFIED: Tambahkan category
}

export interface NewRecipe {
  namaResep: string;
  deskripsi: string;
  porsi: number;
  ingredients: RecipeIngredient[];
  biayaTenagaKerja: number;
  biayaOverhead: number;
  marginKeuntungan: number;
  category: string; // MODIFIED: Tambahkan category
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
  tanggalKadaluwarsa?: Date; // Menambahkan ini berdasarkan diskusi sebelumnya
}
