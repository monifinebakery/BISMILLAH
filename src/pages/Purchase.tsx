import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import React, { Suspense } from 'react';

const PurchasePageContent = React.lazy(() => import('@/components/purchase/PurchasePage'));

const LazyPurchasePage = () => {
  return (
    <Suspense fallback={<TableSkeleton columnCount={7} rowCount={10}/>}>
        <PurchasePageContent />
    </Suspense>
  )
}

export default LazyPurchasePage;