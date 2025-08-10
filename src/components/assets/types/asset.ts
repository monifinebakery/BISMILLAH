// src/components/assets/types/asset.ts

export type AssetCategory = 
  | 'Peralatan'
  | 'Kendaraan'
  | 'Bangunan'
  | 'Mesin'
  | 'Lain-lain';

export type AssetCondition = 
  | 'Baik'
  | 'Rusak Ringan'
  | 'Rusak Berat';

export interface Asset {
  id: string;
  nama: string;
  kategori: AssetCategory;
  nilaiAwal: number;
  nilaiSaatIni: number;
  tanggalPembelian: Date;
  kondisi: AssetCondition;
  lokasi: string;
  deskripsi: string | null;
  depresiasi: number | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetCreateInput {
  nama: string;
  kategori: AssetCategory;
  nilaiAwal: number;
  nilaiSaatIni: number;
  tanggalPembelian: Date;
  kondisi: AssetCondition;
  lokasi: string;
  deskripsi?: string;
  depresiasi?: number;
}

export interface AssetUpdateInput {
  nama?: string;
  kategori?: AssetCategory;
  nilaiAwal?: number;
  nilaiSaatIni?: number;
  tanggalPembelian?: Date;
  kondisi?: AssetCondition;
  lokasi?: string;
  deskripsi?: string;
  depresiasi?: number;
}

export interface AssetStatistics {
  totalAssets: number;
  totalNilaiAwal: number;
  totalNilaiSaatIni: number;
  totalDepresiasi: number;
  assetsByCategory: Record<AssetCategory, number>;
  assetsByCondition: Record<AssetCondition, number>;
}