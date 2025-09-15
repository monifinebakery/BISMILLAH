// src/components/purchase/utils/purchaseTransformers.ts
import { Purchase, PurchaseItem } from '../types/purchase.types';
import { logger } from '@/utils/logger';
import { UserFriendlyDate } from '@/utils/userFriendlyDate';
import { parseRobustNumber, parseQuantity, parsePrice } from '@/utils/robustNumberParser';
import {
  transformFromDB,
  transformToDB,
  transformArrayFromDB,
  PURCHASE_FIELD_MAPPINGS,
  PURCHASE_ITEM_FIELD_MAPPINGS,
  COMMON_VALIDATORS
} from '@/utils/unifiedTransformers';

/** Helper: format ke 'YYYY-MM-DD' untuk kolom DATE di DB using UserFriendlyDate */
const toYMD = (d: Date | string | null | undefined): string => {
  if (!d) return UserFriendlyDate.toYMD(new Date());
  
  try {
    // Use UserFriendlyDate for safe parsing and formatting
    const parsedDate = UserFriendlyDate.safeParseToDate(d);
    return UserFriendlyDate.toYMD(parsedDate);
  } catch (error) {
    logger.error('Error in toYMD conversion:', error, d);
    return UserFriendlyDate.toYMD(new Date());
  }
};

/** ==== Helpers untuk packaging & harga ==== */
const toNumber = (v: any, def = 0) => parseRobustNumber(v, def);

/** Hitung harga_per_satuan dari data kemasan jika ada */
const deriveUnitPriceFromPackaging = (row: any): number | null => {
  // Function removed as packaging fields are no longer used
  return null;
};

/** ✅ HARDENED: Robust item mapper untuk DB format */
const mapItemForDB = (i: any) => {
  // Add logging to track quantity values before conversion
  console.log('DEBUG: Item before conversion:', {
    nama: i.nama,
    rawKuantitas: i.kuantitas,
    rawJumlah: i.jumlah,
    rawQtyBase: i.qty_base,
    typeKuantitas: typeof i.kuantitas,
  });
  
  // Use robust number parsing for better data handling
  const kuantitasRaw = i.quantity ?? i.kuantitas ?? i.jumlah ?? i.qty_base;
  const jumlah = parseQuantity(kuantitasRaw);

  const hargaRaw = i.unitPrice ?? i.harga_satuan ?? i.harga_per_satuan;
  const hargaPerSatuan = parsePrice(hargaRaw);

  const satuan = String(
    i.satuan ??
    i.base_unit ?? // fallback dari komponen lama
    ''
  ).trim();

  const subtotal = i.subtotal !== undefined
    ? Number(i.subtotal)
    : jumlah * hargaPerSatuan;

// Log final values after processing
  console.log('DEBUG: Item after conversion:', {
    nama: i.nama,
    processedJumlah: jumlah,
    finalJumlah: Math.max(0, jumlah),
    isJumlahValid: !isNaN(jumlah) && jumlah > 0,
  });
  
  return {
    // ✅ KOLOM WAJIB: yang dibaca trigger WAC
    bahan_baku_id: String((i.bahanBakuId ?? i.bahan_baku_id) || ''),
    jumlah: Math.max(0, jumlah),
    harga_per_satuan: Math.max(0, hargaPerSatuan),

    // ✅ METADATA: tambahan yang aman disimpan
    nama: String(i.nama ?? '').trim(),
    satuan,
    subtotal: Math.max(0, subtotal),
    keterangan: i.keterangan ? String(i.keterangan).trim() : null,
  };
};

/** Bentuk baris DB (after select) */
type DbPurchaseRow = {
  id: string;
  user_id: string;
  supplier: string;
  tanggal: string; // 'YYYY-MM-DD'
  total_nilai: number;
  items: any; // jsonb array
  status: 'pending' | 'completed' | 'cancelled';
  metode_perhitungan: 'AVERAGE';
  created_at: string;
  updated_at: string;
};

/** ==== FRONTEND <- DB ==== */
export const transformPurchaseFromDB = (dbItem: any): Purchase => {
  try {
    const baseData = transformFromDB(dbItem, PURCHASE_FIELD_MAPPINGS.fromDB);

    // ✅ FIXED: Use unified transformer for items with debug logging
    const items: PurchaseItem[] = Array.isArray(dbItem.items)
      ? dbItem.items.map((item: any) => {
          console.log('🔧 [PURCHASE TRANSFORM] DB Item:', item);
          const transformedItem = transformFromDB(item, PURCHASE_ITEM_FIELD_MAPPINGS.fromDB);
          console.log('🔧 [PURCHASE TRANSFORM] Transformed Item:', transformedItem);
          return transformedItem;
        })
      : [];

    return {
      ...(baseData as any),
      items
    };
  } catch (error) {
    logger.error('Error transforming purchase from DB:', error);
    return {
      id: dbItem?.id ?? 'error',
      userId: dbItem?.user_id ?? '',
      supplier: dbItem?.supplier ?? '',
      tanggal: new Date(),
      total_nilai: 0,
      items: [],
      status: 'pending',
      metode_perhitungan: 'AVERAGE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
};

/** ==== DB <- FRONTEND (INSERT) ==== */
export const transformPurchaseForDB = (
  p: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  userId: string
) => {
  const baseData = transformToDB({...p, userId}, PURCHASE_FIELD_MAPPINGS.toDB);
  
  return {
    ...(baseData as any),
    // ✅ FIXED: Use unified transformer instead of legacy mapItemForDB
    items: (p.items ?? []).map((item: any) => {
      console.log('🔧 [PURCHASE TRANSFORM TO DB] Item:', item);
      const transformedItem = transformToDB(item, PURCHASE_ITEM_FIELD_MAPPINGS.toDB);
      console.log('🔧 [PURCHASE TRANSFORM TO DB] Transformed Item:', transformedItem);
      return transformedItem;
    }),
  };
};

/** ==== DB <- FRONTEND (UPDATE) ==== */
export const transformPurchaseUpdateForDB = (p: Partial<Purchase>) => {
  const out: Record<string, any> = { updated_at: new Date().toISOString() };

  if (p.supplier !== undefined) out.supplier = String(p.supplier || '').trim();
  if (p.tanggal !== undefined) out.tanggal = toYMD(p.tanggal as any);
  if (p.total_nilai !== undefined) out.total_nilai = Math.max(0, Number(p.total_nilai) || 0); // ✅ FIX: Use consistent field name
  if (p.status !== undefined) out.status = p.status;
  if (p.metode_perhitungan !== undefined) out.metode_perhitungan = p.metode_perhitungan;

  if (p.items !== undefined) {
    // ✅ FIXED: Use unified transformer untuk update
    out.items = (p.items ?? []).map((item: any) => transformToDB(item, PURCHASE_ITEM_FIELD_MAPPINGS.toDB));
  }
  return out;
};

/** Array transform helper */
export const transformPurchasesFromDB = (rows: any[]): Purchase[] =>
  (rows ?? []).map(transformPurchaseFromDB);

/** Utilitas tambahan (tetap dipakai di UI) */
export const calculateItemSubtotal = (kuantitas: number, unitPrice: number): number =>
  (Number(kuantitas) || 0) * (Number(unitPrice) || 0);

export const calculatePurchaseTotal = (items: any[]): number =>
  Array.isArray(items)
    ? items.reduce((acc, it) => {
        // pakai subtotal jika ada (lebih akurat), fallback kalkulasi
        const s =
          it.subtotal !== undefined && it.subtotal !== null
            ? toNumber(it.subtotal)
            : calculateItemSubtotal(toNumber(it.quantity ?? it.kuantitas ?? it.qty_base), toNumber(it.unitPrice ?? it.harga_satuan ?? it.harga_per_satuan));
        return acc + s;
      }, 0)
    : 0;

export const normalizePurchaseFormData = (formData: any): any => ({
  ...formData,
  total_nilai: Number(formData.total_nilai) || 0, // ✅ FIX: Use consistent field name
  tanggal:
    formData.tanggal instanceof Date ? formData.tanggal : new Date(formData.tanggal),
  items: Array.isArray(formData.items)
    ? formData.items.map((item: any) => {
        const qty = toNumber(item.quantity ?? item.qty_base);
        const price =
          toNumber(item.unitPrice ?? item.harga_per_satuan);
        return {
          ...item,
          kuantitas: qty,
          qty_base: qty,
          satuan: item.satuan ?? item.base_unit ?? '',
          base_unit: item.base_unit ?? item.satuan ?? '',
          unitPrice: price,
          harga_per_satuan: price,
          subtotal: item.subtotal !== undefined ? toNumber(item.subtotal) : qty * price,
        };
      })
    : [],
});

/** ✅ HARDENED: Perketat sanitisasi form dengan fallback konsisten */
export const sanitizePurchaseData = (data: any): any => ({
  supplier: String(data.supplier || '').trim(),
  tanggal: data.tanggal,
  total_nilai: Math.max(0, Number(data.total_nilai) || 0), // ✅ FIX: Use consistent field name
  items: Array.isArray(data.items)
    ? data.items.map((item: any) => {
        const kuantitas = Number(
          item.quantity ?? 
          item.jumlah ?? 
          item.qty_base ?? 
          0
        );
        const unitPrice = Number(
          item.unitPrice ?? 
          item.harga_per_satuan ?? 
          item.price_unit ?? 
          0
        );
        const satuan = String(
          item.satuan ?? 
          item.base_unit ?? 
          ''
        ).trim();

        return {
          bahanBakuId: String((item.bahanBakuId ?? item.bahan_baku_id) || ''),
          nama: String(item.nama || '').trim(),
          kuantitas: Math.max(0, kuantitas),
          satuan,
          unitPrice: Math.max(0, unitPrice),
          subtotal: Math.max(0, Number(item.subtotal ?? (kuantitas * unitPrice)) || 0),
          keterangan: item.keterangan ? String(item.keterangan).trim() : undefined,
        };
      })
    : [],
  status: data.status || 'pending',
  metode_perhitungan: data.metode_perhitungan || 'AVERAGE',
});