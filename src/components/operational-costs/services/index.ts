// src/components/operational-costs/services/index.ts

// Export all API functions and types
export * from './operationalCostApi';
export * from './appSettingsApi';
export * from './productionOutputApi';

// Re-export specific APIs for direct import
export { operationalCostApi } from './operationalCostApi';
export { appSettingsApi } from './appSettingsApi';  
export { productionOutputApi } from './productionOutputApi';

// Legacy aliases for backward compatibility
export { appSettingsApi as allocationApi };
export { appSettingsApi as calculationApi };
