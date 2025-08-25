import React from 'react';
import { Route } from 'react-router-dom';
import RouteWrapper from './RouteWrapper';

const OrdersPage = React.lazy(() =>
  import(/* webpackChunkName: "orders" */ '@/components/orders/components/OrdersPage')
);

const ordersRoutes = (
  <Route
    path="pesanan"
    element={
      <RouteWrapper title="Memuat Pesanan">
        <OrdersPage />
      </RouteWrapper>
    }
  />
);

export default ordersRoutes;
