# 📚 Shared Components Guide

Panduan lengkap untuk menggunakan shared components yang telah dibuat untuk meningkatkan konsistensi UI di seluruh aplikasi.

## 🎯 Tujuan

Shared components ini dibuat untuk:
- **Konsistensi UI** yang lebih baik di seluruh aplikasi
- **Mengurangi duplikasi kode** yang berulang
- **Mempercepat development** dengan komponen yang sudah siap pakai
- **Maintenance yang lebih mudah** karena perubahan terpusat

## 🧩 Komponen yang Tersedia

### 1. FormField Component

Komponen untuk form field yang konsisten dengan error handling dan berbagai tipe input.

```tsx
import { FormField } from '@/components/ui';

// Text Input
<FormField
  type="text"
  name="nama"
  label="Nama Lengkap"
  value={formData.nama}
  onChange={(e) => setFormData({...formData, nama: e.target.value})}
  error={errors.nama}
  placeholder="Masukkan nama lengkap"
  icon={User}
  required
  helpText="Nama akan ditampilkan di profil Anda"
/>

// Number Input with mobile optimization
<FormField
  type="number"
  name="harga"
  label="Harga"
  value={formData.harga}
  onChange={(e) => setFormData({...formData, harga: Number(e.target.value)})}
  min={0}
  step={1000}
  mobileOptimized
  placeholder="0"
/>

// Select Input
<FormField
  type="select"
  name="kategori"
  label="Kategori"
  value={formData.kategori}
  onChange={(value) => setFormData({...formData, kategori: value})}
  options={[
    { value: 'makanan', label: 'Makanan', description: 'Produk makanan' },
    { value: 'minuman', label: 'Minuman', description: 'Produk minuman' }
  ]}
/>

// Textarea
<FormField
  type="textarea"
  name="deskripsi"
  label="Deskripsi"
  value={formData.deskripsi}
  onChange={(e) => setFormData({...formData, deskripsi: e.target.value})}
  rows={4}
/>
```

#### Props FormField:
- `type`: 'text' | 'email' | 'password' | 'number' | 'date' | 'textarea' | 'select'
- `name`: string (identifier untuk field)
- `label`: string (label yang ditampilkan)
- `value`: any (nilai field)
- `onChange`: function (handler untuk perubahan)
- `error?`: string (pesan error)
- `helpText?`: string (teks bantuan)
- `required?`: boolean (field wajib diisi)
- `disabled?`: boolean (field disabled)
- `placeholder?`: string (placeholder text)
- `icon?`: LucideIcon (icon di sebelah kiri)
- `className?`: string (custom CSS classes)

### 2. ActionButtons Component

Komponen untuk tombol aksi yang konsisten di dialog dan form.

```tsx
import { ActionButtons, FormActions } from '@/components/ui';

// Basic usage
<ActionButtons
  onCancel={() => setOpen(false)}
  onSubmit={handleSubmit}
  submitText="Simpan Data"
  isLoading={loading}
/>

// Custom variants
<ActionButtons
  onCancel={() => setOpen(false)}
  onSubmit={handleDelete}
  submitText="Hapus"
  submitVariant="destructive"
  isLoading={deleting}
/>

// Using presets
<FormActions.SaveCancel 
  onCancel={() => setOpen(false)}
  onSubmit={handleSubmit}
  isLoading={saving}
/>

<FormActions.DeleteCancel 
  onCancel={() => setOpen(false)}
  onSubmit={handleDelete}
  isLoading={deleting}
/>
```

#### Preset yang tersedia:
- `FormActions.SaveCancel` - Tombol Simpan & Batal
- `FormActions.CreateCancel` - Tombol Buat & Batal  
- `FormActions.UpdateCancel` - Tombol Perbarui & Batal
- `FormActions.DeleteCancel` - Tombol Hapus & Batal (destructive)
- `FormActions.ContinueBack` - Tombol Lanjutkan & Kembali
- `FormActions.OkCancel` - Tombol OK & Batal

### 3. StatusBadge Component

Komponen untuk menampilkan status dengan warna yang konsisten.

```tsx
import { StatusBadge, StatusBadges } from '@/components/ui';

// Auto-detect variant berdasarkan text
<StatusBadge status="Selesai" />        // → hijau (success)
<StatusBadge status="Pending" />        // → kuning (warning)
<StatusBadge status="Gagal" />          // → merah (error)

// Manual variant
<StatusBadge 
  status="Draft" 
  variant="info" 
  icon={FileText}
  size="sm"
/>

// Using presets
<StatusBadges.OrderCompleted />
<StatusBadges.PaymentPending />
<StatusBadges.Active />
```

#### Variants tersedia:
- `success` - Hijau (berhasil, selesai, aktif)
- `warning` - Kuning (pending, menunggu)
- `error` - Merah (gagal, ditolak, error)
- `info` - Biru (draft, informasi)
- `neutral` - Abu-abu (default)
- `active` - Hijau (status aktif)
- `inactive` - Abu-abu muda (status nonaktif)

### 4. LoadingSpinner Component

Komponen loading yang konsisten dengan berbagai ukuran.

```tsx
import { LoadingSpinner, LoadingStates } from '@/components/ui';

// Basic usage
<LoadingSpinner size="md" showText text="Memuat..." />

// Different contexts
<LoadingStates.Page text="Memuat halaman..." />
<LoadingStates.Card text="Memuat data..." />
<LoadingStates.Table />
<LoadingStates.Form text="Menyimpan..." />

// In button
<Button disabled={loading}>
  {loading && <LoadingStates.Button />}
  {loading ? 'Menyimpan...' : 'Simpan'}
</Button>
```

### 5. EmptyState Component

Komponen untuk menampilkan empty state yang konsisten.

```tsx
import { EmptyState, EmptyStates } from '@/components/ui';

// Basic usage
<EmptyState
  title="Belum ada data"
  description="Data akan muncul setelah Anda menambahkannya"
  actionText="Tambah Data"
  onAction={() => setShowForm(true)}
  illustration="package"
/>

// Using presets
<EmptyStates.NoData 
  actionText="Tambah Item"
  onAction={() => setShowForm(true)}
/>

<EmptyStates.NoSearchResults query={searchQuery} />

<EmptyStates.NoOrders 
  onAction={() => navigate('/orders/create')}
/>
```

## 🔄 Migration Guide

### Sebelum (Kode Lama):
```tsx
// Form field lama - banyak boilerplate
<div>
  <Label htmlFor="nama" className="font-medium text-overflow-safe">
    Nama Supplier <span className="text-red-500">*</span>
  </Label>
  <Input
    id="nama"
    value={formData.nama}
    onChange={(e) => updateField('nama', e.target.value)}
    placeholder="Masukkan nama supplier"
    required
    className={cn("mt-1 input-mobile-safe", formErrors.nama && "border-red-500")}
  />
  {formErrors.nama && (
    <p className="text-red-500 text-sm mt-1 text-overflow-safe">{formErrors.nama}</p>
  )}
</div>

// Action buttons lama
<div className="dialog-responsive-buttons mt-6">
  <Button type="button" variant="outline" onClick={onReset}>
    <span className="text-overflow-safe">Batal</span>
  </Button>
  <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
    <span className="text-overflow-safe">{isEditing ? 'Perbarui' : 'Simpan'}</span>
  </Button>
</div>
```

### Sesudah (Menggunakan Shared Components):
```tsx
// Much cleaner!
<FormField
  type="text"
  name="nama"
  label="Nama Supplier"
  value={formData.nama}
  onChange={(e) => updateField('nama', e.target.value)}
  error={formErrors.nama}
  placeholder="Masukkan nama supplier"
  required
/>

<ActionButtons
  onCancel={onReset}
  onSubmit={() => {}} // handled by form
  submitText={isEditing ? 'Perbarui' : 'Simpan'}
  className="mt-6"
/>
```

## ✅ Best Practices

### 1. Gunakan FormField untuk semua form input
```tsx
// ✅ Good - konsisten dan clean
<FormField
  type="email"
  name="email"
  label="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={emailError}
  icon={Mail}
/>

// ❌ Avoid - manual implementation
<div>
  <Label>Email</Label>
  <Input type="email" />
  {error && <p className="text-red-500">{error}</p>}
</div>
```

### 2. Gunakan preset ActionButtons
```tsx
// ✅ Good - menggunakan preset
<FormActions.SaveCancel 
  onCancel={handleCancel}
  onSubmit={handleSubmit}
  isLoading={loading}
/>

// ❌ Avoid - manual button implementation kecuali butuh customization khusus
<div className="flex gap-2">
  <Button variant="outline">Batal</Button>
  <Button>Simpan</Button>
</div>
```

### 3. Manfaatkan auto-detection StatusBadge
```tsx
// ✅ Good - otomatis detect warna berdasarkan text
<StatusBadge status="Selesai" />    // auto green
<StatusBadge status="Pending" />    // auto yellow
<StatusBadge status="Gagal" />      // auto red

// ❌ Unnecessary - kecuali butuh override
<StatusBadge status="Selesai" variant="success" />
```

### 4. Gunakan preset EmptyState
```tsx
// ✅ Good - menggunakan preset yang sesuai
<EmptyStates.NoRecipes onAction={() => setShowForm(true)} />

// ❌ Avoid - manual implementation untuk kasus umum
<EmptyState
  illustration="file"
  title="Belum ada resep"
  description="Mulai dengan menambahkan resep pertama Anda"
  actionText="Tambah Resep"
  onAction={() => setShowForm(true)}
/>
```

## 🎨 Customization

Semua komponen mendukung customization melalui props `className` dan dapat di-override sesuai kebutuhan:

```tsx
// Custom styling
<FormField
  type="text"
  name="custom"
  label="Custom Field"
  className="my-custom-field"
  // ... other props
/>

// Custom ActionButtons
<ActionButtons className="justify-start">
  <Button variant="outline">Custom</Button>
  <Button variant="secondary">Actions</Button>
</ActionButtons>
```

## 📝 Contoh Lengkap

Lihat file `SupplierFormNew.tsx` untuk contoh lengkap penggunaan semua shared components dalam satu form.

## 🚀 Next Steps

1. **Refactor existing components** untuk menggunakan shared components
2. **Update style guide** dengan komponen baru ini
3. **Training team** untuk menggunakan komponen yang konsisten
4. **Add more presets** sesuai kebutuhan yang sering muncul

---

**💡 Tips**: Gunakan shared components ini secara konsisten untuk menjaga UI/UX yang unified di seluruh aplikasi!