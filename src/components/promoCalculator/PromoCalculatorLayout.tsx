// PromoCalculatorLayout.jsx - Updated dengan struktur folder yang benar
import React, { useState, Suspense } from 'react';
import { Calculator, List, ArrowLeft, Plus } from 'lucide-react';
import { usePromo } from './context/PromoContext';
import { useIsMobile } from '@/hooks/use-mobile';

// Lazy load komponen dengan path yang benar sesuai struktur folder
const PromoCalculator = React.lazy(() => 
  import('./calculator/PromoCalculator').catch(err => {
    console.error('Failed to load PromoCalculator:', err);
    return { 
      default: () => (
        <div className="p-8 text-center bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-500 text-lg mb-2">❌ Gagal memuat PromoCalculator</div>
          <p className="text-sm text-red-600 mb-4">Error: {err.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            Reload Page
          </button>
        </div>
      )
    };
  })
);

const PromoList = React.lazy(() => 
  import('./promoList/PromoList').catch(err => {
    console.error('Failed to load PromoList:', err);
    return { 
      default: () => (
        <div className="p-8 text-center bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-500 text-lg mb-2">❌ Gagal memuat PromoList</div>
          <p className="text-sm text-red-600 mb-4">Error: {err.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            Reload Page
          </button>
        </div>
      )
    };
  })
);

// Enhanced Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy loading error details:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      props: this.props
    });
    
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState(prevState => ({ 
      hasError: false, 
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
    
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center border-2 border-dashed border-red-200 rounded-lg bg-red-50">
          <div className="text-red-500 text-lg mb-2">⚠️ Gagal memuat komponen</div>
          
          <div className="text-left bg-red-100 p-4 rounded mb-4 max-w-md mx-auto">
            <p className="text-sm text-red-800 mb-2">
              <strong>Error:</strong> {this.state.error?.message}
            </p>
            <p className="text-sm text-red-800 mb-2">
              <strong>Type:</strong> {this.state.error?.name}
            </p>
            <p className="text-sm text-red-800">
              <strong>Retry Count:</strong> {this.state.retryCount}
            </p>
          </div>

          <div className="space-x-2">
            <button
              onClick={this.handleRetry}
              disabled={this.state.retryCount >= 3}
              className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {this.state.retryCount >= 3 ? 'Max Retries Reached' : `Coba Lagi (${this.state.retryCount}/3)`}
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded font-medium transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const PromoCalculatorLayout = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const isMobile = useIsMobile(768);
  const { promos = [], isLoading } = usePromo();

  // Utility functions
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
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
      draft: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // CSS Classes
  const styles = {
    buttonPrimary: "bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2",
    buttonSecondary: "flex items-center space-x-2 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors",
    containerLayout: "min-h-screen bg-gray-50",
    mainContent: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",
    loadingSpinner: "animate-spin rounded-full border-t-2 border-b-2 border-orange-500",
    card: "bg-white p-6 rounded-xl shadow-sm border border-gray-200"
  };

  const recentPromos = promos.slice(0, 3);

  const handleRetry = () => {
    console.log('Retrying component load...');
    window.location.reload();
  };

  const handleBack = () => {
    setCurrentView('dashboard');
  };

  // Enhanced Loading Component
  const LoadingFallback = ({ message = "Memuat...", size = "medium" }) => {
    const sizeClasses = {
      small: "h-4 w-4",
      medium: "h-8 w-8",
      large: "h-12 w-12"
    };

    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className={`inline-block ${styles.loadingSpinner} ${sizeClasses[size]} mb-4`}></div>
          <p className="text-gray-600 text-sm">{message}</p>
        </div>
      </div>
    );
  };

  // Enhanced Lazy Component Wrapper
  const LazyComponent = ({ children, fallback, onRetry, componentName }) => {
    return (
      <ErrorBoundary onRetry={onRetry}>
        <Suspense 
          fallback={
            fallback || <LoadingFallback message={`Memuat ${componentName}...`} />
          }
        >
          {children}
        </Suspense>
      </ErrorBoundary>
    );
  };

  // Promo Card Component
  const PromoCard = ({ promo }) => (
    <div className={styles.card}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getPromoTypeIcon(promo.tipePromo)}</span>
          <div>
            <h3 className="font-semibold text-gray-900 truncate max-w-[200px]">
              {promo.namaPromo}
            </h3>
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
                <span>Harga Jual:</span>
                <span className="font-medium">
                  {formatCurrency(promo.calculationResult.finalPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Margin:</span>
                <span className={
                  (promo.calculationResult.promoMargin || 0) < 5
                    ? 'text-red-600'
                    : (promo.calculationResult.promoMargin || 0) >= 10
                      ? 'text-yellow-600'
                      : 'text-green-600'
                }>
                  {(promo.calculationResult.promoMargin || 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {promo.deskripsi && (
        <p className="text-sm text-gray-600 mt-3 truncate">{promo.deskripsi}</p>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Dibuat {new Date(promo.createdAt).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      </div>
    </div>
  );

  // Dashboard View
  if (currentView === 'dashboard') {
    return (
      <div className={styles.containerLayout}>
        <div className={styles.mainContent}>
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Calculator className="h-8 w-8 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Kalkulator Promo</h1>
                  <p className="text-gray-600 mt-1">
                    Hitung profit margin dan dampak promo dengan akurat
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setCurrentView('list')} 
                  className={styles.buttonSecondary}
                >
                  <List className="h-4 w-4" />
                  <span>Lihat Semua</span>
                </button>
                <button 
                  onClick={() => setCurrentView('calculator')} 
                  className={styles.buttonPrimary}
                >
                  <Plus className="h-4 w-4" />
                  <span>Buat Promo</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <LoadingFallback message="Memuat promo..." size="large" />
          ) : recentPromos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum Ada Promo</h3>
              <p className="text-gray-600 mb-6">
                Mulai buat promo pertama Anda untuk meningkatkan penjualan
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {recentPromos.map((promo) => (
                  <PromoCard key={promo.id} promo={promo} />
                ))}
              </div>

              {/* Quick Actions - Desktop Only */}
              {!isMobile && (
                <div className="mt-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white border-2 border-orange-400">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Siap membuat promo baru?</h3>
                      <p className="text-orange-100">
                        Tingkatkan penjualan dengan strategi promo yang tepat
                      </p>
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
            </>
          )}
        </div>
      </div>
    );
  }

  // Calculator View
  if (currentView === 'calculator') {
    return (
      <div className={styles.containerLayout}>
        <div className={styles.mainContent}>
          <div className="mb-6">
            <button 
              onClick={handleBack} 
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Kembali</span>
            </button>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <LazyComponent 
              fallback={<LoadingFallback message="Memuat kalkulator promo..." />}
              onRetry={handleRetry}
              componentName="Kalkulator Promo"
            >
              <PromoCalculator onBack={handleBack} />
            </LazyComponent>
          </div>
        </div>
      </div>
    );
  }

  // List View
  if (currentView === 'list') {
    return (
      <div className={styles.containerLayout}>
        <div className="max-w-7xl mx-auto">
          {/* List Header */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-900">Daftar Promo</h1>
              <button 
                onClick={() => setCurrentView('calculator')} 
                className={styles.buttonPrimary}
              >
                <Plus className="h-4 w-4" />
                <span>Buat Promo</span>
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-t-xl shadow-sm border border-gray-200">
            <LazyComponent 
              fallback={<LoadingFallback message="Memuat daftar promo..." />}
              onRetry={handleRetry}
              componentName="Daftar Promo"
            >
              <PromoList />
            </LazyComponent>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default PromoCalculatorLayout;