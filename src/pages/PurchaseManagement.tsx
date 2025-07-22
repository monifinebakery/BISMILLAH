import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ShoppingCart, AlertTriangle, Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, CheckSquare, X, Loader2, MoreHorizontal, Package } from 'lucide-react';
import { usePurchase } from '@/contexts/PurchaseContext';
import { useSupplier } from '@/contexts/SupplierContext';
import { useBahanBaku } from '@/contexts/BahanBakuContext';
import { BahanBaku } from '@/types/bahanBaku';
import { toast } from 'sonner';
import { formatDateForDisplay } from '@/utils/dateUtils';
import { generateUUID } from '@/utils/uuid';
import { formatCurrency } from '@/utils/currencyUtils';
import { Purchase, PurchaseItem } from '@/types/supplier';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Eye } from 'lucide-react';

const PurchaseManagement = () => {
  const { purchases, addPurchase, updatePurchase, deletePurchase, isLoading } = usePurchase();
  const { suppliers } = useSupplier();
  const { bahanBaku } = useBahanBaku();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPurchaseIds, setSelectedPurchaseIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const [newPurchase, setNewPurchase] = useState<{
    supplier: string;
    tanggal: Date;
    items: PurchaseItem[];
    status: 'pending' | 'completed' | 'cancelled';
  }>({
    supplier: '',
    tanggal: new Date(),
    items: [],
    status: 'pending',
  });

  const [newItem, setNewItem] = useState({ namaBarang: '', jumlah: 0, satuan: '', hargaSatuan: 0 });

  const handleAddItem = () => {
    if (!newItem.namaBarang || newItem.jumlah <= 0 || newItem.hargaSatuan <= 0) {
      toast.error('Nama, kuantitas (>0), dan harga satuan (>0) wajib diisi.');
      return;
    }
    const item: PurchaseItem = {
      id: generateUUID(),
      namaBarang: newItem.namaBarang,
      jumlah: newItem.jumlah,
      satuan: newItem.satuan,
      hargaSatuan: newItem.hargaSatuan,
      totalHarga: newItem.jumlah * newItem.hargaSatuan,
    };
    setNewPurchase(prev => ({
      ...prev,
      items: [...prev.items, item],
    }));
    setNewItem({ namaBarang: '', jumlah: 0, satuan: '', hargaSatuan: 0 });
    toast.success('Item berhasil ditambahkan.');
  };

  const handleRemoveItem = (itemId: string) => {
    setNewPurchase(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId),
    }));
    toast.success('Item berhasil dihapus.');
  };

  const handleSavePurchase = async () => {
    if (!newPurchase.supplier || newPurchase.items.length === 0) {
      toast.error('Supplier dan minimal satu item wajib diisi.');
      return;
    }
    const totalNilai = newPurchase.items.reduce((sum, item) => sum + item.totalHarga, 0);
    const purchaseData = { ...newPurchase, totalNilai };

    let success = false;
    if (editingPurchase) {
      success = await updatePurchase(editingPurchase.id, purchaseData);
    } else {
      success = await addPurchase(purchaseData);
    }

    if (success) {
      setIsDialogOpen(false);
      setEditingPurchase(null);
      setSelectedPurchaseIds(prev => prev.filter(id => id !== (editingPurchase?.id || '')));
    }
  };

  const handleStatusChange = async (purchaseId: string, newStatus: string) => {
    const success = await updatePurchase(purchaseId, { status: newStatus as Purchase['status'] });
    if (success) {
      toast.success('Status pembelian berhasil diubah.');
    }
  };

  const handleOpenNewDialog = () => {
    setEditingPurchase(null);
    setNewPurchase({
      supplier: '',
      tanggal: new Date(),
      items: [],
      status: 'pending',
    });
    setNewItem({ namaBarang: '', jumlah: 0, satuan: '', hargaSatuan: 0 });
    setIsDialogOpen(true);
  };

  const handleEdit = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setNewPurchase({
      ...purchase,
      tanggal: purchase.tanggal instanceof Date ? purchase.tanggal : new Date(purchase.tanggal),
      status: purchase.status as 'pending' | 'completed' | 'cancelled',
    });
    setNewItem({ namaBarang: '', jumlah: 0, satuan: '', hargaSatuan: 0 });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    setSelectedPurchaseIds(prev => prev.filter(sId => sId !== id)); // Update state sebelum penghapusan
    await deletePurchase(id);
  };

  const handleBulkDelete = async () => {
    if (selectedPurchaseIds.length === 0) {
      toast.warning('Pilih item yang ingin dihapus terlebih dahulu');
      return;
    }
    setSelectedPurchaseIds([]); // Bersihkan state seleksi sebelum penghapusan
    const success = await Promise.all(selectedPurchaseIds.map(id => deletePurchase(id)));
    if (success.every(s => s)) {
      setShowBulkDeleteDialog(false);
      setIsSelectionMode(false);
      toast.success('Pembelian berhasil dihapus!');
    }
  };

  const toggleSelectAllCurrent = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedPurchaseIds(prev => [...new Set([...prev, ...currentItems.map(p => p.id)])]);
    } else {
      setSelectedPurchaseIds(prev => prev.filter(id => !currentItems.some(p => p.id === id)));
    }
  };

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      const supplierData = suppliers.find(s => s.id === p.supplier);
      return supplierData?.nama.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
    });
  }, [purchases, suppliers, searchTerm]);

  const currentItems = useMemo(() => {
    const firstItem = (currentPage - 1) * itemsPerPage;
    return filteredPurchases.slice(firstItem, firstItem + itemsPerPage);
  }, [filteredPurchases, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);
  const allCurrentSelected = currentItems.length > 0 && currentItems.every(p => selectedPurchaseIds.includes(p.id));
  const someCurrentSelected = currentItems.some(p => selectedPurchaseIds.includes(p.id)) && !allCurrentSelected;

  return (
    <div className="container mx-auto p-4 sm:p-8">
      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-6 mb-8 shadow-xl">
        <div className="flex items-center gap-4 mb-4 lg:mb-0">
          <div className="flex-shrink-0 bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
            <ShoppingCart className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Manajemen Pembelian Bahan Baku</h1>
            <p className="text-sm opacity-90 mt-1">Kelola semua transaksi pembelian bahan baku Anda dengan mudah.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <Button
            onClick={handleOpenNewDialog}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-orange-600 font-semibold rounded-lg shadow-md hover:bg-gray-100 transition-all duration-200 hover:shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Tambah Pembelian
          </Button>
        </div>
      </header>

      {/* Bulk Actions Toolbar */}
      {(isSelectionMode || selectedPurchaseIds.length > 0) && (
        <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-700">Mode Pilih Multiple</span>
                </div>
                {selectedPurchaseIds.length > 0 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1 font-semibold">
                    {selectedPurchaseIds.length} item dipilih
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setSelectedPurchaseIds([]); setIsSelectionMode(false); }}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Batalkan
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allIds = filteredPurchases.map(p => p.id);
                    setSelectedPurchaseIds(prev => prev.length === allIds.length ? [] : allIds);
                  }}
                  className="border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  Pilih Semua ({filteredPurchases.length})
                </Button>
                {selectedPurchaseIds.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowBulkDeleteDialog(true)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus {selectedPurchaseIds.length} Item
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            <div className="w-full lg:w-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari nama supplier..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-10 border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 w-full lg:w-80"
              />
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
                <TableHead className="font-semibold text-gray-700">Tanggal</TableHead>
                <TableHead className="font-semibold text-gray-700">Supplier</TableHead>
                <TableHead className="font-semibold text-gray-700">Total Nilai</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="text-center font-semibold text-gray-700 w-20">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                      <span className="text-gray-500 font-medium">Memuat data pembelian...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPurchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <ShoppingCart className="h-16 w-16 text-gray-300" />
                      <div className="text-center">
                        <p className="text-lg font-medium text-gray-600 mb-2">
                          {searchTerm ? 'Tidak ada pembelian yang cocok dengan pencarian' : 'Belum ada data pembelian'}
                        </p>
                        <p className="text-gray-500 text-sm mb-4">
                          {searchTerm ? 'Coba ubah kata kunci pencarian Anda' : 'Mulai dengan menambahkan pembelian pertama'}
                        </p>
                      </div>
                      {!searchTerm && (
                        <Button
                          onClick={handleOpenNewDialog}
                          className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow-md transition-all duration-200"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Tambah Pembelian Pertama
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((purchase, index) => {
                  const supplierData = suppliers.find(s => s.id === purchase.supplier);
                  return (
                    <TableRow
                      key={purchase.id}
                      className={cn(
                        "hover:bg-orange-50/50 transition-colors border-b border-gray-100",
                        selectedPurchaseIds.includes(purchase.id) && "bg-blue-50 border-l-4 border-l-blue-500",
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                      )}
                    >
                      <TableCell className="p-4">
                        {isSelectionMode && (
                          <Checkbox
                            checked={selectedPurchaseIds.includes(purchase.id)}
                            onCheckedChange={(checked) => {
                              setSelectedPurchaseIds(prev => 
                                checked ? [...prev, purchase.id] : prev.filter(id => id !== purchase.id)
                              );
                            }}
                            className="border-gray-400"
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900 p-4">
                        {formatDateForDisplay(purchase.tanggal)}
                      </TableCell>
                      <TableCell className="p-4">
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 font-medium">
                          {supplierData?.nama || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right p-4">
                        <span className="font-semibold text-green-600 text-base">
                          {formatCurrency(purchase.totalNilai)}
                        </span>
                      </TableCell>
                      <TableCell className="p-4">
                        <Select value={purchase.status} onValueChange={(newStatus) => handleStatusChange(purchase.id, newStatus)} className="w-full">
                          <SelectTrigger className={cn("h-8 border-none text-sm", {
                            'bg-yellow-100 text-yellow-800': purchase.status === 'pending',
                            'bg-green-100 text-green-800': purchase.status === 'completed',
                            'bg-red-100 text-red-800': purchase.status === 'cancelled',
                          })}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Selesai</SelectItem>
                            <SelectItem value="cancelled">Dibatalkan</SelectItem>
                          </SelectContent>
                        </Select>
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
                              <DropdownMenuItem onClick={() => handleEdit(purchase)} className="cursor-pointer">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(purchase.id)}
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
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {filteredPurchases.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:px-6 border-t border-gray-200 bg-gray-50/50">
            <div className="text-sm text-gray-600 mb-4 sm:mb-0">
              Showing <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filteredPurchases.length)}</span> of{' '}
              <span className="font-semibold">{filteredPurchases.length}</span> entries
              {selectedPurchaseIds.length > 0 && (
                <span className="ml-2 text-blue-600 font-medium">
                  ({selectedPurchaseIds.length} selected)
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-gray-100"
                onClick={() => setCurrentPage(p => p - 1)}
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
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage === totalPages}
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
              Anda akan menghapus <strong>{selectedPurchaseIds.length} item</strong> pembelian:
              <div className="mt-3 p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                <ul className="space-y-1">
                  {currentItems.filter(p => selectedPurchaseIds.includes(p.id)).slice(0, 5).map(p => {
                    const supplierData = suppliers.find(s => s.id === p.supplier);
                    return (
                      <li key={p.id} className="flex items-center gap-2 text-sm">
                        <Trash2 className="h-3 w-3 text-red-500 flex-shrink-0" />
                        <span className="font-medium">{formatDateForDisplay(p.tanggal)}</span>
                        <span className="text-gray-500">({supplierData?.nama || 'N/A'})</span>
                      </li>
                    );
                  })}
                  {selectedPurchaseIds.length > 5 && (
                    <li className="text-sm text-gray-500 italic">
                      ... dan {selectedPurchaseIds.length - 5} item lainnya
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
              Hapus {selectedPurchaseIds.length} Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">{editingPurchase ? 'Edit Pembelian' : 'Tambah Pembelian'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleSavePurchase(); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
              <div className="md:col-span-2">
                <Label htmlFor="supplier" className="font-medium">Supplier *</Label>
                <Select value={newPurchase.supplier} onValueChange={(val) => setNewPurchase(p => ({ ...p, supplier: val }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pilih supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.nama}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tanggal" className="font-medium">Tanggal *</Label>
                <Input
                  id="tanggal"
                  type="date"
                  value={newPurchase.tanggal.toISOString().split('T')[0]}
                  onChange={(e) => setNewPurchase(p => ({ ...p, tanggal: new Date(e.target.value) }))}
                  className="mt-1"
                />
              </div>
            </div>

            <Card className="border-orange-200 bg-orange-50/50 shadow-sm rounded-lg mt-6">
              <CardHeader className="py-3">
                <CardTitle className="text-base text-gray-800">Tambah Item</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="namaBarang" className="text-sm font-medium">Nama Barang *</Label>
                    <Select value={newItem.namaBarang} onValueChange={(val) => { const sb = bahanBaku.find(b => b.nama === val); setNewItem({ ...newItem, namaBarang: val, satuan: sb?.satuan || '', hargaSatuan: sb?.hargaSatuan || 0 }); }}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Pilih Bahan Baku" />
                      </SelectTrigger>
                      <SelectContent>
                        {bahanBaku.map(b => <SelectItem key={b.id} value={b.nama}>{b.nama}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="jumlah" className="text-sm font-medium">Jumlah *</Label>
                    <Input
                      id="jumlah"
                      type="number"
                      value={newItem.jumlah}
                      onChange={(e) => setNewItem({ ...newItem, jumlah: parseFloat(e.target.value) || 0 })}
                      min="0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hargaSatuan" className="text-sm font-medium">Harga Satuan *</Label>
                    <Input
                      id="hargaSatuan"
                      type="number"
                      value={newItem.hargaSatuan}
                      onChange={(e) => setNewItem({ ...newItem, hargaSatuan: parseFloat(e.target.value) || 0 })}
                      min="0"
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleAddItem}
                  className="bg-orange-500 hover:bg-orange-600 text-white mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" /> Tambah
                </Button>
              </CardContent>
            </Card>

            {newPurchase.items.length > 0 && (
              <Table className="mt-4">
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b border-gray-200">
                    <TableHead className="font-semibold">Nama</TableHead>
                    <TableHead className="font-semibold">Jumlah</TableHead>
                    <TableHead className="font-semibold">Harga/Satuan</TableHead>
                    <TableHead className="font-semibold">Total</TableHead>
                    <TableHead className="text-center font-semibold">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newPurchase.items.map(item => (
                    <TableRow key={item.id} className="border-b border-gray-100">
                      <TableCell className="font-medium">{item.namaBarang}</TableCell>
                      <TableCell>{item.jumlah} {item.satuan}</TableCell>
                      <TableCell>{formatCurrency(item.hargaSatuan)}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(item.totalHarga)}</TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)} className="h-8 w-8 hover:bg-gray-100">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                {editingPurchase ? 'Perbarui' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseManagement;