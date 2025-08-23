// src/components/financial/services/categoryService.ts
// Service for managing dynamic financial categories from transaction data

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { 
  DEFAULT_FINANCIAL_CATEGORIES,
  FinancialCategories 
} from '../types/financial';

// ===========================================
// ✅ DYNAMIC CATEGORY SERVICE
// ===========================================

/**
 * Get categories dynamically from actual transaction data
 * This replaces the old static category storage in user_settings
 */
export const getFinancialCategories = async (userId: string): Promise<FinancialCategories> => {
  try {
    logger.context('CategoryService', 'Fetching dynamic categories for user:', userId);

    // Get unique categories from existing transactions
    const { data: transactions, error } = await supabase
      .from('financial_transactions')
      .select('type, category')
      .eq('user_id', userId)
      .not('category', 'is', null)
      .not('category', 'eq', '');

    if (error) {
      logger.error('Error fetching transaction categories:', error);
      // Return defaults on error
      return DEFAULT_FINANCIAL_CATEGORIES;
    }

    // Group unique categories by type
    const incomeCategories = new Set<string>();
    const expenseCategories = new Set<string>();

    transactions?.forEach(transaction => {
      if (transaction.category) {
        if (transaction.type === 'income') {
          incomeCategories.add(transaction.category);
        } else if (transaction.type === 'expense') {
          expenseCategories.add(transaction.category);
        }
      }
    });

    // Merge with defaults to ensure we always have base categories
    const allIncomeCategories = new Set([
      ...DEFAULT_FINANCIAL_CATEGORIES.income,
      ...Array.from(incomeCategories)
    ]);

    const allExpenseCategories = new Set([
      ...DEFAULT_FINANCIAL_CATEGORIES.expense,
      ...Array.from(expenseCategories)
    ]);

    const result: FinancialCategories = {
      income: Array.from(allIncomeCategories).sort(),
      expense: Array.from(allExpenseCategories).sort()
    };

    logger.success('Dynamic categories fetched successfully:', {
      userId,
      incomeCount: result.income.length,
      expenseCount: result.expense.length,
      uniqueFromTransactions: {
        income: incomeCategories.size,
        expense: expenseCategories.size
      }
    });

    return result;
  } catch (error: any) {
    logger.error('Error in getFinancialCategories:', error);
    return DEFAULT_FINANCIAL_CATEGORIES;
  }
};

/**
 * Add a new category by creating a transaction with that category
 * This approach ensures categories are tied to actual usage
 */
export const addFinancialCategory = async (
  userId: string,
  type: 'income' | 'expense',
  categoryName: string
): Promise<boolean> => {
  try {
    logger.context('CategoryService', 'Adding new category:', { userId, type, categoryName });

    // Check if category already exists
    const { data: existing } = await supabase
      .from('financial_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('category', categoryName)
      .limit(1);

    if (existing && existing.length > 0) {
      logger.info('Category already exists:', categoryName);
      return true;
    }

    // Create a placeholder transaction with the new category
    // This ensures the category will appear in future queries
    const { error } = await supabase
      .from('financial_transactions')
      .insert([{
        user_id: userId,
        type: type,
        category: categoryName,
        amount: 0,
        description: `Placeholder for category: ${categoryName}`,
        date: new Date().toISOString().split('T')[0], // Today's date
        notes: 'Auto-created category placeholder'
      }]);

    if (error) {
      logger.error('Error adding category:', error);
      return false;
    }

    logger.success('Category added successfully:', categoryName);
    return true;
  } catch (error: any) {
    logger.error('Error in addFinancialCategory:', error);
    return false;
  }
};

/**
 * Remove a category by deleting all transactions with that category
 * WARNING: This will delete actual transaction data!
 */
export const removeFinancialCategory = async (
  userId: string,
  type: 'income' | 'expense',
  categoryName: string,
  moveToCategory?: string
): Promise<boolean> => {
  try {
    logger.context('CategoryService', 'Removing category:', { 
      userId, 
      type, 
      categoryName, 
      moveToCategory 
    });

    if (moveToCategory) {
      // Move transactions to another category instead of deleting
      const { error } = await supabase
        .from('financial_transactions')
        .update({ category: moveToCategory })
        .eq('user_id', userId)
        .eq('type', type)
        .eq('category', categoryName);

      if (error) {
        logger.error('Error moving category transactions:', error);
        return false;
      }

      logger.success('Category transactions moved successfully:', {
        from: categoryName,
        to: moveToCategory
      });
    } else {
      // Delete only placeholder transactions (amount = 0 and has specific description)
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('user_id', userId)
        .eq('type', type)
        .eq('category', categoryName)
        .eq('amount', 0)
        .like('description', 'Placeholder for category:%');

      if (error) {
        logger.error('Error removing category placeholders:', error);
        return false;
      }

      logger.success('Category placeholders removed successfully:', categoryName);
    }

    return true;
  } catch (error: any) {
    logger.error('Error in removeFinancialCategory:', error);
    return false;
  }
};

/**
 * Get category usage statistics
 */
export const getCategoryStats = async (userId: string): Promise<{
  income: Array<{ category: string; count: number; total: number }>;
  expense: Array<{ category: string; count: number; total: number }>;
}> => {
  try {
    const { data: transactions, error } = await supabase
      .from('financial_transactions')
      .select('type, category, amount')
      .eq('user_id', userId)
      .not('category', 'is', null)
      .not('category', 'eq', '');

    if (error) throw error;

    const stats = {
      income: [] as Array<{ category: string; count: number; total: number }>,
      expense: [] as Array<{ category: string; count: number; total: number }>
    };

    // Group by category and calculate stats
    const categoryMap = new Map<string, { type: string; count: number; total: number }>();

    transactions?.forEach(t => {
      const key = `${t.type}-${t.category}`;
      const existing = categoryMap.get(key) || { type: t.type, count: 0, total: 0 };
      existing.count += 1;
      existing.total += t.amount || 0;
      categoryMap.set(key, existing);
    });

    // Convert to arrays
    categoryMap.forEach((stat, key) => {
      const category = key.split('-').slice(1).join('-'); // Handle categories with dashes
      const item = { category, count: stat.count, total: stat.total };
      
      if (stat.type === 'income') {
        stats.income.push(item);
      } else if (stat.type === 'expense') {
        stats.expense.push(item);
      }
    });

    // Sort by usage count
    stats.income.sort((a, b) => b.count - a.count);
    stats.expense.sort((a, b) => b.count - a.count);

    return stats;
  } catch (error: any) {
    logger.error('Error getting category stats:', error);
    return { income: [], expense: [] };
  }
};