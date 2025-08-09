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