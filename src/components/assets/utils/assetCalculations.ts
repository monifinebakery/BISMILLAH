// src/components/assets/utils/assetCalculations.ts

import { Asset, AssetStatistics, AssetCategory, AssetCondition } from '../types';

/**
 * Calculate total statistics from assets array
 */
export const calculateAssetStatistics = (assets: Asset[]): AssetStatistics => {
  if (!Array.isArray(assets) || assets.length === 0) {
    return {
      totalAssets: 0,
      totalNilaiAwal: 0,
      totalNilaiSaatIni: 0,
      totalDepresiasi: 0,
      assetsByCategory: {
        'Peralatan': 0,
        'Kendaraan': 0,
        'Bangunan': 0,
        'Mesin': 0,
        'Lain-lain': 0,
      },
      assetsByCondition: {
        'Baik': 0,
        'Rusak Ringan': 0,
        'Rusak Berat': 0,
      },
    };
  }

  // Filter valid assets
  const validAssets = assets.filter(asset => 
    asset && 
    asset.tanggalPembelian instanceof Date && 
    !isNaN(asset.tanggalPembelian.getTime()) &&
    typeof asset.nilaiAwal === 'number' &&
    typeof asset.nilaiSaatIni === 'number'
  );

  // Calculate totals
  const totalNilaiAwal = validAssets.reduce((sum, asset) => sum + (asset.nilaiAwal || 0), 0);
  const totalNilaiSaatIni = validAssets.reduce((sum, asset) => sum + (asset.nilaiSaatIni || 0), 0);
  const totalDepresiasi = validAssets.reduce((sum, asset) => sum + (asset.depresiasi || 0), 0);

  // Count by category
  const assetsByCategory: Record<AssetCategory, number> = {
    'Peralatan': 0,
    'Kendaraan': 0,
    'Bangunan': 0,
    'Mesin': 0,
    'Lain-lain': 0,
  };

  // Count by condition
  const assetsByCondition: Record<AssetCondition, number> = {
    'Baik': 0,
    'Rusak Ringan': 0,
    'Rusak Berat': 0,
  };

  validAssets.forEach(asset => {
    if (asset.kategori && Object.prototype.hasOwnProperty.call(assetsByCategory, asset.kategori)) {
      assetsByCategory[asset.kategori]++;
    }
    
    if (asset.kondisi && Object.prototype.hasOwnProperty.call(assetsByCondition, asset.kondisi)) {
      assetsByCondition[asset.kondisi]++;
    }
  });

  return {
    totalAssets: validAssets.length,
    totalNilaiAwal,
    totalNilaiSaatIni,
    totalDepresiasi,
    assetsByCategory,
    assetsByCondition,
  };
};

/**
 * Calculate depreciation percentage for an asset
 */
export const calculateDepreciationPercentage = (nilaiAwal: number, nilaiSaatIni: number): number => {
  if (!nilaiAwal || nilaiAwal <= 0) return 0;
  
  const depreciation = ((nilaiAwal - nilaiSaatIni) / nilaiAwal) * 100;
  return Math.max(0, Math.min(100, depreciation)); // Clamp between 0-100
};

/**
 * Calculate asset value after depreciation
 */
export const calculateCurrentValue = (nilaiAwal: number, depreciationPercentage: number): number => {
  if (!nilaiAwal || nilaiAwal <= 0 || !depreciationPercentage) return nilaiAwal;
  
  const depreciation = Math.max(0, Math.min(100, depreciationPercentage)); // Clamp between 0-100
  return nilaiAwal - (nilaiAwal * depreciation / 100);
};

/**
 * Calculate asset age in years
 */
export const calculateAssetAge = (tanggalPembelian: Date): number => {
  if (!tanggalPembelian || !(tanggalPembelian instanceof Date)) return 0;
  
  const today = new Date();
  const ageInMs = today.getTime() - tanggalPembelian.getTime();
  const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25); // Include leap years
  
  return Math.max(0, ageInYears);
};

/**
 * Get assets by condition
 */
export const getAssetsByCondition = (assets: Asset[], condition: AssetCondition): Asset[] => {
  return assets.filter(asset => asset.kondisi === condition);
};

/**
 * Get assets by category
 */
export const getAssetsByCategory = (assets: Asset[], category: AssetCategory): Asset[] => {
  return assets.filter(asset => asset.kategori === category);
};

/**
 * Sort assets by various criteria
 */
export const sortAssets = (
  assets: Asset[], 
  sortBy: 'nama' | 'nilaiAwal' | 'nilaiSaatIni' | 'tanggalPembelian' | 'kategori' | 'kondisi',
  direction: 'asc' | 'desc' = 'asc'
): Asset[] => {
  return [...assets].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'nama':
        comparison = a.nama.localeCompare(b.nama);
        break;
      case 'nilaiAwal':
        comparison = a.nilaiAwal - b.nilaiAwal;
        break;
      case 'nilaiSaatIni':
        comparison = a.nilaiSaatIni - b.nilaiSaatIni;
        break;
      case 'tanggalPembelian':
        comparison = a.tanggalPembelian.getTime() - b.tanggalPembelian.getTime();
        break;
      case 'kategori':
        comparison = a.kategori.localeCompare(b.kategori);
        break;
      case 'kondisi':
        comparison = a.kondisi.localeCompare(b.kondisi);
        break;
      default:
        comparison = 0;
    }
    
    return direction === 'desc' ? -comparison : comparison;
  });
};

/**
 * Filter assets by value range
 */
export const filterAssetsByValueRange = (
  assets: Asset[], 
  minValue: number, 
  maxValue: number,
  valueType: 'nilaiAwal' | 'nilaiSaatIni' = 'nilaiSaatIni'
): Asset[] => {
  return assets.filter(asset => {
    const value = asset[valueType];
    return value >= minValue && value <= maxValue;
  });
};

/**
 * Search assets by text
 */
export const searchAssets = (assets: Asset[], searchTerm: string): Asset[] => {
  if (!searchTerm.trim()) return assets;
  
  const term = searchTerm.toLowerCase().trim();
  
  return assets.filter(asset => 
    asset.nama.toLowerCase().includes(term) ||
    asset.kategori.toLowerCase().includes(term) ||
    asset.kondisi.toLowerCase().includes(term) ||
    asset.lokasi.toLowerCase().includes(term) ||
    (asset.deskripsi && asset.deskripsi.toLowerCase().includes(term))
  );
};
