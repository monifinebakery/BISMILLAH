// =============================================
// HEYTRACK - Business Management Types
// =============================================

// Common Types
export type UUID = string;
export type DatabaseStatus = 'active' | 'inactive';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded';
export type OrderStatus = 'pending' | 'processing' | 'ready' | 'delivered' | 'completed' | 'cancelled';
export type PurchaseOrderStatus = 'pending' | 'ordered' | 'shipped' | 'received' | 'completed' | 'cancelled';
export type DeliveryStatus = 'pending' | 'shipped' | 'delivered';
export type InventoryStatus = 'out_of_stock' | 'critical' | 'low' | 'good';
export type InventoryCategory = 'raw_materials' | 'specialty_ingredients' | 'packaging' | 'equipment' | 'dairy';
export type InventoryUnit = 'kg' | 'g' | 'l' | 'ml' | 'pcs' | 'unit' | 'box' | 'pack';
export type CustomerType = 'business' | 'individual';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type RecipeDifficulty = 'easy' | 'medium' | 'hard';

// Base interface for all entities
export interface BaseEntity {
  id: UUID;
  created_at: string;
  updated_at: string;
}

// =============================================
// CUSTOMERS
// =============================================
export interface Customer extends BaseEntity {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  type: CustomerType;
  total_orders: number;
  total_spent: number;
  last_order?: string; // Date
  status: DatabaseStatus;
  loyalty_points: number;
  join_date: string; // Date
  notes?: string;
  rating: number;
}

export interface CustomerCreateRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  type: CustomerType;
  notes?: string;
  rating?: number;
}

export interface CustomerUpdateRequest extends Partial<CustomerCreateRequest> {
  status?: DatabaseStatus;
  loyalty_points?: number;
}

// =============================================
// INVENTORY
// =============================================
export interface InventoryItem extends BaseEntity {
  name: string;
  category: InventoryCategory;
  unit: InventoryUnit;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  unit_price: number;
  total_value: number; // Computed field
  supplier?: string;
  location?: string;
  expiry_date?: string; // Date
  status: InventoryStatus; // Computed field
  last_updated: string; // Date
  notes?: string;
}

export interface InventoryCreateRequest {
  name: string;
  category: InventoryCategory;
  unit: InventoryUnit;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  unit_price: number;
  supplier?: string;
  location?: string;
  expiry_date?: string;
  notes?: string;
}

export interface InventoryUpdateRequest extends Partial<InventoryCreateRequest> {}

// =============================================
// ORDERS
// =============================================
export interface Order extends BaseEntity {
  customer_id: UUID;
  customer?: Customer; // Populated when needed
  order_date: string; // Date
  due_date?: string; // Date
  total_amount: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  delivery_status: DeliveryStatus;
  notes?: string;
  items?: OrderItem[]; // Populated when needed
}

export interface OrderItem extends BaseEntity {
  order_id: UUID;
  inventory_id?: UUID;
  inventory_item?: InventoryItem; // Populated when needed
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number; // Computed field
  notes?: string;
}

export interface OrderCreateRequest {
  customer_id: UUID;
  due_date?: string;
  notes?: string;
  items: OrderItemCreateRequest[];
}

export interface OrderItemCreateRequest {
  inventory_id?: UUID;
  item_name: string;
  quantity: number;
  unit_price: number;
  notes?: string;
}

export interface OrderUpdateRequest {
  due_date?: string;
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  delivery_status?: DeliveryStatus;
  notes?: string;
}

// =============================================
// PURCHASE ORDERS
// =============================================
export interface PurchaseOrder extends BaseEntity {
  supplier_id: UUID;
  supplier?: any; // Supplier type from existing supplier.ts
  purchase_date: string; // Date
  expected_delivery?: string; // Date
  total_amount: number;
  status: PurchaseOrderStatus;
  payment_status: PaymentStatus;
  notes?: string;
  items?: PurchaseOrderItem[]; // Populated when needed
}

export interface PurchaseOrderItem extends BaseEntity {
  purchase_order_id: UUID;
  inventory_id?: UUID;
  inventory_item?: InventoryItem; // Populated when needed
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number; // Computed field
  received_quantity: number;
  notes?: string;
}

export interface PurchaseOrderCreateRequest {
  supplier_id: UUID;
  expected_delivery?: string;
  notes?: string;
  items: PurchaseOrderItemCreateRequest[];
}

export interface PurchaseOrderItemCreateRequest {
  inventory_id?: UUID;
  item_name: string;
  quantity: number;
  unit_price: number;
  notes?: string;
}

export interface PurchaseOrderUpdateRequest {
  expected_delivery?: string;
  status?: PurchaseOrderStatus;
  payment_status?: PaymentStatus;
  notes?: string;
}

// =============================================
// RECIPES
// =============================================
export interface Recipe extends BaseEntity {
  name: string;
  description?: string;
  category?: string;
  serving_size: number;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  difficulty_level?: RecipeDifficulty;
  cost_per_serving: number;
  selling_price: number;
  profit_margin: number; // Computed field
  instructions?: string;
  notes?: string;
  is_active: boolean;
  ingredients?: RecipeIngredient[]; // Populated when needed
}

export interface RecipeIngredient extends BaseEntity {
  recipe_id: UUID;
  inventory_id?: UUID;
  inventory_item?: InventoryItem; // Populated when needed
  ingredient_name: string;
  quantity: number;
  unit: string;
  cost_per_unit: number;
  total_cost: number; // Computed field
  notes?: string;
}

export interface RecipeCreateRequest {
  name: string;
  description?: string;
  category?: string;
  serving_size: number;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  difficulty_level?: RecipeDifficulty;
  cost_per_serving?: number;
  selling_price?: number;
  instructions?: string;
  notes?: string;
  ingredients: RecipeIngredientCreateRequest[];
}

export interface RecipeIngredientCreateRequest {
  inventory_id?: UUID;
  ingredient_name: string;
  quantity: number;
  unit: string;
  cost_per_unit: number;
  notes?: string;
}

export interface RecipeUpdateRequest extends Partial<Omit<RecipeCreateRequest, 'ingredients'>> {
  is_active?: boolean;
}

// =============================================
// FINANCIAL TRANSACTIONS
// =============================================
export interface FinancialTransaction extends BaseEntity {
  transaction_date: string; // Date
  type: TransactionType;
  category: string;
  amount: number;
  description?: string;
  reference_type?: string; // 'order', 'purchase_order', 'manual', etc.
  reference_id?: UUID; // ID of the related order/purchase/etc.
  payment_method?: string;
  account?: string;
  receipt_url?: string;
  notes?: string;
}

export interface FinancialTransactionCreateRequest {
  transaction_date?: string;
  type: TransactionType;
  category: string;
  amount: number;
  description?: string;
  reference_type?: string;
  reference_id?: UUID;
  payment_method?: string;
  account?: string;
  receipt_url?: string;
  notes?: string;
}

export interface FinancialTransactionUpdateRequest extends Partial<FinancialTransactionCreateRequest> {}

// =============================================
// API RESPONSE TYPES
// =============================================
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ApiError {
  message: string;
  details?: any;
  code?: string | number;
}

// =============================================
// SEARCH & FILTER TYPES
// =============================================
export interface SearchParams {
  query?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface CustomerSearchParams extends SearchParams {
  type?: CustomerType;
  status?: DatabaseStatus;
  min_total_spent?: number;
  max_total_spent?: number;
}

export interface InventorySearchParams extends SearchParams {
  category?: InventoryCategory;
  status?: InventoryStatus;
  supplier?: string;
  low_stock_only?: boolean;
}

export interface OrderSearchParams extends SearchParams {
  customer_id?: UUID;
  status?: OrderStatus;
  payment_status?: PaymentStatus;
  delivery_status?: DeliveryStatus;
  date_from?: string;
  date_to?: string;
}

export interface PurchaseOrderSearchParams extends SearchParams {
  supplier_id?: UUID;
  status?: PurchaseOrderStatus;
  payment_status?: PaymentStatus;
  date_from?: string;
  date_to?: string;
}

export interface RecipeSearchParams extends SearchParams {
  category?: string;
  difficulty_level?: RecipeDifficulty;
  is_active?: boolean;
  min_profit_margin?: number;
}

export interface FinancialTransactionSearchParams extends SearchParams {
  type?: TransactionType;
  category?: string;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
  reference_type?: string;
}