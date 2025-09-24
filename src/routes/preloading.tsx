// src/routes/preloading.tsx
import React from 'react';
import { Route } from 'react-router-dom';
import { OptimizedRouteWrapper } from '@/components/routing/OptimizedRouteWrapper';

const preloadingRoutes = (
  <Route 
    key="preloading" 
    path="/preloading" 
    element={
      <OptimizedRouteWrapper 
        routeName="preloading" 
        priority="low"
        preloadOnHover={false}
      >
      </OptimizedRouteWrapper>
    } 
  />
);

export default preloadingRoutes;