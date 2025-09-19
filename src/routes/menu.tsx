import React from 'react';
import { Route } from 'react-router-dom';
import { OptimizedRouteWrapper } from '@/components/routing/OptimizedRouteWrapper';

const MenuPage = React.lazy(() =>
  import(/* webpackChunkName: "misc" */ '@/pages/MenuPage')
);

const ExportPage = React.lazy(() =>
  import(/* webpackChunkName: "export" */ '@/pages/ExportPage')
);

const menuRoutes = (
  <>
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
    <Route
      path="export"
      element={
        <OptimizedRouteWrapper 
          routeName="export" 
          priority="low"
          preloadOnHover={false}
        >
          <ExportPage />
        </OptimizedRouteWrapper>
      }
    />
  </>
);

export default menuRoutes;
