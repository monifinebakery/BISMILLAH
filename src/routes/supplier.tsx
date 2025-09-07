import React from 'react';
import { Route } from 'react-router-dom';
import { OptimizedRouteWrapper } from '@/components/routing/OptimizedRouteWrapper';

const SupplierManagementPage = React.lazy(() =>
  import(/* webpackChunkName: "suppliers" */ '@/components/supplier').then(module => ({
    default: module.SupplierManagement,
  }))
);

const supplierRoutes = (
  <Route
    path="supplier"
    element={
      <OptimizedRouteWrapper 
        routeName="supplier" 
        priority="medium"
        preloadOnHover={true}
      >
        <SupplierManagementPage />
      </OptimizedRouteWrapper>
    }
  />
);

export default supplierRoutes;
