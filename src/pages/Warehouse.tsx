import React, { Suspense } from 'react';

// Lazy load the actual page content
const WarehousePageContent = React.lazy(() => import('@/components/warehouse/WarehousePage'));

const RouteFallback = () => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <div className="h-6 w-6 border-2 border-orange-500 border-t-transparent rounded-full motion-safe:animate-spin" />
    <span className="sr-only">Memuat…</span>
  </div>
);

// This component will act as the route's element
const LazyWarehousePage = () => {
  return (
    <Suspense fallback={<RouteFallback />}> 
        <WarehousePageContent />
    </Suspense>
  )
}

export default LazyWarehousePage;
