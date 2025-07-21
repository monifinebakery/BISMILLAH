import React, { useState, useMemo } from 'react';
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Link } from 'react-router-dom';
import { Calendar as CalendarIcon, Plus, Search, Edit, Package, MessageSquare, FileText, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
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
  const isMobile = useIsMobile(); // ✅ PERBAIKAN 1: Hook dipanggil di sini

  // --- State Hooks ---
  const [searchTerm, setSearchTerm] = useState('');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: subDays(new Date(), 30), to: new Date() });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [selectedOrderForWhatsapp, setSelectedOrderForWhatsapp] = useState<Order | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const { orders, loading, addOrder, updateOrder, deleteOrder } = useOrder();

  // --- Handlers ---
  const handleFollowUpClick = (order: Order) => {
    setSelectedOrderForWhatsapp(order);
    setIsWhatsappModalOpen(true);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const success = await updateOrder(orderId, { status: newStatus as Order['status'] });
    if (success) {
      const order = orders.find(o => o.id === orderId);
      toast.success(`Status pesanan #${order?.nomorPesanan} diubah menjadi "${getStatusText(newStatus)}".`);
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
    const success = await deleteOrder(orderId);
    if (success) toast.success('Pesanan berhasil dihapus');
  };

  const handleSubmit = async (data: Partial<Order> | Partial<NewOrder>) => {
    const isEditingMode = !!editingOrder;
    let success = false;

    if (isEditingMode) {
      success = await updateOrder(editingOrder!.id, data);
    } else {
      // ✅ PERBAIKAN 2: Logika pembuatan nomor pesanan dihapus
      success = await addOrder(data as NewOrder);
    }

    if (success) {
      toast.success(isEditingMode ? 'Pesanan berhasil diperbarui.' : 'Pesanan baru berhasil ditambahkan.');
      setShowOrderForm(false);
      setEditingOrder(null);
    }
  };

  // --- Memoized Filtering and Pagination ---
  const filteredOrders = useMemo(() => {
    const rangeFrom = dateRange?.from ? startOfDay(dateRange.from) : null;
    const rangeTo = dateRange?.to ? endOfDay(dateRange.to) : null;

    return orders.filter(order => {
      const matchesSearch = order.nomorPesanan?.toLowerCase().includes(searchTerm.toLowerCase()) || order.namaPelanggan?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const orderDate = order.tanggal ? new Date(order.tanggal) : null;
      const matchesDate = !rangeFrom || !rangeTo || !orderDate ? true : (orderDate >= rangeFrom && orderDate <= rangeTo);
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, searchTerm, statusFilter, dateRange]);

  const currentItems = useMemo(() => {
    const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(indexOfFirstItem, indexOfFirstItem + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);
  
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // --- Render Functions ---
  if (loading) {
    return <div className="p-6 text-center text-muted-foreground">Memuat data pesanan...</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Manajemen Pesanan</h1>
          <p className="text-muted-foreground">Kelola semua pesanan dari pelanggan Anda.</p>
        </div>
        <Button className="flex items-center gap-2" onClick={handleNewOrder}><Plus className="h-5 w-5" /> Pesanan Baru</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Filter Pesanan</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative sm:col-span-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Cari No. Pesanan / Nama..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button id="date" variant="outline" className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "d LLL y")} - ${format(dateRange.to, "d LLL y")}` : format(dateRange.from, "d LLL y")) : (<span>Pilih tanggal</span>)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={isMobile ? 1 : 2} />
              </PopoverContent>
            </Popover>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Filter Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {orderStatusList.map((statusOption) => (<SelectItem key={statusOption.key} value={statusOption.key}>{statusOption.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daftar Pesanan</CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
                <Label htmlFor="itemsPerPage">Baris per halaman:</Label>
                <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="5">5</SelectItem><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem></SelectContent>
                </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor Pesanan</TableHead><TableHead>Pelanggan</TableHead><TableHead>Tanggal</TableHead>
                  <TableHead className="w-[180px]">Status</TableHead><TableHead>Total</TableHead><TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length > 0 ? currentItems.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.nomorPesanan}</TableCell>
                    <TableCell><div>{order.namaPelanggan}</div><div className="text-xs text-muted-foreground">{order.teleponPelanggan}</div></TableCell>
                    <TableCell>{formatDateForDisplay(order.tanggal)}</TableCell>
                    <TableCell>
                      <Select value={order.status} onValueChange={(newStatus) => handleStatusChange(order.id, newStatus)}>
                        <SelectTrigger className={cn(getStatusColor(order.status), "h-8 border-none text-xs")}><SelectValue /></SelectTrigger>
                        <SelectContent>{orderStatusList.map(s => (<SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>))}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="font-semibold">Rp {order.totalPesanan?.toLocaleString('id-ID') || '0'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEditOrderForm(order)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleFollowUpClick(order)}><MessageSquare className="h-4 w-4" /></Button>
                        <Button asChild variant="ghost" size="icon"><Link to={`/pesanan/invoice/${order.id}`}><FileText className="h-4 w-4" /></Link></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Anda Yakin?</AlertDialogTitle><AlertDialogDescription>Tindakan ini tidak dapat dibatalkan. Pesanan akan dihapus secara permanen.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteOrder(order.id)} className="bg-red-600 hover:bg-red-700">Ya, Hapus</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (<TableRow><TableCell colSpan={6} className="text-center h-24">Tidak ada pesanan ditemukan.</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between p-4">
          <div className="text-sm text-muted-foreground">Menampilkan {Math.min(filteredOrders.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredOrders.length, currentPage * itemsPerPage)} dari {filteredOrders.length} pesanan</div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="px-4 text-sm">Hal {currentPage} / {totalPages || 1}</span>
            <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages || totalPages === 0}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </CardFooter>
      </Card>
      
      <OrderForm open={showOrderForm} onOpenChange={setShowOrderForm} onSubmit={handleSubmit} initialData={editingOrder} />
      <WhatsappFollowUpModal isOpen={isWhatsappModalOpen} onClose={() => setIsWhatsappModalOpen(false)} order={selectedOrderForWhatsapp} />
    </div>
  );
};

export default OrdersPage;