import React from 'react';
import { Route } from 'react-router-dom';
import { OptimizedRouteWrapper } from '@/components/routing/OptimizedRouteWrapper';

const FinancialReportPage = React.lazy(() =>
  import(/* webpackChunkName: "financial" */ '@/components/financial/FinancialReportPage')
);

const FinancialManagementPage = React.lazy(() =>
  import(/* webpackChunkName: "financial" */ '@/components/financial/FinancialManagementPage')
);

const FinancialCategoryPage = React.lazy(() =>
  import(/* webpackChunkName: "financial" */ '@/components/financial/FinancialCategoryPage')
);

const AddTransactionPage = React.lazy(() =>
  import(/* webpackChunkName: "financial" */ '@/components/financial/AddTransactionPage')
);

const financialRoutes = (
  <>
    <Route
      path="laporan"
      element={
        <OptimizedRouteWrapper 
          routeName="financial" 
          priority="low"
          preloadOnHover={false}
        >
          <FinancialReportPage />
        </OptimizedRouteWrapper>
      }
    />
    <Route
      path="keuangan"
      element={
        <OptimizedRouteWrapper 
          routeName="financial-management" 
          priority="medium"
          preloadOnHover={true}
        >
          <FinancialManagementPage />
        </OptimizedRouteWrapper>
      }
    />
    <Route
      path="keuangan/kategori"
      element={
        <OptimizedRouteWrapper 
          routeName="financial-categories" 
          priority="low"
          preloadOnHover={false}
        >
          <FinancialCategoryPage />
        </OptimizedRouteWrapper>
      }
    />
    <Route
      path="keuangan/tambah"
      element={
        <OptimizedRouteWrapper 
          routeName="financial-add-transaction" 
          priority="low"
          preloadOnHover={false}
        >
          <AddTransactionPage />
        </OptimizedRouteWrapper>
      }
    />
  </>
);

export default financialRoutes;
