// src/components/purchase/utils/purchaseTransformers.ts
import { Purchase, PurchaseItem } from '../types/purchase.types';
import { safeParseDate } from '@/utils/unifiedDateUtils';
import { logger } from '@/utils/logger';

/** Helper: calculate unit price from subtotal and quantity */
const calculateUnitPriceFromSubtotal = (subtotal: number, quantity: number): number => {
  if (quantity <= 0) return 0;
  return subtotal / quantity;
};

/** Helper: format ke 'YYYY-MM-DD' untuk kolom DATE di DB */
const toYMD = (d: Date | string): string => {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
};

/** ==== Helpers untuk packaging & harga ==== */
const toNumber = (v: any, def = 0) => (v === null || v === undefined || v === '' ? def : Number(v));

// Packaging-based unit price removed
const deriveUnitPriceFromPackaging = (_row: any): number | null => null;

/** ✅ HARDENED: Robust item mapper untuk DB format */
const mapItemForDB = (i: any) => {
  const jumlah = Number(
    i.kuantitas ??
    i.jumlah ??
    i.qty_base ?? // fallback dari komponen lama
    0
  );

  // Calculate unit price from subtotal and quantity if unit price is not available
  let hargaPerSatuan = Number(i.hargaSatuan ?? i.harga_satuan ?? i.price_unit ?? 0);
  
  // If unit price is 0 or not available, try to calculate it from subtotal and quantity
  if (hargaPerSatuan <= 0 && jumlah > 0) {
    const subtotal = Number(i.subtotal ?? 0);
    if (subtotal > 0) {
      hargaPerSatuan = calculateUnitPriceFromSubtotal(subtotal, jumlah);
    }
  }

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
    harga_satuan: Math.max(0, hargaPerSatuan),

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

    const items: PurchaseItem[] = Array.isArray(row.items)
      ? row.items.map((i: any) => {
          // dukung key lama & baru
          const qtyBase = toNumber(i.qty_base ?? i.jumlah ?? i.kuantitas);
          const baseUnit = i.base_unit ?? i.satuan ?? '';
          const hargaPerSatuan =
            toNumber(i.hargaSatuan ?? i.harga_satuan) ||
            toNumber(deriveUnitPriceFromPackaging(i) ?? 0);

          const subtotal =
            i.subtotal !== undefined && i.subtotal !== null
              ? toNumber(i.subtotal)
              : qtyBase * hargaPerSatuan;

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
            harga_satuan: hargaPerSatuan,
            
          };
          return out as PurchaseItem;
        })
      : [];

    return {
      id: row.id,
      userId: row.user_id,
      supplier: row.supplier,
      tanggal: safeParseDate(row.tanggal) ?? new Date(),
      totalNilai: Number(row.total_nilai ?? 0),
      items,
      status: row.status,
      metodePerhitungan: row.metode_perhitungan,
      createdAt: safeParseDate(row.created_at) ?? new Date(),
      updatedAt: safeParseDate(row.updated_at) ?? new Date(),
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
          toNumber(item.hargaSatuan ?? item.harga_satuan) ||
          toNumber(deriveUnitPriceFromPackaging(item) ?? 0);
        return {
          ...item,
          kuantitas: qty,
          qty_base: qty,
          satuan: item.satuan ?? item.base_unit ?? '',
          base_unit: item.base_unit ?? item.satuan ?? '',
          hargaSatuan: price,
          harga_satuan: price,
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
          item.harga_satuan ?? 
          item.price_unit ?? 
          deriveUnitPriceFromPackaging(item) ??
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
