import type { Purchase, PurchaseItem } from '../types/purchase.types';

export type ImportedPurchase = Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

interface RawRow {
  supplier: string;
  tanggal: string;
  nama: string;
  kuantitas: number;
  satuan: string;
  harga: number;
}

/**
 * Parse CSV file menjadi array pembelian.
 * Format kolom yang didukung:
 * supplier,tanggal,nama,kuantitas,satuan,harga
 */
export async function parsePurchaseCSV(file: File): Promise<ImportedPurchase[]> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Deteksi pemisah kolom: dukung koma dan titik koma
  const delimiter = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0]
    .split(delimiter)
    .map((h) => h.trim().toLowerCase());
  const getIndex = (name: string) => headers.indexOf(name);

  const idxSupplier = getIndex('supplier');
  const idxTanggal = getIndex('tanggal');
  const idxNama = getIndex('nama');
  const idxQty = getIndex('kuantitas');
  const idxSatuan = getIndex('satuan');
  const idxHarga = getIndex('harga');

  if ([idxSupplier, idxTanggal, idxNama, idxQty, idxSatuan, idxHarga].some((i) => i === -1)) {
    throw new Error('Kolom wajib tidak lengkap');
  }

  const rows: RawRow[] = lines.slice(1).map((line) => {
    const values = line.split(delimiter).map((v) => v.trim());
    return {
      supplier: values[idxSupplier] || '',
      tanggal: values[idxTanggal] || '',
      nama: values[idxNama] || '',
      kuantitas: parseFloat(values[idxQty] || '0'),
      satuan: values[idxSatuan] || '',
      harga: parseFloat(values[idxHarga] || '0'),
    };
  });

  const grouped = new Map<string, ImportedPurchase>();

  rows.forEach((r) => {
    if (!r.supplier || !r.tanggal || !r.nama) return;
    const key = `${r.supplier}-${r.tanggal}`;
    let purchase = grouped.get(key);
    if (!purchase) {
      purchase = {
        supplier: r.supplier,
        tanggal: new Date(r.tanggal),
        items: [],
        totalNilai: 0,
        status: 'pending',
        metodePerhitungan: 'AVERAGE',
      };
      grouped.set(key, purchase);
    }

    const item: PurchaseItem = {
      bahanBakuId: '',
      nama: r.nama,
      kuantitas: r.kuantitas,
      satuan: r.satuan,
      hargaSatuan: r.harga,
      subtotal: r.kuantitas * r.harga,
    };
    purchase.items.push(item);
    purchase.totalNilai += item.subtotal;
  });

  return Array.from(grouped.values());
}

