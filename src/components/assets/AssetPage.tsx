// src/components/assets/AssetPage.tsx

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AssetManagement } from './AssetManagement';

// Create a query client for this feature if needed
const assetQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

interface AssetPageProps {
  queryClient?: QueryClient;
}

export const AssetPage: React.FC<AssetPageProps> = ({ queryClient }) => {
  // Use provided query client or create a new one
  const client = queryClient || assetQueryClient;

  return (
    <QueryClientProvider client={client}>
      <AssetManagement />
    </QueryClientProvider>
  );
};