// utils/logger.ts - Buat logger utility
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  context: (contextName: string, message: string, data?: any) => {
    if (isDev && process.env.REACT_APP_DEBUG_CONTEXT === 'true') {
      console.log(`[${contextName}]`, message, data || '');
    }
  },
  
  info: (message: string, data?: any) => {
    if (isDev) console.log('ℹ️', message, data || '');
  },
  
  warn: (message: string, data?: any) => {
    console.warn('⚠️', message, data || '');
  },
  
  error: (message: string, error?: any) => {
    console.error('🚨', message, error || '');
  }
};