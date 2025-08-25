import React from 'react';
import { Route } from 'react-router-dom';
import RouteWrapper from './RouteWrapper';

const FinancialReportPage = React.lazy(() =>
  import(/* webpackChunkName: "financial" */ '@/components/financial/FinancialReportPage')
);

const financialRoutes = (
  <Route
    path="laporan"
    element={
      <RouteWrapper title="Memuat Laporan Keuangan">
        <FinancialReportPage />
      </RouteWrapper>
    }
  />
);

export default financialRoutes;
