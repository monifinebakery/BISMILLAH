// src/components/operational-costs/dialogs/index.ts

import { lazy } from 'react';

// All dialogs are lazy loaded by default for better performance
// ✅ Add error boundary fallback for failed imports
export const CostDialog = lazy(() => 
  import('./CostDialog').catch(() => {
    console.error('Failed to load CostDialog, using fallback');
    return { default: () => <div>Error loading dialog</div> };
  })
);

export const DeleteConfirmDialog = lazy(() => 
  import('./DeleteConfirmDialog').catch(() => {
    console.error('Failed to load DeleteConfirmDialog, using fallback');
    return { default: () => <div>Error loading dialog</div> };
  })
);

export const AllocationDialog = lazy(() => 
  import('./AllocationDialog').catch(() => {
    console.error('Failed to load AllocationDialog, using fallback');
    return { default: () => <div>Error loading dialog</div> };
  })
);