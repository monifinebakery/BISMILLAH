import React, { Suspense } from 'react';

const OrdersPageContent = React.lazy(() => import('@/components/orders/components/OrdersPage'));

const RouteFallback = () => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <div className="h-6 w-6 border-2 border-orange-500 border-t-transparent rounded-full motion-safe:animate-spin" />
    <span className="sr-only">Memuat…</span>
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
