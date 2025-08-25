import React from 'react';
import { Route } from 'react-router-dom';
import RouteWrapper from './RouteWrapper';

const InvoicePage = React.lazy(() =>
  import(/* webpackChunkName: "misc" */ '@/components/invoice/InvoicePage')
);

const invoiceRoutes = (
  <Route
    path="invoice"
    element={
      <RouteWrapper title="Memuat Invoice">
        <InvoicePage />
      </RouteWrapper>
    }
  />
);

export default invoiceRoutes;
