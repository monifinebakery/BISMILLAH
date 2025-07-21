import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ShoppingCart, Plus, Edit, Trash2, Package, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const PurchaseManagement = () => {
  const { purchases, addPurchase, updatePurchase, deletePurchase, isLoading } = usePurchase();
  const { suppliers } = useSupplier();
  const { bahanBaku } = useBahanBaku();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedPurchaseIds, setSelectedPurchaseIds] = useState<string[]>([]);
  const [isMultipleSelectMode, setIsMultipleSelectMode] = useState(false);

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
    }
  };

  const handleStatusChange = async (purchaseId: string, newStatus: string) => {
    const success = await updatePurchase(purchaseId, { status: newStatus as Purchase['status'] });
    if (success) {
      toast.success(`Status pembelian berhasil diubah.`);
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

  const handleDelete = (id: string) => deletePurchase(id);

  const handleBulkDelete = async () => {
    if (selectedPurchaseIds.length === 0) {
      toast.error('Pilih setidaknya satu pembelian untuk dihapus');
      return;
    }
    for (const id of selectedPurchaseIds) {
      await deletePurchase(id);
    }
    setSelectedPurchaseIds([]);
    setIsMultipleSelectMode(false);
    toast.success('Pembelian berhasil dihapus!');
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedPurchaseIds(currentItems.map(p => p.id));
    } else {
      setSelectedPurchaseIds([]);
    }
  };

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      const supplierData = suppliers.find(s => s.id === p.supplier);
      const matchesSearch = supplierData?.nama.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [purchases, suppliers, searchTerm, statusFilter]);
  
  const currentItems = useMemo(() => {
    const firstItem = (currentPage - 1) * itemsPerPage;
    return filteredPurchases.slice(firstItem, firstItem + itemsPerPage);
  }, [filteredPurchases, currentPage, itemsPerPage]);
  
  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);

  return (
    <div className="container mx-auto p-2 sm:p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 sm:p-3 rounded-full">
            <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              Manajemen Pembelian Bahan Baku
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Kelola semua transaksi pembelian bahan baku Anda</p>
          </div>
        </div>
        <Button
          className="w-full sm:w-auto flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-[#FF9500] to-[#FF2E2E] hover:from-[#FF8A00] hover:to-[#E82A2A] text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 py-2 sm:py-3 px-3 sm:px-5 rounded-md text-xs sm:text-base"
          onClick={handleOpenNewDialog}
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5 stroke-[3]" />
          <span>Tambah Pembelian</span>
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardHeader><CardTitle className="text-base sm:text-lg">Filter Pembelian</CardTitle></CardHeader>
        <CardContent className="p-2 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
              <Input placeholder="Cari nama supplier..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8 pr-2 py-1 sm:py-2 w-full text-xs sm:text-sm" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-[180px]">
              <SelectTrigger className="w-full text-xs sm:text-sm py-1 sm:py-2"><SelectValue placeholder="Filter status" /></SelectTrigger>
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
      
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
            <CardTitle className="text-base sm:text-lg">Daftar Pembelian</CardTitle>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
              <div className="flex items-center gap-1 sm:gap-2">
                <Label htmlFor="itemsPerPage" className="whitespace-nowrap">Baris per halaman:</Label>
                <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }} className="w-20">
                  <SelectTrigger className="text-xs sm:text-sm py-1 sm:py-2"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="5">5</SelectItem><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem></SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setIsMultipleSelectMode(!isMultipleSelectMode);
                  setSelectedPurchaseIds([]);
                }}
                className="w-full sm:w-auto text-xs sm:text-sm py-1 sm:py-2"
              >
                {isMultipleSelectMode ? 'Keluar Mode Pilih' : 'Mode Pilih Multiple'}
              </Button>
              {isMultipleSelectMode && (
                <Button
                  variant="destructive"
                  onClick={handleBulkDelete}
                  disabled={selectedPurchaseIds.length === 0}
                  className="w-full sm:w-auto text-xs sm:text-sm py-1 sm:py-2"
                >
                  Hapus Terpilih
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  {isMultipleSelectMode && (
                    <TableHead className="w-10 p-1 sm:p-2">
                      <input
                        type="checkbox"
                        checked={selectedPurchaseIds.length === currentItems.length && currentItems.length > 0}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 sm:h-5 sm:w-5"
                      />
                    </TableHead>
                  )}
                  <TableHead className="p-1 sm:p-2 text-xs sm:text-sm">Tanggal</TableHead>
                  <TableHead className="p-1 sm:p-2 text-xs sm:text-sm">Supplier</TableHead>
                  <TableHead className="p-1 sm:p-2 text-xs sm:text-sm">Total Nilai</TableHead>
                  <TableHead className="p-1 sm:p-2 text-xs sm:text-sm w-[120px] sm:w-[180px]">Status</TableHead>
                  <TableHead className="p-1 sm:p-2 text-xs sm:text-sm text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={isMultipleSelectMode ? 6 : 5} className="text-center h-16 sm:h-24 p-2 text-xs sm:text-sm">Memuat data...</TableCell></TableRow>
                ) : currentItems.length === 0 ? (
                  <TableRow><TableCell colSpan={isMultipleSelectMode ? 6 : 5} className="text-center h-16 sm:h-24 p-2 text-xs sm:text-sm">Tidak ada data pembelian.</TableCell></TableRow>
                ) : (
                  currentItems.map((purchase) => {
                    const supplierData = suppliers.find(s => s.id === purchase.supplier);
                    return (
                      <TableRow key={purchase.id} className="hover:bg-gray-50">
                        {isMultipleSelectMode && (
                          <TableCell className="w-10 p-1 sm:p-2">
                            <input
                              type="checkbox"
                              checked={selectedPurchaseIds.includes(purchase.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPurchaseIds([...selectedPurchaseIds, purchase.id]);
                                } else {
                                  setSelectedPurchaseIds(selectedPurchaseIds.filter(id => id !== purchase.id));
                                }
                              }}
                              className="h-4 w-4 sm:h-5 sm:w-5"
                            />
                          </TableCell>
                        )}
                        <TableCell className="p-1 sm:p-2 text-xs sm:text-sm">{formatDateForDisplay(purchase.tanggal)}</TableCell>
                        <TableCell className="p-1 sm:p-2 text-xs sm:text-sm font-medium">{supplierData?.nama || 'N/A'}</TableCell>
                        <TableCell className="p-1 sm:p-2 text-xs sm:text-sm font-semibold">{formatCurrency(purchase.totalNilai)}</TableCell>
                        <TableCell className="p-1 sm:p-2 text-xs sm:text-sm">
                          <Select value={purchase.status} onValueChange={(newStatus) => handleStatusChange(purchase.id, newStatus)} className="w-full">
                            <SelectTrigger className={cn("h-7 sm:h-8 border-none text-xs sm:text-sm", {
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
                        <TableCell className="p-1 sm:p-2 text-xs sm:text-sm text-right">
                          <div className="flex gap-1 sm:gap-2 justify-end">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(purchase)} className="h-7 w-7 sm:h-8 sm:w-8"><Edit className="h-3 w-3 sm:h-4 sm:w-4" /></Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-red-500 hover:text-red-700"><Trash2 className="h-3 w-3 sm:h-4 sm:w-4" /></Button></AlertDialogTrigger>
                              <AlertDialogContent className="max-w-[90%] sm:max-w-md">
                                <AlertDialogHeader><AlertDialogTitle className="text-sm sm:text-base">Anda Yakin?</AlertDialogTitle><AlertDialogDescription className="text-xs sm:text-sm">Tindakan ini akan menghapus data pembelian secara permanen.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="text-xs sm:text-sm">Batal</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(purchase.id)} className="bg-red-600 hover:bg-red-700 text-xs sm:text-sm">Ya, Hapus</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between p-2 sm:p-4 gap-2 sm:gap-0">
          <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">Menampilkan {Math.min(filteredPurchases.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredPurchases.length, currentPage * itemsPerPage)} dari {filteredPurchases.length} pesanan</div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="h-7 w-7 sm:h-8 sm:w-8"><ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" /></Button>
            <span className="px-2 text-xs sm:text-sm">Hal {currentPage} / {totalPages || 1}</span>
            <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages || totalPages === 0} className="h-7 w-7 sm:h-8 sm:w-8"><ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" /></Button>
          </div>
        </CardFooter>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95%] sm:max-w-4xl max-h-[90vh] flex flex-col p-2 sm:p-4">
          <DialogHeader><DialogTitle className="text-base sm:text-lg">{editingPurchase ? 'Edit Pembelian' : 'Tambah Pembelian Baru'}</DialogTitle></DialogHeader>
          <div className="flex-grow overflow-y-auto p-1 sm:p-2 space-y-2 sm:space-y-4">
            <div className="grid grid-cols-1 gap-2 sm:gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs sm:text-sm">Supplier *</Label>
                <Select value={newPurchase.supplier} onValueChange={(val) => setNewPurchase(p => ({...p, supplier: val}))} className="w-full">
                  <SelectTrigger className="text-xs sm:text-sm py-1 sm:py-2"><SelectValue placeholder="Pilih supplier" /></SelectTrigger>
                  <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id} className="text-xs sm:text-sm">{s.nama}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs sm:text-sm">Tanggal *</Label>
                <Input type="date" value={newPurchase.tanggal.toISOString().split('T')[0]} onChange={(e) => setNewPurchase(p => ({...p, tanggal: new Date(e.target.value)}))} className="text-xs sm:text-sm py-1 sm:py-2" />
              </div>
            </div>
            <Card className="overflow-hidden">
              <CardHeader><CardTitle className="text-sm sm:text-base">Tambah Item</CardTitle></CardHeader>
              <CardContent className="p-2 sm:p-4 grid grid-cols-1 sm:grid-cols-5 gap-2 sm:gap-4 items-end">
                <div className="sm:col-span-2">
                  <Label className="text-xs sm:text-sm">Nama Barang *</Label>
                  <Select value={newItem.namaBarang} onValueChange={(val) => { const sb = bahanBaku.find(b => b.nama === val); setNewItem({ ...newItem, namaBarang: val, satuan: sb?.satuan || '', hargaSatuan: sb?.hargaSatuan || 0 }); }} className="w-full">
                    <SelectTrigger className="text-xs sm:text-sm py-1 sm:py-2"><SelectValue placeholder="Pilih Bahan Baku" /></SelectTrigger>
                    <SelectContent>{bahanBaku.map(b => <SelectItem key={b.id} value={b.nama} className="text-xs sm:text-sm">{b.nama}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm">Jumlah *</Label>
                  <Input type="number" value={newItem.jumlah} onChange={(e) => setNewItem({...newItem, jumlah: parseFloat(e.target.value) || 0})} className="text-xs sm:text-sm py-1 sm:py-2" />
                </div>
                <div>
                  <Label className="text-xs sm:text-sm">Harga Satuan *</Label>
                  <Input type="number" value={newItem.hargaSatuan} onChange={(e) => setNewItem({...newItem, hargaSatuan: parseFloat(e.target.value) || 0})} className="text-xs sm:text-sm py-1 sm:py-2" />
                </div>
                <Button
                  className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-xs sm:text-sm py-1 sm:py-2"
                  onClick={handleAddItem}
                >
                  <Plus className="h-3 w-3 sm:h-4 w-4 mr-1 sm:mr-2"/>Tambah
                </Button>
              </CardContent>
            </Card>
            {newPurchase.items.length > 0 && (
              <Table className="min-w-full">
                <TableHeader><TableRow><TableHead className="p-1 sm:p-2 text-xs sm:text-sm">Nama</TableHead><TableHead className="p-1 sm:p-2 text-xs sm:text-sm">Jumlah</TableHead><TableHead className="p-1 sm:p-2 text-xs sm:text-sm">Harga/Satuan</TableHead><TableHead className="p-1 sm:p-2 text-xs sm:text-sm">Total</TableHead><TableHead className="p-1 sm:p-2 text-xs sm:text-sm">Aksi</TableHead></TableRow></TableHeader>
                <TableBody>
                  {newPurchase.items.map(item => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell className="p-1 sm:p-2 text-xs sm:text-sm">{item.namaBarang}</TableCell>
                      <TableCell className="p-1 sm:p-2 text-xs sm:text-sm">{item.jumlah} {item.satuan}</TableCell>
                      <TableCell className="p-1 sm:p-2 text-xs sm:text-sm">{formatCurrency(item.hargaSatuan)}</TableCell>
                      <TableCell className="p-1 sm:p-2 text-xs sm:text-sm font-semibold">{formatCurrency(item.totalHarga)}</TableCell>
                      <TableCell className="p-1 sm:p-2 text-xs sm:text-sm"><Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)} className="h-7 w-7 sm:h-8 sm:w-8"><Trash2 className="h-3 w-3 sm:h-4 sm:w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter className="flex flex-col sm:flex-row justify-end gap-2 pt-2 sm:pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto text-xs sm:text-sm py-1 sm:py-2">Batal</Button>
            <Button
              className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-xs sm:text-sm py-1 sm:py-2"
              onClick={handleSavePurchase}
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