// src/components/operational-costs/services/index.ts

// Export all API functions and types
export * from './operationalCostApi';
export * from './productionOutputApi';

// Re-export specific APIs for direct import
export { operationalCostApi } from './operationalCostApi';
export { productionOutputApi } from './productionOutputApi';

// Export appSettingsApi separately to avoid conflicts
export { appSettingsApi } from './appSettingsApi';

// Legacy aliases for backward compatibility
export { appSettingsApi as allocationApi } from './appSettingsApi';
export { appSettingsApi as calculationApi } from './appSettingsApi';
