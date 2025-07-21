import React, { useState, useMemo } from 'react';
// import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { Link } from 'react-router-dom';
// MENGUBAH IMPOR ICON LUCIDE-REACT DARI NAMED MENJADI NAMESPACE UNTUK DIAGNOSTIK
import * as Lucide from 'lucide-react'; // <-- PERUBAHAN PENTING DI SINI
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { formatDateForDisplay } from '@/utils/dateUtils';
import { orderStatusList, getStatusText, getStatusColor } from '@/constants/orderConstants';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';

const OrdersPage = () => {
  const isMobile = useIsMobile();

  // --- State Hooks ---
  const [searchTerm, setSearchTerm] = useState('');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: subDays(new Date(), 30), to: new Date() });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [minTotal, setMinTotal] = useState<number | undefined>(undefined);
  const [maxTotal, setMaxTotal] = useState<number | undefined>(undefined);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isWhatsappModalOpen, setIsWhatsappModalOpen] = useState(false);
  const [selectedOrderForWhatsapp, setSelectedOrderForWhatsapp] = useState<Order | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const { orders, loading, addOrder, updateOrder, deleteOrder } = useOrder();

  // --- Handlers ---
  const handleFollowUpClick = (order: Order) => {
    setSelectedOrderForWhatsapp(order);
    setIsWhatsappModalOpen(true);
  };

  const getWhatsappTemplateByStatus = (status: string, orderData: Order): string => {
    const itemsText = (orderData.items || []).map(item => `- ${item.namaBarang} (${item.quantity}x)`).join('\n');
    const totalText = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(orderData.totalPesanan);

    switch (status) {
      case 'confirmed':
        return `Halo kak ${orderData.namaPelanggan},\n\nPesanan Anda #${orderData.nomorPesanan} telah kami KONFIRMASI dan sedang kami siapkan.\n\nTerima kasih!`;
      case 'shipping':
        return `Halo kak ${orderData.namaPelanggan},\n\nKabar baik! Pesanan Anda #${orderData.nomorPesanan} sudah dalam proses PENGIRIMAN.\n\nMohon ditunggu kedatangannya ya. Terima kasih!`;
      case 'delivered':
        return `Halo kak ${orderData.namaPelanggan},\n\nPesanan Anda #${orderData.nomorPesanan} telah TIBA.\n\nTerima kasih telah berbelanja! Ditunggu pesanan selanjutnya 😊`;
      default:
        return `Halo kak ${orderData.namaPelanggan},\n\nTerima kasih telah memesan. Ini detail pesanan Anda:\nNomor Pesanan: ${orderData.nomorPesanan}\n\nItem:\n${itemsText}\n\nTotal: ${totalText}\n\nMohon konfirmasinya. Terima kasih.`;
    }
  };
  
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const success = await updateOrder(orderId, { status: newStatus as Order['status'] });
    if (success) {
      const order = orders.find(o => o.id === orderId);
      toast.success(`Status pesanan #${order?.nomorPesanan} diubah menjadi "${getStatusText(newStatus)}".`);
      setSelectedOrderIds(prev => prev.filter(id => id !== orderId));
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
    setSelectedOrderIds(prev => prev.filter(id => id !== orderId));
    const success = await deleteOrder(orderId);
    if (success) toast.success('Pesanan berhasil dihapus');
  };

  const handleBulkDelete = async () => {
    if (selectedOrderIds.length === 0) {
      toast.warning('Pilih item yang ingin dihapus terlebih dahulu');
      return;
    }
    setSelectedOrderIds([]);
    const success = await Promise.all(selectedOrderIds.map(id => deleteOrder(id)));
    if (success.every(s => s)) {
      setShowBulkDeleteDialog(false);
      setIsSelectionMode(false);
      toast.success('Pesanan berhasil dihapus!');
    }
  };

  const toggleSelectAllCurrent = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrderIds(prev => [...new Set([...prev, ...currentItems.map(o => o.id)])]);
    } else {
      setSelectedOrderIds(prev => prev.filter(id => !currentItems.some(o => o.id === id)));
    }
  };

  const handleSubmit = async (data: Partial<Order> | Partial<NewOrder>) => {
    const isEditingMode = !!editingOrder;
    let success = false;

    if (isEditingMode) {
      success = await updateOrder(editingOrder!.id, data);
    } else {
      success = await addOrder(data as NewOrder);
    }

    if (success) {
      toast.success(isEditingMode ? 'Pesanan berhasil diperbarui.' : 'Pesanan baru berhasil ditambahkan.');
      setShowOrderForm(false);
      setEditingOrder(null);
      setSelectedOrderIds(prev => prev.filter(id => id !== (editingOrder?.id || '')));
    }
  };

  // --- Sorting Logic ---
  const sortOrders = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedOrders = useMemo(() => {
    if (!sortConfig) return filteredOrders;
    return [...filteredOrders].sort((a, b) => {
      if (sortConfig.key === 'nomorPesanan') {
        return sortConfig.direction === 'asc'
          ? a.nomorPesanan.localeCompare(b.nomorPesanan)
          : b.nomorPesanan.localeCompare(a.nomorPesanan);
      }
      if (sortConfig.key === 'tanggal') {
        return sortConfig.direction === 'asc'
          ? new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
          : new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
      }
      if (sortConfig.key === 'totalPesanan') {
        return sortConfig.direction === 'asc'
          ? a.totalPesanan - b.totalPesanan
          : b.totalPesanan - a.totalPesanan;
      }
      return 0;
    });
  }, [filteredOrders, sortConfig]);

  // --- Memoized Filtering and Pagination ---
  const filteredOrders = useMemo(() => {
    const rangeFrom = dateRange?.from ? startOfDay(dateRange.from) : null;
    const rangeTo = dateRange?.to ? endOfDay(dateRange.to) : null;

    return orders.filter(order => {
      const matchesSearch = order.nomorPesanan?.toLowerCase().includes(searchTerm.toLowerCase()) || order.namaPelanggan?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const orderDate = order.tanggal ? new Date(order.tanggal) : null;
      const matchesDate = !rangeFrom || !rangeTo || !orderDate ? true : (orderDate >= rangeFrom && orderDate <= rangeTo);
      const matchesMinTotal = !minTotal || order.totalPesanan >= minTotal;
      const matchesMaxTotal = !maxTotal || order.totalPesanan <= maxTotal;
      return matchesSearch && matchesStatus && matchesDate && matchesMinTotal && matchesMaxTotal;
    });
  }, [orders, searchTerm, statusFilter, dateRange, minTotal, maxTotal]);

  const currentItems = useMemo(() => {
    const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
    return sortedOrders.slice(indexOfFirstItem, indexOfFirstItem + itemsPerPage);
  }, [sortedOrders, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const allCurrentSelected = currentItems.length > 0 && currentItems.every(o => selectedOrderIds.includes(o.id));
  const someCurrentSelected = currentItems.some(o => selectedOrderIds.includes(o.id)) && !allCurrentSelected;

  // --- Render Functions ---
  if (loading) {
    return <div className="p-6 text-center text-gray-600">Memuat data pesanan...</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-100 p-4 rounded-lg shadow-md">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-r from-gray-600 to-orange-500 p-3 rounded-full">
            <Lucide.FileText className="h-8 w-8 text-white" /> {/* <-- PENGGUNAAN Lucide.FileText */}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-600 to-orange-500 bg-clip-text text-transparent">
              Manajemen Pesanan
            </h1>
            <p className="text-gray-600">Kelola semua pesanan dari pelanggan Anda dengan efisien.</p>
          </div>
        </div>
        <Button className="flex items-center gap-2 bg-gradient-to-r from-gray-700 to-orange-500 hover:from-gray-600 hover:to-orange-400 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 py-3 px-5 rounded-lg" onClick={handleNewOrder}>
          <Lucide.Plus className="h-5 w-5 stroke-[3]" /> Tambah Pesanan {/* <-- PENGGUNAAN Lucide.Plus */}
        </Button>
      </div>

      <Card className="bg-gray-50 shadow-sm">
        <CardHeader><CardTitle className="text-gray-800">Filter Pesanan</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="relative sm:col-span-1">
              <Lucide.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" /> {/* <-- PENGGUNAAN Lucide.Search */}
              <Input placeholder="Cari No. Pesanan / Nama..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-white border-gray-300" />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button id="date" variant="outline" className={cn("w-full justify-start text-left font-normal bg-white border-gray-300", !dateRange && "text-gray-500")}>
                  <Lucide.Calendar className="mr-2 h-4 w-4 text-gray-500" /> {/* <-- PENGGUNAAN Lucide.Calendar */}
                  {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "d LLL y")} - ${format(dateRange.to, "d LLL y")}` : format(dateRange.from, "d LLL y")) : (<span>Pilih Tanggal</span>)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white" align="end">
                <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={isMobile ? 1 : 2} />
              </PopoverContent>
            </Popover>
            <Select value={statusFilter} onValueChange={setStatusFilter} className="bg-white border-gray-300">
              <SelectTrigger><SelectValue placeholder="Filter Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                {orderStatusList.map((statusOption) => (<SelectItem key={statusOption.key} value={statusOption.key}>{statusOption.label}</SelectItem>))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min Total"
                value={minTotal || ''}
                onChange={(e) => setMinTotal(e.target.value ? Number(e.target.value) : undefined)}
                className="bg-white border-gray-300"
              />
              <Input
                type="number"
                placeholder="Max Total"
                value={maxTotal || ''}
                onChange={(e) => setMaxTotal(e.target.value ? Number(e.target.value) : undefined)}
                className="bg-white border-gray-300"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-50 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-800">Daftar Pesanan</CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Label htmlFor="itemsPerPage">Baris per halaman:</Label>
              <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }} className="bg-white border-gray-300">
                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="5">5</SelectItem><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-200">
                <TableRow>
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
                  <TableHead className="cursor-pointer" onClick={() => sortOrders('nomorPesanan')}>
                    Nomor Pesanan <Lucide.ArrowUpDown className="ml-2 h-4 w-4 inline" /> {/* <-- PENGGUNAAN Lucide.ArrowUpDown */}
                  </TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => sortOrders('tanggal')}>
                    Tanggal <Lucide.ArrowUpDown className="ml-2 h-4 w-4 inline" /> {/* <-- PENGGUNAAN Lucide.ArrowUpDown */}
                  </TableHead>
                  <TableHead className="w-[180px]">Status</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => sortOrders('totalPesanan')}>
                    Total <Lucide.ArrowUpDown className="ml-2 h-4 w-4 inline" /> {/* <-- PENGGUNAAN Lucide.ArrowUpDown */}
                  </TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems.length > 0 ? currentItems.map((order) => (
                  <TableRow key={order.id} className={cn(
                    "hover:bg-orange-50/50 transition-colors border-b border-gray-200",
                    selectedOrderIds.includes(order.id) && "bg-blue-50 border-l-4 border-l-blue-500"
                  )}>
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
                    <TableCell className="font-medium">{order.nomorPesanan}</TableCell>
                    <TableCell>
                      <div>{order.namaPelanggan}</div>
                      <div className="text-xs text-gray-500">{order.teleponPelanggan}</div>
                    </TableCell>
                    <TableCell>{formatDateForDisplay(order.tanggal)}</TableCell>
                    <TableCell>
                      <div className={cn("flex items-center gap-2 p-1 rounded", getStatusColor(order.status))}>
                        {/* MENGGANTI ICON UNTUK DIAGNOSTIK */}
                        {order.status === 'pending' && <Lucide.FileText className="h-4 w-4 text-gray-600" />} {/* Menggunakan FileText */}
                        {order.status === 'confirmed' && <Lucide.CheckSquare className="h-4 w-4 text-green-600" />}
                        {order.status === 'shipping' && <Lucide.FileText className="h-4 w-4 text-gray-600" />} {/* Menggunakan FileText */}
                        {order.status === 'delivered' && <Lucide.FileText className="h-4 w-4 text-gray-600" />}
                        <span className="text-xs font-medium">{getStatusText(order.status)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">Rp {order.totalPesanan?.toLocaleString('id-ID') || '0'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEditOrderForm(order)}><Lucide.Edit className="h-4 w-4 text-gray-600" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleFollowUpClick(order)}><Lucide.MessageSquare className="h-4 w-4 text-gray-600" /></Button>
                        <Button asChild variant="ghost" size="icon"><Link to={`/pesanan/invoice/${order.id}`}><Lucide.FileText className="h-4 w-4 text-gray-600" /></Link></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700"><Lucide.Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
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
                )) : (
                  <TableRow><TableCell colSpan={7} className="text-center h-24 text-gray-500">Tidak ada pesanan ditemukan.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-100">
          {(isSelectionMode || selectedOrderIds.length > 0) && (
            <div className="flex items-center gap-2 mb-4 sm:mb-0">
              <Button
                variant={isSelectionMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsSelectionMode(!isSelectionMode)}
                className={isSelectionMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-gray-300 text-gray-600 hover:bg-gray-100"}
              >
                {isSelectionMode ? (
                  <>
                    <Lucide.X className="h-4 w-4 mr-2" /> {/* <-- PENGGUNAAN Lucide.X */}
                    Keluar Mode Pilih
                  </>
                ) : (
                  <>
                    <Lucide.CheckSquare className="h-4 w-4 mr-2" /> {/* <-- PENGGUNAAN Lucide.CheckSquare */}
                    Mode Pilih
                  </>
                )}
              </Button>
              {selectedOrderIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowBulkDeleteDialog(true)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Lucide.Trash2 className="h-4 w-4 mr-2" /> {/* <-- PENGGUNAAN Lucide.Trash2 */}
                  Hapus {selectedOrderIds.length} Item
                </Button>
              )}
            </div>
          )}
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="text-sm text-gray-600">
              Menampilkan {Math.min(filteredOrders.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredOrders.length, currentPage * itemsPerPage)} dari {filteredOrders.length} pesanan
              {selectedOrderIds.length > 0 && (
                <span className="ml-2 text-blue-600 font-medium">({selectedOrderIds.length} dipilih)</span>
              )}
            </div>
            <div className="flex items-center gap-1 mt-4 sm:mt-0">
              <Button variant="outline" size="icon" className="border-gray-300 text-gray-600 hover:bg-gray-100" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><Lucide.ChevronLeft className="h-4 w-4" /></Button> {/* <-- PENGGUNAAN Lucide.ChevronLeft */}
              <span className="px-4 text-sm text-gray-600">Hal {currentPage} / {totalPages || 1}</span>
              <Button variant="outline" size="icon" className="border-gray-300 text-gray-600 hover:bg-gray-100" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages || totalPages === 0}><Lucide.ChevronRight className="h-4 w-4" /></Button> {/* <-- PENGGUNAAN Lucide.ChevronRight */}
            </div>
          </div>
        </CardFooter>
      </Card>

      <OrderForm open={showOrderForm} onOpenChange={setShowOrderForm} onSubmit={handleSubmit} initialData={editingOrder} />
      <WhatsappFollowUpModal
        isOpen={isWhatsappModalOpen}
        onClose={() => setIsWhatsappModalOpen(false)}
        order={selectedOrderForWhatsapp}
        getWhatsappTemplateByStatus={getWhatsappTemplateByStatus}
      />
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-800">Anda Yakin?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Anda akan menghapus <strong>{selectedOrderIds.length} pesanan</strong>. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300 text-gray-600 hover:bg-gray-100">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OrdersPage;