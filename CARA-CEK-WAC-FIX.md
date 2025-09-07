# 🔍 CARA CEK FIX WAC - STEP BY STEP

## 📋 **LANGKAH 1: Jalankan Aplikasi**
1. **Start development server**:
   ```bash
   npm run dev
   # atau
   yarn dev
   ```
2. **Buka browser** ke `http://localhost:3000`
3. **Login** ke akun Anda

## 🧪 **LANGKAH 2: Test WAC Fix**

### A. Cek Status Sebelum Fix
1. **Buka Developer Console** (tekan F12 → pilih tab Console)
2. **Copy & paste script ini**:

```javascript
// Quick WAC Status Check
async function quickWacCheck() {
  const { data: { user } } = await window.supabase.auth.getUser();
  
  // Get completed purchases
  const { data: purchases } = await window.supabase
    .from('purchases')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .limit(3);
    
  // Get warehouse items
  const { data: items } = await window.supabase
    .from('bahan_baku')
    .select('*')
    .eq('user_id', user.id)
    .limit(5);
    
  console.log('📊 CURRENT STATUS:');
  console.log(`✅ Completed purchases: ${purchases?.length || 0}`);
  console.log(`📦 Warehouse items: ${items?.length || 0}`);
  
  // Check WAC status
  const itemsWithZeroWac = items?.filter(i => !i.harga_rata_rata || i.harga_rata_rata === 0) || [];
  console.log(`❌ Items with WAC = 0: ${itemsWithZeroWac.length}`);
  
  if (itemsWithZeroWac.length > 0) {
    console.log('Items needing WAC fix:');
    itemsWithZeroWac.forEach(item => {
      console.log(`  - ${item.nama}: WAC = ${item.harga_rata_rata || 0}`);
    });
  }
}

quickWacCheck();
```

### B. Jalankan Full Test
1. **Copy seluruh isi file** `test-wac-fix.js` 
2. **Paste di console** dan tekan Enter
3. **Lihat output** - akan menunjukkan:
   - Status purchase completed
   - Struktur data purchase items
   - Hasil perhitungan WAC
   - Apakah ada WAC yang perlu difix

### C. Fix WAC (jika diperlukan)
Jika test menunjukkan WAC salah, jalankan:
```javascript
runBulkWacFix();
```

## 🎯 **LANGKAH 3: Verifikasi Fix**

### A. Cek WAC di Database
```javascript
// Check updated WAC
async function verifyWacFix() {
  const { data: { user } } = await window.supabase.auth.getUser();
  
  const { data: items } = await window.supabase
    .from('bahan_baku')
    .select('nama, harga_rata_rata, stok')
    .eq('user_id', user.id)
    .order('nama');
    
  console.log('📊 UPDATED WAC STATUS:');
  items?.forEach(item => {
    console.log(`${item.nama}: WAC = Rp${item.harga_rata_rata || 0}, Stock = ${item.stok}`);
  });
}

verifyWacFix();
```

### B. Cek di UI Aplikasi
1. **Buka halaman Gudang/Warehouse**
2. **Lihat kolom "Harga Rata-rata"** - seharusnya tidak lagi 0
3. **Buka halaman Analisis Profit**
4. **Cek apakah COGS sekarang terisi** (bukan 0)

## 📊 **LANGKAH 4: Test Real-Time**

### A. Buat Purchase Baru
1. **Buka halaman Purchase/Pembelian**
2. **Buat purchase baru** dengan status "pending"
3. **Ubah status ke "completed"**
4. **Cek apakah WAC ter-update otomatis**

### B. Test dengan Console
```javascript
// Watch for WAC changes
const { data: { user } } = await window.supabase.auth.getUser();

// Before status change
const beforeItems = await window.supabase
  .from('bahan_baku')
  .select('nama, harga_rata_rata')
  .eq('user_id', user.id);

console.log('📊 WAC BEFORE purchase completion:', beforeItems.data);

// Ubah status purchase di UI dari "pending" ke "completed"
// Lalu jalankan ini:

// After status change  
const afterItems = await window.supabase
  .from('bahan_baku')
  .select('nama, harga_rata_rata')
  .eq('user_id', user.id);

console.log('📊 WAC AFTER purchase completion:', afterItems.data);
```

## 🎯 **EXPECTED HASIL:**

### ✅ **SEBELUM FIX:**
- WAC = 0 atau null
- COGS di profit analysis = 0
- Gross profit = revenue (karena tidak ada cost)

### ✅ **SETELAH FIX:**
- WAC = nilai yang benar berdasarkan purchase
- COGS di profit analysis = nilai yang realistis  
- Gross profit = revenue - COGS yang benar

## 🚨 **TROUBLESHOOTING:**

### Jika WAC masih 0:
1. **Cek purchase items structure**:
   ```javascript
   // Check actual field names in your purchases
   const { data: purchases } = await window.supabase
     .from('purchases')
     .select('items')
     .eq('status', 'completed')
     .limit(1);
     
   console.log('Purchase items structure:', purchases[0]?.items);
   ```

2. **Cek linking antara purchase dan warehouse**:
   ```javascript
   // Check ID linking
   const purchaseItemIds = new Set();
   const warehouseItemIds = new Set();
   
   // Extract IDs from purchases...
   // Compare with warehouse IDs...
   ```

### Jika masih bermasalah:
- **Screenshot console output** 
- **Share struktur data purchase items**
- **Beri tahu error message** yang muncul

## 🔄 **JIKA BUTUH RESET:**
```javascript
// Reset WAC to recalculate from scratch
async function resetWac() {
  const { data: { user } } = await window.supabase.auth.getUser();
  
  await window.supabase
    .from('bahan_baku')
    .update({ harga_rata_rata: null })
    .eq('user_id', user.id);
    
  console.log('✅ WAC reset. Run fix again.');
}
```
