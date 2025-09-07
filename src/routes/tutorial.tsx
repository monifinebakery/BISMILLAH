// src/routes/tutorial.tsx
import React, { lazy } from 'react';
import { Route } from 'react-router-dom';
import { OptimizedRouteWrapper } from '@/components/routing/OptimizedRouteWrapper';

// Lazy load Tutorial component untuk performance
const Tutorial = lazy(() => import('@/components/tutorials/Tutorial'));

const tutorialRoutes = (
  <Route 
    path="/tutorial" 
    element={
      <OptimizedRouteWrapper 
        routeName="tutorial" 
        priority="low"
        preloadOnHover={false}
      >
        <Tutorial />
      </OptimizedRouteWrapper>
    } 
  />
);

export default tutorialRoutes;
