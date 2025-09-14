# Panduan Setup Google reCAPTCHA v3

Dokumen ini menjelaskan cara mengaktifkan Google reCAPTCHA v3 pada halaman login.

## 1. Dapatkan Site Key dan Secret Key
1. Buka [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Buat situs baru dan pilih **reCAPTCHA v3**
3. Catat **Site Key** dan **Secret Key**

Dokumentasi resmi: [developers.google.com/recaptcha/docs/v3](https://developers.google.com/recaptcha/docs/v3)

## 2. Konfigurasi Environment Variables
Tambahkan variabel berikut ke file `.env` atau dashboard hosting:

```bash
VITE_RECAPTCHA_SITEKEY=6Lcv_MgrAAAAAEqyzwMCpPeLos-UZikvWYS98Zm2
RECAPTCHA_SECRET_KEY=6Lcv_MgrAAAAALThVfcTFwED8YnPVvu9lxMtaepF
```

- `VITE_RECAPTCHA_SITEKEY` digunakan di frontend (public)
- `RECAPTCHA_SECRET_KEY` digunakan di backend (private)

## 3. Penggunaan di Frontend
Gunakan hook `useRecaptcha` untuk mendapatkan token:

```tsx
import { useRecaptcha } from '@/hooks/useRecaptcha';

const { execute } = useRecaptcha(import.meta.env.VITE_RECAPTCHA_SITEKEY);

const handleLogin = async () => {
  const token = await execute('login');
  // kirim token ke server untuk verifikasi
};
```

## 4. Verifikasi di Backend
Token yang diterima dapat divalidasi menggunakan fungsi `verifyRecaptchaToken` yang tersedia di `src/services/recaptchaService.ts`.
