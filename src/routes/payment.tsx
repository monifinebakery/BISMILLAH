import React from 'react';
import { Route } from 'react-router-dom';
import RouteWrapper from './RouteWrapper';

const PaymentSuccessPage = React.lazy(() =>
  import(/* webpackChunkName: "misc" */ '@/pages/PaymentSuccessPage')
);

const paymentRoutes = (
  <Route
    path="payment-success"
    element={
      <RouteWrapper title="Memuat Konfirmasi Pembayaran">
        <PaymentSuccessPage />
      </RouteWrapper>
    }
  />
);

export default paymentRoutes;
