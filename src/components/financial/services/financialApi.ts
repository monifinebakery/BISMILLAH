// src/services/financialApi.ts
// ✅ CLEAN API LAYER - No business logic, no context imports

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { safeParseDate } from '@/utils/unifiedDateUtils';
// 🔧 IMPROVED: Import centralized date normalization
import { normalizeDateRange, normalizeDateForDatabase } from '@/utils/dateNormalization';
import { 
  FinancialTransaction, 
  CreateTransactionData, 
  UpdateTransactionData,
  FinancialApiResponse
} from '../types/financial';

// ===========================================
// ✅ DATABASE INTERFACE
// ===========================================

interface FinancialTransactionDB {
  id: string;
  user_id: string;
  type: string;
  category: string | null;
  amount: number;
  description: string | null;
  date: string | null;
  notes: string | null;
  related_id: string | null;
  created_at: string;
  updated_at: string;
}

// ===========================================
// ✅ TRANSFORM FUNCTIONS (Pure)
// ===========================================

const transformForDB = (
  transaction: CreateTransactionData | UpdateTransactionData, 
  userId?: string
): any => {
  const dbTransaction: any = {
    type: transaction.type,
    category: transaction.category || null,
    amount: transaction.amount,
    description: transaction.description || null,
    notes: transaction.notes || null,
    related_id: transaction.relatedId || null,
    date: transaction.date ? new Date(transaction.date).toISOString() : null,
  };

  if (userId) {
    dbTransaction.user_id = userId;
  }

  // Remove undefined values
  return Object.fromEntries(
    Object.entries(dbTransaction).filter(([_, value]) => value !== undefined)
  );
};

const transformFromDB = (data: any): FinancialTransaction => {
  return {
    id: data.id,
    userId: data.user_id,
    type: data.type as 'income' | 'expense',
    category: data.category,
    amount: data.amount,
    description: data.description,
    date: safeParseDate(data.date),
    notes: data.notes,
    relatedId: data.related_id,
    createdAt: safeParseDate(data.created_at),
    updatedAt: safeParseDate(data.updated_at),
  };
};

// ===========================================
// ✅ API FUNCTIONS
// ===========================================

export const getFinancialTransactions = async (userId: string): Promise<FinancialTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(transformFromDB);
  } catch (error: any) {
    logger.error('Error fetching transactions:', error);
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }
};

export const addFinancialTransaction = async (
  transaction: CreateTransactionData,
  userId: string
): Promise<FinancialTransaction> => {
  try {
    console.log('💰 Adding financial transaction:', {
      userId,
      transaction: {
        type: transaction.type,
        category: transaction.category,
        amount: transaction.amount,
        description: transaction.description,
        date: transaction.date,
        relatedId: transaction.relatedId
      }
    });
    
    const dbData = transformForDB(transaction, userId);
    
    console.log('💾 Database data to insert:', dbData);
    
    const { data, error } = await supabase
      .from('financial_transactions')
      .insert([dbData])
      .select()
      .single();

    if (error) {
      console.error('❌ Financial transaction creation failed:', error);
      throw error;
    }
    
    const result = transformFromDB(data);
    console.log('✅ Financial transaction created successfully:', {
      id: result.id,
      category: result.category,
      amount: result.amount,
      date: result.date
    });
    
    return result;
  } catch (error: any) {
    logger.error('Error adding transaction:', error);
    throw new Error(`Failed to add transaction: ${error.message}`);
  }
};

export const updateFinancialTransaction = async (
  id: string,
  transaction: UpdateTransactionData
): Promise<FinancialTransaction> => {
  try {
    const dbData = transformForDB(transaction);
    
    const { data, error } = await supabase
      .from('financial_transactions')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    return transformFromDB(data);
  } catch (error: any) {
    logger.error('Error updating transaction:', error);
    throw new Error(`Failed to update transaction: ${error.message}`);
  }
};

export const deleteFinancialTransaction = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('financial_transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    return true;
  } catch (error: any) {
    logger.error('Error deleting transaction:', error);
    throw new Error(`Failed to delete transaction: ${error.message}`);
  }
};

export const getTransactionsByDateRange = async (
  userId: string,
  from: Date,
  to: Date
): Promise<FinancialTransaction[]> => {
  try {
    // 🔧 IMPROVED: Use centralized date normalization for consistency
    const { startYMD, endYMD } = normalizeDateRange(from, to);
    
    logger.info('📊 Fetching financial transactions by date range:', {
      userId,
      dateRange: { from: from.toISOString(), to: to.toISOString() },
      normalizedRange: { startYMD, endYMD }
    });
    
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startYMD)
      .lte('date', endYMD)
      .order('date', { ascending: false });

    if (error) throw error;
    
    const transactions = (data || []).map(transformFromDB);
    
    logger.info('✅ Financial transactions fetched:', {
      count: transactions.length,
      dateRange: { startYMD, endYMD }
    });
    
    return transactions;
  } catch (error: any) {
    logger.error('Error fetching transactions by date range:', error);
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }
};

export const getFinancialTransactionById = async (
  id: string,
  userId: string
): Promise<FinancialTransaction | null> => {
  try {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw error;
    }
    
    return data ? transformFromDB(data) : null;
  } catch (error: any) {
    logger.error('Error fetching transaction by ID:', error);
    throw new Error(`Failed to fetch transaction: ${error.message}`);
  }
};

export const bulkDeleteFinancialTransactions = async (
  ids: string[],
  userId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('financial_transactions')
      .delete()
      .in('id', ids)
      .eq('user_id', userId);

    if (error) throw error;
    
    return true;
  } catch (error: any) {
    logger.error('Error bulk deleting transactions:', error);
    throw new Error(`Failed to delete transactions: ${error.message}`);
  }
};

// ===========================================
// ✅ EXPORT
// ===========================================

export default {
  getFinancialTransactions,
  addFinancialTransaction,
  updateFinancialTransaction,
  deleteFinancialTransaction,
  getTransactionsByDateRange,
  getFinancialTransactionById,
  bulkDeleteFinancialTransactions,
};