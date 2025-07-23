import React, { useState, useMemo, useEffect, Component } from 'react';
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, toDate } from 'date-fns';
import { Link } from 'react-router-dom';
import { Calendar as CalendarIcon, Plus, Search, Edit, Package, MessageSquare, FileText, ChevronLeft, ChevronRight, Trash2, AlertTriangle, Loader2, CheckSquare, X, MoreHorizontal, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogClose, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from "@/components/ui/label";
import { formatDateForDisplay } from '@/utils/dateUtils';
import { orderStatusList, getStatusText, getStatusColor } from '@/constants/orderConstants';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import FollowUpTemplateManager from '@/components/FollowUpTemplateManager';
import StatusCell from '@/components/StatusCell';
import { id } from 'date-fns/locale';

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-4 text-red-600">Error: {this.state.error?.message}</div>;
    }
    return this.props.children;
  }
}

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
    from: startOfDay(subDays(new Date(), 30)),
    to: endOfDay(new Date())
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [selectedOrderForWhatsapp, setSelectedOrderForWhatsapp] = useState<Order | null>(null);

  // Bulk operation states
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showBulkEditDialog, setShowBulkEditDialog] = useState(false);
  const [bulkEditStatus, setBulkEditStatus] = useState<string>('');

  // Template manager states
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [selectedOrderForTemplate, setSelectedOrderForTemplate] = useState<Order | null>(null);

  // --- Handlers ---
  const handleFollowUpClick = (order: Order) => {
    setSelectedOrderForTemplate(order);
    setShowTemplateManager(true);
  };

  const handleTemplateManager = () => {
    setSelectedOrderForTemplate(null);
    setShowTemplateManager(true);
  };

  const handleSendWhatsApp = (message: string, order: Order) => {
    console.log('Sending WhatsApp message:', { message, order });
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
      setSelectedOrderIds(prev => prev.filter(sId => sId !== orderId));
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

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedOrderIds.length === 0) {
      toast.warning('Pilih item yang ingin dihapus terlebih dahulu');
      return;
    }

    setSelectedOrderIds([]);
    const deletePromises = selectedOrderIds.map(id => deleteOrder(id));
    const results = await Promise.allSettled(deletePromises);

    const successCount = results.filter(result => result.status === 'fulfilled').length;
    const failCount = results.length - successCount;

    if (successCount > 0) {
      toast.success(`${successCount} pesanan berhasil dihapus!`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} pesanan gagal dihapus`);
    }

    setShowBulkDeleteDialog(false);
    setIsSelectionMode(false);
  };

  const handleBulkEdit = async () => {
    if (selectedOrderIds.length === 0 || !bulkEditStatus) {
      toast.warning('Pilih item dan status yang ingin diubah');
      return;
    }

    const updatePromises = selectedOrderIds.map(id =>
      updateOrder(id, { status: bulkEditStatus as Order['status'] })
    );
    const results = await Promise.allSettled(updatePromises);

    const successCount = results.filter(result => result.status === 'fulfilled').length;
    const failCount = results.length - successCount;

    if (successCount > 0) {
      toast.success(`${successCount} pesanan berhasil diubah statusnya!`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} pesanan gagal diubah statusnya`);
    }

    setShowBulkEditDialog(false);
    setSelectedOrderIds([]);
    setBulkEditStatus('');
    setIsSelectionMode(false);
  };

  const toggleSelectAllCurrent = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrderIds(prev => [...new Set([...prev, ...currentItems.map(o => o.id)])]);
    } else {
      setSelectedOrderIds(prev => prev.filter(id => !currentItems.some(o => o.id === id)));
    }
  };

  // --- Memoized Filtering and Pagination ---
  const filteredOrders = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return [];

    try {
      const rangeFrom = dateRange?.from ? new Date(dateRange.from) : null;
      const rangeTo = dateRange?.to ? new Date(dateRange.to) : null;

      return orders.filter(order => {
        if (!order || !order.tanggal) return false;

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
            } else {
              matchesDate = false;
            }
          } catch (error) {
            console.warn('Invalid date in order:', order.tanggal);
            matchesDate = false;
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

  const allCurrentSelected = currentItems.length > 0 && currentItems.every(o => selectedOrderIds.includes(o.id));
  const someCurrentSelected = currentItems.some(o => selectedOrderIds.includes(o.id)) && !allCurrentSelected;

  // Reset page when filters change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // 🔧 FIXED: Enhanced Date Presets Component
  const DatePresets = ({ setDateRange, onClose }) => {
    const today = new Date();
    const presets = [
      { 
        label: "Hari Ini", 
        range: { 
          from: startOfDay(today), 
          to: endOfDay(today) 
        } 
      },
      { 
        label: "Kemarin", 
        range: { 
          from: startOfDay(subDays(today, 1)), 
          to: endOfDay(subDays(today, 1)) 
        } 
      },
      { 
        label: "7 Hari Terakhir", 
        range: { 
          from: startOfDay(subDays(today, 6)), 
          to: endOfDay(today) 
        } 
      },
      { 
        label: "30 Hari Terakhir", 
        range: { 
          from: startOfDay(subDays(today, 29)), 
          to: endOfDay(today) 
        } 
      },
      { 
        label: "Bulan Ini", 
        range: { 
          from: startOfMonth(today), 
          to: endOfMonth(today) 
        } 
      },
      { 
        label: "Bulan Lalu", 
        range: { 
          from: startOfMonth(subMonths(today, 1)), 
          to: endOfMonth(subMonths(today, 1)) 
        } 
      },
    ];

    return (
      <div className="border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50/50">
        <div className="p-3">
          <h4 className="font-medium text-gray-700 mb-3 text-sm">Pilih Cepat</h4>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
            {presets.map(({ label, range }) => (
              <Button
                key={label}
                variant="ghost"
                size="sm"
                className="justify-start text-sm hover:bg-gray-100 h-9 px-3 text-gray-700 border border-transparent hover:border-gray-200"
                onClick={() => {
                  try {
                    setDateRange(range);
                    setCurrentPage(1);
                    if (onClose) onClose();
                  } catch (error) {
                    console.error('Error setting date range preset:', error);
                  }
                }}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Format date range for display
  const formatDateRange = () => {
    if (!dateRange?.from) return "Pilih rentang tanggal";
    
    try {
      if (dateRange.to && dateRange.from !== dateRange.to) {
        return `${format(dateRange.from, "d MMM yyyy", { locale: id })} - ${format(dateRange.to, "d MMM yyyy", { locale: id })}`;
      } else {
        return format(dateRange.from, "d MMMM yyyy", { locale: id });
      }
    } catch (error) {
      console.error('Error formatting date range:', error);
      return "Tanggal tidak valid";
    }
  };

  // If context is not available, show error
  if (!contextValue) {
    return (
      <ErrorBoundary>
        <div className="container mx-auto p-4 sm:p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Context Error</h2>
              <p className="text-gray-600">Order Context tidak tersedia. Pastikan komponen ini dibungkus dengan OrderProvider.</p>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Loading state
  if (loading) {
    return (
      <ErrorBoundary>
        <div className="container mx-auto p-4 sm:p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
              <span className="text-gray-600 font-medium">Memuat data pesanan...</span>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto p-4 sm:p-8">
        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-6 mb-8 shadow-xl">
          <div className="flex items-center gap-4 mb-4 lg:mb-0">
            <div className="flex-shrink-0 bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Manajemen Pesanan</h1>
              <p className="text-sm opacity-90 mt-1">Kelola semua pesanan dari pelanggan Anda dengan mudah.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <Button
              onClick={handleTemplateManager}
              variant="outline"
              className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow-md hover:bg-blue-50 transition-all duration-200 hover:shadow-lg border-blue-300"
            >
              <MessageSquare className="h-5 w-5" />
              Kelola Template
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

        {/* Bulk Actions Toolbar */}
        {(isSelectionMode || selectedOrderIds.length > 0) && (
          <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-700">Mode Pilih Multiple</span>
                  </div>
                  {selectedOrderIds.length > 0 && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1 font-semibold">
                      {selectedOrderIds.length} item dipilih
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setSelectedOrderIds([]); setIsSelectionMode(false); }}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Batalkan
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allIds = filteredOrders.map(o => o.id);
                      setSelectedOrderIds(prev => prev.length === allIds.length ? [] : allIds);
                    }}
                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    Pilih Semua ({filteredOrders.length})
                  </Button>
                  {selectedOrderIds.length > 0 && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBulkEditDialog(true)}
                        className="border-green-300 text-green-600 hover:bg-green-50"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Status {selectedOrderIds.length} Item
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowBulkDeleteDialog(true)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hapus {selectedOrderIds.length} Item
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 🔧 FIXED: Better Filters Layout */}
        <Card className="mb-6 shadow-lg border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-800">Filter & Pencarian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari nomor pesanan atau nama pelanggan..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 h-11 border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 transition-colors"
                />
              </div>

              {/* 🔧 FIXED: Enhanced Date Range Picker */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-11 px-4 border-gray-300 rounded-lg shadow-sm",
                      !dateRange && "text-muted-foreground",
                      "hover:bg-gray-50 focus:border-orange-500 focus:ring-orange-500 transition-colors"
                    )}
                  >
                    <CalendarIcon className="mr-3 h-4 w-4 text-gray-500" />
                    <span className="flex-1 truncate">
                      {formatDateRange()}
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-4xl p-0 bg-white rounded-xl shadow-xl">
                  <DialogHeader className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <DialogTitle className="text-lg font-semibold text-gray-800">
                        Pilih Rentang Tanggal
                      </DialogTitle>
                      <DialogClose asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
                          <X className="h-4 w-4" />
                        </Button>
                      </DialogClose>
                    </div>
                  </DialogHeader>
                  
                  <div className="flex flex-col md:flex-row">
                    {/* Date Presets */}
                    <div className="md:w-64 flex-shrink-0">
                      <DatePresets 
                        setDateRange={setDateRange} 
                        onClose={() => {
                          // Don't auto-close on mobile
                          if (!isMobile) {
                            document.querySelector('[data-state="open"] button')?.click();
                          }
                        }}
                      />
                    </div>
                    
                    {/* Calendar */}
                    <div className="flex-1 p-6">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from || new Date()}
                        selected={dateRange}
                        onSelect={(newRange) => {
                          try {
                            setDateRange(newRange);
                            setCurrentPage(1);
                          } catch (error) {
                            console.error('Error updating date range:', error);
                          }
                        }}
                        numberOfMonths={isMobile ? 1 : 2}
                        locale={id}
                        className="w-full"
                        classNames={{
                          months: "flex flex-col sm:flex-row gap-4 justify-center",
                          month: "space-y-4",
                          caption: "flex justify-center pt-1 relative items-center text-sm font-medium",
                          caption_label: "text-sm font-medium",
                          nav: "space-x-1 flex items-center",
                          nav_button: "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 w-7",
                          nav_button_previous: "absolute left-1",
                          nav_button_next: "absolute right-1",
                          table: "w-full border-collapse space-y-1",
                          head_row: "flex",
                          head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
                          row: "flex w-full mt-2",
                          cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                          day: cn(
                            "inline-flex items-center justify-center rounded-md text-sm font-normal ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-selected:opacity-100 h-8 w-8 hover:bg-accent hover:text-accent-foreground"
                          ),
                          day_selected: "bg-orange-500 text-primary-foreground hover:bg-orange-600 hover:text-primary-foreground focus:bg-orange-500 focus:text-primary-foreground",
                          day_today: "bg-accent text-accent-foreground font-semibold",
                          day_outside: "text-muted-foreground opacity-50",
                          day_disabled: "text-muted-foreground opacity-50",
                          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                          day_hidden: "invisible",
                        }}
                        disabled={(date) => date > new Date() || date < new Date('2020-01-01')}
                      />
                      
                      {/* Quick Action Buttons */}
                      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-200">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDateRange(undefined)}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          Reset
                        </Button>
                        <DialogClose asChild>
                          <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                            Terapkan
                          </Button>
                        </DialogClose>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-11 border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 transition-colors">
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
            
            {/* Filter Summary */}
            {(searchTerm || statusFilter !== 'all' || dateRange) && (
              <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium text-orange-800">Filter aktif:</span>
                  {searchTerm && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      Pencarian: "{searchTerm}"
                    </Badge>
                  )}
                  {statusFilter !== 'all' && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      Status: {orderStatusList.find(s => s.key === statusFilter)?.label}
                    </Badge>
                  )}
                  {dateRange && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      Tanggal: {formatDateRange()}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setDateRange(undefined);
                      setCurrentPage(1);
                    }}
                    className="h-6 px-2 text-orange-700 hover:text-orange-900 hover:bg-orange-100"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Table Card */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-200/80 overflow-hidden">
          {/* Table Controls */}
          <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50/50">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Label htmlFor="show-entries" className="whitespace-nowrap font-medium">Show</Label>
                  <Select value={String(itemsPerPage)} onValueChange={(value) => { setItemsPerPage(Number(value)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-20 border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="font-medium">entries</span>
                </div>
                <Button
                  variant={isSelectionMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsSelectionMode(!isSelectionMode)}
                  className={isSelectionMode ? "bg-blue-600 hover:bg-blue-700" : "border-blue-300 text-blue-600 hover:bg-blue-50"}
                >
                  {isSelectionMode ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Keluar Mode Pilih
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Mode Pilih
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <Table className="min-w-full text-sm text-left text-gray-700">
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-200">
                  <TableHead className="w-12 p-4">
                    {isSelectionMode && (
                      <Checkbox
                        checked={allCurrentSelected}
                        ref={(el) => { if (el) el.indeterminate = someCurrentSelected; }}
                        onCheckedChange={toggleSelectAllCurrent}
                        className="border-gray-400"
                      />
                    )}
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">Nomor Pesanan</TableHead>
                  <TableHead className="font-semibold text-gray-700">Pelanggan</TableHead>
                  <TableHead className="font-semibold text-gray-700">Tanggal</TableHead>
                  <TableHead className="font-semibold text-gray-700 w-[180px]">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700">Total</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700 w-20">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                        <span className="text-gray-500 font-medium">Memuat data pesanan...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : currentItems.length > 0 ? (
                  currentItems.map((order, index) => (
                    <TableRow
                      key={order.id}
                      className={cn(
                        "hover:bg-orange-50/50 transition-colors border-b border-gray-100",
                        selectedOrderIds.includes(order.id) && "bg-blue-50 border-l-4 border-l-blue-500",
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                      )}
                    >
                      <TableCell className="p-4">
                        {isSelectionMode && (
                          <Checkbox
                            checked={selectedOrderIds.includes(order.id)}
                            onCheckedChange={(checked) => {
                              setSelectedOrderIds(prev =>
                                checked ? [...prev, order.id] : prev.filter(id => id !== order.id)
                              );
                            }}
                            className="border-gray-400"
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900 p-4">
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 font-medium">
                          {order.nomorPesanan || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-4">
                        <div className="font-medium">{order.namaPelanggan || '-'}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.teleponPelanggan || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="p-4">
                        {order.tanggal ? formatDateForDisplay(order.tanggal) : '-'}
                      </TableCell>
                      <TableCell className="p-4">
                        <StatusCell
                          order={order}
                          onStatusChange={handleStatusChange}
                          onTemplateManagerOpen={handleFollowUpClick}
                        />
                      </TableCell>
                      <TableCell className="text-right p-4">
                        <span className="font-semibold text-green-600 text-base">
                          Rp {order.totalPesanan?.toLocaleString('id-ID') || '0'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center p-4">
                        {!isSelectionMode && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleOpenEditOrderForm(order)} className="cursor-pointer">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleFollowUpClick(order)} className="cursor-pointer">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Follow Up WhatsApp
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleTemplateManager()} className="cursor-pointer">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Kelola Template
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer">
                                <Eye className="h-4 w-4 mr-2" />
                                Lihat Detail
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteOrder(order.id)}
                                className="cursor-pointer text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <Package className="h-16 w-16 text-gray-300" />
                        <div className="text-center">
                          <p className="text-lg font-medium text-gray-600 mb-2">
                            {searchTerm || statusFilter !== 'all' || dateRange
                              ? 'Tidak ada pesanan yang cocok dengan filter'
                              : 'Belum ada pesanan'}
                          </p>
                          <p className="text-gray-500 text-sm mb-4">
                            {searchTerm || statusFilter !== 'all' || dateRange
                              ? 'Coba ubah filter pencarian Anda'
                              : 'Mulai dengan menambahkan pesanan pertama'}
                          </p>
                        </div>
                        {!searchTerm && statusFilter === 'all' && !dateRange && (
                          <Button
                            onClick={handleNewOrder}
                            className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow-md transition-all duration-200"
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

          {/* Pagination Footer */}
          {filteredOrders.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:px-6 border-t border-gray-200 bg-gray-50/50">
              <div className="text-sm text-gray-600 mb-4 sm:mb-0">
                Showing <span className="font-semibold">{Math.min(filteredOrders.length, indexOfFirstItem + 1)}</span> to{' '}
                <span className="font-semibold">{Math.min(filteredOrders.length, indexOfLastItem)}</span> of{' '}
                <span className="font-semibold">{filteredOrders.length}</span> entries
                {selectedOrderIds.length > 0 && (
                  <span className="ml-2 text-blue-600 font-medium">
                    ({selectedOrderIds.length} selected)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-gray-100"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "h-9 w-9",
                      currentPage === page
                        ? "bg-orange-500 text-white shadow-md hover:bg-orange-600"
                        : "hover:bg-gray-100"
                    )}
                    variant={currentPage === page ? "default" : "ghost"}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-gray-100"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Delete Confirmation Dialog */}
        <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Konfirmasi Hapus Multiple Item
              </AlertDialogTitle>
              <AlertDialogDescription>
                Anda akan menghapus <strong>{selectedOrderIds.length} item</strong> pesanan:
                <div className="mt-3 p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                  <ul className="space-y-1">
                    {currentItems.filter(o => selectedOrderIds.includes(o.id)).slice(0, 5).map(o => (
                      <li key={o.id} className="flex items-center gap-2 text-sm">
                        <Trash2 className="h-3 w-3 text-red-500 flex-shrink-0" />
                        <span className="font-medium">#{o.nomorPesanan}</span>
                        <span className="text-gray-500">({o.namaPelanggan || 'N/A'})</span>
                      </li>
                    ))}
                    {selectedOrderIds.length > 5 && (
                      <li className="text-sm text-gray-500 italic">
                        ... dan {selectedOrderIds.length - 5} item lainnya
                      </li>
                    )}
                  </ul>
                </div>
                <p className="mt-3 text-red-600 font-medium text-sm">
                  ⚠️ Tindakan ini tidak dapat dibatalkan!
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus {selectedOrderIds.length} Item
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Edit Status Dialog */}
        <Dialog open={showBulkEditDialog} onOpenChange={setShowBulkEditDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-green-500" />
                Edit Status Multiple Item
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Anda akan mengubah status <strong>{selectedOrderIds.length} item</strong> pesanan:
                </p>
                <div className="p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                  <ul className="space-y-1">
                    {currentItems.filter(o => selectedOrderIds.includes(o.id)).slice(0, 5).map(o => (
                      <li key={o.id} className="flex items-center gap-2 text-sm">
                        <Edit className="h-3 w-3 text-green-500 flex-shrink-0" />
                        <span className="font-medium">#{o.nomorPesanan}</span>
                        <span className="text-gray-500">({o.namaPelanggan || 'N/A'})</span>
                      </li>
                    ))}
                    {selectedOrderIds.length > 5 && (
                      <li className="text-sm text-gray-500 italic">
                        ... dan {selectedOrderIds.length - 5} item lainnya
                      </li>
                    )}
                  </ul>
                </div>
              </div>
              <div>
                <Label htmlFor="bulk-status" className="font-medium">Status Baru *</Label>
                <Select value={bulkEditStatus} onValueChange={setBulkEditStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pilih status baru" />
                  </SelectTrigger>
                  <SelectContent>
                    {orderStatusList.map((statusOption) => (
                      <SelectItem key={statusOption.key} value={statusOption.key}>
                        {statusOption.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowBulkEditDialog(false)}>
                Batal
              </Button>
              <Button
                onClick={handleBulkEdit}
                disabled={!bulkEditStatus}
                className="bg-green-600 hover:bg-green-700"
              >
                <Edit className="mr-2 h-4 w-4" />
                Update {selectedOrderIds.length} Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Template Manager */}
        <FollowUpTemplateManager
          isOpen={showTemplateManager}
          onClose={() => setShowTemplateManager(false)}
          order={selectedOrderForTemplate}
          onSendWhatsApp={handleSendWhatsApp}
        />

        {/* Modals */}
        <OrderForm
          open={showOrderForm}
          onOpenChange={setShowOrderForm}
          onSubmit={handleSubmit}
          initialData={editingOrder}
        />
      </div>
    </ErrorBoundary>
  );
};

export default OrdersPage;