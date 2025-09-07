import React from 'react';
import { Route } from 'react-router-dom';
import { OptimizedRouteWrapper } from '@/components/routing/OptimizedRouteWrapper';

const PromoCalculatorPage = React.lazy(() =>
  import(/* webpackChunkName: "promo" */ '@/pages/PromoCalculatorPage')
);

const PromoList = React.lazy(() =>
  import(/* webpackChunkName: "promo-list" */ '@/components/promoCalculator/promoList/PromoList')
);

const PromoFullCalculator = React.lazy(() =>
  import(/* webpackChunkName: "promo-full" */ '@/components/promoCalculator/PromoFullCalculator').catch(() => ({
    default: () => <div>PromoFullCalculator not found</div>,
  }))
);

const promoRoutes = (
  <>
    <Route
      path="promo"
      element={
        <OptimizedRouteWrapper 
          routeName="promo" 
          priority="low"
          preloadOnHover={false}
        >
          <PromoCalculatorPage />
        </OptimizedRouteWrapper>
      }
    />
    <Route
      path="promo/list"
      element={
        <OptimizedRouteWrapper 
          routeName="promo-list" 
          priority="low"
          preloadOnHover={false}
        >
          <PromoList />
        </OptimizedRouteWrapper>
      }
    />
    <Route
      path="promo/create"
      element={
        <OptimizedRouteWrapper 
          routeName="promo-create" 
          priority="low"
          preloadOnHover={false}
        >
          <PromoFullCalculator />
        </OptimizedRouteWrapper>
      }
    />
    <Route
      path="promo/edit/:id"
      element={
        <OptimizedRouteWrapper 
          routeName="promo-edit" 
          priority="low"
          preloadOnHover={false}
        >
          <PromoFullCalculator />
        </OptimizedRouteWrapper>
      }
    />
  </>
);

export default promoRoutes;
