// src/components/warehouse/services/index.ts
/**
 * Warehouse Services Barrel Export
 * API services and utilities
 */

// Main API Service
export { warehouseApi } from './warehouseApi';

// Utilities
export { warehouseUtils } from './warehouseUtils';
export { default as warehouseUtils } from './warehouseUtils';

// Types
export type {
  ServiceConfig,
  CrudServiceOptions,
  ValidationResult,
  ExportFormat,
  ImportResult
} from '../types';

// Service creation helpers
export const createWarehouseService = async (serviceName: string, config: any) => {
  return warehouseApi.createService(serviceName, config);
};