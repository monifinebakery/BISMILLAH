import React from 'react';
import { Route } from 'react-router-dom';
import { OptimizedRouteWrapper } from '@/components/routing/OptimizedRouteWrapper';

const DeviceManagementPage = React.lazy(() =>
  import(/* webpackChunkName: "misc" */ '@/components/devices/DeviceManagementPage')
);

const deviceRoutes = (
  <Route
    path="devices"
    element={
      <OptimizedRouteWrapper 
        routeName="devices" 
        priority="low"
        preloadOnHover={false}
      >
        <DeviceManagementPage />
      </OptimizedRouteWrapper>
    }
  />
);

export default deviceRoutes;
