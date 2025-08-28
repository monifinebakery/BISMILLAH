import type { NewOrder, OrderItem } from '../types';

export type ImportedOrder = Omit<NewOrder, 'status' | 'subtotal' | 'pajak' | 'totalPesanan'>;

interface RawOrderRow {
  namaPelanggan: string;
  teleponPelanggan?: string;
  emailPelanggan?: string;
  alamatPengiriman?: string;
  tanggal: string;
  namaItem: string;
  kuantitas: number;
  harga: number;
  catatan?: string;
}

/**
 * Parse CSV file menjadi array pesanan.
 * Format kolom yang didukung:
 * namaPelanggan,teleponPelanggan,emailPelanggan,alamatPengiriman,tanggal,namaItem,kuantitas,harga,catatan
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
  const idxNamaPelanggan = getIndex('namapelanggan');
  const idxTeleponPelanggan = getIndex('teleponpelanggan');
  const idxEmailPelanggan = getIndex('emailpelanggan');
  const idxAlamatPengiriman = getIndex('alamatpengiriman');
  const idxTanggal = getIndex('tanggal');
  const idxNamaItem = getIndex('namaitem');
  const idxKuantitas = getIndex('kuantitas');
  const idxHarga = getIndex('harga');
  const idxCatatan = getIndex('catatan');

  // Kolom wajib: nama pelanggan, tanggal, nama item, kuantitas, harga
  if ([idxNamaPelanggan, idxTanggal, idxNamaItem, idxKuantitas, idxHarga].some((i) => i === -1)) {
    throw new Error('Kolom wajib tidak lengkap. Diperlukan: namaPelanggan, tanggal, namaItem, kuantitas, harga');
  }

  const rows: RawOrderRow[] = lines.slice(1).map((line) => {
    const values = line.split(delimiter).map((v) => v.trim());
    return {
      namaPelanggan: values[idxNamaPelanggan] || '',
      teleponPelanggan: idxTeleponPelanggan !== -1 ? values[idxTeleponPelanggan] : undefined,
      emailPelanggan: idxEmailPelanggan !== -1 ? values[idxEmailPelanggan] : undefined,
      alamatPengiriman: idxAlamatPengiriman !== -1 ? values[idxAlamatPengiriman] : undefined,
      tanggal: values[idxTanggal] || '',
      namaItem: values[idxNamaItem] || '',
      kuantitas: parseFloat(values[idxKuantitas] || '0'),
      harga: parseFloat(values[idxHarga] || '0'),
      catatan: idxCatatan !== -1 ? values[idxCatatan] : undefined,
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
      quantity: r.kuantitas,
      price: r.harga,
      total: r.kuantitas * r.harga,
      description: r.catatan,
    };

    const order: ImportedOrder = {
      namaPelanggan: r.namaPelanggan,
      teleponPelanggan: r.teleponPelanggan,
      emailPelanggan: r.emailPelanggan,
      alamatPengiriman: r.alamatPengiriman,
      tanggal: new Date(r.tanggal),
      items: [item], // Hanya satu item per pesanan
      catatan: r.catatan,
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
