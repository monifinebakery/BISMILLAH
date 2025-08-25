import React from 'react';
import { Route } from 'react-router-dom';
import RouteWrapper from './RouteWrapper';

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
        <RouteWrapper title="Memuat Kalkulator Promo">
          <PromoCalculatorPage />
        </RouteWrapper>
      }
    />
    <Route
      path="promo/list"
      element={
        <RouteWrapper title="Memuat Daftar Promo">
          <PromoList />
        </RouteWrapper>
      }
    />
    <Route
      path="promo/create"
      element={
        <RouteWrapper title="Memuat Form Promo">
          <PromoFullCalculator />
        </RouteWrapper>
      }
    />
    <Route
      path="promo/edit/:id"
      element={
        <RouteWrapper title="Memuat Editor Promo">
          <PromoFullCalculator />
        </RouteWrapper>
      }
    />
  </>
);

export default promoRoutes;
