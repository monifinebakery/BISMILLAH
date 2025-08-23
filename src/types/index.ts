// src/types/index.ts
import { Recipe, RecipeIngredient } from './recipe';
import { Supplier } from './supplier';
import { Order, NewOrder, OrderItem } from './order';
import { Asset, AssetCategory, AssetCondition } from './asset';
import { Activity } from './activity';
import { FinancialTransaction } from './financial';

// Ini adalah interface yang sebelumnya ada di AppDataContext
export interface BahanBaku {
  id: string;
  nama: string;
  kategori: string;
  stok: number;
  satuan: string;
  hargaSatuan: number;
  minimum: number;
  supplier: string;
  tanggalKadaluwarsa: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  userId?: string;
}

export interface Purchase {
  id: string;
  tanggal: Date;
  supplier: string;
  items: {
    id?: string | number;
    namaBarang: string;
    kategori?: string;
    jumlah: number;
    satuan?: string;
    hargaSatuan: number;
    totalHarga: number;
  }[];
  totalNilai: number;
  status: 'pending' | 'completed' | 'cancelled';
  metodePerhitungan: 'Average';
  catatan: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface HPPResult {
  id: string;
  nama: string;
  ingredients: RecipeIngredient[];
  biayaTenagaKerja: number;
  biayaOverhead: number;
  marginKeuntungan: number;
  totalHPP: number;
  hppPerPorsi: number;
  hargaJualPorsi: number;
  jumlahPorsi: number;
  timestamp: Date;
  createdAt: Date | null;
  updatedAt: Date | null;
}

// Re-export tipe lain agar bisa diimpor dari satu tempat
export type {
    Recipe, RecipeIngredient, Supplier, Order, NewOrder, OrderItem,
    Asset, AssetCategory, AssetCondition, Activity, FinancialTransaction
};