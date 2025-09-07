// src/routes/preloading.tsx
import React from 'react';
import { Route } from 'react-router-dom';
import { OptimizedRouteWrapper } from '@/components/routing/OptimizedRouteWrapper';
import PreloadingDemo from '@/components/PreloadingDemo';

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
        <PreloadingDemo />
      </OptimizedRouteWrapper>
    } 
  />
);

export default preloadingRoutes;