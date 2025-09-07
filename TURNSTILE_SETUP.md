# Panduan Setup Cloudflare Turnstile

Panduan lengkap untuk mengimplementasikan Cloudflare Turnstile CAPTCHA di aplikasi ini.

## 📋 Daftar Isi

1. [Persiapan Akun Cloudflare](#persiapan-akun-cloudflare)
2. [Konfigurasi Environment Variables](#konfigurasi-environment-variables)
3. [Komponen yang Tersedia](#komponen-yang-tersedia)
4. [Cara Penggunaan](#cara-penggunaan)
5. [Validasi Server-side](#validasi-server-side)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

## 🚀 Persiapan Akun Cloudflare

### 1. Buat Akun Cloudflare
- Kunjungi [Cloudflare Dashboard](https://dash.cloudflare.com/)
- Daftar atau login ke akun Anda

### 2. Buat Turnstile Widget
- Masuk ke **Turnstile** di dashboard Cloudflare
- Klik **Add Site**
- Isi informasi berikut:
  - **Site name**: Nama aplikasi Anda
  - **Domain**: Domain aplikasi (contoh: `localhost`, `yourdomain.com`)
  - **Widget mode**: Pilih sesuai kebutuhan:
    - `Managed` - Interaktif (default)
    - `Non-interactive` - Otomatis
    - `Invisible` - Tersembunyi

### 3. Dapatkan API Keys
Setelah widget dibuat, Anda akan mendapat:
- **Site Key** (public) - untuk frontend
- **Secret Key** (private) - untuk backend validation

## ⚙️ Konfigurasi Environment Variables

### 1. Copy File Environment
```bash
cp .env.example .env.local
```

### 2. Isi Konfigurasi Turnstile
Buka `.env.local` dan tambahkan:

```env
# Cloudflare Turnstile Configuration
VITE_TURNSTILE_SITEKEY=your_site_key_here
TURNSTILE_SECRET_KEY=your_secret_key_here
```

**Penting**: 
- `VITE_TURNSTILE_SITEKEY` digunakan di frontend (public)
- `TURNSTILE_SECRET_KEY` digunakan di backend (private, jangan expose ke frontend)

## 🧩 Komponen yang Tersedia

### 1. TurnstileWidget
Komponen React untuk menampilkan CAPTCHA:

```tsx
import TurnstileWidget from '@/components/auth/TurnstileWidget';

<TurnstileWidget
  sitekey={import.meta.env.VITE_TURNSTILE_SITEKEY}
  onSuccess={(token) => console.log('Token:', token)}
  onError={(error) => console.error('Error:', error)}
  onExpired={() => console.log('Token expired')}
  theme="light" // 'light' | 'dark' | 'auto'
  size="normal" // 'normal' | 'compact'
/>
```

### 2. useTurnstile Hook
Hook untuk mengelola state Turnstile:

```tsx
import { useTurnstile } from '@/hooks/useTurnstile';

const {
  token,
  isLoading,
  error,
  reset,
  widgetRef
} = useTurnstile({
  onSuccess: (token) => {
    // Handle success
  },
  onError: (error) => {
    // Handle error
  }
});
```

### 3. Turnstile Service
Service untuk validasi server-side:

```tsx
import { validateTurnstileToken } from '@/services/turnstileService';

const result = await validateTurnstileToken(
  token,
  secretKey,
  userIP // optional
);

if (result.isValid) {
  // Token valid, lanjutkan proses
} else {
  // Token tidak valid
  console.error(result.message);
}
```

## 📝 Cara Penggunaan

### Integrasi di Form Login/Register

Turnstile sudah terintegrasi di `EmailAuthPage.tsx`. Berikut cara menggunakannya:

```tsx
// Form akan otomatis:
// 1. Menampilkan widget Turnstile
// 2. Memvalidasi token sebelum submit
// 3. Mengirim token ke server untuk validasi

// Tombol submit hanya aktif jika:
// - Email valid
// - Token Turnstile tersedia
// - Tidak dalam proses loading
```

### Integrasi di Form Lain

```tsx
import TurnstileWidget from '@/components/auth/TurnstileWidget';
import { useTurnstile } from '@/hooks/useTurnstile';

const MyForm = () => {
  const { token, widgetRef } = useTurnstile();
  
  const handleSubmit = async () => {
    if (!token) {
      alert('Silakan selesaikan verifikasi keamanan');
      return;
    }
    
    // Kirim token bersama data form
    await submitForm({ ...formData, turnstileToken: token });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      
      <TurnstileWidget
        ref={widgetRef}
        sitekey={import.meta.env.VITE_TURNSTILE_SITEKEY}
      />
      
      <button type="submit" disabled={!token}>
        Submit
      </button>
    </form>
  );
};
```

## 🔒 Validasi Server-side

### Untuk Backend Node.js/Express

```javascript
import { createTurnstileMiddleware } from '@/services/turnstileService';

// Middleware untuk validasi otomatis
const turnstileMiddleware = createTurnstileMiddleware(
  process.env.TURNSTILE_SECRET_KEY
);

// Gunakan di route
app.post('/api/login', turnstileMiddleware, (req, res) => {
  // Token sudah divalidasi, lanjutkan proses
  const validation = req.turnstileValidation;
  console.log('Validation result:', validation);
});
```

### Validasi Manual

```javascript
import { validateTurnstileToken } from '@/services/turnstileService';

app.post('/api/login', async (req, res) => {
  const { turnstileToken } = req.body;
  const clientIP = req.ip;
  
  const validation = await validateTurnstileToken(
    turnstileToken,
    process.env.TURNSTILE_SECRET_KEY,
    clientIP
  );
  
  if (!validation.isValid) {
    return res.status(400).json({
      error: validation.message
    });
  }
  
  // Lanjutkan proses login
});
```

### Untuk Supabase Edge Functions

```typescript
import { verifyTurnstileToken } from '../_shared/turnstileService.ts';

Deno.serve(async (req) => {
  const { turnstileToken } = await req.json();
  
  const result = await verifyTurnstileToken(
    turnstileToken,
    Deno.env.get('TURNSTILE_SECRET_KEY')!
  );
  
  if (!result.success) {
    return new Response(
      JSON.stringify({ error: 'Invalid CAPTCHA' }),
      { status: 400 }
    );
  }
  
  // Lanjutkan proses
});
```

## 🧪 Testing

### Testing di Development

1. **Setup Environment**:
   ```bash
   # Pastikan .env.local sudah dikonfigurasi
   npm run dev
   ```

2. **Test Widget**:
   - Buka halaman login
   - Widget Turnstile harus muncul
   - Selesaikan challenge (jika ada)
   - Token harus ter-generate

3. **Test Validation**:
   - Submit form dengan token
   - Cek console untuk log validasi
   - Pastikan tidak ada error

### Testing di Production

1. **Update Domain**:
   - Tambahkan domain production di Cloudflare dashboard
   - Update environment variables di hosting

2. **Test End-to-End**:
   - Test dari berbagai browser
   - Test dari berbagai device
   - Monitor error logs

## 🔧 Troubleshooting

### Widget Tidak Muncul

**Kemungkinan Penyebab**:
- Site key tidak valid atau kosong
- Domain tidak terdaftar di Cloudflare
- Script Turnstile gagal load

**Solusi**:
```tsx
// Cek environment variable
console.log('Site key:', import.meta.env.VITE_TURNSTILE_SITEKEY);

// Cek error di console browser
// Pastikan tidak ada network error
```

### Token Tidak Valid

**Kemungkinan Penyebab**:
- Secret key salah
- Token sudah expired
- Token sudah digunakan
- IP address tidak match

**Solusi**:
```javascript
// Debug validasi
const result = await validateTurnstileToken(token, secretKey);
console.log('Validation result:', result);

// Cek error codes
if (result.data && result.data['error-codes']) {
  console.log('Error codes:', result.data['error-codes']);
}
```

### Error Codes Umum

| Error Code | Deskripsi | Solusi |
|------------|-----------|--------|
| `missing-input-secret` | Secret key tidak ada | Cek environment variable |
| `invalid-input-secret` | Secret key tidak valid | Cek secret key di dashboard |
| `missing-input-response` | Token tidak ada | Pastikan token dikirim |
| `invalid-input-response` | Token tidak valid | Token mungkin expired/used |
| `timeout-or-duplicate` | Token expired/duplicate | Generate token baru |
| `internal-error` | Error server Cloudflare | Coba lagi nanti |

### Performance Issues

**Optimasi Loading**:
```tsx
// Preload script Turnstile
<link rel="preload" href="https://challenges.cloudflare.com/turnstile/v0/api.js" as="script" />

// Lazy load widget
const TurnstileWidget = lazy(() => import('@/components/auth/TurnstileWidget'));
```

**Optimasi Bundle**:
```javascript
// Dynamic import untuk mengurangi bundle size
const loadTurnstile = async () => {
  const { useTurnstile } = await import('@/hooks/useTurnstile');
  return useTurnstile;
};
```

## 📚 Referensi

- [Cloudflare Turnstile Documentation](https://developers.cloudflare.com/turnstile/)
- [Turnstile API Reference](https://developers.cloudflare.com/turnstile/get-started/)
- [Widget Configuration](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/)
- [Server-side Validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)

## 🆘 Support

Jika mengalami masalah:
1. Cek dokumentasi di atas
2. Cek console browser untuk error
3. Cek network tab untuk failed requests
4. Cek environment variables
5. Hubungi tim development

---

**Catatan**: Turnstile adalah pengganti reCAPTCHA yang lebih privacy-friendly dan user-friendly. Tidak memerlukan interaksi pengguna dalam kebanyakan kasus.