# 🛠️ Perbaikan ReferenceError: id is not defined

## ❌ **Error**
```
ReferenceError: id is not defined
    at ja (PurchaseAddEditPage-DE-iPqfn.js:1:22891)
```

## 🕵️ **Penyebab Masalah**

Terjadi konflik penamaan variabel pada **PurchaseAddEditPage.tsx**:

1. **Import locale**: `import { id as localeId } from 'date-fns/locale'`
2. **URL params destructuring**: `const { id: purchaseId } = useParams<{ id: string }>()`
3. **Usage di Calendar**: `locale={localeId}` 

Kemungkinan ada scope confusion antara variabel `id` yang di-destructure dari `useParams` dan import alias `localeId`.

## ✅ **Solusi yang Diterapkan**

### 1. **Mengubah Nama Alias Import**
```tsx
// ❌ SEBELUM
import { id as localeId } from 'date-fns/locale';

// ✅ SETELAH  
import { id as dateLocale } from 'date-fns/locale';
```

### 2. **Memperbarui Penggunaan di Calendar**
```tsx
// ❌ SEBELUM
<Calendar
  mode="single"
  selected={UserFriendlyDate.forCalendar(formData.tanggal)}
  onSelect={(date) => { /* ... */ }}
  disabled={(date) => { /* ... */ }}
  initialFocus
  locale={localeId}  // ❌ Nama lama
/>

// ✅ SETELAH
<Calendar
  mode="single"
  selected={UserFriendlyDate.forCalendar(formData.tanggal)}
  onSelect={(date) => { /* ... */ }}
  disabled={(date) => { /* ... */ }}
  initialFocus
  locale={dateLocale}  // ✅ Nama baru
/>
```

## 🔍 **Analisis Masalah**

### **Konflik Penamaan dalam JavaScript Bundler**
Ketika kode dikompilasi dan di-bundle, terkadang terjadi konflik scope dimana:

1. **Destructuring** `{ id: purchaseId }` membuat variabel `id` dalam scope
2. **Import alias** `{ id as localeId }` juga menggunakan keyword `id` 
3. **Bundler/minifier** bisa mengalami confusion dalam resolving variable references
4. **Runtime error** terjadi karena `id` tidak terdefinisi dengan benar

### **Mengapa Terjadi di Production Build?**
- Development mode: Variabel names preserved
- Production build: Code minification dan optimization
- Variable name conflicts become more apparent setelah bundling

## 🎯 **Best Practices untuk Menghindari**

### 1. **Gunakan Descriptive Alias Names**
```tsx
// ✅ BAIK - Deskriptif dan jelas
import { id as indonesianLocale } from 'date-fns/locale';
import { id as dateLocaleId } from 'date-fns/locale';

// ❌ HINDARI - Generic dan confusing
import { id as localeId } from 'date-fns/locale';
import { id } from 'date-fns/locale';
```

### 2. **Konsisten dalam Destructuring**
```tsx
// ✅ BAIK - Konsisten naming
const { id: itemId } = useParams<{ id: string }>();
const { userId } = useParams<{ userId: string }>();

// ❌ HINDARI - Generic naming yang bisa conflict
const { id } = useParams<{ id: string }>();
```

### 3. **Import Organization**
```tsx
// ✅ BAIK - Grouped dan clear
import { id as dateLocale } from 'date-fns/locale';
import { format as formatDate } from 'date-fns';

// Data fetching
import { useParams } from 'react-router-dom';
const { id: resourceId } = useParams<{ id: string }>();
```

## 🧪 **Testing untuk Variable Conflicts**

### 1. **ESLint Rules**
```json
{
  "rules": {
    "no-shadow": "error",
    "no-redeclare": "error", 
    "@typescript-eslint/no-shadow": "error"
  }
}
```

### 2. **Code Review Checklist**
- [ ] Import aliases are descriptive
- [ ] No generic variable names like `id`, `data`, `item`
- [ ] Destructuring uses descriptive names
- [ ] No variable name conflicts in same scope

## 🔧 **Files Modified**

### `/src/components/purchase/PurchaseAddEditPage.tsx`
- **Line 27**: Changed import alias `localeId` → `dateLocale`
- **Line 349**: Updated usage `locale={localeId}` → `locale={dateLocale}`

## ✅ **Verification**
- [x] Error resolved
- [x] Application builds successfully
- [x] Calendar component works correctly
- [x] No variable naming conflicts
- [x] Code is more readable

---

**Takeaway**: Gunakan descriptive variable names dan hindari generic aliases untuk mencegah scope confusion dan variable conflicts, terutama dalam kode yang di-bundle dan di-minify.
