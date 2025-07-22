import React, { useState, useMemo } from 'react';
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Link } from 'react-router-dom';
import { Calendar as CalendarIcon, Plus, Search, Edit, Package, MessageSquare, FileText, ChevronLeft, ChevronRight, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useOrder } from '@/contexts/OrderContext';
import OrderForm from '@/components/OrderForm';
import { toast } from 'sonner';
import type { Order, NewOrder } from '@/types/order';
import WhatsappFollowUpModal from '@/components/WhatsappFollowUpModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from "@/components/ui/label";
import { formatDateForDisplay } from '@/utils/dateUtils';
import { orderStatusList, getStatusText, getStatusColor } from '@/constants/orderConstants';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const OrdersPage = () => {
  const isMobile = useIsMobile();

  // Get context values with proper fallbacks
  const contextValue = useOrder();
  const {
    orders = [],
    loading = false,
    addOrder = () => Promise.resolve(false),
    updateOrder = () => Promise.resolve(false),
    deleteOrder = () => Promise.resolve(false)
  } = contextValue || {};

  // --- State Hooks ---
  const [searchTerm, setSearchTerm] = useState('');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ 
    from: subDays(new Date(), 30), 
    to: new Date() 
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [selectedOrderForWhatsapp, setSelectedOrderForWhatsapp] = useState<Order | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // --- Handlers ---
  const handleFollowUpClick = (order: Order) => {
    setSelectedOrderForWhatsapp(order);
    setIsWhatsappModalOpen(true);
  };

  const getWhatsappTemplateByStatus = (status: string, orderData: Order): string => {
    if (!orderData) return '';
    
    const itemsText = (orderData.items || [])
      .map(item => `- ${item.namaBarang} (${item.quantity}x)`)
      .join('\n');
    
    const totalText = new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0 
    }).format(orderData.totalPesanan || 0);

    switch (status) {
      case 'confirmed':
        return `Halo kak ${orderData.namaPelanggan},\n\nPesanan Anda #${orderData.nomorPesanan} telah kami KONFIRMASI dan sedang kami siapkan.\n\nTerima kasih!`;
      case 'shipping':
        return `Halo kak ${orderData.namaPelanggan},\n\nKabar baik! Pesanan Anda #${orderData.nomorPesanan} sudah dalam proses PENGIRIMAN.\n\nMohon ditunggu kedatangannya ya. Terima kasih!`;
      case 'delivered':
        return `Halo kak ${orderData.namaPelanggan},\n\nPesanan Anda #${orderData.nomorPesanan} telah TIBA.\n\nTerima kasih telah berbelanja! Ditunggu pesanan selanjutnya 😊`;
      default: // pending & status lain
        return `Halo kak ${orderData.namaPelanggan},\n\nTerima kasih telah memesan. Ini detail pesanan Anda:\nNomor Pesanan: ${orderData.nomorPesanan}\n\nItem:\n${itemsText}\n\nTotal: ${totalText}\n\nMohon konfirmasinya. Terima kasih.`;
    }
  };
  
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const success = await updateOrder(orderId, { status: newStatus as Order['status'] });
      if (success) {
        const order = orders.find(o => o.id === orderId);
        toast.success(`Status pesanan #${order?.nomorPesanan || orderId} diubah menjadi "${getStatusText(newStatus)}".`);
      }
    } catch (error) {
      toast.error('Gagal mengubah status pesanan');
      console.error('Error updating order status:', error);
    }
  };

  const handleOpenEditOrderForm = (order: Order) => {
    setEditingOrder(order);
    setShowOrderForm(true);
  };

  const handleNewOrder = () => {
    setEditingOrder(null);
    setShowOrderForm(true);
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const success = await deleteOrder(orderId);
      if (success) {
        toast.success('Pesanan berhasil dihapus');
      }
    } catch (error) {
      toast.error('Gagal menghapus pesanan');
      console.error('Error deleting order:', error);
    }
  };

  const handleSubmit = async (data: Partial<Order> | Partial<NewOrder>) => {
    const isEditingMode = !!editingOrder;
    let success = false;

    try {
      if (isEditingMode && editingOrder?.id) {
        success = await updateOrder(editingOrder.id, data);
      } else {
        success = await addOrder(data as NewOrder);
      }

      if (success) {
        toast.success(isEditingMode ? 'Pesanan berhasil diperbarui.' : 'Pesanan baru berhasil ditambahkan.');
        setShowOrderForm(false);
        setEditingOrder(null);
      }
    } catch (error) {
      toast.error(isEditingMode ? 'Gagal memperbarui pesanan' : 'Gagal menambahkan pesanan');
      console.error('Error submitting order:', error);
    }
  };

  // --- Memoized Filtering and Pagination ---
  const filteredOrders = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return [];

    try {
      const rangeFrom = dateRange?.from ? startOfDay(dateRange.from) : null;
      const rangeTo = dateRange?.to ? endOfDay(dateRange.to) : null;

      return orders.filter(order => {
        if (!order) return false;

        const matchesSearch = 
          order.nomorPesanan?.toLowerCase().includes(searchTerm.toLowerCase()) || 
          order.namaPelanggan?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        
        let matchesDate = true;
        if (rangeFrom && rangeTo && order.tanggal) {
          try {
            const orderDate = new Date(order.tanggal);
            if (!isNaN(orderDate.getTime())) {
              matchesDate = orderDate >= rangeFrom && orderDate <= rangeTo;
            }
          } catch (error) {
            console.warn('Invalid date in order:', order.tanggal);
          }
        }
        
        return matchesSearch && matchesStatus && matchesDate;
      });
    } catch (error) {
      console.error('Error filtering orders:', error);
      return [];
    }
  }, [orders, searchTerm, statusFilter, dateRange]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = indexOfFirstItem + itemsPerPage;

  const currentItems = useMemo(() => {
    return filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredOrders, indexOfFirstItem, indexOfLastItem]);

  // Reset page when filters change
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // If context is not available, show error
  if (!contextValue) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Context Error</h2>
            <p className="text-gray-600">Order Context tidak tersedia. Pastikan komponen ini dibungkus dengan OrderProvider.</p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
            <span className="text-gray-600 font-medium">Memuat data pesanan...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-full">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              Manajemen Pesanan
            </h1>
            <p className="text-muted-foreground">Kelola semua pesanan dari pelanggan Anda.</p>
          </div>
        </div>
        <Button 
          className="flex items-center gap-2 bg-gradient-to-r from-[#FF9500] to-[#FF2E2E] hover:from-[#FF8A00] hover:to-[#E82A2A] text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 py-3 px-5 rounded-lg" 
          onClick={handleNewOrder}
        >
          <Plus className="h-5 w-5 stroke-[3]" /> 
          Pesanan Baru
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative sm:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Cari No. Pesanan / Nama..." 
                value={searchTerm} 
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }} 
                className="pl-10" 
              />
            </div>

            {/* Date Range */}
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  id="date" 
                  variant="outline" 
                  className={cn(
                    "w-full justify-start text-left font-normal", 
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? 
                      `${format(dateRange.from, "d LLL y")} - ${format(dateRange.to, "d LLL y")}` : 
                      format(dateRange.from, "d LLL y")
                  ) : (
                    <span>Pilih tanggal</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar 
                  initialFocus 
                  mode="range" 
                  defaultMonth={dateRange?.from} 
                  selected={dateRange} 
                  onSelect={(newRange) => {
                    setDateRange(newRange);
                    setCurrentPage(1);
                  }} 
                  numberOfMonths={isMobile ? 1 : 2} 
                />
              </PopoverContent>
            </Popover>

            {/* Status Filter */}
            <Select 
              value={statusFilter} 
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {orderStatusList.map((statusOption) => (
                  <SelectItem key={statusOption.key} value={statusOption.key}>
                    {statusOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daftar Pesanan</CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Label htmlFor="itemsPerPage">Baris per halaman:</Label>
              <Select 
                value={String(itemsPerPage)} 
                onValueChange={(v) => { 
                  setItemsPerPage(Number(v)); 
                  setCurrentPage(1); 
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor Pesanan</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="w-[180px]">Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length > 0 ? (
                  currentItems.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.nomorPesanan || '-'}
                      </TableCell>
                      <TableCell>
                        <div>{order.namaPelanggan || '-'}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.teleponPelanggan || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.tanggal ? formatDateForDisplay(order.tanggal) : '-'}
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={order.status} 
                          onValueChange={(newStatus) => handleStatusChange(order.id, newStatus)}
                        >
                          <SelectTrigger 
                            className={cn(
                              getStatusColor(order.status), 
                              "h-8 border-none text-xs"
                            )}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {orderStatusList.map(s => (
                              <SelectItem key={s.key} value={s.key}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="font-semibold">
                        Rp {order.totalPesanan?.toLocaleString('id-ID') || '0'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleOpenEditOrderForm(order)}
                            title="Edit Pesanan"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleFollowUpClick(order)}
                            title="Follow Up WhatsApp"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-red-500 hover:text-red-700"
                                title="Hapus Pesanan"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Anda Yakin?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tindakan ini tidak dapat dibatalkan. Pesanan #{order.nomorPesanan} akan dihapus secara permanen.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteOrder(order.id)} 
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Ya, Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      <div className="flex flex-col items-center gap-4">
                        <Package className="h-16 w-16 text-gray-300" />
                        <div className="text-center">
                          <p className="text-lg font-medium text-gray-600 mb-2">
                            {searchTerm || statusFilter !== 'all' || dateRange 
                              ? 'Tidak ada pesanan yang cocok dengan filter' 
                              : 'Belum ada pesanan'}
                          </p>
                          <p className="text-gray-500 text-sm">
                            {searchTerm || statusFilter !== 'all' || dateRange
                              ? 'Coba ubah filter pencarian Anda'
                              : 'Mulai dengan menambahkan pesanan pertama'}
                          </p>
                        </div>
                        {!searchTerm && statusFilter === 'all' && !dateRange && (
                          <Button
                            onClick={handleNewOrder}
                            className="bg-orange-500 hover:bg-orange-600 text-white"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Pesanan Pertama
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {filteredOrders.length > 0 && (
          <CardFooter className="flex items-center justify-between p-4">
            <div className="text-sm text-muted-foreground">
              Menampilkan {Math.min(filteredOrders.length, indexOfFirstItem + 1)} - {Math.min(filteredOrders.length, indexOfLastItem)} dari {filteredOrders.length} pesanan
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-4 text-sm">
                Hal {currentPage} / {totalPages || 1}
              </span>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Modals */}
      <OrderForm 
        open={showOrderForm} 
        onOpenChange={setShowOrderForm} 
        onSubmit={handleSubmit} 
        initialData={editingOrder} 
      />
      
      <WhatsappFollowUpModal
        isOpen={isWhatsappModalOpen}
        onClose={() => setIsWhatsappModalOpen(false)}
        order={selectedOrderForWhatsapp}
        getWhatsappTemplateByStatus={getWhatsappTemplateByStatus}
      />
    </div>
  );
};

export default OrdersPage;