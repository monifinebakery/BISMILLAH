import React from 'react';
import { Route } from 'react-router-dom';
import { OptimizedRouteWrapper } from '@/components/routing/OptimizedRouteWrapper';

const NotFound = React.lazy(() =>
  import(/* webpackChunkName: "misc" */ '@/pages/NotFound')
);

const notFoundRoutes = (
  <Route
    path="*"
    element={
      <OptimizedRouteWrapper 
        routeName="not-found" 
        priority="low"
        preloadOnHover={false}
      >
        <NotFound />
      </OptimizedRouteWrapper>
    }
  />
);

export default notFoundRoutes;
