// src/routes/network-optimization.tsx
import React from 'react';
import { Route } from 'react-router-dom';
import NetworkOptimizationDemo from '@/components/NetworkOptimizationDemo';

const networkOptimizationRoutes = (
  <Route key="network-optimization" path="/network-optimization" element={<NetworkOptimizationDemo />} />
);

export default networkOptimizationRoutes;