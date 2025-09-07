# 📦 **Panduan Packaging Cost untuk Perhitungan HPP** 

## 🤔 **Pertanyaan: "Packaging masuk ke mana dalam perhitungan HPP?"**

### 💡 **Jawaban: Packaging masuk ke OVERHEAD sebagai Indirect Materials**

---

## 📊 **Struktur HPP dalam Sistem Saat Ini**

```
HPP per Pcs = Bahan Baku + TKL + Overhead
              ↑           ↑    ↑
              │           │    └── PACKAGING masuk di sini
              │           └────── Tenaga Kerja Langsung
              └────────────────── Bahan Baku Utama (flour, sugar, etc)
```

### 🧮 **Formula Aktual:**
```javascript
// File: enhancedHppCalculations.ts (Line 329-331)
const hppPerPcs = Math.round(bahanPerPcs + tklPerPcs + overheadPerPcs);
const hppPerPorsi = hppPerPcs * jumlahPcsPerPorsi;
const totalHPP = hppPerPorsi * jumlahPorsi;
```

---

## 🏗️ **Kategorisasi Packaging Cost**

### 📦 **1. Direct Packaging (Masuk ke Bahan Baku)**
Kemasan yang **langsung terpaut** dengan produk:

| Item | Contoh | Input di |
|------|--------|----------|
| Box donat individual | 1 box per donat | **Warehouse → Bahan Baku** |
| Wrapper burger | 1 wrapper per burger | **Warehouse → Bahan Baku** |
| Cup minuman | 1 cup per minuman | **Warehouse → Bahan Baku** |

**✅ Cara Input:**
1. Masuk ke **Warehouse/Gudang**
2. Tambah bahan dengan kategori **"Kemasan"**
3. Input nama: "Box Donat", harga per unit, stok
4. Saat buat resep, masukkan ke **Bahan Resep**

### 🏢 **2. Indirect Packaging (Masuk ke Overhead)**
Kemasan untuk **operasional umum**:

| Item | Contoh | Input di |
|------|--------|----------|
| Kardus pengiriman besar | Transport multiple products | **Operational Costs** |
| Plastic bag bulk | General wrapping | **Operational Costs** |
| Bubble wrap | Protective packaging | **Operational Costs** |
| Label printer supplies | General labeling | **Operational Costs** |

**✅ Cara Input:**
1. Masuk ke **Biaya Operasional**
2. Nama biaya: "Kemasan & Packaging"
3. Jenis: **Variabel** (karena tergantung volume produksi)
4. Jumlah per bulan: Total pengeluaran kemasan bulanan

---

## 🎯 **Rekomendasi Best Practice**

### **Strategi 1: Direct Approach (Paling Akurat)**
```
Setiap kemasan yang pasti dipakai per produk → Bahan Baku
├── Box individual → Input sebagai bahan dalam resep
├── Cup/gelas → Input sebagai bahan dalam resep  
└── Wrapper/pembungkus → Input sebagai bahan dalam resep
```

### **Strategi 2: Overhead Approach (Lebih Simple)**
```
Semua packaging → Biaya Operasional (Overhead)
├── Hitung total pengeluaran kemasan per bulan
├── Input ke Operational Costs sebagai "Packaging & Kemasan"
└── Sistem akan distribute secara otomatis ke semua produk
```

---

## 💻 **Implementasi di Sistem Saat Ini**

### **📍 Lokasi 1: Warehouse (untuk Direct Packaging)**

Masuk ke `/warehouse` → Add Item:
```
Nama: Box Donat Premium
Kategori: Kemasan
Stok: 1000 pcs
Minimum: 100 pcs  
Harga: 500 per box
Supplier: PT Kemasan Jaya
```

Lalu di Recipe, masukkan:
```
Bahan: Box Donat Premium
Jumlah: 1 pcs
Satuan: box
```

### **📍 Lokasi 2: Operational Costs (untuk Indirect)**

Masuk ke `/operational-costs` → Add Cost:
```
Nama Biaya: Kemasan & Packaging
Jenis: Variabel
Jumlah per Bulan: 2,500,000
Status: Aktif
```

Sistem akan otomatis:
1. Calculate overhead per pcs dari total operational costs
2. Distribute ke semua resep sesuai target output monthly
3. Include dalam HPP calculation

---

## 🧪 **Contoh Perhitungan Praktis**

### **Skenario: Donat Premium Box**

**Direct Packaging Approach:**
```
Bahan Baku:
├── Tepung: Rp 2,000
├── Gula: Rp 1,500  
├── Box Premium: Rp 800  ← PACKAGING DIRECT
└── Total Bahan: Rp 4,300

TKL: Rp 1,000
Overhead: Rp 2,200 (utilities, rent, etc)

HPP per Donat = 4,300 + 1,000 + 2,200 = Rp 7,500
```

**Overhead Approach:**
```
Bahan Baku:
├── Tepung: Rp 2,000
├── Gula: Rp 1,500
└── Total Bahan: Rp 3,500

TKL: Rp 1,000  
Overhead: Rp 3,000 (utilities, rent, packaging)  ← PACKAGING INDIRECT

HPP per Donat = 3,500 + 1,000 + 3,000 = Rp 7,500
```

**Result:** Sama, tapi tracking berbeda! ✨

---

## 🚀 **Rekomendasi untuk Tim**

### **🎯 Pilih Direct Approach jika:**
- ✅ Packaging cost signifikan (>10% dari total cost)
- ✅ Beda produk beda kemasan (premium vs regular)
- ✅ Butuh tracking packaging inventory yang detail
- ✅ Ada variasi harga kemasan per produk

### **🎯 Pilih Overhead Approach jika:**  
- ✅ Packaging cost kecil (<5% dari total cost)
- ✅ Kemasan relatif seragam antar produk
- ✅ Mau sistem yang lebih simple untuk maintain
- ✅ Focus ke bahan baku utama aja

---

## 📈 **Enhancement Ideas untuk Developer**

### **🔮 Future Feature: Hybrid Packaging Tracking**

```javascript
// Potential Enhancement: Packaging-specific category in overhead
const packagingOverheadCalculation = {
  directPackaging: calculateDirectPackaging(recipeIngredients),
  indirectPackaging: calculateIndirectPackaging(overheadAllocation),
  totalPackaging: directPackaging + indirectPackaging,
  packagingRatio: totalPackaging / totalHPP * 100
};
```

### **🎨 UI Enhancement Ideas:**
1. **Packaging Cost Breakdown** in HPP display
2. **Packaging vs Direct Materials** comparison  
3. **Packaging efficiency metrics** per product
4. **Quick Add Packaging** button in recipe form

---

## ✅ **Kesimpulan**

**Packaging cost saat ini bisa masuk ke 2 tempat:**

1. **🎯 Warehouse → Bahan Baku** (Direct): Untuk kemasan spesifik per produk
2. **🏢 Operational Costs → Overhead** (Indirect): Untuk kemasan umum/operasional

**Rekomendasi:** Start dengan **Overhead approach** untuk simplicity, then move to **Direct approach** kalau packaging cost jadi significant portion dari HPP.

**Current system support:** ✅ Both approaches  
**Future enhancement:** 📦 Dedicated packaging module dengan hybrid tracking

Semua kemasan-related costs akan ter-include dalam final HPP calculation! 🎯
