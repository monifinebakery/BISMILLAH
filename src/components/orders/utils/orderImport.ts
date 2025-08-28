import type { NewOrder, OrderItem } from '../types';

export type ImportedOrder = Omit<NewOrder, 'status' | 'subtotal' | 'pajak' | 'totalPesanan'>;

interface RawOrderRow {
  tanggal: string;
  namaPelanggan: string;
  namaItem: string;
  jumlah: number;
  satuan: string;
  harga: number;
}

/**
 * Parse CSV file menjadi array pesanan.
 * Format kolom yang didukung (sesuai gambar):
 * tanggal,namaPelanggan,namaItem,jumlah,satuan,harga
 * SETIAP BARIS = SATU PESANAN TERPISAH
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

  const getIndex = (name: string) => headers.indexOf(name.toLowerCase());
  const idxTanggal = getIndex('tanggal');
  const idxNamaPelanggan = getIndex('namapelanggan');
  const idxNamaItem = getIndex('namaitem') !== -1 ? getIndex('namaitem') : getIndex('nama'); // Support both 'nama' and 'namaitem'
  const idxJumlah = getIndex('jumlah') !== -1 ? getIndex('jumlah') : getIndex('kuantitas'); // Support both 'jumlah' and 'kuantitas'
  const idxSatuan = getIndex('satuan');
  const idxHarga = getIndex('harga');

  // Kolom wajib: tanggal, nama pelanggan, nama item, jumlah, harga
  if ([idxTanggal, idxNamaPelanggan, idxNamaItem, idxJumlah, idxHarga].some((i) => i === -1)) {
    throw new Error('Kolom wajib tidak lengkap. Diperlukan: tanggal, namaPelanggan, nama/namaItem, jumlah, harga');
  }

  const rows: RawOrderRow[] = lines.slice(1).map((line) => {
    const values = line.split(delimiter).map((v) => v.trim());
    return {
      tanggal: values[idxTanggal] || '',
      namaPelanggan: values[idxNamaPelanggan] || '',
      namaItem: values[idxNamaItem] || '',
      jumlah: parseFloat(values[idxJumlah] || '0'),
      satuan: idxSatuan !== -1 ? values[idxSatuan] || '' : '',
      harga: parseFloat(values[idxHarga] || '0'),
    };
  });

  // ✅ SETIAP BARIS = SATU PESANAN TERPISAH (tidak dikelompokkan)
  const orders: ImportedOrder[] = [];

  rows.forEach((r, index) => {
    if (!r.namaPelanggan || !r.tanggal || !r.namaItem) return;
    
    // Buat satu pesanan untuk setiap baris CSV
    const item: OrderItem = {
      id: `item-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      name: r.namaItem,
      quantity: r.jumlah,
      price: r.harga,
      total: r.jumlah * r.harga,
      unit: r.satuan,
    };

    const order: ImportedOrder = {
      namaPelanggan: r.namaPelanggan,
      tanggal: new Date(r.tanggal),
      items: [item], // Hanya satu item per pesanan
    };

    orders.push(order);
  });

  return orders.map(order => ({
    ...order,
    subtotal: order.items.reduce((sum, item) => sum + item.total, 0),
    pajak: 0, // Default pajak 0, bisa disesuaikan
    totalPesanan: order.items.reduce((sum, item) => sum + item.total, 0),
    status: 'pending' as const,
  }));
}
