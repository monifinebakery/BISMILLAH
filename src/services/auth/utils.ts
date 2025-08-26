// ===== 1. src/services/auth/utils.ts - FIXED =====
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { ERROR_MESSAGES } from './config';

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const getErrorMessage = (error: unknown): string => {
  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message?: string }).message)
      : typeof error === 'string'
        ? error
        : '';

  return (
    Object.entries(ERROR_MESSAGES).find(([key]) => message.includes(key))?.[1] ||
    message ||
    'Terjadi kesalahan yang tidak diketahui'
  );
};