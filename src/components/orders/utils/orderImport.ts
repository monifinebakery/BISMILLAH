import type { NewOrder, OrderItem } from '../types';

export type ImportedOrder = Omit<NewOrder, 'status' | 'subtotal' | 'pajak' | 'totalPesanan'>;

interface RawRow {
  pelanggan: string;
  tanggal: string;
  nama: string;
  kuantitas: number;
  satuan: string;
  harga: number;
}

/**
 * Parse CSV file menjadi array pesanan.
 * Format kolom yang didukung:
 * pelanggan,tanggal,nama,kuantitas,satuan,harga
 */
export async function parseOrderCSV(file: File): Promise<ImportedOrder[]> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Deteksi pemisah kolom: dukung koma dan titik koma
  const delimiter = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0]
    .split(delimiter)
    .map((h) => h.trim().toLowerCase());

  const getIndex = (name: string) => headers.indexOf(name);
  const idxPelanggan = getIndex('pelanggan');
  const idxTanggal = getIndex('tanggal');
  const idxNama = getIndex('nama');
  const idxQty = getIndex('kuantitas');
  const idxSatuan = getIndex('satuan');
  const idxHarga = getIndex('harga');

  if ([idxPelanggan, idxTanggal, idxNama, idxQty, idxSatuan, idxHarga].some((i) => i === -1)) {
    throw new Error('Kolom wajib tidak lengkap');
  }

  const rows: RawRow[] = lines.slice(1).map((line) => {
    const values = line.split(delimiter).map((v) => v.trim());
    return {
      pelanggan: values[idxPelanggan] || '',
      tanggal: values[idxTanggal] || '',
      nama: values[idxNama] || '',
      kuantitas: parseFloat(values[idxQty] || '0'),
      satuan: values[idxSatuan] || '',
      harga: parseFloat(values[idxHarga] || '0'),
    };
  });

  const grouped = new Map<string, ImportedOrder>();

  rows.forEach((r) => {
    if (!r.pelanggan || !r.tanggal || !r.nama) return;
    const key = `${r.pelanggan}-${r.tanggal}`;
    let order = grouped.get(key);
    if (!order) {
      order = {
        namaPelanggan: r.pelanggan,
        tanggal: new Date(r.tanggal),
        items: [],
      };
      grouped.set(key, order);
    }

    const item: OrderItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: r.nama,
      quantity: r.kuantitas,
      price: r.harga,
      total: r.kuantitas * r.harga,
      unit: r.satuan,
    };
    order.items.push(item);
  });

  return Array.from(grouped.values()).map(order => ({
    ...order,
    subtotal: order.items.reduce((sum, item) => sum + item.total, 0),
    pajak: 0,
    totalPesanan: order.items.reduce((sum, item) => sum + item.total, 0),
    status: 'pending' as const,
  }));
}
