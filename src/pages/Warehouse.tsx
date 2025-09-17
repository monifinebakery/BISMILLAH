import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import React, { Suspense } from 'react';

// Lazy load the actual page content
const WarehousePageContent = React.lazy(() => import('@/components/warehouse/WarehousePage'));

// This component will act as the route's element
const LazyWarehousePage = () => {
  return (
    <Suspense fallback={<TableSkeleton columnCount={6} rowCount={8}/>}>
        <WarehousePageContent />
    </Suspense>
  )
}

export default LazyWarehousePage;