// src/components/purchase/utils/purchaseTransformers.ts
import { Purchase, PurchaseItem } from '../types/purchase.types';
import { safeParseDate } from '@/utils/unifiedDateUtils';
import { logger } from '@/utils/logger';
import { UserFriendlyDate } from '@/utils/userFriendlyDate';

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
const toNumber = (v: any, def = 0) => (v === null || v === undefined || v === '' ? def : Number(v));

/** Hitung harga_per_satuan dari data kemasan jika ada */
const deriveUnitPriceFromPackaging = (row: any): number | null => {
  // Function removed as packaging fields are no longer used
  return null;
};

/** ✅ HARDENED: Robust item mapper untuk DB format */
const mapItemForDB = (i: any) => {
  const jumlah = Number(
    i.kuantitas ??
    i.jumlah ??
    i.qty_base ?? // fallback dari komponen lama
    0
  );

  const hargaPerSatuan = Number(
    i.hargaSatuan ??
    i.harga_per_satuan ??
    0
  );

  const satuan = String(
    i.satuan ??
    i.base_unit ?? // fallback dari komponen lama
    ''
  ).trim();

  const subtotal = i.subtotal !== undefined
    ? Number(i.subtotal)
    : jumlah * hargaPerSatuan;

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
    const row = dbItem as DbPurchaseRow;

    // 🔍 DEBUG: Log raw purchase data for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [TRANSFORM] Raw purchase data from DB:', {
        id: row.id,
        supplier: row.supplier,
        total_nilai: row.total_nilai,
        items_raw: row.items,
        items_type: typeof row.items,
        items_is_array: Array.isArray(row.items),
        items_length: Array.isArray(row.items) ? row.items.length : 'not array',
        items_string_length: typeof row.items === 'string' ? row.items.length : 'not string'
      });
      
      // Additional debugging for items
      if (Array.isArray(row.items)) {
        console.log('🔍 [TRANSFORM] Items array details:', row.items.map((item, idx) => ({
          index: idx,
          raw: item,
          nama: item?.nama,
          bahan_baku_id: item?.bahan_baku_id,
          jumlah: item?.jumlah,
          harga_per_satuan: item?.harga_per_satuan
        })));
      }
    }

    const items: PurchaseItem[] = Array.isArray(row.items)
      ? row.items.map((i: any, itemIndex: number) => {
          // dukung key lama & baru
          const qtyBase = toNumber(i.qty_base ?? i.jumlah ?? i.kuantitas);
          const baseUnit = i.base_unit ?? i.satuan ?? '';
          const hargaPerSatuan =
            toNumber(i.harga_per_satuan ?? i.hargaSatuan);

          const subtotal =
            i.subtotal !== undefined && i.subtotal !== null
              ? toNumber(i.subtotal)
              : qtyBase * hargaPerSatuan;

          // simpan juga info kemasan bila ada (opsional untuk UI)
          const out: any = {
            // shape lama agar kompatibel UI
            bahanBakuId: i.bahan_baku_id ?? i.bahanBakuId ?? '',
            nama: i.nama ?? '',
            kuantitas: qtyBase,
            satuan: baseUnit,
            hargaSatuan: hargaPerSatuan,
            subtotal,
            keterangan: i.keterangan ?? i.catatan ?? undefined,

            // simpan juga field baru (opsional)
            qty_base: qtyBase,
            base_unit: baseUnit,
            harga_per_satuan: hargaPerSatuan,
          };
          
          // 🔍 DEBUG: Log each item transformation
          if (process.env.NODE_ENV === 'development') {
            console.log(`🔍 [TRANSFORM] Item ${itemIndex} transformation:`, {
              input: i,
              output: out,
              nama_empty: !out.nama || out.nama === '',
              kuantitas_zero: out.kuantitas === 0,
              harga_zero: out.hargaSatuan === 0
            });
          }
          
          return out as PurchaseItem;
        })
      : [];
      
    // 🔍 DEBUG: Log final transformed items
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 [TRANSFORM] Final transformed items for purchase:', row.id, {
        items_count: items.length,
        items_summary: items.map(item => ({
          nama: item.nama,
          kuantitas: item.kuantitas,
          hargaSatuan: item.hargaSatuan,
          has_nama: !!item.nama && item.nama !== '',
          has_quantity: item.kuantitas > 0,
          has_price: item.hargaSatuan > 0
        }))
      });
    }

    return {
      id: row.id,
      userId: row.user_id,
      supplier: row.supplier,
      tanggal: UserFriendlyDate.safeParseToDate(row.tanggal),
      totalNilai: Number(row.total_nilai ?? 0),
      items,
      status: row.status,
      metodePerhitungan: row.metode_perhitungan,
      createdAt: UserFriendlyDate.safeParseToDate(row.created_at),
      updatedAt: UserFriendlyDate.safeParseToDate(row.updated_at),
    };
  } catch (error) {
    logger.error('Error transforming purchase from DB:', error);
    return {
      id: dbItem?.id ?? 'error',
      userId: dbItem?.user_id ?? '',
      supplier: dbItem?.supplier ?? '',
      tanggal: new Date(),
      totalNilai: 0,
      items: [],
      status: 'pending',
      metodePerhitungan: 'AVERAGE',
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
  return {
    user_id: userId,
    supplier: String(p.supplier || '').trim(),
    tanggal: toYMD(p.tanggal),
    total_nilai: Math.max(0, Number(p.totalNilai) || 0),
    // ✅ HARDENED: Gunakan mapper yang robust
    items: (p.items ?? []).map(mapItemForDB),
    status: p.status ?? 'pending',
    metode_perhitungan: p.metodePerhitungan ?? 'AVERAGE',
  };
};

/** ==== DB <- FRONTEND (UPDATE) ==== */
export const transformPurchaseUpdateForDB = (p: Partial<Purchase>) => {
  const out: Record<string, any> = { updated_at: new Date().toISOString() };

  if (p.supplier !== undefined) out.supplier = String(p.supplier || '').trim();
  if (p.tanggal !== undefined) out.tanggal = toYMD(p.tanggal as any);
  if (p.totalNilai !== undefined) out.total_nilai = Math.max(0, Number(p.totalNilai) || 0);
  if (p.status !== undefined) out.status = p.status;
  if (p.metodePerhitungan !== undefined) out.metode_perhitungan = p.metodePerhitungan;

  if (p.items !== undefined) {
    // ✅ HARDENED: Gunakan mapper yang robust untuk update juga
    out.items = (p.items ?? []).map(mapItemForDB);
  }
  return out;
};

/** Array transform helper */
export const transformPurchasesFromDB = (rows: any[]): Purchase[] =>
  (rows ?? []).map(transformPurchaseFromDB);

/** Utilitas tambahan (tetap dipakai di UI) */
export const calculateItemSubtotal = (kuantitas: number, hargaSatuan: number): number =>
  (Number(kuantitas) || 0) * (Number(hargaSatuan) || 0);

export const calculatePurchaseTotal = (items: any[]): number =>
  Array.isArray(items)
    ? items.reduce((acc, it) => {
        // pakai subtotal jika ada (lebih akurat), fallback kalkulasi
        const s =
          it.subtotal !== undefined && it.subtotal !== null
            ? toNumber(it.subtotal)
            : calculateItemSubtotal(toNumber(it.kuantitas ?? it.qty_base), toNumber(it.hargaSatuan ?? it.harga_per_satuan));
        return acc + s;
      }, 0)
    : 0;

export const normalizePurchaseFormData = (formData: any): any => ({
  ...formData,
  totalNilai: Number(formData.totalNilai) || 0,
  tanggal:
    formData.tanggal instanceof Date ? formData.tanggal : new Date(formData.tanggal),
  items: Array.isArray(formData.items)
    ? formData.items.map((item: any) => {
        const qty = toNumber(item.kuantitas ?? item.qty_base);
        const price =
          toNumber(item.hargaSatuan ?? item.harga_per_satuan);
        return {
          ...item,
          kuantitas: qty,
          qty_base: qty,
          satuan: item.satuan ?? item.base_unit ?? '',
          base_unit: item.base_unit ?? item.satuan ?? '',
          hargaSatuan: price,
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
  totalNilai: Math.max(0, Number(data.totalNilai) || 0),
  items: Array.isArray(data.items)
    ? data.items.map((item: any) => {
        const kuantitas = Number(
          item.kuantitas ?? 
          item.jumlah ?? 
          item.qty_base ?? 
          0
        );
        const hargaSatuan = Number(
          item.hargaSatuan ?? 
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
          hargaSatuan: Math.max(0, hargaSatuan),
          subtotal: Math.max(0, Number(item.subtotal ?? (kuantitas * hargaSatuan)) || 0),
          keterangan: item.keterangan ? String(item.keterangan).trim() : undefined,
        };
      })
    : [],
  status: data.status || 'pending',
  metodePerhitungan: data.metodePerhitungan || 'AVERAGE',
});