// 🎯 Layout utama dengan tabs navigation

import React, { useState, lazy, Suspense } from 'react';
import { Calculator, List, BarChart3, Plus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

// Lazy load tab components
const PromoCalculator = lazy(() => import('./calculator/PromoCalculator'));
const PromoList = lazy(() => import('./promoList/PromoList'));
const PromoAnalytics = lazy(() => import('./analytics/PromoAnalytics'));

const PromoCalculatorLayout = () => {
  const [activeTab, setActiveTab] = useState('calculator');

  const tabs = [
    {
      id: 'calculator',
      label: 'Kalkulator',
      icon: Calculator,
      component: PromoCalculator
    },
    {
      id: 'list',
      label: 'Daftar Promo',
      icon: List,
      component: PromoList
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      component: PromoAnalytics
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-orange-100 p-2 rounded-lg">
            <Calculator className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kalkulator Promo</h1>
            <p className="text-gray-600">Kelola dan analisis promo produk dengan kalkulasi HPP otomatis</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${isActive 
                    ? 'border-orange-500 text-orange-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200">
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        }>
          {ActiveComponent && <ActiveComponent />}
        </Suspense>
      </div>
    </div>
  );
};

export default PromoCalculatorLayout;