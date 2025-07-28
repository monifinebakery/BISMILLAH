// src/components/warehouse/context/utils/transformers.ts
import { BahanBaku } from '../../types/warehouse';
import { parseDate } from '@/utils/unifiedDateUtils';
import { logger } from '@/utils/logger';

export const transformBahanBakuFromDB = (dbItem: any): BahanBaku => {
  try {
    if (!dbItem || typeof dbItem !== 'object') {
      logger.error('Transformers', 'Invalid DB item for transformation:', dbItem);
      throw new Error('Invalid bahan baku data from database');
    }

    return {
      id: dbItem.id,
      nama: dbItem.nama || '',
      kategori: dbItem.kategori || '',
      stok: Number(dbItem.stok) || 0,
      satuan: dbItem.satuan || '',
      hargaSatuan: Number(dbItem.harga_satuan) || 0,
      minimum: Number(dbItem.minimum) || 0,
      supplier: dbItem.supplier || '',
      tanggalKadaluwarsa: parseDate(dbItem.tanggal_kadaluwarsa),
      userId: dbItem.user_id,
      createdAt: parseDate(dbItem.created_at) || new Date(),
      updatedAt: parseDate(dbItem.updated_at) || new Date(),
      jumlahBeliKemasan: Number(dbItem.jumlah_beli_kemasan) || 0,
      satuanKemasan: dbItem.satuan_kemasan || '',
      hargaTotalBeliKemasan: Number(dbItem.harga_total_beli_kemasan) || 0,
    };
  } catch (error) {
    logger.error('Transformers', 'Error transforming bahan baku from DB:', error, dbItem);
    
    // Return a safe fallback with minimal valid data
    return {
      id: dbItem?.id || `error-${Date.now()}`,
      nama: dbItem?.nama || 'Error Item',
      kategori: dbItem?.kategori || 'Error',
      stok: 0,
      satuan: dbItem?.satuan || '',
      hargaSatuan: 0,
      minimum: 0,
      supplier: dbItem?.supplier || '',
      tanggalKadaluwarsa: null,
      userId: dbItem?.user_id || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      jumlahBeliKemasan: 0,
      satuanKemasan: dbItem?.satuan_kemasan || '',
      hargaTotalBeliKemasan: 0,
    };
  }
};

export const transformBahanBakuToDB = (bahan: Partial<BahanBaku>): { [key: string]: any } => {
  try {
    const dbItem: { [key: string]: any } = {};
    
    // Only include defined values to avoid overwriting with undefined
    if (bahan.nama !== undefined) dbItem.nama = bahan.nama;
    if (bahan.kategori !== undefined) dbItem.kategori = bahan.kategori;
    if (bahan.stok !== undefined) dbItem.stok = Number(bahan.stok) || 0;
    if (bahan.satuan !== undefined) dbItem.satuan = bahan.satuan;
    if (bahan.hargaSatuan !== undefined) dbItem.harga_satuan = Number(bahan.hargaSatuan) || 0;
    if (bahan.minimum !== undefined) dbItem.minimum = Number(bahan.minimum) || 0;
    if (bahan.supplier !== undefined) dbItem.supplier = bahan.supplier;
    
    if (bahan.tanggalKadaluwarsa !== undefined) {
      dbItem.tanggal_kadaluwarsa = bahan.tanggalKadaluwarsa;
    }
    
    if (bahan.jumlahBeliKemasan !== undefined) {
      dbItem.jumlah_beli_kemasan = Number(bahan.jumlahBeliKemasan) || 0;
    }
    
    if (bahan.satuanKemasan !== undefined) {
      dbItem.satuan_kemasan = bahan.satuanKemasan;
    }
    
    if (bahan.hargaTotalBeliKemasan !== undefined) {
      dbItem.harga_total_beli_kemasan = Number(bahan.hargaTotalBeliKemasan) || 0;
    }
    
    return dbItem;
  } catch (error) {
    logger.error('Transformers', 'Error transforming bahan baku to DB:', error, bahan);
    
    // Return safe minimal data
    return {
      nama: bahan.nama || 'Error Item',
      stok: Number(bahan.stok) || 0,
      kategori: bahan.kategori || 'Error',
      satuan: bahan.satuan || '',
      harga_satuan: Number(bahan.hargaSatuan) || 0,
      minimum: Number(bahan.minimum) || 0,
      supplier: bahan.supplier || '',
    };
  }
};

export const validateBahanBakuData = (bahan: Partial<BahanBaku>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required fields
  if (!bahan.nama || bahan.nama.trim().length === 0) {
    errors.push('Nama bahan baku wajib diisi');
  }

  if (!bahan.kategori || bahan.kategori.trim().length === 0) {
    errors.push('Kategori wajib diisi');
  }

  if (!bahan.satuan || bahan.satuan.trim().length === 0) {
    errors.push('Satuan wajib diisi');
  }

  // Numeric validations
  if (bahan.stok !== undefined && (isNaN(Number(bahan.stok)) || Number(bahan.stok) < 0)) {
    errors.push('Stok harus berupa angka positif');
  }

  if (bahan.minimum !== undefined && (isNaN(Number(bahan.minimum)) || Number(bahan.minimum) < 0)) {
    errors.push('Minimum stok harus berupa angka positif');
  }

  if (bahan.hargaSatuan !== undefined && (isNaN(Number(bahan.hargaSatuan)) || Number(bahan.hargaSatuan) < 0)) {
    errors.push('Harga satuan harus berupa angka positif');
  }

  if (bahan.jumlahBeliKemasan !== undefined && (isNaN(Number(bahan.jumlahBeliKemasan)) || Number(bahan.jumlahBeliKemasan) < 0)) {
    errors.push('Jumlah beli kemasan harus berupa angka positif');
  }

  if (bahan.hargaTotalBeliKemasan !== undefined && (isNaN(Number(bahan.hargaTotalBeliKemasan)) || Number(bahan.hargaTotalBeliKemasan) < 0)) {
    errors.push('Harga total beli kemasan harus berupa angka positif');
  }

  // Date validation
  if (bahan.tanggalKadaluwarsa !== undefined && bahan.tanggalKadaluwarsa !== null) {
    const expiryDate = new Date(bahan.tanggalKadaluwarsa);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isNaN(expiryDate.getTime())) {
      errors.push('Format tanggal kadaluwarsa tidak valid');
    } else if (expiryDate <= today) {
      errors.push('Tanggal kadaluwarsa harus lebih dari hari ini');
    }
  }

  // String length validations
  if (bahan.nama && bahan.nama.length > 255) {
    errors.push('Nama bahan baku tidak boleh lebih dari 255 karakter');
  }

  if (bahan.kategori && bahan.kategori.length > 100) {
    errors.push('Kategori tidak boleh lebih dari 100 karakter');
  }

  if (bahan.supplier && bahan.supplier.length > 255) {
    errors.push('Nama supplier tidak boleh lebih dari 255 karakter');
  }

  if (bahan.satuan && bahan.satuan.length > 50) {
    errors.push('Satuan tidak boleh lebih dari 50 karakter');
  }

  if (bahan.satuanKemasan && bahan.satuanKemasan.length > 50) {
    errors.push('Satuan kemasan tidak boleh lebih dari 50 karakter');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};