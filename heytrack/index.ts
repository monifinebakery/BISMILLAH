// =============================================
// HEYTRACK - Business Management Module
// Main Index File
// =============================================

// Export all types
export * from './types/business';
export * from './types/supplier';

// Export services
export { default as businessApi } from './services/businessApi';

// Database exports
export * from './database';

// You can add more exports here as the module grows
export const HEYTRACK_VERSION = '1.0.0';
export const MODULE_NAME = 'HeyTrack Business Management';