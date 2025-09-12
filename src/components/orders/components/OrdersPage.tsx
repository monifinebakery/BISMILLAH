// src/components/orders/components/OrdersPage.tsx - FIXED STATUS UPDATE INTEGRATION

import React, { useState, useCallback, useMemo, useEffect, Suspense } from 'react';
import { SafeSuspense } from '@/components/common/UniversalErrorBoundary';
import { FileText, Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

// ✅ CONSOLIDATED: Order context and hooks
import { useOrder } from '../context/OrderContext';
import { useOrderUI } from '../hooks/useOrderUI';
import { useOrderTable } from '../hooks/useOrderTable';

// ✅ CONSOLIDATED: Template integration (enhanced)
import { useOrderFollowUp } from '../hooks/useOrderFollowUp';

// ✅ IMPORT FUNCTIONALITY: Import component for CSV uploads
import ImportButton from './ImportButton';

// ✅ BULK OPERATIONS: Lazy load BulkActions
const BulkActions = React.lazy(() => 
  import('./BulkActions').catch((error) => {
    logger.error('Failed to load BulkActions component:', error);
    return {
      default: () => null
    };
  })
);

const OrderStatistics = React.lazy(() => 
  import('./OrderStatistics').catch((error) => {
    logger.error('Failed to load OrderStatistics component:', error);
    return {
      default: () => <div className="h-32 bg-gray-100 rounded animate-pulse" />
    };
  })
);

// ✅ ESSENTIAL TYPES: Only what's needed for this component
import type { Order, NewOrder, OrderStatus } from '../types';

// ✅ SHARED COMPONENTS: Direct import
import { PageLoading } from './shared/LoadingStates';
import { logger } from '@/utils/logger';

// ✅ DEBUG: Context debugger for development
import ContextDebugger from '@/components/debug/ContextDebugger';
import OrderUpdateMonitor from '@/components/debug/OrderUpdateMonitor';

// ✅ TAMBAHKAN IMPORTS: Untuk fallback langsung ke Supabase dan getStatusText
import { supabase } from '@/integrations/supabase/client';
import { getStatusText } from '../constants'; // Pastikan path ini benar
import { fetchOrdersPaginated } from '../services/orderService';

// ✅ OPTIMIZED: Lazy loading with better error boundaries
const OrderTable = React.lazy(() => 
  import('./OrderTable').catch((error) => {
    logger.error('Failed to load OrderTable component:', error);
    return {
      default: () => (
        <div className="p-8 text-center border-2 border-dashed border-red-200 rounded-lg">
          <div className="text-red-500 text-lg mb-2">⚠️ Gagal memuat tabel pesanan</div>
          <p className="text-gray-600 text-sm">Silakan refresh halaman atau hubungi admin</p>
        </div>
      )
    };
  })
);

const OrderFilters = React.lazy(() => 
  import('./OrderFilters').catch((error) => {
    logger.error('Failed to load OrderFilters component:', error);
    return {
      default: () => <div className="h-16 bg-gray-100 rounded animate-pulse" />
    };
  })
);

const OrderControls = React.lazy(() => 
  import('./OrderControls').catch((error) => {
    logger.error('Failed to load OrderControls component:', error);
    return {
      default: () => <div className="h-12 bg-gray-100 rounded animate-pulse" />
    };
  })
);

const OrderDialogs = React.lazy(() => 
  import('./OrderDialogs').catch((error) => {
    logger.error('Failed to load OrderDialogs component:', error);
    return {
      default: () => null
    };
  })
);

// ✅ INTERFACES: Consolidated component state
interface OrdersPageState {
  dialogs: {
    orderForm: boolean;
    templateManager: boolean;
    detail: boolean;
  };
  editingOrder: Order | null;
  selectedOrderForTemplate: Order | null;
  viewingOrder: Order | null;
}

const initialState: OrdersPageState = {
  dialogs: {
    orderForm: false,
    templateManager: false,
    detail: false
  },
  editingOrder: null,
  selectedOrderForTemplate: null,
  viewingOrder: null
};

const OrdersPage: React.FC = () => {
  logger.component('OrdersPage', 'Component mounted');

  // ✅ AUTH: Get current user
  const { user } = useAuth();
  
  // ✅ DEV BYPASS: Bypass autentikasi untuk pengembangan
  const isDev = import.meta.env.DEV;
  const devBypassAuth = isDev && import.meta.env.VITE_DEV_BYPASS_AUTH === 'true';
  const effectiveUser = devBypassAuth ? { id: 'dev-user' } : user;

  // ✅ CONTEXTS: Direct usage with destructuring
  const contextValue = useOrder();
  const { 
    orders, 
    loading, 
    addOrder, 
    updateOrder, 
    updateOrderStatus, // ✅ FIXED: Extract dedicated status update function
    deleteOrder,
    refreshData // ✅ TAMBAHKAN: Untuk refresh manual jika diperlukan
  } = contextValue;

  // ✅ LAZY LOADING STATE: State untuk kontrol lazy loading
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [useLazyLoading] = useState(true);
  const [paginationInfo, setPaginationInfo] = useState({ totalCount: 0, totalPages: 0 });

  // ✅ LAZY LOADING QUERY: Fetch paginated data when lazy loading is enabled
  const { 
    data: paginatedData, 
    isLoading: isPaginatedLoading, 
    error: paginatedError,
    refetch: refetchPaginated
  } = useQuery({
    queryKey: ['orders-paginated', user?.id, currentPage, itemsPerPage],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      return fetchOrdersPaginated(user.id, currentPage, itemsPerPage);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // ✅ TEMPLATE INTEGRATION: Gunakan hook khusus untuk follow up
  const { getWhatsappUrl } = useOrderFollowUp();

  // ✅ DATA SELECTION: Pilih data berdasarkan mode lazy loading
  const finalOrders = paginatedData?.orders || [];
  const finalIsLoading = isPaginatedLoading;
  const finalError = paginatedError;

  // ✅ STATS CALCULATION: Hitung statistik berdasarkan data yang dipilih
  const finalStats = useMemo(() => {
    const dataToUse = paginatedData?.orders || [];
    return {
      total: paginationInfo.totalCount,
      totalValue: dataToUse.reduce((sum: number, order: Order) => sum + (order.totalPesanan || 0), 0),
      byStatus: dataToUse.reduce((acc: Record<string, number>, order: Order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      completionRate: dataToUse.length > 0
        ? Math.round((dataToUse.filter((o: Order) => o.status === 'completed').length / dataToUse.length) * 100)
        : 0
    };
  }, [paginatedData, paginationInfo.totalCount]);

  // ✅ UPDATE PAGINATION INFO: Update when data changes
  React.useEffect(() => {
    if (paginatedData) {
      setPaginationInfo({ 
        totalCount: paginatedData.totalCount, 
        totalPages: paginatedData.totalPages 
      });
    }
  }, [paginatedData]);

  // ✅ UI STATE: Optimized with memoization
  const uiState = useOrderUI(finalOrders, itemsPerPage);

  // ✅ BULK OPERATIONS: Table selection state
  const {
    selectedIds,
    selectedOrders,
    isSelectionMode,
    isAllSelected,
    toggleOrderSelection,
    selectAllOrders,
    clearSelection,
    enterSelectionMode,
    exitSelectionMode,
  } = useOrderTable(finalOrders);

  // ✅ CONSOLIDATED: Single state object
  const [pageState, setPageState] = useState<OrdersPageState>(initialState);

  // ✅ MEMOIZED: Dialog handlers
  const dialogHandlers = useMemo(() => ({
    openOrderForm: (order: Order | null = null) => {
      logger.component('OrdersPage', 'Opening order form:', { isEdit: !!order, orderId: order?.id });
      setPageState(prev => ({
        ...prev,
        dialogs: { ...prev.dialogs, orderForm: true },
        editingOrder: order
      }));
    },

    closeOrderForm: () => {
      logger.component('OrdersPage', 'Closing order form');
      setPageState(prev => ({
        ...prev,
        dialogs: { ...prev.dialogs, orderForm: false },
        editingOrder: null
      }));
    },

    openTemplateManager: () => {
      logger.component('OrdersPage', 'Opening template manager');
      setPageState(prev => ({
        ...prev,
        dialogs: { ...prev.dialogs, templateManager: true },
        selectedOrderForTemplate: null
      }));
    },

    closeTemplateManager: () => {
      logger.component('OrdersPage', 'Closing template manager');
      setPageState(prev => ({
        ...prev,
        dialogs: { ...prev.dialogs, templateManager: false },
        selectedOrderForTemplate: null
      }));
    },

    openDetail: (order: Order) => {
      logger.component('OrdersPage', 'Opening order detail dialog', { orderId: order.id, nomorPesanan: order.nomorPesanan });
      setPageState(prev => ({
        ...prev,
        dialogs: { ...prev.dialogs, detail: true },
        viewingOrder: order
      }));
    },

    closeDetail: () => {
      logger.component('OrdersPage', 'Closing order detail dialog');
      setPageState(prev => ({
        ...prev,
        dialogs: { ...prev.dialogs, detail: false },
        viewingOrder: null
      }));
    }
  }), []);

  // ✅ 🚀 FIXED: Business logic handlers with proper status update
  const businessHandlers = useMemo(() => ({
    newOrder: () => {
      try {
        logger.component('OrdersPage', 'New order button clicked');
        dialogHandlers.openOrderForm();
      } catch (error) {
        logger.error('Error opening new order form:', error);
        toast.error('Gagal membuka form pesanan baru');
      }
    },

    editOrder: (order: Order) => {
      try {
        if (!order?.id) {
          logger.warn('Invalid order data for edit:', order);
          toast.error('Data pesanan tidak valid');
          return;
        }
        logger.component('OrdersPage', 'Edit order requested:', { orderId: order.id, nomorPesanan: order.nomorPesanan });
        dialogHandlers.openOrderForm(order);
      } catch (error) {
        logger.error('Error opening edit form:', error);
        toast.error('Gagal membuka form edit pesanan');
      }
    },

    deleteOrder: async (orderId: string) => {
      try {
        if (!orderId) {
          logger.warn('Invalid order ID for delete:', orderId);
          toast.error('ID pesanan tidak valid');
          return;
        }

        logger.component('OrdersPage', 'Delete order requested:', orderId);

        // Remove from selection if selected
        if (uiState.selectedOrderIds.includes(orderId)) {
          logger.debug('Removing deleted order from selection:', orderId);
          uiState.toggleSelectOrder(orderId, false);
        }

        const success = await deleteOrder(orderId);
        if (success) {
          logger.success('Order deleted successfully:', orderId);
          // Success toast is handled in deleteOrder function
        }
      } catch (error) {
        logger.error('Error deleting order:', error);
        toast.error('Gagal menghapus pesanan');
      }
    },

    // ✅ 🚀 FIXED: Use dedicated updateOrderStatus function with fallbacks
    statusChange: async (orderId: string, newStatus: string) => {
      try {
        if (!orderId || !newStatus) {
          logger.warn('Invalid parameters for status change:', { orderId, newStatus });
          toast.error('Parameter tidak valid');
          return;
        }

        logger.component('OrdersPage', 'Status change requested:', { orderId, newStatus });

        // ✅ STEP 1: Try updateOrderStatus if available
        if (typeof contextValue.updateOrderStatus === 'function') {
          logger.debug('Using contextValue.updateOrderStatus');
          try {
            await contextValue.updateOrderStatus(orderId, newStatus as OrderStatus);
            const order = finalOrders.find(o => o.id === orderId);
            logger.success('Status updated via updateOrderStatus:', { 
              orderId, 
              newStatus, 
              orderNumber: order?.nomorPesanan 
            });
            return; // Success toast handled by updateOrderStatus
          } catch (error) {
            logger.warn('updateOrderStatus failed:', error);
          }
        } else {
          logger.warn('updateOrderStatus not available, trying fallback');
        }

        // ✅ STEP 2: Try updateOrder fallback
        if (typeof contextValue.updateOrder === 'function') {
          logger.debug('Using contextValue.updateOrder fallback');
          const success = await contextValue.updateOrder(orderId, { status: newStatus as Order['status'] });
          
          if (success) {
            const order = orders.find(o => o.id === orderId);
            logger.success('Status updated via updateOrder fallback:', { 
              orderId, 
              newStatus, 
              orderNumber: order?.nomorPesanan 
            });
            toast.success(`Status pesanan berhasil diubah ke ${getStatusText(newStatus as Order['status'])}`);
            return;
          } else {
            logger.warn('updateOrder returned false, trying direct Supabase');
          }
        }

        // ✅ STEP 3: Direct Supabase call (most reliable)
        logger.debug('Using direct Supabase call');
        
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) {
          throw new Error('User not authenticated');
        }

        const { data, error } = await supabase
          .from('orders')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId)
          .eq('user_id', user.user.id)
          .select('*') // ✅ Get full order data for financial sync
          .single();

        if (error) {
          throw new Error(`Database error: ${error instanceof Error ? error.message : String(error)}`);
        }

        if (!data) {
          throw new Error('Order not found or access denied');
        }

        logger.success('Status updated via direct Supabase:', { 
          orderId, 
          newStatus, 
          orderNumber: data.nomor_pesanan 
        });
        
        // ✅ FINANCIAL SYNC: Trigger manual financial sync if status is completed
        if (newStatus === 'completed') {
          try {
            logger.debug('Direct update: Triggering financial sync for completed order');
            
            // Transform DB data to Order type for financial sync
            const { transformOrderFromDB } = await import('../utils');
            const orderForSync = transformOrderFromDB(data);
            
            const { syncOrderToFinancialTransaction } = await import('@/utils/orderFinancialSync');
            const syncResult = await syncOrderToFinancialTransaction(orderForSync, user.user.id);
            
            if (syncResult) {
              logger.success('✅ Financial sync completed via direct update:', data.nomor_pesanan);
            } else {
              logger.warn('⚠️ Financial sync failed (non-critical) via direct update');
            }
          } catch (syncError) {
            logger.error('Error in manual financial sync after direct update:', syncError);
            // Don't throw - status update was successful
          }
        }
        
        toast.success(`Status pesanan #${data.nomor_pesanan} berhasil diubah ke ${getStatusText(newStatus as Order['status'])}`);
        
        // ✅ STEP 4: Trigger refresh through event system (no more manual refresh)
        if (typeof contextValue.refreshData === 'function') {
          logger.debug('Triggering refresh via context');
          await contextValue.refreshData();
        } else {
          logger.debug('Refresh will be handled automatically via event system');
          // Event system will handle the refresh automatically
        }

      } catch (error) {
        logger.error('Error updating status:', error);
        toast.error(`Gagal mengubah status pesanan: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    submitOrder: async (data: Partial<Order> | Partial<NewOrder>) => {
      const isEditingMode = !!pageState.editingOrder;
      
      try {
        if (!data) {
          logger.warn('Invalid order data for submit:', data);
          toast.error('Data pesanan tidak valid');
          return;
        }

        logger.component('OrdersPage', 'Order submission started:', { 
          isEdit: isEditingMode, 
          orderId: pageState.editingOrder?.id 
        });

        let success = false;
        if (isEditingMode && pageState.editingOrder?.id) {
          success = await updateOrder(pageState.editingOrder.id, data);
        } else {
          success = await addOrder(data as NewOrder);
        }

        if (success) {
          logger.success('Order submitted successfully:', { 
            isEdit: isEditingMode, 
            orderId: pageState.editingOrder?.id 
          });
          // Success toast is handled in addOrder/updateOrder functions
          dialogHandlers.closeOrderForm();
        }
      } catch (error) {
        logger.error('Error submitting order:', error);
        toast.error(
          isEditingMode 
            ? 'Gagal memperbarui pesanan' 
            : 'Gagal menambahkan pesanan'
        );
      }
    }
  }), [
    pageState.editingOrder, 
    finalOrders, 
    updateOrder, 
    updateOrderStatus, // ✅ FIXED: Include updateOrderStatus dependency
    addOrder, 
    deleteOrder, 
    uiState, 
    dialogHandlers,
    contextValue.refreshData // ✅ FIXED: Use contextValue.refreshData
  ]);

  // ✅ ENHANCED: WhatsApp integration with template
  const handleFollowUp = useCallback(
    (order: Order) => {
      logger.component('OrdersPage', 'Follow up initiated:', {
        orderId: order.id,
        nomorPesanan: order.nomorPesanan,
        hasPhone: !!order.teleponPelanggan,
        status: order.status
      });

      const whatsappUrl = getWhatsappUrl(order);

      if (!whatsappUrl) {
        logger.warn('Cannot create WhatsApp URL for follow up:', order.id);
        toast.error('Template atau nomor WhatsApp tidak tersedia');
        return;
      }

      window.open(whatsappUrl, '_blank');

      logger.success('Follow up WhatsApp opened:', {
        customer: order.namaPelanggan,
        orderNumber: order.nomorPesanan
      });

      toast.success(`Follow up untuk ${order.namaPelanggan} berhasil dibuka di WhatsApp`);

      // Set selected order for template manager
      setPageState(prev => ({
        ...prev,
        selectedOrderForTemplate: order
      }));
    },
    [getWhatsappUrl]
  );

  // ✅ ENHANCED: View detail handler
  const handleViewDetail = useCallback((order: Order) => {
    logger.component('OrdersPage', 'View detail requested:', {
      orderId: order.id,
      nomorPesanan: order.nomorPesanan
    });
    dialogHandlers.openDetail(order);
  }, [dialogHandlers]);

  // ✅ DEBUG: Test function for status update (development only)
  const debugStatusUpdate = useCallback(async () => {
    if (!orders.length) {
      toast.error('Tidak ada pesanan untuk testing');
      return;
    }

    const testOrder = orders[0];
    const currentStatus = testOrder.status;
    const newStatus = currentStatus === 'pending' ? 'confirmed' : 'pending';
    
    logger.component('OrdersPage', 'Debug status update:', { 
      orderId: testOrder.id, 
      from: currentStatus, 
      to: newStatus 
    });
    
    try {
      const result = await updateOrderStatus(testOrder.id, newStatus);
      logger.debug('Debug status update result:', result);
      
      if (result) {
        toast.success(`Debug: Status berhasil diubah dari ${currentStatus} ke ${newStatus}`);
      } else {
        toast.error('Debug: Status update gagal');
      }
    } catch (error) {
      logger.error('Debug status update error:', error);
      toast.error('Debug: Error saat update status');
    }
  }, [orders, updateOrderStatus]);

  // Log current state for debugging
  logger.debug('OrdersPage render state:', {
    ordersCount: finalOrders.length,
    isLoading: finalIsLoading,
    useLazyLoading,
    currentPage,
    totalPages: paginationInfo.totalPages,
    selectedOrdersCount: uiState.selectedOrderIds.length,
    dialogsOpen: pageState.dialogs,
    isEditingOrder: !!pageState.editingOrder,
    hasUpdateOrderStatus: typeof updateOrderStatus === 'function'
  });

  // ✅ EARLY RETURN: Loading state
  if (finalIsLoading) {
    logger.component('OrdersPage', 'Rendering loading state');
    return <PageLoading />;
  }

  return (
    <div className="w-full max-w-full p-4 sm:p-8 overflow-hidden">
      {/* ✅ DEBUG: Context debugger - only in development */}
      {import.meta.env.DEV && <ContextDebugger />}
      
      {/* ✅ ENHANCED: Header with template integration info and debug button */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 border">
        <div className="flex items-center gap-3 sm:gap-4 mb-4 lg:mb-0">
          <div className="flex-shrink-0 bg-white bg-opacity-20 p-2 sm:p-3 rounded-xl backdrop-blur-sm">
            <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Manajemen Pesanan</h1>
            <p className="text-xs sm:text-sm opacity-90 mt-1">
              Kelola semua pesanan dari pelanggan Anda dengan template WhatsApp otomatis.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto">

          {/* ✅ DEBUG: Debug button for development */}
          {import.meta.env.DEV && (
            <Button
              onClick={debugStatusUpdate}
              variant="outline"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-all duration-200"
            >
              🐛 Debug Status
            </Button>
          )}
          
          {/* ✅ IMPORT BUTTON: Import CSV data with responsive design */}
          <ImportButton />
          
          <Button
            onClick={() => {
              logger.component('OrdersPage', 'Template manager button clicked');
              dialogHandlers.openTemplateManager();
            }}
            variant="outline"
            className="flex items-center justify-center gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all duration-200 border-blue-300 text-sm"
          >
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Kelola Template WhatsApp</span>
            <span className="sm:hidden">Template</span>
          </Button>
          
          <Button
            onClick={() => {
              logger.component('OrdersPage', 'New order button clicked from header');
              businessHandlers.newOrder();
            }}
            className="flex items-center justify-center gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-white text-orange-600 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200 text-sm"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Pesanan Baru</span>
            <span className="sm:hidden">Baru</span>
          </Button>
        </div>
      </header>

      {/* ✅ OPTIMIZED: Main content with better error handling */}
      <SafeSuspense 
        loadingMessage="Memuat konten utama..." 
        size="lg"
        fallback={
          <div className="space-y-4">
            <div className="h-12 bg-gray-100 rounded animate-pulse" />
            <div className="h-16 bg-gray-100 rounded animate-pulse" />
            <div className="h-64 bg-gray-100 rounded animate-pulse" />
          </div>
        }
      >
        {/* ✅ STATISTICS: Order statistics section */}
         <SafeSuspense 
           loadingMessage="Memuat statistik pesanan..." 
           size="md"
           fallback={<div className="h-32 bg-gray-100 rounded animate-pulse" />}
         >
           <OrderStatistics 
             orders={finalOrders} 
             loading={finalIsLoading}
           />
         </SafeSuspense>
        
        <OrderControls 
          uiState={uiState} 
          loading={finalIsLoading}
          onBulkEditStatus={() => {
            // TODO: Implement bulk edit status
            toast.info('Fitur edit status massal akan segera tersedia');
          }}
          onBulkDelete={async () => {
            if (selectedIds.length === 0) {
              toast.error('Tidak ada pesanan yang dipilih');
              return;
            }

            const confirmed = window.confirm(
              `Apakah Anda yakin ingin menghapus ${selectedIds.length} pesanan yang dipilih? Tindakan ini tidak dapat dibatalkan.`
            );

            if (!confirmed) return;

            try {
              logger.component('OrdersPage', 'Bulk delete requested:', selectedIds.length);
              const success = await contextValue.bulkDeleteOrders?.(selectedIds);
              
              if (success) {
                toast.success(`${selectedIds.length} pesanan berhasil dihapus`);
                clearSelection();
                exitSelectionMode();
              } else {
                toast.error('Gagal menghapus pesanan');
              }
            } catch (error) {
              logger.error('Error during bulk delete:', error);
              toast.error('Terjadi kesalahan saat menghapus pesanan');
            }
          }}
          isSelectionMode={isSelectionMode}
          selectedCount={selectedIds.length}
          totalCount={finalOrders.length}
          onEnterSelectionMode={enterSelectionMode}
          onExitSelectionMode={exitSelectionMode}
          onClearSelection={clearSelection}
        />
        <OrderFilters 
          uiState={uiState} 
          loading={finalIsLoading} 
        />
        
        {/* ✅ BULK ACTIONS: Komponen untuk operasi massal */}
         {isSelectionMode && (
           <SafeSuspense 
             loadingMessage="Memuat aksi massal..." 
             size="sm"
             fallback={<div className="h-16 bg-gray-100 rounded animate-pulse" />}
           >
             <BulkActions
                selectedOrders={selectedOrders}
                selectedIds={selectedIds}
                onClearSelection={clearSelection}
                onSelectAll={() => selectAllOrders(finalOrders)}
                isAllSelected={isAllSelected}
                totalCount={finalOrders.length}
              />
           </SafeSuspense>
         )}
        
        <OrderTable
          uiState={uiState}
          loading={finalIsLoading}
          onEditOrder={businessHandlers.editOrder}
          onDeleteOrder={businessHandlers.deleteOrder}
          onStatusChange={businessHandlers.statusChange} // ✅ FIXED: This now uses the enhanced updateOrderStatus
          onNewOrder={businessHandlers.newOrder}
          onFollowUp={handleFollowUp}
          onViewDetail={handleViewDetail}
          selectedIds={selectedIds}
          onSelectionChange={toggleOrderSelection}
          isSelectionMode={isSelectionMode}
          onSelectAll={() => selectAllOrders(finalOrders)}
          isAllSelected={isAllSelected}
        />
        
        {/* ✅ PAGINATION CONTROLS: Untuk mode lazy loading */}
        {paginationInfo.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 p-4 bg-white rounded-lg border">
            <div className="text-sm text-gray-600">
              Halaman {currentPage} dari {paginationInfo.totalPages}
              ({paginationInfo.totalCount} total pesanan)
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                Sebelumnya
              </Button>
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded text-sm font-medium">
                {currentPage}
              </span>
              <Button
                onClick={() => setCurrentPage(prev => Math.min(paginationInfo.totalPages, prev + 1))}
                disabled={currentPage === paginationInfo.totalPages}
                variant="outline"
                size="sm"
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
        
        <OrderDialogs
          showOrderForm={pageState.dialogs.orderForm}
          editingOrder={pageState.editingOrder}
          showTemplateManager={pageState.dialogs.templateManager}
          selectedOrderForTemplate={pageState.selectedOrderForTemplate}
          showDetailDialog={pageState.dialogs.detail}
          detailOrder={pageState.viewingOrder}
          onSubmitOrder={businessHandlers.submitOrder}
          onCloseOrderForm={dialogHandlers.closeOrderForm}
          onCloseTemplateManager={dialogHandlers.closeTemplateManager}
          onCloseDetail={dialogHandlers.closeDetail}
        />
      </SafeSuspense>
      
      {/* ✅ DEBUG: Real-time monitoring component - only in development */}
      {import.meta.env.DEV && <OrderUpdateMonitor />}
    </div>
  );
};

// ✅ CONSOLE TEST: Jalankan ini di browser console untuk test langsung
// window.testOrderStatusUpdate = async () => {
//   try {
//     console.log('🔍 Testing order status update...');
    
//     // Get user
//     const { data: user } = await supabase.auth.getUser();
//     console.log('User ID:', user.user?.id);
    
//     // Get first order
//     const { data: orders } = await supabase
//       .from('orders')
//       .select('id, status, nomor_pesanan')
//       .eq('user_id', user.user.id)
//       .limit(1);
    
//     if (!orders || orders.length === 0) {
//       console.log('❌ No orders found');
//       return;
//     }
    
//     const order = orders[0];
//     const newStatus = order.status === 'pending' ? 'confirmed' : 'pending';
    
//     console.log(`Testing: ${order.status} → ${newStatus} for order ${order.nomor_pesanan}`);
    
//     // Direct update
//     const { data, error } = await supabase
//       .from('orders')
//       .update({ status: newStatus })
//       .eq('id', order.id)
//       .eq('user_id', user.user.id)
//       .select()
//       .single();
    
//     if (error) {
//       console.log('❌ Update failed:', error);
//       return;
//     }
    
//     console.log('✅ Update successful:', data);
//     console.log('🔄 Refreshing page...');
    
//     // Refresh page to see changes
//     window.location.reload();
    
//   } catch (error) {
//     console.log('❌ Test failed:', error);
//   }
// };

export default OrdersPage;