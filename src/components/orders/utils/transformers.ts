// src/components/orders/utils/transformers.ts - Data transformation utilities
import type { Order, OrderDB, OrderItem } from '../types';
import { logger } from '@/utils/logger';

/**
 * Transform order dari database format (snake_case) ke application format (camelCase)
 */
export const transformOrderFromDB = (dbOrder: OrderDB): Order => {
  try {
    // Validate required fields
    if (!dbOrder.id || !dbOrder.user_id) {
      throw new Error('Missing required fields: id or user_id');
    }

    const order: Order = {
      id: dbOrder.id,
      userId: dbOrder.user_id,
      createdAt: new Date(dbOrder.created_at),
      updatedAt: new Date(dbOrder.updated_at),
      
      // Customer Info
      namaPelanggan: dbOrder.nama_pelanggan || '',
      teleponPelanggan: dbOrder.telepon_pelanggan || '',
      emailPelanggan: dbOrder.email_pelanggan || '',
      alamatPengiriman: dbOrder.alamat_pengiriman || '',
      
      // Order Details
      items: Array.isArray(dbOrder.items) ? dbOrder.items : [],
      status: dbOrder.status,
      catatan: dbOrder.catatan || '',
      
      // Financial Info
      subtotal: Number(dbOrder.subtotal) || 0,
      pajak: Number(dbOrder.pajak) || 0,
      totalPesanan: Number(dbOrder.total_pesanan) || 0,
    };

    // Calculate recipe analytics if items have recipe data
    if (order.items.length > 0) {
      const recipeItems = order.items.filter(item => item.isFromRecipe);
      const customItems = order.items.filter(item => !item.isFromRecipe);
      
      order.recipeCount = recipeItems.length;
      order.customItemCount = customItems.length;
      order.totalRecipeValue = recipeItems.reduce((sum, item) => sum + item.total, 0);
    }

    return order;
  } catch (error) {
    logger.error('transformOrderFromDB: Error transforming order:', error, dbOrder);
    throw new Error(`Failed to transform order from DB: ${error.message}`);
  }
};

/**
 * Transform order dari application format ke database format
 */
export const transformOrderToDB = (order: Partial<Order>): Partial<OrderDB> => {
  try {
    const dbOrder: Partial<OrderDB> = {};

    // Basic fields
    if (order.id) dbOrder.id = order.id;
    if (order.userId) dbOrder.user_id = order.userId;
    if (order.createdAt) dbOrder.created_at = order.createdAt.toISOString();
    if (order.updatedAt) dbOrder.updated_at = order.updatedAt.toISOString();

    // Customer info
    if (order.namaPelanggan !== undefined) dbOrder.nama_pelanggan = order.namaPelanggan;
    if (order.teleponPelanggan !== undefined) dbOrder.telepon_pelanggan = order.teleponPelanggan;
    if (order.emailPelanggan !== undefined) dbOrder.email_pelanggan = order.emailPelanggan;
    if (order.alamatPengiriman !== undefined) dbOrder.alamat_pengiriman = order.alamatPengiriman;

    // Order details
    if (order.items !== undefined) dbOrder.items = order.items;
    if (order.status !== undefined) dbOrder.status = order.status;
    if (order.catatan !== undefined) dbOrder.catatan = order.catatan;

    // Financial info
    if (order.subtotal !== undefined) dbOrder.subtotal = order.subtotal;
    if (order.pajak !== undefined) dbOrder.pajak = order.pajak;
    if (order.totalPesanan !== undefined) dbOrder.total_pesanan = order.totalPesanan;

    return dbOrder;
  } catch (error) {
    logger.error('transformOrderToDB: Error transforming order:', error, order);
    throw new Error(`Failed to transform order to DB format: ${error.message}`);
  }
};

/**
 * Transform order item untuk consistency
 */
export const transformOrderItem = (item: any): OrderItem => {
  try {
    return {
      id: item.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: item.name || '',
      quantity: Number(item.quantity) || 0,
      price: Number(item.price) || 0,
      total: Number(item.total) || (Number(item.quantity) * Number(item.price)),
      
      // Recipe integration
      recipeId: item.recipeId || item.recipe_id,
      recipeCategory: item.recipeCategory || item.recipe_category,
      isFromRecipe: Boolean(item.isFromRecipe || item.is_from_recipe),
      
      // Additional fields
      description: item.description || '',
      unit: item.unit || 'pcs',
    };
  } catch (error) {
    logger.error('transformOrderItem: Error transforming item:', error, item);
    throw new Error(`Failed to transform order item: ${error.message}`);
  }
};

/**
 * Normalize order data untuk konsistensi
 */
export const normalizeOrderData = (order: Partial<Order>): Partial<Order> => {
  try {
    const normalized: Partial<Order> = { ...order };

    // Normalize customer name
    if (normalized.namaPelanggan) {
      normalized.namaPelanggan = normalized.namaPelanggan.trim();
    }

    // Normalize phone number
    if (normalized.teleponPelanggan) {
      normalized.teleponPelanggan = normalized.teleponPelanggan.replace(/[^0-9+]/g, '');
    }

    // Normalize email
    if (normalized.emailPelanggan) {
      normalized.emailPelanggan = normalized.emailPelanggan.toLowerCase().trim();
    }

    // Normalize items
    if (normalized.items) {
      normalized.items = normalized.items.map(transformOrderItem);
    }

    // Recalculate totals
    if (normalized.items && normalized.items.length > 0) {
      const subtotal = normalized.items.reduce((sum, item) => sum + item.total, 0);
      const pajak = normalized.pajak || 0;
      
      normalized.subtotal = subtotal;
      normalized.totalPesanan = subtotal + pajak;
    }

    return normalized;
  } catch (error) {
    logger.error('normalizeOrderData: Error normalizing order:', error, order);
    throw new Error(`Failed to normalize order data: ${error.message}`);
  }
};

/**
 * Create order item dari recipe data
 */
export const createOrderItemFromRecipe = (recipe: any, quantity: number = 1): OrderItem => {
  try {
    return {
      id: `recipe_${recipe.id}_${Date.now()}`,
      name: recipe.name || recipe.title || '',
      quantity,
      price: Number(recipe.price) || Number(recipe.cost) || 0,
      total: (Number(recipe.price) || Number(recipe.cost) || 0) * quantity,
      
      // Recipe specific
      recipeId: recipe.id,
      recipeCategory: recipe.category || 'Makanan',
      isFromRecipe: true,
      
      // Additional
      description: recipe.description || '',
      unit: recipe.unit || 'porsi',
    };
  } catch (error) {
    logger.error('createOrderItemFromRecipe: Error creating item from recipe:', error, recipe);
    throw new Error(`Failed to create order item from recipe: ${error.message}`);
  }
};

/**
 * Batch transform orders
 */
export const batchTransformOrdersFromDB = (dbOrders: OrderDB[]): Order[] => {
  const errors: string[] = [];
  const transformedOrders: Order[] = [];

  dbOrders.forEach((dbOrder, index) => {
    try {
      const transformed = transformOrderFromDB(dbOrder);
      transformedOrders.push(transformed);
    } catch (error) {
      errors.push(`Order ${index} (${dbOrder.id}): ${error.message}`);
      logger.error('batchTransformOrdersFromDB: Error transforming order:', error, dbOrder);
    }
  });

  if (errors.length > 0) {
    logger.warn('batchTransformOrdersFromDB: Some orders failed to transform:', errors);
  }

  return transformedOrders;
};

/**
 * Safe date parsing untuk handling different date formats
 */
export const safeParseDate = (dateInput: any): Date | null => {
  try {
    if (!dateInput) return null;
    
    if (dateInput instanceof Date) {
      return isNaN(dateInput.getTime()) ? null : dateInput;
    }
    
    if (typeof dateInput === 'string') {
      const parsed = new Date(dateInput);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    
    if (typeof dateInput === 'number') {
      const parsed = new Date(dateInput);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    
    return null;
  } catch (error) {
    logger.error('safeParseDate: Error parsing date:', error, dateInput);
    return null;
  }
};

/**
 * Convert date ke ISO string yang safe
 */
export const toSafeISOString = (date: Date | string | null): string => {
  try {
    if (!date) return new Date().toISOString();
    
    const parsed = safeParseDate(date);
    return parsed ? parsed.toISOString() : new Date().toISOString();
  } catch (error) {
    logger.error('toSafeISOString: Error converting to ISO string:', error, date);
    return new Date().toISOString();
  }
};

/**
 * Validate apakah date object valid
 */
export const isValidDate = (date: any): boolean => {
  try {
    return date instanceof Date && !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
};