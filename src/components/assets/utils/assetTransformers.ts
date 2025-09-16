// src/components/assets/utils/assetTransformers.ts

import { Asset, AssetCreateInput, AssetUpdateInput, DatabaseAsset, DatabaseAssetInput, DatabaseAssetUpdate } from '../types';
import { UnifiedDateHandler } from '@/utils/unifiedDateHandler';

/**
 * Parse date safely from various formats using UnifiedDateHandler
 */
export const safeParseDate = (dateValue: string | Date | null | undefined): Date | null => {
  const result = UnifiedDateHandler.parseDate(dateValue);
  return result.isValid && result.date ? result.date : null;
};

/**
 * Format date to YYYY-MM-DD for database storage using UnifiedDateHandler
 */
export const formatDateForDB = (date: Date | null): string | null => {
  return date ? UnifiedDateHandler.toDatabaseString(date) : null;
};

/**
 * Transform database asset (snake_case) to app asset (camelCase)
 */
export const transformAssetFromDB = (dbAsset: DatabaseAsset): Asset | null => {
  try {
    if (!dbAsset || !dbAsset.id) {
      console.warn('Invalid asset data received from database:', dbAsset);
      return null;
    }

    const tanggalPembelian = safeParseDate(dbAsset.tanggal_beli);
    const createdAt = safeParseDate(dbAsset.created_at);
    const updatedAt = safeParseDate(dbAsset.updated_at);

    if (!tanggalPembelian) {
      console.warn('Invalid tanggal_beli for asset:', dbAsset.id);
      return null;
    }

    return {
      id: dbAsset.id,
      nama: dbAsset.nama || '',
      kategori: dbAsset.kategori as Asset['kategori'],
      nilaiAwal: parseFloat(String(dbAsset.nilai_awal)) || 0,
      nilaiSaatIni: parseFloat(String(dbAsset.nilai_sekarang)) || 0,
      tanggalPembelian,
      kondisi: dbAsset.kondisi as Asset['kondisi'],
      lokasi: dbAsset.lokasi || '',
      deskripsi: dbAsset.deskripsi || null,
      depresiasi: dbAsset.depresiasi ? parseFloat(String(dbAsset.depresiasi)) : null,
      userId: dbAsset.user_id,
      createdAt: createdAt || new Date(),
      updatedAt: updatedAt || new Date(),
    };
  } catch (error) {
    console.error('Error transforming asset from DB:', error);
    return null;
  }
};

/**
 * Transform app asset create input to database format
 */
export const transformAssetForDB = (
  userId: string,
  asset: AssetCreateInput
): DatabaseAssetInput => {
  const tanggalBeli = formatDateForDB(asset.tanggalPembelian);
  
  if (!tanggalBeli) {
    throw new Error('Tanggal pembelian tidak valid');
  }

  return {
    user_id: userId,
    nama: asset.nama.trim(),
    kategori: asset.kategori,
    nilai_awal: asset.nilaiAwal,
    nilai_sekarang: asset.nilaiSaatIni,
    tanggal_beli: tanggalBeli,
    kondisi: asset.kondisi,
    lokasi: asset.lokasi.trim(),
    deskripsi: asset.deskripsi?.trim() || null,
    depresiasi: asset.depresiasi !== null && asset.depresiasi !== undefined && asset.depresiasi !== '' ? asset.depresiasi : null,
  };
};

/**
 * Transform app asset update input to database format
 */
export const transformAssetUpdateForDB = (asset: AssetUpdateInput): DatabaseAssetUpdate => {
  const updateData: DatabaseAssetUpdate = {};

  if (asset.nama !== undefined) {
    updateData.nama = asset.nama.trim();
  }
  
  if (asset.kategori !== undefined) {
    updateData.kategori = asset.kategori;
  }
  
  if (asset.nilaiAwal !== undefined) {
    updateData.nilai_awal = asset.nilaiAwal;
  }
  
  if (asset.nilaiSaatIni !== undefined) {
    updateData.nilai_sekarang = asset.nilaiSaatIni;
  }
  
  if (asset.tanggalPembelian !== undefined) {
    const tanggalBeli = formatDateForDB(asset.tanggalPembelian);
    if (!tanggalBeli) {
      throw new Error('Tanggal pembelian tidak valid');
    }
    updateData.tanggal_beli = tanggalBeli;
  }
  
  if (asset.kondisi !== undefined) {
    updateData.kondisi = asset.kondisi;
  }
  
  if (asset.lokasi !== undefined) {
    updateData.lokasi = asset.lokasi.trim();
  }
  
  if (asset.deskripsi !== undefined) {
    updateData.deskripsi = asset.deskripsi?.trim() || null;
  }
  
  if (asset.depresiasi !== undefined) {
    updateData.depresiasi = asset.depresiasi !== null && asset.depresiasi !== '' ? asset.depresiasi : null;
  }

  return updateData;
};

/**
 * Transform multiple database assets
 */
export const transformAssetsFromDB = (dbAssets: DatabaseAsset[]): Asset[] => {
  return dbAssets
    .map(transformAssetFromDB)
    .filter((asset): asset is Asset => asset !== null);
};