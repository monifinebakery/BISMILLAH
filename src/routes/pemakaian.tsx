import React from 'react';
import { Route } from 'react-router-dom';
import { OptimizedRouteWrapper } from '@/components/routing/OptimizedRouteWrapper';

const PemakaianBahanPage = React.lazy(() =>
  import(/* webpackChunkName: "pemakaian-bahan" */ '@/components/warehouse/PemakaianBahanPage').then(m => ({ default: m.default }))
);

const pemakaianRoutes = (
  <Route
    path="pemakaian"
    element={
      <OptimizedRouteWrapper routeName="pemakaian" priority="medium" preloadOnHover={false}>
        <PemakaianBahanPage />
      </OptimizedRouteWrapper>
    }
  />
);

export default pemakaianRoutes;

