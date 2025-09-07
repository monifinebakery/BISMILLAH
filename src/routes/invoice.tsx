import React from 'react';
import { Route } from 'react-router-dom';
import { OptimizedRouteWrapper } from '@/components/routing/OptimizedRouteWrapper';

const InvoicePage = React.lazy(() =>
  import(/* webpackChunkName: "misc" */ '@/components/invoice/InvoicePage')
);

const invoiceRoutes = (
  <Route
    path="invoice"
    element={
      <OptimizedRouteWrapper 
        routeName="invoice" 
        priority="medium"
        preloadOnHover={true}
      >
        <InvoicePage />
      </OptimizedRouteWrapper>
    }
  />
);

export default invoiceRoutes;
