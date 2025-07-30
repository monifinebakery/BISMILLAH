// src/components/operational-costs/OperationalCostPage.tsx

import React, { useState, Suspense, lazy } from 'react';
import { PlusIcon, CogIcon, CalculatorIcon } from '@heroicons/react/24/outline';
import { OperationalCostProvider, useOperationalCost } from './context';
import CostSummaryCard from './components/CostSummaryCard';
import CostList from './components/CostList';
import CostForm from './components/CostForm';
import AllocationSettings from './components/AllocationSettings';
import LoadingState from './components/LoadingState';
import EmptyState from './components/EmptyState';
import { OperationalCost } from './types';

// Lazy load dialogs
const CostDialog = lazy(() => import('./dialogs/CostDialog'));
const DeleteConfirmDialog = lazy(() => import('./dialogs/DeleteConfirmDialog'));
const AllocationDialog = lazy(() => import('./dialogs/AllocationDialog'));

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
    // Could open a view-only dialog or navigate to detail page
    console.log('View cost:', cost);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Biaya Operasional</h1>
              <p className="text-gray-600 mt-1">
                Kelola biaya operasional dan hitung overhead untuk HPP produksi
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCalculateOverhead}
                disabled={state.loading.overhead || !hasCosts || !hasActiveSettings}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Hitung overhead berdasarkan pengaturan alokasi"
              >
                <CalculatorIcon className="h-4 w-4 mr-2" />
                Hitung Overhead
              </button>
              
              <button
                onClick={handleOpenAllocationSettings}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <CogIcon className="h-4 w-4 mr-2" />
                Pengaturan
              </button>
              
              <button
                onClick={handleAddCost}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Tambah Biaya
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('costs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'costs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Daftar Biaya ({state.costs.length})
            </button>
            <button
              onClick={() => setActiveTab('allocation')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'allocation'
                  ? 'border-blue-500 text-blue-600'
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
              loading={state.loading.summary}
            />

            {/* Overhead Calculation Result */}
            {state.overheadCalculation && (
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CalculatorIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Hasil Perhitungan Overhead
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      }).format(state.overheadCalculation.overhead_per_unit)}
                    </div>
                    <div className="text-sm text-gray-500">Overhead per Unit</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
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