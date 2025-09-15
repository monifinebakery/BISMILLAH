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

    // Normalize to camelCase fields with legacy aliases for backward compatibility
    const totalNilai = (baseData as any).totalNilai ?? (baseData as any).total_nilai ?? 0;
    const metodePerhitungan = (baseData as any).metodePerhitungan ?? (baseData as any).metode_perhitungan ?? 'AVERAGE';

    const result: any = {
      ...(baseData as any),
      totalNilai,
      metodePerhitungan,
      // Keep legacy aliases to avoid breaking existing UI paths
      total_nilai: totalNilai,
      metode_perhitungan: metodePerhitungan,
      items
    };

    return result as Purchase;
  } catch (error) {
    logger.error('Error transforming purchase from DB:', error);
    return {
      id: dbItem?.id ?? 'error',
      userId: dbItem?.user_id ?? '',
      supplier: dbItem?.supplier ?? '',
      tanggal: new Date(),
      totalNilai: 0,
      total_nilai: 0,
      items: [],
      status: 'pending',
      metodePerhitungan: 'AVERAGE',
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
  // Ensure total_nilai is populated even if caller uses legacy snake_case
  const totalVal = Math.max(0, Number((p as any).totalNilai ?? (p as any).total_nilai) || 0);
  return {
    ...(baseData as any),
    total_nilai: totalVal,
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
  if ((p as any).totalNilai !== undefined || (p as any).total_nilai !== undefined) {
    const val = (p as any).totalNilai ?? (p as any).total_nilai;
    out.total_nilai = Math.max(0, Number(val) || 0);
  }
  if (p.status !== undefined) out.status = p.status;
  if ((p as any).metodePerhitungan !== undefined || (p as any).metode_perhitungan !== undefined) {
    out.metode_perhitungan = (p as any).metodePerhitungan ?? (p as any).metode_perhitungan;
  }

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
  totalNilai: Number(formData.totalNilai ?? formData.total_nilai) || 0, // FE camelCase with legacy fallback
  total_nilai: Number(formData.totalNilai ?? formData.total_nilai) || 0, // keep alias for compatibility
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
  totalNilai: Math.max(0, Number(data.totalNilai ?? data.total_nilai) || 0),
  total_nilai: Math.max(0, Number(data.totalNilai ?? data.total_nilai) || 0),
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
  metodePerhitungan: data.metodePerhitungan ?? data.metode_perhitungan ?? 'AVERAGE',
  metode_perhitungan: data.metodePerhitungan ?? data.metode_perhitungan ?? 'AVERAGE',
});
