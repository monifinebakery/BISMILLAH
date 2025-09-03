# 🔧 Solusi Masalah Stock Accumulation - Gudang Bahan Baku

## 📋 Masalah yang Dilaporkan

**User Report:**
> "Saya sudah coba input data pembelian, kenapa nama bahan sama dengan supplier berbeda, setelah ke tools Gudang bahan Baku tidak terdeteksi Stocknya? Jadi tidak terakumulasi gitu kak? Adakah solusinya?"

**Contoh Kasus:**
- Beli **Tepung Terigu A** di **Toko Samin** → Data masuk ke gudang bahan baku
- Beli **Tepung Terigu A** di **Toko Berbeda** → Data pembelian ada, tapi di gudang tidak terakumulasi

## 🔍 Root Cause Analysis

### Masalah Utama
Sistem warehouse sync service hanya menggunakan **exact ID matching** untuk menentukan apakah suatu item purchase harus di-merge dengan existing warehouse item atau create new item.

### Kode Bermasalah (SEBELUM)
```typescript
// File: warehouseSyncService.ts - line 163-168
const { data: existing, error: fetchError } = await supabase
  .from('bahan_baku')
  .select('id, stok, harga_rata_rata, harga_satuan')
  .eq('id', itemId)  // ❌ MASALAH: hanya exact ID match
  .eq('user_id', purchase.userId)
  .maybeSingle();
```

### Alur Masalah
1. **Tepung Terigu A** dari **Toko Samin** → create new item dengan `ID_001`
2. **Tepung Terigu A** dari **Toko Berbeda** → berbeda ID (`ID_002`) → tidak match dengan existing → create new item lagi
3. Result: 2 item terpisah dengan nama sama tapi supplier berbeda

## ✅ Solusi Implementasi

### 1. Name-Based Matching Strategy
Implementasi **intelligent matching** dengan priority:
1. **Primary**: Exact ID match (untuk linked items)
2. **Secondary**: Name + Unit match (untuk stock accumulation)

### 2. Enhanced Warehouse Sync Logic

```typescript
/**
 * ✅ IMPROVED: Apply a completed purchase to warehouse stock and WAC
 * Now supports stock accumulation for same materials from different suppliers
 */
export const applyPurchaseToWarehouse = async (purchase: Purchase) => {
  // ... existing code ...

  for (const item of purchase.items) {
    const itemId = (item as any).bahanBakuId || (item as any).bahan_baku_id || (item as any).id;
    const itemName = (item as any).nama ?? (item as any).namaBarang ?? '';
    const itemSatuan = (item as any).satuan ?? '';
    // ... other fields ...

    // ✅ STEP 1: Try to find by exact ID first (for existing linked items)
    let existing = null;
    if (itemId) {
      const { data: exactMatch } = await supabase
        .from('bahan_baku')
        .select('id, nama, satuan, stok, harga_rata_rata, harga_satuan, supplier')
        .eq('id', itemId)
        .eq('user_id', purchase.userId)
        .maybeSingle();
        
      if (exactMatch) {
        existing = exactMatch;
        console.log('✅ Found exact ID match:', existing);
      }
    }
    
    // ✅ STEP 2: If no ID match, try to find by name and unit (for stock accumulation)
    if (!existing) {
      existing = await findExistingMaterialByName(itemName, itemSatuan, purchase.userId);
    }

    // ✅ UPDATE or CREATE with proper stock accumulation
    if (existing) {
      // Accumulate stock and calculate new WAC
      const newStock = existing.stok + qty;
      const newWac = calculateNewWac(existing.harga_rata_rata, existing.stok, qty, unitPrice);
      
      // Update existing item
      await supabase.from('bahan_baku').update({
        stok: newStock,
        harga_rata_rata: newWac,
        harga_satuan: unitPrice,
        supplier: combineSupplierInfo(existing.supplier, purchase.supplier),
        updated_at: new Date().toISOString()
      }).eq('id', existing.id);
      
    } else {
      // Create new item
      await supabase.from('bahan_baku').insert({...});
    }
  }
};
```

### 3. Helper Function: findExistingMaterialByName

```typescript
const findExistingMaterialByName = async (
  materialName: string,
  satuan: string,
  userId: string
): Promise<any | null> => {
  const normalizedName = materialName.toLowerCase().trim();
  
  const { data: materials } = await supabase
    .from('bahan_baku')
    .select('id, nama, satuan, stok, harga_rata_rata, harga_satuan, supplier')
    .eq('user_id', userId)
    .ilike('nama', normalizedName) // Case-insensitive search
    .eq('satuan', satuan); // Must have same unit
  
  if (materials && materials.length > 0) {
    // Prefer exact name match first
    const exactMatch = materials.find(m => 
      m.nama.toLowerCase().trim() === normalizedName
    );
    
    return exactMatch || materials[0]; // Fallback to first similar match
  }
  
  return null;
};
```

## 🎯 Fitur Tambahan

### 1. Smart Supplier Combination
```typescript
// Jika existing supplier: "Toko Samin"
// New supplier: "Toko Berbeda"
// Result: "Toko Samin, Toko Berbeda"
```

### 2. Enhanced WAC Calculation
- Menghitung **Weighted Average Cost** yang akurat across multiple suppliers
- Handle edge cases: zero stock, negative values, price preservation

### 3. Improved Logging
- Detailed console logs untuk debugging
- Match type tracking (ID_MATCH vs NAME_MATCH vs NEW_ITEM)

## 📊 Testing & Validation

### Test Scenarios

**Scenario 1: Same Material from Different Suppliers**
```javascript
// Purchase 1: Tepung Terigu A (10 kg @ Rp15,000) from Toko Samin
// Purchase 2: Tepung Terigu A (5 kg @ Rp16,000) from Toko Berbeda
// Expected Result:
// - Total Stock: 15 kg
// - WAC: (10×15000 + 5×16000)/15 = Rp15,333.33
// - Supplier: "Toko Samin, Toko Berbeda"
```

**Scenario 2: Different Materials (Should NOT Accumulate)**
```javascript
// Purchase 1: Tepung Terigu A (8 kg @ Rp14,000)
// Purchase 2: Tepung Terigu B (6 kg @ Rp15,500)
// Expected Result: 2 separate warehouse items
```

### Running Tests
```bash
# Install dependencies
npm install @supabase/supabase-js

# Run test script
node test-warehouse-stock-accumulation.js
```

## 🚀 Implementasi

### Files Changed
1. **`/src/components/warehouse/services/warehouseSyncService.ts`**
   - Enhanced `applyPurchaseToWarehouse` function
   - Added `findExistingMaterialByName` helper
   - Improved `reversePurchaseFromWarehouse` for consistency

### Backward Compatibility
- ✅ Existing functionality preserved
- ✅ ID-based matching still works for linked items
- ✅ No breaking changes to existing data

### Edge Cases Handled
- ✅ Case-insensitive name matching
- ✅ Unit consistency (kg ≠ gram)
- ✅ Empty/invalid data validation
- ✅ WAC calculation edge cases
- ✅ Supplier information preservation

## 📈 Expected Results

### Before Fix
```
Gudang Bahan Baku:
├── Tepung Terigu A (Toko Samin) - 10 kg
└── Tepung Terigu A (Toko Berbeda) - 5 kg [SEPARATE ITEM]
```

### After Fix
```
Gudang Bahan Baku:
└── Tepung Terigu A - 15 kg (Combined from both suppliers)
    ├── Stock: 15 kg total
    ├── WAC: Rp15,333.33
    └── Suppliers: "Toko Samin, Toko Berbeda"
```

## 🎉 Benefits

1. **Stock Accumulation**: Bahan dengan nama sama dari supplier berbeda akan terakumulasi stocknya
2. **Accurate WAC**: Harga rata-rata tertimbang yang akurat across suppliers
3. **Supplier Tracking**: Informasi supplier tetap tersimpan dan digabungkan
4. **Data Consistency**: Mengurangi duplikasi data di warehouse
5. **Better Reporting**: Inventory reporting menjadi lebih akurat

## 🛠️ Maintenance

### Monitoring
- Check console logs untuk melihat match types
- Monitor WAC calculation accuracy
- Validate supplier information combination

### Potential Issues
- **Similar Names**: "Tepung Terigu A" vs "Tepung Terigu A Premium" - akan dianggap berbeda
- **Unit Consistency**: Pastikan satuan konsisten (kg, gram, liter, dll)
- **Performance**: Large datasets might need indexing optimization

## 📞 Support

Jika masih ada masalah setelah implementasi:
1. Check console logs di browser developer tools
2. Verify database entries di Supabase dashboard  
3. Run test script untuk validate functionality
4. Contact developer untuk troubleshooting lebih lanjut

---

**Status**: ✅ **FIXED** - Stock accumulation now works properly for same materials from different suppliers
