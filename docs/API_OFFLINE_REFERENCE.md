# 🔧 API Reference - Offline Storage Utilities

## 📋 Table of Contents

1. [Base Storage API](#-base-storage-api)
2. [Calculator Storage API](#-calculator-storage-api)
3. [Draft Orders API](#-draft-orders-api)
4. [Cached Data API](#-cached-data-api)
5. [Sync Queue API](#-sync-queue-api)
6. [Utility Functions](#️-utility-functions)
7. [Types & Interfaces](#-types--interfaces)
8. [Error Handling](#-error-handling)

---

## 🗄️ Base Storage API

### `BaseOfflineStorage<T>`

Base class untuk semua offline storage dengan TTL dan versioning support.

#### Constructor

```typescript
new BaseOfflineStorage<T>(key: string, version?: string)
```

**Parameters:**
- `key` (string): Storage key prefix
- `version` (string, optional): Version untuk migration (default: "1.0.0")

#### Core Methods

##### `get(): Promise<T | null>`
Mengambil data dari storage dengan validasi TTL.

```typescript
const data = await storage.get();
if (data) {
  console.log('Data found:', data);
} else {
  console.log('No data or expired');
}
```

**Returns:** `Promise<T | null>` - Data atau null jika tidak ada/expired

---

##### `set(data: T, ttl?: number): Promise<void>`
Menyimpan data dengan optional TTL.

```typescript
await storage.set(userData, 3600000); // TTL 1 hour
await storage.set(settings); // No TTL (permanent)
```

**Parameters:**
- `data` (T): Data yang akan disimpan
- `ttl` (number, optional): Time-to-live dalam milliseconds

---

##### `remove(): Promise<void>`
Menghapus data dari storage.

```typescript
await storage.remove();
```

---

##### `clear(): Promise<void>`
Menghapus semua data dengan prefix yang sama.

```typescript
await storage.clear();
```

#### TTL Methods

##### `isExpired(): Promise<boolean>`
Cek apakah data sudah expired.

```typescript
if (await storage.isExpired()) {
  await storage.remove();
}
```

---

##### `getRemainingTTL(): Promise<number>`
Mendapatkan sisa waktu TTL dalam milliseconds.

```typescript
const remaining = await storage.getRemainingTTL();
console.log(`Data expires in ${remaining}ms`);
```

**Returns:** `number` - Remaining TTL (-1 jika no TTL)

#### Versioning Methods

##### `migrate(oldData: any, oldVersion: string): Promise<T>`
Override untuk handle migration data antar versi.

```typescript
class MyStorage extends BaseOfflineStorage<MyData> {
  async migrate(oldData: any, oldVersion: string): Promise<MyData> {
    if (oldVersion === '1.0.0') {
      return {
        ...oldData,
        newField: 'default_value'
      };
    }
    return oldData;
  }
}
```

#### Utility Methods

##### `getSize(): Promise<number>`
Mendapatkan ukuran data dalam bytes.

```typescript
const sizeInBytes = await storage.getSize();
```

---

##### `backup(): Promise<string>`
Membuat backup data dalam format JSON string.

```typescript
const backup = await storage.backup();
localStorage.setItem('backup', backup);
```

---

##### `restore(backup: string): Promise<void>`
Restore data dari backup string.

```typescript
const backup = localStorage.getItem('backup');
if (backup) {
  await storage.restore(backup);
}
```

---

## 📊 Calculator Storage API

### `OfflineCalculatorStorage`

Khusus untuk menyimpan hasil perhitungan HPP offline.

#### Import

```typescript
import { offlineCalculatorStorage } from '@/lib/offlineStorage';
```

#### Methods

##### `saveCalculation(calculation: CalculationResult): Promise<void>`
Menyimpan hasil perhitungan.

```typescript
await offlineCalculatorStorage.saveCalculation({
  id: generateId(),
  recipeId: 'recipe_123',
  recipeName: 'Nasi Goreng Special',
  ingredients: [
    { name: 'Beras', amount: 1, unit: 'kg', cost: 12000 },
    { name: 'Telur', amount: 2, unit: 'butir', cost: 3000 }
  ],
  costs: {
    materials: 15000,
    operational: 5000,
    labor: 10000,
    overhead: 3000
  },
  pricing: {
    hpp: 33000,
    markup: 0.3,
    sellingPrice: 42900,
    profit: 9900,
    margin: 0.23
  },
  timestamp: Date.now(),
  syncStatus: 'pending'
});
```

---

##### `getHistory(options?: HistoryOptions): Promise<PaginatedResult<CalculationResult>>`
Mengambil history perhitungan dengan pagination.

```typescript
const history = await offlineCalculatorStorage.getHistory({
  page: 1,
  limit: 10,
  sortBy: 'timestamp',
  order: 'desc'
});

console.log(`${history.data.length} of ${history.total} calculations`);
```

**Parameters:**
```typescript
interface HistoryOptions {
  page?: number;          // Default: 1
  limit?: number;         // Default: 20
  sortBy?: 'timestamp' | 'recipeName' | 'hpp';
  order?: 'asc' | 'desc'; // Default: 'desc'
}
```

---

##### `searchCalculations(query: SearchQuery): Promise<CalculationResult[]>`
Pencarian perhitungan dengan filter.

```typescript
const results = await offlineCalculatorStorage.searchCalculations({
  query: 'nasi goreng',
  filters: {
    dateRange: {
      start: new Date('2024-01-01').getTime(),
      end: new Date().getTime()
    },
    priceRange: {
      min: 10000,
      max: 50000
    },
    syncStatus: 'pending'
  }
});
```

---

##### `deleteCalculation(id: string): Promise<void>`
Menghapus perhitungan berdasarkan ID.

```typescript
await offlineCalculatorStorage.deleteCalculation('calc_123');
```

---

##### `getPendingSync(): Promise<CalculationResult[]>`
Mendapatkan perhitungan yang belum tersinkronisasi.

```typescript
const pending = await offlineCalculatorStorage.getPendingSync();
for (const calc of pending) {
  // Process sync
}
```

---

##### `markAsSynced(id: string): Promise<void>`
Menandai perhitungan sebagai sudah tersinkronisasi.

```typescript
await offlineCalculatorStorage.markAsSynced('calc_123');
```

---

##### `markAsFailed(id: string, error: string): Promise<void>`
Menandai perhitungan gagal sinkronisasi.

```typescript
await offlineCalculatorStorage.markAsFailed('calc_123', 'Network error');
```

---

## 📝 Draft Orders API

### `DraftOrdersStorage`

Sistem draft untuk pesanan offline.

#### Import

```typescript
import { draftOrdersStorage } from '@/lib/offlineStorage';
```

#### Methods

##### `saveDraft(draft: DraftOrder): Promise<void>`
Menyimpan draft pesanan dengan auto-versioning.

```typescript
await draftOrdersStorage.saveDraft({
  id: 'draft_123',
  customerId: 'cust_456',
  customerInfo: {
    name: 'John Doe',
    phone: '081234567890',
    address: 'Jl. Merdeka No. 123',
    notes: 'Lantai 2'
  },
  items: [
    {
      productId: 'prod_1',
      productName: 'Nasi Goreng',
      quantity: 2,
      unitPrice: 25000,
      subtotal: 50000,
      notes: 'Pedas sedang'
    }
  ],
  pricing: {
    subtotal: 50000,
    tax: 5000,
    discount: 2000,
    total: 53000
  },
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'draft',
    priority: 'normal',
    deviceId: getDeviceId(),
    version: 1
  }
});
```

---

##### `getDraft(id: string): Promise<DraftOrder | null>`
Mengambil draft berdasarkan ID.

```typescript
const draft = await draftOrdersStorage.getDraft('draft_123');
if (draft) {
  console.log('Draft found:', draft.customerInfo.name);
}
```

---

##### `getAllDrafts(): Promise<DraftOrder[]>`
Mengambil semua draft yang tersimpan.

```typescript
const allDrafts = await draftOrdersStorage.getAllDrafts();
console.log(`Found ${allDrafts.length} drafts`);
```

---

##### `deleteDraft(id: string): Promise<void>`
Menghapus draft pesanan.

```typescript
await draftOrdersStorage.deleteDraft('draft_123');
```

---

##### `getDraftsByStatus(status: DraftStatus): Promise<DraftOrder[]>`
Filter draft berdasarkan status.

```typescript
const pendingDrafts = await draftOrdersStorage.getDraftsByStatus('pending_sync');
```

---

##### `updateDraftStatus(id: string, status: DraftStatus): Promise<void>`
Update status draft.

```typescript
await draftOrdersStorage.updateDraftStatus('draft_123', 'synced');
```

---

##### `duplicateDraft(id: string, newId?: string): Promise<string>`
Duplikasi draft dengan ID baru.

```typescript
const newDraftId = await draftOrdersStorage.duplicateDraft('draft_123');
console.log('New draft created:', newDraftId);
```

---

##### `exportDrafts(): Promise<string>`
Export semua draft ke JSON string.

```typescript
const exported = await draftOrdersStorage.exportDrafts();
// Save to file or send to server
```

---

##### `importDrafts(data: string): Promise<number>`
Import draft dari JSON string.

```typescript
const importedCount = await draftOrdersStorage.importDrafts(exportedData);
console.log(`Imported ${importedCount} drafts`);
```

---

## 🗂️ Cached Data API

### `CachedDataStorage`

Viewer untuk data yang di-cache dari server.

#### Import

```typescript
import { cachedDataStorage } from '@/lib/offlineStorage';
```

#### Methods

##### `getCachedData(type?: string): Promise<CachedDataEntry[]>`
Mengambil data cache, optional filter berdasarkan type.

```typescript
const allCached = await cachedDataStorage.getCachedData();
const recipes = await cachedDataStorage.getCachedData('recipe');
```

---

##### `addCacheEntry(entry: CacheEntryInput): Promise<void>`
Menambah entry cache baru.

```typescript
await cachedDataStorage.addCacheEntry({
  key: 'recipe_123',
  type: 'recipe',
  data: recipeData
});
```

---

##### `getCacheEntry(key: string): Promise<CachedDataEntry | null>`
Mengambil cache entry berdasarkan key.

```typescript
const cached = await cachedDataStorage.getCacheEntry('recipe_123');
```

---

##### `removeCacheEntry(key: string): Promise<void>`
Menghapus cache entry.

```typescript
await cachedDataStorage.removeCacheEntry('recipe_123');
```

---

##### `refreshExpiredCache(): Promise<RefreshResult>`
Refresh cache yang sudah expired.

```typescript
const result = await cachedDataStorage.refreshExpiredCache();
console.log(`${result.successful} refreshed, ${result.failed} failed`);
```

---

##### `cleanupExpiredCache(): Promise<number>`
Bersihkan cache yang expired.

```typescript
const cleanedCount = await cachedDataStorage.cleanupExpiredCache();
```

---

##### `getCacheStats(): Promise<CacheStats>`
Statistik cache storage.

```typescript
const stats = await cachedDataStorage.getCacheStats();
console.log(`Total entries: ${stats.totalEntries}`);
console.log(`Total size: ${stats.totalSize} bytes`);
console.log(`Expired: ${stats.expiredEntries}`);
```

---

## 🔄 Sync Queue API

### `SyncQueueStorage`

Manajemen antrian sinkronisasi.

#### Import

```typescript
import { syncQueueStorage } from '@/lib/offlineStorage';
```

#### Methods

##### `addToQueue(item: SyncQueueInput): Promise<string>`
Menambah item ke antrian sync.

```typescript
const itemId = await syncQueueStorage.addToQueue({
  type: 'calculation',
  operation: 'create',
  data: calculationData,
  priority: 8,
  maxAttempts: 3,
  dependencies: ['other_item_id']
});
```

---

##### `getPendingItems(): Promise<SyncQueueItem[]>`
Mengambil item yang pending sync.

```typescript
const pending = await syncQueueStorage.getPendingItems();
```

---

##### `processPendingItems(): Promise<ProcessResult>`
Memproses semua item pending.

```typescript
const result = await syncQueueStorage.processPendingItems();
console.log(`Processed: ${result.processed}, Failed: ${result.failed}`);
```

---

##### `removeItem(id: string): Promise<void>`
Menghapus item dari antrian.

```typescript
await syncQueueStorage.removeItem('item_123');
```

---

##### `updateItem(item: SyncQueueItem): Promise<void>`
Update item di antrian.

```typescript
item.attempts += 1;
item.error = 'Network timeout';
await syncQueueStorage.updateItem(item);
```

---

##### `getFailedItems(): Promise<SyncQueueItem[]>`
Mendapatkan item yang gagal sync.

```typescript
const failed = await syncQueueStorage.getFailedItems();
```

---

##### `retryFailedItems(): Promise<ProcessResult>`
Retry semua item yang gagal.

```typescript
const result = await syncQueueStorage.retryFailedItems();
```

---

##### `clearQueue(): Promise<void>`
Kosongkan semua antrian.

```typescript
await syncQueueStorage.clearQueue();
```

---

##### `getQueueStats(): Promise<QueueStats>`
Statistik antrian sync.

```typescript
const stats = await syncQueueStorage.getQueueStats();
console.log(`Pending: ${stats.pending}, Failed: ${stats.failed}`);
```

---

## 🛠️ Utility Functions

### Storage Management

```typescript
import { 
  getStorageUsage, 
  clearExpiredData, 
  backupAllData, 
  restoreAllData 
} from '@/lib/offlineStorage';
```

##### `getStorageUsage(): Promise<StorageUsage>`
Mendapatkan usage statistics storage.

```typescript
const usage = await getStorageUsage();
console.log(`Used: ${usage.used} / ${usage.quota} bytes (${usage.percentage}%)`);
```

---

##### `clearExpiredData(): Promise<CleanupResult>`
Bersihkan semua data expired di semua storage.

```typescript
const result = await clearExpiredData();
console.log(`Cleaned ${result.itemsRemoved} items, freed ${result.spaceSaved} bytes`);
```

---

##### `backupAllData(): Promise<string>`
Backup semua offline data.

```typescript
const backup = await backupAllData();
// Save backup to file or server
```

---

##### `restoreAllData(backup: string): Promise<RestoreResult>`
Restore dari backup.

```typescript
const result = await restoreAllData(backupString);
console.log(`Restored ${result.itemsRestored} items`);
```

### Device & Network Utils

```typescript
import { 
  isOnline, 
  getDeviceId, 
  generateId 
} from '@/lib/offlineStorage';
```

##### `isOnline(): boolean`
Cek status koneksi internet.

```typescript
if (isOnline()) {
  await syncData();
} else {
  await saveToQueue();
}
```

---

##### `getDeviceId(): string`
Generate/get unique device identifier.

```typescript
const deviceId = getDeviceId();
```

---

##### `generateId(): string`
Generate unique ID untuk records.

```typescript
const newId = generateId();
```

---

## 📝 Types & Interfaces

### Base Types

```typescript
interface StorageItem<T> {
  data: T;
  timestamp: number;
  ttl?: number;
  version: string;
  checksum?: string;
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

### Calculator Types

```typescript
interface CalculationResult {
  id: string;
  recipeId: string;
  recipeName: string;
  ingredients: Ingredient[];
  costs: CostBreakdown;
  pricing: PricingResult;
  timestamp: number;
  syncStatus: 'pending' | 'synced' | 'failed';
}

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  cost: number;
}

interface CostBreakdown {
  materials: number;
  operational: number;
  labor: number;
  overhead: number;
}

interface PricingResult {
  hpp: number;
  markup: number;
  sellingPrice: number;
  profit: number;
  margin: number;
}

interface SearchQuery {
  query?: string;
  filters?: {
    dateRange?: { start: number; end: number };
    priceRange?: { min: number; max: number };
    syncStatus?: 'pending' | 'synced' | 'failed';
  };
}
```

### Draft Order Types

```typescript
interface DraftOrder {
  id: string;
  customerId?: string;
  customerInfo: CustomerInfo;
  items: OrderItem[];
  pricing: OrderPricing;
  metadata: OrderMetadata;
}

interface CustomerInfo {
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
}

interface OrderPricing {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}

interface OrderMetadata {
  createdAt: number;
  updatedAt: number;
  status: DraftStatus;
  priority: Priority;
  deviceId: string;
  version: number;
}

type DraftStatus = 'draft' | 'pending_sync' | 'synced' | 'failed';
type Priority = 'low' | 'normal' | 'high' | 'urgent';
```

### Cache Types

```typescript
interface CachedDataEntry {
  key: string;
  type: 'recipe' | 'customer' | 'product' | 'report';
  data: any;
  metadata: CacheMetadata;
}

interface CacheMetadata {
  cachedAt: number;
  expiresAt: number;
  version: string;
  source: 'api' | 'manual' | 'sync';
  size: number;
}

interface RefreshResult {
  total: number;
  successful: number;
  failed: number;
  results: Array<{ key: string; success: boolean; error?: string }>;
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  expiredEntries: number;
  oldestEntry: number;
  newestEntry: number;
}
```

### Sync Queue Types

```typescript
interface SyncQueueItem {
  id: string;
  type: 'calculation' | 'order' | 'customer' | 'inventory';
  operation: 'create' | 'update' | 'delete';
  data: any;
  priority: number; // 1-10, higher = more priority
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  scheduledAt: number;
  lastAttemptAt?: number;
  error?: string;
  dependencies?: string[];
}

interface SyncQueueInput {
  type: SyncQueueItem['type'];
  operation: SyncQueueItem['operation'];
  data: any;
  priority?: number;
  maxAttempts?: number;
  dependencies?: string[];
}

interface ProcessResult {
  success: boolean;
  processed: number;
  failed: number;
  message?: string;
}

interface QueueStats {
  pending: number;
  processing: number;
  failed: number;
  completed: number;
  totalSize: number;
}
```

### Utility Types

```typescript
interface StorageUsage {
  used: number;
  quota: number;
  percentage: number;
  itemCount: number;
  oldestItem: number;
  newestItem: number;
}

interface CleanupResult {
  itemsRemoved: number;
  spaceSaved: number;
  errors: string[];
}

interface RestoreResult {
  itemsRestored: number;
  errors: string[];
  skipped: number;
}
```

---

## ⚠️ Error Handling

### Custom Error Types

```typescript
class OfflineError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'OfflineError';
  }
}

enum ErrorCodes {
  STORAGE_FULL = 'STORAGE_FULL',
  SYNC_FAILED = 'SYNC_FAILED',
  DATA_CORRUPTED = 'DATA_CORRUPTED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VERSION_MISMATCH = 'VERSION_MISMATCH',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  INVALID_DATA = 'INVALID_DATA'
}
```

### Error Handling Examples

```typescript
try {
  await offlineCalculatorStorage.saveCalculation(data);
} catch (error) {
  if (error instanceof OfflineError) {
    switch (error.code) {
      case ErrorCodes.STORAGE_FULL:
        await clearExpiredData();
        break;
      case ErrorCodes.DATA_CORRUPTED:
        await storage.clear();
        break;
      default:
        console.error('Offline error:', error.message);
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Error Recovery

```typescript
import { recoverFromError } from '@/lib/offlineStorage';

try {
  await riskyOperation();
} catch (error) {
  if (error instanceof OfflineError) {
    const recovered = await recoverFromError(error);
    if (recovered) {
      await riskyOperation(); // Retry
    } else {
      throw error; // Re-throw if can't recover
    }
  }
}
```

---

## 🔄 Migration & Versioning

### Custom Migration

```typescript
class MyStorage extends BaseOfflineStorage<MyData> {
  constructor() {
    super('my_storage', '2.0.0');
  }

  async migrate(oldData: any, oldVersion: string): Promise<MyData> {
    // Migration from 1.0.0 to 2.0.0
    if (oldVersion === '1.0.0') {
      return {
        ...oldData,
        // Add new field
        newField: this.getDefaultValue(),
        // Transform existing field
        renamedField: oldData.oldField,
        // Remove old field (implicit)
      };
    }

    // Migration from 1.5.0 to 2.0.0  
    if (oldVersion === '1.5.0') {
      return {
        ...oldData,
        // Different migration path
        anotherField: this.transformData(oldData.someField)
      };
    }

    return oldData;
  }
}
```

---

## 🎯 Usage Examples

### Complete Calculator Workflow

```typescript
import { offlineCalculatorStorage } from '@/lib/offlineStorage';

// 1. Save calculation
const calculation = {
  id: generateId(),
  recipeId: recipe.id,
  recipeName: recipe.name,
  ingredients: recipe.ingredients,
  costs: calculateCosts(recipe),
  pricing: calculatePricing(costs, markup),
  timestamp: Date.now(),
  syncStatus: 'pending' as const
};

await offlineCalculatorStorage.saveCalculation(calculation);

// 2. Search calculations
const searchResults = await offlineCalculatorStorage.searchCalculations({
  query: 'nasi goreng',
  filters: {
    dateRange: { start: lastWeek, end: now },
    priceRange: { min: 10000, max: 50000 }
  }
});

// 3. Sync pending calculations  
const pending = await offlineCalculatorStorage.getPendingSync();
for (const calc of pending) {
  try {
    const response = await fetch('/api/calculations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(calc)
    });
    
    if (response.ok) {
      await offlineCalculatorStorage.markAsSynced(calc.id);
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    await offlineCalculatorStorage.markAsFailed(calc.id, error.message);
  }
}
```

### Complete Draft Order Workflow

```typescript
import { draftOrdersStorage } from '@/lib/offlineStorage';

// 1. Create draft
const draft: DraftOrder = {
  id: generateId(),
  customerInfo: { name: 'John Doe', phone: '081234567890' },
  items: [
    { productId: 'p1', productName: 'Nasi Goreng', quantity: 2, unitPrice: 25000, subtotal: 50000 }
  ],
  pricing: { subtotal: 50000, tax: 5000, discount: 0, total: 55000 },
  metadata: {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'draft',
    priority: 'normal',
    deviceId: getDeviceId(),
    version: 1
  }
};

await draftOrdersStorage.saveDraft(draft);

// 2. Auto-save setup
class OrderForm {
  private autoSaveTimer?: NodeJS.Timeout;
  
  startAutoSave() {
    this.autoSaveTimer = setInterval(async () => {
      if (this.isDirty) {
        await draftOrdersStorage.saveDraft(this.currentDraft);
        this.showSavedIndicator();
      }
    }, 5000);
  }
  
  stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
  }
}

// 3. Submit draft
const submitDraft = async (draftId: string) => {
  const draft = await draftOrdersStorage.getDraft(draftId);
  if (draft) {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify(draft)
      });
      
      if (response.ok) {
        await draftOrdersStorage.updateDraftStatus(draftId, 'synced');
      }
    } catch (error) {
      await draftOrdersStorage.updateDraftStatus(draftId, 'failed');
    }
  }
};
```

---

*API Reference ini mencakup seluruh fungsi offline storage system. Untuk implementasi detail dan contoh penggunaan lebih lanjut, lihat dokumentasi teknis dan user guide.*
