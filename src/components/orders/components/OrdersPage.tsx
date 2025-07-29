// 🎯 Enhanced OrdersPage dengan FollowUp Template Integration
import React, { useState, useCallback, Suspense } from 'react';
import { FileText, Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useOrder } from '../context/OrderContext';
import { useOrderUI } from '../hooks/useOrderUI';
import { useFollowUpTemplate, useProcessTemplate } from '@/contexts/FollowUpTemplateContext';
import type { Order, NewOrder } from '../types';
import { PageLoading } from './shared/LoadingStates';

// Lazy load heavy components
const OrderTable = React.lazy(() => import('./OrderTable'));
const OrderFilters = React.lazy(() => import('./OrderFilters'));
const OrderControls = React.lazy(() => import('./OrderControls'));
const OrderDialogs = React.lazy(() => import('./OrderDialogs'));

const OrdersPage: React.FC = () => {
  // Get context data
  const contextValue = useOrder();
  const { orders, loading, addOrder, updateOrder, deleteOrder } = contextValue;

  // ✅ ENHANCED: Template hooks integration
  const { getTemplate } = useFollowUpTemplate();
  const { processTemplate } = useProcessTemplate();

  // UI state management dengan logika asli
  const uiState = useOrderUI(orders, 10);

  // Dialog states dari kode asli
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [selectedOrderForTemplate, setSelectedOrderForTemplate] = useState<Order | null>(null);

  // Event handlers dengan semua logika asli
  const handleNewOrder = useCallback(() => {
    try {
      setEditingOrder(null);
      setShowOrderForm(true);
    } catch (error) {
      console.error('Error opening new order form:', error);
      toast.error('Gagal membuka form pesanan baru');
    }
  }, []);

  const handleEditOrder = useCallback((order: Order) => {
    try {
      if (!order?.id) {
        toast.error('Data pesanan tidak valid');
        return;
      }
      setEditingOrder(order);
      setShowOrderForm(true);
    } catch (error) {
      console.error('Error opening edit form:', error);
      toast.error('Gagal membuka form edit pesanan');
    }
  }, []);

  const handleDeleteOrder = useCallback(async (orderId: string) => {
    try {
      if (!orderId) {
        toast.error('ID pesanan tidak valid');
        return;
      }

      // Remove from selection jika dipilih - dari kode asli
      if (uiState.selectedOrderIds.includes(orderId)) {
        uiState.toggleSelectOrder(orderId, false);
      }

      const success = await deleteOrder(orderId);
      if (success) {
        toast.success('Pesanan berhasil dihapus');
      }
    } catch (error) {
      toast.error('Gagal menghapus pesanan');
      console.error('Error deleting order:', error);
    }
  }, [deleteOrder, uiState]);

  const handleStatusChange = useCallback(async (orderId: string, newStatus: string) => {
    try {
      if (!orderId || !newStatus) {
        toast.error('Parameter tidak valid');
        return;
      }

      const success = await updateOrder(orderId, { status: newStatus as Order['status'] });
      if (success) {
        const order = orders.find(o => o.id === orderId);
        toast.success(`Status pesanan #${order?.nomorPesanan || orderId} berhasil diubah.`);
      }
    } catch (error) {
      toast.error('Gagal mengubah status pesanan');
      console.error('Error updating status:', error);
    }
  }, [updateOrder, orders]);

  const handleSubmitOrder = useCallback(async (data: Partial<Order> | Partial<NewOrder>) => {
    const isEditingMode = !!editingOrder;
    
    try {
      if (!data) {
        toast.error('Data pesanan tidak valid');
        return;
      }

      let success = false;
      if (isEditingMode && editingOrder?.id) {
        success = await updateOrder(editingOrder.id, data);
      } else {
        success = await addOrder(data as NewOrder);
      }

      if (success) {
        toast.success(
          isEditingMode 
            ? 'Pesanan berhasil diperbarui.' 
            : 'Pesanan baru berhasil ditambahkan.'
        );
        setShowOrderForm(false);
        setEditingOrder(null);
      }
    } catch (error) {
      toast.error(
        isEditingMode 
          ? 'Gagal memperbarui pesanan' 
          : 'Gagal menambahkan pesanan'
      );
      console.error('Error submitting order:', error);
    }
  }, [editingOrder, updateOrder, addOrder]);

  // ✅ ENHANCED: Follow Up Handler dengan Template Integration
  const handleFollowUp = useCallback((order: Order) => {
    console.log('✅ Follow up initiated from OrdersPage for:', order.nomorPesanan);
    
    if (!order.telefonPelanggan) {
      toast.error('Tidak ada nomor WhatsApp untuk follow up');
      return;
    }

    try {
      // Get template berdasarkan status order
      const template = getTemplate(order.status);
      
      if (!template) {
        toast.error('Template untuk status ini belum tersedia');
        return;
      }

      // Process template dengan data order
      const processedMessage = processTemplate(template, order);
      
      // Format nomor telepon
      const cleanPhoneNumber = order.telefonPelanggan.replace(/\D/g, '');
      
      // Buat WhatsApp URL
      const whatsappUrl = `https://wa.me/${cleanPhoneNumber}?text=${encodeURIComponent(processedMessage)}`;
      
      // Buka WhatsApp
      window.open(whatsappUrl, '_blank');
      
      toast.success(`Follow up untuk ${order.namaPelanggan} berhasil dibuka di WhatsApp`);
      
      // Optional: Set selected order for template manager
      setSelectedOrderForTemplate(order);
      
    } catch (error) {
      console.error('Error processing follow up template:', error);
      toast.error('Gagal memproses template follow up');
      
      // Fallback ke pesan sederhana
      const fallbackMessage = `Halo ${order.namaPelanggan}, saya ingin menanyakan status pesanan #${order.nomorPesanan}`;
      const cleanPhoneNumber = order.telefonPelanggan.replace(/\D/g, '');
      const whatsappUrl = `https://wa.me/${cleanPhoneNumber}?text=${encodeURIComponent(fallbackMessage)}`;
      window.open(whatsappUrl, '_blank');
    }
  }, [getTemplate, processTemplate]);

  // ✅ ENHANCED: View Detail Handler
  const handleViewDetail = useCallback((order: Order) => {
    console.log('✅ View detail initiated for:', order.nomorPesanan);
    
    // Set order for template manager (bisa digunakan untuk preview template)
    setSelectedOrderForTemplate(order);
    
    // Placeholder untuk detail view - bisa dikembangkan lebih lanjut
    toast.info(`Detail pesanan #${order.nomorPesanan} - Coming soon!`);
    
    // TODO: Implementasi modal detail atau navigate ke detail page
  }, []);

  // ✅ ENHANCED: Template Manager dengan Context Integration
  const handleOpenTemplateManager = useCallback(() => {
    try {
      setShowTemplateManager(true);
      
      // Optional: Reset selected order ketika buka template manager
      setSelectedOrderForTemplate(null);
      
    } catch (error) {
      console.error('Error opening template manager:', error);
      toast.error('Gagal membuka template manager');
    }
  }, []);

  const handleCloseTemplateManager = useCallback(() => {
    setShowTemplateManager(false);
    setSelectedOrderForTemplate(null);
  }, []);

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div className="container mx-auto p-4 sm:p-8">
      {/* ✅ ENHANCED: Header dengan template integration info */}
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
            onClick={handleOpenTemplateManager}
            variant="outline"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow-md hover:bg-blue-50 transition-all duration-200 hover:shadow-lg border-blue-300"
          >
            <MessageSquare className="h-5 w-5" />
            Kelola Template WhatsApp
          </Button>
          
          <Button
            onClick={handleNewOrder}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-orange-600 font-semibold rounded-lg shadow-md hover:bg-gray-100 transition-all duration-200 hover:shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Pesanan Baru
          </Button>
        </div>
      </header>

      {/* ✅ ENHANCED: Main content dengan template integration */}
      <Suspense fallback={<div className="animate-pulse bg-gray-200 h-48 rounded"></div>}>
        <OrderControls uiState={uiState} loading={loading} />
        <OrderFilters uiState={uiState} loading={loading} />
        <OrderTable
          uiState={uiState}
          loading={loading}
          onEditOrder={handleEditOrder}
          onDeleteOrder={handleDeleteOrder}
          onStatusChange={handleStatusChange}
          onNewOrder={handleNewOrder}
          onFollowUp={handleFollowUp} // ✅ ENHANCED: Pass follow up handler
          onViewDetail={handleViewDetail} // ✅ ENHANCED: Pass view detail handler
        />
        <OrderDialogs
          showOrderForm={showOrderForm}
          editingOrder={editingOrder}
          showTemplateManager={showTemplateManager}
          selectedOrderForTemplate={selectedOrderForTemplate} // ✅ ENHANCED: Pass selected order
          onSubmitOrder={handleSubmitOrder}
          onCloseOrderForm={() => setShowOrderForm(false)}
          onCloseTemplateManager={handleCloseTemplateManager} // ✅ ENHANCED: Use enhanced handler
        />
      </Suspense>
    </div>
  );
};

export default OrdersPage;