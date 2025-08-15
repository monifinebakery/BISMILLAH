// src/components/purchase/utils/purchaseTransformers.ts
import { Purchase, PurchaseItem } from '../types/purchase.types';
import { safeParseDate } from '@/utils/unifiedDateUtils';
import { logger } from '@/utils/logger';

/** Helper: format ke 'YYYY-MM-DD' untuk kolom DATE di DB */
const toYMD = (d: Date | string): string => {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
};

/** ==== Helpers untuk packaging & harga ==== */
const toNumber = (v: any, def = 0) => (v === null || v === undefined || v === '' ? def : Number(v));

/** Hitung harga_per_satuan dari data kemasan jika ada */
const deriveUnitPriceFromPackaging = (row: any): number | null => {
  const jumlahKemasan = toNumber(row.jumlah_kemasan ?? row.jumlahKemasan);
  const isiPerKemasan = toNumber(row.isi_per_kemasan ?? row.isiPerKemasan);
  const totalBeli = toNumber(row.harga_total_beli_kemasan ?? row.hargaTotalBeliKemasan);

  const totalIsi = jumlahKemasan * isiPerKemasan;
  if (jumlahKemasan > 0 && isiPerKemasan > 0 && totalBeli > 0 && totalIsi > 0) {
    return totalBeli / totalIsi;
  }
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
    i.price_unit ?? // kalau ada istilah lain
    deriveUnitPriceFromPackaging(i) ?? // hitung dari kemasan
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
    bahan_baku_id: String(i.bahanBakuId ?? i.bahan_baku_id ?? ''),
    jumlah: Math.max(0, jumlah),
    harga_per_satuan: Math.max(0, hargaPerSatuan),

    // ✅ METADATA: tambahan yang aman disimpan
    nama: String(i.nama ?? '').trim(),
    satuan,
    subtotal: Math.max(0, subtotal),
    keterangan: i.keterangan ? String(i.keterangan).trim() : null,

    // ✅ INFO KEMASAN: opsional, abaikan kalau null/empty
    jumlah_kemasan: toNumber(i.jumlah_kemasan ?? i.jumlahKemasan) || null,
    satuan_kemasan: (i.satuan_kemasan ?? i.satuanKemasan) ? String(i.satuan_kemasan ?? i.satuanKemasan).trim() : null,
    isi_per_kemasan: toNumber(i.isi_per_kemasan ?? i.isiPerKemasan) || null,
    harga_total_beli_kemasan: toNumber(i.harga_total_beli_kemasan ?? i.hargaTotalBeliKemasan) || null,
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
  metode_perhitungan: 'FIFO' | 'LIFO' | 'AVERAGE';
  created_at: string;
  updated_at: string;
  applied_at?: string | null;
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
            toNumber(i.harga_per_satuan ?? i.hargaSatuan) ||
            toNumber(deriveUnitPriceFromPackaging(i) ?? 0);

          const subtotal =
            i.subtotal !== undefined && i.subtotal !== null
              ? toNumber(i.subtotal)
              : qtyBase * hargaPerSatuan;

          // simpan juga info kemasan bila ada (opsional untuk UI)
          const jumlahKemasan = toNumber(i.jumlah_kemasan);
          const isiPerKemasan = toNumber(i.isi_per_kemasan);
          const satuanKemasan = i.satuan_kemasan ?? undefined;
          const hargaTotalBeliKemasan = toNumber(i.harga_total_beli_kemasan);

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
            jumlahKemasan: jumlahKemasan || undefined,
            isiPerKemasan: isiPerKemasan || undefined,
            satuanKemasan: satuanKemasan || undefined,
            hargaTotalBeliKemasan: hargaTotalBeliKemasan || undefined,
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
    logger.error('Error transforming purchase from DB:', error, dbItem);
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
          toNumber(item.hargaSatuan ?? item.harga_per_satuan) ||
          toNumber(deriveUnitPriceFromPackaging(item) ?? 0);
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
          deriveUnitPriceFromPackaging(item) ??
          0
        );
        const satuan = String(
          item.satuan ?? 
          item.base_unit ?? 
          ''
        ).trim();

        return {
          bahanBakuId: String(item.bahanBakuId ?? item.bahan_baku_id || ''),
          nama: String(item.nama || '').trim(),
          kuantitas: Math.max(0, kuantitas),
          satuan,
          hargaSatuan: Math.max(0, hargaSatuan),
          subtotal: Math.max(0, Number(item.subtotal ?? kuantitas * hargaSatuan) || 0),
          keterangan: item.keterangan ? String(item.keterangan).trim() : undefined,
          
          // ✅ KEMASAN: Simpan info kemasan jika ada (untuk UI yang masih pakai)
          jumlahKemasan: item.jumlahKemasan ?? item.jumlah_kemasan ?? undefined,
          isiPerKemasan: item.isiPerKemasan ?? item.isi_per_kemasan ?? undefined,
          satuanKemasan: item.satuanKemasan ?? item.satuan_kemasan ?? undefined,
          hargaTotalBeliKemasan: item.hargaTotalBeliKemasan ?? item.harga_total_beli_kemasan ?? undefined,
        };
      })
    : [],
  status: data.status || 'pending',
  metodePerhitungan: data.metodePerhitungan || 'AVERAGE',
});