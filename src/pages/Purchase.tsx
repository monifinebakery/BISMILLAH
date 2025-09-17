import React, { Suspense } from 'react';

const PurchasePageContent = React.lazy(() => import('@/components/purchase/PurchasePage'));

const InlineTableSkeleton = () => (
  <div className="p-4 md:p-8 animate-pulse">
    <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
    <div className="border rounded-md">
      <div className="flex bg-muted/50 p-4 border-b">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-5 w-full mx-2 bg-gray-200 rounded" />
        ))}
      </div>
      {Array.from({ length: 10 }).map((_, r) => (
        <div key={r} className="flex items-center p-4 border-b">
          {Array.from({ length: 7 }).map((_, c) => (
            <div key={c} className="h-6 w-full mx-2 bg-gray-200 rounded" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

const LazyPurchasePage = () => {
  return (
    <Suspense fallback={<InlineTableSkeleton />}> 
        <PurchasePageContent />
    </Suspense>
  )
}

export default LazyPurchasePage;
