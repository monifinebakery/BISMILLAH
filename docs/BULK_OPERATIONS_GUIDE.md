# Panduan Bulk Operations System

Sistem bulk operations yang konsisten untuk semua tabel di aplikasi.

## Overview

Sistem ini menyediakan:
- Hook generik untuk table selection (`useTableSelection`)
- Hook generik untuk bulk operations (`useBulkOperations`)
- Context provider untuk integrasi yang mudah (`BulkOperationsProvider`)
- API yang konsisten di semua modul

## Struktur File

```
src/
├── hooks/
│   ├── useBulkOperations.ts     # Hook untuk bulk operations
│   ├── useTableSelection.ts     # Hook untuk table selection
│   └── bulkOperations.ts        # Barrel export
├── contexts/
│   └── BulkOperationsContext.tsx # Context provider
```

## Cara Penggunaan

### 1. Import Hook dan Types

```typescript
import {
  useBulkOperations,
  useTableSelection,
  BulkOperationsProvider,
  useBulkOperationsContext,
  type BulkOperationsConfig,
  type SelectableItem,
  type ValidationRule
} from '@/hooks/bulkOperations';
```

### 2. Definisi Tipe Data

```typescript
// Contoh untuk Supplier
interface Supplier extends SelectableItem {
  id: string;
  nama: string;
  kontak: string;
  alamat: string;
}

interface SupplierBulkEditData {
  kontak?: string;
  alamat?: string;
}
```

### 3. Setup Hook di Komponen

```typescript
const SupplierPage = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  // Setup table selection
  const selection = useTableSelection<Supplier>(suppliers);
  
  // Setup bulk operations config
  const bulkConfig: BulkOperationsConfig<Supplier> = {
    updateItem: async (id: string, updates: Partial<Supplier>) => {
      // Implementasi update supplier
      return await updateSupplier(id, updates);
    },
    bulkDeleteItems: async (ids: string[]) => {
      // Implementasi bulk delete
      return await bulkDeleteSuppliers(ids);
    },
    selectedItems: selection.selectedIds,
    clearSelection: selection.clearSelection,
    itemName: 'supplier' // Untuk pesan toast
  };
  
  // Setup bulk operations
  const bulkOps = useBulkOperations<SupplierBulkEditData>(bulkConfig);
  
  // Validation rules (opsional)
  const validationRules: ValidationRule<SupplierBulkEditData>[] = [
    {
      field: 'kontak',
      validate: (value) => {
        if (value && !/^[0-9+\-\s]+$/.test(value)) {
          return 'Format kontak tidak valid';
        }
        return null;
      }
    }
  ];
  
  return (
    <div>
      {/* Bulk Actions */}
      {selection.selectedCount > 0 && (
        <BulkActions
          selectedCount={selection.selectedCount}
          onBulkEdit={(data) => bulkOps.executeBulkEdit(data, validationRules)}
          onBulkDelete={bulkOps.executeBulkDelete}
          isProcessing={bulkOps.isProcessing}
        />
      )}
      
      {/* Table */}
      <SupplierTable
        suppliers={suppliers}
        selectedIds={selection.selectedIds}
        onSelectionChange={selection.toggleItemSelection}
        isSelectionMode={selection.isSelectionMode}
        onSelectAll={() => selection.selectAllItems(suppliers)}
        isAllSelected={selection.isAllSelected}
      />
    </div>
  );
};
```

### 4. Menggunakan Context Provider (Alternatif)

```typescript
const SupplierPageWithContext = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  const bulkConfig: BulkOperationsConfig<Supplier> = {
    updateItem: updateSupplier,
    bulkDeleteItems: bulkDeleteSuppliers,
    selectedItems: [], // Akan diisi otomatis oleh provider
    clearSelection: () => {}, // Akan diisi otomatis oleh provider
    itemName: 'supplier'
  };
  
  return (
    <BulkOperationsProvider config={bulkConfig} items={suppliers}>
      <SupplierContent />
    </BulkOperationsProvider>
  );
};

const SupplierContent = () => {
  const { selection, bulkOps, hasSelection } = useBulkOperationsContext<Supplier>();
  
  return (
    <div>
      {hasSelection && (
        <BulkActions
          selectedCount={selection.selectedCount}
          onBulkEdit={bulkOps.executeBulkEdit}
          onBulkDelete={bulkOps.executeBulkDelete}
          isProcessing={bulkOps.isProcessing}
        />
      )}
      {/* Table component */}
    </div>
  );
};
```

## API Reference

### useTableSelection

```typescript
const selection = useTableSelection<T>(items);
```

**Returns:**
- `selectedIds: string[]` - Array ID yang dipilih
- `selectedItems: T[]` - Array item yang dipilih
- `isSelectionMode: boolean` - Status mode seleksi
- `isAllSelected: boolean` - Apakah semua item dipilih
- `selectedCount: number` - Jumlah item yang dipilih
- `toggleItemSelection: (id: string) => void` - Toggle seleksi item
- `selectAllItems: (items: T[]) => void` - Pilih/batalkan semua item
- `clearSelection: () => void` - Hapus semua seleksi
- `enterSelectionMode: () => void` - Masuk mode seleksi
- `exitSelectionMode: () => void` - Keluar mode seleksi

### useBulkOperations

```typescript
const bulkOps = useBulkOperations<T>(config);
```

**Config:**
- `updateItem: (id: string, updates: Partial<T>) => Promise<boolean>`
- `bulkDeleteItems: (ids: string[]) => Promise<boolean>`
- `selectedItems: string[]`
- `clearSelection: () => void`
- `itemName?: string` - Nama item untuk pesan toast

**Returns:**
- `isProcessing: boolean` - Status pemrosesan
- `bulkEditData: T` - Data untuk bulk edit
- `setBulkEditData: (data: T) => void` - Set data bulk edit
- `resetBulkEditData: () => void` - Reset data bulk edit
- `validateBulkEditData: (data: T) => ValidationResult` - Validasi data
- `executeBulkEdit: (data: T, rules?: ValidationRule[]) => Promise<boolean>`
- `executeBulkDelete: () => Promise<boolean>`

### ValidationRule

```typescript
interface ValidationRule<T> {
  field: keyof T;
  validate: (value: any) => string | null; // Return error message atau null
}
```

## Contoh Implementasi di Modul Lain

### Recipe Table

```typescript
interface Recipe extends SelectableItem {
  id: string;
  nama: string;
  kategori: string;
  harga: number;
}

interface RecipeBulkEditData {
  kategori?: string;
  harga?: number;
}

const RecipePage = () => {
  const selection = useTableSelection<Recipe>(recipes);
  const bulkOps = useBulkOperations<RecipeBulkEditData>({
    updateItem: updateRecipe,
    bulkDeleteItems: bulkDeleteRecipes,
    selectedItems: selection.selectedIds,
    clearSelection: selection.clearSelection,
    itemName: 'resep'
  });
  
  const validationRules: ValidationRule<RecipeBulkEditData>[] = [
    {
      field: 'harga',
      validate: (value) => {
        if (value !== undefined && value < 0) {
          return 'Harga harus berupa angka positif';
        }
        return null;
      }
    }
  ];
  
  // ... rest of component
};
```

### Order Table

```typescript
interface Order extends SelectableItem {
  id: string;
  customerName: string;
  status: OrderStatus;
  total: number;
}

interface OrderBulkEditData {
  status?: OrderStatus;
}

const OrderPage = () => {
  const selection = useTableSelection<Order>(orders);
  const bulkOps = useBulkOperations<OrderBulkEditData>({
    updateItem: updateOrder,
    bulkDeleteItems: bulkDeleteOrders,
    selectedItems: selection.selectedIds,
    clearSelection: selection.clearSelection,
    itemName: 'pesanan'
  });
  
  // ... rest of component
};
```

## Best Practices

1. **Konsistensi Naming**: Gunakan nama yang konsisten untuk props dan methods
2. **Validation**: Selalu tambahkan validation rules untuk bulk edit
3. **Error Handling**: Sistem sudah menangani error secara otomatis dengan toast
4. **Performance**: Sistem menggunakan batch processing untuk operasi besar
5. **User Feedback**: Toast notifications memberikan feedback yang jelas
6. **Type Safety**: Gunakan TypeScript generics untuk type safety

## Migrasi dari Sistem Lama

1. Replace hook selection lama dengan `useTableSelection`
2. Replace logic bulk operations dengan `useBulkOperations`
3. Update komponen table untuk menggunakan props yang konsisten
4. Tambahkan validation rules sesuai kebutuhan
5. Test semua functionality

## Troubleshooting

### Error: "useBulkOperationsContext must be used within a BulkOperationsProvider"
- Pastikan komponen dibungkus dengan `BulkOperationsProvider`

### Bulk operations tidak berfungsi
- Periksa implementasi `updateItem` dan `bulkDeleteItems`
- Pastikan `selectedItems` dan `clearSelection` sudah benar

### Validation tidak berjalan
- Periksa `ValidationRule` sudah benar
- Pastikan memanggil `executeBulkEdit` dengan parameter rules

Sistem ini memberikan foundation yang solid untuk semua bulk operations di aplikasi dengan API yang konsisten dan mudah digunakan.