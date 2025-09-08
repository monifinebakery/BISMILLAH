import React from 'react';
import { withLazyLoading } from '@/components/common/LazyWrapper';
import { Loader2 } from 'lucide-react';

// ULTRA PERFORMANCE: Custom loading untuk OrdersPage
const OrdersPageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <div className="text-center space-y-2">
      <h3 className="text-lg font-medium">Memuat Halaman Pesanan</h3>
      <p className="text-sm text-muted-foreground">Sedang menyiapkan data pesanan...</p>
    </div>
  </div>
);

// PERFORMANCE: Lazy load OrdersPage dengan preload strategy
const ordersPageImport = () => import('./OrdersPage');

const LazyOrdersPage = withLazyLoading(
  ordersPageImport,
  <OrdersPageLoader />
);

// PERFORMANCE: Preload function untuk digunakan di routing
export const preloadOrdersPage = ordersPageImport;

// PERFORMANCE: Hook untuk conditional preload
export const usePreloadOrdersPage = (shouldPreload: boolean = false) => {
  React.useEffect(() => {
    if (shouldPreload) {
      preloadOrdersPage();
    }
  }, [shouldPreload]);
};

export default LazyOrdersPage;