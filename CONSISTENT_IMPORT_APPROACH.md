# Pendekatan Import yang Konsisten untuk Project BISMILLAH

## Gambaran Umum

Dokumen ini menjelaskan pendekatan yang konsisten untuk penggunaan import dalam project BISMILLAH, dengan fokus pada kombinasi antara static imports untuk dependencies inti dan dynamic imports untuk komponen/komponen tambahan.

## Prinsip Dasar

1. **Static Imports untuk Dependencies Inti**: Gunakan static imports (`import ... from 'module'`) untuk:
   - Komponen React yang selalu digunakan
   - Hooks React
   - Dependencies pihak ketiga yang kecil
   - Utilities yang digunakan di seluruh aplikasi
   - Types dan interfaces

2. **Dynamic Imports untuk Komponen Tambahan**: Gunakan dynamic imports (`React.lazy(() => import('...'))`) untuk:
   - Komponen UI yang berat
   - Komponen yang tidak selalu ditampilkan
   - Modul besar yang tidak diperlukan di awal
   - Fitur optional yang mungkin tidak digunakan semua user

## Implementasi

### Static Imports - Contoh

```typescript
// Import komponen dan hooks yang selalu digunakan
import React, { useState, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Import utilities
import { formatCurrency } from '@/utils/formatUtils';
import { logger } from '@/utils/logger';
```

### Dynamic Imports - Contoh

```typescript
// Import komponen berat secara lazy
const FinancialCharts = React.lazy(() => 
  import('./components/FinancialCharts').catch((error) => {
    logger.error('Failed to load FinancialCharts', error);
    return {
      default: () => (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <h3 className="font-medium text-red-700 mb-1">Gagal Memuat Grafik</h3>
            <p className="text-sm text-red-500">Terjadi kesalahan saat memuat komponen grafik keuangan.</p>
          </CardContent>
        </Card>
      )
    };
  })
);
```

## Keuntungan Pendekatan Ini

1. **Optimasi Ukuran Bundle**: Hanya kode yang diperlukan yang dimuat di awal, mengurangi ukuran bundle awal.

2. **Peningkatan Performa**: Aplikasi menjadi lebih cepat saat loading karena tidak perlu memuat semua komponen sekaligus.

3. **User Experience yang Lebih Baik**: Pengguna dapat mulai menggunakan aplikasi lebih cepat, dengan komponen tambahan dimuat sesuai kebutuhan.

4. **Manajemen Dependencies yang Lebih Baik**: Dependencies yang besar hanya dimuat ketika benar-benar diperlukan.

5. **Error Handling yang Lebih Baik**: Setiap dynamic import memiliki error handling yang sesuai, memberikan pengalaman yang lebih baik saat terjadi kesalahan.

## Panduan Penggunaan

### Kapan Menggunakan Static Imports

- Komponen dan hooks yang selalu ditampilkan di halaman utama
- Dependencies pihak ketiga yang ringan (<5KB)
- Utilities yang digunakan di banyak tempat
- Types dan interfaces

### Kapan Menggunakan Dynamic Imports

- Komponen berat seperti chart atau tabel kompleks
- Fitur yang tidak selalu digunakan
- Modul besar (>10KB)
- Komponen yang hanya ditampilkan dalam kondisi tertentu

### Best Practices

1. **Gunakan Error Handling**: Selalu tambahkan `.catch()` pada dynamic imports untuk menangani kemungkinan gagalnya loading komponen.

2. **Gunakan Suspense**: Bungkus komponen lazy dengan Suspense untuk menampilkan loading state.

3. **Prefetch untuk Komponen Penting**: Gunakan prefetch untuk komponen yang kemungkinan besar akan digunakan setelah interaksi user.

4. **Konsisten dalam Naming**: Gunakan pola penamaan yang konsisten untuk komponen lazy.

## Contoh Implementasi Lengkap

```typescript
// src/pages/FinancialPage.tsx
import React, { Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';

// Static imports untuk komponen inti
import { useFinancialData } from '@/hooks/useFinancialData';

// Dynamic imports untuk komponen berat
const FinancialCharts = React.lazy(() => 
  import('@/components/financial/FinancialCharts').catch((error) => {
    return {
      default: () => (
        <div className="p-4 text-center text-red-500">
          Gagal memuat grafik: {error.message}
        </div>
      )
    };
  })
);

const FinancialPage: React.FC = () => {
  const { data, isLoading, refresh } = useFinancialData();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1>Laporan Keuangan</h1>
        <Button onClick={refresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Suspense fallback={
        <Card>
          <CardContent className="h-64 flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      }>
        <FinancialCharts data={data} />
      </Suspense>
    </div>
  );
};

export default FinancialPage;
```

## File yang Telah Diupdate

1. `src/components/financial/FinancialReportPage.tsx` - Menerapkan pendekatan konsisten untuk dynamic imports dengan error handling yang lebih baik
2. `src/components/orders/components/ImportButton.tsx` - Mengoptimalkan dynamic import untuk financial sync

## Kesimpulan

Pendekatan ini memberikan keseimbangan antara performa dan maintainability dengan memastikan bahwa:
- Aplikasi tetap cepat saat loading
- Dependencies dikelola dengan efisien
- Error handling dilakukan dengan baik
- User experience tetap optimal