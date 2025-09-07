import React from 'react';
import { Route } from 'react-router-dom';
import { OptimizedRouteWrapper } from '@/components/routing/OptimizedRouteWrapper';

const PaymentSuccessPage = React.lazy(() =>
  import(/* webpackChunkName: "misc" */ '@/pages/PaymentSuccessPage')
);

const paymentRoutes = (
  <Route
    path="payment-success"
    element={
      <OptimizedRouteWrapper 
        routeName="payment" 
        priority="low"
        preloadOnHover={false}
      >
        <PaymentSuccessPage />
      </OptimizedRouteWrapper>
    }
  />
);

export default paymentRoutes;
