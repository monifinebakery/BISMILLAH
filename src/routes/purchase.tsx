import React from 'react';
import { Route, Routes } from 'react-router-dom';
import RouteWrapper from './RouteWrapper';

const PurchaseManagement = React.lazy(() =>
  import(/* webpackChunkName: "purchase" */ '@/components/purchase/PurchasePage')
);

const PurchaseAddEditPage = React.lazy(() =>
  import(/* webpackChunkName: "purchase-add-edit" */ '@/components/purchase/PurchaseAddEditPage')
);

const purchaseRoutes = (
  <Route path="purchase">
    <Route 
      index 
      element={
        <RouteWrapper title="Memuat Pembelian">
          <PurchaseManagement />
        </RouteWrapper>
      } 
    />
    <Route 
      path="add" 
      element={
        <RouteWrapper title="Tambah Pembelian">
          <PurchaseAddEditPage />
        </RouteWrapper>
      } 
    />
    <Route 
      path="edit/:id" 
      element={
        <RouteWrapper title="Edit Pembelian">
          <PurchaseAddEditPage />
        </RouteWrapper>
      } 
    />
  </Route>
);

export default purchaseRoutes;
