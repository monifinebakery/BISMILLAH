# Offline Features - Technical Documentation

## 🏗️ Architecture Overview

### System Components
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React App     │───▶│  Offline Utils   │───▶│  localStorage   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Service Worker  │───▶│   Sync Queue     │───▶│   IndexedDB     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Core Modules
1. **Base Storage (`BaseOfflineStorage`)** - Foundational storage with TTL
2. **Calculator Storage** - Offline calculation history
3. **Draft Orders** - Offline order management
4. **Cached Data** - View-only cached content
5. **Sync Queue** - Background sync operations

## 📁 File Structure

```
src/
├── lib/
│   ├── offlineStorage/
│   │   ├── index.ts              # Main exports
│   │   ├── base.ts               # BaseOfflineStorage class
│   │   ├── calculator.ts         # Calculator offline storage
│   │   ├── draftOrders.ts        # Draft orders system
│   │   ├── cachedData.ts         # Cached data viewer
│   │   └── syncQueue.ts          # Sync queue management
│   └── serviceWorker.ts          # SW registration
├── pages/
│   └── OfflinePage.tsx           # Offline features UI
└── components/
    └── offline/                  # Offline UI components
        ├── StorageStatus.tsx
        ├── SyncQueue.tsx
        └── CachedDataViewer.tsx
```

## 🔧 Base Storage System

### BaseOfflineStorage Class

```typescript
class BaseOfflineStorage<T> {
  constructor(
    protected key: string,
    protected version: string = '1.0.0'
  )

  // Core methods
  async get(): Promise<T | null>
  async set(data: T, ttl?: number): Promise<void>
  async remove(): Promise<void>
  async clear(): Promise<void>
  
  // TTL methods
  async isExpired(): Promise<boolean>
  async getRemainingTTL(): Promise<number>
  
  // Versioning
  async migrate(oldData: any, oldVersion: string): Promise<T>
  
  // Utilities
  async getSize(): Promise<number>
  async backup(): Promise<string>
  async restore(backup: string): Promise<void>
}
```

### Storage Schema

```typescript
interface StorageItem<T> {
  data: T;
  timestamp: number;
  ttl?: number;
  version: string;
  checksum?: string;
}

interface StorageMetadata {
  key: string;
  size: number;
  lastAccessed: number;
  expiresAt?: number;
  version: string;
}
```

## 📊 Calculator Offline Storage

### Interface Definition

```typescript
interface CalculationResult {
  id: string;
  recipeId: string;
  recipeName: string;
  ingredients: Array<{
    name: string;
    amount: number;
    unit: string;
    cost: number;
  }>;
  costs: {
    materials: number;
    operational: number;
    labor: number;
    overhead: number;
  };
  pricing: {
    hpp: number;
    markup: number;
    sellingPrice: number;
    profit: number;
    margin: number;
  };
  timestamp: number;
  syncStatus: 'pending' | 'synced' | 'failed';
}
```

### Usage Example

```typescript
import { offlineCalculatorStorage } from '@/lib/offlineStorage';

// Save calculation
await offlineCalculatorStorage.saveCalculation({
  id: generateId(),
  recipeId: recipe.id,
  recipeName: recipe.name,
  ingredients: recipe.ingredients,
  costs: calculatedCosts,
  pricing: pricingResult,
  timestamp: Date.now(),
  syncStatus: 'pending'
});

// Get history with pagination
const history = await offlineCalculatorStorage.getHistory({
  page: 1,
  limit: 10,
  sortBy: 'timestamp',
  order: 'desc'
});

// Search calculations
const results = await offlineCalculatorStorage.searchCalculations({
  query: 'nasi goreng',
  filters: {
    dateRange: { start: startDate, end: endDate },
    priceRange: { min: 10000, max: 50000 }
  }
});

// Sync pending calculations
const pending = await offlineCalculatorStorage.getPendingSync();
for (const calc of pending) {
  try {
    await syncCalculationToServer(calc);
    await offlineCalculatorStorage.markAsSynced(calc.id);
  } catch (error) {
    await offlineCalculatorStorage.markAsFailed(calc.id, error.message);
  }
}
```

## 📝 Draft Orders System

### Data Structure

```typescript
interface DraftOrder {
  id: string;
  customerId?: string;
  customerInfo: {
    name: string;
    phone?: string;
    address?: string;
    notes?: string;
  };
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    notes?: string;
  }>;
  pricing: {
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
  };
  metadata: {
    createdAt: number;
    updatedAt: number;
    status: 'draft' | 'pending_sync' | 'synced' | 'failed';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    deviceId: string;
    version: number;
  };
}
```

### Auto-save Implementation

```typescript
class DraftOrderManager {
  private autoSaveTimer?: NodeJS.Timeout;
  private currentDraft?: DraftOrder;

  startAutoSave(draftId: string) {
    this.stopAutoSave();
    this.autoSaveTimer = setInterval(() => {
      this.saveDraftSilently(draftId);
    }, 5000); // Auto-save every 5 seconds
  }

  private async saveDraftSilently(draftId: string) {
    if (this.currentDraft) {
      try {
        await draftOrdersStorage.saveDraft(this.currentDraft);
        this.showAutoSaveIndicator('saved');
      } catch (error) {
        this.showAutoSaveIndicator('error');
        console.error('Auto-save failed:', error);
      }
    }
  }
}
```

## 🔄 Sync Queue System

### Queue Item Structure

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
  dependencies?: string[]; // IDs of items that must sync first
}
```

### Sync Processing

```typescript
class SyncQueueProcessor {
  private processing = false;
  private retryDelays = [1000, 2000, 5000, 10000, 30000]; // Exponential backoff

  async processPendingItems(): Promise<SyncResult> {
    if (this.processing) return { success: false, message: 'Already processing' };
    
    this.processing = true;
    const results: SyncResult[] = [];

    try {
      // Get items sorted by priority and dependencies
      const items = await syncQueueStorage.getPendingItems();
      const sortedItems = this.resolveDependencies(items);

      for (const item of sortedItems) {
        const result = await this.processSingleItem(item);
        results.push(result);

        if (!result.success) {
          await this.handleFailedItem(item, result.error);
        } else {
          await syncQueueStorage.removeItem(item.id);
        }
      }

      return {
        success: true,
        processed: results.length,
        failed: results.filter(r => !r.success).length
      };
    } finally {
      this.processing = false;
    }
  }

  private async handleFailedItem(item: SyncQueueItem, error: string) {
    item.attempts += 1;
    item.lastAttemptAt = Date.now();
    item.error = error;

    if (item.attempts >= item.maxAttempts) {
      // Move to failed queue or notify user
      await syncQueueStorage.moveToFailed(item);
    } else {
      // Schedule retry with exponential backoff
      const delay = this.retryDelays[item.attempts - 1] || 30000;
      item.scheduledAt = Date.now() + delay;
      await syncQueueStorage.updateItem(item);
    }
  }
}
```

## 🗄️ Cached Data Viewer

### Cache Structure

```typescript
interface CachedDataEntry {
  key: string;
  type: 'recipe' | 'customer' | 'product' | 'report';
  data: any;
  metadata: {
    cachedAt: number;
    expiresAt: number;
    version: string;
    source: 'api' | 'manual' | 'sync';
    size: number;
  };
}
```

### Implementation

```typescript
class CachedDataManager extends BaseOfflineStorage<CachedDataEntry[]> {
  constructor() {
    super('cached_data', '1.0.0');
  }

  async getCachedData(type?: string): Promise<CachedDataEntry[]> {
    const allData = await this.get() || [];
    return type ? allData.filter(item => item.type === type) : allData;
  }

  async addCacheEntry(entry: Omit<CachedDataEntry, 'metadata'>) {
    const currentData = await this.get() || [];
    const newEntry: CachedDataEntry = {
      ...entry,
      metadata: {
        cachedAt: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        version: '1.0.0',
        source: 'manual',
        size: JSON.stringify(entry.data).length
      }
    };

    currentData.push(newEntry);
    await this.set(currentData);
  }

  async refreshExpiredCache(): Promise<RefreshResult> {
    const allData = await this.get() || [];
    const expired = allData.filter(item => 
      item.metadata.expiresAt < Date.now()
    );

    const refreshResults: RefreshResult[] = [];
    
    for (const item of expired) {
      try {
        const freshData = await this.fetchFreshData(item.key, item.type);
        if (freshData) {
          item.data = freshData;
          item.metadata.cachedAt = Date.now();
          item.metadata.expiresAt = Date.now() + (24 * 60 * 60 * 1000);
          refreshResults.push({ key: item.key, success: true });
        }
      } catch (error) {
        refreshResults.push({ 
          key: item.key, 
          success: false, 
          error: error.message 
        });
      }
    }

    await this.set(allData);
    return {
      total: expired.length,
      successful: refreshResults.filter(r => r.success).length,
      failed: refreshResults.filter(r => !r.success).length,
      results: refreshResults
    };
  }
}
```

## 🚀 Service Worker Integration

### Cache Strategies

```typescript
// sw.js
const CACHE_STRATEGIES = {
  // App shell - cache first with fallback
  shell: new CacheFirst({
    cacheName: 'app-shell-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 50 })
    ]
  }),

  // API calls - network first with offline fallback
  api: new NetworkFirst({
    cacheName: 'api-cache-v1',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 300 })
    ]
  }),

  // Static assets - stale while revalidate
  assets: new StaleWhileRevalidate({
    cacheName: 'assets-cache-v1',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 200 })
    ]
  })
};

// Route matching
registerRoute(
  ({ request }) => request.destination === 'document',
  CACHE_STRATEGIES.shell
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  CACHE_STRATEGIES.api
);

registerRoute(
  ({ request }) => ['image', 'script', 'style'].includes(request.destination),
  CACHE_STRATEGIES.assets
);
```

### Background Sync

```typescript
// Register background sync
self.addEventListener('sync', event => {
  if (event.tag === 'offline-sync') {
    event.waitUntil(processPendingOperations());
  }
});

async function processPendingOperations() {
  const queue = await getSyncQueue();
  
  for (const operation of queue) {
    try {
      await performOperation(operation);
      await removeFromQueue(operation.id);
    } catch (error) {
      await updateOperationError(operation.id, error.message);
    }
  }
}

// Message handling for immediate sync
self.addEventListener('message', event => {
  if (event.data?.type === 'SYNC_NOW') {
    event.waitUntil(processPendingOperations());
  }
});
```

## 📊 Performance Monitoring

### Storage Metrics

```typescript
interface StorageMetrics {
  totalSize: number;
  availableSize: number;
  usagePercentage: number;
  itemCount: number;
  oldestItem: number;
  newestItem: number;
  expiredItems: number;
}

async function getStorageMetrics(): Promise<StorageMetrics> {
  const estimate = await navigator.storage?.estimate();
  const allKeys = Object.keys(localStorage);
  const appKeys = allKeys.filter(key => key.startsWith('monifine_'));
  
  let totalSize = 0;
  let oldestItem = Date.now();
  let newestItem = 0;
  let expiredItems = 0;

  for (const key of appKeys) {
    const item = localStorage.getItem(key);
    if (item) {
      totalSize += item.length;
      try {
        const parsed = JSON.parse(item);
        if (parsed.timestamp) {
          oldestItem = Math.min(oldestItem, parsed.timestamp);
          newestItem = Math.max(newestItem, parsed.timestamp);
        }
        if (parsed.ttl && parsed.timestamp + parsed.ttl < Date.now()) {
          expiredItems++;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }

  return {
    totalSize,
    availableSize: estimate?.quota || 0,
    usagePercentage: estimate?.quota ? (totalSize / estimate.quota) * 100 : 0,
    itemCount: appKeys.length,
    oldestItem,
    newestItem,
    expiredItems
  };
}
```

## 🔧 Error Handling

### Error Types

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
  VERSION_MISMATCH = 'VERSION_MISMATCH'
}
```

### Error Recovery

```typescript
async function recoverFromError(error: OfflineError): Promise<boolean> {
  switch (error.code) {
    case ErrorCodes.STORAGE_FULL:
      await cleanupExpiredData();
      await clearLeastRecentlyUsed();
      return true;

    case ErrorCodes.DATA_CORRUPTED:
      await restoreFromBackup();
      return true;

    case ErrorCodes.VERSION_MISMATCH:
      await migrateData(error.context.oldVersion, error.context.newVersion);
      return true;

    case ErrorCodes.SYNC_FAILED:
      await requeueFailedOperations();
      return true;

    default:
      return false;
  }
}
```

## 🧪 Testing

### Unit Tests Example

```typescript
describe('BaseOfflineStorage', () => {
  let storage: BaseOfflineStorage<TestData>;

  beforeEach(() => {
    storage = new BaseOfflineStorage('test_key', '1.0.0');
    localStorage.clear();
  });

  it('should store and retrieve data', async () => {
    const testData = { id: '1', name: 'test' };
    await storage.set(testData);
    
    const retrieved = await storage.get();
    expect(retrieved).toEqual(testData);
  });

  it('should handle TTL expiration', async () => {
    const testData = { id: '1', name: 'test' };
    await storage.set(testData, 100); // 100ms TTL
    
    // Should be available immediately
    expect(await storage.get()).toEqual(testData);
    
    // Should be expired after TTL
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(await storage.get()).toBeNull();
  });
});
```

---

*Dokumentasi teknis ini mencakup implementasi lengkap sistem offline. Untuk API reference lebih detail, lihat dokumentasi API terpisah.*
