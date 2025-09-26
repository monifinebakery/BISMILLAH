import React from 'react';
import { Route } from 'react-router-dom';
import { OptimizedRouteWrapper } from '@/components/routing/OptimizedRouteWrapper';
import { SimpleSettings } from '@/pages/simple-settings';

const Settings = React.lazy(() =>
  import(/* webpackChunkName: "misc" */ '@/pages/Settings')
);

const settingsRoutes = (
  <>
    <Route
      path="simple-settings"
      element={<SimpleSettings />}
    />
    <Route
      path="pengaturan"
      element={
        <OptimizedRouteWrapper 
          routeName="settings" 
          priority="low"
          preloadOnHover={false}
        >
          <Settings />
        </OptimizedRouteWrapper>
      }
    />
  </>
);

export default settingsRoutes;
