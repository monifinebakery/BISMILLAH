import React from 'react';
import { Route } from 'react-router-dom';
import { OptimizedRouteWrapper } from '@/components/routing/OptimizedRouteWrapper';

const FinancialReportPage = React.lazy(() =>
  import(/* webpackChunkName: "financial" */ '@/components/financial/FinancialReportPage')
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
      path="laporan-keuangan/kategori"
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
      path="laporan-keuangan/tambah"
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
    <Route
      path="laporan-keuangan/edit/:id"
      element={
        <OptimizedRouteWrapper 
          routeName="financial-edit-transaction" 
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
