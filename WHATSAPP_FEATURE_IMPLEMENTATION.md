# Implementasi Fitur WhatsApp Business/Personal

## Ringkasan Perubahan

Fitur ini menambahkan kemampuan untuk memilih antara WhatsApp Personal atau WhatsApp Business untuk fitur follow-up pelanggan dalam aplikasi.

## File yang Diubah

### 1. `src/contexts/UserSettingsContext.tsx`
- **Perubahan**: Menambahkan field `whatsappType` ke interface `UserSettings`
- **Detail**:
  - Tambah field `whatsappType: 'personal' | 'business'` 
  - Update default settings dengan `whatsappType: 'personal'`
  - Perbarui fungsi API untuk menyimpan dan membaca field `whatsapp_type` dari database
  - Tambah field ke semua fungsi load dan save settings

### 2. `src/components/WhatsappFollowUpModal.tsx`
- **Perubahan**: Update logika URL generation berdasarkan setting WhatsApp type
- **Detail**:
  - Import `useUserSettings` hook
  - Tambah kondisi untuk memilih URL yang berbeda:
    - **Personal**: `https://wa.me/${phoneNumber}?text=${message}`
    - **Business**: `https://api.whatsapp.com/send/?phone=${phoneNumber}&text=${message}&type=phone_number&app_absent=0`
  - Tambah indikator tipe WhatsApp di dialog
  - Update toast message dengan tipe WhatsApp yang digunakan

### 3. `src/pages/Settings.tsx`
- **Perubahan**: Menambahkan section pengaturan WhatsApp type
- **Detail**:
  - Tambah section "Pengaturan WhatsApp" dengan UI card selection
  - Dua pilihan: WhatsApp Personal dan WhatsApp Business
  - Visual indicator untuk pilihan aktif
  - Informasi dan keunggulan masing-masing tipe
  - Include field `whatsappType` dalam logic hasChanges dan saveSettings

### 4. `migrations/add_whatsapp_type_to_user_settings.sql`
- **Perubahan**: Script migration database baru
- **Detail**:
  - Tambah kolom `whatsapp_type` ke tabel `user_settings`
  - Set default value 'personal'
  - Tambah constraint untuk nilai valid ('personal' atau 'business')
  - Update existing records dengan nilai default

## Cara Menjalankan Migration Database

```sql
-- Jalankan script SQL ini di Supabase SQL Editor
-- File: migrations/add_whatsapp_type_to_user_settings.sql

-- Add whatsapp_type column with default value 'personal'
ALTER TABLE user_settings 
ADD COLUMN whatsapp_type VARCHAR(20) DEFAULT 'personal';

-- Add constraint to only allow 'personal' or 'business' values
ALTER TABLE user_settings 
ADD CONSTRAINT check_whatsapp_type 
CHECK (whatsapp_type IN ('personal', 'business'));

-- Add comment for documentation
COMMENT ON COLUMN user_settings.whatsapp_type IS 'WhatsApp type preference: personal or business';

-- Update any existing NULL values to default
UPDATE user_settings 
SET whatsapp_type = 'personal' 
WHERE whatsapp_type IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE user_settings 
ALTER COLUMN whatsapp_type SET NOT NULL;
```

## Testing Guide

### 1. Persiapan Testing
1. Jalankan migration database terlebih dahulu
2. Start development server: `pnpm dev`
3. Login ke aplikasi

### 2. Test Setting Page
1. Buka halaman **Settings**
2. Scroll ke section **"Pengaturan WhatsApp"**
3. Verifikasi ada 2 pilihan: Personal dan Business
4. Test pilih salah satu option
5. Klik tombol **"Simpan Info Bisnis"**
6. Verifikasi toast success muncul
7. Refresh halaman, pastikan setting tersimpan

### 3. Test WhatsApp Follow-up
1. Buka halaman **Orders/Pesanan**
2. Pilih order yang memiliki nomor telepon pelanggan
3. Klik tombol **WhatsApp follow-up** 
4. Verifikasi di dialog muncul **"Tipe WhatsApp: [Personal/Business]"**
5. Klik **"Follow-up Sekarang"**
6. Verifikasi:
   - **Personal**: URL dimulai dengan `https://wa.me/`
   - **Business**: URL dimulai dengan `https://api.whatsapp.com/send/`

### 4. Test Different Settings
1. Ganti setting dari Personal ke Business (atau sebaliknya)
2. Simpan pengaturan
3. Test lagi WhatsApp follow-up
4. Verifikasi URL yang dibuka berbeda sesuai setting

## URL Differences

### WhatsApp Personal
```
https://wa.me/6281234567890?text=Halo%20Customer...
```

### WhatsApp Business  
```
https://api.whatsapp.com/send/?phone=6281234567890&text=Halo%20Customer...&type=phone_number&app_absent=0
```

## Troubleshooting

### Jika migration gagal:
```sql
-- Check if column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_settings' AND column_name = 'whatsapp_type';

-- Drop constraint if exists
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS check_whatsapp_type;

-- Drop column if exists  
ALTER TABLE user_settings DROP COLUMN IF EXISTS whatsapp_type;
```

### Jika TypeScript error:
- Pastikan semua import `UserSettings` interface menggunakan versi terbaru
- Restart TypeScript server di VS Code: `Cmd+Shift+P` → "Restart TS Server"

## Fitur yang Diimplementasi ✅

- [x] Database schema dengan migration script
- [x] UserSettings context update dengan whatsappType field  
- [x] Settings page dengan UI selection WhatsApp type
- [x] WhatsappFollowUpModal update dengan conditional URL
- [x] Visual indicator tipe WhatsApp di follow-up dialog
- [x] Form validation dan auto-save settings
- [x] Backward compatibility dengan existing data

## Next Steps (Opsional)

- [ ] Add analytics tracking untuk usage WhatsApp type
- [ ] Add bulk WhatsApp follow-up dengan setting type
- [ ] Integration dengan WhatsApp Business API yang sesungguhnya
- [ ] Add template message yang berbeda untuk Business vs Personal