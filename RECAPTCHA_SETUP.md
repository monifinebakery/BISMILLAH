# Panduan Setup Google reCAPTCHA

Dokumen ini menjelaskan cara mengaktifkan Google reCAPTCHA.

## 1. Dapatkan Site Key dan Secret Key
1. Buka [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Buat situs baru dan pilih tipe reCAPTCHA yang diinginkan (misalnya reCAPTCHA v2)
3. Catat **Site Key** dan **Secret Key**

## 2. Konfigurasi Environment Variables
Tambahkan variabel berikut ke file `.env` atau dashboard hosting:

```bash
VITE_RECAPTCHA_SITEKEY=6Lcv_MgrAAAAAEqyzwMCpPeLos-UZikvWYS98Zm2
RECAPTCHA_SECRET_KEY=6Lcv_MgrAAAAALThVfcTFwED8YnPVvu9lxMtaepF
```

- `VITE_RECAPTCHA_SITEKEY` digunakan di frontend (public)
- `RECAPTCHA_SECRET_KEY` digunakan di backend (private)

## 3. Gunakan Komponen `RecaptchaWidget`
Contoh penggunaan di React:

```tsx
import RecaptchaWidget from '@/components/auth/RecaptchaWidget';
import { useRecaptcha } from '@/hooks/useRecaptcha';

const { token, widgetRef } = useRecaptcha();

<RecaptchaWidget
  ref={widgetRef}
  sitekey={import.meta.env.VITE_RECAPTCHA_SITEKEY}
  onSuccess={(t) => setToken(t)}
/>
```

Token `reCAPTCHA` kemudian dapat dikirim ke server untuk diverifikasi menggunakan `verifyRecaptchaToken`.
