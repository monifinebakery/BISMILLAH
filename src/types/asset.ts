// src/types/asset.ts

export type AssetCategory = 'Peralatan' | 'Kendaraan' | 'Bangunan' | 'Mesin' | 'Lain-lain';
export type AssetCondition = 'Baik' | 'Rusak Ringan' | 'Rusak Berat';

export interface Asset {
  id: string;
  nama: string;
  kategori: AssetCategory;
  nilaiAwal: number;
  nilaiSaatIni: number; // Ini akan menjadi nilai yang Anda kelola secara langsung
  tanggalPembelian: Date;
  kondisi: AssetCondition;
  lokasi: string;
  deskripsi: string | null;
  depresiasi: number | null; // Depresiasi sebagai persentase
  // --- DIHAPUS: umurManfaat: number;
  // --- DIHAPUS: penyusutanPerBulan: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}