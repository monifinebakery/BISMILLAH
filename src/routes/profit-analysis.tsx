import React from 'react';
import { Route } from 'react-router-dom';
import { OptimizedRouteWrapper } from '@/components/routing/OptimizedRouteWrapper';

// Load the dashboard component directly to avoid touching the barrel index
const ProfitAnalysisPage = React.lazy(() =>
  import(/* webpackChunkName: "profit-analysis" */ '@/components/profitAnalysis/components/ImprovedProfitDashboard')
);

// ✅ SIMPLIFIED: Use generic RouteErrorFallback instead of custom profit analysis fallback
// The new RouteErrorFallback component provides comprehensive error recovery for all routes

const profitAnalysisRoutes = (
  <Route
    path="analisis-profit"
    element={
      <OptimizedRouteWrapper 
        routeName="profit-analysis" 
        priority="high"
        preloadOnHover={true}
      >
        <ProfitAnalysisPage />
      </OptimizedRouteWrapper>
    }
  />
);

export default profitAnalysisRoutes;
