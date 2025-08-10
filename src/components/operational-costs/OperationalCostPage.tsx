import React, { useState, Suspense, lazy } from 'react';
import { Plus, Settings, Calculator, DollarSign, AlertTriangle } from 'lucide-react';

// ✅ CONSOLIDATED: Context imports
import { OperationalCostProvider, useOperationalCost } from './context';
import { logger } from '@/utils/logger';

// ✅ CONSOLIDATED: All components in single import
import {
  CostSummaryCard,
  CostList,
  CostForm,
  AllocationSettings,
  LoadingState,
  EmptyState
} from './components';

// ✅ CONSOLIDATED: Types import
import { OperationalCost } from './types';

// ✅ KEEP: Lazy load dialogs (existing logic)
const CostDialog = lazy(() => import('./dialogs/CostDialog'));
const DeleteConfirmDialog = lazy(() => import('./dialogs/DeleteConfirmDialog'));
const AllocationDialog = lazy(() => import('./dialogs/AllocationDialog'));

// ❌ REMOVED: Individual component imports - now consolidated
// - import CostSummaryCard from './components/CostSummaryCard';
// - import CostList from './components/CostList';
// - import CostForm from './components/CostForm';
// - import AllocationSettings from './components/AllocationSettings';
// - import LoadingState from './components/LoadingState';
// - import EmptyState from './components/EmptyState';

interface OperationalCostPageContentProps {}

const OperationalCostPageContent: React.FC<OperationalCostPageContentProps> = () => {
  const { state, actions } = useOperationalCost();
  
  // Dialog states
  const [showCostDialog, setShowCostDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAllocationDialog, setShowAllocationDialog] = useState(false);
  const [selectedCost, setSelectedCost] = useState<OperationalCost | null>(null);
  
  // UI states
  const [activeTab, setActiveTab] = useState<'costs' | 'allocation'>('costs');

  // Handle cost actions
  const handleAddCost = () => {
    setSelectedCost(null);
    setShowCostDialog(true);
  };

  const handleEditCost = (cost: OperationalCost) => {
    setSelectedCost(cost);
    setShowCostDialog(true);
  };

  const handleDeleteCost = (cost: OperationalCost) => {
    setSelectedCost(cost);
    setShowDeleteDialog(true);
  };

  const handleViewCost = (cost: OperationalCost) => {
    setSelectedCost(cost);
    logger.info('View cost:', cost);
  };

  // Handle allocation settings
  const handleOpenAllocationSettings = () => {
    setShowAllocationDialog(true);
  };

  const handleCalculateOverhead = async () => {
    await actions.calculateOverhead();
  };

  // Check if we have any costs
  const hasCosts = state.costs.length > 0;
  const hasActiveSettings = !!state.allocationSettings;

  // Show loading state while auth is being checked
  if (state.loading.auth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  // Show auth error if not authenticated
  if (!state.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="h-12 w-12 text-red-500 mx-auto mb-4 text-4xl">🔒</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Akses Terbatas</h2>
          <p className="text-gray-600 mb-4">
            Anda perlu login untuk mengakses halaman ini.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Halaman
          </button>
        </div>
      </div>
    );
  }

  // Check if there are any issues with allocation settings
  const isConnected = true; // You can replace this with actual connection status

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Connection Warning */}
      {!isConnected && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Koneksi tidak stabil. Data mungkin tidak ter-update secara real-time.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header Card with orange gradient background */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
            {/* Icon Container */}
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              
              {/* Content */}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Biaya Operasional
                </h1>
                <p className="text-orange-100 mt-2 text-base md:text-lg">
                  Kelola biaya operasional dan hitung overhead untuk HPP produksi
                </p>
              </div>
            </div>

            {/* Desktop Action Buttons - Horizontal Layout */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={handleCalculateOverhead}
                disabled={state.loading.overhead || !hasCosts || !hasActiveSettings}
                className="flex items-center gap-2 bg-white text-orange-600 hover:bg-gray-100 font-medium px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Hitung overhead berdasarkan pengaturan alokasi"
              >
                <Calculator className="h-4 w-4" />
                {state.loading.overhead ? 'Menghitung...' : 'Hitung Overhead'}
              </button>
              
              <button
                onClick={handleOpenAllocationSettings}
                className="flex items-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 font-medium px-4 py-2 rounded-lg transition-all backdrop-blur-sm"
              >
                <Settings className="h-4 w-4" />
                Pengaturan
              </button>
              
              <button
                onClick={handleAddCost}
                disabled={state.loading.costs}
                className="flex items-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 font-medium px-4 py-2 rounded-lg transition-all backdrop-blur-sm disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Tambah Biaya
              </button>
            </div>
          </div>

          {/* Mobile Action Buttons - Vertical Layout */}
          <div className="lg:hidden mt-6 space-y-3">
            <button
              onClick={handleCalculateOverhead}
              disabled={state.loading.overhead || !hasCosts || !hasActiveSettings}
              className="w-full flex items-center justify-center gap-2 bg-white text-orange-600 hover:bg-gray-100 font-medium px-4 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Hitung overhead berdasarkan pengaturan alokasi"
            >
              <Calculator className="h-4 w-4" />
              {state.loading.overhead ? 'Menghitung...' : 'Hitung Overhead'}
            </button>
            
            <button
              onClick={handleOpenAllocationSettings}
              className="w-full flex items-center justify-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 font-medium px-4 py-3 rounded-lg transition-all backdrop-blur-sm"
            >
              <Settings className="h-4 w-4" />
              Pengaturan
            </button>
            
            <button
              onClick={handleAddCost}
              disabled={state.loading.costs}
              className="w-full flex items-center justify-center gap-2 bg-white bg-opacity-20 text-white border border-white border-opacity-30 hover:bg-white hover:bg-opacity-30 font-medium px-4 py-3 rounded-lg transition-all backdrop-blur-sm disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Tambah Biaya
            </button>
          </div>

          {/* Stats Bar */}
          {hasCosts && (
            <div className="mt-6">
              <div className="text-orange-100 text-sm">
                Total: {state.costs.length} biaya{!hasActiveSettings && ' • Pengaturan alokasi belum diatur'}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('costs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'costs'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Daftar Biaya ({state.costs.length})
            </button>
            <button
              onClick={() => setActiveTab('allocation')}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'allocation'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pengaturan Alokasi
              {!hasActiveSettings && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Belum Diatur
                </span>
              )}
            </button>
          </nav>
        </div>

        {activeTab === 'costs' ? (
          /* Costs Tab */
          <div className="space-y-8">
            {/* Summary Card */}
            <CostSummaryCard 
              summary={state.summary}
              loading={state.loading.summary || state.loading.costs}
            />

            {/* Overhead Calculation Result */}
            {state.overheadCalculation && (
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Calculator className="h-5 w-5 mr-2 text-orange-600" />
                  Hasil Perhitungan Overhead
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-orange-600 break-all">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      }).format(state.overheadCalculation.overhead_per_unit)}
                    </div>
                    <div className="text-sm text-gray-500">Overhead per Unit</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-gray-900 break-all">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      }).format(state.overheadCalculation.total_costs)}
                    </div>
                    <div className="text-sm text-gray-500">Total Biaya Aktif</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-700">
                      {state.overheadCalculation.metode === 'per_unit' 
                        ? `${state.overheadCalculation.nilai_basis.toLocaleString('id-ID')} unit/bulan`
                        : `${state.overheadCalculation.nilai_basis}% dari material`
                      }
                    </div>
                    <div className="text-sm text-gray-500">Metode Alokasi</div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {state.error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-sm text-red-800">
                  <strong>Error:</strong> {state.error}
                </div>
                <button
                  onClick={() => actions.setError(null)}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Tutup
                </button>
              </div>
            )}

            {/* Costs List */}
            <CostList
              costs={state.costs}
              loading={state.loading.costs}
              onEdit={handleEditCost}
              onDelete={handleDeleteCost}
              onView={handleViewCost}
              filters={state.filters}
              onFiltersChange={actions.setFilters}
            />
          </div>
        ) : (
          /* Allocation Tab */
          <div className="space-y-8">
            {!hasCosts ? (
              <EmptyState
                type="no-data"
                title="Tambah Biaya Operasional Terlebih Dahulu"
                description="Anda perlu menambahkan biaya operasional sebelum mengatur metode alokasi."
                actionLabel="Tambah Biaya"
                onAction={handleAddCost}
              />
            ) : (
              <AllocationSettings
                settings={state.allocationSettings}
                costSummary={state.summary}
                onSave={actions.saveAllocationSettings}
                loading={state.loading.allocation}
              />
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <Suspense fallback={<LoadingState type="form" />}>
        {showCostDialog && (
          <CostDialog
            cost={selectedCost}
            isOpen={showCostDialog}
            onClose={() => {
              setShowCostDialog(false);
              setSelectedCost(null);
            }}
            onSave={async (data) => {
              const success = selectedCost 
                ? await actions.updateCost(selectedCost.id, data)
                : await actions.createCost(data);
              
              if (success) {
                setShowCostDialog(false);
                setSelectedCost(null);
              }
              
              return success;
            }}
          />
        )}

        {showDeleteDialog && selectedCost && (
          <DeleteConfirmDialog
            cost={selectedCost}
            isOpen={showDeleteDialog}
            onClose={() => {
              setShowDeleteDialog(false);
              setSelectedCost(null);
            }}
            onConfirm={async () => {
              const success = await actions.deleteCost(selectedCost.id);
              if (success) {
                setShowDeleteDialog(false);
                setSelectedCost(null);
              }
              return success;
            }}
          />
        )}

        {showAllocationDialog && (
          <AllocationDialog
            isOpen={showAllocationDialog}
            settings={state.allocationSettings}
            costSummary={state.summary}
            onClose={() => setShowAllocationDialog(false)}
            onSave={async (data) => {
              const success = await actions.saveAllocationSettings(data);
              if (success) {
                setShowAllocationDialog(false);
              }
              return success;
            }}
          />
        )}
      </Suspense>
    </div>
  );
};

// Main page component with provider
const OperationalCostPage: React.FC = () => {
  return (
    <OperationalCostProvider>
      <OperationalCostPageContent />
    </OperationalCostProvider>
  );
};

export default OperationalCostPage;