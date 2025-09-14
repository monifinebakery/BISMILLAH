// src/utils/typeConverters.ts
/**
 * Unified Type Converters for Purchase and Warehouse Data
 * Provides consistent field mapping between frontend (camelCase) and database (snake_case)
 */

import type { Purchase, PurchaseItem, PurchaseItemDB, CreatePurchaseRequest, UpdatePurchaseRequest } from '@/components/purchase/types/purchase.types';
import type { BahanBaku, BahanBakuFrontend } from '@/components/warehouse/types';

// ============ FIELD MAPPINGS ============

// Purchase field mappings
export const PURCHASE_FIELD_MAPPINGS = {
  frontend: {
    total_nilai: 'total_nilai',
    metode_perhitungan: 'metode_perhitungan',
    userId: 'user_id',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  database: {
    total_nilai: 'total_nilai',
    metode_perhitungan: 'metode_perhitungan',
    user_id: 'userId',
    created_at: 'createdAt',
    updated_at: 'updatedAt'
  }
} as const;

// Purchase item field mappings
export const PURCHASE_ITEM_FIELD_MAPPINGS = {
  frontend: {
    bahanBakuId: 'bahan_baku_id',
    quantity: 'quantity',
    unitPrice: 'unit_price'
  },
  database: {
    bahan_baku_id: 'bahanBakuId',
    quantity: 'quantity',
    unit_price: 'unitPrice'
  }
} as const;

// Warehouse field mappings (already defined in warehouse/types.ts)
export const WAREHOUSE_FIELD_MAPPINGS = {
  frontend: {
    userId: 'user_id',
    harga: 'harga_satuan',
    hargaRataRata: 'harga_rata_rata',
    expiry: 'tanggal_kadaluwarsa',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  database: {
    user_id: 'userId',
    harga_satuan: 'harga',
    harga_rata_rata: 'hargaRataRata',
    tanggal_kadaluwarsa: 'expiry',
    created_at: 'createdAt',
    updated_at: 'updatedAt'
  }
} as const;

// ============ PURCHASE CONVERTERS ============

/**
 * Convert Purchase from database format to frontend format
 */
export const convertPurchaseFromDB = (dbPurchase: any): Purchase => {
  return {
    id: dbPurchase.id,
    userId: dbPurchase.user_id,
    supplier: dbPurchase.supplier,
    tanggal: new Date(dbPurchase.tanggal),
    total_nilai: dbPurchase.total_nilai,
    items: dbPurchase.items?.map(convertPurchaseItemFromDB) || [],
    status: dbPurchase.status,
    metode_perhitungan: dbPurchase.metode_perhitungan || 'AVERAGE',
    keterangan: dbPurchase.keterangan,
    createdAt: new Date(dbPurchase.created_at),
    updatedAt: new Date(dbPurchase.updated_at)
  };
};

/**
 * Convert Purchase from frontend format to database format
 */
export const convertPurchaseToDB = (purchase: Purchase): CreatePurchaseRequest => {
  return {
    user_id: purchase.userId,
    supplier: purchase.supplier,
    tanggal: purchase.tanggal instanceof Date ? purchase.tanggal.toISOString().split('T')[0] : String(purchase.tanggal),
    total_nilai: purchase.total_nilai,
    items: purchase.items.map(convertPurchaseItemToDB),
    status: purchase.status,
    metode_perhitungan: purchase.metode_perhitungan
  };
};

/**
 * Convert PurchaseItem from database format to frontend format
 */
export const convertPurchaseItemFromDB = (dbItem: any): PurchaseItem => {
  return {
    bahanBakuId: dbItem.bahan_baku_id,
    nama: dbItem.nama,
    quantity: dbItem.quantity || dbItem.jumlah, // support both old and new
    satuan: dbItem.satuan,
    unitPrice: dbItem.unit_price || dbItem.harga_per_satuan, // support both old and new
    subtotal: dbItem.subtotal,
    keterangan: dbItem.keterangan
  };
};

/**
 * Convert PurchaseItem from frontend format to database format
 */
export const convertPurchaseItemToDB = (item: PurchaseItem): PurchaseItemDB => {
  return {
    bahan_baku_id: item.bahanBakuId,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    nama: item.nama,
    satuan: item.satuan,
    subtotal: item.subtotal,
    keterangan: item.keterangan
  };
};

// ============ WAREHOUSE CONVERTERS ============

/**
 * Convert BahanBaku from database format to frontend format
 */
export const convertWarehouseFromDB = (dbBahan: BahanBaku): BahanBakuFrontend => {
  return {
    id: dbBahan.id,
    userId: dbBahan.user_id,
    nama: dbBahan.nama,
    kategori: dbBahan.kategori,
    stok: dbBahan.stok,
    minimum: dbBahan.minimum,
    satuan: dbBahan.satuan,
    harga: dbBahan.harga_satuan,
    hargaRataRata: dbBahan.harga_rata_rata,
    supplier: dbBahan.supplier,
    expiry: dbBahan.tanggal_kadaluwarsa ? new Date(dbBahan.tanggal_kadaluwarsa) : undefined,
    createdAt: new Date(dbBahan.created_at),
    updatedAt: new Date(dbBahan.updated_at)
  };
};

/**
 * Convert BahanBaku from frontend format to database format
 */
export const convertWarehouseToDB = (bahan: BahanBakuFrontend): BahanBaku => {
  return {
    id: bahan.id,
    user_id: bahan.userId,
    nama: bahan.nama,
    kategori: bahan.kategori,
    stok: bahan.stok,
    minimum: bahan.minimum,
    satuan: bahan.satuan,
    harga_satuan: bahan.harga,
    harga_rata_rata: bahan.hargaRataRata,
    supplier: bahan.supplier,
    tanggal_kadaluwarsa: bahan.expiry ? bahan.expiry.toISOString() : null,
    created_at: bahan.createdAt.toISOString(),
    updated_at: bahan.updatedAt.toISOString()
  };
};

// ============ VALIDATION HELPERS ============

/**
 * Validate purchase data consistency
 */
export const validatePurchaseConsistency = (purchase: Purchase): string[] => {
  const errors: string[] = [];
  
  // Check if total value matches sum of items
  const calculatedTotal = purchase.items.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice);
  }, 0);
  
  const tolerance = 0.01; // Allow small rounding differences
  if (Math.abs(purchase.total_nilai - calculatedTotal) > tolerance) {
    errors.push(`Total value (${purchase.total_nilai}) tidak sesuai dengan sum items (${calculatedTotal})`);
  }
  
  // Check for empty items
  if (!purchase.items || purchase.items.length === 0) {
    errors.push('Purchase harus memiliki minimal 1 item');
  }
  
  // Check item consistency
  purchase.items.forEach((item, index) => {
    if (!item.bahanBakuId) {
      errors.push(`Item ${index + 1}: bahan_baku_id harus diisi`);
    }
    if (!item.quantity || item.quantity <= 0) {
      errors.push(`Item ${index + 1}: quantity harus lebih dari 0`);
    }
    if (!item.unitPrice || item.unitPrice < 0) {
      errors.push(`Item ${index + 1}: unit_price tidak boleh negatif`);
    }
  });
  
  return errors;
};

/**
 * Validate warehouse data consistency
 */
export const validateWarehouseConsistency = (bahan: BahanBakuFrontend): string[] => {
  const errors: string[] = [];
  
  if (!bahan.nama?.trim()) {
    errors.push('Nama bahan baku harus diisi');
  }
  
  if (bahan.stok < 0) {
    errors.push('Stok tidak boleh negatif');
  }
  
  if (bahan.minimum < 0) {
    errors.push('Minimum stok tidak boleh negatif');
  }
  
  if (!bahan.harga || bahan.harga < 0) {
    errors.push('Harga satuan harus diisi dan tidak boleh negatif');
  }
  
  if (!bahan.satuan?.trim()) {
    errors.push('Satuan harus diisi');
  }
  
  return errors;
};

// ============ UTILITY FUNCTIONS ============

/**
 * Get standardized field name for sorting
 */
export const getStandardizedSortField = (field: string): string => {
  const fieldMap: Record<string, string> = {
    'totalNilai': 'total_nilai',
  'total_nilai': 'total_nilai',
    'kuantitas': 'quantity',
    'jumlah': 'quantity',
    'hargaSatuan': 'unitPrice',
    'harga_per_satuan': 'unitPrice',
    'unit_price': 'unitPrice',
    'metodePerhitungan': 'metode_perhitungan',
  'metode_perhitungan': 'metode_perhitungan',
  'calculation_method': 'metode_perhitungan'
  };
  
  return fieldMap[field] || field;
};

/**
 * Check if two objects have consistent field values
 */
export const areFieldsConsistent = (obj1: any, obj2: any, fieldMappings: Record<string, string>): boolean => {
  for (const [frontendField, dbField] of Object.entries(fieldMappings)) {
    if (obj1[frontendField] !== obj2[dbField]) {
      return false;
    }
  }
  return true;
};

export default {
  convertPurchaseFromDB,
  convertPurchaseToDB,
  convertPurchaseItemFromDB,
  convertPurchaseItemToDB,
  convertWarehouseFromDB,
  convertWarehouseToDB,
  validatePurchaseConsistency,
  validateWarehouseConsistency,
  getStandardizedSortField,
  areFieldsConsistent
};