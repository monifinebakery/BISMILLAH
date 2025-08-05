// src/components/financial/services/financialApi.ts
import { supabase } from '@/integrations/supabase/client';
import { 
  FinancialTransaction, 
  CreateTransactionData, 
  UpdateTransactionData,
  FinancialApiResponse
} from '../types/financial';

// Helper: Transform untuk DB
const transformForDB = (transaction: CreateTransactionData | Partial<UpdateTransactionData>, userId: string) => {
  return {
    ...transaction,
    user_id: userId,
    date: transaction.date ? new Date(transaction.date).toISOString() : null,
  };
};

// Helper: Transform dari DB
const transformFromDB = (data: any): FinancialTransaction => {
  return {
    ...data,
    date: data.date ? new Date(data.date) : null,
    createdAt: data.created_at ? new Date(data.created_at) : null,
    updatedAt: data.updated_at ? new Date(data.updated_at) : null,
  };
};

// ✅ API: Get All Transactions
export const getFinancialTransactions = async (userId: string) => {
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data.map(transformFromDB);
};

// ✅ API: Add Transaction
export const addFinancialTransaction = async (
  transaction: CreateTransactionData,
  userId: string
): Promise<FinancialApiResponse<boolean>> => {
  try {
    const { error } = await supabase
      .from('financial_transactions')
      .insert([transformForDB(transaction, userId)]);

    if (error) throw error;
    return { success: true, data: true };
  } catch (error: any) {
    console.error('Error adding transaction:', error);
    return { success: false, data: false, error: error.message };
  }
};

// ✅ API: Update Transaction
export const updateFinancialTransaction = async (
  id: string,
  transaction: UpdateTransactionData
): Promise<FinancialApiResponse<boolean>> => {
  try {
    const { error } = await supabase
      .from('financial_transactions')
      .update(transformForDB(transaction, ''))
      .eq('id', id);

    if (error) throw error;
    return { success: true, data: true };
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    return { success: false, data: false, error: error.message };
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
    return { success: false, data: false, error: error.message };
  }
};

// ✅ API: Get Transactions by Date Range
export const getTransactionsByDateRange = async (
  userId: string,
  from: Date,
  to: Date
) => {
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', from.toISOString())
    .lte('date', to.toISOString())
    .order('date', { ascending: false });

  if (error) throw error;
  return data.map(transformFromDB);
};