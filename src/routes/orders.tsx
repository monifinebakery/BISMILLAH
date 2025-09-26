import React from 'react';
import { Route } from 'react-router-dom';
import { OptimizedRouteWrapper } from '@/components/routing/OptimizedRouteWrapper';
import { SimpleOrders } from '@/pages/simple-orders';

// Lazy load components
const OrdersPage = React.lazy(() =>
  import(/* webpackChunkName: "orders-list" */ '@/components/orders/components/OrdersPage')
);

const OrdersAddEditPage = React.lazy(() =>
  import(/* webpackChunkName: "orders-form" */ '@/components/orders/components/OrdersAddEditPage')
);

const OrdersViewPage = React.lazy(() =>
  import(/* webpackChunkName: "orders-view" */ '@/components/orders/components/OrdersViewPage')
);

const FollowUpTemplateManagerPage = React.lazy(() =>
  import(/* webpackChunkName: "orders-templates" */ '@/components/orders/pages/FollowUpTemplateManagerPage')
);

const ordersRoutes = (
  <>
    {/* Simple Orders Page */}
    <Route
      path="simple-orders"
      element={<SimpleOrders />}
    />
    
    {/* Orders List Page */}
    <Route
      path="pesanan"
      element={
        <OptimizedRouteWrapper 
          routeName="orders" 
          priority="high"
          preloadOnHover={true}
        >
          <OrdersPage />
        </OptimizedRouteWrapper>
      }
    />
    
    {/* Add New Order Page */}
    <Route
      path="pesanan/add"
      element={
        <OptimizedRouteWrapper 
          routeName="orders-add" 
          priority="high"
          preloadOnHover={true}
        >
          <OrdersAddEditPage />
        </OptimizedRouteWrapper>
      }
    />
    
    {/* Edit Order Page */}
    <Route
      path="pesanan/edit/:id"
      element={
        <OptimizedRouteWrapper 
          routeName="orders-edit" 
          priority="high"
          preloadOnHover={true}
        >
          <OrdersAddEditPage />
        </OptimizedRouteWrapper>
      }
    />
    
    {/* View Order Detail Page */}
    <Route
      path="pesanan/view/:id"
      element={
        <OptimizedRouteWrapper 
          routeName="orders-view" 
          priority="high"
          preloadOnHover={true}
        >
          <OrdersViewPage />
        </OptimizedRouteWrapper>
      }
    />
    
    {/* Template Manager Page */}
    <Route
      path="pesanan/template"
      element={
        <OptimizedRouteWrapper 
          routeName="orders-templates" 
          priority="medium"
          preloadOnHover={true}
        >
          <FollowUpTemplateManagerPage />
        </OptimizedRouteWrapper>
      }
    />
  </>
);

export default ordersRoutes;
