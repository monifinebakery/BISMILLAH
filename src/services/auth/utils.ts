// ===== 1. src/services/auth/utils.ts - FIXED =====
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { ERROR_MESSAGES } from './config';

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const getErrorMessage = (error: any): string => {
  const message = Object.entries(ERROR_MESSAGES).find(([key]) => 
    error.message?.includes(key)
  )?.[1] || error.message || 'Terjadi kesalahan yang tidak diketahui';
  
  return message;
};