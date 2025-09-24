// src/utils/unitConversion.ts
// Sistem konversi satuan untuk normalisasi stok warehouse

export type UnitType = 'weight' | 'volume' | 'count';

export interface UnitDefinition {
  name: string;
  symbol: string;
  type: UnitType;
  toBase: number; // Konversi ke satuan dasar (terkecil)
  baseUnit: string; // Satuan dasar untuk tipe ini
}

export const UNIT_DEFINITIONS: Record<string, UnitDefinition> = {
  // Weight units (base: gram)
  'gram': { name: 'gram', symbol: 'g', type: 'weight', toBase: 1, baseUnit: 'g' },
  'kg': { name: 'kilogram', symbol: 'kg', type: 'weight', toBase: 1000, baseUnit: 'g' },
  'kilogram': { name: 'kilogram', symbol: 'kg', type: 'weight', toBase: 1000, baseUnit: 'g' },
  'ons': { name: 'ons', symbol: 'ons', type: 'weight', toBase: 100, baseUnit: 'g' },
  'kwintal': { name: 'kwintal', symbol: 'kw', type: 'weight', toBase: 100000, baseUnit: 'g' },
  'ton': { name: 'ton', symbol: 'ton', type: 'weight', toBase: 1000000, baseUnit: 'g' },

  // Volume units (base: ml)
  'ml': { name: 'mililiter', symbol: 'ml', type: 'volume', toBase: 1, baseUnit: 'ml' },
  'mililiter': { name: 'mililiter', symbol: 'ml', type: 'volume', toBase: 1, baseUnit: 'ml' },
  'liter': { name: 'liter', symbol: 'l', type: 'volume', toBase: 1000, baseUnit: 'ml' },
  'l': { name: 'liter', symbol: 'l', type: 'volume', toBase: 1000, baseUnit: 'ml' },
  'cc': { name: 'sentimeter kubik', symbol: 'cc', type: 'volume', toBase: 1, baseUnit: 'ml' },

  // Count units (base: pcs)
  'pcs': { name: 'pieces', symbol: 'pcs', type: 'count', toBase: 1, baseUnit: 'pcs' },
  'pieces': { name: 'pieces', symbol: 'pcs', type: 'count', toBase: 1, baseUnit: 'pcs' },
  'buah': { name: 'buah', symbol: 'buah', type: 'count', toBase: 1, baseUnit: 'pcs' },
  'biji': { name: 'biji', symbol: 'biji', type: 'count', toBase: 1, baseUnit: 'pcs' },
  'butir': { name: 'butir', symbol: 'butir', type: 'count', toBase: 1, baseUnit: 'pcs' },
  'lembar': { name: 'lembar', symbol: 'lembar', type: 'count', toBase: 1, baseUnit: 'pcs' },
  'keping': { name: 'keping', symbol: 'keping', type: 'count', toBase: 1, baseUnit: 'pcs' },
};

/**
 * Mendapatkan definisi unit dari nama/symbol
 */
export const getUnitDefinition = (unit: string): UnitDefinition | null => {
  const normalized = unit.toLowerCase().trim();
  return UNIT_DEFINITIONS[normalized] || null;
};

/**
 * Mengecek apakah dua unit kompatibel (sama type)
 */
export const areUnitsCompatible = (unit1: string, unit2: string): boolean => {
  const def1 = getUnitDefinition(unit1);
  const def2 = getUnitDefinition(unit2);

  if (!def1 || !def2) return false;
  return def1.type === def2.type;
};

/**
 * Mengkonversi nilai dari satu unit ke unit lain dalam type yang sama
 */
export const convertUnits = (
  value: number,
  fromUnit: string,
  toUnit: string
): number | null => {
  const fromDef = getUnitDefinition(fromUnit);
  const toDef = getUnitDefinition(toUnit);

  if (!fromDef || !toDef) return null;
  if (fromDef.type !== toDef.type) return null;

  // Konversi ke base unit dulu, lalu ke target unit
  const baseValue = value * fromDef.toBase;
  return baseValue / toDef.toBase;
};

/**
 * Mengkonversi nilai ke satuan dasar (terkecil)
 */
export const convertToBaseUnit = (value: number, unit: string): number | null => {
  const def = getUnitDefinition(unit);
  if (!def) return null;
  return value * def.toBase;
};

/**
 * Mendapatkan satuan dasar untuk tipe unit tertentu
 */
export const getBaseUnit = (unit: string): string | null => {
  const def = getUnitDefinition(unit);
  return def ? def.baseUnit : null;
};

/**
 * Format nilai dengan unit yang sesuai
 */
export const formatWithUnit = (value: number, unit: string): string => {
  const def = getUnitDefinition(unit);
  if (def) {
    return `${value.toLocaleString('id-ID')} ${def.symbol}`;
  }
  return `${value.toLocaleString('id-ID')} ${unit}`;
};

/**
 * Normalisasi satuan untuk warehouse item
 * Mengembalikan satuan yang paling kecil untuk konsistensi
 */
export const normalizeWarehouseUnit = (currentUnit: string): string => {
  const def = getUnitDefinition(currentUnit);
  return def ? def.baseUnit : currentUnit;
};

/**
 * Mengkonversi semua stok ke satuan dasar untuk perbandingan
 */
export const normalizeStockValue = (
  stock: number,
  unit: string
): { value: number; unit: string } | null => {
  const baseValue = convertToBaseUnit(stock, unit);
  const baseUnit = getBaseUnit(unit);

  if (baseValue === null || !baseUnit) return null;

  return {
    value: baseValue,
    unit: baseUnit
  };
};
