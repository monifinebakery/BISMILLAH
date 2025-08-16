// src/components/operational-costs/dialogs/index.ts

import React, { lazy } from 'react';

// All dialogs are lazy loaded by default for better performance
// ✅ Add error boundary fallback for failed imports (avoid JSX in .ts by using React.createElement)
export const CostDialog = lazy(() => 
  import('./CostDialog').catch(() => {
    console.error('Failed to load CostDialog, using fallback');
    return { default: () => React.createElement('div', null, 'Error loading dialog') } as any;
  })
);

export const DeleteConfirmDialog = lazy(() => 
  import('./DeleteConfirmDialog').catch(() => {
    console.error('Failed to load DeleteConfirmDialog, using fallback');
    return { default: () => React.createElement('div', null, 'Error loading dialog') } as any;
  })
);

export const AllocationDialog = lazy(() => 
  import('./AllocationDialog').catch(() => {
    console.error('Failed to load AllocationDialog, using fallback');
    return { default: () => React.createElement('div', null, 'Error loading dialog') } as any;
  })
);
