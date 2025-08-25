import React from 'react';
import { Route } from 'react-router-dom';
import RouteWrapper from './RouteWrapper';

const NotFound = React.lazy(() =>
  import(/* webpackChunkName: "misc" */ '@/pages/NotFound')
);

const notFoundRoutes = (
  <Route
    path="*"
    element={
      <RouteWrapper title="Halaman Tidak Ditemukan">
        <NotFound />
      </RouteWrapper>
    }
  />
);

export default notFoundRoutes;
