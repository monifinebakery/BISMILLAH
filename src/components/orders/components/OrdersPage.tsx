// src/components/orders/components/OrdersPage.tsx - Optimized Dependencies (8 → 6) + Logger + Context Debugger

import React, { useState, useCallback, Suspense, useMemo } from 'react';
import { FileText, Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// ✅ CONSOLIDATED: Order context and hooks
import { useOrder } from '../context/OrderContext';
import { useOrderUI } from '../hooks/useOrderUI';

// ✅ CONSOLIDATED: Template integration (enhanced)
import { useFollowUpTemplate, useProcessTemplate } from '@/contexts/FollowUpTemplateContext';

// ✅ ESSENTIAL TYPES: Only what's needed for this component
import type { Order, NewOrder } from '../types';

// ✅ SHARED COMPONENTS: Direct import
import { PageLoading } from './shared/LoadingStates';
import { logger } from '@/utils/logger';

// ✅ DEBUG: Context debugger for development
import ContextDebugger from '@/components/debug/ContextDebugger';

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
  };
  editingOrder: Order | null;
  selectedOrderForTemplate: Order | null;
}

const initialState: OrdersPageState = {
  dialogs: {
    orderForm: false,
    templateManager: false
  },
  editingOrder: null,
  selectedOrderForTemplate: null
};

const OrdersPage: React.FC = () => {
  logger.component('OrdersPage', 'Component mounted');

  // ✅ CONTEXTS: Direct usage
  const contextValue = useOrder();
  const { orders, loading, addOrder, updateOrder, deleteOrder } = contextValue;

  // ✅ TEMPLATE INTEGRATION: Enhanced with error handling
  const { getTemplate } = useFollowUpTemplate();
  const { processTemplate } = useProcessTemplate();

  // ✅ UI STATE: Optimized with memoization
  const uiState = useOrderUI(orders, 10);

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
    }
  }), []);

  // ✅ MEMOIZED: Business logic handlers
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
          toast.success('Pesanan berhasil dihapus');
        }
      } catch (error) {
        logger.error('Error deleting order:', error);
        toast.error('Gagal menghapus pesanan');
      }
    },

    statusChange: async (orderId: string, newStatus: string) => {
      try {
        if (!orderId || !newStatus) {
          logger.warn('Invalid parameters for status change:', { orderId, newStatus });
          toast.error('Parameter tidak valid');
          return;
        }

        logger.component('OrdersPage', 'Status change requested:', { orderId, newStatus });

        const success = await updateOrder(orderId, { status: newStatus as Order['status'] });
        if (success) {
          const order = orders.find(o => o.id === orderId);
          logger.success('Order status updated:', { orderId, newStatus, orderNumber: order?.nomorPesanan });
          toast.success(`Status pesanan #${order?.nomorPesanan || orderId} berhasil diubah.`);
        }
      } catch (error) {
        logger.error('Error updating status:', error);
        toast.error('Gagal mengubah status pesanan');
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
          toast.success(
            isEditingMode 
              ? 'Pesanan berhasil diperbarui.' 
              : 'Pesanan baru berhasil ditambahkan.'
          );
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
  }), [pageState.editingOrder, orders, updateOrder, addOrder, deleteOrder, uiState, dialogHandlers]);

  // ✅ ENHANCED: WhatsApp integration with template
  const handleFollowUp = useCallback((order: Order) => {
    logger.component('OrdersPage', 'Follow up initiated:', { 
      orderId: order.id, 
      nomorPesanan: order.nomorPesanan,
      hasPhone: !!order.teleponPelanggan,
      status: order.status
    });
    
    if (!order.teleponPelanggan) {
      logger.warn('No phone number for follow up:', order.id);
      toast.error('Tidak ada nomor WhatsApp untuk follow up');
      return;
    }

    try {
      // Get template based on order status
      const template = getTemplate(order.status);
      
      if (!template) {
        logger.warn('No template found for status:', order.status);
        toast.error('Template untuk status ini belum tersedia');
        return;
      }

      logger.debug('Processing follow up template:', { 
        orderStatus: order.status, 
        templateId: template.id 
      });

      // Process template with order data
      const processedMessage = processTemplate(template, order);
      
      // Format phone number
      const cleanPhoneNumber = order.teleponPelanggan.replace(/\D/g, '');
      
      // Create WhatsApp URL
      const whatsappUrl = `https://wa.me/${cleanPhoneNumber}?text=${encodeURIComponent(processedMessage)}`;
      
      // Open WhatsApp
      window.open(whatsappUrl, '_blank');
      
      logger.success('Follow up WhatsApp opened:', {
        customer: order.namaPelanggan,
        orderNumber: order.nomorPesanan,
        templateUsed: template.name
      });
      
      toast.success(`Follow up untuk ${order.namaPelanggan} berhasil dibuka di WhatsApp`);
      
      // Set selected order for template manager
      setPageState(prev => ({
        ...prev,
        selectedOrderForTemplate: order
      }));
      
    } catch (error) {
      logger.error('Error processing follow up template:', error);
      toast.error('Gagal memproses template follow up');
      
      // Fallback to simple message
      logger.info('Using fallback follow up message for order:', order.id);
      const fallbackMessage = `Halo ${order.namaPelanggan}, saya ingin menanyakan status pesanan #${order.nomorPesanan}`;
      const cleanPhoneNumber = order.teleponPelanggan.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${cleanPhoneNumber}?text=${encodeURIComponent(fallbackMessage)}`;
      window.open(whatsappUrl, '_blank');
      
      logger.success('Fallback follow up opened:', order.nomorPesanan);
    }
  }, [getTemplate, processTemplate]);

  // ✅ ENHANCED: View detail handler
  const handleViewDetail = useCallback((order: Order) => {
    logger.component('OrdersPage', 'View detail requested:', { 
      orderId: order.id, 
      nomorPesanan: order.nomorPesanan 
    });
    
    // Set order for template manager (could be used for template preview)
    setPageState(prev => ({
      ...prev,
      selectedOrderForTemplate: order
    }));
    
    // Placeholder for detail view - can be developed further
    toast.info(`Detail pesanan #${order.nomorPesanan} - Coming soon!`);
    
    // TODO: Implement detail modal or navigate to detail page
    logger.debug('Order detail view - feature coming soon');
  }, []);

  // Log current state for debugging
  logger.debug('OrdersPage render state:', {
    ordersCount: orders.length,
    isLoading: loading,
    selectedOrdersCount: uiState.selectedOrderIds.length,
    dialogsOpen: pageState.dialogs,
    isEditingOrder: !!pageState.editingOrder
  });

  // ✅ EARLY RETURN: Loading state
  if (loading) {
    logger.component('OrdersPage', 'Rendering loading state');
    return <PageLoading />;
  }

  return (
    <div className="container mx-auto p-4 sm:p-8">
      {/* ✅ DEBUG: Context debugger - only in development */}
      {import.meta.env.DEV && <ContextDebugger />}
      
      {/* ✅ ENHANCED: Header with template integration info */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-6 mb-8 shadow-xl">
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
          <Button
            onClick={() => {
              logger.component('OrdersPage', 'Template manager button clicked');
              dialogHandlers.openTemplateManager();
            }}
            variant="outline"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow-md hover:bg-blue-50 transition-all duration-200 hover:shadow-lg border-blue-300"
          >
            <MessageSquare className="h-5 w-5" />
            Kelola Template WhatsApp
          </Button>
          
          <Button
            onClick={() => {
              logger.component('OrdersPage', 'New order button clicked from header');
              businessHandlers.newOrder();
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-orange-600 font-semibold rounded-lg shadow-md hover:bg-gray-100 transition-all duration-200 hover:shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Pesanan Baru
          </Button>
        </div>
      </header>

      {/* ✅ OPTIMIZED: Main content with better error handling */}
      <Suspense fallback={
        <div className="space-y-4">
          <div className="h-12 bg-gray-100 rounded animate-pulse" />
          <div className="h-16 bg-gray-100 rounded animate-pulse" />
          <div className="h-64 bg-gray-100 rounded animate-pulse" />
        </div>
      }>
        <OrderControls 
          uiState={uiState} 
          loading={loading} 
        />
        <OrderFilters 
          uiState={uiState} 
          loading={loading} 
        />
        <OrderTable
          uiState={uiState}
          loading={loading}
          onEditOrder={businessHandlers.editOrder}
          onDeleteOrder={businessHandlers.deleteOrder}
          onStatusChange={businessHandlers.statusChange}
          onNewOrder={businessHandlers.newOrder}
          onFollowUp={handleFollowUp}
          onViewDetail={handleViewDetail}
        />
        <OrderDialogs
          showOrderForm={pageState.dialogs.orderForm}
          editingOrder={pageState.editingOrder}
          showTemplateManager={pageState.dialogs.templateManager}
          selectedOrderForTemplate={pageState.selectedOrderForTemplate}
          onSubmitOrder={businessHandlers.submitOrder}
          onCloseOrderForm={dialogHandlers.closeOrderForm}
          onCloseTemplateManager={dialogHandlers.closeTemplateManager}
        />
      </Suspense>
    </div>
  );
};

export default OrdersPage;