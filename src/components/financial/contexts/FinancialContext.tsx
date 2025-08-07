// src/financial/contexts/FinancialContext.tsx
// ADJUSTED VERSION - Compatible dengan system yang sudah dibuat

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// Local imports
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';
import { useNotification } from '@/contexts/NotificationContext';

// ✅ FIXED: Import dengan path yang benar sesuai struktur folder
import { 
  FinancialTransaction, 
  FinancialContextType,
  CreateTransactionData,
  UpdateTransactionData 
} from '../types/financial'; // Relative path ke financial/types/financial.ts

// ✅ FIXED: Import dari utils yang sudah ada
import { 
  safeParseDate, 
  toSafeISOString 
} from '@/utils/unifiedDateUtils';

import { 
  validateTransaction,
  formatTransactionForDisplay 
} from '../utils/financialUtils'; // Relative path ke financial/utils/financialUtils.ts

// ✅ FIXED: Import API functions dari services
import {
  addFinancialTransaction as apiAddTransaction,
  updateFinancialTransaction as apiUpdateTransaction,
  deleteFinancialTransaction as apiDeleteTransaction,
  getFinancialTransactions
} from '../services/financialApi'; // Relative path ke financial/services/financialApi.ts

// ===========================================
// CONTEXT SETUP
// ===========================================

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

// ===========================================
// HELPER FUNCTIONS (Updated untuk match API)
// ===========================================

/**
 * Transform database item to FinancialTransaction
 * ✅ PERBAIKAN: Match dengan transform function di API
 */
const transformTransactionFromDB = (dbItem: any): FinancialTransaction => {
  try {
    if (!dbItem || typeof dbItem !== 'object') {
      throw new Error('Invalid transaction data from database');
    }

    return {
      id: dbItem.id || '',
      userId: dbItem.user_id || '', // ✅ PERBAIKAN: snake_case → camelCase
      type: dbItem.type || 'expense',
      category: dbItem.category || null,
      amount: Number(dbItem.amount) || 0,
      description: dbItem.description || null,
      date: safeParseDate(dbItem.date) || new Date(),
      notes: dbItem.notes || null,
      relatedId: dbItem.related_id || null, // ✅ PERBAIKAN: snake_case → camelCase
      createdAt: safeParseDate(dbItem.created_at) || new Date(),
      updatedAt: safeParseDate(dbItem.updated_at) || new Date(),
    };
  } catch (error) {
    logger.error('Error transforming transaction from DB:', error, dbItem);
    // Return safe fallback
    return {
      id: dbItem?.id || 'error',
      userId: dbItem?.user_id || '',
      type: 'expense',
      category: null,
      amount: 0,
      description: 'Error loading transaction',
      date: new Date(),
      notes: null,
      relatedId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
};

/**
 * ✅ PERBAIKAN: Simplified untuk consistency dengan API
 */
const createFinancialNotification = async (
  addNotification: any,
  type: 'success' | 'error' | 'info' | 'warning',
  title: string,
  message: string,
  transactionId?: string
) => {
  if (!addNotification || typeof addNotification !== 'function') {
    return;
  }

  try {
    await addNotification({
      title,
      message,
      type,
      icon: type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info',
      priority: type === 'error' ? 4 : 2,
      related_type: 'financial',
      related_id: transactionId,
      action_url: '/financial', // ✅ PERBAIKAN: Update URL
      is_read: false,
      is_archived: false
    });
  } catch (error) {
    logger.error('Error creating financial notification:', error);
  }
};

// ===========================================
// PROVIDER COMPONENT
// ===========================================

export const FinancialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Hooks
  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addNotification } = useNotification();

  // ===========================================
  // DATA FETCHING & REAL-TIME UPDATES
  // ===========================================

  useEffect(() => {
    if (!user) {
      setFinancialTransactions([]);
      setIsLoading(false);
      return;
    }

    const fetchInitialTransactions = async () => {
      setIsLoading(true);
      logger.context('FinancialContext', 'Fetching initial transactions for user:', user.id);
      
      try {
        // ✅ PERBAIKAN: Use API function untuk consistency
        const transactions = await getFinancialTransactions(user.id);
        setFinancialTransactions(transactions);
        logger.context('FinancialContext', 'Loaded transactions:', transactions.length);
      } catch (error: any) {
        logger.error('Error fetching initial transactions:', error);
        toast.error(`Gagal memuat transaksi keuangan: ${error.message}`);
        
        await createFinancialNotification(
          addNotification,
          'error',
          '❌ Error Sistem',
          `Gagal memuat data transaksi: ${error.message}`
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialTransactions();

    // Real-time subscription
    const channel = supabase
      .channel(`realtime-financial-${user.id}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'financial_transactions', 
          filter: `user_id=eq.${user.id}` 
        },
        (payload) => {
          try {
            logger.context('FinancialContext', 'Real-time update received:', payload);

            if (payload.eventType === 'INSERT' && payload.new) {
              const newTransaction = transformTransactionFromDB(payload.new);
              setFinancialTransactions(current => 
                [newTransaction, ...current].sort((a, b) => 
                  (b.date?.getTime() || 0) - (a.date?.getTime() || 0)
                )
              );
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              const updatedTransaction = transformTransactionFromDB(payload.new);
              setFinancialTransactions(current => 
                current.map(t => t.id === updatedTransaction.id ? updatedTransaction : t)
              );
            } else if (payload.eventType === 'DELETE' && payload.old?.id) {
              setFinancialTransactions(current => 
                current.filter(t => t.id !== payload.old.id)
              );
            }
          } catch (error) {
            logger.error('Real-time update error:', error);
            toast.error('Error dalam pembaruan real-time