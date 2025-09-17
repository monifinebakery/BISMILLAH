// src/components/orders/components/OrdersPage.tsx - FIXED STATUS UPDATE INTEGRATION

import React, { useState, useCallback, useMemo, useEffect, Suspense } from 'react';
import { SafeSuspense } from '@/components/common/UniversalErrorBoundary';
import { Button } from '@/components/ui/button';
import { LoadingSkeleton, TableSkeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

// ✅ CONSOLIDATED: Order context and hooks
import { useOrder } from '../context/OrderContext';
import { useOrderUI } from '../hooks/useOrderUI';
import { useOrderTable } from '../hooks/useOrderTable';
import { useOrderActions } from '../hooks/useOrderActions';

// ✅ CONSOLIDATED: Template integration (enhanced)
import { useOrderFollowUp } from '../hooks/useOrderFollowUp';

// ✅ IMPORTED SUBCOMPONENTS
import OrderHeader from './OrderHeader';
import OrderPagination from './OrderPagination';

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

  // Snake_case operations for new submissions/updates
  const {
    addOrder: addOrderSnake,
    updateOrder: updateOrderSnake,
    updateOrderStatus: updateOrderStatusSnake,
    deleteOrder: deleteOrderSnake
  } = useOrderOperationsSnake();

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
      totalValue: dataToUse.reduce((sum: number, order: any) => sum + (order.total_pesanan || order.totalPesanan || 0), 0),
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
      logger.component('OrdersPage', 'Opening order detail dialog', { orderId: order.id, nomorPesanan: (order as any).nomor_pesanan || (order as any)['nomorPesanan'] });
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

  // ✅ Business logic handlers extracted
  const businessHandlers = useOrderActions({
    context: contextValue,
    ordersForView: finalOrders,
    selectedIds: uiState.selectedOrderIds,
    toggleSelectOrder: uiState.toggleSelectOrder,
    editingOrder: pageState.editingOrder,
    dialog: {
      openOrderForm: (order?: Order | null) => dialogHandlers.openOrderForm(order ?? null),
      closeOrderForm: dialogHandlers.closeOrderForm,
    },
  });

  // ✅ ENHANCED: WhatsApp integration with template
  const handleFollowUp = useCallback(
    (order: Order) => {
      logger.component('OrdersPage', 'Follow up initiated:', {
        orderId: order.id,
        nomorPesanan: (order as any).nomor_pesanan || (order as any)['nomorPesanan'],
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
        orderNumber: (order as any).nomor_pesanan || (order as any).order_number || (order as any)['nomorPesanan']
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
      nomorPesanan: (order as any).nomor_pesanan || (order as any)['nomorPesanan']
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
    <div className="w-full max-w-full px-2 sm:px-4 py-4 overflow-hidden">
      {/* ✅ DEBUG: Context debugger - only in development */}
      {import.meta.env.DEV && <ContextDebugger />}
      
      {/* ✅ Extracted: Header */}
      <OrderHeader
        onOpenTemplateManager={() => {
          logger.component('OrdersPage', 'Template manager button clicked');
          dialogHandlers.openTemplateManager();
        }}
        onNewOrder={() => {
          logger.component('OrdersPage', 'New order button clicked from header');
          businessHandlers.newOrder();
        }}
        showDebug={import.meta.env.DEV}
        onDebugStatus={debugStatusUpdate}
      />

      {/* ✅ OPTIMIZED: Main content with better error handling */}
      <SafeSuspense 
        loadingMessage="" 
        size="lg"
        fallback={<LoadingSkeleton type="page" />}
      >
        {/* ✅ STATISTICS: Order statistics section */}
         <SafeSuspense 
           loadingMessage="" 
           size="md"
           fallback={<LoadingSkeleton type="card" className="h-32" />}
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
             loadingMessage="" 
             size="sm"
             fallback={<LoadingSkeleton type="form" className="h-16" />}
           >
             <BulkActions
                selectedOrders={selectedOrders}
                selectedIds={selectedIds}
                onClearSelection={clearSelection}
                onSelectAll={() => selectAllOrders(finalOrders)}
                isAllSelected={isAllSelected}
                totalCount={finalOrders.length}
                onRefresh={() => {
                  if (useLazyLoading) {
                    refetchPaginated();
                  } else {
                    refreshData();
                  }
                }}
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
        
        {/* ✅ Extracted: Pagination */}
        <OrderPagination
          currentPage={currentPage}
          totalPages={paginationInfo.totalPages}
          totalCount={paginationInfo.totalCount}
          onPrev={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          onNext={() => setCurrentPage(prev => Math.min(paginationInfo.totalPages, prev + 1))}
        />
        
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
