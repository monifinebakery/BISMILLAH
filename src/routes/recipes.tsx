import React from 'react';
import { Route } from 'react-router-dom';
import { OptimizedRouteWrapper } from '@/components/routing/OptimizedRouteWrapper';

const RecipesPage = React.lazy(() =>
  import(/* webpackChunkName: "recipes" */ '@/pages/Recipes')
);

const recipeRoutes = (
  <Route
    path="resep"
    element={
      <OptimizedRouteWrapper 
        routeName="recipes" 
        priority="medium"
        preloadOnHover={true}
      >
        <RecipesPage />
      </OptimizedRouteWrapper>
    }
  />
);

export default recipeRoutes;
