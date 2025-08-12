// src/components/warehouse/types.ts
/**
 * Complete Warehouse Type Definitions
 * Updated to support proper package content calculation and unit price handling
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
  isi_per_kemasan?: number; // ✅ NEW: content per package (e.g., 500 for 500g per pack)
  satuan_kemasan?: string; // ✅ ENHANCED: stores full info like "500 gram per pak"
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
  // Enhanced package fields
  jumlahBeliKemasan?: number; // maps to jumlah_beli_kemasan
  isiPerKemasan?: number; // ✅ NEW: maps to isi_per_kemasan
  satuanKemasan?: string; // maps to satuan_kemasan (stores full description)
  hargaTotalBeliKemasan?: number; // maps to harga_total_beli_kemasan
}

// ✅ NEW: Package calculation helper types
export interface PackageCalculation {
  jumlahKemasan: number;
  isiPerKemasan: number;
  totalIsi: number;
  hargaTotal: number;
  hargaPerSatuan: number;
  satuan: string;
  jenisKemasan: string;
}

// ✅ NEW: Unit conversion types
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
  
  // ✅ NEW: Package calculation utilities
  calculateUnitPrice: (jumlahKemasan: number, isiPerKemasan: number, hargaTotal: number) => number;
  calculateTotalContent: (jumlahKemasan: number, isiPerKemasan: number) => number;
  validatePackageConsistency: (calculation: PackageCalculation) => { isValid: boolean; errors: string[] };
  
  // Analysis
  getLowStockItems: () => BahanBakuFrontend[];
  getExpiringItems: (days?: number) => BahanBakuFrontend[];
  getStockValue: () => number; // ✅ NEW: total stock value calculation
}

// ✅ NEW: Import/Export Types with enhanced package support
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
  isiPerKemasan?: number; // ✅ NEW: for import calculations
  satuanKemasan?: string;
  hargaTotalBeliKemasan?: number;
}

export interface ImportValidationResult {
  valid: BahanBakuImport[];
  errors: string[];
  warnings: string[];
  calculations: PackageCalculation[]; // ✅ NEW: track calculated prices
}

// ✅ NEW: Bulk operations with package awareness
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
    recalculatePrice?: boolean; // ✅ Recalculate unit price based on package info
  };
}

// ✅ NEW: Analytics Types
export interface StockAnalytics {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringCount: number;
  topCategories: { kategori: string; count: number; value: number }[];
  topSuppliers: { supplier: string; count: number; value: number }[];
  averageUnitPrice: { [satuan: string]: number };
}

// ✅ NEW: Price History Types (for future implementation)
export interface PriceHistory {
  id: string;
  bahan_baku_id: string;
  harga_lama: number;
  harga_baru: number;
  tanggal_perubahan: string;
  alasan?: string;
  user_id: string;
}

// ✅ NEW: Stock Movement Types (for future implementation)
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
  isi_per_kemasan?: number;
  jenis_kemasan?: string;
}

// ✅ ENHANCED: Error types with package calculation context
export interface WarehouseError extends Error {
  code?: string;
  context?: {
    operation?: string;
    itemId?: string;
    calculation?: Partial<PackageCalculation>;
  };
}

// ✅ NEW: Validation types
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
  errors: { field: string; message: string }[];
  warnings: { field: string; message: string }[];
}

// ✅ Export utility type for easier imports
export type CreateBahanBakuInput = Omit<BahanBakuFrontend, 'id' | 'createdAt' | 'updatedAt' | 'userId'>;
export type UpdateBahanBakuInput = Partial<CreateBahanBakuInput>;

// ✅ NEW: Form state types for AddEditDialog
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
  isiPerKemasan: number; // ✅ NEW: separate field for package content
  satuanKemasan: string; // ✅ Pure package type (pak, botol, dus)
  hargaTotalBeliKemasan: number;
}

// ✅ Database mapping helpers (for conversion between snake_case and camelCase)
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

// Re-export commonly used types
export type { 
  BahanBaku as DatabaseBahanBaku,
  BahanBakuFrontend as ClientBahanBaku 
};