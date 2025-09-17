import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import React, { Suspense } from 'react';

const OrdersPageContent = React.lazy(() => import('@/components/orders/components/OrdersPage'));

const LazyOrdersPage = () => {
  return (
    <Suspense fallback={<TableSkeleton columnCount={8} rowCount={12}/>}>
        <OrdersPageContent />
    </Suspense>
  )
}

export default LazyOrdersPage;