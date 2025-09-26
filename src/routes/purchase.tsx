import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { OptimizedRouteWrapper } from '@/components/routing/OptimizedRouteWrapper';
import { SimplePurchases } from '@/pages/simple-purchases';

const PurchaseManagement = React.lazy(() =>
  import(/* webpackChunkName: "purchase" */ '@/components/purchase/PurchasePage')
);

const PurchaseAddEditPage = React.lazy(() =>
  import(/* webpackChunkName: "purchase-add-edit" */ '@/components/purchase/PurchaseAddEditPage')
);

const purchaseRoutes = (
  <>
    {/* Simple Purchases Page */}
    <Route
      path="simple-purchases"
      element={<SimplePurchases />}
    />
    
    {/* Original route for backward compatibility */}
    <Route
      path="pembelian"
      element={
        <OptimizedRouteWrapper 
          routeName="purchase" 
          priority="medium"
          preloadOnHover={true}
        >
          <PurchaseManagement />
        </OptimizedRouteWrapper>
      }
    />
    
    {/* New flat routes structure */}
    <Route 
      path="purchase" 
      element={
        <OptimizedRouteWrapper 
          routeName="purchase" 
          priority="medium"
          preloadOnHover={true}
        >
          <PurchaseManagement />
        </OptimizedRouteWrapper>
      } 
    />
    <Route 
      path="purchase/add" 
      element={
        <OptimizedRouteWrapper 
          routeName="purchase-add" 
          priority="medium"
          preloadOnHover={true}
        >
          <PurchaseAddEditPage />
        </OptimizedRouteWrapper>
      } 
    />
    <Route 
      path="purchase/edit/:id" 
      element={
        <OptimizedRouteWrapper 
          routeName="purchase-edit" 
          priority="medium"
          preloadOnHover={true}
        >
          <PurchaseAddEditPage />
        </OptimizedRouteWrapper>
      } 
    />
  </>
);

export default purchaseRoutes;
