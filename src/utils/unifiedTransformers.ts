// src/utils/unifiedTransformers.ts
// Standarized data transformation utilities for both purchase and warehouse modules

import { logger } from '@/utils/logger';
import { toNumber } from '@/utils/calculationUtils';
import { UserFriendlyDate } from '@/utils/userFriendlyDate';

// ==================== COMMON TRANSFORMATION UTILITIES ====================

export interface TransformationOptions {
  enableDebugLogs?: boolean;
  preserveOriginalValues?: boolean;
  strictValidation?: boolean;
}

/**
 * Standardized transformation from database to frontend format
 * Handles common field mappings and type conversions
 */
export const transformFromDB = <T>(
  dbItem: any,
  fieldMappings: Record<string, string>,
  options?: TransformationOptions
): T => {
  const result: any = {};
  
  try {
    Object.entries(fieldMappings).forEach(([frontendField, dbField]) => {
      const value = dbItem[dbField];
      
      // Handle common type conversions
      switch (frontendField) {
        case 'id':
        case 'userId':
        case 'supplier':
        case 'nama':
        case 'kategori':
        case 'satuan':
          result[frontendField] = String(value || '').trim();
          break;
          
        case 'stok':
        case 'minimum':
        case 'harga':
        case 'hargaSatuan':
        case 'hargaRataRata':
        case 'total_nilai':
        case 'kuantitas':
        case 'subtotal':
          result[frontendField] = toNumber(value);
          break;
          
        case 'tanggal':
        case 'createdAt':
        case 'updatedAt':
        case 'expiry':
          result[frontendField] = UserFriendlyDate.safeParseToDate(value);
          break;
          
        default:
          result[frontendField] = value;
      }
    });
    
    if (options?.enableDebugLogs) {
      logger.debug('Transformation from DB completed:', {
        original: dbItem,
        transformed: result
      });
    }
    
    return result as T;
  } catch (error) {
    logger.error('Error in transformFromDB:', error);
    throw error;
  }
};

/**
 * Standardized transformation from frontend to database format
 */
export const transformToDB = <T>(
  frontendItem: any,
  fieldMappings: Record<string, string>,
  options?: TransformationOptions
): T => {
  const result: any = {};
  
  try {
    Object.entries(fieldMappings).forEach(([dbField, frontendField]) => {
      const value = frontendItem[frontendField];
      
      // Handle common type conversions
      switch (dbField) {
        case 'user_id':
        case 'supplier':
        case 'nama':
        case 'kategori':
        case 'satuan':
          result[dbField] = String(value || '').trim();
          break;
          
        case 'stok':
        case 'minimum':
        case 'harga_satuan':
        case 'harga_rata_rata':
        case 'total_nilai':
          result[dbField] = toNumber(value);
          break;
          
        case 'tanggal':
        case 'created_at':
        case 'updated_at':
        case 'tanggal_kadaluwarsa':
          result[dbField] = UserFriendlyDate.toYMD(value);
          break;
          
        default:
          result[dbField] = value;
      }
    });
    
    if (options?.enableDebugLogs) {
      logger.debug('Transformation to DB completed:', {
        original: frontendItem,
        transformed: result
      });
    }
    
    return result as T;
  } catch (error) {
    logger.error('Error in transformToDB:', error);
    throw error;
  }
};

/**
 * Standardized array transformation
 */
export const transformArrayFromDB = <T>(
  dbItems: any[],
  fieldMappings: Record<string, string>,
  options?: TransformationOptions
): T[] => {
  return (dbItems || []).map(item => transformFromDB<T>(item, fieldMappings, options));
};

// ==================== PURCHASE-SPECIFIC TRANSFORMATIONS ====================

export const PURCHASE_FIELD_MAPPINGS = {
  // Frontend -> Database mappings
  toDB: {
    user_id: 'userId',
    supplier: 'supplier',
    tanggal: 'tanggal',
    total_nilai: 'total_nilai',
    items: 'items',
    status: 'status',
    metode_perhitungan: 'metodePerhitungan',
    created_at: 'createdAt',
    updated_at: 'updatedAt'
  },
  
  // Database -> Frontend mappings
  fromDB: {
    id: 'id',
    userId: 'user_id',
    supplier: 'supplier',
    tanggal: 'tanggal',
    total_nilai: 'total_nilai',
    items: 'items',
    status: 'status',
    metodePerhitungan: 'metode_perhitungan',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
} as const;

// ==================== WAREHOUSE-SPECIFIC TRANSFORMATIONS ====================

export const WAREHOUSE_FIELD_MAPPINGS = {
  // Frontend -> Database mappings
  toDB: {
    id: 'id',
    user_id: 'userId',
    nama: 'nama',
    kategori: 'kategori',
    stok: 'stok',
    minimum: 'minimum',
    satuan: 'satuan',
    harga_satuan: 'harga',
    harga_rata_rata: 'hargaRataRata',
    supplier: 'supplier',
    tanggal_kadaluwarsa: 'expiry',
    created_at: 'createdAt',
    updated_at: 'updatedAt'
  },
  
  // Database -> Frontend mappings
  fromDB: {
    id: 'id',
    userId: 'user_id',
    nama: 'nama',
    kategori: 'kategori',
    stok: 'stok',
    minimum: 'minimum',
    satuan: 'satuan',
    harga: 'harga_satuan',
    hargaRataRata: 'harga_rata_rata',
    supplier: 'supplier',
    expiry: 'tanggal_kadaluwarsa',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
} as const;

// ==================== PURCHASE ITEM TRANSFORMATIONS ====================

export const PURCHASE_ITEM_FIELD_MAPPINGS = {
  toDB: {
    bahan_baku_id: 'bahanBakuId',
    nama: 'nama',
    jumlah: 'kuantitas', // ✅ FIX: Database uses 'jumlah' not 'kuantitas'
    satuan: 'satuan',
    harga_per_satuan: 'hargaSatuan',
    subtotal: 'subtotal',
    keterangan: 'keterangan'
  },
  
  fromDB: {
    bahanBakuId: 'bahan_baku_id',
    nama: 'nama',
    kuantitas: 'jumlah', // ✅ FIX: Database field is 'jumlah', frontend is 'kuantitas'
    satuan: 'satuan',
    hargaSatuan: 'harga_per_satuan',
    subtotal: 'subtotal',
    keterangan: 'keterangan'
  }
} as const;

// ==================== HELPER FUNCTIONS ====================

/**
 * Transform purchase item for database
 */
export const transformPurchaseItemToDB = (item: any): any => {
  return transformToDB(item, PURCHASE_ITEM_FIELD_MAPPINGS.toDB, {});
};

/**
 * Transform purchase item from database
 */
export const transformPurchaseItemFromDB = (item: any): any => {
  console.log('DEBUG transformPurchaseItemFromDB: Input item:', item);
  const result = transformFromDB(item, PURCHASE_ITEM_FIELD_MAPPINGS.fromDB, {});
  console.log('DEBUG transformPurchaseItemFromDB: Transformed result:', result);
  return result;
};

/**
 * Transform purchase for database
 */
export const transformPurchaseToDB = (
  purchase: any,
  userId: string,
  options?: TransformationOptions
): any => {
  const baseData = transformToDB(purchase, PURCHASE_FIELD_MAPPINGS.toDB, options);
  return {
    ...baseData,
    user_id: userId,
    items: Array.isArray(purchase.items)
      ? purchase.items.map(transformPurchaseItemToDB)
      : []
  };
};

/**
 * Transform purchase from database
 */
export const transformPurchaseFromDB = (dbItem: any, options?: TransformationOptions): any => {
  const baseData = transformFromDB(dbItem, PURCHASE_FIELD_MAPPINGS.fromDB, options);
  return {
    ...baseData,
    items: Array.isArray(dbItem.items)
      ? dbItem.items.map(transformPurchaseItemFromDB)
      : []
  };
};

/**
 * Transform warehouse item for database
 */
export const transformWarehouseToDB = (
  item: any,
  userId?: string,
  options?: TransformationOptions
): any => {
  const baseData = transformToDB(item, WAREHOUSE_FIELD_MAPPINGS.toDB, options);
  if (userId) {
    baseData.user_id = userId;
  }
  return baseData;
};

/**
 * Transform warehouse item from database
 */
export const transformWarehouseFromDB = (dbItem: any, options?: TransformationOptions): any => {
  return transformFromDB(dbItem, WAREHOUSE_FIELD_MAPPINGS.fromDB, options);
};

/**
 * Transform multiple purchases from database
 */
export const transformPurchasesFromDB = (
  dbItems: any[],
  options?: TransformationOptions
): any[] => {
  return transformArrayFromDB(dbItems, PURCHASE_FIELD_MAPPINGS.fromDB, options);
};

/**
 * Transform multiple warehouse items from database
 */
export const transformWarehouseItemsFromDB = (
  dbItems: any[],
  options?: TransformationOptions
): any[] => {
  return transformArrayFromDB(dbItems, WAREHOUSE_FIELD_MAPPINGS.fromDB, options);
};

// ==================== VALIDATION AND SANITIZATION ====================

/**
 * Standardized data sanitization
 */
export const sanitizeData = (data: any, fieldValidators: Record<string, (value: any) => any>): any => {
  const result: any = {};
  
  Object.entries(data).forEach(([key, value]) => {
    if (fieldValidators[key]) {
      result[key] = fieldValidators[key](value);
    } else {
      result[key] = value;
    }
  });
  
  return result;
};

/**
 * Common field validators
 */
export const COMMON_VALIDATORS = {
  number: (value: any) => Math.max(0, toNumber(value)),
  string: (value: any) => String(value || '').trim(),
  date: (value: any) => UserFriendlyDate.safeParseToDate(value),
  array: (value: any) => Array.isArray(value) ? value : []
} as const;