// src/components/promoCalculator/types/promoTypes.ts

// Tipe dasar untuk promo
export interface Promo {
  id: string;
  userId: string;
  namaPromo: string;
  tipePromo: 'bogo' | 'discount' | 'bundle';
  status: 'aktif' | 'nonaktif' | 'draft';
  dataPromo: any; // Struktur data ini bisa diperhalus nanti jika diperlukan
  calculationResult: any; // Struktur data ini bisa diperhalus nanti jika diperlukan
  tanggalMulai?: string; // ISO string date
  tanggalSelesai?: string; // ISO string date
  deskripsi?: string;
  createdAt: string; // ISO string date
  updatedAt: string; // ISO string date
}

// Tipe untuk parameter query/fetch
export interface PromoQueryParams {
  search?: string;
  filters?: {
    status?: string;
    type?: string;
    dateRange?: {
      start?: string; // ISO string date
      end?: string;   // ISO string date
    };
  };
  pagination?: {
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

// Tipe untuk data yang dikirim saat membuat promo baru
// Biasanya merupakan subset dari Promo, tanpa id, userId, createdAt, updatedAt
export interface CreatePromoData {
  namaPromo: string;
  tipePromo: 'bogo' | 'discount' | 'bundle';
  status: 'aktif' | 'nonaktif' | 'draft';
  dataPromo: any;
  calculationResult: any;
  tanggalMulai?: string; // ISO string date
  tanggalSelesai?: string; // ISO string date
  deskripsi?: string;
}

// Tipe untuk data yang dikirim saat memperbarui promo
// Semua field opsional, karena hanya field yang diubah yang perlu dikirim
export interface UpdatePromoData {
  namaPromo?: string;
  tipePromo?: 'bogo' | 'discount' | 'bundle';
  status?: 'aktif' | 'nonaktif' | 'draft';
  dataPromo?: any;
  calculationResult?: any;
  tanggalMulai?: string; // ISO string date
  tanggalSelesai?: string; // ISO string date
  deskripsi?: string;
}

// Tipe untuk hasil API yang sukses
export interface PromoApiResponse<T> {
  success: true;
  data: T;
}

// Tipe untuk hasil API yang gagal
export interface PromoApiError {
  success: false;
  error: string;
}

// Gabungan tipe untuk hasil API
export type PromoApiResponseOrError<T> = PromoApiResponse<T> | PromoApiError;