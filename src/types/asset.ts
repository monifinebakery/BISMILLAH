// src/types/asset.ts
export type AssetCategory = 'Peralatan' | 'Kendaraan' | 'Bangunan' | 'Mesin' | 'Lain-lain';
export type AssetCondition = 'Baik' | 'Rusak Ringan' | 'Rusak Berat';

export interface Asset {
  id: string;
  nama: string;
  kategori: AssetCategory | null;
  nilaiAwal: number;
  nilaiSaatIni: number;
  tanggalPembelian: Date | null;
  kondisi: AssetCondition | null;
  lokasi: string | null;
  deskripsi: string | null;
  depresiasi: number | null;
  userId?: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}