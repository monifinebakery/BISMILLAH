import React from 'react';
import { Route } from 'react-router-dom';
import { OptimizedRouteWrapper } from '@/components/routing/OptimizedRouteWrapper';

const MenuPage = React.lazy(() =>
  import(/* webpackChunkName: "misc" */ '@/pages/MenuPage')
);

const menuRoutes = (
  <Route
    path="menu"
    element={
      <OptimizedRouteWrapper 
        routeName="menu" 
        priority="low"
        preloadOnHover={false}
      >
        <MenuPage />
      </OptimizedRouteWrapper>
    }
  />
);

export default menuRoutes;
