
export interface FinancialTransaction {
  id: string;
  type: 'income' | 'expense'; // Sesuaikan dengan nilai aktual di DB: 'pemasukan' | 'pengeluaran'
  category: string | null;     // Sesuai DB is_nullable: YES
  amount?: number;
  description: string | null;  // Sesuai DB is_nullable: YES
  date: Date | null;           // Sesuai DB is_nullable: YES
  createdAt: Date | null;      // Sesuai DB is_nullable: YES
  updatedAt: Date | null;      // <-- DITAMBAHKAN/DIUBAH UNTUK KONSISTENSI DENGAN DB is_nullable: YES
}

export interface Asset {
  id: string;
  nama: string;
  // Kategori akan menjadi string saja, karena sudah diatur secara default di select/map
  kategori: 'Peralatan' | 'Kendaraan' | 'Properti' | 'Teknologi'; // Tetap sebagai union literal
  nilaiAwal: number;
  nilaiSaatIni: number;
  // MODIFIED: Jika di fetchAssets selalu menghasilkan Date, maka di sini Date
  tanggalPembelian: Date; // <-- Diubah dari Date | null menjadi Date
  kondisi: 'Baik' | 'Cukup' | 'Buruk'; // Tetap sebagai union literal
  lokasi: string;
  // MODIFIED: Diubah dari deskripsi?: string menjadi deskripsi: string | null
  deskripsi: string | null; // <-- Diubah dari string | undefined menjadi string | null
  depresiasi: number | null;
  penyusutanPerBulan: number;
  user_id: string;
  createdAt: Date; // Tetap Date karena sudah ada fallback new Date()
  updatedAt: Date; // Tetap Date karena sudah ada fallback new Date()
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: Date;
}
