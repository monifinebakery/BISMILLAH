// src/components/warehouse/types.ts
/**
 * Complete Warehouse Type Definitions
 * ✅ VERIFIED: Perfect alignment with database schema
 * Updated to support proper package content calculation and unit price handling
 */

import type { RecipeIngredient } from '@/types/recipe';

// Core Data Types (Database format - snake_case)
// ✅ VERIFIED: All field names match database schema exactly
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
  jumlah_beli_kemasan?: number;        // ✅ VERIFIED: matches DB column
  isi_per_kemasan?: number;            // ✅ VERIFIED: matches DB column
  satuan_kemasan?: string;             // ✅ VERIFIED: matches DB column
  harga_total_beli_kemasan?: number;   // ✅ VERIFIED: matches DB column
  harga_rata_rata?: number;            // ✅ TAMBAH: WAC field from DB
}

// Frontend interface (camelCase for frontend usage)
// ✅ VERIFIED: Perfect mapping from database fields
export interface BahanBakuFrontend {
  id: string;
  userId: string;                      // maps to user_id
  nama: string;
  kategori: string;
  stok: number;
  minimum: number;
  satuan: string;
  harga: number;                       // maps to harga_satuan
  hargaRataRata?: number;              // ✅ TAMBAH: maps to harga_rata_rata
  supplier: string;
  expiry?: string;                     // maps to tanggal_kadaluwarsa
  createdAt: string;                   // maps to created_at
  updatedAt: string;                   // maps to updated_at
  // Enhanced package fields
  jumlahBeliKemasan?: number;          // maps to jumlah_beli_kemasan
  isiPerKemasan?: number;              // maps to isi_per_kemasan ✅
  satuanKemasan?: string;              // maps to satuan_kemasan
  hargaTotalBeliKemasan?: number;      // maps to harga_total_beli_kemasan
}

// ✅ ENHANCED: Package calculation helper types
export interface PackageCalculation {
  jumlahKemasan: number;
  isiPerKemasan: number;
  totalIsi: number;
  hargaTotal: number;
  hargaPerSatuan: number;
  satuan: string;
  jenisKemasan: string;
}

// ✅ ENHANCED: Unit conversion types
export interface UnitInfo {
  value: string;
  label: string;
  category: 'Berat' | 'Volume' | 'Satuan' | 'Panjang';
  baseUnit: string;
  multiplier: number;
  domain: 'mass' | 'volume' | 'count' | 'length';
}

// Filter & Sort Types
export interface FilterState {
  category: string;
  supplier: string;
  stockLevel: 'all' | 'low' | 'out';
  expiry: 'all' | 'expiring' | 'expired';
}

export interface SortConfig {
  key: keyof BahanBakuFrontend;
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

// ✅ ENHANCED: Context Types with calculation methods
export interface WarehouseContextType {
  // State
  bahanBaku: BahanBakuFrontend[];
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
  getIngredientPrice: (nama: string) => number;
  validateIngredientAvailability: (ingredients: RecipeIngredient[]) => boolean;
  consumeIngredients: (ingredients: RecipeIngredient[]) => Promise<boolean>;
  updateIngredientPrices: (ingredients: RecipeIngredient[]) => RecipeIngredient[];
  
  // ✅ ENHANCED: Package calculation utilities
  calculateUnitPrice: (jumlahKemasan: number, isiPerKemasan: number, hargaTotal: number) => number;
  calculateTotalContent: (jumlahKemasan: number, isiPerKemasan: number) => number;
  validatePackageConsistency: (calculation: PackageCalculation) => { isValid: boolean; errors: string[] };
  
  // Analysis
  getLowStockItems: () => BahanBakuFrontend[];
  getExpiringItems: (days?: number) => BahanBakuFrontend[];
  getStockValue: () => number;
}

// ✅ ENHANCED: Import/Export Types with package support
export interface BahanBakuImport {
  nama: string;
  kategori: string;
  supplier: string;
  satuan: string;
  expiry?: string;
  stok: number;
  minimum: number;
  harga: number;
  jumlahBeliKemasan?: number;
  isiPerKemasan?: number;              // ✅ VERIFIED: for import calculations
  satuanKemasan?: string;
  hargaTotalBeliKemasan?: number;
}

export interface ImportValidationResult {
  valid: BahanBakuImport[];
  errors: string[];
  warnings: string[];
  calculations: PackageCalculation[];   // ✅ track calculated prices
}

// ✅ ENHANCED: Bulk operations with package awareness
export interface BulkUpdateData {
  category?: string;
  supplier?: string;
  adjustStock?: {
    operation: 'add' | 'subtract' | 'set';
    value: number;
  };
  adjustPrice?: {
    operation: 'multiply' | 'add' | 'set';
    value: number;
  };
  updatePackageInfo?: {
    isiPerKemasan?: number;
    satuanKemasan?: string;
    recalculatePrice?: boolean;         // ✅ Recalculate unit price based on package info
  };
}

// ✅ ENHANCED: Analytics Types
export interface StockAnalytics {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringCount: number;
  topCategories: { kategori: string; count: number; value: number }[];
  topSuppliers: { supplier: string; count: number; value: number }[];
  averageUnitPrice: { [satuan: string]: number };
  packagedItemsCount: number;          // ✅ NEW: count of items with package info
  averagePackageEfficiency: number;    // ✅ NEW: average packaging efficiency
}

// ✅ FUTURE: Price History Types
export interface PriceHistory {
  id: string;
  bahan_baku_id: string;
  harga_lama: number;
  harga_baru: number;
  tanggal_perubahan: string;
  alasan?: string;
  user_id: string;
  // Package context for price changes
  package_context?: {
    jumlah_kemasan?: number;
    isi_per_kemasan?: number;
    harga_total_kemasan?: number;
  };
}

// ✅ FUTURE: Stock Movement Types
export interface StockMovement {
  id: string;
  bahan_baku_id: string;
  jenis: 'masuk' | 'keluar' | 'adjustment';
  jumlah: number;
  satuan: string;
  harga_satuan?: number;
  total_harga?: number;
  keterangan?: string;
  tanggal: string;
  user_id: string;
  // Package tracking
  jumlah_kemasan?: number;
  isi_per_kemasan?: number;            // ✅ VERIFIED: consistent naming
  jenis_kemasan?: string;
}

// ✅ ENHANCED: Error types with package calculation context
export interface WarehouseError extends Error {
  code?: string;
  context?: {
    operation?: string;
    itemId?: string;
    calculation?: Partial<PackageCalculation>;
    packageInfo?: {
      jumlahKemasan?: number;
      isiPerKemasan?: number;
      hargaTotal?: number;
    };
  };
}

// ✅ ENHANCED: Validation types
export interface ValidationRule {
  field: keyof BahanBakuFrontend;
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any, item: Partial<BahanBakuFrontend>) => string | null;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];                    // ✅ SIMPLIFIED: just error messages
  warnings?: string[];                 // ✅ OPTIONAL: warnings
}

// ✅ VERIFIED: Form state types for AddEditDialog
export interface BahanBakuFormData {
  nama: string;
  kategori: string;
  supplier: string;
  stok: number;
  minimum: number;
  satuan: string;
  harga: number;
  expiry: string;
  jumlahBeliKemasan: number;
  isiPerKemasan: number;               // ✅ VERIFIED: separate field for package content
  satuanKemasan: string;               // ✅ VERIFIED: pure package type (pak, botol, dus)
  hargaTotalBeliKemasan: number;
}

// ✅ ENHANCED: Database field validation
export interface DatabaseFieldMapping {
  // Frontend -> Database
  userId: 'user_id';
  harga: 'harga_satuan';
  hargaRataRata: 'harga_rata_rata';    // ✅ TAMBAH: WAC mapping
  expiry: 'tanggal_kadaluwarsa';
  createdAt: 'created_at';
  updatedAt: 'updated_at';
  jumlahBeliKemasan: 'jumlah_beli_kemasan';
  isiPerKemasan: 'isi_per_kemasan';              // ✅ VERIFIED
  satuanKemasan: 'satuan_kemasan';
  hargaTotalBeliKemasan: 'harga_total_beli_kemasan';
}

// ✅ ENHANCED: Package parsing types
export interface ParsedPackageInfo {
  isiPerKemasan: number;
  satuan: string;
  jenisKemasan: string;
  isValid: boolean;
  originalString: string;
}

// ✅ UTILITY: Export utility types for easier imports
export type CreateBahanBakuInput = Omit<BahanBakuFrontend, 'id' | 'createdAt' | 'updatedAt' | 'userId'>;
export type UpdateBahanBakuInput = Partial<CreateBahanBakuInput>;

// ✅ ADVANCED: Database mapping helpers
export type DbToCamelCase<T> = {
  [K in keyof T as K extends `${infer P}_${infer S}` 
    ? `${P}${Capitalize<S>}` 
    : K]: T[K]
};

export type CamelToSnakeCase<T> = {
  [K in keyof T as K extends `${infer P}${Capitalize<infer S>}` 
    ? `${P}_${Lowercase<S>}` 
    : K]: T[K]
};

// ✅ CONSTANTS: Database column names for validation
export const DB_COLUMNS = {
  ID: 'id',
  USER_ID: 'user_id',
  NAMA: 'nama',
  KATEGORI: 'kategori',
  STOK: 'stok',
  SATUAN: 'satuan',
  MINIMUM: 'minimum',
  HARGA_SATUAN: 'harga_satuan',
  HARGA_RATA_RATA: 'harga_rata_rata',  // ✅ TAMBAH: WAC column
  SUPPLIER: 'supplier',
  TANGGAL_KADALUWARSA: 'tanggal_kadaluwarsa',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  JUMLAH_BELI_KEMASAN: 'jumlah_beli_kemasan',
  ISI_PER_KEMASAN: 'isi_per_kemasan',           // ✅ VERIFIED
  SATUAN_KEMASAN: 'satuan_kemasan',
  HARGA_TOTAL_BELI_KEMASAN: 'harga_total_beli_kemasan',
} as const;

// ✅ TYPE GUARD: Runtime validation helpers
export const isBahanBaku = (obj: any): obj is BahanBaku => {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.nama === 'string' &&
    typeof obj.kategori === 'string' &&
    typeof obj.stok === 'number' &&
    typeof obj.satuan === 'string' &&
    typeof obj.minimum === 'number' &&
    typeof obj.harga_satuan === 'number' &&
    typeof obj.supplier === 'string'
  );
};

export const isBahanBakuFrontend = (obj: any): obj is BahanBakuFrontend => {
  return (
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.nama === 'string' &&
    typeof obj.kategori === 'string' &&
    typeof obj.stok === 'number' &&
    typeof obj.satuan === 'string' &&
    typeof obj.minimum === 'number' &&
    typeof obj.harga === 'number' &&
    typeof obj.supplier === 'string'
  );
};

// ✅ PACKAGE VALIDATION: Type guards for package data
export const hasValidPackageData = (item: BahanBakuFrontend): boolean => {
  return !!(
    item.jumlahBeliKemasan && 
    item.isiPerKemasan && 
    item.hargaTotalBeliKemasan &&
    item.jumlahBeliKemasan > 0 &&
    item.isiPerKemasan > 0 &&
    item.hargaTotalBeliKemasan > 0
  );
};

// Re-export commonly used types with clear aliases
export type { 
  BahanBaku as DatabaseBahanBaku,
  BahanBakuFrontend as ClientBahanBaku 
};

// ✅ EXPORT: All field mappings for reference
export const FIELD_MAPPINGS = {
  frontend: {
    userId: 'user_id',
    harga: 'harga_satuan',
    hargaRataRata: 'harga_rata_rata',    // ✅ TAMBAH: WAC mapping
    expiry: 'tanggal_kadaluwarsa',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    jumlahBeliKemasan: 'jumlah_beli_kemasan',
    isiPerKemasan: 'isi_per_kemasan',                    // ✅ VERIFIED
    satuanKemasan: 'satuan_kemasan',
    hargaTotalBeliKemasan: 'harga_total_beli_kemasan',
  },
  database: {
    user_id: 'userId',
    harga_satuan: 'harga',
    harga_rata_rata: 'hargaRataRata',    // ✅ TAMBAH: WAC mapping
    tanggal_kadaluwarsa: 'expiry',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
    jumlah_beli_kemasan: 'jumlahBeliKemasan',
    isi_per_kemasan: 'isiPerKemasan',                    // ✅ VERIFIED
    satuan_kemasan: 'satuanKemasan',
    harga_total_beli_kemasan: 'hargaTotalBeliKemasan',
  }
} as const;