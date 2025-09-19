// PromoCalculatorLayout.tsx - Updated with useQuery for promos data
import React, { useState, Suspense, Component, ErrorInfo, ReactNode } from 'react';
import { Calculator, List, ArrowLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PromoCard from './components/PromoCard';
import { logger } from '@/utils/logger';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Import services
// @ts-ignore - promoService is a JS file
import { promoService } from './services/promoService';

// Types
interface PromoData {
  id: string;
  namaPromo: string;
  tipePromo: string;
  status: string;
  deskripsi: string;
  tanggalMulai: string | null;
  tanggalSelesai: string | null;
  dataPromo: any;
  calculationResult: any;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  onRetry?: () => void;
}

// Lazy load komponen dengan path yang benar sesuai struktur folder
const PromoCalculator = React.lazy(() => 
  import('./calculator/PromoCalculator').catch(err => {
    logger.error('Failed to load PromoCalculator:', err);
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
    logger.error('Failed to load PromoList:', err);
    return { 
      default: () => (
        <div className="p-8 text-center bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-500 text-lg mb-2">❌ Gagal memuat PromoList</div>
          <p className="text-sm text-red-600 mb-4">Error: {err instanceof Error ? err.message : String(err)}</p>
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
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Lazy loading error details:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
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
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // ✅ useQuery for promos data
  const { 
    data: promos = [], 
    isLoading,
    error: promosError,
    refetch: refetchPromos
  } = useQuery<PromoData[]>({
    queryKey: ['promos'],
    queryFn: promoService.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes - promos can change frequently
    gcTime: 15 * 60 * 1000, // 15 minutes (renamed from cacheTime)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    throwOnError: false
  });

  // ✅ Mutations for promo operations
  const deletePromoMutation = useMutation({
    mutationFn: (id: string) => promoService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promos'] });
      toast.success('Promo berhasil dihapus');
    },
    onError: (error: Error) => {
      toast.error(`Gagal menghapus promo: ${error.message}`);
    }
  });

  const updatePromoMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PromoData> }) => promoService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promos'] });
      toast.success('Promo berhasil diperbarui');
    },
    onError: (error: Error) => {
      toast.error(`Gagal memperbarui promo: ${error.message}`);
    }
  });

  const createPromoMutation = useMutation({
    mutationFn: (data: Partial<PromoData>) => promoService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promos'] });
      toast.success('Promo berhasil diduplikat');
    },
    onError: (error: Error) => {
      toast.error(`Gagal menduplikat promo: ${error.message}`);
    }
  });

  // Utility functions

  const getPromoTypeIcon = (type: string) => {
    const icons: Record<string, string> = { 
      bogo: '🎁', 
      discount: '💰', 
      bundle: '📦' 
    };
    return icons[type] || '🎯';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
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
    mainContent: "w-full px-4 sm:px-6 lg:px-8 py-8",
    loadingSpinner: "animate-spin rounded-full border-t-2 border-b-2 border-orange-500",
    card: "bg-white p-6 rounded-xl border border-gray-200"
  };

  const recentPromos = promos.slice(0, 3);

  const handleRetry = () => {
    logger.context('PromoCalculatorLayout', 'Retrying component load...');
    window.location.reload();
  };

  const handleBack = () => {
    setCurrentView('dashboard');
  };

  // ✅ Promo action handlers with mutations
  const handleEditPromo = (promo: PromoData) => {
    logger.context('PromoCalculatorLayout', 'Edit promo:', promo);
    navigate(`/promo/edit/${promo.id}`);
  };

  const handleDeletePromo = async (promo: PromoData) => {
    if (window.confirm(`Hapus promo "${promo.namaPromo}"?`)) {
      deletePromoMutation.mutate(promo.id);
    }
  };

  const handleViewPromo = (promo: PromoData) => {
    logger.context('PromoCalculatorLayout', 'View promo:', promo);
    navigate(`/promo/edit/${promo.id}`);
  };

  const handleDuplicatePromo = (promo: PromoData) => {
    const duplicatedData: Partial<PromoData> = {
      namaPromo: `${promo.namaPromo} (Copy)`,
      tipePromo: promo.tipePromo,
      status: 'draft',
      deskripsi: promo.deskripsi,
      tanggalMulai: null,
      tanggalSelesai: null,
      dataPromo: promo.dataPromo,
      calculationResult: promo.calculationResult
    };

    logger.context('PromoCalculatorLayout', 'Duplicate promo:', duplicatedData);
    createPromoMutation.mutate(duplicatedData);
  };

  
  const LoadingFallback = ({ size = "medium" }: { size?: "small" | "medium" | "large" }) => {
    const sizeClasses: Record<string, string> = {
      small: "h-4 w-4",
      medium: "h-8 w-8",
      large: "h-12 w-12"
    };

    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-3">
          <div className={`${sizeClasses[size]} bg-gray-200 rounded-full animate-pulse mx-auto`}></div>
          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mx-auto"></div>
        </div>
      </div>
    );
  };

  // Enhanced Lazy Component Wrapper
  const LazyComponent = ({ children, fallback, onRetry, componentName }: {
    children: ReactNode;
    fallback?: ReactNode;
    onRetry?: () => void;
    componentName?: string;
  }) => {
    return (
      <ErrorBoundary onRetry={onRetry}>
        <Suspense 
          fallback={
            fallback || <LoadingFallback />
          }
        >
          {children}
        </Suspense>
      </ErrorBoundary>
    );
  };

  // Error Display Component
  const ErrorDisplay = ({ title = "Error", message, onRetry }: {
    title?: string;
    message: string;
    onRetry?: () => void;
  }) => (
    <div className="p-8 text-center border-2 border-dashed border-red-200 rounded-lg bg-red-50">
      <div className="text-red-500 text-lg mb-2">⚠️ {title}</div>
      <p className="text-gray-600 text-sm mb-4">{message}</p>
      <div className="space-x-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded font-medium transition-colors"
          >
            Coba Lagi
          </button>
        )}
        <button
          onClick={() => window.location.reload()}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded font-medium transition-colors"
        >
          Refresh Halaman
        </button>
      </div>
    </div>
  );

  // Enhanced Promo Grid Component
  const PromoGrid = ({ promos, onCreateNew }: {
    promos: PromoData[];
    onCreateNew: () => void;
  }) => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {promos.map((promo) => (
          <PromoCard 
            key={promo.id} 
            promo={promo}
            onEdit={handleEditPromo}
            onDelete={handleDeletePromo}
            onView={handleViewPromo}
            onDuplicate={handleDuplicatePromo}
            showActions={true}
          />
        ))}
      </div>

      {promos.length > 0 && (
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white border-2 border-orange-400">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Siap membuat promo baru?</h3>
              <p className="text-orange-100">
                Tingkatkan penjualan dengan strategi promo yang tepat
              </p>
            </div>
            <button
              onClick={onCreateNew}
              className="bg-white text-orange-600 px-6 py-3 rounded-lg font-medium hover:bg-orange-50 transition-colors border-2 border-white hover:border-orange-100"
            >
              Mulai Sekarang
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // List Header Component
  const ListHeader = ({ onCreateNew }: { onCreateNew: () => void }) => (
    <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Daftar Promo</h1>
        <button 
          onClick={onCreateNew}
          className={styles.buttonPrimary}
        >
          <Plus className="h-4 w-4" />
          <span>Buat Promo</span>
        </button>
      </div>
    </div>
  );

  // Dashboard View
  if (currentView === 'dashboard') {
    return (
      <div className={styles.containerLayout}>
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 mb-6 text-white shadow-lg mx-4 mt-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-white bg-opacity-10 p-3 rounded-xl backdrop-blur-sm">
                <Calculator className="h-8 w-8 text-white" />
              </div>
              
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                  Kalkulator Promo
                </h1>
                <p className="text-white text-opacity-90">
                  Hitung profit margin dan dampak promo dengan akurat
                </p>
              </div>
            </div>
            <div className="hidden md:flex gap-3">
              <Button
                onClick={() => navigate('/promo/list')}
                className="flex items-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 font-medium px-4 py-2 rounded-lg transition-all backdrop-blur-sm"
              >
                <List className="h-4 w-4" />
                Lihat Semua
              </Button>

              <Button
                onClick={() => navigate('/promo/create')}
                className="flex items-center gap-2 bg-white text-orange-600 font-semibold border hover:bg-gray-100 px-4 py-2 rounded-lg transition-all"
              >
                <Plus className="h-4 w-4" />
                Buat Promo
              </Button>
            </div>
          </div>

          <div className="flex md:hidden flex-col gap-3 mt-6">
            <Button
              onClick={() => navigate('/promo/list')}
              className="w-full flex items-center justify-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 font-medium px-4 py-3 rounded-lg transition-all backdrop-blur-sm"
            >
              <List className="h-4 w-4" />
              Lihat Semua
            </Button>
            <Button
              onClick={() => navigate('/promo/create')}
              className="w-full flex items-center justify-center gap-2 bg-white text-orange-600 font-semibold border hover:bg-gray-100 px-4 py-3 rounded-lg transition-all"
            >
              <Plus className="h-4 w-4" />
              Buat Promo
            </Button>
          </div>
        </div>
        <div className={styles.mainContent}>
          {/* Content */}
          {isLoading ? (
            <LoadingFallback size="large" />
          ) : promosError ? (
            <ErrorDisplay
              title="Gagal Memuat Data Promo"
              message="Terjadi kesalahan saat memuat data promo. Silakan coba lagi."
              onRetry={() => refetchPromos()}
            />
          ) : recentPromos.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum Ada Promo</h3>
              <p className="text-gray-600 mb-6">
                Mulai buat promo pertama Anda untuk meningkatkan penjualan
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => refetchPromos()}
                  className="block mx-auto text-orange-600 hover:text-orange-800 text-sm transition-colors"
                >
                  Refresh Data
                </button>
              </div>
            </div>
          ) : (
            <PromoGrid
              promos={recentPromos}
              onCreateNew={() => navigate('/promo/create')}
            />
          )}
        </div>
      </div>
    );
  }

  // Calculator View
  if (currentView === 'calculator') {
    return (
      <div className={styles.containerLayout}>
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="w-full px-4 py-4">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Kembali</span>
            </button>
          </div>
        </div>
        <div className={styles.mainContent}>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <LazyComponent
              fallback={<LoadingFallback />}
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
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <ListHeader onCreateNew={() => navigate('/promo/create')} />
          <div className="bg-white rounded-t-xl border border-gray-200">
            <LazyComponent 
              fallback={<LoadingFallback />}
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