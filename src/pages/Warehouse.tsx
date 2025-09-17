import React, { Suspense } from 'react';

// Lazy load the actual page content
const WarehousePageContent = React.lazy(() => import('@/components/warehouse/WarehousePage'));

const InlineTableSkeleton = () => (
  <div className="p-4 md:p-8 animate-pulse">
    <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
    <div className="border rounded-md">
      <div className="flex bg-muted/50 p-4 border-b">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-5 w-full mx-2 bg-gray-200 rounded" />
        ))}
      </div>
      {Array.from({ length: 8 }).map((_, r) => (
        <div key={r} className="flex items-center p-4 border-b">
          {Array.from({ length: 6 }).map((_, c) => (
            <div key={c} className="h-6 w-full mx-2 bg-gray-200 rounded" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

// This component will act as the route's element
const LazyWarehousePage = () => {
  return (
    <Suspense fallback={<InlineTableSkeleton />}> 
        <WarehousePageContent />
    </Suspense>
  )
}

export default LazyWarehousePage;
