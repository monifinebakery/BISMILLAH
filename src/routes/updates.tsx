import React from 'react';
import { Route } from 'react-router-dom';
import { OptimizedRouteWrapper } from '@/components/routing/OptimizedRouteWrapper';

const UpdatesPage = React.lazy(() =>
  import(/* webpackChunkName: "updates" */ '@/components/update').then(module => ({
    default: module.UpdatesPage,
  }))
);

const AdminUpdatesPage = React.lazy(() =>
  import(/* webpackChunkName: "admin-updates" */ '@/components/update').then(module => ({
    default: module.AdminUpdatesPage,
  }))
);

const updateRoutes = (
  <>
    <Route
      path="updates"
      element={
        <OptimizedRouteWrapper 
          routeName="updates" 
          priority="low"
          preloadOnHover={false}
        >
          <UpdatesPage />
        </OptimizedRouteWrapper>
      }
    />
    <Route
      path="admin/updates"
      element={
        <OptimizedRouteWrapper 
          routeName="admin-updates" 
          priority="low"
          preloadOnHover={false}
        >
          <AdminUpdatesPage />
        </OptimizedRouteWrapper>
      }
    />
  </>
);

export default updateRoutes;
