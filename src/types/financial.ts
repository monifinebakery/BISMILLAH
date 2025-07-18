
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
  kategori: 'Peralatan' | 'Kendaraan' | 'Properti' | 'Teknologi';
  nilaiAwal: number;
  nilaiSaatIni: number;
  tanggalPembelian: Date | null;
  kondisi: 'Baik' | 'Cukup' | 'Buruk';
  lokasi: string;
  deskripsi?: string;
  depresiasi?: number | null;
  penyusutanPerBulan: number; // Placeholder, bisa dihitung jika diperlukan
  user_id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: Date;
}
