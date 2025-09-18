import React from 'react';
import { Route } from 'react-router-dom';
import { OptimizedRouteWrapper } from '@/components/routing/OptimizedRouteWrapper';

const RecipesPage = React.lazy(() =>
  import(/* webpackChunkName: "recipes" */ '@/pages/Recipes')
);

const CategoryManagementPage = React.lazy(() =>
  import(/* webpackChunkName: "recipe-categories" */ '@/components/recipe/pages/CategoryManagement')
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
      path="resep/kategori"
      element={
        <OptimizedRouteWrapper 
          routeName="recipe-categories" 
          priority="low"
          preloadOnHover={true}
        >
          <CategoryManagementPage />
        </OptimizedRouteWrapper>
      }
    />
  </>
);

export default recipeRoutes;
