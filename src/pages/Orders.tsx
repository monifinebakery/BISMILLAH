import React, { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const OrdersPageContent = React.lazy(() => import('@/components/orders/components/OrdersPage'));

const RouteFallback = () => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <LoadingSpinner size="md" />
  </div>
);

const LazyOrdersPage = () => {
  return (
    <Suspense fallback={<RouteFallback />}> 
        <OrdersPageContent />
    </Suspense>
  )
}

export default LazyOrdersPage;
