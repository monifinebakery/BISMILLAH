export interface BahanBaku {
  id: string;
  nama: string;
  kategori: string;
  stok: number;
  satuan: string;
  minimum: number;
  hargaSatuan: number;
  supplier: string;
  createdAt?: Date;
  updatedAt?: Date;
  tanggalKadaluwarsa?: Date; // Menambahkan ini berdasarkan diskusi sebelumnya
  // MODIFIED: Mengubah properti menjadi non-opsional dan non-nullable
  // PERHATIAN: Ini memerlukan kolom database tidak boleh NULL dan default ke 0 atau ''
  jumlahBeliKemasan: number;   // MODIFIED: non-opsional, non-nullable
  satuanKemasan: string;     // MODIFIED: non-opsional, non-nullable
  hargaTotalBeliKemasan: number; // MODIFIED: non-opsional, non-nullable
}