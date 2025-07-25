// src/utils/keyUtils.ts
// Key generation utilities for React list rendering

/**
 * Generate unique key for React list items
 * Priority: id -> key -> name/nama -> unique identifier -> index fallback
 */
export const generateListKey = (item: any, index: number, prefix = 'item'): string => {
  try {
    // Priority 1: Use id if available
    if (item?.id) {
      return `${prefix}-${item.id}`;
    }
    
    // Priority 2: Use key if available  
    if (item?.key) {
      return `${prefix}-${item.key}`;
    }
    
    // Priority 3: Use name fields (sanitized)
    if (item?.name) {
      const sanitized = item.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      return `${prefix}-${sanitized}-${index}`;
    }
    
    if (item?.nama) {
      const sanitized = item.nama.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      return `${prefix}-${sanitized}-${index}`;
    }
    
    // Priority 4: Use unique identifiers
    if (item?.nomorPesanan) {
      return `${prefix}-${item.nomorPesanan}`;
    }
    
    if (item?.sku) {
      return `${prefix}-${item.sku}`;
    }
    
    if (item?.code) {
      return `${prefix}-${item.code}`;
    }
    
    // Priority 5: Use email or phone for customers
    if (item?.email) {
      const sanitized = item.email.replace(/[^a-zA-Z0-9]/g, '-');
      return `${prefix}-${sanitized}-${index}`;
    }
    
    if (item?.telepon || item?.phone) {
      const phone = item.telepon || item.phone;
      return `${prefix}-${phone}-${index}`;
    }
    
    // Fallback: Use index
    return `${prefix}-${index}`;
    
  } catch (error) {
    console.warn('generateListKey: Error generating key, using fallback:', error);
    return `${prefix}-${index}`;
  }
};

/**
 * Generate key specifically for products
 */
export const generateProductKey = (product: any, index: number): string => {
  return generateListKey(product, index, 'product');
};

/**
 * Generate key specifically for orders
 */
export const generateOrderKey = (order: any, index: number): string => {
  return generateListKey(order, index, 'order');
};

/**
 * Generate key specifically for activities/logs
 */
export const generateActivityKey = (activity: any, index: number): string => {
  return generateListKey(activity, index, 'activity');
};

/**
 * Generate key specifically for stock items
 */
export const generateStockKey = (item: any, index: number): string => {
  return generateListKey(item, index, 'stock');
};

/**
 * Generate key specifically for customers
 */
export const generateCustomerKey = (customer: any, index: number): string => {
  return generateListKey(customer, index, 'customer');
};

/**
 * Generate key specifically for transactions
 */
export const generateTransactionKey = (transaction: any, index: number): string => {
  return generateListKey(transaction, index, 'transaction');
};

/**
 * Generate key for table rows
 */
export const generateRowKey = (item: any, index: number): string => {
  return generateListKey(item, index, 'row');
};

/**
 * Generate key for list items
 */
export const generateItemKey = (item: any, index: number): string => {
  return generateListKey(item, index, 'item');
};

/**
 * Generate key for cards
 */
export const generateCardKey = (item: any, index: number): string => {
  return generateListKey(item, index, 'card');
};

/**
 * Generate simple key with just prefix and index
 */
export const generateSimpleKey = (prefix: string, index: number): string => {
  return `${prefix}-${index}`;
};

// Export as default object for convenience
export default {
  generateListKey,
  generateProductKey,
  generateOrderKey,
  generateActivityKey,
  generateStockKey,
  generateCustomerKey,
  generateTransactionKey,
  generateRowKey,
  generateItemKey,
  generateCardKey,
  generateSimpleKey,
};