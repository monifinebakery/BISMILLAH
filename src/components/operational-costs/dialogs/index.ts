// src/components/operational-costs/dialogs/index.ts

import { lazy } from 'react';

// All dialogs are lazy loaded by default for better performance
export const CostDialog = lazy(() => import('./CostDialog'));
export const DeleteConfirmDialog = lazy(() => import('./DeleteConfirmDialog'));
export const AllocationDialog = lazy(() => import('./AllocationDialog'));