/**
 * Order Event System for Auto-Refresh
 * Provides cross-component communication for immediate UI updates
 */

type OrderEventType = 
  | 'order:created'
  | 'order:updated' 
  | 'order:deleted'
  | 'order:status_changed'
  | 'order:bulk_imported'
  | 'order:refresh_needed';

interface OrderEventData {
  orderId?: string;
  orderIds?: string[];
  count?: number;
  status?: string;
  timestamp: number;
}

class OrderEventEmitter {
  private listeners: Map<OrderEventType, Set<(data: OrderEventData) => void>> = new Map();

  emit(event: OrderEventType, data: Partial<OrderEventData> = {}) {
    const eventData: OrderEventData = {
      timestamp: Date.now(),
      ...data
    };

    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(eventData);
        } catch (error) {
          console.error(`Error in order event listener for ${event}:`, error);
        }
      });
    }

    // Always emit a generic refresh event for any order change
    if (event !== 'order:refresh_needed') {
      this.emit('order:refresh_needed', eventData);
    }

    console.log(`🔔 Order Event: ${event}`, eventData);
  }

  on(event: OrderEventType, listener: (data: OrderEventData) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // Return cleanup function
    return () => {
      this.off(event, listener);
    };
  }

  off(event: OrderEventType, listener: (data: OrderEventData) => void) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  removeAllListeners(event?: OrderEventType) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

// Global event emitter instance
export const orderEvents = new OrderEventEmitter();

// Convenience hooks for common operations
export const emitOrderCreated = (orderId: string) => 
  orderEvents.emit('order:created', { orderId });

export const emitOrderUpdated = (orderId: string) => 
  orderEvents.emit('order:updated', { orderId });

export const emitOrderDeleted = (orderId: string) => 
  orderEvents.emit('order:deleted', { orderId });

export const emitOrderStatusChanged = (orderId: string, status: string) => 
  orderEvents.emit('order:status_changed', { orderId, status });

export const emitOrdersBulkImported = (count: number) => 
  orderEvents.emit('order:bulk_imported', { count });

export const emitRefreshNeeded = () => 
  orderEvents.emit('order:refresh_needed');

// React hook for listening to order events
export const useOrderEvents = (
  event: OrderEventType, 
  handler: (data: OrderEventData) => void,
  deps: any[] = []
) => {
  const { useEffect } = require('react');
  
  useEffect(() => {
    const cleanup = orderEvents.on(event, handler);
    return cleanup;
  }, deps);
};
