import React from 'react';
import { Route } from 'react-router-dom';
import { OptimizedRouteWrapper } from '@/components/routing/OptimizedRouteWrapper';

const OperationalCostPage = React.lazy(() =>
  import(/* webpackChunkName: "operational-costs" */ '@/components/operational-costs/OperationalCostPage')
);

const operationalCostRoutes = (
  <Route
    path="biaya-operasional"
    element={
      <OptimizedRouteWrapper 
        routeName="operational-costs" 
        priority="low"
        preloadOnHover={false}
      >
        <OperationalCostPage />
      </OptimizedRouteWrapper>
    }
  />
);

export default operationalCostRoutes;
