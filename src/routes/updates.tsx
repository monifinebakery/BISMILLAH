import React from 'react';
import { Route } from 'react-router-dom';
import RouteWrapper from './RouteWrapper';

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
        <RouteWrapper title="Memuat Pembaruan">
          <UpdatesPage />
        </RouteWrapper>
      }
    />
    <Route
      path="admin/updates"
      element={
        <RouteWrapper title="Memuat Admin Updates">
          <AdminUpdatesPage />
        </RouteWrapper>
      }
    />
  </>
);

export default updateRoutes;
