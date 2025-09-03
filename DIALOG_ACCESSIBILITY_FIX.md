# 🛠️ Perbaikan Dialog Accessibility Error

## ❌ Masalah
Error yang muncul di console browser:
```
`DialogContent` requires a `DialogTitle` for the component to be accessible for screen reader users.

If you want to hide the `DialogTitle`, you can wrap it with our VisuallyHidden component.
```

## ✅ Solusi yang Telah Diterapkan

### 1. **DialogManager Component** (Warehouse)
**File**: `/src/components/warehouse/components/DialogManager.tsx`

**Masalah**: Komponen `DialogLoader` dan `DialogError` menggunakan `DialogContent` tanpa `DialogTitle`.

**Perbaikan**:
- **DialogLoader**: Menambahkan `DialogTitle` tersembunyi dengan `VisuallyHidden`
- **DialogError**: Menambahkan `DialogTitle` yang terlihat

```tsx
// ❌ SEBELUM
const DialogLoader = () => (
  <Dialog open={true}>
    <DialogContent centerMode="overlay">
      {/* konten tanpa DialogTitle */}
    </DialogContent>
  </Dialog>
);

// ✅ SETELAH
const DialogLoader = () => (
  <Dialog open={true}>
    <DialogContent centerMode="overlay">
      <DialogHeader>
        <VisuallyHidden>
          <DialogTitle>Memuat Dialog</DialogTitle>
        </VisuallyHidden>
      </DialogHeader>
      {/* konten lainnya */}
    </DialogContent>
  </Dialog>
);
```

### 2. **Command Dialog Component**
**File**: `/src/components/ui/command.tsx`

**Masalah**: `CommandDialog` menggunakan `DialogContent` tanpa `DialogTitle`.

**Perbaikan**: Menambahkan `DialogTitle` tersembunyi untuk accessibility.

```tsx
// ❌ SEBELUM
const CommandDialog = ({ children, ...props }: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0">
        <Command>
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

// ✅ SETELAH
const CommandDialog = ({ children, ...props }: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0">
        <DialogHeader>
          <VisuallyHidden>
            <DialogTitle>Command Palette</DialogTitle>
          </VisuallyHidden>
        </DialogHeader>
        <Command>
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}
```

## 🔧 Dependencies yang Ditambahkan

### @radix-ui/react-visually-hidden
```bash
pnpm add @radix-ui/react-visually-hidden
```

## 📋 Komponen VisuallyHidden

**File**: `/src/components/ui/visually-hidden.tsx`

Komponen ini memungkinkan elemen tetap accessible untuk screen reader tapi tidak terlihat secara visual:

```tsx
import * as VisuallyHiddenPrimitive from "@radix-ui/react-visually-hidden";

const VisuallyHidden = React.forwardRef<
  React.ElementRef<typeof VisuallyHiddenPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof VisuallyHiddenPrimitive.Root>
>(({ ...props }, ref) => (
  <VisuallyHiddenPrimitive.Root ref={ref} {...props} />
));
```

## 🎯 Kapan Menggunakan VisuallyHidden vs DialogTitle Biasa

### Gunakan VisuallyHidden ketika:
- Dialog tidak memerlukan title yang terlihat secara visual
- Layout sudah menunjukkan konteks yang jelas
- Seperti loading dialog, command palette, dll

### Gunakan DialogTitle biasa ketika:
- Dialog memerlukan title yang jelas untuk user
- Seperti form dialog, confirmation dialog, error dialog

## 🧪 Cara Mencegah Error di Masa Depan

### 1. Selalu Sertakan DialogTitle
Setiap kali menggunakan `DialogContent`, pastikan ada `DialogTitle`:

```tsx
// ✅ BENAR
<DialogContent>
  <DialogHeader>
    <DialogTitle>Title Dialog</DialogTitle>
    {/* atau jika ingin disembunyikan: */}
    <VisuallyHidden>
      <DialogTitle>Title untuk Screen Reader</DialogTitle>
    </VisuallyHidden>
  </DialogHeader>
  {/* konten dialog */}
</DialogContent>
```

### 2. Gunakan Template yang Sudah Ada
Gunakan `AccessibleDialogTemplate` untuk dialog baru:

```tsx
import { AccessibleDialogTemplate } from '@/components/ui/accessible-dialog-template';

<AccessibleDialogTemplate
  isOpen={isOpen}
  onClose={onClose}
  title="Dialog Title"
  hideTitle={true} // jika ingin disembunyikan
>
  {/* konten dialog */}
</AccessibleDialogTemplate>
```

### 3. Script untuk Audit
```bash
# Mencari DialogContent tanpa DialogTitle
grep -r "DialogContent" src/ | grep -v "DialogTitle"
```

## ✅ Status Perbaikan

- [x] DialogManager - DialogLoader
- [x] DialogManager - DialogError  
- [x] CommandDialog
- [x] Install @radix-ui/react-visually-hidden
- [x] Dokumentasi perbaikan

## 🔍 Komponen yang Sudah Aman

Komponen-komponen berikut sudah memiliki `DialogTitle` yang proper:
- `FinancialTransactionList`
- `DateRangePicker`
- `AlertDialog` components
- `AccessibleDialogTemplate`

---

**Catatan**: Error ini muncul karena Radix UI memerlukan `DialogTitle` untuk accessibility. Bahkan jika title tidak perlu terlihat, tetap harus ada untuk screen reader users.
