// src/components/layout/index.ts
export { AppLayout } from './AppLayout';
export { MobileLayout } from './MobileLayout';
export { DesktopLayout } from './DesktopLayout';

// src/components/loaders/index.ts
export { AppLoader } from '../loaders/AppLoader';
export { AppError } from '../loaders/AppError';

// src/components/popups/index.ts
export { default as AutoLinkingPopup } from './AutoLinkingPopup';
// NOTE: OrderConfirmationPopup stays at @/components/OrderConfirmationPopup

// src/config/index.ts
export { AppRouter } from './routes';
export { queryClient } from './queryClient';

// src/types/app.ts
import React from 'react';

export interface AppLayoutProps {
  isPaid: boolean;
  renderOrderLinkButton: (isMobile?: boolean) => React.ReactNode;
  renderAutoLinkIndicator: (isMobile?: boolean) => React.ReactNode;
  children: React.ReactNode;
}

export interface RouteWrapperProps {
  children: React.ReactNode;
  title?: string;
  specialErrorBoundary?: React.ComponentType<{ children: React.ReactNode }>;
}