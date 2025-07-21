import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, Edit, Trash2, Package, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePurchase } from '@/contexts/PurchaseContext';
import { useSupplier } from '@/contexts/SupplierContext';
import { useBahanBaku } from '@/contexts/BahanBakuContext';
import { toast } from 'sonner';
import { formatDateForDisplay } from '@/utils/dateUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { generateUUID } from '@/utils/uuid';
import { formatCurrency } from '@/utils/currencyUtils';
import { Purchase, PurchaseItem } from '@/types/supplier'; 
import { cn } from '@/lib/utils';

const PurchaseManagement = () => {
  const isMobile = useIsMobile();
  const { purchases, addPurchase, updatePurchase, deletePurchase } = usePurchase();
  const { suppliers } = useSupplier();
  const { bahanBaku } = useBahanBaku();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination state
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [newPurchase, setNewPurchase] = useState<{
    supplier: string;
    tanggal: Date;
    items: PurchaseItem[];
    status: 'pending' | 'completed' | 'cancelled';
    metodePerhitungan: 'FIFO' | 'LIFO' | 'Average';
    totalNilai: number;
  }>({
    supplier: '',
    tanggal: new Date(),
    items: [],
    status: 'pending', // Default untuk form baru
    metodePerhitungan: 'FIFO',
    totalNilai: 0,
  });

  const [newItem, setNewItem] = useState({
    namaBarang: '',
    jumlah: 0,
    satuan: '',
    hargaSatuan: 0,
  });

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
    const purchaseDataToSend: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      supplier: newPurchase.supplier,
      tanggal: newPurchase.tanggal,
      items: newPurchase.items,
      status: newPurchase.status,
      metodePerhitungan: newPurchase.metodePerhitungan,
      totalNilai: totalNilai,
    };

    let success = false;
    if (editingPurchase) {
      success = await updatePurchase(editingPurchase.id, purchaseDataToSend);
    } else {
      success = await addPurchase(purchaseDataToSend);
    }

    if (success) {
      setIsDialogOpen(false);
      setEditingPurchase(null);
    }
  };

  const handleOpenNewDialog = () => {
    setEditingPurchase(null);
    setNewPurchase({
      supplier: '',
      tanggal: new Date(),
      items: [],
      status: 'pending', 
      metodePerhitungan: 'FIFO',
      totalNilai: 0,
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
      metodePerhitungan: purchase.metodePerhitungan || 'FIFO',
    });
    setNewItem({ namaBarang: '', jumlah: 0, satuan: '', hargaSatuan: 0 }); 
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus pembelian ini?')) {
      await deletePurchase(id);
    }
  };
  
  const filteredPurchases = purchases.filter(p => {
    const supplierData = suppliers.find(s => s.id === p.supplier);
    const matchesSearch = supplierData?.nama.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-800">Selesai</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'cancelled': return <Badge className="bg-red-100 text-red-800">Dibatalkan</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPurchases.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-full">
            <ShoppingCart className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              Manajemen Pembelian Bahan Baku
            </h1>
            <p className="text-muted-foreground">Kelola semua transaksi pembelian bahan baku Anda</p>
          </div>
        </div>
        <Button 
  className="flex items-center gap-2 bg-gradient-to-r from-[#FF9500] to-[#FF2E2E] hover:from-[#FF8A00] hover:to-[#E82A2A] text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 py-3 px-5 rounded-lg"
  onClick={handleNewOrder}
>
  <Plus className="h-5 w-5 stroke-[3]" />
  <span className="font-medium text-base">Tambah Pembelian</span>
</Button>

        {/* Filter Card */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Filter Pembelian</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari berdasarkan nama supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200/80 overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 sm:p-6 border-b border-gray-200/80">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Label htmlFor="show-entries" className="whitespace-nowrap">Show</Label>
              <Select 
                value={String(itemsPerPage)} 
                onValueChange={(value) => { 
                  setItemsPerPage(Number(value)); 
                  setCurrentPage(1); 
                }}
              >
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

        {/* Table Content */}
        <div className="overflow-x-auto">
          <Table className="min-w-full text-sm text-left text-gray-700">
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  Tanggal
                </TableHead>
                <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  Supplier
                </TableHead>
                <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  Jumlah Item
                </TableHead>
                <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  Total Nilai
                </TableHead>
                <TableHead className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  Status
                </TableHead>
                <TableHead className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-200">
              {currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="mb-4">
                      {searchTerm ? 'Tidak ada pembelian yang sesuai dengan pencarian' : 'Belum ada data pembelian'}
                    </p>
                    {!searchTerm && (
                      <Button
                        onClick={handleOpenNewDialog}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Pembelian Pertama
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((purchase) => {
                  const supplierData = suppliers.find(s => s.id === purchase.supplier);
                  return (
                    <TableRow key={purchase.id} className="hover:bg-orange-50/50">
                      <TableCell className="py-4 px-4 border-b border-gray-200">
                        <div className="text-gray-700">{formatDateForDisplay(purchase.tanggal)}</div>
                      </TableCell>
                      <TableCell className="py-4 px-4 border-b border-gray-200">
                        <div className="font-medium">{supplierData?.nama || 'N/A'}</div>
                      </TableCell>
                      <TableCell className="py-4 px-4 border-b border-gray-200">
                        <div className="text-gray-700">{purchase.items.length}</div>
                      </TableCell>
                      <TableCell className="py-4 px-4 border-b border-gray-200">
                        <div className="font-semibold text-orange-600">{formatCurrency(purchase.totalNilai)}</div>
                      </TableCell>
                      <TableCell className="py-4 px-4 border-b border-gray-200">
                        {getStatusBadge(purchase.status)}
                      </TableCell>
                      <TableCell className="py-4 px-4 border-b border-gray-200 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(purchase)}
                            className="h-8 w-8 p-0 hover:bg-orange-100 hover:text-orange-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(purchase.id)}
                            className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between p-4 sm:px-6 border-t border-gray-200/80">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{indexOfFirstItem + 1}</span> to <span className="font-semibold">{Math.min(indexOfLastItem, filteredPurchases.length)}</span> of <span className="font-semibold">{filteredPurchases.length}</span> entries
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

      {/* Dialog for Add/Edit Purchase */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingPurchase ? 'Edit Pembelian' : 'Tambah Pembelian Baru'}</DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-4">
            {/* Form Header */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Supplier *</Label>
                <Select
                  value={newPurchase.supplier}
                  onValueChange={(val) => setNewPurchase(prev => ({...prev, supplier: val}))}
                >
                  <SelectTrigger><SelectValue placeholder="Pilih supplier" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.nama}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tanggal *</Label>
                <Input
                  type="date"
                  value={newPurchase.tanggal.toISOString().split('T')[0]}
                  onChange={(e) => setNewPurchase(prev => ({...prev, tanggal: new Date(e.target.value)}))}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={newPurchase.status}
                  onValueChange={(val: 'pending' | 'completed' | 'cancelled') =>
                    setNewPurchase(prev => ({ ...prev, status: val }))
                  }
                >
                  <SelectTrigger><SelectValue placeholder="Pilih status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Selesai</SelectItem>
                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Metode Perhitungan</Label>
                <Select
                  value={newPurchase.metodePerhitungan}
                  onValueChange={(val: 'FIFO' | 'LIFO' | 'Average') =>
                    setNewPurchase(prev => ({ ...prev, metodePerhitungan: val }))
                  }
                >
                  <SelectTrigger><SelectValue placeholder="Pilih metode" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIFO">FIFO</SelectItem>
                    <SelectItem value="LIFO">LIFO</SelectItem>
                    <SelectItem value="Average">Rata-rata</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Add Item Form */}
            <Card className="border-orange-200 bg-orange-50 shadow-sm">
              <CardHeader className="py-3">
                <CardTitle className="text-base text-gray-800">Tambah Item</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end pt-2">
                <div className="sm:col-span-2">
                  <Label>Nama Barang *</Label>
                  <Select
                    value={newItem.namaBarang}
                    onValueChange={(val) => {
                      const selectedBahan = bahanBaku.find(b => b.nama === val);
                      setNewItem({
                        ...newItem,
                        namaBarang: val,
                        satuan: selectedBahan?.satuan || '',
                        hargaSatuan: selectedBahan?.hargaSatuan || 0,
                      });
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Pilih Bahan Baku" /></SelectTrigger>
                    <SelectContent>
                      {bahanBaku.map(b => <SelectItem key={b.id} value={b.nama}>{b.nama}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Jumlah *</Label>
                  <Input 
                    type="number" 
                    value={newItem.jumlah} 
                    onChange={(e) => setNewItem({...newItem, jumlah: parseFloat(e.target.value)})} 
                  />
                </div>
                <div>
                  <Label>Harga Satuan *</Label>
                  <Input 
                    type="number" 
                    value={newItem.hargaSatuan} 
                    onChange={(e) => setNewItem({...newItem, hargaSatuan: parseFloat(e.target.value)})} 
                  />
                </div>
                <Button 
                  onClick={handleAddItem} 
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Plus className="h-4 w-4 mr-2"/>Tambah
                </Button>
              </CardContent>
            </Card>
            
            {/* Items Table */}
            {newPurchase.items.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">Nama</TableHead>
                      <TableHead className="min-w-[100px]">Jumlah</TableHead>
                      <TableHead className="min-w-[120px]">Harga/Satuan</TableHead>
                      <TableHead className="min-w-[120px]">Total</TableHead>
                      <TableHead className="min-w-[80px]">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {newPurchase.items.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>{item.namaBarang}</TableCell>
                        <TableCell>{item.jumlah} {item.satuan}</TableCell>
                        <TableCell>{formatCurrency(item.hargaSatuan)}</TableCell>
                        <TableCell className="font-semibold text-orange-600">{formatCurrency(item.totalHarga)}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleRemoveItem(item.id)}
                            className="h-8 w-8 hover:bg-red-100 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <DialogFooter className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
            <Button 
              onClick={handleSavePurchase}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {editingPurchase ? "Update" : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseManagement;