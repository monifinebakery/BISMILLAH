// src/routes/network-optimization.tsx
import React from 'react';
import { Route } from 'react-router-dom';
import { OptimizedRouteWrapper } from '@/components/routing/OptimizedRouteWrapper';
import NetworkOptimizationDemo from '@/components/NetworkOptimizationDemo';

const networkOptimizationRoutes = (
  <Route 
    key="network-optimization" 
    path="/network-optimization" 
    element={
      <OptimizedRouteWrapper 
        routeName="network-optimization" 
        priority="low"
        preloadOnHover={false}
      >
        <NetworkOptimizationDemo />
      </OptimizedRouteWrapper>
    } 
  />
);

export default networkOptimizationRoutes;