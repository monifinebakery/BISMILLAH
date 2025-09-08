// src/components/profitAnalysis/utils/errorTranslator.ts
// Error message translator for Indonesian business users

export interface TranslatedError {
  message: string;
  description?: string;
  actionable?: {
    text: string;
    action?: () => void;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export const translateProfitError = (error: string): TranslatedError => {
  const errorLowerCase = error.toLowerCase();

  // Network and connection errors
  if (errorLowerCase.includes('network') || errorLowerCase.includes('fetch')) {
    return {
      message: 'Koneksi terputus',
      description: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
      actionable: {
        text: 'Coba Lagi'
      },
      severity: 'medium'
    };
  }

  // Authentication errors
  if (errorLowerCase.includes('unauthorized') || errorLowerCase.includes('403') || errorLowerCase.includes('401')) {
    return {
      message: 'Akses ditolak',
      description: 'Sesi Anda mungkin sudah berakhir. Silakan login kembali.',
      actionable: {
        text: 'Login Kembali'
      },
      severity: 'high'
    };
  }

  // Data not found errors
  if (errorLowerCase.includes('no transactions found') || errorLowerCase.includes('no data')) {
    return {
      message: 'Tidak ada data penjualan',
      description: 'Belum ada transaksi penjualan untuk periode ini. Tambah transaksi di menu Keuangan terlebih dahulu.',
      actionable: {
        text: 'Tambah Transaksi'
      },
      severity: 'low'
    };
  }

  // Daily analysis errors
  if (errorLowerCase.includes('failed daily analysis') || errorLowerCase.includes('daily calculate')) {
    return {
      message: 'Gagal analisis harian',
      description: 'Tidak dapat menghitung profit harian. Pastikan ada data penjualan pada rentang tanggal yang dipilih.',
      actionable: {
        text: 'Pilih Tanggal Lain'
      },
      severity: 'medium'
    };
  }

  // WAC calculation errors
  if (errorLowerCase.includes('wac') || errorLowerCase.includes('weighted average')) {
    return {
      message: 'Gagal hitung harga rata-rata',
      description: 'Tidak dapat menghitung harga rata-rata bahan baku (WAC). Periksa data stok dan riwayat pembelian.',
      actionable: {
        text: 'Periksa Data Stok'
      },
      severity: 'medium'
    };
  }

  // Permission errors
  if (errorLowerCase.includes('permission denied') || errorLowerCase.includes('access denied')) {
    return {
      message: 'Akses terbatas',
      description: 'Anda tidak memiliki izin untuk mengakses data ini. Hubungi administrator.',
      severity: 'high'
    };
  }

  // Configuration errors
  if (errorLowerCase.includes('pengaturan alokasi belum dikonfigurasi') || errorLowerCase.includes('app_settings')) {
    return {
      message: 'Pengaturan belum lengkap',
      description: 'Setup biaya operasional belum selesai. Silakan konfigurasikan di menu Biaya Operasional.',
      actionable: {
        text: 'Setup Biaya'
      },
      severity: 'high'
    };
  }

  // Calculation errors
  if (errorLowerCase.includes('calculation') || errorLowerCase.includes('compute')) {
    return {
      message: 'Gagal menghitung profit',
      description: 'Terjadi kesalahan saat menghitung profit. Data mungkin tidak lengkap atau tidak valid.',
      actionable: {
        text: 'Coba Lagi'
      },
      severity: 'medium'
    };
  }

  // Server errors
  if (errorLowerCase.includes('500') || errorLowerCase.includes('server error')) {
    return {
      message: 'Server bermasalah',
      description: 'Terjadi kesalahan pada server. Tim teknis sudah diberitahu dan sedang memperbaiki.',
      severity: 'critical'
    };
  }

  // Validation errors
  if (errorLowerCase.includes('validation') || errorLowerCase.includes('invalid')) {
    return {
      message: 'Data tidak valid',
      description: 'Ada data yang tidak sesuai format. Periksa kembali input Anda.',
      actionable: {
        text: 'Periksa Data'
      },
      severity: 'low'
    };
  }

  // Timeout errors
  if (errorLowerCase.includes('timeout') || errorLowerCase.includes('timed out')) {
    return {
      message: 'Waktu habis',
      description: 'Proses memakan waktu terlalu lama. Coba dengan rentang data yang lebih kecil.',
      actionable: {
        text: 'Kurangi Rentang'
      },
      severity: 'medium'
    };
  }

  // Generic fallback
  return {
    message: 'Terjadi kesalahan',
    description: `Detail: ${error}`,
    actionable: {
      text: 'Coba Lagi'
    },
    severity: 'medium'
  };
};

// Quick access functions for common error types
export const createNoDataError = (): TranslatedError => ({
  message: 'Belum ada data',
  description: 'Belum ada transaksi untuk ditampilkan. Mulai dengan menambah data penjualan atau pembelian.',
  actionable: {
    text: 'Tambah Data'
  },
  severity: 'low'
});

export const createLoadingTimeoutError = (): TranslatedError => ({
  message: 'Loading terlalu lama',
  description: 'Data membutuhkan waktu lama untuk dimuat. Periksa koneksi internet atau coba lagi.',
  actionable: {
    text: 'Refresh'
  },
  severity: 'medium'
});

export const createWACError = (): TranslatedError => ({
  message: 'WAC tidak tersedia',
  description: 'Harga rata-rata bahan baku belum dapat dihitung. Pastikan ada riwayat pembelian bahan.',
  actionable: {
    text: 'Lihat Pembelian'
  },
  severity: 'low'
});
