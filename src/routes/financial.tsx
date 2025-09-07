import React from 'react';
import { Route } from 'react-router-dom';
import { OptimizedRouteWrapper } from '@/components/routing/OptimizedRouteWrapper';

const FinancialReportPage = React.lazy(() =>
  import(/* webpackChunkName: "financial" */ '@/components/financial/FinancialReportPage')
);

const financialRoutes = (
  <Route
    path="laporan"
    element={
      <OptimizedRouteWrapper 
        routeName="financial" 
        priority="low"
        preloadOnHover={false}
      >
        <FinancialReportPage />
      </OptimizedRouteWrapper>
    }
  />
);

export default financialRoutes;
