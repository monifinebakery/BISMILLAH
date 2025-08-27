# Panduan Penggunaan - Optimasi Performa

## Daftar Isi
1. [Quick Start](#quick-start)
2. [Implementasi Step-by-Step](#implementasi-step-by-step)
3. [Contoh Kasus Penggunaan](#contoh-kasus-penggunaan)
4. [Troubleshooting](#troubleshooting)
5. [Tips dan Trik](#tips-dan-trik)

## Quick Start

### 1. Instalasi dan Setup

Semua fitur optimasi sudah terintegrasi dalam aplikasi. Untuk menggunakan:

```bash
# Clone dan install dependencies
git clone <repository>
cd BISMILLAH
npm install

# Jalankan development server
npm run dev
```

### 2. Import Hooks yang Dibutuhkan

```tsx
// Import hooks optimasi
import { 
  useMemoryMonitor,
  useWebWorker,
  usePreloading,
  useApiRequest,
  useNetworkOptimization 
} from '@/hooks';

// Import components optimasi
import { 
  OptimizedImage,
  VirtualScrollTable 
} from '@/components/common';
```

### 3. Penggunaan Dasar

```tsx
function OptimizedApp() {
  // Monitor memory
  const { memoryUsage, isHighUsage } = useMemoryMonitor();
  
  // Network optimization
  const { data, loading } = useApiRequest('/api/data');
  
  // Preloading
  const { preloadRoute } = usePreloading();
  
  return (
    <div>
      {isHighUsage && <Alert>Memory usage tinggi!</Alert>}
      {loading ? <Loading /> : <DataDisplay data={data} />}
    </div>
  );
}
```

## Implementasi Step-by-Step

### Step 1: Memory Optimization

#### 1.1 Setup Memory Monitoring

```tsx
// components/MemoryMonitor.tsx
import { useMemoryMonitor } from '@/hooks/useMemoryMonitor';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function MemoryMonitor() {
  const { 
    memoryUsage, 
    isHighUsage, 
    cleanup 
  } = useMemoryMonitor({
    threshold: 80, // Alert jika > 80%
    interval: 5000 // Check setiap 5 detik
  });

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-white p-3 rounded-lg shadow-lg border">
        <p className="text-sm">
          Memory: {memoryUsage.used}MB / {memoryUsage.total}MB 
          ({memoryUsage.percentage}%)
        </p>
        
        {isHighUsage && (
          <Alert className="mt-2">
            <AlertDescription>
              Memory usage tinggi! 
              <button onClick={cleanup} className="ml-2 underline">
                Cleanup
              </button>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
```

#### 1.2 Implementasi di Layout

```tsx
// components/layout/Layout.tsx
import { MemoryMonitor } from '@/components/MemoryMonitor';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
      {process.env.NODE_ENV === 'development' && <MemoryMonitor />}
    </div>
  );
}
```

### Step 2: Network Optimization

#### 2.1 Setup API Request Hook

```tsx
// hooks/useOptimizedApi.ts
import { useApiRequest } from '@/hooks/useNetworkOptimization';

export function useOptimizedApi<T>(url: string) {
  return useApiRequest<T>(url, {
    retryAttempts: 3,
    cacheTime: 300000, // 5 minutes
    deduplicate: true,
    timeout: 10000
  });
}
```

#### 2.2 Implementasi di Component

```tsx
// components/DataTable.tsx
import { useOptimizedApi } from '@/hooks/useOptimizedApi';

export function DataTable() {
  const { 
    data, 
    loading, 
    error, 
    retry 
  } = useOptimizedApi<Item[]>('/api/items');

  if (loading) return <TableSkeleton />;
  
  if (error) return (
    <ErrorState 
      message={error.message}
      onRetry={retry}
    />
  );

  return (
    <VirtualScrollTable
      data={data || []}
      itemHeight={60}
      containerHeight={400}
      renderItem={({ item, style }) => (
        <div style={style} className="border-b p-4">
          <h3>{item.name}</h3>
          <p>{item.description}</p>
        </div>
      )}
    />
  );
}
```

### Step 3: Image Optimization

#### 3.1 Replace Regular Images

```tsx
// Before (❌)
<img src="/products/product1.jpg" alt="Product 1" />

// After (✅)
<OptimizedImage
  src="/products/product1.jpg"
  alt="Product 1"
  width={300}
  height={200}
  priority={false} // true untuk above-the-fold
  quality={80}
/>
```

#### 3.2 Gallery Implementation

```tsx
// components/ProductGallery.tsx
import { OptimizedImage } from '@/components/common/OptimizedImage';

export function ProductGallery({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map((product, index) => (
        <OptimizedImage
          key={product.id}
          src={product.image}
          alt={product.name}
          width={300}
          height={200}
          priority={index < 6} // Prioritas untuk 6 gambar pertama
          className="rounded-lg"
        />
      ))}
    </div>
  );
}
```

### Step 4: Web Workers

#### 4.1 Setup Heavy Calculation

```tsx
// components/HPPCalculator.tsx
import { useWebWorker } from '@/hooks/useWebWorker';

export function HPPCalculator({ items }: { items: Item[] }) {
  const { 
    execute, 
    isLoading, 
    progress, 
    error 
  } = useWebWorker('/workers/hppCalculationWorker.js');

  const calculateHPP = async () => {
    try {
      const result = await execute({
        items,
        operation: 'calculate_hpp'
      });
      
      console.log('HPP calculated:', result);
    } catch (err) {
      console.error('HPP calculation failed:', err);
    }
  };

  return (
    <div>
      <button 
        onClick={calculateHPP}
        disabled={isLoading}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {isLoading ? 'Calculating...' : 'Calculate HPP'}
      </button>
      
      {isLoading && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm mt-1">{progress}% complete</p>
        </div>
      )}
      
      {error && (
        <p className="text-red-500 mt-2">Error: {error.message}</p>
      )}
    </div>
  );
}
```

### Step 5: Preloading

#### 5.1 Navigation dengan Preloading

```tsx
// components/Navigation.tsx
import { usePreloading } from '@/hooks/usePreloading';
import { Link } from 'react-router-dom';

export function Navigation() {
  const { preloadRoute, preloadData } = usePreloading();

  const handleMouseEnter = (path: string) => {
    // Preload route saat hover
    preloadRoute(path);
    
    // Preload data jika diperlukan
    if (path === '/orders') {
      preloadData('orders', () => fetch('/api/orders').then(r => r.json()));
    }
  };

  return (
    <nav className="flex space-x-4">
      <Link 
        to="/dashboard"
        onMouseEnter={() => handleMouseEnter('/dashboard')}
        className="hover:text-blue-500"
      >
        Dashboard
      </Link>
      
      <Link 
        to="/orders"
        onMouseEnter={() => handleMouseEnter('/orders')}
        className="hover:text-blue-500"
      >
        Orders
      </Link>
      
      <Link 
        to="/products"
        onMouseEnter={() => handleMouseEnter('/products')}
        className="hover:text-blue-500"
      >
        Products
      </Link>
    </nav>
  );
}
```

### Step 6: Virtual Scrolling

#### 6.1 Large Table Implementation

```tsx
// components/LargeDataTable.tsx
import { VirtualScrollTable } from '@/components/common/VirtualScrollTable';
import { useMemo } from 'react';

export function LargeDataTable({ data }: { data: any[] }) {
  const memoizedData = useMemo(() => data, [data]);

  const renderItem = ({ item, index, style }: any) => (
    <div 
      key={item.id}
      style={style}
      className="flex items-center p-4 border-b hover:bg-gray-50"
    >
      <div className="w-12 text-center">{index + 1}</div>
      <div className="flex-1">{item.name}</div>
      <div className="w-32">{item.category}</div>
      <div className="w-24 text-right">{item.price}</div>
    </div>
  );

  // Gunakan virtual scrolling untuk data > 100 items
  if (memoizedData.length > 100) {
    return (
      <VirtualScrollTable
        data={memoizedData}
        itemHeight={60}
        containerHeight={500}
        renderItem={renderItem}
        overscan={10}
      />
    );
  }

  // Regular rendering untuk data kecil
  return (
    <div className="max-h-500 overflow-auto">
      {memoizedData.map((item, index) => 
        renderItem({ item, index, style: {} })
      )}
    </div>
  );
}
```

## Contoh Kasus Penggunaan

### Kasus 1: Dashboard dengan Data Besar

```tsx
// pages/Dashboard.tsx
import { useOptimizedApi } from '@/hooks/useOptimizedApi';
import { useMemoryMonitor } from '@/hooks/useMemoryMonitor';
import { LargeDataTable } from '@/components/LargeDataTable';

export function Dashboard() {
  // Monitor memory untuk dashboard yang complex
  const { isHighUsage, cleanup } = useMemoryMonitor();
  
  // Load data dengan optimasi
  const { data: orders } = useOptimizedApi('/api/orders');
  const { data: products } = useOptimizedApi('/api/products');
  const { data: analytics } = useOptimizedApi('/api/analytics');

  // Cleanup otomatis jika memory tinggi
  useEffect(() => {
    if (isHighUsage) {
      cleanup();
    }
  }, [isHighUsage, cleanup]);

  return (
    <div className="p-6">
      <h1>Dashboard</h1>
      
      {/* Analytics Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <AnalyticsCard data={analytics?.revenue} />
        <AnalyticsCard data={analytics?.orders} />
        <AnalyticsCard data={analytics?.customers} />
      </div>
      
      {/* Large Data Tables */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2>Recent Orders</h2>
          <LargeDataTable data={orders || []} />
        </div>
        
        <div>
          <h2>Products</h2>
          <LargeDataTable data={products || []} />
        </div>
      </div>
    </div>
  );
}
```

### Kasus 2: E-commerce Product List

```tsx
// pages/ProductList.tsx
import { useOptimizedApi } from '@/hooks/useOptimizedApi';
import { usePreloading } from '@/hooks/usePreloading';
import { OptimizedImage } from '@/components/common/OptimizedImage';

export function ProductList() {
  const { data: products, loading } = useOptimizedApi('/api/products');
  const { preloadRoute } = usePreloading();

  const handleProductHover = (productId: string) => {
    // Preload product detail page
    preloadRoute(`/products/${productId}`);
  };

  if (loading) return <ProductListSkeleton />;

  return (
    <div className="grid grid-cols-4 gap-6">
      {products?.map((product, index) => (
        <div 
          key={product.id}
          onMouseEnter={() => handleProductHover(product.id)}
          className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
        >
          <OptimizedImage
            src={product.image}
            alt={product.name}
            width={250}
            height={200}
            priority={index < 8} // Prioritas untuk 8 produk pertama
            className="w-full h-48 object-cover rounded"
          />
          
          <h3 className="mt-2 font-semibold">{product.name}</h3>
          <p className="text-gray-600">{product.price}</p>
        </div>
      ))}
    </div>
  );
}
```

### Kasus 3: Bulk Operations

```tsx
// components/BulkOperations.tsx
import { useWebWorker } from '@/hooks/useWebWorker';
import { useState } from 'react';

export function BulkOperations({ selectedItems }: { selectedItems: any[] }) {
  const [operation, setOperation] = useState<string>('');
  
  const { 
    execute, 
    isLoading, 
    progress 
  } = useWebWorker('/workers/bulkOperationsWorker.js');

  const handleBulkUpdate = async () => {
    try {
      const result = await execute({
        operation: 'bulk_update',
        items: selectedItems,
        updates: { status: 'processed' }
      });
      
      console.log('Bulk update completed:', result);
    } catch (error) {
      console.error('Bulk update failed:', error);
    }
  };

  const handleBulkDelete = async () => {
    try {
      const result = await execute({
        operation: 'bulk_delete',
        items: selectedItems
      });
      
      console.log('Bulk delete completed:', result);
    } catch (error) {
      console.error('Bulk delete failed:', error);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg border">
      <h3>Bulk Operations ({selectedItems.length} items)</h3>
      
      <div className="flex space-x-2 mt-4">
        <button 
          onClick={handleBulkUpdate}
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Update All
        </button>
        
        <button 
          onClick={handleBulkDelete}
          disabled={isLoading}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Delete All
        </button>
      </div>
      
      {isLoading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm mt-1">
            Processing {operation}... {progress}%
          </p>
        </div>
      )}
    </div>
  );
}
```

## Troubleshooting

### Problem 1: Memory Usage Tinggi

**Gejala:**
- Aplikasi lambat
- Browser freeze
- Memory warning

**Solusi:**
```tsx
// 1. Enable memory monitoring
const { memoryUsage, isHighUsage, cleanup } = useMemoryMonitor({
  threshold: 75 // Lower threshold
});

// 2. Manual cleanup
useEffect(() => {
  if (isHighUsage) {
    cleanup();
    // Force garbage collection jika tersedia
    if (window.gc) window.gc();
  }
}, [isHighUsage]);

// 3. Cleanup pada unmount
useEffect(() => {
  return () => {
    cleanup();
  };
}, []);
```

### Problem 2: Network Requests Lambat

**Gejala:**
- Loading lama
- Request timeout
- Duplicate requests

**Solusi:**
```tsx
// 1. Enable deduplication
const { data } = useApiRequest('/api/data', {
  deduplicate: true,
  cacheTime: 300000
});

// 2. Increase retry attempts
const { data } = useApiRequest('/api/data', {
  retryAttempts: 5,
  timeout: 15000
});

// 3. Check network stats
const { stats } = useNetworkOptimization();
console.log('Deduplicated requests:', stats.deduplicatedRequests);
```

### Problem 3: Images Tidak Load

**Gejala:**
- Gambar tidak muncul
- Loading terus-menerus
- Error 404

**Solusi:**
```tsx
// 1. Check image path
<OptimizedImage
  src="/images/product.jpg" // Pastikan path benar
  alt="Product"
  onError={() => console.log('Image failed to load')}
/>

// 2. Add fallback
<OptimizedImage
  src="/images/product.jpg"
  fallback="/images/placeholder.jpg"
  alt="Product"
/>

// 3. Disable lazy loading untuk debugging
<OptimizedImage
  src="/images/product.jpg"
  alt="Product"
  priority={true} // Force immediate load
/>
```

### Problem 4: Virtual Scrolling Tidak Smooth

**Gejala:**
- Scrolling tersendat
- Items tidak render
- Performance buruk

**Solusi:**
```tsx
// 1. Optimize item height
<VirtualScrollTable
  data={data}
  itemHeight={60} // Fixed height untuk performa optimal
  overscan={5} // Reduce overscan
/>

// 2. Memoize render function
const renderItem = useCallback(({ item, style }) => (
  <div style={style}>
    {item.name}
  </div>
), []);

// 3. Use key prop
<VirtualScrollTable
  data={data}
  itemHeight={60}
  renderItem={renderItem}
  getItemKey={(index) => data[index].id} // Stable keys
/>
```

## Tips dan Trik

### 1. Performance Monitoring

```tsx
// Setup performance monitoring
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

function App() {
  const { metrics } = usePerformanceMonitor();
  
  // Log metrics untuk debugging
  useEffect(() => {
    console.log('Performance metrics:', metrics);
  }, [metrics]);
  
  return <YourApp />;
}
```

### 2. Conditional Optimization

```tsx
// Gunakan optimasi berdasarkan kondisi
function DataComponent({ data }: { data: any[] }) {
  // Virtual scrolling hanya untuk data besar
  if (data.length > 100) {
    return <VirtualScrollTable data={data} />;
  }
  
  // Regular rendering untuk data kecil
  return <RegularTable data={data} />;
}
```

### 3. Progressive Enhancement

```tsx
// Start dengan basic, tambah optimasi bertahap
function ImageGallery({ images }: { images: string[] }) {
  const [optimizationEnabled, setOptimizationEnabled] = useState(false);
  
  useEffect(() => {
    // Enable optimasi setelah component mount
    setOptimizationEnabled(true);
  }, []);
  
  if (optimizationEnabled) {
    return images.map(src => (
      <OptimizedImage key={src} src={src} alt="" />
    ));
  }
  
  // Fallback ke regular images
  return images.map(src => (
    <img key={src} src={src} alt="" />
  ));
}
```

### 4. Environment-based Optimization

```tsx
// Optimasi berbeda untuk development vs production
const isDev = process.env.NODE_ENV === 'development';

function App() {
  const memoryConfig = {
    threshold: isDev ? 70 : 85, // Lower threshold di dev
    interval: isDev ? 3000 : 10000 // Frequent check di dev
  };
  
  const { memoryUsage } = useMemoryMonitor(memoryConfig);
  
  return (
    <div>
      {isDev && <MemoryMonitor usage={memoryUsage} />}
      <YourApp />
    </div>
  );
}
```

### 5. Lazy Loading Components

```tsx
// Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### 6. Cache Strategy

```tsx
// Smart caching strategy
const getCacheTime = (dataType: string) => {
  switch (dataType) {
    case 'user-profile': return 600000; // 10 minutes
    case 'product-list': return 300000; // 5 minutes
    case 'real-time-data': return 30000; // 30 seconds
    default: return 60000; // 1 minute
  }
};

const { data } = useApiRequest('/api/products', {
  cacheTime: getCacheTime('product-list')
});
```

Dengan mengikuti panduan ini, Anda dapat mengimplementasikan semua fitur optimasi performa dengan efektif dan mendapatkan hasil yang optimal untuk aplikasi Anda.