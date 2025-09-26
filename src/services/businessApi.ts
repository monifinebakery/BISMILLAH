import { supabase } from '@/integrations/supabase/client'
import { logger } from '@/utils/logger'

// Types for our database tables
export interface Supplier {
  id: string
  name: string
  contact_person: string
  phone: string
  email: string
  address: string
  category: 'raw_materials' | 'specialty_ingredients' | 'packaging' | 'equipment' | 'dairy'
  rating: number
  total_orders: number
  total_value: number
  last_order: string
  status: 'active' | 'inactive'
  payment_terms: string
  notes: string
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  type: 'business' | 'individual'
  total_orders: number
  total_spent: number
  last_order: string
  status: 'active' | 'inactive'
  loyalty_points: number
  join_date: string
  notes: string
  rating: number
  created_at: string
  updated_at: string
}

export interface InventoryItem {
  id: string
  name: string
  category: 'raw_materials' | 'specialty_ingredients' | 'packaging' | 'equipment' | 'dairy'
  unit: string
  current_stock: number
  min_stock: number
  max_stock: number
  unit_price: number
  total_value: number
  supplier: string
  location: string
  expiry_date?: string
  status: 'good' | 'low' | 'critical' | 'out_of_stock'
  last_updated: string
  notes: string
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  customer_id: string
  order_date: string
  due_date: string
  total_amount: number
  status: 'pending' | 'processing' | 'ready' | 'delivered' | 'completed' | 'cancelled'
  payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded'
  delivery_status: 'pending' | 'shipped' | 'delivered'
  notes: string
  created_at: string
  updated_at: string
}

// API service functions for business management
export class BusinessApi {
  // Suppliers
  static async getSuppliers(): Promise<Supplier[]> {
    try {
      logger.info('Fetching suppliers from Supabase')
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        logger.error('Error fetching suppliers:', error)
        throw error
      }
      
      logger.info(`Successfully fetched ${data?.length || 0} suppliers`)
      return data as Supplier[]
    } catch (error) {
      logger.error('Failed to fetch suppliers:', error)
      throw error
    }
  }

  static async createSupplier(supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier> {
    try {
      logger.info('Creating new supplier:', supplier.name)
      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          ...supplier,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) {
        logger.error('Error creating supplier:', error)
        throw error
      }
      
      logger.info('Successfully created supplier:', data.id)
      return data as Supplier
    } catch (error) {
      logger.error('Failed to create supplier:', error)
      throw error
    }
  }

  static async updateSupplier(id: string, supplier: Partial<Supplier>): Promise<Supplier> {
    try {
      logger.info('Updating supplier:', id)
      const { data, error } = await supabase
        .from('suppliers')
        .update({ ...supplier, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        logger.error('Error updating supplier:', error)
        throw error
      }
      
      logger.info('Successfully updated supplier:', id)
      return data as Supplier
    } catch (error) {
      logger.error('Failed to update supplier:', error)
      throw error
    }
  }

  static async deleteSupplier(id: string): Promise<void> {
    try {
      logger.info('Deleting supplier:', id)
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id)
      
      if (error) {
        logger.error('Error deleting supplier:', error)
        throw error
      }
      
      logger.info('Successfully deleted supplier:', id)
    } catch (error) {
      logger.error('Failed to delete supplier:', error)
      throw error
    }
  }

  // Customers
  static async getCustomers(): Promise<Customer[]> {
    try {
      logger.info('Fetching customers from Supabase')
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        logger.error('Error fetching customers:', error)
        throw error
      }
      
      logger.info(`Successfully fetched ${data?.length || 0} customers`)
      return data as Customer[]
    } catch (error) {
      logger.error('Failed to fetch customers:', error)
      throw error
    }
  }

  static async createCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> {
    try {
      logger.info('Creating new customer:', customer.name)
      const { data, error } = await supabase
        .from('customers')
        .insert({
          ...customer,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) {
        logger.error('Error creating customer:', error)
        throw error
      }
      
      logger.info('Successfully created customer:', data.id)
      return data as Customer
    } catch (error) {
      logger.error('Failed to create customer:', error)
      throw error
    }
  }

  static async updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer> {
    try {
      logger.info('Updating customer:', id)
      const { data, error } = await supabase
        .from('customers')
        .update({ ...customer, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        logger.error('Error updating customer:', error)
        throw error
      }
      
      logger.info('Successfully updated customer:', id)
      return data as Customer
    } catch (error) {
      logger.error('Failed to update customer:', error)
      throw error
    }
  }

  static async deleteCustomer(id: string): Promise<void> {
    try {
      logger.info('Deleting customer:', id)
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)
      
      if (error) {
        logger.error('Error deleting customer:', error)
        throw error
      }
      
      logger.info('Successfully deleted customer:', id)
    } catch (error) {
      logger.error('Failed to delete customer:', error)
      throw error
    }
  }

  // Inventory
  static async getInventoryItems(): Promise<InventoryItem[]> {
    try {
      logger.info('Fetching inventory items from Supabase')
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        logger.error('Error fetching inventory items:', error)
        throw error
      }
      
      logger.info(`Successfully fetched ${data?.length || 0} inventory items`)
      return data as InventoryItem[]
    } catch (error) {
      logger.error('Failed to fetch inventory items:', error)
      throw error
    }
  }

  static async createInventoryItem(item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryItem> {
    try {
      logger.info('Creating new inventory item:', item.name)
      const { data, error } = await supabase
        .from('inventory')
        .insert({
          ...item,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) {
        logger.error('Error creating inventory item:', error)
        throw error
      }
      
      logger.info('Successfully created inventory item:', data.id)
      return data as InventoryItem
    } catch (error) {
      logger.error('Failed to create inventory item:', error)
      throw error
    }
  }

  static async updateInventoryItem(id: string, item: Partial<InventoryItem>): Promise<InventoryItem> {
    try {
      logger.info('Updating inventory item:', id)
      const { data, error } = await supabase
        .from('inventory')
        .update({ ...item, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        logger.error('Error updating inventory item:', error)
        throw error
      }
      
      logger.info('Successfully updated inventory item:', id)
      return data as InventoryItem
    } catch (error) {
      logger.error('Failed to update inventory item:', error)
      throw error
    }
  }

  static async deleteInventoryItem(id: string): Promise<void> {
    try {
      logger.info('Deleting inventory item:', id)
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id)
      
      if (error) {
        logger.error('Error deleting inventory item:', error)
        throw error
      }
      
      logger.info('Successfully deleted inventory item:', id)
    } catch (error) {
      logger.error('Failed to delete inventory item:', error)
      throw error
    }
  }

  // Orders
  static async getOrders(): Promise<(Order & { customer?: Pick<Customer, 'name' | 'email' | 'phone'> })[]> {
    try {
      logger.info('Fetching orders from Supabase')
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers (
            name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) {
        logger.error('Error fetching orders:', error)
        throw error
      }
      
      logger.info(`Successfully fetched ${data?.length || 0} orders`)
      return data as (Order & { customer?: Pick<Customer, 'name' | 'email' | 'phone'> })[]
    } catch (error) {
      logger.error('Failed to fetch orders:', error)
      throw error
    }
  }

  static async createOrder(order: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order> {
    try {
      logger.info('Creating new order for customer:', order.customer_id)
      const { data, error } = await supabase
        .from('orders')
        .insert({
          ...order,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) {
        logger.error('Error creating order:', error)
        throw error
      }
      
      logger.info('Successfully created order:', data.id)
      return data as Order
    } catch (error) {
      logger.error('Failed to create order:', error)
      throw error
    }
  }

  static async updateOrder(id: string, order: Partial<Order>): Promise<Order> {
    try {
      logger.info('Updating order:', id)
      const { data, error } = await supabase
        .from('orders')
        .update({ ...order, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        logger.error('Error updating order:', error)
        throw error
      }
      
      logger.info('Successfully updated order:', id)
      return data as Order
    } catch (error) {
      logger.error('Failed to update order:', error)
      throw error
    }
  }

  static async deleteOrder(id: string): Promise<void> {
    try {
      logger.info('Deleting order:', id)
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id)
      
      if (error) {
        logger.error('Error deleting order:', error)
        throw error
      }
      
      logger.info('Successfully deleted order:', id)
    } catch (error) {
      logger.error('Failed to delete order:', error)
      throw error
    }
  }

  // Dashboard stats
  static async getDashboardStats() {
    try {
      logger.info('Calculating dashboard stats')
      const [suppliers, customers, inventory, orders] = await Promise.all([
        this.getSuppliers(),
        this.getCustomers(),
        this.getInventoryItems(),
        this.getOrders()
      ])

      const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0)
      const activeOrders = orders.filter(order => 
        ['pending', 'processing', 'ready'].includes(order.status)
      ).length
      const inventoryItems = inventory.length
      const lowStockItems = inventory.filter(item => 
        item.current_stock <= item.min_stock
      ).length

      const stats = {
        totalRevenue,
        activeOrders,
        inventoryItems,
        lowStockItems,
        totalSuppliers: suppliers.length,
        totalCustomers: customers.length,
        recentOrders: orders.slice(0, 5),
        criticalStock: inventory
          .filter(item => item.current_stock <= item.min_stock * 0.5)
          .slice(0, 5)
      }

      logger.info('Successfully calculated dashboard stats')
      return stats
    } catch (error) {
      logger.error('Failed to calculate dashboard stats:', error)
      throw error
    }
  }
}