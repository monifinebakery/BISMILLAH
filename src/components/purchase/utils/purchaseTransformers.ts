// src/components/purchase/utils/purchaseTransformers.ts
import { Purchase, PurchaseItem } from '../types/purchase.types';
import { safeParseDate } from '@/utils/unifiedDateUtils';
import { logger } from '@/utils/logger';

/** Helper: format ke 'YYYY-MM-DD' untuk kolom DATE di DB */
const toYMD = (d: Date | string): string => {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
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

/** Frontend <- DB */
export const transformPurchaseFromDB = (dbItem: any): Purchase => {
  try {
    const row = dbItem as DbPurchaseRow;

    const items: PurchaseItem[] = Array.isArray(row.items)
      ? row.items.map((i: any) => ({
          // app shape
          bahanBakuId: i.bahan_baku_id ?? i.bahanBakuId ?? '',
          nama: i.nama ?? '',
          kuantitas: Number(i.jumlah ?? i.kuantitas ?? 0),
          satuan: i.satuan ?? '',
          hargaSatuan: Number(i.harga_per_satuan ?? i.hargaSatuan ?? 0),
          subtotal:
            i.subtotal !== undefined
              ? Number(i.subtotal)
              : Number(i.jumlah ?? 0) * Number(i.harga_per_satuan ?? 0),
          keterangan: i.keterangan ?? undefined,
        }))
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

/** DB <- Frontend (INSERT) */
export const transformPurchaseForDB = (
  p: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  userId: string
) => {
  return {
    user_id: userId,
    supplier: p.supplier,
    tanggal: toYMD(p.tanggal),
    total_nilai: p.totalNilai,
    // IMPORTANT: bentuk yang dibaca trigger WAC
    items: (p.items ?? []).map((i) => ({
      bahan_baku_id: i.bahanBakuId,
      jumlah: i.kuantitas,
      harga_per_satuan: i.hargaSatuan,
      // metadata tambahan (tidak dipakai trigger, aman disimpan)
      nama: i.nama,
      satuan: i.satuan,
      subtotal: i.subtotal,
      keterangan: i.keterangan ?? null,
    })),
    status: p.status ?? 'pending',
    metode_perhitungan: p.metodePerhitungan ?? 'AVERAGE',
  };
};

/** DB <- Frontend (UPDATE) */
export const transformPurchaseUpdateForDB = (p: Partial<Purchase>) => {
  const out: Record<string, any> = { updated_at: new Date().toISOString() };

  if (p.supplier !== undefined) out.supplier = p.supplier;
  if (p.tanggal !== undefined) out.tanggal = toYMD(p.tanggal as any);
  if (p.totalNilai !== undefined) out.total_nilai = p.totalNilai;
  if (p.status !== undefined) out.status = p.status;
  if (p.metodePerhitungan !== undefined) out.metode_perhitungan = p.metodePerhitungan;

  if (p.items !== undefined) {
    out.items = (p.items ?? []).map((i) => ({
      bahan_baku_id: i.bahanBakuId,
      jumlah: i.kuantitas,
      harga_per_satuan: i.hargaSatuan,
      nama: i.nama,
      satuan: i.satuan,
      subtotal: i.subtotal,
      keterangan: i.keterangan ?? null,
    }));
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
    ? items.reduce(
        (acc, it) => acc + calculateItemSubtotal(it.kuantitas, it.hargaSatuan),
        0
      )
    : 0;

export const normalizePurchaseFormData = (formData: any): any => ({
  ...formData,
  totalNilai: Number(formData.totalNilai) || 0,
  tanggal:
    formData.tanggal instanceof Date ? formData.tanggal : new Date(formData.tanggal),
  items: Array.isArray(formData.items)
    ? formData.items.map((item: any) => ({
        ...item,
        kuantitas: Number(item.kuantitas) || 0,
        hargaSatuan: Number(item.hargaSatuan) || 0,
        subtotal: calculateItemSubtotal(item.kuantitas, item.hargaSatuan),
      }))
    : [],
});

export const sanitizePurchaseData = (data: any): any => ({
  supplier: String(data.supplier || '').trim(),
  tanggal: data.tanggal,
  totalNilai: Math.max(0, Number(data.totalNilai) || 0),
  items: Array.isArray(data.items)
    ? data.items.map((item: any) => ({
        bahanBakuId: String(item.bahanBakuId || ''),
        nama: String(item.nama || '').trim(),
        kuantitas: Math.max(0, Number(item.kuantitas) || 0),
        satuan: String(item.satuan || '').trim(),
        hargaSatuan: Math.max(0, Number(item.hargaSatuan) || 0),
        subtotal: Math.max(0, Number(item.subtotal) || 0),
        keterangan: item.keterangan ? String(item.keterangan).trim() : undefined,
      }))
    : [],
  status: data.status || 'pending',
  metodePerhitungan: data.metodePerhitungan || 'AVERAGE',
});
