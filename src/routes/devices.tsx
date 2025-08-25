import React from 'react';
import { Route } from 'react-router-dom';
import RouteWrapper from './RouteWrapper';

const DeviceManagementPage = React.lazy(() =>
  import(/* webpackChunkName: "misc" */ '@/components/devices/DeviceManagementPage')
);

const deviceRoutes = (
  <Route
    path="devices"
    element={
      <RouteWrapper title="Memuat Manajemen Perangkat">
        <DeviceManagementPage />
      </RouteWrapper>
    }
  />
);

export default deviceRoutes;
