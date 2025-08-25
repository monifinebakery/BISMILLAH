import React from 'react';
import { Route } from 'react-router-dom';
import RouteWrapper from './RouteWrapper';

const Dashboard = React.lazy(() =>
  import(/* webpackChunkName: "dashboard" */ '@/pages/Dashboard')
);

const dashboardRoutes = (
  <Route
    index
    element={
      <RouteWrapper title="Memuat Dashboard">
        <Dashboard />
      </RouteWrapper>
    }
  />
);

export default dashboardRoutes;
