# Laporan Inkonsistensi Penamaan - Purchase & Warehouse Module

## Executive Summary

Setelah melakukan analisis mendalam terhadap codebase, ditemukan beberapa inkonsistensi penamaan yang signifikan terutama di modul purchase dan warehouse. Inkonsistensi ini dapat menyebabkan kebingungan developer, kesulitan maintenance, dan potensi bug.

## 1. Inkonsistensi Field ID

### Masalah Utama:
- **Database**: `bahan_baku_id` (snake_case)
- **Frontend**: `bahanBakuId` (camelCase)
- **Alternatif**: `item_id`, `materialId`, `material_id`

### Contoh Lokasi:
- `src/components/purchase/types/purchase.types.ts`: Mixed usage antara `bahanBakuId` dan `bahan_baku_id`
- `src/components/warehouse/types.ts`: Konsisten menggunakan `bahan_baku_id` untuk database
- `src/components/profitAnalysis/`: Menggunakan variasi `material_id`, `item_id`

### Dampak:
- Transformasi data yang tidak konsisten
- Kesulitan dalam mapping database ke frontend
- Potensi error saat data binding

## 2. Inkonsistensi Field Quantity

### Variasi Ditemukan:
- `quantity` (standar English)
- `kuantitas` (Bahasa Indonesia)
- `qty` (singkatan)
- `qty_base` (untuk profit analysis)
- `jumlah` (alternatif Bahasa Indonesia)
- `stok` (untuk warehouse)
- `amount` (untuk financial transactions)

### Contoh Lokasi:
- `src/components/purchase/types/purchase.types.ts`: `kuantitas` vs `quantity`
- `src/components/profitAnalysis/`: Dominan menggunakan `qty_base`, `amount`
- `src/components/orders/`: Menggunakan `quantity`
- `src/components/warehouse/`: Menggunakan `stok`

### Dampak:
- Kebingungan dalam pemahaman field purpose
- Inconsistent API responses
- Kesulitan dalam data aggregation

## 3. Inkonsistensi Field Price

### Variasi Ditemukan:
- `harga_satuan` (database, Bahasa Indonesia)
- `unit_price` (English standard)
- `unitPrice` (camelCase)
- `price` (simple)
- `harga` (Bahasa Indonesia)
- `harga_efektif` (effective price)
- `hpp_value` (cost of goods)
- `wac_price` (weighted average cost)
- `harga_rata_rata` (average price)

### Contoh Lokasi:
- `src/components/warehouse/`: Mixed `harga_satuan`, `harga_rata_rata`, `getEffectiveUnitPrice`
- `src/components/purchase/`: `harga_satuan` di database, `unitPrice` di frontend
- `src/components/profitAnalysis/`: `unit_price`, `wac_price`, `hpp_value`
- `src/components/invoice/`: `price`, `unitPrice`
- `src/components/orders/`: `price`, `pricePerPortion`, `pricePerPiece`

### Dampak:
- Kompleksitas dalam price calculation
- Kesulitan dalam financial reporting
- Potensi error dalam pricing logic

## 4. Inkonsistensi Field Status

### Variasi Ditemukan:
- `status` (generic)
- `statusPurchase` (specific untuk purchase)
- `state` (alternative)
- `condition` (untuk assets)
- `active`/`inactive` (boolean states)
- `aktif`/`nonaktif` (Bahasa Indonesia)
- Enum values: `'pending'`, `'completed'`, `'cancelled'`, `'draft'`, `'sent'`, `'paid'`, `'overdue'`

### Contoh Lokasi:
- `src/components/invoice/`: `InvoiceStatus` dengan values `'BELUM LUNAS'`, `'LUNAS'`, `'JATUH TEMPO'`
- `src/components/assets/`: `AssetCondition` dengan values `'baik'`, `'rusak'`, etc.
- `src/components/profitAnalysis/`: Filter `status === 'aktif'`
- `src/components/orders/`: Various status tracking

### Dampak:
- Inconsistent status tracking
- Kesulitan dalam workflow management
- Potensi bug dalam state transitions

## 5. Rekomendasi Perbaikan

### A. Standardisasi Naming Convention

#### Database Layer (snake_case):
```sql
-- Recommended standard
bahan_baku_id
quantity
unit_price
status
```

#### Frontend Layer (camelCase):
```typescript
// Recommended standard
interface StandardItem {
  bahanBakuId: string;
  quantity: number;
  unitPrice: number;
  status: string;
}
```

#### API Layer (consistent transformation):
```typescript
// Transformer functions
const dbToFrontend = (dbItem: DbItem): FrontendItem => ({
  bahanBakuId: dbItem.bahan_baku_id,
  quantity: dbItem.quantity,
  unitPrice: dbItem.unit_price,
  status: dbItem.status
});
```

### B. Implementasi Bertahap

#### Phase 1: Core Types Standardization
1. Update `purchase.types.ts` untuk konsistensi
2. Update `warehouse/types.ts` untuk alignment
3. Standardisasi transformer functions

#### Phase 2: Database Schema Alignment
1. Review dan standardisasi column names
2. Create migration scripts jika diperlukan
3. Update all queries

#### Phase 3: Frontend Refactoring
1. Update component props
2. Standardisasi form field names
3. Update validation schemas

#### Phase 4: API Standardization
1. Consistent request/response formats
2. Standardisasi error messages
3. Update documentation

### C. Tools dan Guidelines

#### 1. Linting Rules
```json
{
  "rules": {
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "interface",
        "format": ["PascalCase"]
      },
      {
        "selector": "property",
        "format": ["camelCase"]
      }
    ]
  }
}
```

#### 2. Type Guards
```typescript
// Ensure type safety during transformation
const isValidPurchaseItem = (item: any): item is PurchaseItem => {
  return typeof item.bahanBakuId === 'string' &&
         typeof item.quantity === 'number' &&
         typeof item.unitPrice === 'number';
};
```

#### 3. Documentation Standards
```typescript
/**
 * Standard field naming conventions:
 * - bahanBakuId: Material/ingredient identifier
 * - quantity: Amount/count of items
 * - unitPrice: Price per unit in IDR
 * - status: Current state of the record
 */
interface StandardRecord {
  bahanBakuId: string;
  quantity: number;
  unitPrice: number;
  status: RecordStatus;
}
```

## 6. Priority Actions

### High Priority:
1. **Standardisasi Purchase Types**: Update `purchase.types.ts` untuk konsistensi field names
2. **Warehouse Integration**: Align warehouse types dengan purchase types
3. **Transformer Functions**: Create consistent data transformation utilities

### Medium Priority:
1. **Profit Analysis Alignment**: Standardisasi field names di profit analysis module
2. **Invoice Integration**: Align invoice types dengan core business types
3. **Orders Module**: Standardisasi pricing fields

### Low Priority:
1. **Asset Management**: Review dan align dengan core naming conventions
2. **Debug Components**: Update untuk consistency
3. **Documentation**: Update semua documentation dengan naming standards

## 7. Monitoring dan Maintenance

### Code Review Checklist:
- [ ] Apakah field names mengikuti convention?
- [ ] Apakah ada transformer functions yang diperlukan?
- [ ] Apakah type definitions konsisten?
- [ ] Apakah documentation up-to-date?

### Automated Checks:
- ESLint rules untuk naming convention
- TypeScript strict mode untuk type safety
- Unit tests untuk transformer functions
- Integration tests untuk data flow

## Kesimpulan

Inkonsistensi penamaan yang ditemukan cukup signifikan dan memerlukan refactoring bertahap. Dengan implementasi rekomendasi di atas, codebase akan menjadi lebih maintainable, readable, dan less error-prone. Prioritas utama adalah standardisasi di core modules (purchase & warehouse) sebelum melakukan alignment di modules lainnya.

---

**Generated on:** $(date)
**Analyzed modules:** Purchase, Warehouse, Profit Analysis, Invoice, Orders, Assets
**Total files analyzed:** 100+ files
**Inconsistencies found:** 50+ instances across 4 major field categories