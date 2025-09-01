import React, { useEffect, useState } from 'react';
import { orderEvents } from '../orders/utils/orderEvents';
import type { OrderEventData } from '../orders/utils/orderEvents';

interface EventLog {
  id: string;
  event: string;
  data: OrderEventData;
  timestamp: string;
}

const OrderEventMonitor: React.FC = () => {
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Listen to all order events
    const events = [
      'order:created',
      'order:updated', 
      'order:deleted',
      'order:status_changed',
      'order:bulk_imported',
      'order:refresh_needed'
    ] as const;

    const unsubscribers = events.map(event => {
      return orderEvents.on(event, (data) => {
        const logEntry: EventLog = {
          id: Math.random().toString(36).substr(2, 9),
          event,
          data,
          timestamp: new Date().toISOString()
        };

        setEventLogs(prev => [logEntry, ...prev.slice(0, 19)]); // Keep last 20 events
        console.log(`🔔 OrderEventMonitor: ${event}`, data);
      });
    });

    return () => {
      unsubscribers.forEach(cleanup => cleanup());
    };
  }, []);

  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={`px-3 py-2 rounded-lg text-white font-mono text-sm ${
          eventLogs.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
        }`}
      >
        📡 Events ({eventLogs.length})
      </button>
      
      {isVisible && (
        <div className="absolute bottom-12 right-0 w-96 max-h-96 overflow-y-auto bg-white shadow-xl border rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-lg">Order Events Log</h3>
            <button
              onClick={() => setEventLogs([])}
              className="text-red-500 text-sm hover:text-red-700"
            >
              Clear
            </button>
          </div>
          
          {eventLogs.length === 0 ? (
            <p className="text-gray-500 text-sm">No events logged yet...</p>
          ) : (
            <div className="space-y-2">
              {eventLogs.map(log => (
                <div key={log.id} className="border-l-4 border-blue-500 pl-3 py-2 bg-gray-50 rounded-r">
                  <div className="flex justify-between items-start">
                    <span className={`font-mono text-xs px-2 py-1 rounded ${
                      log.event === 'order:refresh_needed' ? 'bg-yellow-100 text-yellow-800' :
                      log.event.includes('created') ? 'bg-green-100 text-green-800' :
                      log.event.includes('updated') || log.event.includes('status') ? 'bg-blue-100 text-blue-800' :
                      log.event.includes('deleted') ? 'bg-red-100 text-red-800' :
                      log.event.includes('bulk') ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {log.event}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <div className="mt-1 text-xs text-gray-600 font-mono">
                    {log.data.orderId && (
                      <div>Order: {log.data.orderId.slice(0, 8)}...</div>
                    )}
                    {log.data.orderIds && (
                      <div>Orders: {log.data.orderIds.length} items</div>
                    )}
                    {log.data.count && (
                      <div>Count: {log.data.count}</div>
                    )}
                    {log.data.status && (
                      <div>Status: {log.data.status}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderEventMonitor;
