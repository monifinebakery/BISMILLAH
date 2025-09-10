# Panduan Menyembunyikan Logging di Production

Dokumen ini menjelaskan cara menyembunyikan atau menghilangkan log Service Worker (SW) dan fetch dari tampilan di environment production.

## 🎯 Fitur yang Dikonfigurasi

### 1. Service Worker Logging
- **File**: `public/sw.js`
- **Implementasi**: Conditional logging dengan `swLog()` dan `swError()`
- **Deteksi Environment**: Berdasarkan hostname production
- **Pesan yang Disembunyikan**:
  - Service worker installation/activation
  - Cache operations (hit/miss)
  - Static asset fetch operations
  - API request proxying

### 2. Network Error Handler
- **File**: `src/utils/networkErrorHandler.ts`
- **Implementasi**: Global error interceptor untuk network errors
- **Integrasi**: Diinisialisasi di `src/main.tsx`
- **Error yang Disembunyikan di Production**:
  - "Fetch failed loading"
  - "Failed to fetch"
  - "Network error"
  - "Loading chunk failed"
  - "Script error"
  - CORS errors
  - Connection timeouts
  - Resource loading failures

### Implementasi

File `src/utils/networkErrorHandler.ts` menyediakan global error handler yang:

1. **Mendeteksi Environment**:
   ```javascript
   const IS_PRODUCTION = window.location.hostname === 'kalkulator.monifine.my.id' || 
                        window.location.hostname === 'www.kalkulator.monifine.my.id';
   ```

2. **Menyembunyikan Network Errors**:
   - Window error events
   - Unhandled promise rejections
   - Fetch API errors
   - Console errors/warnings
   - Resource loading failures

3. **Pattern Matching**:
   ```javascript
   const NETWORK_ERROR_PATTERNS = [
     'fetch failed loading',
     'failed to fetch',
     'network error',
     'net::err_',
     'loading chunk failed',
     // ... dan lainnya
   ];
   ```

### Integrasi

Diinisialisasi di `src/main.tsx`:
```javascript
import { initializeNetworkErrorHandler } from '@/utils/networkErrorHandler';

// Initialize sebelum React render
initializeNetworkErrorHandler();
```

## 1. Service Worker Logging

### Implementasi yang Sudah Dilakukan

Service Worker (`/public/sw.js`) sudah dikonfigurasi untuk menyembunyikan log di production:

```javascript
// Environment detection untuk logging
const IS_PRODUCTION = self.location.hostname === 'kalkulator.monifine.my.id' || 
                     self.location.hostname === 'www.kalkulator.monifine.my.id';
const ENABLE_SW_LOGS = !IS_PRODUCTION;

// Fungsi conditional logging
function swLog(...args) {
  if (ENABLE_SW_LOGS) {
    console.log(...args);
  }
}

function swError(...args) {
  if (ENABLE_SW_LOGS) {
    console.error(...args);
  }
}
```

### Cara Kerja

1. **Detection Environment**: Service Worker mendeteksi apakah berjalan di production berdasarkan hostname
2. **Conditional Logging**: Semua `console.log` dan `console.error` diganti dengan `swLog` dan `swError`
3. **Silent di Production**: Di production, fungsi logging tidak akan menampilkan apapun

### Domain Production yang Dikonfigurasi

- `kalkulator.monifine.my.id`
- `www.kalkulator.monifine.my.id`

## 2. Application Logging (Logger Utils)

### Konfigurasi yang Sudah Ada

File `src/utils/logger.ts` sudah memiliki sistem logging yang canggih:

```javascript
// Production hosts yang akan silent
const PROD_HOSTS = new Set<string>([
  "kalkulator.monifine.my.id",
  "www.kalkulator.monifine.my.id",
]);

// Logic untuk menentukan apakah logging diaktifkan
function getShouldLog(): boolean {
  // 1) Development mode - selalu aktif
  if (IS_DEV) return true;
  
  // 2) Force logs via environment variable
  if (FORCE_LOGS) return true;
  
  // 3) Production domain - silent
  if (isProductionHostname(host)) return false;
  
  // 4) Default: silent
  return false;
}
```

### Environment Variables untuk Kontrol Logging

```bash
# Force enable logging di production (untuk debugging)
VITE_FORCE_LOGS=true

# Set level logging
VITE_DEBUG_LEVEL=error  # debug | warn | error

# Disable logs pada host tertentu
VITE_DISABLE_LOGS_ON_HOSTS=example.com,test.com

# Enable logs pada host development
VITE_DEV_HOSTS=dev.example.com,staging.example.com
```

## 3. Fetch Request Logging

### Service Worker Fetch Events

Semua fetch events di Service Worker sudah menggunakan conditional logging:

```javascript
// Contoh di handleStaticAsset
swLog('[SW] Serving hashed asset from cache:', url.pathname);
swLog('[SW] Fetching from network:', url.pathname);
swError('[SW] Static asset fetch failed:', url.pathname, error);
```

### Application Fetch Logging

Untuk fetch requests di aplikasi, gunakan logger utility:

```javascript
import { logger } from '@/utils/logger';

// Akan silent di production
logger.api('/api/endpoint', 'Fetching data', { params });
logger.debug('Request completed', response);
```

## 4. Browser Developer Tools

### Menyembunyikan dari Console Browser

Di production, user tidak akan melihat log di browser console karena:

1. **Service Worker**: Menggunakan conditional logging
2. **Application**: Logger utility mendeteksi production domain
3. **Third-party**: Library external tetap bisa log, tapi aplikasi kita silent

### Debugging di Production (Jika Diperlukan)

Jika perlu debugging di production:

```javascript
// Tambahkan di localStorage browser
localStorage.setItem('FORCE_LOGS', 'true');

// Atau set environment variable
VITE_FORCE_LOGS=true
```

## 5. Network Tab di DevTools

### Fetch Requests Tetap Terlihat

**PENTING**: Meskipun logging disembunyikan, fetch requests tetap akan terlihat di:

- **Network tab** di Developer Tools
- **Application tab** untuk Service Worker events
- **Console tab** untuk error yang tidak tertangani

Ini adalah behavior normal browser dan **tidak bisa disembunyikan sepenuhnya**.

### Yang Bisa Disembunyikan

✅ **Bisa disembunyikan**:
- Console.log dari aplikasi
- Console.log dari Service Worker
- Debug messages
- Custom logging

❌ **Tidak bisa disembunyikan**:
- Network requests di DevTools
- Browser native errors
- Third-party library logs
- Browser security warnings

## 6. Best Practices

### Untuk Development

```javascript
// Gunakan logger utility, bukan console.log langsung
logger.debug('Debug info', data);  // ✅ Good
console.log('Debug info', data);   // ❌ Avoid
```

### Untuk Production

```javascript
// Error handling tetap perlu logging
try {
  // code
} catch (error) {
  logger.error('Critical error', error);  // ✅ Tetap log error
}
```

### Untuk Service Worker

```javascript
// Gunakan swLog/swError, bukan console langsung
swLog('[SW] Cache hit');     // ✅ Good
console.log('[SW] Cache hit'); // ❌ Avoid
```

## 7. Monitoring Production

### Error Tracking

Untuk production monitoring, pertimbangkan:

1. **Error tracking service** (Sentry, LogRocket)
2. **Performance monitoring**
3. **User analytics**

### Custom Logging Service

```javascript
// Contoh implementasi logging ke service external
const productionLogger = {
  error: (message, data) => {
    if (IS_PRODUCTION) {
      // Send to external service
      fetch('/api/logs', {
        method: 'POST',
        body: JSON.stringify({ level: 'error', message, data })
      });
    }
  }
};
```

## Kesimpulan

**Ya, menyembunyikan logging Service Worker dan aplikasi di production sangat memungkinkan dan sudah diimplementasikan.**

### Yang Sudah Dikonfigurasi:

1. ✅ Service Worker logging - conditional berdasarkan hostname
2. ✅ Application logging - menggunakan logger utility
3. ✅ Environment detection - otomatis detect production
4. ✅ Debug controls - bisa di-override untuk debugging

### Limitasi:

1. ❌ Network requests di DevTools tetap terlihat (ini normal)
2. ❌ Browser native errors tidak bisa disembunyikan
3. ❌ Third-party library logs mungkin tetap muncul

### Rekomendasi:

- Gunakan logger utility untuk semua logging aplikasi
- Jangan gunakan console.log langsung
- Implementasikan error tracking service untuk production
- Test logging behavior di staging environment sebelum deploy