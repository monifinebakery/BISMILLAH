// src/components/warehouse/types.ts
/**
 * Complete Warehouse Type Definitions
 * Updated to match exact Supabase database schema with consistent BahanBakuFrontend usage
 */

// Core Data Types (Database format - snake_case)
export interface BahanBaku {
  id: string;
  user_id: string;
  nama: string;
  kategori: string;
  stok: number;
  satuan: string;
  minimum: number;
  harga_satuan: number;
  supplier: string;
  tanggal_kadaluwarsa?: string;
  created_at: string;
  updated_at: string;
  jumlah_beli_kemasan?: number;
  satuan_kemasan?: string;
  harga_total_beli_kemasan?: number;
}

// Frontend interface (camelCase for frontend usage)
export interface BahanBakuFrontend {
  id: string;
  userId: string; // maps to user_id
  nama: string;
  kategori: string;
  stok: number;
  minimum: number;
  satuan: string;
  harga: number; // maps to harga_satuan
  supplier: string;
  expiry?: string; // maps to tanggal_kadaluwarsa
  createdAt: string; // maps to created_at
  updatedAt: string; // maps to updated_at
  // Additional fields
  jumlahBeliKemasan?: number; // maps to jumlah_beli_kemasan
  satuanKemasan?: string; // maps to satuan_kemasan
  hargaTotalBeliKemasan?: number; // maps to harga_total_beli_kemasan
}

// Filter & Sort Types
export interface FilterState {
  category: string;
  supplier: string;
  stockLevel: 'all' | 'low' | 'out';
  expiry: 'all' | 'expiring' | 'expired';
}

export interface SortConfig {
  key: keyof BahanBakuFrontend;  // ✅ Updated to use BahanBakuFrontend
  direction: 'asc' | 'desc';
}

// Dialog Types
export interface DialogState {
  addItem: boolean;
  editItem: boolean;
  bulkEdit: boolean;
  bulkDelete: boolean;
  import: boolean;
  export: boolean;
}

// Context Types (using BahanBakuFrontend for frontend consistency)
export interface WarehouseContextType {
  // State
  bahanBaku: BahanBakuFrontend[];  // ✅ Updated to use BahanBakuFrontend
  loading: boolean;
  isConnected: boolean;
  isBulkDeleting: boolean;
  
  // CRUD Operations
  addBahanBaku: (bahan: Omit<BahanBakuFrontend, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<boolean>;
  updateBahanBaku: (id: string, updates: Partial<BahanBakuFrontend>) => Promise<boolean>;
  deleteBahanBaku: (id: string) => Promise<boolean>;
  bulkDeleteBahanBaku: (ids: string[]) => Promise<boolean>;
  refreshData: () => Promise<void>;
  
  // Utilities
  getBahanBakuByName: (nama: string) => BahanBakuFrontend | undefined;
  reduceStok: (nama: string, jumlah: number) => Promise<boolean>;
  
  // Analysis
  getLowStockItems: () => BahanBakuFrontend[];