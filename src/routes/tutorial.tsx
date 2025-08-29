// src/routes/tutorial.tsx
import React, { lazy } from 'react';
import { Route } from 'react-router-dom';

// Lazy load Tutorial component untuk performance
const Tutorial = lazy(() => import('@/components/tutorials/Tutorial'));

const tutorialRoutes = (
  <Route path="/tutorial" element={<Tutorial />} />
);

export default tutorialRoutes;
