import React from 'react';
import { Route } from 'react-router-dom';
import { OptimizedRouteWrapper } from '@/components/routing/OptimizedRouteWrapper';
import RouteWrapper from './RouteWrapper';

const Dashboard = React.lazy(() =>
  import(/* webpackChunkName: "dashboard" */ '@/pages/Dashboard')
);

const dashboardRoutes = (
  <Route
    index
    element={
      <OptimizedRouteWrapper 
        routeName="dashboard" 
        priority="high"
        preloadOnHover={true}
      >
        <RouteWrapper title="Memuat Dashboard">
          <Dashboard />
        </RouteWrapper>
      </OptimizedRouteWrapper>
    }
  />
);

export default dashboardRoutes;
