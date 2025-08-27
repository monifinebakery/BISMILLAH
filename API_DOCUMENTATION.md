# API Documentation - Optimasi Performa

## Daftar Isi
1. [Hooks](#hooks)
2. [Components](#components)
3. [Utilities](#utilities)
4. [Types](#types)
5. [Configuration](#configuration)

## Hooks

### useMemoryMonitor

Monitor penggunaan memory secara real-time.

```tsx
import { useMemoryMonitor } from '@/hooks/useMemoryMonitor';

const {
  memoryUsage,
  isHighUsage,
  cleanup,
  startMonitoring,
  stopMonitoring
} = useMemoryMonitor(options);
```

**Parameters:**
- `options` (optional): `MemoryMonitorOptions`
  - `threshold`: number (default: 80) - Threshold untuk high usage (%)
  - `interval`: number (default: 5000) - Interval monitoring (ms)

**Returns:**
- `memoryUsage`: `MemoryUsage`
  - `used`: number - Memory yang digunakan (MB)
  - `total`: number - Total memory (MB)
  - `percentage`: number - Persentase penggunaan
- `isHighUsage`: boolean - Apakah memory usage tinggi
- `cleanup`: () => void - Function untuk cleanup manual
- `startMonitoring`: () => void - Mulai monitoring
- `stopMonitoring`: () => void - Stop monitoring

### useWebWorker

Execute operasi berat di Web Worker.

```tsx
import { useWebWorker } from '@/hooks/useWebWorker';

const {
  execute,
  isLoading,
  progress,
  error,
  terminate
} = useWebWorker(workerPath, options);
```

**Parameters:**
- `workerPath`: string - Path ke worker file
- `options` (optional): `WebWorkerOptions`
  - `timeout`: number (default: 30000) - Timeout (ms)
  - `retries`: number (default: 3) - Jumlah retry

**Returns:**
- `execute`: (data: any) => Promise<any> - Execute worker
- `isLoading`: boolean - Status loading
- `progress`: number - Progress (0-100)
- `error`: Error | null - Error jika ada
- `terminate`: () => void - Terminate worker

### usePreloading

Preload resources dan routes.

```tsx
import { usePreloading } from '@/hooks/usePreloading';

const {
  preloadRoute,
  preloadData,
  preloadImage,
  isPreloading,
  preloadedRoutes
} = usePreloading();
```

**Returns:**
- `preloadRoute`: (path: string) => Promise<void> - Preload route
- `preloadData`: (key: string, fetcher: () => Promise<any>) => Promise<void> - Preload data
- `preloadImage`: (src: string) => Promise<void> - Preload image
- `isPreloading`: boolean - Status preloading
- `preloadedRoutes`: string[] - Routes yang sudah dipreload

### useNetworkOptimization

Optimasi network requests.

```tsx
import { useNetworkOptimization } from '@/hooks/useNetworkOptimization';

const {
  stats,
  isOnline,
  connectionType,
  clearCache,
  getQueuedRequests
} = useNetworkOptimization();
```

**Returns:**
- `stats`: `NetworkStats` - Statistik network
- `isOnline`: boolean - Status koneksi
- `connectionType`: string - Tipe koneksi
- `clearCache`: () => void - Clear request cache
- `getQueuedRequests`: () => QueuedRequest[] - Get queued requests

### useApiRequest

Optimized API request dengan retry dan caching.

```tsx
import { useApiRequest } from '@/hooks/useNetworkOptimization';

const {
  data,
  loading,
  error,
  retry,
  cancel
} = useApiRequest(url, options);
```

**Parameters:**
- `url`: string - API endpoint
- `options` (optional): `RequestConfig`
  - `method`: 'GET' | 'POST' | 'PUT' | 'DELETE'
  - `body`: any - Request body
  - `headers`: Record<string, string> - Headers
  - `retryAttempts`: number (default: 3) - Jumlah retry
  - `cacheTime`: number (default: 300000) - Cache time (ms)
  - `deduplicate`: boolean (default: true) - Enable deduplication

**Returns:**
- `data`: T | null - Response data
- `loading`: boolean - Loading state
- `error`: Error | null - Error jika ada
- `retry`: () => void - Retry request
- `cancel`: () => void - Cancel request

### useRequestDeduplication

Deduplicate identical requests.

```tsx
import { useRequestDeduplication } from '@/hooks/useNetworkOptimization';

const {
  deduplicatedRequest,
  pendingRequests,
  clearPending
} = useRequestDeduplication();
```

**Returns:**
- `deduplicatedRequest`: (key: string, request: () => Promise<any>) => Promise<any>
- `pendingRequests`: Map<string, Promise<any>> - Pending requests
- `clearPending`: () => void - Clear pending requests

### useIntelligentRetry

Smart retry mechanism dengan exponential backoff.

```tsx
import { useIntelligentRetry } from '@/hooks/useNetworkOptimization';

const {
  retryRequest,
  retryCount,
  isRetrying,
  resetRetry
} = useIntelligentRetry(config);
```

**Parameters:**
- `config` (optional): `RetryConfig`
  - `maxAttempts`: number (default: 3)
  - `baseDelay`: number (default: 1000)
  - `maxDelay`: number (default: 30000)
  - `backoffFactor`: number (default: 2)

**Returns:**
- `retryRequest`: (request: () => Promise<any>) => Promise<any>
- `retryCount`: number - Current retry count
- `isRetrying`: boolean - Retry status
- `resetRetry`: () => void - Reset retry count

## Components

### OptimizedImage

Komponen gambar dengan lazy loading dan format optimization.

```tsx
import { OptimizedImage } from '@/components/common/OptimizedImage';

<OptimizedImage
  src="/path/to/image.jpg"
  alt="Description"
  width={300}
  height={200}
  priority={false}
  quality={80}
  placeholder="blur"
  className="custom-class"
  onLoad={() => console.log('Image loaded')}
  onError={() => console.log('Image error')}
/>
```

**Props:**
- `src`: string - Image source
- `alt`: string - Alt text
- `width`: number - Image width
- `height`: number - Image height
- `priority`: boolean (default: false) - High priority loading
- `quality`: number (default: 80) - Image quality (1-100)
- `placeholder`: 'blur' | 'empty' (default: 'blur') - Placeholder type
- `className`: string - CSS class
- `onLoad`: () => void - Load callback
- `onError`: () => void - Error callback

### VirtualScrollTable

Virtual scrolling untuk tabel besar.

```tsx
import { VirtualScrollTable } from '@/components/common/VirtualScrollTable';

<VirtualScrollTable
  data={items}
  itemHeight={50}
  containerHeight={400}
  renderItem={({ item, index, style }) => (
    <div key={index} style={style}>
      {item.name}
    </div>
  )}
  overscan={5}
  onScroll={(scrollTop) => console.log(scrollTop)}
/>
```

**Props:**
- `data`: T[] - Array data
- `itemHeight`: number | ((index: number) => number) - Height per item
- `containerHeight`: number - Container height
- `renderItem`: (props: RenderItemProps<T>) => React.ReactNode - Render function
- `overscan`: number (default: 5) - Items to render outside viewport
- `onScroll`: (scrollTop: number) => void - Scroll callback

### NetworkOptimizationDemo

Demo component untuk network optimization.

```tsx
import { NetworkOptimizationDemo } from '@/components/NetworkOptimizationDemo';

<NetworkOptimizationDemo />
```

**Features:**
- Real-time network stats
- Request deduplication demo
- Retry mechanism demo
- Cache management
- Offline queue demo

### PreloadingDemo

Demo component untuk preloading features.

```tsx
import { PreloadingDemo } from '@/components/PreloadingDemo';

<PreloadingDemo />
```

**Features:**
- Route preloading demo
- Data prefetching demo
- Image preloading demo
- Performance metrics

## Utilities

### memoryOptimizer

Utility untuk optimasi memory.

```tsx
import { memoryOptimizer } from '@/utils/memoryOptimizer';

// Cleanup unused objects
memoryOptimizer.cleanup();

// Force garbage collection (if available)
memoryOptimizer.forceGC();

// Get memory info
const info = memoryOptimizer.getMemoryInfo();

// Monitor memory usage
memoryOptimizer.startMonitoring((usage) => {
  console.log('Memory usage:', usage);
});
```

### cacheManager

Utility untuk cache management.

```tsx
import { cacheManager } from '@/utils/cacheManager';

// Set cache
cacheManager.set('key', data, 300000); // 5 minutes

// Get cache
const data = cacheManager.get('key');

// Clear cache
cacheManager.clear('key');

// Clear all cache
cacheManager.clearAll();

// Get cache stats
const stats = cacheManager.getStats();
```

### logger

Utility untuk logging dengan levels.

```tsx
import { logger } from '@/utils/logger';

logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message');
logger.debug('Debug message');

// Set log level
logger.setLevel('debug');

// Get logs
const logs = logger.getLogs();
```

## Types

### MemoryUsage
```tsx
interface MemoryUsage {
  used: number;      // MB
  total: number;     // MB
  percentage: number; // 0-100
}
```

### NetworkStats
```tsx
interface NetworkStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  deduplicatedRequests: number;
  cacheHits: number;
  cacheMisses: number;
  totalDataTransferred: number; // bytes
  averageResponseTime: number;  // ms
}
```

### RequestConfig
```tsx
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  retryAttempts?: number;
  cacheTime?: number;
  deduplicate?: boolean;
  timeout?: number;
}
```

### RetryConfig
```tsx
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: Error) => boolean;
}
```

### PendingRequest
```tsx
interface PendingRequest {
  id: string;
  url: string;
  method: string;
  timestamp: number;
  retryCount: number;
}
```

### QueuedRequest
```tsx
interface QueuedRequest {
  id: string;
  url: string;
  config: RequestConfig;
  timestamp: number;
  priority: number;
}
```

## Configuration

### Default Configurations

```tsx
// Memory Monitor
const DEFAULT_MEMORY_CONFIG = {
  threshold: 80,
  interval: 5000
};

// Web Worker
const DEFAULT_WORKER_CONFIG = {
  timeout: 30000,
  retries: 3
};

// Network Optimization
const DEFAULT_REQUEST_CONFIG = {
  retryAttempts: 3,
  cacheTime: 300000,
  deduplicate: true,
  timeout: 10000
};

// Retry Configuration
const DEFAULT_RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2
};
```

### Environment Variables

```bash
# .env
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_CACHE_DURATION=300000
VITE_MAX_RETRY_ATTEMPTS=3
VITE_WORKER_TIMEOUT=30000
```

### Runtime Configuration

```tsx
// Configure at runtime
import { configurePerformance } from '@/config/performance';

configurePerformance({
  memoryThreshold: 85,
  cacheSize: 100,
  retryAttempts: 5,
  workerTimeout: 60000
});
```

## Error Handling

### Common Error Types

```tsx
// Network errors
class NetworkError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

// Memory errors
class MemoryError extends Error {
  constructor(message: string, public usage: MemoryUsage) {
    super(message);
    this.name = 'MemoryError';
  }
}

// Worker errors
class WorkerError extends Error {
  constructor(message: string, public workerPath: string) {
    super(message);
    this.name = 'WorkerError';
  }
}
```

### Error Handling Patterns

```tsx
// With try-catch
try {
  const data = await useApiRequest('/api/data');
} catch (error) {
  if (error instanceof NetworkError) {
    // Handle network error
  } else {
    // Handle other errors
  }
}

// With error boundaries
<ErrorBoundary fallback={<ErrorFallback />}>
  <OptimizedComponent />
</ErrorBoundary>

// With hooks
const { data, error } = useApiRequest('/api/data');
if (error) {
  // Handle error
}
```

## Performance Metrics

### Monitoring Performance

```tsx
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

function PerformancePanel() {
  const { metrics } = usePerformanceMonitor();
  
  return (
    <div>
      <p>First Contentful Paint: {metrics.fcp}ms</p>
      <p>Largest Contentful Paint: {metrics.lcp}ms</p>
      <p>Cumulative Layout Shift: {metrics.cls}</p>
      <p>First Input Delay: {metrics.fid}ms</p>
    </div>
  );
}
```

### Custom Metrics

```tsx
import { performance } from '@/utils/performance';

// Mark start
performance.mark('operation-start');

// Do operation
await heavyOperation();

// Mark end and measure
performance.mark('operation-end');
const duration = performance.measure('operation', 'operation-start', 'operation-end');

console.log(`Operation took ${duration}ms`);
```

## Best Practices

### 1. Memory Management
```tsx
// ✅ Good
useEffect(() => {
  const cleanup = startHeavyOperation();
  return cleanup; // Always cleanup
}, []);

// ❌ Bad
useEffect(() => {
  startHeavyOperation(); // No cleanup
}, []);
```

### 2. Network Optimization
```tsx
// ✅ Good
const { data } = useApiRequest('/api/data', {
  deduplicate: true,
  cacheTime: 300000
});

// ❌ Bad
useEffect(() => {
  fetch('/api/data'); // No optimization
}, []);
```

### 3. Image Optimization
```tsx
// ✅ Good
<OptimizedImage
  src="/image.jpg"
  alt="Description"
  priority={isAboveFold}
/>

// ❌ Bad
<img src="/image.jpg" alt="Description" />
```

### 4. Virtual Scrolling
```tsx
// ✅ Good - Use for large lists
{items.length > 100 ? (
  <VirtualScrollTable data={items} />
) : (
  <RegularTable data={items} />
)}

// ❌ Bad - Render all items
{items.map(item => <Item key={item.id} data={item} />)}
```