// Real-time monitoring component untuk debug order updates
// Hanya tampil di development mode

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { useAuth } from '@/contexts/AuthContext';

interface RealtimeEvent {
  timestamp: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  oldRecord?: any;
  newRecord?: any;
}

interface FinancialSyncAttempt {
  timestamp: string;
  orderId: string;
  orderNumber: string;
  status: 'attempted' | 'success' | 'failed';
  error?: string;
}

const OrderUpdateMonitor: React.FC = () => {
  const { user } = useAuth();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [financialAttempts, setFinancialAttempts] = useState<FinancialSyncAttempt[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  const channelRef = useRef<any>(null);

  // Start monitoring
  const startMonitoring = async () => {
    if (!user?.id) return;
    
    setIsMonitoring(true);
    setConnectionStatus('connecting');
    
    try {
      // Setup real-time channel for orders
      const channel = supabase
        .channel(`order_monitor_${user.id}_${Date.now()}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          logger.debug('OrderMonitor: Real-time event received:', payload);
          
          setEvents(prev => [...prev, {
            timestamp: new Date().toISOString(),
            type: payload.eventType as any,
            table: 'orders',
            oldRecord: payload.old,
            newRecord: payload.new
          }].slice(-20)); // Keep only last 20 events
          
          // If it's a status update to completed, monitor for financial sync
          if (payload.eventType === 'UPDATE' && payload.new?.status === 'completed') {
            monitorFinancialSync(payload.new.id, payload.new.nomor_pesanan);
          }
        })
        .subscribe((status, err) => {
          logger.debug('OrderMonitor: Subscription status:', status, err);
          
          if (status === 'SUBSCRIBED') {
            setConnectionStatus('connected');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setConnectionStatus('disconnected');
          }
        });
      
      channelRef.current = channel;
      
    } catch (error) {
      logger.error('OrderMonitor: Error starting monitoring:', error);
      setConnectionStatus('disconnected');
    }
  };

  // Stop monitoring
  const stopMonitoring = async () => {
    setIsMonitoring(false);
    setConnectionStatus('disconnected');
    
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  };

  // Monitor financial sync for a specific order
  const monitorFinancialSync = async (orderId: string, orderNumber: string) => {
    if (!user?.id) return;
    
    setFinancialAttempts(prev => [...prev, {
      timestamp: new Date().toISOString(),
      orderId,
      orderNumber,
      status: 'attempted'
    }]);
    
    // Wait a bit then check if financial transaction was created
    setTimeout(async () => {
      try {
        const { data: financialTx, error } = await supabase
          .from('financial_transactions')
          .select('id, amount, description')
          .eq('user_id', user.id)
          .eq('description', `Pesanan ${orderNumber}`)
          .eq('type', 'income')
          .limit(1);
        
        if (error) {
          setFinancialAttempts(prev => 
            prev.map(attempt => 
              attempt.orderId === orderId && attempt.status === 'attempted'
                ? { ...attempt, status: 'failed', error: error.message }
                : attempt
            )
          );
        } else if (financialTx && financialTx.length > 0) {
          setFinancialAttempts(prev => 
            prev.map(attempt => 
              attempt.orderId === orderId && attempt.status === 'attempted'
                ? { ...attempt, status: 'success' }
                : attempt
            )
          );
        } else {
          setFinancialAttempts(prev => 
            prev.map(attempt => 
              attempt.orderId === orderId && attempt.status === 'attempted'
                ? { ...attempt, status: 'failed', error: 'No financial transaction found' }
                : attempt
            )
          );
        }
      } catch (error) {
        logger.error('OrderMonitor: Error checking financial sync:', error);
      }
    }, 3000); // Wait 3 seconds for sync to complete
  };

  // Manual test status update
  const testStatusUpdate = async () => {
    if (!user?.id) return;
    
    try {
      // Get a test order
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'completed')
        .limit(1);
      
      if (!orders || orders.length === 0) {
        logger.warn('No non-completed orders found for testing');
        return;
      }
      
      const testOrder = orders[0];
      logger.debug('Testing status update with order:', testOrder.nomor_pesanan);
      
      // Update to completed
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', testOrder.id)
        .eq('user_id', user.id);
      
      if (error) {
        logger.error('Test status update failed:', error);
      } else {
        logger.success('Test status update successful:', testOrder.nomor_pesanan);
      }
      
    } catch (error) {
      logger.error('Error in test status update:', error);
    }
  };

  // Clear events
  const clearEvents = () => {
    setEvents([]);
    setFinancialAttempts([]);
  };

  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // Only show in development
  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white border-2 border-blue-500 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-blue-600">🔍 Order Monitor</h3>
        <div className="flex gap-2">
          <button
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            className={`px-2 py-1 rounded text-xs font-bold ${
              isMonitoring 
                ? 'bg-red-500 text-white' 
                : 'bg-green-500 text-white'
            }`}
          >
            {isMonitoring ? 'Stop' : 'Start'}
          </button>
          <button
            onClick={clearEvents}
            className="px-2 py-1 bg-gray-500 text-white rounded text-xs"
          >
            Clear
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="text-xs">
          Status: 
          <span className={`ml-1 font-bold ${
            connectionStatus === 'connected' ? 'text-green-600' :
            connectionStatus === 'connecting' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {connectionStatus.toUpperCase()}
          </span>
        </div>
        
        <div className="text-xs">
          Events: <span className="font-bold">{events.length}</span>
        </div>
        
        <div className="text-xs">
          Financial Attempts: <span className="font-bold">{financialAttempts.length}</span>
        </div>
        
        {/* Test button */}
        <button
          onClick={testStatusUpdate}
          className="w-full px-2 py-1 bg-blue-500 text-white rounded text-xs font-bold"
        >
          🧪 Test Status Update
        </button>
        
        {/* Recent events */}
        <div className="max-h-40 overflow-y-auto text-xs space-y-1">
          <div className="font-bold">📡 Real-time Events:</div>
          {events.slice(-5).map((event, index) => (
            <div key={index} className="p-1 bg-gray-100 rounded">
              <div className="font-bold">{event.type}</div>
              {event.newRecord && (
                <div>#{event.newRecord.nomor_pesanan} → {event.newRecord.status}</div>
              )}
              <div className="text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</div>
            </div>
          ))}
          
          <div className="font-bold mt-2">💰 Financial Sync:</div>
          {financialAttempts.slice(-3).map((attempt, index) => (
            <div key={index} className="p-1 bg-gray-100 rounded">
              <div className={`font-bold ${
                attempt.status === 'success' ? 'text-green-600' :
                attempt.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {attempt.status.toUpperCase()}
              </div>
              <div>#{attempt.orderNumber}</div>
              {attempt.error && (
                <div className="text-red-600 text-xs">{attempt.error}</div>
              )}
              <div className="text-gray-500">{new Date(attempt.timestamp).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderUpdateMonitor;
