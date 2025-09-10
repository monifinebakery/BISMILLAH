// src/components/operational-costs/services/productionOutputApi.ts
// 📈 Production Output Tracking Service (Revision 2)
// Calculate 30-day production output for cost allocation

import { supabase } from '@/integrations/supabase/client';
import { ApiResponse } from '../types/operationalCost.types';

// ====================================
// TYPES
// ====================================

export interface ProductionOutput {
  date: string;
  totalPcs: number;
  orderCount: number;
  completedOrders: string[]; // Order IDs for tracking
}

export interface ProductionSummary {
  period: '30_days' | '7_days' | 'monthly';
  startDate: string;
  endDate: string;
  totalPcs: number;
  dailyAverage: number;
  weeklyAverage: number;
  monthlyEstimate: number;
  dataSource: 'orders' | 'recipes' | 'manual';
  confidence: 'high' | 'medium' | 'low';
}

export interface ProductionTarget {
  targetPcsPerMonth: number;
  calculationMethod: 'last_30_days' | 'manual_input' | 'recipe_based';
  lastUpdated: string;
  isActive: boolean;
}

// ====================================
// PRODUCTION OUTPUT CALCULATION
// ====================================

/**
 * Get production output from completed orders in the last N days
 */
export const getProductionOutputFromOrders = async (
  days: number = 30
): Promise<ApiResponse<ProductionSummary>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Query completed orders from the period
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        tanggal,
        status,
        items,
        total_pesanan,
        tanggal_selesai
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('tanggal_selesai', startDate.toISOString().split('T')[0])
      .lte('tanggal_selesai', endDate.toISOString().split('T')[0])
      .order('tanggal_selesai', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    // Calculate total pieces from order items
    let totalPcs = 0;
    const completedOrders: string[] = [];

    orders?.forEach(order => {
      completedOrders.push(order.id);
      
      // Sum up quantities from order items
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const quantity = Number(item.quantity) || 0;
          totalPcs += quantity;
        });
      }
    });

    // Calculate averages and estimates
    const dailyAverage = days > 0 ? totalPcs / days : 0;
    const weeklyAverage = dailyAverage * 7;
    const monthlyEstimate = dailyAverage * 30;

    // Determine confidence level
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (orders.length >= 10 && days >= 30) {
      confidence = 'high';
    } else if (orders.length >= 5 && days >= 14) {
      confidence = 'medium';
    }

    const summary: ProductionSummary = {
      period: days === 30 ? '30_days' : days === 7 ? '7_days' : 'monthly',
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalPcs,
      dailyAverage,
      weeklyAverage,
      monthlyEstimate: Math.round(monthlyEstimate),
      dataSource: 'orders',
      confidence
    };

    return { data: summary };

  } catch (error) {
      return { 
        data: null, 
        error: `Error fetching production output: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
};

/**
 * Get production output from recipe production records
 * This is an alternative method when order data is not complete
 */
export const getProductionOutputFromRecipes = async (
  days: number = 30
): Promise<ApiResponse<ProductionSummary>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // This would query recipe production logs if available
    // For now, we'll use recipe calculations as fallback
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('id, nama_resep, jumlah_porsi, jumlah_pcs_per_porsi, updated_at')
      .eq('user_id', user.id);

    if (error) {
      return { data: null, error: error.message };
    }

    // Estimate based on recipe capacity (fallback method)
    let estimatedMonthlyCapacity = 0;
    recipes?.forEach(recipe => {
      const pcsPerBatch = recipe.jumlah_pcs_per_porsi * recipe.jumlah_porsi;
      estimatedMonthlyCapacity += pcsPerBatch * 10; // Assume 10 batches per month per recipe
    });

    const dailyAverage = estimatedMonthlyCapacity / 30;
    const weeklyAverage = dailyAverage * 7;

    const summary: ProductionSummary = {
      period: days === 30 ? '30_days' : days === 7 ? '7_days' : 'monthly',
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalPcs: Math.round(estimatedMonthlyCapacity),
      dailyAverage: Math.round(dailyAverage),
      weeklyAverage: Math.round(weeklyAverage),
      monthlyEstimate: Math.round(estimatedMonthlyCapacity),
      dataSource: 'recipes',
      confidence: 'low' // Recipe-based estimates are less reliable
    };

    return { data: summary };

  } catch (error) {
      return { 
        data: null, 
        error: `Error calculating recipe-based production: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
};

/**
 * Smart production output calculation that tries multiple methods
 * Priority: Orders -> Recipes -> Manual fallback
 */
export const getSmartProductionOutput = async (
  days: number = 30
): Promise<ApiResponse<ProductionSummary>> => {
  try {
    // Try orders first (most accurate)
    const ordersResult = await getProductionOutputFromOrders(days);
    
    if (ordersResult.data && ordersResult.data.totalPcs > 0) {
      return ordersResult;
    }

    // Fallback to recipe-based calculation
    const recipesResult = await getProductionOutputFromRecipes(days);
    
    if (recipesResult.data) {
      return recipesResult;
    }

    // Ultimate fallback - return default
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const endDate = new Date();
    
    const summary: ProductionSummary = {
      period: days === 30 ? '30_days' : days === 7 ? '7_days' : 'monthly',
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalPcs: 3000, // Default from example
      dailyAverage: 100,
      weeklyAverage: 700,
      monthlyEstimate: 3000,
      dataSource: 'manual',
      confidence: 'low'
    };

    return { data: summary };

  } catch (error) {
      return { 
        data: null, 
        error: `Error in smart production calculation: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
};

// ====================================
// PRODUCTION TARGET MANAGEMENT
// ====================================

/**
 * Save production target to app_settings
 */
export const saveProductionTarget = async (
  targetPcs: number,
  method: 'last_30_days' | 'manual_input' | 'recipe_based' = 'last_30_days'
): Promise<ApiResponse<boolean>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: false, error: 'User not authenticated' };
    }

    // Update target_output_monthly in app_settings
    const { error } = await supabase
      .from('app_settings')
      .upsert({
        user_id: user.id,
        target_output_monthly: targetPcs,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      return { data: false, error: error.message };
    }

    return { data: true };

  } catch (error) {
      return { 
        data: false, 
        error: `Error saving production target: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
};

/**
 * Get current production target from app_settings
 */
export const getCurrentProductionTarget = async (): Promise<ApiResponse<number>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { data: 0, error: 'User not authenticated' };
    }

    const { data: settings, error } = await supabase
      .from('app_settings')
      .select('target_output_monthly')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is OK
      return { data: 0, error: error.message };
    }

    return { data: settings?.target_output_monthly || 3000 }; // Default fallback

  } catch (error) {
      return { 
        data: 0, 
        error: `Error fetching production target: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
};

// ====================================
// EXPORTS
// ====================================

/**
 * Get production summary with fallback logic
 */
export const getProductionSummary = async (
  days: number = 30
): Promise<ProductionSummary> => {
  try {
    // Get production data from orders
    const ordersData = await getProductionOutputFromOrders(days)
    
    if (ordersData.data) {
      return ordersData.data
    }
    
    // Fallback to recipe-based calculation
    const recipeData = await getProductionOutputFromRecipes(days)
    
    if (recipeData.data) {
      return recipeData.data
    }
    
    // Return default summary if no data available
    return {
      period: days === 30 ? '30_days' : days === 7 ? '7_days' : 'monthly',
      startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      totalPcs: 0,
      dailyAverage: 0,
      weeklyAverage: 0,
      monthlyEstimate: 0,
      dataSource: 'orders',
      confidence: 'low'
    }
    
  } catch (error) {
      console.error('Error getting production summary:', error)
      return {
        period: days === 30 ? '30_days' : days === 7 ? '7_days' : 'monthly',
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        totalPcs: 0,
        dailyAverage: 0,
        weeklyAverage: 0,
        monthlyEstimate: 0,
        dataSource: 'orders' as const,
        confidence: 'low' as const
      }
    }
}

export const productionOutputApi = {
  getProductionOutputFromOrders,
  getProductionOutputFromRecipes,
  getSmartProductionOutput,
  saveProductionTarget,
  getCurrentProductionTarget,
  getProductionSummary
};

export default productionOutputApi;