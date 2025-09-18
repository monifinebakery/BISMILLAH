import React, { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const PurchasePageContent = React.lazy(() => import('@/components/purchase/PurchasePage'));

const RouteFallback = () => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <LoadingSpinner size="md" />
  </div>
);

const LazyPurchasePage = () => {
  return (
    <Suspense fallback={<RouteFallback />}> 
        <PurchasePageContent />
    </Suspense>
  )
}

export default LazyPurchasePage;
