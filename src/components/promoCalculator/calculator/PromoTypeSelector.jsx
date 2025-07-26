// 🎯 Selector dan form loader untuk tipe promo

import React, { lazy, Suspense } from 'react';
import { Gift, Percent, Package } from 'lucide-react';

// Lazy load form components
const BogoForm = lazy(() => import('./forms/BogoForm'));
const DiscountForm = lazy(() => import('./forms/DiscountForm'));
const BundleForm = lazy(() => import('./forms/BundleForm'));

const PromoTypeSelector = ({ selectedType, onTypeChange, onFormSubmit, isCalculating, recipes }) => {
  const promoTypes = [
    {
      id: 'bogo',
      name: 'BOGO',
      title: 'Buy One Get One',
      description: 'Beli satu gratis satu dengan syarat minimal pembelian',
      icon: Gift,
      color: 'bg-green-100 text-green-600 border-green-200',
      component: BogoForm
    },
    {
      id: 'discount',
      name: 'Diskon',
      title: 'Diskon Persentase/Nominal',
      description: 'Potongan harga dalam persentase atau nominal rupiah',
      icon: Percent,
      color: 'bg-blue-100 text-blue-600 border-blue-200',
      component: DiscountForm
    },
    {
      id: 'bundle',
      name: 'Bundle',
      title: 'Paket Bundle',
      description: 'Kombinasi beberapa produk dengan harga khusus',
      icon: Package,
      color: 'bg-purple-100 text-purple-600 border-purple-200',
      component: BundleForm
    }
  ];

  const ActiveForm = promoTypes.find(type => type.id === selectedType)?.component;

  return (
    <div className="space-y-6">
      {/* Type Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pilih Tipe Promo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {promoTypes.map(type => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            
            return (
              <button
                key={type.id}
                onClick={() => onTypeChange(type.id)}
                className={`
                  p-4 rounded-lg border-2 text-left transition-all hover:shadow-md
                  ${isSelected 
                    ? type.color + ' shadow-md' 
                    : 'bg-white border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <Icon className="h-5 w-5" />
                  <span className="font-semibold">{type.title}</span>
                </div>
                <p className="text-sm text-gray-600">{type.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Form */}
      {selectedType && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Konfigurasi {promoTypes.find(t => t.id === selectedType)?.title}
          </h4>
          
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
            </div>
          }>
            {ActiveForm && (
              <ActiveForm 
                onSubmit={onFormSubmit}
                isLoading={isCalculating}
                recipes={recipes}
              />
            )}
          </Suspense>
        </div>
      )}
    </div>
  );
};

export default PromoTypeSelector;