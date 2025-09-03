import React from 'react';
import { Route } from 'react-router-dom';
import RouteWrapper from './RouteWrapper';

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

const ordersRoutes = (
  <>
    {/* Orders List Page */}
    <Route
      path="pesanan"
      element={
        <RouteWrapper title="Memuat Pesanan">
          <OrdersPage />
        </RouteWrapper>
      }
    />
    
    {/* Add New Order Page */}
    <Route
      path="pesanan/add"
      element={
        <RouteWrapper title="Tambah Pesanan">
          <OrdersAddEditPage />
        </RouteWrapper>
      }
    />
    
    {/* Edit Order Page */}
    <Route
      path="pesanan/edit/:id"
      element={
        <RouteWrapper title="Edit Pesanan">
          <OrdersAddEditPage />
        </RouteWrapper>
      }
    />
    
    {/* View Order Detail Page */}
    <Route
      path="pesanan/view/:id"
      element={
        <RouteWrapper title="Detail Pesanan">
          <OrdersViewPage />
        </RouteWrapper>
      }
    />
  </>
);

export default ordersRoutes;
