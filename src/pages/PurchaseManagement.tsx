import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, Edit, Trash2, Package, Search } from 'lucide-react';
import { usePurchases, PurchaseTransaction, PurchaseItem } from '@/hooks/usePurchases';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useAppData } from '@/contexts/AppDataContext';
import { toast } from 'sonner';
import { formatDateForDisplay } from '@/utils/dateUtils';

const PurchaseManagement = () => {
  const { purchases, loading, addPurchase, updatePurchase, deletePurchase } = usePurchases();
  const { suppliers, loading: suppliersLoading } = useSuppliers();
  const { bahanBaku } = useAppData();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<PurchaseTransaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [newPurchase, setNewPurchase] = useState({
    supplierId: '',
    supplierName: '',
    tanggal: new Date().toISOString().split('T')[0], // Initial date as YYYY-MM-DD string
    items: [] as PurchaseItem[],
    status: 'pending' as 'pending' | 'completed' | 'cancelled',
    metodePerhitungan: 'FIFO',
    catatan: '',
  });

  const [newItem, setNewItem] = useState({
    bahanBakuId: '',
    namaBarang: '',
    kuantitas: 0,
    satuan: '',
    hargaSatuan: 0,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (date: Date) => {
    // MODIFIED: Tambahkan validasi untuk objek Date
    if (date instanceof Date && !isNaN(date.getTime())) {
      return new Intl.DateTimeFormat('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(date);
    }
    return 'Tanggal tidak valid'; // Fallback for invalid dates
  };

  const handleAddItem = () => {
    if (!newItem.namaBarang || !newItem.kuantitas || !newItem.hargaSatuan) {
      toast.error('Nama barang, kuantitas, dan harga satuan wajib diisi.');
      return;
    }

    const item: PurchaseItem = {
      id: Date.now().toString(), // Unique ID for list item
      bahanBakuId: newItem.bahanBakuId,
      namaBarang: newItem.namaBarang,
      kuantitas: newItem.kuantitas,
      satuan: newItem.satuan,
      hargaSatuan: newItem.hargaSatuan,
      totalHarga: newItem.kuantitas * newItem.hargaSatuan,
    };

    setNewPurchase(prev => ({
      ...prev,
      items: [...prev.items, item],
    }));

    setNewItem({ // Reset for next item
      bahanBakuId: '',
      namaBarang: '',
      kuantitas: 0,
      satuan: '',
      hargaSatuan: 0,
    });
    toast.success('Item berhasil ditambahkan.');
  };

  const handleRemoveItem = (itemId: string) => {
    if (newPurchase.items.length > 1) { // Ensure at least one item remains
      setNewPurchase(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== itemId),
      }));
      toast.success('Item berhasil dihapus.');
    } else {
      toast.error('Pembelian harus memiliki setidaknya satu item.');
    }
  };

  const handleSavePurchase = async () => {
    if (!newPurchase.supplierId || newPurchase.items.length === 0) {
      toast.error('Supplier dan minimal satu item wajib diisi.');
      return;
    }

    // Validate items more thoroughly before saving
    if (newPurchase.items.some(item => !item.namaBarang.trim() || item.kuantitas <= 0 || item.hargaSatuan < 0)) {
        toast.error('Semua item harus memiliki nama, kuantitas > 0, dan harga satuan >= 0.');
        return;
    }

    const totalAmount = newPurchase.items.reduce((sum, item) => sum + item.totalHarga, 0);

    // MODIFIED: Validate and parse date string to Date object
    let parsedTanggal: Date;
    try {
      const dateObj = new Date(newPurchase.tanggal);
      if (isNaN(dateObj.getTime())) {
        throw new Error('Invalid date');
      }
      parsedTanggal = dateObj;
    } catch (error) {
      toast.error('Tanggal pembelian tidak valid.');
      return;
    }

    const purchaseData = {
      ...newPurchase,
      tanggal: parsedTanggal, // Use the validated Date object
      totalAmount, // Ensure totalAmount is added to the data
    };

    let success = false;
    if (editingPurchase) {
      success = await updatePurchase(editingPurchase.id, purchaseData);
    } else {
      success = await addPurchase(purchaseData);
    }

    if (success) {
      setIsDialogOpen(false);
      setEditingPurchase(null);
      setNewPurchase({ // Reset form after save
        supplierId: '',
        supplierName: '',
        tanggal: new Date().toISOString().split('T')[0], // Reset to current date string
        items: [],
        status: 'pending',
        metodePerhitungan: 'FIFO',
        catatan: '',
      });
      toast.success('Pembelian berhasil disimpan.');
    }
  };

  const handleEdit = (purchase: PurchaseTransaction) => {
    setEditingPurchase(purchase);
    setNewPurchase({
      supplierId: purchase.supplierId,
      supplierName: purchase.supplierName,
      // MODIFIED: Validasi purchase.tanggal sebelum mengonversi ke string
      tanggal: purchase.tanggal instanceof Date && !isNaN(purchase.tanggal.getTime())
                ? purchase.tanggal.toISOString().split('T')[0] // Pastikan hanya Date yang valid yang dipanggil .toISOString()
                : '', // Jika tidak valid, set ke string kosong
      items: purchase.items, // Items should be directly assignable
      status: purchase.status,
      metodePerhitungan: purchase.metodePerhitungan || 'FIFO',
      catatan: purchase.catatan || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus pembelian ini?')) {
      const success = await deletePurchase(id);
      if (success) {
        toast.success('Pembelian berhasil dihapus.');
      } else {
        toast.error('Gagal menghapus pembelian.');
      }
    }
  };

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = purchase.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || purchase.status === statusFilter;
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

  if (loading || suppliersLoading) {
    return (
      <div className="w-full max-w-none min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="w-full max-w-none mx-auto p-2 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center mb-3 sm:mb-0">
              <div className="bg-gradient-to-r from-green-600 to-blue-600 p-2 sm:p-3 rounded-full mr-3 sm:mr-4">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Manajemen Pembelian Bahan Baku
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600">
                  Kelola transaksi pembelian bahan baku
                </p>
              </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-xs sm:text-sm">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  Tambah Pembelian
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPurchase ? 'Edit Pembelian' : 'Tambah Pembelian Baru'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Purchase Header */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="supplier">Supplier *</Label>
                      <Select
                        value={newPurchase.supplierId}
                        onValueChange={(value) => {
                          const supplier = suppliers.find(s => s.id === value);
                          setNewPurchase({
                            ...newPurchase,
                            supplierId: value,
                            supplierName: supplier?.nama || '',
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map(supplier => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.nama}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="tanggal">Tanggal *</Label>
                      <Input
                        id="tanggal"
                        type="date"
                        value={newPurchase.tanggal}
                        onChange={(e) => setNewPurchase({ ...newPurchase, tanggal: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={newPurchase.status}
                        onValueChange={(value: 'pending' | 'completed' | 'cancelled') =>
                          setNewPurchase({ ...newPurchase, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="completed">Selesai</SelectItem>
                          <SelectItem value="cancelled">Dibatalkan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Add Item Form */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Tambah Item</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                        <div>
                          <Label>Bahan Baku</Label>
                          <Select
                            value={newItem.bahanBakuId}
                            onValueChange={(value) => {
                              const bahan = bahanBaku.find(b => b.id === value);
                              setNewItem({
                                ...newItem,
                                bahanBakuId: value,
                                namaBarang: bahan?.nama || '',
                                satuan: bahan?.satuan || '',
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih bahan" />
                            </SelectTrigger>
                            <SelectContent>
                              {bahanBaku.map(bahan => (
                                <SelectItem key={bahan.id} value={bahan.id}>
                                  {bahan.nama}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Kuantitas</Label>
                          <Input
                            type="number"
                            value={newItem.kuantitas || ''}
                            onChange={(e) => setNewItem({ ...newItem, kuantitas: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label>Satuan</Label>
                          <Input
                            value={newItem.satuan}
                            readOnly
                            placeholder="Satuan"
                          />
                        </div>
                        <div>
                          <Label>Harga/Satuan</Label>
                          <Input
                            type="number"
                            value={newItem.hargaSatuan || ''}
                            onChange={(e) => setNewItem({ ...newItem, hargaSatuan: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button onClick={handleAddItem} className="w-full">
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Items List */}
                  {newPurchase.items.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Daftar Item</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="min-w-[80px]">Nama Barang</TableHead>
                                <TableHead>Kuantitas</TableHead>
                                <TableHead>Harga Satuan</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                <TableHead>Aksi</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {newPurchase.items.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell className="font-medium">{item.namaBarang}</TableCell>
                                  <TableCell>{item.kuantitas} {item.satuan}</TableCell>
                                  <TableCell>{formatCurrency(item.hargaSatuan)}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(item.totalHarga)}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveItem(item.id)}
                                      className="hover:bg-red-50 hover:text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <div className="mt-4 text-right">
                          <div className="text-lg font-semibold">
                            Total: {formatCurrency(newPurchase.items.reduce((sum, item) => sum + item.totalHarga, 0))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button onClick={handleSavePurchase}>
                      {editingPurchase ? 'Perbarui' : 'Simpan'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and Filter */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm w-full">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Selesai</SelectItem>
                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purchase List */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm w-full">
          <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-t-lg p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-lg lg:text-xl">Daftar Pembelian</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[80px] text-xs sm:text-sm">Tanggal</TableHead>
                    <TableHead className="min-w-[120px] text-xs sm:text-sm">Supplier</TableHead>
                    <TableHead className="min-w-[80px] text-xs sm:text-sm">Items</TableHead>
                    <TableHead className="min-w-[100px] text-xs sm:text-sm">Total</TableHead>
                    <TableHead className="min-w-[80px] text-xs sm:text-sm">Status</TableHead>
                    <TableHead className="min-w-[100px] text-xs sm:text-sm">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="text-xs sm:text-sm">{formatDate(purchase.tanggal)}</TableCell>
                      <TableCell className="font-medium text-xs sm:text-sm">{purchase.supplierName}</TableCell>
                      <TableCell className="text-xs sm:text-sm">{purchase.items.length} item(s)</TableCell>
                      <TableCell className="text-xs sm:text-sm">{formatCurrency(purchase.totalAmount)}</TableCell>
                      <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1 sm:space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(purchase)}
                            className="hover:bg-blue-50 hover:text-blue-600 p-1 sm:p-2"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(purchase.id)}
                            className="hover:bg-red-50 hover:text-red-600 p-1 sm:p-2"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {filteredPurchases.length === 0 && (
          <Card className="text-center p-6 sm:p-8 lg:p-12 shadow-lg border-0 bg-white/60 backdrop-blur-sm w-full">
            <Package className="h-8 w-8 sm:h-12 sm:w-12 lg:h-16 lg:w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-700 mb-2">
              {searchTerm ? 'Pembelian tidak ditemukan' : 'Belum ada pembelian'}
            </h3>
            <p className="text-xs sm:text-sm lg:text-base text-gray-500 mb-4">
              {searchTerm ? 'Coba kata kunci lain' : 'Mulai dengan menambahkan pembelian pertama'}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-xs sm:text-sm"
              >
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Tambah Pembelian
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default PurchaseManagement;