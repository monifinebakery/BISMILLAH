// src/utils/orderValidation.ts
// ✅ STANDARDIZED: Centralized validation utilities for Orders module

import type { Order, NewOrder, OrderItem, OrderStatus } from '@/components/orders/types';

export interface OrderValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface OrderValidationContext {
  allowPastDates?: boolean;
  validateStock?: boolean;
  maxOrderValue?: number;
}

// ✅ VALIDATION RULES: Consistent with other modules
export const ORDER_VALIDATION_RULES = {
  CUSTOMER_NAME: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z\s\u00C0-\u017F\u0100-\u024F\u1E00-\u1EFF\u4e00-\u9faf\u3400-\u4dbf]+$/
  },
  PHONE: {
    required: false,
    pattern: /^(\+62|62|0)[0-9]{8,13}$/,
    message: 'Format nomor telepon tidak valid'
  },
  EMAIL: {
    required: false,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Format email tidak valid'
  },
  ORDER_NUMBER: {
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: /^[A-Z0-9\-]+$/
  },
  ITEMS: {
    minItems: 1,
    maxItems: 50,
    requiredFields: ['name', 'quantity', 'price']
  },
  AMOUNT: {
    min: 1000, // Minimum order value in IDR
    max: 100000000 // Maximum order value in IDR
  }
} as const;

/**
 * Validate order item
 */
export const validateOrderItem = (
  item: OrderItem, 
  index: number,
  context: OrderValidationContext = {}
): OrderValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!item.name?.trim()) {
    errors.push(`Item ${index + 1}: Nama item tidak boleh kosong`);
  }

  if (!item.quantity || item.quantity <= 0) {
    errors.push(`Item ${index + 1}: Jumlah harus lebih dari 0`);
  }

  if (!item.price || item.price <= 0) {
    errors.push(`Item ${index + 1}: Harga harus lebih dari 0`);
  }

  // Quantity validation
  if (item.quantity && item.quantity > 1000) {
    warnings.push(`Item ${index + 1}: Jumlah sangat besar (${item.quantity})`);
  }

  // Price validation
  if (item.price && item.price > 10000000) { // 10 million IDR
    warnings.push(`Item ${index + 1}: Harga sangat tinggi (${item.price.toLocaleString('id-ID')})`);
  }

  // Total calculation validation
  const expectedTotal = (item.quantity || 0) * (item.price || 0);
  if (item.total && Math.abs(item.total - expectedTotal) > 0.01) {
    errors.push(`Item ${index + 1}: Total tidak sesuai dengan kalkulasi (${item.total} vs ${expectedTotal})`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate customer information
 */
export const validateCustomerInfo = (order: Partial<NewOrder>): OrderValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Customer name validation
  if (!order.namaPelanggan?.trim()) {
    errors.push('Nama pelanggan tidak boleh kosong');
  } else {
    const name = order.namaPelanggan.trim();
    
    if (name.length < ORDER_VALIDATION_RULES.CUSTOMER_NAME.minLength) {
      errors.push(`Nama pelanggan minimal ${ORDER_VALIDATION_RULES.CUSTOMER_NAME.minLength} karakter`);
    }
    
    if (name.length > ORDER_VALIDATION_RULES.CUSTOMER_NAME.maxLength) {
      errors.push(`Nama pelanggan maksimal ${ORDER_VALIDATION_RULES.CUSTOMER_NAME.maxLength} karakter`);
    }
    
    if (!ORDER_VALIDATION_RULES.CUSTOMER_NAME.pattern.test(name)) {
      errors.push('Nama pelanggan hanya boleh mengandung huruf dan spasi');
    }
  }

  // Phone validation (optional)
  if (order.teleponPelanggan?.trim()) {
    const phone = order.teleponPelanggan.trim();
    if (!ORDER_VALIDATION_RULES.PHONE.pattern.test(phone)) {
      errors.push(ORDER_VALIDATION_RULES.PHONE.message);
    }
  }

  // Email validation (optional)
  if (order.emailPelanggan?.trim()) {
    const email = order.emailPelanggan.trim();
    if (!ORDER_VALIDATION_RULES.EMAIL.pattern.test(email)) {
      errors.push(ORDER_VALIDATION_RULES.EMAIL.message);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate order items array
 */
export const validateOrderItems = (
  items: OrderItem[], 
  context: OrderValidationContext = {}
): OrderValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check minimum items
  if (!items || items.length === 0) {
    errors.push('Pesanan harus memiliki minimal 1 item');
    return { isValid: false, errors, warnings };
  }

  if (items.length > ORDER_VALIDATION_RULES.ITEMS.maxItems) {
    errors.push(`Pesanan maksimal ${ORDER_VALIDATION_RULES.ITEMS.maxItems} item`);
  }

  // Validate each item
  items.forEach((item, index) => {
    const itemValidation = validateOrderItem(item, index, context);
    errors.push(...itemValidation.errors);
    warnings.push(...itemValidation.warnings);
  });

  // Check for duplicate items
  const itemNames = items.map(item => item.name?.trim().toLowerCase()).filter(Boolean);
  const duplicates = itemNames.filter((name, index) => itemNames.indexOf(name) !== index);
  if (duplicates.length > 0) {
    warnings.push(`Item duplikat ditemukan: ${duplicates.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate order financial calculations
 */
export const validateOrderFinancials = (order: Partial<NewOrder | Order>): OrderValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate subtotal
  if (order.items && order.items.length > 0) {
    const calculatedSubtotal = order.items.reduce((sum, item) => sum + (item.total || 0), 0);
    
    if (order.subtotal && Math.abs(order.subtotal - calculatedSubtotal) > 0.01) {
      errors.push(`Subtotal tidak sesuai (${order.subtotal} vs ${calculatedSubtotal})`);
    }
  }

  // Validate tax
  if (order.pajak && order.pajak < 0) {
    errors.push('Pajak tidak boleh negatif');
  }

  // Validate total
  if (order.totalPesanan) {
    const expectedTotal = (order.subtotal || 0) + (order.pajak || 0);
    if (Math.abs(order.totalPesanan - expectedTotal) > 0.01) {
      errors.push(`Total pesanan tidak sesuai (${order.totalPesanan} vs ${expectedTotal})`);
    }

    // Check against validation rules
    if (order.totalPesanan < ORDER_VALIDATION_RULES.AMOUNT.min) {
      errors.push(`Total pesanan minimal Rp${ORDER_VALIDATION_RULES.AMOUNT.min.toLocaleString('id-ID')}`);
    }

    if (order.totalPesanan > ORDER_VALIDATION_RULES.AMOUNT.max) {
      warnings.push(`Total pesanan sangat besar (Rp${order.totalPesanan.toLocaleString('id-ID')})`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate order status transition
 */
export const validateOrderStatusTransition = (
  currentStatus: OrderStatus, 
  newStatus: OrderStatus
): OrderValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['preparing', 'cancelled'],
    'preparing': ['ready', 'cancelled'],
    'ready': ['delivered', 'completed'],
    'delivered': ['completed'],
    'completed': [],
    'cancelled': []
  };

  if (!validTransitions[currentStatus]?.includes(newStatus)) {
    errors.push(`Tidak dapat mengubah status dari ${currentStatus} ke ${newStatus}`);
  }

  // Warnings for specific transitions
  if (currentStatus === 'confirmed' && newStatus === 'cancelled') {
    warnings.push('Membatalkan pesanan yang sudah dikonfirmasi');
  }

  if (currentStatus === 'preparing' && newStatus === 'cancelled') {
    warnings.push('Membatalkan pesanan yang sedang diproses');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Main order validation function
 */
export const validateOrderData = (
  order: Partial<NewOrder | Order>,
  context: OrderValidationContext = {}
): OrderValidationResult => {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  // Validate customer info
  const customerValidation = validateCustomerInfo(order);
  allErrors.push(...customerValidation.errors);
  allWarnings.push(...customerValidation.warnings);

  // Validate items
  if (order.items) {
    const itemsValidation = validateOrderItems(order.items, context);
    allErrors.push(...itemsValidation.errors);
    allWarnings.push(...itemsValidation.warnings);
  }

  // Validate financials
  const financialValidation = validateOrderFinancials(order);
  allErrors.push(...financialValidation.errors);
  allWarnings.push(...financialValidation.warnings);

  // Validate order date
  if (order.tanggal) {
    const orderDate = new Date(order.tanggal);
    const now = new Date();
    
    if (!context.allowPastDates && orderDate < now) {
      allWarnings.push('Tanggal pesanan di masa lalu');
    }
    
    // Check if date is too far in the future (more than 1 year)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    
    if (orderDate > oneYearFromNow) {
      allWarnings.push('Tanggal pesanan terlalu jauh di masa depan');
    }
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
};

/**
 * Order consistency monitoring
 */
export const monitorOrderDataQuality = (orders: Order[]): {
  qualityScore: number;
  issues: string[];
  recommendations: string[];
} => {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let totalScore = 100;

  if (orders.length === 0) {
    return { qualityScore: 0, issues: ['No orders found'], recommendations: ['Add some orders'] };
  }

  // Check for incomplete orders
  const incompleteOrders = orders.filter(order => !order.namaPelanggan || !order.items?.length);
  if (incompleteOrders.length > 0) {
    const percentage = (incompleteOrders.length / orders.length) * 100;
    issues.push(`${incompleteOrders.length} orders have incomplete data (${percentage.toFixed(1)}%)`);
    totalScore -= Math.min(20, percentage);
    recommendations.push('Complete missing customer information and items');
  }

  // Check for orders with invalid totals
  const invalidTotalOrders = orders.filter(order => {
    if (!order.items?.length) return false;
    const calculatedTotal = order.items.reduce((sum, item) => sum + (item.total || 0), 0);
    return Math.abs((order.subtotal || 0) - calculatedTotal) > 0.01;
  });
  
  if (invalidTotalOrders.length > 0) {
    const percentage = (invalidTotalOrders.length / orders.length) * 100;
    issues.push(`${invalidTotalOrders.length} orders have calculation errors (${percentage.toFixed(1)}%)`);
    totalScore -= Math.min(15, percentage);
    recommendations.push('Review and fix order calculation errors');
  }

  // Check for old pending orders
  const oldPendingOrders = orders.filter(order => {
    if (order.status !== 'pending') return false;
    const orderDate = new Date(order.tanggal);
    if (!(orderDate instanceof Date) || isNaN(orderDate.getTime())) {
      return false; // Skip invalid dates
    }
    const daysDiff = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff > 7; // More than 7 days old
  });
  
  if (oldPendingOrders.length > 0) {
    issues.push(`${oldPendingOrders.length} orders have been pending for more than 7 days`);
    totalScore -= Math.min(10, oldPendingOrders.length * 2);
    recommendations.push('Review and process old pending orders');
  }

  return {
    qualityScore: Math.max(0, Math.round(totalScore)),
    issues,
    recommendations
  };
};