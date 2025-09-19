import React, { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Lazy load the actual page content
const WarehousePageContent = React.lazy(() => import('@/components/warehouse/WarehousePageRefactored'));

const RouteFallback = () => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <LoadingSpinner size="md" />
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
