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

/** Builder item baru (DB shape) dari item UI */
const buildDbItem = (i: any) => {
  const bahanBakuId = i.bahanBakuId ?? i.bahan_baku_id;
  const qtyBase = toNumber(i.qty_base ?? i.kuantitas ?? i.jumlah);
  const baseUnit = i.base_unit ?? i.satuan ?? '';
  // prioritas: harga_per_satuan explicit -> dari kemasan -> hargaSatuan lama
  const unitPrice =
    toNumber(i.harga_per_satuan) ||
    toNumber(deriveUnitPriceFromPackaging(i) ?? 0) ||
    toNumber(i.hargaSatuan);

  const jumlahKemasan = toNumber(i.jumlah_kemasan ?? i.jumlahKemasan);
  const isiPerKemasan = toNumber(i.isi_per_kemasan ?? i.isiPerKemasan);
  const satuanKemasan = i.satuan_kemasan ?? i.satuanKemasan ?? null;
  const hargaTotalBeliKemasan = toNumber(
    i.harga_total_beli_kemasan ?? i.hargaTotalBeliKemasan
  );

  const subtotal =
    i.subtotal !== undefined && i.subtotal !== null
      ? toNumber(i.subtotal)
      : qtyBase * unitPrice;

  return {
    // WAJIB utk trigger WAC
    bahan_baku_id: bahanBakuId,
    qty_base: qtyBase,
    base_unit: baseUnit,
    harga_per_satuan: unitPrice,

    // OPSIONAL: info kemasan (kalau diisi akan dipakai di UI & validasi)
    jumlah_kemasan: jumlahKemasan || null,
    isi_per_kemasan: isiPerKemasan || null,
    satuan_kemasan: satuanKemasan,
    harga_total_beli_kemasan: hargaTotalBeliKemasan || null,

    // metadata tambahan (aman)
    nama: i.nama ?? null,
    keterangan: i.keterangan ?? i.catatan ?? null,
    subtotal, // simpan biar total cepat
  };
};

/** ==== DB <- FRONTEND (INSERT) ==== */
export const transformPurchaseForDB = (
  p: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  userId: string
) => {
  return {
    user_id: userId,
    supplier: p.supplier,
    tanggal: toYMD(p.tanggal),
    total_nilai: p.totalNilai,
    items: (p.items ?? []).map(buildDbItem),
    status: p.status ?? 'pending',
    metode_perhitungan: p.metodePerhitungan ?? 'AVERAGE',
  };
};

/** ==== DB <- FRONTEND (UPDATE) ==== */
export const transformPurchaseUpdateForDB = (p: Partial<Purchase>) => {
  const out: Record<string, any> = { updated_at: new Date().toISOString() };

  if (p.supplier !== undefined) out.supplier = p.supplier;
  if (p.tanggal !== undefined) out.tanggal = toYMD(p.tanggal as any);
  if (p.totalNilai !== undefined) out.total_nilai = p.totalNilai;
  if (p.status !== undefined) out.status = p.status;
  if (p.metodePerhitungan !== undefined) out.metode_perhitungan = p.metodePerhitungan;

  if (p.items !== undefined) {
    out.items = (p.items ?? []).map(buildDbItem);
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

export const sanitizePurchaseData = (data: any): any => ({
  supplier: String(data.supplier || '').trim(),
  tanggal: data.tanggal,
  totalNilai: Math.max(0, Number(data.totalNilai) || 0),
  items: Array.isArray(data.items)
    ? data.items.map((item: any) => ({
        bahanBakuId: String(item.bahanBakuId || item.bahan_baku_id || ''),
        nama: String(item.nama || '').trim(),
        kuantitas: Math.max(0, toNumber(item.kuantitas ?? item.qty_base)),
        satuan: String(item.satuan || item.base_unit || '').trim(),
        hargaSatuan:
          Math.max(
            0,
            toNumber(item.hargaSatuan ?? item.harga_per_satuan ?? deriveUnitPriceFromPackaging(item) ?? 0)
          ),
        subtotal: Math.max(
          0,
          toNumber(
            item.subtotal ??
              (toNumber(item.kuantitas ?? item.qty_base) *
                (toNumber(item.hargaSatuan ?? item.harga_per_satuan) ||
                  toNumber(deriveUnitPriceFromPackaging(item) ?? 0)))
          )
        ),
        // simpan info kemasan jika ada (opsional untuk UI)
        jumlahKemasan: item.jumlahKemasan ?? item.jumlah_kemasan ?? undefined,
        isiPerKemasan: item.isiPerKemasan ?? item.isi_per_kemasan ?? undefined,
        satuanKemasan: item.satuanKemasan ?? item.satuan_kemasan ?? undefined,
        hargaTotalBeliKemasan:
          item.hargaTotalBeliKemasan ?? item.harga_total_beli_kemasan ?? undefined,
        keterangan: item.keterangan ? String(item.keterangan).trim() : undefined,
      }))
    : [],
  status: data.status || 'pending',
  metodePerhitungan: data.metodePerhitungan || 'AVERAGE',
});
