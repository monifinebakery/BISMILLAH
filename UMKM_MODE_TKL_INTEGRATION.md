# 🏭 UMKM Mode: TKL Integration untuk Simplifikasi User Experience

## 🎯 **Masalah yang Diselesaikan**

**Sebelum Fix:**
- User UMKM bingung input TKL di dua tempat: Resep + Biaya Operasional  
- TKL sering kosong/0 karena user tidak tahu harus isi berapa di form resep
- Flow complicated: input bahan di resep, TKL manual di resep, overhead terpisah
- Tidak konsisten dengan prinsip "satu sumber truth"

**Setelah Fix (UMKM Mode):**
- ✅ **Satu tempat input**: Semua biaya operasional (termasuk TKL) di menu Biaya Operasional
- ✅ **Resep fokus bahan**: User hanya isi bahan + yield di resep form
- ✅ **TKL otomatis**: TKL per pcs dihitung otomatis dari target produksi bulanan
- ✅ **Overhead gabung TKL**: Overhead per pcs = HPP + TKL (lebih simple untuk UMKM)

---

## 🔧 **Implementasi Technical**

### **1. Triple-Mode Cost Classification**

Sistem sekarang mendukung 3 kategori biaya:

```typescript
// NEW: Extended cost groups
type CostGroup = 'hpp' | 'tkl' | 'operasional';

// TKL Keywords for auto-classification
export const TKL_KEYWORDS = [
  'koki', 'chef', 'tukang masak', 'baker', 'pastry chef',
  'operator produksi', 'staff produksi', 'pekerja produksi',
  'gaji harian', 'upah harian', 'borongan', 'lembur produksi',
  'bonus produksi', 'insentif produksi', 'thr produksi'
  // ... more keywords
];
```

### **2. UMKM-Friendly Calculation**

```typescript
// NEW: Triple-mode calculation for UMKM
export const calculateTripleModeCosts = (
  costs: OperationalCost[],
  targetOutputMonthly: number
): {
  overhead: DualModeCalculationResult;  // HPP + TKL combined  
  operasional: DualModeCalculationResult;
  breakdown: {
    hppOnly: DualModeCalculationResult;
    tklOnly: DualModeCalculationResult;
  };
} => {
  const hpp = calculateCostPerUnit(costs, 'hpp', targetOutputMonthly);
  const tkl = calculateCostPerUnit(costs, 'tkl', targetOutputMonthly);
  const operasional = calculateCostPerUnit(costs, 'operasional', targetOutputMonthly);
  
  // 🎯 KEY: Combine HPP + TKL for UMKM simplicity
  const combinedOverhead: DualModeCalculationResult = {
    group: 'hpp',
    totalCosts: hpp.totalCosts + tkl.totalCosts,
    targetOutput: targetOutputMonthly,
    costPerUnit: Math.round((hpp.totalCosts + tkl.totalCosts) / targetOutputMonthly),
    isValid: hpp.isValid && tkl.isValid && targetOutputMonthly > 0,
    validationErrors: [...hpp.validationErrors, ...tkl.validationErrors]
  };
  
  return {
    overhead: combinedOverhead, // This goes to app_settings.overhead_per_pcs
    operasional,
    breakdown: { hppOnly: hpp, tklOnly: tkl }
  };
};
```

### **3. Enhanced HPP Calculation Update**

```typescript
// Recipe HPP calculation now uses combined overhead
const hppPerPcs = Math.round(bahanPerPcs + tklPerPcs + totalOverheadForHPP);
//                                       ↑            ↑
//                                   Manual input   overhead_per_pcs (includes HPP+TKL)
//                                  (backward comp)
```

### **4. UI Simplification**

**Recipe Form - Before:**
```jsx
// Manual TKL input field
<Input value={biayaTenagaKerja} />  // User confused what to enter
```

**Recipe Form - After (UMKM Mode):**
```jsx
// Auto TKL explanation  
<div className="bg-blue-50 p-4 rounded-lg">
  <span>Tenaga Kerja Langsung (TKL)</span>
  <div className="bg-white p-3 rounded">
    <span>TKL per pcs: Otomatis dari Biaya Operasional</span>
    <p>💡 Nilai ini sudah termasuk dalam "Overhead" di hasil HPP</p>
  </div>
  <button onClick={() => window.open('/operational-costs', '_blank')}>
    Setup TKL di Biaya Operasional →
  </button>
</div>
```

---

## 📊 **Flow UMKM Setelah Update**

### **Step 1: Setup Biaya Operasional** (One-time setup)
```
Menu: Biaya Operasional

1. Input Target Produksi: 3.000 pcs/bulan
2. Tambah biaya operasional:
   - "Sewa Dapur" → Kategori: Overhead Pabrik → Rp 1.500.000/bulan
   - "Gas Oven" → Kategori: Overhead Pabrik → Rp 690.000/bulan  
   - "Gaji Koki" → Kategori: Tenaga Kerja Langsung → Rp 3.000.000/bulan
   - "Marketing" → Kategori: Operasional → Rp 4.000.000/bulan

3. Sistem auto-calculate:
   - overhead_per_pcs = (HPP + TKL) ÷ target = (2.190.000 + 3.000.000) ÷ 3.000 = Rp 1.730/pcs
   - operasional_per_pcs = Operasional ÷ target = 4.000.000 ÷ 3.000 = Rp 1.333/pcs
```

### **Step 2: Buat Resep** (Daily workflow)
```  
Menu: Produk → Tambah Resep

1. Input bahan baku: tepung, gula, dll (sama seperti biasa)
2. Input jumlah porsi + pcs per porsi
3. TKL: Tampil "Otomatis dari Biaya Operasional" (tidak perlu input manual)
4. Overhead: Tampil "Otomatis dari Biaya Operasional" (tidak perlu input manual)

Hasil HPP:
- Bahan: Rp 4.200/pcs (dari BOM)
- TKL: Rp 0/pcs (manual, karena sudah masuk overhead)  
- Overhead: Rp 1.730/pcs (sudah termasuk HPP + TKL otomatis)
- Total HPP: Rp 5.930/pcs
```

---

## 🎯 **Benefits untuk UMKM**

### **✅ Simplified User Experience**
- **One source of truth**: Semua biaya bulanan di satu tempat (Biaya Operasional)
- **No manual calculation**: System auto-calculate per pcs from monthly costs
- **Focus on core**: Recipe form fokus ke bahan baku dan yield (yang paling familiar)
- **Clear separation**: HPP vs Operasional jelas terpisah untuk analysis

### **✅ Error Prevention**  
- **No more TKL = 0**: TKL otomatis dari data operasional yang real
- **Consistent calculation**: Formula per pcs konsisten di seluruh system
- **Auto-sync**: Perubahan di operational costs langsung update ke recipes

### **✅ Business Intelligence**
- **Complete cost tracking**: Semua biaya tercatat sistematis per bulan
- **Accurate pricing**: HPP akurat karena include real TKL costs  
- **BEP analysis**: Operasional costs terpisah untuk break-even point analysis
- **Scalable**: System grows dengan bisnis (bisa tambah cost categories)

---

## 📱 **User Journey Example**

### **Pak Budi - UMKM Bakery**

**Sebelum (Bingung):**
```
1. Buat resep donat
2. Isi bahan: tepung, gula, dll ✅
3. TKL: "Hmm.. berapa ya? Gaji koki Rp 3jt/bulan, tapi untuk berapa pcs?" ❓
4. Input asal: Rp 50.000 (salah, terlalu tinggi)
5. Overhead: "Ini apa ya? Listrik berapa?" ❓  
6. HPP jadi tidak akurat ❌
```

**Sesudah (Simple):**
```
1. Setup sekali di Biaya Operasional:
   - Target: 3.000 pcs/bulan
   - Sewa warung: Rp 2jt/bulan (Overhead)
   - Gaji koki: Rp 3jt/bulan (TKL)  
   - Marketing: Rp 1jt/bulan (Operasional)
   
2. Buat resep donat:
   - Isi bahan: tepung, gula, dll ✅
   - TKL: "Otomatis Rp 1.000/pcs" ✅ (dari 3jt ÷ 3000)
   - Overhead: "Otomatis Rp 667/pcs" ✅ (dari 2jt ÷ 3000)  
   - HPP akurat! ✅
```

---

## 🔮 **Future Enhancements**

### **Phase 2: Advanced UMKM Features**
1. **Cost Templates**: Preset biaya operasional untuk jenis usaha (bakery, catering, etc)
2. **Smart Suggestions**: AI suggest biaya yang mungkin missing based on business type
3. **Seasonal Adjustment**: Auto-adjust target production berdasarkan musim
4. **Multi-outlet**: Support multiple locations dengan shared vs local costs

### **Phase 3: Business Intelligence**  
1. **Profit Optimization**: Suggest optimal pricing berdasarkan market analysis
2. **Cost Efficiency**: Alert jika ada biaya yang unusually high compared to benchmark
3. **Growth Planning**: Project future costs berdasarkan target growth
4. **Integration**: Connect dengan marketplace APIs untuk real pricing data

---

## ✅ **Migration Guide**

### **For Existing Users**
Existing recipes dengan manual TKL input tetap work (backward compatibility):
- Manual TKL input masih dihitung (advanced users)  
- Sistem auto-detect: jika manual TKL = 0, pakai otomatis dari overhead
- Gradual migration: users bisa slowly move TKL costs ke Biaya Operasional

### **For New Users (UMKM)**
Default experience adalah UMKM mode:
- TKL input di recipe disembunyikan dengan explanation
- Focus on operational costs setup first
- Guided onboarding untuk setup target + basic costs

---

## 🎉 **Conclusion**

UMKM Mode TKL Integration menciptakan **flow yang natural untuk UMKM Indonesia**:

1. **Setup sekali**: Target produksi + daftar biaya bulanan
2. **Resep fokus bahan**: Input bahan baku dan yield saja
3. **HPP otomatis akurat**: Include semua costs tanpa manual calculation
4. **Scale friendly**: System grows dengan bisnis

**Result**: TKL tidak akan pernah lagi jadi 0, karena semua biaya tenaga kerja sudah terintegrasi sistematis dari operasional costs ke recipe costing! 🚀
