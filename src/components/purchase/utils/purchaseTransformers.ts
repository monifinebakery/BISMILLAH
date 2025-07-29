// src/components/purchase/utils/purchaseTransformers.ts

import { Purchase, CreatePurchaseRequest } from '../types/purchase.types';
import { safeParseDate, toSafeISOString } from '@/utils/unifiedDateUtils';

/**
 * Transform database purchase data to frontend Purchase type
 */
export const transformPurchaseFromDB = (dbItem: any): Purchase => {
  try {
    if (!dbItem || typeof dbItem !== 'object') {
      console.error('Invalid purchase data from DB:', dbItem);
      throw new Error('Invalid purchase data format');
    }

    return {
      id: dbItem.id || '',
      userId: dbItem.user_id || '',
      supplier: dbItem.supplier || '',
      tanggal: safeParseDate(dbItem.tanggal) || new Date(),
      totalNilai: Number(dbItem.total_nilai) || 0,
      items: Array.isArray(dbItem.items) ? dbItem.items : [],
      status: dbItem.status || 'pending',
      metodePerhitungan: dbItem.metode_perhitungan || 'FIFO',
      createdAt: safeParseDate(dbItem.created_at) || new Date(),
      updatedAt: safeParseDate(dbItem.updated_at) || new Date(),
    };
  } catch (error) {
    console.error('Error transforming purchase from DB:', error, dbItem);
    
    // Return safe fallback
    return {
      id: dbItem?.id || 'error',
      userId: dbItem?.user_id || '',
      supplier: 'Error Loading',
      tanggal: new Date(),
      totalNilai: 0,
      items: [],
      status: 'pending',
      metodePerhitungan: 'FIFO',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
};

/**
 * Transform frontend Purchase data to database format
 */
export const transformPurchaseForDB = (
  purchase: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  userId: string
): CreatePurchaseRequest => {
  return {
    user_id: userId,
    supplier: purchase.supplier,
    tanggal: toSafeISOString(purchase.tanggal) || toSafeISOString(new Date()),
    total_nilai: purchase.totalNilai,
    items: purchase.items,
    status: purchase.status || 'pending',
    metode_perhitungan: purchase.metodePerhitungan || 'FIFO',
  };
};

/**
 * Transform purchase update data for database
 */
export const transformPurchaseUpdateForDB = (
  updatedData: Partial<Purchase>
): { [key: string]: any } => {
  const dbUpdate: { [key: string]: any } = {
    updated_at: new Date().toISOString(),
  };

  // Map frontend fields to database fields
  if (updatedData.supplier !== undefined) {
    dbUpdate.supplier = updatedData.supplier;
  }
  
  if (updatedData.totalNilai !== undefined) {
    dbUpdate.total_nilai = updatedData.totalNilai;
  }
  
  if (updatedData.tanggal !== undefined) {
    dbUpdate.tanggal = toSafeISOString(updatedData.tanggal);
  }
  
  if (updatedData.items !== undefined) {
    dbUpdate.items = updatedData.items;
  }
  
  if (updatedData.status !== undefined) {
    dbUpdate.status = updatedData.status;
  }
  
  if (updatedData.metodePerhitungan !== undefined) {
    dbUpdate.metode_perhitungan = updatedData.metodePerhitungan;
  }

  return dbUpdate;
};

/**
 * Safely transform array of database purchases
 */
export const transformPurchasesFromDB = (dbItems: any[]): Purchase[] => {
  if (!Array.isArray(dbItems)) {
    console.error('Expected array but got:', typeof dbItems);
    return [];
  }

  return dbItems
    .map(item => {
      try {
        return transformPurchaseFromDB(item);
      } catch (error) {
        console.error('Error transforming individual purchase:', error, item);
        return null;
      }
    })
    .filter((item): item is Purchase => item !== null);
};

/**
 * Transform real-time payload from Supabase
 */
export const transformRealtimePayload = (payload: any): Purchase | null => {
  try {
    if (!payload || !payload.new) {
      return null;
    }

    return transformPurchaseFromDB(payload.new);
  } catch (error) {
    console.error('Error transforming realtime payload:', error, payload);
    return null;
  }
};

/**
 * Calculate item subtotal safely
 */
export const calculateItemSubtotal = (kuantitas: number, hargaSatuan: number): number => {
  const qty = Number(kuantitas) || 0;
  const price = Number(hargaSatuan) || 0;
  return qty * price;
};

/**
 * Calculate purchase total from items
 */
export const calculatePurchaseTotal = (items: any[]): number => {
  if (!Array.isArray(items)) return 0;
  
  return items.reduce((total, item) => {
    const subtotal = calculateItemSubtotal(item.kuantitas, item.hargaSatuan);
    return total + subtotal;
  }, 0);
};

/**
 * Normalize purchase form data
 */
export const normalizePurchaseFormData = (formData: any): any => {
  return {
    ...formData,
    totalNilai: Number(formData.totalNilai) || 0,
    tanggal: formData.tanggal instanceof Date ? formData.tanggal : new Date(formData.tanggal),
    items: Array.isArray(formData.items) ? formData.items.map(item => ({
      ...item,
      kuantitas: Number(item.kuantitas) || 0,
      hargaSatuan: Number(item.hargaSatuan) || 0,
      subtotal: calculateItemSubtotal(item.kuantitas, item.hargaSatuan),
    })) : [],
  };
};

/**
 * Sanitize purchase data for storage
 */
export const sanitizePurchaseData = (data: any): any => {
  return {
    supplier: String(data.supplier || '').trim(),
    tanggal: data.tanggal,
    totalNilai: Math.max(0, Number(data.totalNilai) || 0),
    items: Array.isArray(data.items) ? data.items.map(item => ({
      bahanBakuId: String(item.bahanBakuId || ''),
      nama: String(item.nama || '').trim(),
      kuantitas: Math.max(0, Number(item.kuantitas) || 0),
      satuan: String(item.satuan || '').trim(),
      hargaSatuan: Math.max(0, Number(item.hargaSatuan) || 0),
      subtotal: Math.max(0, Number(item.subtotal) || 0),
      keterangan: item.keterangan ? String(item.keterangan).trim() : undefined,
    })) : [],
    status: data.status || 'pending',
    metodePerhitungan: data.metodePerhitungan || 'FIFO',
  };
};