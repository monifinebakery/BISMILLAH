// src/components/warehouse/utils/typeUtils.ts
// Utility functions for consistent type conversion in warehouse module

/**
 * Safely convert a value to number
 * @param value - The value to convert
 * @param defaultValue - The default value if conversion fails
 * @returns The converted number or default value
 */
export const toNumber = (value: unknown, defaultValue: number = 0): number => {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'number') return isNaN(value) ? defaultValue : value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  if (typeof value === 'boolean') return value ? 1 : 0;
  return defaultValue;
};

/**
 * Safely convert a value to string
 * @param value - The value to convert
 * @param defaultValue - The default value if conversion fails
 * @returns The converted string or default value
 */
export const toString = (value: unknown, defaultValue: string = ''): string => {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return defaultValue;
};

/**
 * Safely convert a value to Date
 * @param value - The value to convert
 * @returns The converted Date or undefined if conversion fails
 */
export const toDate = (value: unknown): Date | undefined => {
  if (value === null || value === undefined) return undefined;
  if (value instanceof Date) return isNaN(value.getTime()) ? undefined : value;
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  }
  return undefined;
};

/**
 * Safely convert a value to boolean
 * @param value - The value to convert
 * @returns The converted boolean
 */
export const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === 1 || value === '1') return true;
  if (value === 'false' || value === 0 || value === '0') return false;
  return Boolean(value);
};

/**
 * Validate if an object conforms to BahanBaku interface
 * @param obj - The object to validate
 * @returns True if object is a valid BahanBaku
 */
export const isBahanBaku = (obj: unknown): obj is import('../types').BahanBaku => {
  if (typeof obj !== 'object' || obj === null) return false;
  
  const bahan = obj as Partial<import('../types').BahanBaku>;
  
  return (
    typeof bahan.id === 'string' &&
    typeof bahan.user_id === 'string' &&
    typeof bahan.nama === 'string' &&
    typeof bahan.kategori === 'string' &&
    typeof bahan.stok === 'number' &&
    typeof bahan.satuan === 'string' &&
    typeof bahan.minimum === 'number' &&
    typeof bahan.harga_satuan === 'number' &&
    typeof bahan.supplier === 'string' &&
    (bahan.tanggal_kadaluwarsa === undefined || bahan.tanggal_kadaluwarsa instanceof Date || typeof bahan.tanggal_kadaluwarsa === 'string') &&
    bahan.created_at instanceof Date &&
    bahan.updated_at instanceof Date
  );
};

/**
 * Validate if an object conforms to BahanBakuFrontend interface
 * @param obj - The object to validate
 * @returns True if object is a valid BahanBakuFrontend
 */
export const isBahanBakuFrontend = (obj: unknown): obj is import('../types').BahanBakuFrontend => {
  if (typeof obj !== 'object' || obj === null) return false;
  
  const bahan = obj as Partial<import('../types').BahanBakuFrontend>;
  
  return (
    typeof bahan.id === 'string' &&
    typeof bahan.userId === 'string' &&
    typeof bahan.nama === 'string' &&
    typeof bahan.kategori === 'string' &&
    typeof bahan.stok === 'number' &&
    typeof bahan.satuan === 'string' &&
    typeof bahan.minimum === 'number' &&
    typeof bahan.harga === 'number' &&
    typeof bahan.supplier === 'string' &&
    (bahan.expiry === undefined || bahan.expiry instanceof Date) &&
    bahan.createdAt instanceof Date &&
    bahan.updatedAt instanceof Date
  );
};

/**
 * Ensure all numeric fields in BahanBaku are properly typed
 * @param bahan - The BahanBaku object to normalize
 * @returns Normalized BahanBaku object
 */
export const normalizeBahanBaku = (bahan: import('../types').BahanBaku): import('../types').BahanBaku => {
  return {
    ...bahan,
    stok: toNumber(bahan.stok),
    minimum: toNumber(bahan.minimum),
    harga_satuan: toNumber(bahan.harga_satuan),
    harga_rata_rata: bahan.harga_rata_rata !== undefined ? toNumber(bahan.harga_rata_rata) : undefined
  };
};

/**
 * Ensure all numeric fields in BahanBakuFrontend are properly typed
 * @param bahan - The BahanBakuFrontend object to normalize
 * @returns Normalized BahanBakuFrontend object
 */
export const normalizeBahanBakuFrontend = (bahan: import('../types').BahanBakuFrontend): import('../types').BahanBakuFrontend => {
  return {
    ...bahan,
    stok: toNumber(bahan.stok),
    minimum: toNumber(bahan.minimum),
    harga: toNumber(bahan.harga),
    hargaRataRata: bahan.hargaRataRata !== undefined ? toNumber(bahan.hargaRataRata) : undefined
  };
};