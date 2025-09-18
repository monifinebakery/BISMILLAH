// src/lib/shared/examples/UsageExamples.tsx
// Contoh implementasi shared components untuk referensi developer

import React from 'react';
import { 
  CurrencyDisplay, 
  StatusBadge, 
  DateDisplay,
  PercentageDisplay,
  StatCard,
  TruncatedText 
} from '../index';
import { Package, TrendingUp, DollarSign } from 'lucide-react';

/**
 * Contoh penggunaan CurrencyDisplay
 */
export const CurrencyExamples = () => {
  return (
    <div className="space-y-4 p-6 bg-white rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">CurrencyDisplay Examples</h3>
      
      {/* Basic usage */}
      <div>
        <label className="text-sm text-gray-600">Basic:</label>
        <CurrencyDisplay value={1500000} className="text-2xl font-bold" />
      </div>
      
      {/* Compact mode */}
      <div>
        <label className="text-sm text-gray-600">Compact:</label>
        <CurrencyDisplay value={1500000} compact className="text-2xl font-bold" />
      </div>
      
      {/* Very large numbers */}
      <div>
        <label className="text-sm text-gray-600">Miliar:</label>
        <CurrencyDisplay value={2500000000} compact className="text-2xl font-bold" />
      </div>
      
      {/* Custom threshold */}
      <div>
        <label className="text-sm text-gray-600">Custom threshold (10K):</label>
        <CurrencyDisplay 
          value={5000} 
          compact 
          compactThreshold={10000}
          className="text-2xl font-bold" 
        />
      </div>
    </div>
  );
};

/**
 * Contoh penggunaan StatusBadge
 */
export const StatusExamples = () => {
  const statuses = [
    'pending', 'confirmed', 'processing', 'completed', 'cancelled', 'delivered'
  ];
  
  return (
    <div className="space-y-4 p-6 bg-white rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">StatusBadge Examples</h3>
      
      {/* Different statuses */}
      <div className="space-y-2">
        {statuses.map(status => (
          <div key={status} className="flex items-center gap-4">
            <span className="w-20 text-sm text-gray-600">{status}:</span>
            <StatusBadge status={status} />
            <StatusBadge status={status} size="lg" />
            <StatusBadge status={status} variant="outline" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Contoh penggunaan StatCard
 */
export const StatCardExamples = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Currency with trend */}
      <StatCard
        label="Total Pendapatan"
        value={15500000}
        formatter="currency"
        compact
        icon={<DollarSign />}
        trend={{ value: 12.5, isPositive: true }}
        colorized
      />
      
      {/* Percentage */}
      <StatCard
        label="Profit Margin"
        value={0.25}
        formatter="percentage"
        icon={<TrendingUp />}
        trend={{ value: 3.2, isPositive: true }}
        colorized
      />
      
      {/* Number */}
      <StatCard
        label="Total Orders"
        value={1234}
        formatter="number"
        icon={<Package />}
        trend={{ value: -2.1, isPositive: false }}
      />
      
      {/* Custom formatter */}
      <StatCard
        label="Average Order Value"
        value={125000}
        customFormatter={(val) => `${(val as number).toLocaleString('id-ID')} per order`}
        colorized
      />
    </div>
  );
};

/**
 * Contoh penggunaan dalam Dashboard
 */
export const DashboardExample = () => {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold mb-6">Dashboard dengan Shared Components</h2>
      
      {/* Revenue section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600 mb-1">Today's Revenue</div>
          <CurrencyDisplay value={2500000} compact className="text-xl font-bold" />
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600 mb-1">Monthly Target</div>
          <PercentageDisplay value={0.73} className="text-xl font-bold" colorized />
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600 mb-1">Order Status</div>
          <StatusBadge status="processing" />
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600 mb-1">Last Updated</div>
          <DateDisplay date={new Date()} relative className="text-sm" />
        </div>
      </div>
      
      {/* Detailed stats */}
      <StatCardExamples />
    </div>
  );
};

/**
 * Contoh penggunaan di Order List
 */
export const OrderListExample = () => {
  const orders = [
    {
      id: 'ORD001',
      customerName: 'John Doe yang memiliki nama sangat panjang sekali',
      total: 1500000,
      status: 'pending',
      date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: 'ORD002', 
      customerName: 'Jane Smith',
      total: 750000,
      status: 'completed',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    }
  ];
  
  return (
    <div className="space-y-4 p-6">
      <h3 className="text-lg font-semibold mb-4">Order List dengan Shared Components</h3>
      
      <div className="space-y-3">
        {orders.map(order => (
          <div key={order.id} className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-sm">{order.id}</span>
                  <StatusBadge status={order.status} size="sm" />
                </div>
                <TruncatedText 
                  text={order.customerName} 
                  maxLength={30}
                  className="text-gray-700"
                />
                <DateDisplay 
                  date={order.date} 
                  relative 
                  className="text-xs text-gray-500"
                />
              </div>
              
              <div className="text-right">
                <CurrencyDisplay 
                  value={order.total} 
                  compact 
                  className="font-bold text-lg"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Default export dengan semua examples
export default {
  CurrencyExamples,
  StatusExamples, 
  StatCardExamples,
  DashboardExample,
  OrderListExample
};