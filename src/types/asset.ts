export type AssetCategory = 'Peralatan' | 'Kendaraan' | 'Bangunan' | 'Mesin' | 'Lain-lain';
export type AssetCondition = 'Baik' | 'Rusak Ringan' | 'Rusak Berat';

export interface Asset {
  id: string;
  nama: string;
  kategori: AssetCategory; // <-- Sesuai dengan kolom DB 'kategori'
  nilaiAwal: number; // Memetakan ke 'nilai_awal'
  nilaiSaatIni: number; // Memetakan ke 'nilai_sekarang'
  tanggalPembelian: Date; // Memetakan ke 'tanggal_beli' (ini Date object di frontend)
  kondisi: AssetCondition; // Memetakan ke 'kondisi'
  lokasi: string; // Memetakan ke 'lokasi'
  deskripsi: string | null; // Memetakan ke 'deskripsi'
  depresiasi: number | null; // Memetakan ke 'depresiasi'
  umurManfaat: number; // <-- Ini penting untuk perhitungan, harus ada di Asset
  penyusutanPerBulan: number; // Memetakan ke 'penyusutan_per_bulan'
  userId: string; // <-- Memetakan ke 'user_id' (kita pakai camelCase di frontend)
  createdAt: Date; // Memetakan ke 'created_at' (ini Date object di frontend)
  updatedAt: Date; // Memetakan ke 'updated_at' (ini Date object di frontend)
}