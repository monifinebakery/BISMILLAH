// src/components/financial/services/financialApi.ts
import { supabase } from '@/integrations/supabase/client';
import { 
  FinancialTransaction, 
  CreateTransactionData, 
  UpdateTransactionData,
  FinancialApiResponse
} from '../types/financial';

// Database interface (matching your Supabase schema)
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

// Helper: Transform untuk DB (snake_case)
const transformForDB = (
  transaction: CreateTransactionData | Partial<UpdateTransactionData>, 
  userId?: string
): Partial<FinancialTransactionDB> => {
  const dbTransaction: Partial<FinancialTransactionDB> = {
    type: transaction.type,
    category: transaction.category,
    amount: transaction.amount,
    description: transaction.description,
    notes: transaction.notes,
    related_id: transaction.relatedId,
    date: transaction.date ? new Date(transaction.date).toISOString() : null,
  };

  // Add user_id if provided (for CREATE operations)
  if (userId) {
    dbTransaction.user_id = userId;
  }

  // Remove undefined values
  return Object.fromEntries(
    Object.entries(dbTransaction).filter(([_, value]) => value !== undefined)
  ) as Partial<FinancialTransactionDB>;
};

// Helper: Transform dari DB (camelCase)
const transformFromDB = (data: FinancialTransactionDB): FinancialTransaction => {
  return {
    id: data.id,
    userId: data.user_id,
    type: data.type as 'income' | 'expense',
    category: data.category,
    amount: data.amount,
    description: data.description,
    date: data.date ? new Date(data.date) : null,
    notes: data.notes,
    relatedId: data.related_id,
    createdAt: data.created_at ? new Date(data.created_at) : null,
    updatedAt: data.updated_at ? new Date(data.updated_at) : null,
  };
};

// ✅ API: Get All Transactions
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
    console.error('Error fetching transactions:', error);
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }
};

// ✅ API: Add Transaction
export const addFinancialTransaction = async (
  transaction: CreateTransactionData,
  userId: string
): Promise<FinancialApiResponse<boolean>> => {
  try {
    // Validation
    if (!transaction.type || !['income', 'expense'].includes(transaction.type)) {
      throw new Error('Transaction type must be either "income" or "expense"');
    }
    
    if (!transaction.amount || transaction.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (!transaction.description?.trim()) {
      throw new Error('Description is required');
    }

    const dbData = transformForDB(transaction, userId);
    
    const { error } = await supabase
      .from('financial_transactions')
      .insert([dbData]);

    if (error) throw error;
    
    return { success: true, data: true };
  } catch (error: any) {
    console.error('Error adding transaction:', error);
    return { 
      success: false, 
      data: false, 
      error: error.message || 'Failed to add transaction'
    };
  }
};

// ✅ API: Update Transaction
export const updateFinancialTransaction = async (
  id: string,
  transaction: UpdateTransactionData
): Promise<FinancialApiResponse<boolean>> => {
  try {
    // Validation for updates
    if (transaction.amount !== undefined && transaction.amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (transaction.type && !['income', 'expense'].includes(transaction.type)) {
      throw new Error('Transaction type must be either "income" or "expense"');
    }

    if (transaction.description !== undefined && !transaction.description?.trim()) {
      throw new Error('Description cannot be empty');
    }

    const dbData = transformForDB(transaction);
    
    const { error } = await supabase
      .from('financial_transactions')
      .update(dbData)
      .eq('id', id);

    if (error) throw error;
    
    return { success: true, data: true };
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    return { 
      success: false, 
      data: false, 
      error: error.message || 'Failed to update transaction'
    };
  }
};

// ✅ API: Delete Transaction
export const deleteFinancialTransaction = async (
  id: string
): Promise<FinancialApiResponse<boolean>> => {
  try {
    const { error } = await supabase
      .from('financial_transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    return { success: true, data: true };
  } catch (error: any) {
    console.error('Error deleting transaction:', error);
    return { 
      success: false, 
      data: false, 
      error: error.message || 'Failed to delete transaction'
    };
  }
};

// ✅ API: Get Transactions by Date Range
export const getTransactionsByDateRange = async (
  userId: string,
  from: Date,
  to: Date
): Promise<FinancialTransaction[]> => {
  try {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', from.toISOString())
      .lte('date', to.toISOString())
      .order('date', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(transformFromDB);
  } catch (error: any) {
    console.error('Error fetching transactions by date range:', error);
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }
};

// ✅ API: Get Transaction by ID (bonus utility)
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
    console.error('Error fetching transaction by ID:', error);
    throw new Error(`Failed to fetch transaction: ${error.message}`);
  }
};

// ✅ API: Bulk Operations (bonus)
export const bulkDeleteFinancialTransactions = async (
  ids: string[],
  userId: string
): Promise<FinancialApiResponse<boolean>> => {
  try {
    const { error } = await supabase
      .from('financial_transactions')
      .delete()
      .in('id', ids)
      .eq('user_id', userId);

    if (error) throw error;
    
    return { success: true, data: true };
  } catch (error: any) {
    console.error('Error bulk deleting transactions:', error);
    return { 
      success: false, 
      data: false, 
      error: error.message || 'Failed to delete transactions'
    };
  }
};

// ✅ API: Get Financial Stats (bonus analytics)
export const getFinancialStats = async (
  userId: string,
  from?: Date,
  to?: Date
) => {
  try {
    let query = supabase
      .from('financial_transactions')
      .select('type, amount, category')
      .eq('user_id', userId);

    if (from) {
      query = query.gte('date', from.toISOString());
    }
    if (to) {
      query = query.lte('date', to.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;

    // Calculate stats
    const transactions = data || [];
    const income = transactions.filter(t => t.type === 'income');
    const expenses = transactions.filter(t => t.type === 'expense');
    
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;
    
    // Category breakdown
    const categoryBreakdown: Record<string, number> = {};
    transactions.forEach(t => {
      const category = t.category || 'Lainnya';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + t.amount;
    });

    const topCategory = Object.entries(categoryBreakdown)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Tidak ada';

    return {
      totalIncome,
      totalExpense,
      balance,
      transactionCount: transactions.length,
      avgTransaction: transactions.length > 0 ? (totalIncome + totalExpense) / transactions.length : 0,
      topCategory,
      categoryBreakdown,
      monthlyGrowth: Math.random() * 20 - 10, // Mock growth - implement real calculation
    };
  } catch (error: any) {
    console.error('Error getting financial stats:', error);
    throw new Error(`Failed to get stats: ${error.message}`);
  }
};

export default {
  getFinancialTransactions,
  addFinancialTransaction,
  updateFinancialTransaction,
  deleteFinancialTransaction,
  getTransactionsByDateRange,
  getFinancialTransactionById,
  bulkDeleteFinancialTransactions,
  getFinancialStats,
};