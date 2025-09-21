import React from 'react';
import { Route } from 'react-router-dom';
import { OptimizedRouteWrapper } from '@/components/routing/OptimizedRouteWrapper';

const OperationalCostPage = React.lazy(() =>
  import(/* webpackChunkName: "operational-costs" */ '@/components/operational-costs/OperationalCostPage')
);

const OperationalCostCreatePage = React.lazy(() =>
  import(/* webpackChunkName: "operational-costs-create" */ '@/components/operational-costs/OperationalCostCreatePage')
);

const operationalCostRoutes = (
  <>
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

    <Route
      path="biaya-operasional/tambah"
      element={
        <OptimizedRouteWrapper
          routeName="operational-costs-add"
          priority="medium"
          preloadOnHover={true}
        >
          <OperationalCostCreatePage />
        </OptimizedRouteWrapper>
      }
    />
  </>
);

export default operationalCostRoutes;
