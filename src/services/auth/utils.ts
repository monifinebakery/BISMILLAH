// ===== 1. src/services/auth/utils.ts - FIXED =====
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { ERROR_MESSAGES } from './config';
import { getErrorMessage as utilGetErrorMessage } from '@/utils';

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Re-export getErrorMessage for local use
export const getErrorMessage = utilGetErrorMessage;
