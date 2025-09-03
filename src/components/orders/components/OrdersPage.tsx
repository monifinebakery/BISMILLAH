// src/components/orders/components/OrdersPage.tsx - FIXED STATUS UPDATE INTEGRATION

import React, { useState, useCallback, Suspense, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// ✅ CONSOLIDATED: Order context and hooks
import { useOrder } from '../context/OrderContext';
import { useOrderUI } from '../hooks/useOrderUI';
import { useOrderTable } from '../hooks/useOrderTable';

// ✅ CONSOLIDATED: Template integration (enhanced)
import { useOrderFollowUp } from '../hooks/useOrderFollowUp';

// ✅ IMPORT FUNCTIONALITY: Import component for CSV uploads
import ImportButton from './ImportButton';

// ✅ TABLE FILTERS: Simple filters component like Purchase
import { OrderTableFilters } from './table/OrderTableFilters';

// ✅ BULK OPERATIONS: Lazy load BulkActions
const BulkActions = React.lazy(() => 
  import('./BulkActions').catch((error) => {
    logger.error('Failed to load BulkActions component:', error);
    return {
      default: () => null
    };
  })
);

// ✅ ESSENTIAL TYPES: Only what's needed for this component
import type { Order, NewOrder, OrderStatus } from '../types';

// ✅ STATISTICS: Import OrderStats component dan hook
import OrderStats from './OrderStats';
import { useOrderStats } from '../hooks/useOrderStats';

// ✅ SHARED COMPONENTS: Direct import
import { PageLoading } from './shared/LoadingStates';
import { logger } from '@/utils/logger';

// ✅ DEBUG: Context debugger for development
import ContextDebugger from '@/components/debug/ContextDebugger';
import OrderUpdateMonitor from '@/components/debug/OrderUpdateMonitor';
import OrderEventMonitor from '@/components/debug/OrderEventMonitor';

// ✅ TAMBAHKAN IMPORTS: Untuk fallback langsung ke Supabase dan getStatusText
import { supabase } from '@/integrations/supabase/client';
import { getStatusText } from '../constants';

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

// ✅ INTERFACES: Simplified component state - only template manager needed now
interface OrdersPageState {
  dialogs: {
    templateManager: boolean;
  };
  selectedOrderForTemplate: Order | null;
}

const initialState: OrdersPageState = {
  dialogs: {
    templateManager: false
  },
  selectedOrderForTemplate: null
};

const OrdersPage: React.FC = () => {
  logger.component('OrdersPage', 'Component mounted');

  // ✅ NAVIGATION: React Router navigation
  const navigate = useNavigate();

  // ✅ AUTH: Get current user
  const { user } = useAuth();

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

  // ✅ SIMPLIFIED: Use context data directly like PurchasePage
  const finalOrders = orders;
  const finalIsLoading = loading;
  const finalError = null; // Error handling is done in context

  // ✅ TEMPLATE INTEGRATION: Gunakan hook khusus untuk follow up
  const { getWhatsappUrl } = useOrderFollowUp();
  
  // ✅ STATISTICS: Hook untuk menghitung statistik pesanan
  const { stats: orderStats, isCalculating: isStatsLoading } = useOrderStats(finalOrders);
  
  // ✅ IMPORT REFRESH LISTENER: Listen untuk bulk import events
  React.useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const setupListener = async () => {
      const { orderEvents } = await import('../utils/orderEvents');
      
      unsubscribe = orderEvents.on('order:bulk_imported', (data) => {
        console.log('📡 Bulk import event received in OrdersPage:', data);
        // Refresh context data after import
        if (refreshData) {
          setTimeout(() => {
            refreshData();
            console.log('✅ Orders data refreshed after bulk import');
          }, 500);
        }
      });
    };
    
    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [refreshData]);

  // ✅ SIMPLE STATE: Use useOrderUI hook for local filtering, pagination, and selection
  const uiState = useOrderUI(finalOrders, 10);
  
  // ✅ BULK OPERATIONS: Table selection state - ONLY for selection
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

  // ✅ SIMPLIFIED: Only template manager handler needed now
  const dialogHandlers = useMemo(() => ({
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
    }
  }), []);

  // ✅ 🚀 FIXED: Business logic handlers with navigation to full pages
  const businessHandlers = useMemo(() => ({
    newOrder: () => {
      try {
        logger.component('OrdersPage', 'New order button clicked - navigating to add page');
        navigate('/pesanan/add');
      } catch (error) {
        logger.error('Error navigating to new order page:', error);
        toast.error('Gagal membuka halaman pesanan baru');
      }
    },

    editOrder: (order: Order) => {
      try {
        if (!order?.id) {
          logger.warn('Invalid order data for edit:', order);
          toast.error('Data pesanan tidak valid');
          return;
        }
        logger.component('OrdersPage', 'Edit order requested - navigating to edit page:', { orderId: order.id, nomorPesanan: order.nomorPesanan });
        navigate(`/pesanan/edit/${order.id}`);
      } catch (error) {
        logger.error('Error navigating to edit order page:', error);
        toast.error('Gagal membuka halaman edit pesanan');
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
            logger.warn('updateOrderStatus failed:', error, 'trying fallback');
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
          .select(`
            id,
            nomor_pesanan,
            tanggal,
            nama_pelanggan,
            telepon_pelanggan,
            email_pelanggan,
            alamat_pengiriman,
            status,
            total_pesanan,
            catatan,
            items,
            created_at,
            updated_at
          `) // ✅ Get full order data for financial sync
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
        
        // ✅ STEP 4: Trigger manual refresh
        if (typeof contextValue.refreshData === 'function') {
          logger.debug('Triggering manual refresh');
          await contextValue.refreshData();
        } else {
          logger.warn('refreshData not available, page might need manual refresh');
          // Fallback: reload page
          setTimeout(() => window.location.reload(), 1000);
        }

      } catch (error) {
        logger.error('Error updating status:', error);
        toast.error(`Gagal mengubah status pesanan: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    // NOTE: submitOrder is no longer needed since we moved to full pages
    // Kept for compatibility but not used
  }), [
    navigate, // ✅ NAVIGATION: Include navigate dependency
    finalOrders, 
    updateOrderStatus, // ✅ FIXED: Include updateOrderStatus dependency
    deleteOrder, 
    uiState, 
    contextValue // ✅ FIXED: Use entire contextValue to avoid stale closures
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

  // ✅ ENHANCED: View detail handler with navigation to full page
  const handleViewDetail = useCallback((order: Order) => {
    try {
      if (!order?.id) {
        logger.warn('Invalid order data for view:', order);
        toast.error('Data pesanan tidak valid');
        return;
      }
      logger.component('OrdersPage', 'View detail requested - navigating to view page:', {
        orderId: order.id,
        nomorPesanan: order.nomorPesanan
      });
      navigate(`/pesanan/view/${order.id}`);
    } catch (error) {
      logger.error('Error navigating to view order page:', error);
      toast.error('Gagal membuka halaman detail pesanan');
    }
  }, [navigate]);

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
    <div className="w-full p-4 sm:p-8">
      {/* ✅ DEBUG: Context debugger - only in development */}
      {import.meta.env.DEV && <ContextDebugger />}
      {import.meta.env.DEV && <OrderEventMonitor />}
      
      {/* ✅ ENHANCED: Header with template integration info, statistics, and debug button */}
      <header className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-6 mb-8 border">
        {/* Top Section: Title and Actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 lg:mb-0">
          <div className="flex items-center gap-4 mb-4 lg:mb-0">
            <div className="flex-shrink-0 bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Manajemen Pesanan</h1>
              <p className="text-sm opacity-90 mt-1">
                Kelola semua pesanan dari pelanggan Anda dengan template WhatsApp otomatis.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
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
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-all duration-200 border-blue-300"
            >
              <MessageSquare className="h-5 w-5" />
              <span className="hidden sm:inline">Kelola Template WhatsApp</span>
              <span className="sm:hidden">Template</span>
            </Button>
            
            <Button
              onClick={() => {
                logger.component('OrdersPage', 'New order button clicked from header');
                businessHandlers.newOrder();
              }}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-orange-600 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200"
            >
              <Plus className="h-5 w-5" />
              Pesanan Baru
            </Button>
          </div>
        </div>
        
        {/* ✅ STATISTICS: Order statistics dalam header dengan background gradient */}
        <OrderStats 
          stats={orderStats} 
          isLoading={isStatsLoading || finalIsLoading}
        />
      </header>

      {/* ✅ OPTIMIZED: Main content with better error handling */}
      <Suspense fallback={
        <div className="space-y-4">
          <div className="h-12 bg-gray-100 rounded animate-pulse" />
          <div className="h-16 bg-gray-100 rounded animate-pulse" />
          <div className="h-64 bg-gray-100 rounded animate-pulse" />
        </div>
      }>
        {/* ✅ TABLE FILTERS: Simple filters and pagination like Purchase */}
        <OrderTableFilters
          searchQuery={uiState.filters.search}
          setSearchQuery={(query) => uiState.updateFilters({ search: query })}
          statusFilter={uiState.filters.status}
          setStatusFilter={(status) => uiState.updateFilters({ status })}
          itemsPerPage={uiState.itemsPerPage}
          setItemsPerPage={uiState.setItemsPerPage}
          filteredCount={uiState.filteredOrders.length}
          selectedItemsCount={selectedIds.length}
          onClearSelection={clearSelection}
          onBulkDelete={() => {/* TODO: Implement bulk delete */}}
          onResetFilters={uiState.clearFilters}
          onToggleSelectionMode={() => {
            if (isSelectionMode) {
              exitSelectionMode();
            } else {
              enterSelectionMode();
            }
          }}
          isSelectionMode={isSelectionMode}
        />
        
        {/* ✅ BULK ACTIONS: Komponen untuk operasi massal */}
         {isSelectionMode && (
           <Suspense fallback={<div className="h-16 bg-gray-100 rounded animate-pulse" />}>
             <BulkActions
                selectedOrders={selectedOrders}
                selectedIds={selectedIds}
                onClearSelection={clearSelection}
                onSelectAll={() => selectAllOrders(finalOrders)}
                isAllSelected={isAllSelected}
                totalCount={finalOrders.length}
              />
           </Suspense>
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
        
        
        {/* ✅ ONLY TEMPLATE MANAGER: Keep only template manager dialog since form and detail are now full pages */}
        {pageState.dialogs.templateManager && (
          <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>}>
            <OrderDialogs
              showOrderForm={false}
              editingOrder={null}
              showTemplateManager={pageState.dialogs.templateManager}
              selectedOrderForTemplate={pageState.selectedOrderForTemplate}
              showDetailDialog={false}
              detailOrder={null}
              onSubmitOrder={() => {}}
              onCloseOrderForm={() => {}}
              onCloseTemplateManager={dialogHandlers.closeTemplateManager}
              onCloseDetail={() => {}}
            />
          </Suspense>
        )}
      </Suspense>
      
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