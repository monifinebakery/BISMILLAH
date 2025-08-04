// PromoCalculatorLayout.jsx - Complete layout with promo list and calculator
import React, { useState } from 'react';
import { Calculator, Gift, TrendingUp, Eye, Plus, ArrowLeft, List } from 'lucide-react';
import PromoCalculator from './calculator/PromoCalculator';
import PromoList from './promoList/PromoList';
import { usePromo } from './context/PromoContext';
import { useIsMobile } from '@/hooks/use-mobile';

const PromoCalculatorLayout = () => {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'list', 'calculator'
  const isMobile = useIsMobile(768);
  const { promos, isLoading } = usePromo();

  // Get recent promos for preview
  const recentPromos = promos.slice(0, 3);
  const activePromos = promos.filter(p => p.status === 'aktif');
  const draftPromos = promos.filter(p => p.status === 'draft');

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const getPromoTypeIcon = (type) => {
    const icons = {
      bogo: '🎁',
      discount: '💰', 
      bundle: '📦'
    };
    return icons[type] || '🎯';
  };

  const getStatusColor = (status) => {
    const colors = {
      aktif: 'bg-green-100 text-green-800',
      nonaktif: 'bg-gray-100 text-gray-800', 
      draft: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Calculator View
  if (currentView === 'calculator') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Calculator Header */}
          <div className="py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span className="text-sm font-medium">Kembali</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-lg font-semibold text-gray-900">Buat Promo Baru</h1>
            </div>
          </div>
          <PromoCalculator onBack={() => setCurrentView('dashboard')} />
        </div>
      </div>
    );
  }

  // List View
  if (currentView === 'list') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* List Header */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="text-sm font-medium">Dashboard</span>
                </button>
                <div className="h-6 w-px bg-gray-300"></div>
                <h1 className="text-lg font-semibold text-gray-900">Semua Promo</h1>
              </div>
              
              <button
                onClick={() => setCurrentView('calculator')}
                className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Buat Promo</span>
              </button>
            </div>
          </div>
          <PromoList />
        </div>
      </div>
    );
  }

  // Dashboard View (Default)
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 rounded-xl">
                <Calculator className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Kalkulator Promo</h1>
                <p className="text-gray-600 mt-1">Hitung profit margin dan dampak promo dengan akurat</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setCurrentView('list')}
                className="flex items-center space-x-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <List className="h-4 w-4" />
                <span>Lihat Semua</span>
              </button>
              
              <button
                onClick={() => setCurrentView('calculator')}
                className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 border-2 border-orange-400 hover:border-orange-500"
              >
                <Plus className="h-5 w-5" />
                <span>Buat Promo Baru</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-blue-300 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg border border-blue-200">
                <Gift className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Promo</p>
                <p className="text-2xl font-bold text-gray-900">{promos.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-green-300 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg border border-green-200">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Promo Aktif</p>
                <p className="text-2xl font-bold text-gray-900">{activePromos.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-purple-300 transition-colors">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg border border-purple-200">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Draft</p>
                <p className="text-2xl font-bold text-gray-900">{draftPromos.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Promos Preview */}
        <div className="bg-white rounded-xl border-2 border-gray-200">
          <div className="p-6 border-b-2 border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Promo Terbaru</h2>
              <button 
                onClick={() => setCurrentView('list')}
                className="text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors border border-orange-200 hover:border-orange-300 px-3 py-1 rounded-lg"
              >
                Lihat Semua
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Memuat promo...</p>
              </div>
            ) : recentPromos.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🎯</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum Ada Promo</h3>
                <p className="text-gray-600 mb-6">Mulai buat promo pertama Anda untuk meningkatkan penjualan</p>
                <button
                  onClick={() => setCurrentView('calculator')}
                  className="inline-flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Buat Promo Pertama</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {recentPromos.map((promo) => (
                  <div key={promo.id} className="border-2 border-gray-200 rounded-lg p-6 hover:border-orange-300 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getPromoTypeIcon(promo.tipePromo)}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900 line-clamp-1">{promo.namaPromo}</h3>
                          <p className="text-sm text-gray-600 capitalize">{promo.tipePromo}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(promo.status)}`}>
                        {promo.status}
                      </span>
                    </div>
                    
                    {promo.calculationResult && (
                      <div className="space-y-3">
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="grid grid-cols-1 gap-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Harga Normal:</span>
                              <span className="font-semibold text-gray-900">
                                {formatCurrency(promo.calculationResult.normalPrice)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Harga Promo:</span>
                              <span className="font-semibold text-orange-600">
                                {formatCurrency(promo.calculationResult.promoPrice)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Margin:</span>
                          <span className={`font-semibold ${
                            (promo.calculationResult.promoMargin || 0) >= 20 
                              ? 'text-green-600' 
                              : (promo.calculationResult.promoMargin || 0) >= 10 
                                ? 'text-yellow-600' 
                                : 'text-red-600'
                          }`}>
                            {(promo.calculationResult.promoMargin || 0).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {promo.deskripsi && (
                      <p className="text-sm text-gray-600 mt-3 line-clamp-2">{promo.deskripsi}</p>
                    )}
                    
                    <div className="mt-4 pt-4 border-t-2 border-gray-200">
                      <p className="text-xs text-gray-500">
                        Dibuat {new Date(promo.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {!isMobile && promos.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white border-2 border-orange-400">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Siap membuat promo baru?</h3>
                <p className="text-orange-100">Tingkatkan penjualan dengan strategi promo yang tepat</p>
              </div>
              <button
                onClick={() => setCurrentView('calculator')}
                className="bg-white text-orange-600 px-6 py-3 rounded-lg font-medium hover:bg-orange-50 transition-colors border-2 border-white hover:border-orange-100"
              >
                Mulai Sekarang
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromoCalculatorLayout;