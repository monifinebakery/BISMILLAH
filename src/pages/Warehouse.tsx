import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'; 
import { Plus, Package, Edit, Trash2, AlertTriangle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'; 
import { BahanBaku } from '@/types/bahanBaku';
import BahanBakuEditDialog from '@/components/BahanBakuEditDialog';
import { useBahanBaku } from '@/contexts/BahanBakuContext';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/utils/currencyUtils';
import { formatDateForDisplay } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';

const WarehousePage = () => {
  const { bahanBaku, addBahanBaku, updateBahanBaku, deleteBahanBaku, isLoading: appDataLoading } = useBahanBaku();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<BahanBaku | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [newItem, setNewItem] = useState<Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>({
    nama: '',
    kategori: '',
    stok: 0,
    satuan: '',
    hargaSatuan: 0,
    minimum: 0,
    supplier: '',
    tanggalKadaluwarsa: undefined,
    jumlahBeliKemasan: 0,
    satuanKemasan: '',
    hargaTotalBeliKemasan: 0,
  });

  const unitConversionMap: { [baseUnit: string]: { [purchaseUnit: string]: number } } = {
    'gram': { 'kg': 1000, 'gram': 1, 'pon': 453.592, 'ons': 28.3495 },
    'ml': { 'liter': 1000, 'ml': 1, 'galon': 3785.41 },
    'pcs': { 'pcs': 1, 'lusin': 12, 'gross': 144, 'box': 1, 'bungkus': 1 },
    'butir': { 'butir': 1, 'tray': 30, 'lusin': 12 },
    'kg': { 'gram': 0.001, 'kg': 1, 'pon': 0.453592 },
    'liter': { 'ml': 0.001, 'liter': 1 },
  };

  useEffect(() => {
    const purchaseQuantity = newItem.jumlahBeliKemasan;
    const purchaseUnit = newItem.satuanKemasan;
    const purchaseTotalPrice = newItem.hargaTotalBeliKemasan;
    const baseUnit = newItem.satuan.toLowerCase();

    let calculatedHarga = 0;

    const isPurchaseDetailsActive = purchaseQuantity > 0 || purchaseTotalPrice > 0 || purchaseUnit !== '';

    if (isPurchaseDetailsActive) {
      if (purchaseQuantity > 0 && purchaseTotalPrice > 0 && purchaseUnit && baseUnit) {
        const conversionRates = unitConversionMap[baseUnit];
        if (conversionRates) {
          const factor = conversionRates[purchaseUnit.toLowerCase()];
          if (factor !== undefined && factor > 0) {
            calculatedHarga = purchaseTotalPrice / (purchaseQuantity * factor);
          } else if (purchaseUnit.toLowerCase() === baseUnit) {
            calculatedHarga = purchaseTotalPrice / purchaseQuantity;
          }
        } else if (purchaseUnit.toLowerCase() === baseUnit) {
          calculatedHarga = purchaseTotalPrice / purchaseQuantity;
        }
      }
      setNewItem(prev => ({ ...prev, hargaSatuan: parseFloat(calculatedHarga.toFixed(2)) }));
    } else {
      setNewItem(prev => ({ ...prev, hargaSatuan: 0 }));
    }
  }, [newItem.jumlahBeliKemasan, newItem.satuanKemasan, newItem.hargaTotalBeliKemasan, newItem.satuan]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newItem.nama || !newItem.kategori || newItem.stok <= 0 || !newItem.satuan || newItem.hargaSatuan <= 0 || newItem.minimum < 0) {
      toast.error('Harap lengkapi semua field yang wajib diisi dan pastikan Stok serta Harga Satuan lebih dari 0.');
      return;
    }

    const success = await addBahanBaku(newItem);
    if (success) {
      setShowAddForm(false);
      setNewItem({
        nama: '',
        kategori: '',
        stok: 0,
        satuan: '',
        hargaSatuan: 0,
        minimum: 0,
        supplier: '',
        tanggalKadaluwarsa: undefined,
        jumlahBeliKemasan: 0,
        satuanKemasan: '',
        hargaTotalBeliKemasan: 0,
      });
      toast.success('Bahan baku berhasil ditambahkan!');
    }
  };

  const handleEdit = (itemToEdit: BahanBaku) => {
    const fullItem = bahanBaku.find(b => b.id === itemToEdit.id);
    if (fullItem) {
      setEditingItem(fullItem);
    } else {
      toast.error('Gagal mengedit: Item tidak ditemukan.');
    }
  };

  const handleEditSave = async (updates: Partial<BahanBaku>) => {
    if (editingItem && editingItem.id) {
      const updatedItemData = { ...updates };
      await updateBahanBaku(editingItem.id, updatedItemData);
      setEditingItem(null);
      toast.success('Bahan baku berhasil diperbarui!');
    } else {
      toast.error('Gagal memperbarui bahan baku.');
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus "${nama}"?`)) {
      await deleteBahanBaku(id);
      toast.success(`"${nama}" berhasil dihapus.`);
    }
  };

  const filteredItems = bahanBaku.filter(item =>
    item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.kategori && item.kategori.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const lowStockItems = bahanBaku.filter(item => item.stok <= item.minimum);

  const getInputValue = <T extends string | number | null | undefined>(value: T): string | number => {
    if (value === null || value === undefined) {
      return '';
    }
    return value;
  };

  const getDateInputValue = (date: Date | undefined): string => {
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    return '';
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="container mx-auto p-4 sm:p-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-center bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg p-6 mb-8 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 bg-white bg-opacity-20 p-3 rounded-full">
            <Package className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Manajemen Gudang Bahan Baku</h1>
            <p className="text-sm opacity-80">Kelola semua inventori bahan baku Anda.</p>
          </div>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="mt-4 sm:mt-0 flex items-center justify-center gap-2 px-6 py-2 bg-white text-orange-600 font-semibold rounded-lg shadow-md hover:bg-gray-100 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Tambah Bahan Baku
        </Button>
      </header>

      {/* Low Stock Warning */}
      {lowStockItems.length > 0 && (
        <div className="mb-6">
          <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200 shadow-lg rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-red-700">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Peringatan Stok Rendah ({lowStockItems.length} item)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {lowStockItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                    <span className="font-medium text-gray-800">{item.nama}</span>
                    <Badge className="bg-red-100 text-red-700 border-red-200">
                      {item.stok} {item.satuan}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200/80 overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 sm:p-6 border-b border-gray-200/80">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Label htmlFor="show-entries" className="whitespace-nowrap">Show</Label>
              <Select value={String(itemsPerPage)} onValueChange={(value) => { setItemsPerPage(Number(value)); setCurrentPage(1); }}>
                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
              <span>entries</span>
            </div>
            <div className="w-full sm:w-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari bahan baku, kategori, atau supplier..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-10 border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500 w-full"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <Table className="min-w-full text-sm text-left text-gray-700"> 
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-orange-600 shadow-sm focus:ring-orange-500"
                    aria-label="Select all items"
                  />
                </TableHead>
                <TableHead>Nama Bahan</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead className="text-right">Harga Satuan</TableHead>
                <TableHead>Minimum</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Kadaluwarsa</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appDataLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-gray-500">Memuat bahan baku...</TableCell></TableRow>
              ) : filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="mb-4">
                      {searchTerm ? 'Tidak ada bahan baku yang cocok dengan pencarian' : 'Belum ada bahan baku di gudang'}
                    </p>
                    {!searchTerm && (
                      <Button
                        onClick={() => setShowAddForm(true)}
                        className="bg-orange-500 hover:bg-orange-600 text-white rounded-md shadow-md transition-colors duration-200"
                      >
                        Tambah Bahan Pertama
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-orange-50/50">
                    <TableCell className="p-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-orange-600 shadow-sm focus:ring-orange-500"
                        aria-label={`Select ${item.nama}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{item.nama}</TableCell>
                    <TableCell className="text-gray-500">{item.kategori}</TableCell>
                    <TableCell>
                      {item.stok} {item.satuan}
                      {item.stok <= item.minimum && <Badge className="ml-2 bg-red-100 text-red-700">Rendah</Badge>}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">{formatCurrency(item.hargaSatuan)}</TableCell>
                    <TableCell className="text-gray-500">{item.minimum} {item.satuan}</TableCell>
                    <TableCell className="text-gray-500">{item.supplier || '-'}</TableCell>
                    <TableCell className="text-gray-500">{item.tanggalKadaluwarsa ? formatDateForDisplay(item.tanggalKadaluwarsa) : '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="icon" className="p-2 hover:bg-gray-200 rounded-full" onClick={() => handleEdit(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="p-2 hover:bg-gray-200 rounded-full" onClick={() => handleDelete(item.id, item.nama)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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
            Showing <span className="font-semibold">{indexOfFirstItem + 1}</span> to <span className="font-semibold">{Math.min(indexOfLastItem, filteredItems.length)}</span> of <span className="font-semibold">{filteredItems.length}</span> entries
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
                className={cn("h-9 w-9", {"bg-orange-500 text-white shadow-sm hover:bg-orange-600": currentPage === page, "hover:bg-gray-100": currentPage !== page})}
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

      {/* Add Item Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto"> 
          <DialogHeader>
            <DialogTitle>Tambah Bahan Baku</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
              {/* Nama Bahan */}
              <div className="md:col-span-2">
                <Label htmlFor="nama">Nama Bahan *</Label>
                <Input
                  id="nama"
                  value={newItem.nama}
                  onChange={(e) => setNewItem({ ...newItem, nama: e.target.value })}
                  placeholder="Masukkan nama bahan"
                  required
                />
              </div>
              {/* Kategori */}
              <div className="md:col-span-2">
                <Label htmlFor="kategori">Kategori *</Label>
                <Input
                  id="kategori"
                  value={newItem.kategori}
                  onChange={(e) => setNewItem({ ...newItem, kategori: e.target.value })}
                  placeholder="Masukkan kategori"
                  required
                />
              </div>
              {/* Stok */}
              <div>
                <Label htmlFor="stok">Stok *</Label>
                <Input
                  id="stok"
                  type="number"
                  value={getInputValue(newItem.stok)}
                  onChange={(e) => setNewItem({ ...newItem, stok: parseFloat(e.target.value) || 0 })}
                  placeholder="Masukkan stok"
                  min="0"
                  required
                />
              </div>
              {/* Satuan */}
              <div>
                <Label htmlFor="satuan">Satuan *</Label>
                <Input
                  id="satuan"
                  value={getInputValue(newItem.satuan)}
                  onChange={(e) => setNewItem({ ...newItem, satuan: e.target.value })}
                  placeholder="Masukkan satuan (e.g., kg, gram)"
                  required
                />
              </div>
              {/* Harga Satuan */}
              <div>
                <Label htmlFor="hargaSatuan">Harga Satuan *</Label>
                <Input
                  id="hargaSatuan"
                  type="number"
                  value={getInputValue(newItem.hargaSatuan)}
                  onChange={(e) => setNewItem({ ...newItem, hargaSatuan: parseFloat(e.target.value) || 0 })}
                  placeholder="Masukkan harga satuan"
                  min="0"
                  required
                  readOnly
                  className="bg-gray-100 cursor-not-allowed" 
                />
                <p className="text-xs text-gray-500 mt-1">
                  Harga per {getInputValue(newItem.satuan) || 'unit'} akan dihitung otomatis jika 'Detail Pembelian' diisi.
                </p>
              </div>
              {/* Minimum Stok */}
              <div>
                <Label htmlFor="minimum">Stok Minimum</Label>
                <Input
                  id="minimum"
                  type="number"
                  value={getInputValue(newItem.minimum)}
                  onChange={(e) => setNewItem({ ...newItem, minimum: parseFloat(e.target.value) || 0 })}
                  placeholder="Masukkan minimum stok"
                  min="0"
                />
              </div>
              {/* Supplier */}
              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={getInputValue(newItem.supplier)}
                  onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                  placeholder="Masukkan nama supplier"
                />
              </div>
              {/* Tanggal Kadaluwarsa */}
              <div>
                <Label htmlFor="tanggalKadaluwarsa">Tanggal Kadaluwarsa</Label>
                <Input
                  id="tanggalKadaluwarsa"
                  type="date"
                  value={getDateInputValue(newItem.tanggalKadaluwarsa)}
                  onChange={(e) => setNewItem({ ...newItem, tanggalKadaluwarsa: e.target.value ? new Date(e.target.value) : undefined })}
                  placeholder="Pilih tanggal kadaluwarsa"
                />
              </div>
            </div>

            {/* Detail Pembelian Card */}
            <div className="mt-4">
              <Card className="border-orange-200 bg-orange-50 shadow-sm rounded-lg">
                <CardHeader className="py-3"> 
                  <CardTitle className="text-base text-gray-800">Detail Pembelian</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="jumlahBeliKemasan">Jumlah Beli Kemasan</Label>
                      <Input
                        id="jumlahBeliKemasan"
                        type="number"
                        value={getInputValue(newItem.jumlahBeliKemasan)}
                        onChange={(e) => setNewItem({ ...newItem, jumlahBeliKemasan: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="satuanKemasan">Satuan Kemasan</Label>
                      <Select
                        value={getInputValue(newItem.satuanKemasan) as string}
                        onValueChange={(value) => setNewItem({ ...newItem, satuanKemasan: value })}
                      >
                        <SelectTrigger className="rounded-md">
                          <SelectValue placeholder="Pilih satuan" />
                        </SelectTrigger>
                        <SelectContent>
                          {['kg', 'liter', 'pcs', 'bungkus', 'karung', 'box', 'tray', 'lusin', 'butir', 'gram', 'ml', 'pon', 'ons', 'galon'].map(unit => (
                            <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="hargaTotalBeliKemasan">Harga Total Beli Kemasan</Label>
                      <Input
                        id="hargaTotalBeliKemasan"
                        type="number"
                        value={getInputValue(newItem.hargaTotalBeliKemasan)}
                        onChange={(e) => setNewItem({ ...newItem, hargaTotalBeliKemasan: parseFloat(e.target.value) || 0 })}
                        placeholder="Masukkan harga total beli kemasan"
                        min="0"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Harga Satuan akan dihitung otomatis jika detail pembelian diisi.
                  </p>
                </CardContent>
              </Card>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editingItem && (
        <BahanBakuEditDialog
          item={editingItem}
          onSave={handleEditSave}
          onClose={() => setEditingItem(null)}
          isOpen={!!editingItem}
        />
      )}
    </div>
  );
};

export default WarehousePage;