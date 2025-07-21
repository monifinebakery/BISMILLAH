import React, { useState, useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile'; 
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Link } from 'react-router-dom';
import { Calendar as CalendarIcon, Plus, Search, Edit, Package, Check, X, Truck, Cog, MessageSquare, FileText, ChevronLeft, ChevronRight, FileText } from 'lucide-react'; 
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useOrder } from '@/contexts/OrderContext';
import OrderForm from '@/components/OrderForm'; 
import { toast } from 'sonner';
import type { Order, NewOrder } from '@/types/order';
import WhatsappFollowUpModal from '@/components/WhatsappFollowUpModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge'; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from "@/components/ui/label";

import { formatDateForDisplay } from '@/utils/dateUtils';
import { safeParseDate } from '@/utils/dateUtils'; 

const OrdersPage = () => {
  const isMobile = useIsMobile(); 

  const [searchTerm, setSearchTerm] = useState('');
  const [showOrderForm, setShowOrderForm] = useState(false); 
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null); 
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [selectedOrderForWhatsapp, setSelectedOrderForWhatsapp] = useState<Order | null>(null);

  // Pagination state
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const { orders, loading, addOrder, updateOrder, deleteOrder } = useOrder();

  const handleFollowUpClick = (order: Order) => {
    setSelectedOrderForWhatsapp(order);
    setIsWhatsappModalOpen(true);
  };

  const orderStatuses = [
    { key: 'pending', label: 'Menunggu' },
    { key: 'confirmed', label: 'Dikonfirmasi' },
    { key: 'processing', label: 'Diproses' },
    { key: 'shipping', label: 'Sedang Dikirim' },
    { key: 'delivered', label: 'Selesai' },
    { key: 'cancelled', label: 'Dibatalkan' },
  ];

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const orderToUpdate = orders.find(o => o.id === orderId);
    if (orderToUpdate) {
      const success = await updateOrder(orderId, { ...orderToUpdate, status: newStatus as Order['status'] });
      if (success) {
        toast.success(`Status pesanan #${orderToUpdate.nomorPesanan} berhasil diubah menjadi "${getStatusText(newStatus)}".`);
      } else {
        toast.error(`Gagal mengubah status pesanan #${orderToUpdate.nomorPesanan}.`);
      }
    }
  };

  const getWhatsappTemplateByStatus = (status: string, orderData: Order): string => {
    const formattedDate = formatDateForDisplay(orderData.tanggal);
    const items = orderData.items?.map((item: any) => `${item.nama} (${item.quantity}x)`).join(', ') || '';
    const total = orderData.totalPesanan?.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0';

    switch (status) {
        case 'pending': return `Halo kak ${orderData.namaPelanggan},\n\nTerima kasih telah melakukan pemesanan di toko kami dengan nomor pesanan ${orderData.nomorPesanan} pada tanggal ${formattedDate}.\n\nPesanan Anda sedang kami proses. Berikut detail pesanan Anda:\n- Item: ${items}\n- Total: Rp ${total}\n\nSilakan konfirmasi jika informasi ini sudah benar. Terima kasih!`;
        case 'confirmed': return `Halo kak ${orderData.namaPelanggan},\n\nPesanan Anda dengan nomor ${orderData.nomorPesanan} telah kami konfirmasi dan sedang diproses.\n\nDetail pesanan:\n- Item: ${items}\n- Total: Rp ${total}\n\nKami akan segera memproses pesanan Anda. Terima kasih atas kesabaran Anda!`;
        case 'processing': return `Halo kak ${orderData.namaPelanggan},\n\nPesanan Anda dengan nomor ${orderData.nomorPesanan} sedang dalam proses pengerjaan.\n\nDetail pesanan:\n- Item: ${items}\n- Total: Rp ${total}\n\nKami akan memberi tahu Anda ketika pesanan sudah selesai dibuat. Terima kasih atas kesabaran Anda!`;
        case 'shipping': return `Halo kak ${orderData.namaPelanggan},\n\nPesanan Anda dengan nomor ${orderData.nomorPesanan} sedang dikirim!\n\nDetail pesanan:\n- Item: ${items}\n- Total: Rp ${total}\n\nSilakan konfirmasi ketika pesanan sudah diterima. Terima kasih telah berbelanja di toko kami!`;
        case 'delivered': return `Halo kak ${orderData.namaPelanggan},\n\nTerima kasih telah berbelanja di toko kami! Pesanan Anda dengan nomor ${orderData.nomorPesanan} telah selesai.\n\nKami harap Anda puas dengan produk kami. Jika ada pertanyaan atau masukan, jangan ragu untuk menghubungi kami.\n\nSampai jumpa di pesanan berikutnya!`;
        case 'cancelled': return `Halo kak ${orderData.namaPelanggan},\n\nPesanan Anda dengan nomor ${orderData.nomorPesanan} telah dibatalkan sesuai permintaan.\n\nJika Anda memiliki pertanyaan atau ingin melakukan pemesanan ulang, silakan hubungi kami kembali.\n\nTerima kasih.`;
        default: return `Halo kak ${orderData.namaPelanggan},\n\nTerima kasih telah melakukan pemesanan di toko kami dengan nomor pesanan ${orderData.nomorPesanan}.\n\nJika ada pertanyaan, silakan hubungi kami kembali.`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipping': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'confirmed': return 'Dikonfirmasi';
      case 'processing': return 'Diproses';
      case 'shipping': return 'Sedang Dikirim';
      case 'delivered': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
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
    if (confirm('Apakah Anda yakin ingin menghapus pesanan ini?')) {
      const success = await deleteOrder(orderId);
      if (success) toast.success('Pesanan berhasil dihapus');
    }
  };

  const handleSubmit = async (data: Order | NewOrder) => {
    const isEditingMode = !!editingOrder; 
    let success = false;

    if (isEditingMode) {
      const { id, ...updateData } = data as Order; 
      success = await updateOrder(editingOrder!.id, updateData); 
    } else {
      const nextId = Math.max(0, ...orders.map(o => parseInt(o.nomorPesanan.replace('ORD-', ''))) || [0]) + 1;
      const newOrderData = {
        ...data,
        nomorPesanan: `ORD-${String(nextId).padStart(3, '0')}`,
      };
      success = await addOrder(newOrderData as NewOrder);
    }

    if (success) {
      toast.success(isEditingMode ? 'Pesanan berhasil diperbarui.' : 'Pesanan baru berhasil ditambahkan.');
      setShowOrderForm(false);
      setEditingOrder(null);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = order.nomorPesanan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            order.namaPelanggan?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      const orderDate = order.tanggal instanceof Date && !isNaN(order.tanggal.getTime())
                              ? order.tanggal
                              : null;
      
      const matchesDate = dateRange?.from && dateRange?.to && orderDate
        ? orderDate >= dateRange.from && orderDate <= dateRange.to
        : true;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, searchTerm, statusFilter, dateRange]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Memuat data pesanan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <NotepadText className="h-8 w-8 text-white" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            Manajemen Pesanan
          </h1>
          <p className="text-muted-foreground">Kelola semua pesanan pelanggan</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white" 
            onClick={handleNewOrder}
          >
            <Plus className="h-4 w-4" />
            Pesanan Baru
          </Button>
        </div>
      </div>

      {/* Filter Card */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Filter Pesanan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari berdasarkan nomor pesanan atau nama pelanggan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-[260px] justify-start text-left font-normal",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pilih tanggal</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="flex flex-col p-2 space-y-1 border-b">
                  <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: startOfDay(new Date()), to: endOfDay(new Date()) })}>Hari ini</Button>
                  <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: startOfDay(subDays(new Date(), 1)), to: endOfDay(subDays(new Date(), 1)) })}>Kemarin</Button>
                  <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: subDays(new Date(), 29), to: new Date() })}>30 Hari Terakhir</Button>
                  <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })}>Bulan ini</Button>
                  <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) })}>Bulan Kemarin</Button>
                </div>
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {orderStatuses.map((statusOption) => (
                  <SelectItem key={statusOption.key} value={statusOption.key}>
                    {statusOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table Controls */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200/80 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200/80">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Label htmlFor="show-entries" className="whitespace-nowrap">Show</Label>
              <Select value={String(itemsPerPage)} onValueChange={(value) => { 
                setItemsPerPage(Number(value)); 
                setCurrentPage(1); 
              }}>
                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
              <span>entries</span>
            </div>
          </div>
        </div>

        {/* Main Table */}
        <div className="overflow-x-auto">
          <Table className="min-w-full text-sm text-left text-gray-700">
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  Nomor Pesanan
                </TableHead>
                <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  Pelanggan
                </TableHead>
                <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  Tanggal
                </TableHead>
                <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  Status
                </TableHead>
                <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  Total
                </TableHead>
                <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  No Whatsapp
                </TableHead>
                <TableHead className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-200">
              {currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="mb-4">
                      {searchTerm ? 'Tidak ada pesanan yang sesuai dengan pencarian' : 'Belum ada pesanan'}
                    </p>
                    {!searchTerm && (
                      <Button
                        onClick={handleNewOrder}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Pesanan Pertama
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((order) => (
                  <TableRow key={order.id} className="hover:bg-orange-50/50">
                    <TableCell className="py-4 px-4 border-b border-gray-200">
                      <div className="font-medium text-gray-900">{order.nomorPesanan}</div>
                    </TableCell>
                    <TableCell className="py-4 px-4 border-b border-gray-200">
                      <div className="font-medium">{order.namaPelanggan}</div>
                    </TableCell>
                    <TableCell className="py-4 px-4 border-b border-gray-200">
                      <div className="text-gray-700">{formatDateForDisplay(order.tanggal)}</div>
                    </TableCell>
                    <TableCell className="py-4 px-4 border-b border-gray-200">
                      <Badge className={cn(getStatusColor(order.status), "text-xs")}>
                        {getStatusText(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 px-4 border-b border-gray-200">
                      <div className="font-semibold text-orange-600">Rp {order.totalPesanan?.toLocaleString('id-ID') || '0'}</div>
                    </TableCell>
                    <TableCell className="py-4 px-4 border-b border-gray-200">
                      <div className="text-gray-700">{order.teleponPelanggan || 'N/A'}</div>
                    </TableCell>
                    <TableCell className="py-4 px-4 border-b border-gray-200 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditOrderForm(order)}
                          className="h-8 w-8 p-0 hover:bg-orange-100 hover:text-orange-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleFollowUpClick(order)}
                          className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button 
                          asChild
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                        >
                          <Link to={`/pesanan/invoice/${order.id}`} title="Lihat Invoice">
                            <FileText className="h-4 w-4" />
                          </Link>
                        </Button>
                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteOrder(order.id)}
                            className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between p-4 sm:px-6 border-t border-gray-200/80">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{indexOfFirstItem + 1}</span> to <span className="font-semibold">{Math.min(indexOfLastItem, filteredOrders.length)}</span> of <span className="font-semibold">{filteredOrders.length}</span> entries
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 hover:bg-gray-100"
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button 
                key={page} 
                onClick={() => paginate(page)} 
                className={cn("h-9 w-9", {
                  "bg-orange-500 text-white shadow-sm hover:bg-orange-600": currentPage === page, 
                  "hover:bg-gray-100": currentPage !== page
                })}
                variant={currentPage === page ? "default" : "ghost"}
              >
                {page}
              </Button>
            ))}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 hover:bg-gray-100"
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <OrderForm
        open={showOrderForm}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setEditingOrder(null);
          }
          setShowOrderForm(isOpen);
        }}
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