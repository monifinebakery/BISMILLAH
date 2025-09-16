import React from 'react';
import { Route } from 'react-router-dom';
import { OptimizedRouteWrapper } from '@/components/routing/OptimizedRouteWrapper';

const RecipesPage = React.lazy(() =>
  import(/* webpackChunkName: "recipes" */ '@/pages/Recipes')
);

const RecipeMigrationPage = React.lazy(() =>
  import(/* webpackChunkName: "recipe-migration" */ '@/components/recipe/components/RecipeMigrationPage')
);

const recipeRoutes = (
  <>
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
    <Route
      path="resep/migration"
      element={
        <OptimizedRouteWrapper 
          routeName="recipe-migration" 
          priority="low"
          preloadOnHover={false}
        >
          <RecipeMigrationPage />
        </OptimizedRouteWrapper>
      }
    />
  </>
);

export default recipeRoutes;
