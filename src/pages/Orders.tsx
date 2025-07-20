import React, { useState, useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile'; 
// PERBAIKAN: Mengganti 'date-ns' menjadi 'date-fns'
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Link } from 'react-router-dom';
import { Calendar as CalendarIcon, Plus, Search, Edit, Package, Check, X, Truck, Cog, MessageSquare, FileText } from 'lucide-react'; 
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useOrders } from '@/contexts/OrderContext';
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

  const { orders, loading, addOrder, updateOrder, deleteOrder } = useOrders();

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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Memuat data pesanan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Pesanan</h1>
          <p className="text-muted-foreground">Kelola semua pesanan pelanggan</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button className="flex items-center gap-2" onClick={handleNewOrder}>
            <Plus className="h-4 w-4" />
            Pesanan Baru
          </Button>
        </div>
      </div>

      <Card>
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

      <div className="grid gap-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">{order.nomorPesanan}</CardTitle>
                  <CardDescription>
                    {order.namaPelanggan} • {formatDateForDisplay(order.tanggal)}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    onValueChange={(newStatus) => handleStatusChange(order.id, newStatus)}
                    value={order.status}
                  >
                    <SelectTrigger className={`w-[140px] h-9 ${getStatusColor(order.status)}`}>
                      <SelectValue placeholder="Pilih Status">
                        {getStatusText(order.status)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {orderStatuses.map((statusOption) => (
                        <SelectItem key={statusOption.key} value={statusOption.key}>
                          {statusOption.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isMobile ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Pelanggan:</span>
                    <span className="font-semibold">{order.namaPelanggan}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">No Whatsapp:</span>
                    <span className="font-semibold">{order.teleponPelanggan || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className={getStatusColor(order.status)}>{getStatusText(order.status)}</Badge>
                  </div>
                  <div className="flex justify-end mt-4 gap-2"> 
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() => handleOpenEditOrderForm(order)}
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFollowUpClick(order)} 
                      className="flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Follow-up
                    </Button>
                    <Button asChild variant="outline" size="sm" className="flex items-center gap-2">
                      <Link to={`/pesanan/invoice/${order.id}`}>
                        <FileText className="h-4 w-4" />
                        Invoice
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div><p className="text-sm text-muted-foreground">Total Pesanan</p><p className="font-semibold">Rp {order.totalPesanan?.toLocaleString('id-ID') || '0'}</p></div>
                    <div><p className="text-sm text-muted-foreground">Jumlah Item</p><p className="font-semibold">{order.items?.length || 0} item</p></div>
                    <div><p className="text-sm text-muted-foreground">No Whatsapp</p><p className="font-semibold">{order.teleponPelanggan || 'Tidak tersedia'}</p></div>
                    <div><p className="text-sm text-muted-foreground">Email</p><p className="font-semibold text-sm">{order.emailPelanggan || 'Tidak tersedia'}</p></div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2 flex items-center gap-2"><Package className="h-4 w-4" />Detail Pesanan</h4>
                    <div className="space-y-2">
                      {order.items?.map((item, index) => (
                        <div key={item.id || index} className="flex justify-between items-center text-sm">
                          <span>{item.nama} x {item.quantity}</span>
                          <span className="font-medium">Rp {item.totalHarga?.toLocaleString('id-ID') || '0'}</span>
                        </div>
                      )) || <p className="text-sm text-muted-foreground">Tidak ada item</p>}
                    </div>
                    <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
                      <span>Total</span>
                      <span>Rp {order.totalPesanan?.toLocaleString('id-ID') || '0'}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => handleOpenEditOrderForm(order)}>
                      <Edit className="h-4 w-4" />
                      Edit Detail
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFollowUpClick(order)}
                      className="flex items-center gap-2 border-green-200 text-green-700 hover:bg-green-50"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Follow-up
                    </Button>
                    {order.status !== 'cancelled' && order.status !== 'delivered' && (
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteOrder(order.id)} className="flex items-center gap-2">
                        <X className="h-4 w-4" />
                        Hapus
                      </Button>
                    )}
                    <div className="sm:ml-auto flex gap-2">
                      <Button asChild variant="ghost" size="icon">
                        <Link to={`/pesanan/invoice/${order.id}`} title="Lihat Invoice">
                          <FileText className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'Tidak ada pesanan yang sesuai dengan pencarian' : 'Belum ada pesanan'}
            </p>
          </CardContent>
        </Card>
      )}

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