import React from 'react';
import { Route } from 'react-router-dom';
import RouteWrapper from './RouteWrapper';

const Settings = React.lazy(() =>
  import(/* webpackChunkName: "misc" */ '@/pages/Settings')
);

const settingsRoutes = (
  <Route
    path="pengaturan"
    element={
      <RouteWrapper title="Memuat Pengaturan">
        <Settings />
      </RouteWrapper>
    }
  />
);

export default settingsRoutes;
