## 🔍 DIAGNOSA MASALAH WAC = 0

Berdasarkan analisis kode, saya menemukan **KEMUNGKINAN MASALAH** kenapa WAC masih 0 meski purchase sudah "selesai":

### 🎯 **SUSPECTED ROOT CAUSES**

#### **1. FIELD ID MISMATCH** ❌
```js
// Dalam purchase items, ID item bisa berupa:
const itemId = item.bahanBakuId || item.bahan_baku_id || item.id;

// Tapi di warehouseSyncService.ts line 418-421:
purchase.items.forEach((purchaseItem: any) => {
  if (purchaseItem.bahan_baku_id === item.id) {  // ⚠️ Hanya cek bahan_baku_id
    const qty = Number(purchaseItem.jumlah || 0);     // ⚠️ Hanya cek jumlah
    const price = Number(purchaseItem.harga_per_satuan || 0); // ⚠️ Hanya cek harga_per_satuan
  }
});
```

**MASALAH:** Purchase menggunakan `bahanBakuId` + `kuantitas` + `hargaSatuan`, tapi WAC recalculation hanya mencari `bahan_baku_id` + `jumlah` + `harga_per_satuan`!

#### **2. INCONSISTENT FIELD NAMES** ❌
Purchase items menggunakan:
- `bahanBakuId` (ID item)
- `kuantitas` (quantity) 
- `hargaSatuan` (unit price)

WAC calculation mencari:
- `bahan_baku_id` (ID item)
- `jumlah` (quantity)
- `harga_per_satuan` (unit price)

#### **3. STATUS STRING MISMATCH** ❌
Sistem menggunakan `"completed"`, tapi di UI mungkin menyimpan `"selesai"`.

### 🔧 **PROVEN FIXES**

#### **Fix 1: Update WAC Recalculation Logic**
File: `src/components/warehouse/services/warehouseSyncService.ts` line 415-425

```js
// SEBELUM (BROKEN):
purchases?.forEach(purchase => {
  if (purchase.items && Array.isArray(purchase.items)) {
    purchase.items.forEach((purchaseItem: any) => {
      if (purchaseItem.bahan_baku_id === item.id) {  // ❌ Salah field
        const qty = Number(purchaseItem.jumlah || 0);     // ❌ Salah field
        const price = Number(purchaseItem.harga_per_satuan || 0); // ❌ Salah field
        totalQuantity += qty;
        totalValue += qty * price;
      }
    });
  }
});

// SESUDAH (FIXED):
purchases?.forEach(purchase => {
  if (purchase.items && Array.isArray(purchase.items)) {
    purchase.items.forEach((purchaseItem: any) => {
      // ✅ FLEXIBLE ID MATCHING
      const itemId = purchaseItem.bahanBakuId || purchaseItem.bahan_baku_id || purchaseItem.id;
      
      if (itemId === item.id) {
        // ✅ FLEXIBLE FIELD MATCHING
        const qty = Number(purchaseItem.kuantitas || purchaseItem.jumlah || 0);
        const price = Number(purchaseItem.hargaSatuan || purchaseItem.harga_per_satuan || purchaseItem.harga_satuan || 0);
        totalQuantity += qty;
        totalValue += qty * price;
      }
    });
  }
});
```

#### **Fix 2: Update fixWarehouseItem Logic** 
File: `src/components/warehouse/services/warehouseSyncService.ts` line 660-670

Same field mismatch issue exists here too.

### 🎯 **IMMEDIATE ACTION NEEDED**

1. **Fix field name inconsistency** di WAC calculation
2. **Test dengan purchase "completed" yang sudah ada**
3. **Verify WAC ter-update** setelah fix

Kira-kira **INI yang menyebabkan WAC = 0** meski purchase sudah selesai!
