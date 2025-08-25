import React from 'react';
import { Route } from 'react-router-dom';
import RouteWrapper from './RouteWrapper';

const PurchaseManagement = React.lazy(() =>
  import(/* webpackChunkName: "purchase" */ '@/components/purchase/PurchasePage')
);

const purchaseRoutes = (
  <Route
    path="pembelian"
    element={
      <RouteWrapper title="Memuat Pembelian">
        <PurchaseManagement />
      </RouteWrapper>
    }
  />
);

export default purchaseRoutes;
