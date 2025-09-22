import React from 'react';
import { Route } from 'react-router-dom';
import { OptimizedRouteWrapper } from '@/components/routing/OptimizedRouteWrapper';

const AssetPage = React.lazy(() =>
  import(/* webpackChunkName: "assets" */ '@/components/assets/AssetPage').then(module => ({
    default: module.AssetPage,
  }))
);

const AssetCreatePage = React.lazy(() =>
  import(/* webpackChunkName: "assets-create" */ '@/components/assets/AssetCreatePage').then(module => ({
    default: module.default,
  }))
);

const AssetEditPage = React.lazy(() =>
  import(/* webpackChunkName: "assets-edit" */ '@/components/assets/AssetEditPage').then(module => ({
    default: module.default,
  }))
);

// ✅ SIMPLIFIED: Use generic RouteErrorFallback instead of custom asset fallback
// The new RouteErrorFallback component provides comprehensive error recovery for all routes

const assetRoutes = (
  <>
    <Route
      path="aset"
      element={
        <OptimizedRouteWrapper 
          routeName="assets" 
          priority="low"
          preloadOnHover={false}
        >
          <AssetPage />
        </OptimizedRouteWrapper>
      }
    />
    <Route
      path="aset/tambah"
      element={
        <OptimizedRouteWrapper 
          routeName="assets-create" 
          priority="low"
          preloadOnHover={false}
        >
          <AssetCreatePage />
        </OptimizedRouteWrapper>
      }
    />
    <Route
      path="aset/edit/:id"
      element={
        <OptimizedRouteWrapper 
          routeName="assets-edit" 
          priority="low"
          preloadOnHover={false}
        >
          <AssetEditPage />
        </OptimizedRouteWrapper>
      }
    />
  </>
);

export default assetRoutes;
