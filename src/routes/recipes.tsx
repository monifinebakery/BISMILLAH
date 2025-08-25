import React from 'react';
import { Route } from 'react-router-dom';
import RouteWrapper from './RouteWrapper';

const RecipesPage = React.lazy(() =>
  import(/* webpackChunkName: "recipes" */ '@/pages/Recipes')
);

const recipeRoutes = (
  <Route
    path="resep"
    element={
      <RouteWrapper title="Memuat Resep">
        <RecipesPage />
      </RouteWrapper>
    }
  />
);

export default recipeRoutes;
