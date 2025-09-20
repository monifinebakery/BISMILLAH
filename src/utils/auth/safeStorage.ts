// src/utils/auth/safeStorage.ts - Thread-safe storage operations
import { logger } from '@/utils/logger';

// Simple lock mechanism to prevent concurrent localStorage operations
const storageLocks = new Map<string, Promise<void>>();

/**
 * Thread-safe localStorage setter with queueing
 */
export const safeStorageSet = async (key: string, value: string): Promise<boolean> => {
  // Wait for any pending operations on this key
  const existingLock = storageLocks.get(key);
  if (existingLock) {
    await existingLock.catch(() => {}); // Ignore lock errors
  }

  // Create new lock for this operation
  const operation = new Promise<void>((resolve, reject) => {
    try {
      localStorage.setItem(key, value);
      resolve();
    } catch (error) {
      logger.warn(`SafeStorage: Failed to set ${key}`, error);
      reject(error);
    }
  });

  storageLocks.set(key, operation);

  try {
    await operation;
    storageLocks.delete(key);
    return true;
  } catch (error) {
    storageLocks.delete(key);
    return false;
  }
};

/**
 * Thread-safe localStorage getter
 */
export const safeStorageGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    logger.warn(`SafeStorage: Failed to get ${key}`, error);
    return null;
  }
};

/**
 * Thread-safe localStorage remover with queueing
 */
export const safeStorageRemove = async (key: string): Promise<boolean> => {
  // Wait for any pending operations on this key
  const existingLock = storageLocks.get(key);
  if (existingLock) {
    await existingLock.catch(() => {});
  }

  // Create new lock for this operation
  const operation = new Promise<void>((resolve, reject) => {
    try {
      localStorage.removeItem(key);
      resolve();
    } catch (error) {
      logger.warn(`SafeStorage: Failed to remove ${key}`, error);
      reject(error);
    }
  });

  storageLocks.set(key, operation);

  try {
    await operation;
    storageLocks.delete(key);
    return true;
  } catch (error) {
    storageLocks.delete(key);
    return false;
  }
};

/**
 * Safely parse stored JSON data
 */
export const safeStorageGetJSON = <T = any>(key: string): T | null => {
  const raw = safeStorageGet(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    logger.warn(`SafeStorage: Failed to parse JSON for ${key}`, error);
    return null;
  }
};

/**
 * Safely stringify and store JSON data
 */
export const safeStorageSetJSON = async <T = any>(key: string, value: T): Promise<boolean> => {
  try {
    const serialized = JSON.stringify(value);
    return await safeStorageSet(key, serialized);
  } catch (error) {
    logger.warn(`SafeStorage: Failed to stringify JSON for ${key}`, error);
    return false;
  }
};