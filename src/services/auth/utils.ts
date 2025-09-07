// ===== 1. src/services/auth/utils.ts - FIXED =====
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { ERROR_MESSAGES } from './config';
import { getErrorMessage } from '@/utils';

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};