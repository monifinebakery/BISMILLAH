// src/routes/preloading.tsx
import React from 'react';
import { Route } from 'react-router-dom';
import PreloadingDemo from '@/components/PreloadingDemo';

const preloadingRoutes = (
  <Route key="preloading" path="/preloading" element={<PreloadingDemo />} />
);

export default preloadingRoutes;