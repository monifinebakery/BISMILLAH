import React from 'react';
import { Route } from 'react-router-dom';
import RouteWrapper from './RouteWrapper';

const SupplierManagementPage = React.lazy(() =>
  import(/* webpackChunkName: "suppliers" */ '@/components/supplier').then(module => ({
    default: module.SupplierManagement,
  }))
);

const supplierRoutes = (
  <Route
    path="supplier"
    element={
      <RouteWrapper title="Memuat Supplier">
        <SupplierManagementPage />
      </RouteWrapper>
    }
  />
);

export default supplierRoutes;
