import React, { Suspense } from 'react';

const OrdersPageContent = React.lazy(() => import('@/components/orders/components/OrdersPage'));

const InlineTableSkeleton = () => (
  <div className="p-4 md:p-8 animate-pulse">
    <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
    <div className="border rounded-md">
      <div className="flex bg-muted/50 p-4 border-b">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-5 w-full mx-2 bg-gray-200 rounded" />
        ))}
      </div>
      {Array.from({ length: 12 }).map((_, r) => (
        <div key={r} className="flex items-center p-4 border-b">
          {Array.from({ length: 8 }).map((_, c) => (
            <div key={c} className="h-6 w-full mx-2 bg-gray-200 rounded" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

const LazyOrdersPage = () => {
  return (
    <Suspense fallback={<InlineTableSkeleton />}> 
        <OrdersPageContent />
    </Suspense>
  )
}

export default LazyOrdersPage;
