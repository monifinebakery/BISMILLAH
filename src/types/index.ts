// src/types/index.ts
import { Recipe, RecipeIngredient } from './recipe';
import { Supplier } from './supplier';
import { Order, NewOrder, OrderItem } from './order';
import { Asset, AssetCategory, AssetCondition } from './asset';
import { Activity } from './activity';
import { FinancialTransaction } from './financial';
import type { Purchase, PurchaseStatus } from '@/components/purchase/types/purchase.types';

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

export const PURCHASE_STATUS_CONFIG: Record<
  PurchaseStatus,
  { label: string; color: string; icon: string }
> = {
  pending: {
    label: 'Menunggu',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '⏳',
  },
  completed: {
    label: 'Selesai',
    color: 'bg-green-100 text-green-800',
    icon: '✅',
  },
  cancelled: {
    label: 'Dibatalkan',
    color: 'bg-red-100 text-red-800',
    icon: '❌',
  },
};

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
  Recipe,
  RecipeIngredient,
  Supplier,
  Order,
  NewOrder,
  OrderItem,
  Asset,
  AssetCategory,
  AssetCondition,
  Activity,
  FinancialTransaction,
  Purchase,
  PurchaseStatus
};
