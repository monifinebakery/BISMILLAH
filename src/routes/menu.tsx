import React from 'react';
import { Route } from 'react-router-dom';
import RouteWrapper from './RouteWrapper';

const MenuPage = React.lazy(() =>
  import(/* webpackChunkName: "misc" */ '@/pages/MenuPage')
);

const menuRoutes = (
  <Route
    path="menu"
    element={
      <RouteWrapper title="Memuat Menu">
        <MenuPage />
      </RouteWrapper>
    }
  />
);

export default menuRoutes;
