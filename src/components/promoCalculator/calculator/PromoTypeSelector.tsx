// src › components › promoCalculator › calculator ›  PromoTypeSelector.jsx
// 🎯 Selector dan form loader untuk tipe promo
import React, { lazy, Suspense } from 'react';
import { Gift, Percent, Package } from 'lucide-react';

// ✅ Pure lazy loading - tidak konflik dengan static imports
const BogoForm = lazy(() => import('./forms/BogoForm'));
const DiscountForm = lazy(() => import('./forms/DiscountForm'));
const BundleForm = lazy(() => import('./forms/BundleForm'));

const PromoTypeSelector = ({ selectedType, onTypeChange, onFormSubmit, isCalculating, recipes }: any) => {
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

  const selectedPromoType = promoTypes.find(type => type.id === selectedType);
  const ActiveFormComponent = selectedPromoType?.component;

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
                  p-4 rounded-lg border-2 text-left transition-all
                  ${isSelected 
                    ? type.color 
                    : 'bg-white border-gray-500 hover:border-gray-500'
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

      {/* Dynamic Form - Pure Lazy Loading */}
      {selectedType && ActiveFormComponent && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Konfigurasi {selectedPromoType.title}
          </h4>
          
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mr-2"></div>
              <span className="text-gray-600">Memuat form {selectedPromoType.name}...</span>
            </div>
          }>
            <ActiveFormComponent 
              onSubmit={onFormSubmit}
              isLoading={isCalculating}
              recipes={recipes}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
};

export default PromoTypeSelector;