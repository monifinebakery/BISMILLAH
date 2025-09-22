import React from 'react';
import { Route } from 'react-router-dom';
import { OptimizedRouteWrapper } from '@/components/routing/OptimizedRouteWrapper';
import { logger } from '@/utils/logger';

const WarehousePage = React.lazy(() =>
  import(/* webpackChunkName: "warehouse" */ '@/components/warehouse/WarehousePageRefactored')
);

const WarehouseAddEditPage = React.lazy(() =>
  import(/* webpackChunkName: "warehouse-add-edit" */ '@/components/warehouse/components/WarehouseAddEditPage')
);

const EditBahanBaku = React.lazy(() =>
  import(/* webpackChunkName: "warehouse-edit-fullpage" */ '@/components/warehouse/pages/EditBahanBaku')
    .then(mod => ({ default: mod.EditBahanBaku }))
    .catch((err) => {
      logger.error('Failed to load EditBahanBaku page:', err);
      return { default: () => <div className="p-4 text-center text-red-500">Gagal memuat halaman edit gudang</div> };
    })
);

// ✅ SIMPLIFIED: Use generic RouteErrorFallback instead of custom warehouse fallback
// The new RouteErrorFallback component provides comprehensive error recovery for all routes

const warehouseRoutes = (
  <>
    <Route
      path="warehouse"
      element={
        <OptimizedRouteWrapper 
          routeName="warehouse" 
          priority="high"
          preloadOnHover={true}
        >
          <WarehousePage />
        </OptimizedRouteWrapper>
      }
    />
    <Route
      path="warehouse/edit/:id"
      element={
        <OptimizedRouteWrapper 
          routeName="warehouse-edit-fullpage" 
          priority="medium"
          preloadOnHover={true}
        >
          <EditBahanBaku />
        </OptimizedRouteWrapper>
      }
    />
    <Route
      path="warehouse/new"
      element={
        <OptimizedRouteWrapper 
          routeName="warehouse-add-fullpage" 
          priority="medium"
          preloadOnHover={true}
        >
          <EditBahanBaku />
        </OptimizedRouteWrapper>
      }
    />
    
    {/* Legacy routes */}
    <Route
      path="gudang"
      element={
        <OptimizedRouteWrapper 
          routeName="warehouse-legacy" 
          priority="high"
          preloadOnHover={true}
        >
          <WarehousePage />
        </OptimizedRouteWrapper>
      }
    />
    <Route
      path="gudang/add"
      element={
        <OptimizedRouteWrapper 
          routeName="warehouse-add" 
          priority="medium"
          preloadOnHover={true}
        >
          <WarehouseAddEditPage />
        </OptimizedRouteWrapper>
      }
    />
    <Route
      path="gudang/edit/:id"
      element={
        <OptimizedRouteWrapper 
          routeName="warehouse-edit" 
          priority="medium"
          preloadOnHover={true}
        >
          <WarehouseAddEditPage />
        </OptimizedRouteWrapper>
      }
    />
  </>
);

export default warehouseRoutes;
