import React from 'react';
import { Route } from 'react-router-dom';
import RouteWrapper from './RouteWrapper';

const OperationalCostPage = React.lazy(() =>
  import(/* webpackChunkName: "operational-costs" */ '@/components/operational-costs/OperationalCostPage')
);

const operationalCostRoutes = (
  <Route
    path="biaya-operasional"
    element={
      <RouteWrapper title="Memuat Biaya Operasional">
        <OperationalCostPage />
      </RouteWrapper>
    }
  />
);

export default operationalCostRoutes;
