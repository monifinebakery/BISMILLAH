// src/routes/offline.tsx - Offline Features Routes
import React from 'react';
import { Route } from 'react-router-dom';
import { RouteWrapper } from './RouteWrapper';

const OfflineFeaturesPage = React.lazy(() => import('@/pages/OfflineFeatures'));

const offlineRoutes = (
  <>
    <Route
      path="/offline"
      element={
        <RouteWrapper>
          <OfflineFeaturesPage />
        </RouteWrapper>
      }
    />
  </>
);

export default offlineRoutes;
