import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, Package, Edit, Trash2, AlertTriangle, Search, ChevronLeft, ChevronRight,
  CheckSquare, X, Loader2, Eye, MoreHorizontal
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BahanBaku } from '@/types/bahanBaku';
import BahanBakuEditDialog from '@/components/BahanBakuEditDialog';
import { useBahanBaku } from '@/contexts/BahanBakuContext';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/utils/currencyUtils';
import { formatDateForDisplay } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';

const WarehousePage = () => {
  // Get context values with proper fallbacks
  const contextValue = useBahanBaku();
  if (!contextValue) {
    return (
      <div className="container mx-auto p-4 sm:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Context Error</h2>
            <p className="text-gray-600">Bahan Baku Context tidak tersedia. Pastikan komponen ini dibungkus dengan BahanBakuProvider.</p>
          </div>
        </div>
      </div>
    );
  }

  const {
    bahanBaku = [],
    addBahanBaku = () => Promise.resolve(false),
    updateBahanBaku = () => Promise.resolve(false),
    deleteBahanBaku = () => Promise.resolve(false),
    isLoading: appDataLoading = false,
    selectedItems = [],
    isSelectionMode = false,
    isBulkDeleting = false,
    toggleSelection = () => {},
    selectAll = () => {},
    clearSelection = () => {},
    toggleSelectionMode = () => {},
    isSelected = () => false,
    getSelectedItems = () => [],
    bulkDeleteBahanBaku = () => Promise.resolve(false),
  } = contextValue;

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<BahanBaku | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const [newItem, setNewItem] = useState<Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>({
    nama: '',
    kategori: '',
    stok: 0,
    satuan: '',
    hargaSatuan: 0,
    minimum: 0,
    supplier: '',
    tanggalKadaluwarsa: null,
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

  // Memoized filtered items
  const filteredItems = useMemo(() => {
    return Array.isArray(bahanBaku) 
      ? bahanBaku.filter(item =>
          item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.kategori && item.kategori.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.supplier && item.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      : [];
  }, [bahanBaku, searchTerm]);

  const lowStockItems = useMemo(() => {
    return Array.isArray(bahanBaku) 
      ? bahanBaku.filter(item => item.stok <= item.minimum)
      : [];
  }, [bahanBaku]);

  // Calculate pagination variables
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const currentItems = useMemo(() => 
    filteredItems.slice(Math.max(0, indexOfFirstItem), indexOfLastItem), 
    [filteredItems, indexOfFirstItem, indexOfLastItem]
  );

  // Reset currentPage when filteredItems length or itemsPerPage changes
  useEffect(() => {
    const maxPage = Math.ceil(filteredItems.length / itemsPerPage);
    if (filteredItems.length === 0 || currentPage > maxPage) {
      setCurrentPage(1);
    }
  }, [filteredItems.length, itemsPerPage]);

  // Calculate hargaSatuan with validation
  useEffect(() => {
    const purchaseQuantity = newItem.jumlahBeliKemasan;
    const purchaseUnit = newItem.satuanKemasan.toLowerCase();
    const purchaseTotalPrice = newItem.hargaTotalBeliKemasan;
    const baseUnit = newItem.satuan.toLowerCase();

    const isPurchaseDetailsActive = purchaseQuantity > 0 && purchaseTotalPrice > 0 && purchaseUnit && baseUnit;

    if (isPurchaseDetailsActive) {
      const conversionRates = unitConversionMap[baseUnit];
      if (conversionRates && conversionRates[purchaseUnit]) {
        const factor = conversionRates[purchaseUnit];
        const calculatedHarga = purchaseTotalPrice / (purchaseQuantity * factor);
        setNewItem(prev => ({ ...prev, hargaSatuan: parseFloat(calculatedHarga.toFixed(2)) || 0 }));
      } else if (purchaseUnit === baseUnit) {
        const calculatedHarga = purchaseTotalPrice / purchaseQuantity;
        setNewItem(prev => ({ ...prev, hargaSatuan: parseFloat(calculatedHarga.toFixed(2)) || 0 }));
      } else {
        setNewItem(prev => ({ ...prev, hargaSatuan: 0 }));
        toast.warning('Unit konversi tidak sesuai. Harga Satuan diatur ke 0.');
      }
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
    if (newItem.jumlahBeliKemasan > 0 && newItem.hargaTotalBeliKemasan <= 0) {
      toast.error('Harga Total Beli Kemasan harus lebih dari 0 jika Jumlah Beli Kemasan diisi.');
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
        tanggalKadaluwarsa: null,
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
      const updatedItemData = { ...updates, tanggalKadaluwarsa: updates.tanggalKadaluwarsa ? new Date(updates.tanggalKadaluwarsa) : null };
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

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      toast.warning('Pilih item yang ingin dihapus terlebih dahulu');
      return;
    }

    const success = await bulkDeleteBahanBaku(selectedItems);
    if (success) {
      setShowBulkDeleteDialog(false);
    }
  };

  const allCurrentSelected = useMemo(() => 
    currentItems.length > 0 && currentItems.every(item => isSelected(item.id)),
    [currentItems, isSelected]
  );

  const someCurrentSelected = useMemo(() => 
    currentItems.some(item => isSelected(item.id)) && !allCurrentSelected,
    [currentItems, isSelected, allCurrentSelected]
  );

  const handleSelectAllCurrent = () => {
    if (allCurrentSelected) {
      currentItems.forEach(item => toggleSelection(item.id));
    } else {
      currentItems.forEach(item => !isSelected(item.id) && toggleSelection(item.id));
    }
  };

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const getInputValue = <T extends string | number | null | undefined>(value: T): string | number => 
    value === null || value === undefined ? '' : value;

  const getDateInputValue = (date: Date | null): string => 
    date instanceof Date && !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';

  return (
    <div className="container mx-auto p-4 sm:p-8" aria-live="polite">
      {appDataLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3" role="alert" aria-label="Loading data">
            <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
            <span className="text-gray-600 font-medium">Memuat data gudang...</span>
          </div>
        </div>
      ) : (
        <>
          <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-6 mb-8 shadow-xl">
            <div className="flex items-center gap-4 mb-4 lg:mb-0">
              <div className="flex-shrink-0 bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
                <Package className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Manajemen Gudang Bahan Baku</h1>
                <p className="text-sm opacity-90 mt-1">Kelola semua inventori bahan baku Anda dengan mudah.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Button
                onClick={() => setShowAddForm(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-orange-600 font-semibold rounded-lg shadow-md hover:bg-gray-100 transition-all duration-200 hover:shadow-lg"
                aria-label="Tambah Bahan Baku"
              >
                <Plus className="h-5 w-5" />
                Tambah Bahan Baku
              </Button>
            </div>
          </header>

          {lowStockItems.length > 0 && (
            <div className="mb-6">
              <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200 shadow-lg rounded-xl overflow-hidden">
                <CardHeader className="border-b border-red-200 bg-white/50">
                  <CardTitle className="flex items-center text-red-700">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Peringatan Stok Rendah ({lowStockItems.length} item)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {lowStockItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-red-100">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-800">{item.nama}</span>
                          <span className="text-xs text-gray-500">{item.kategori}</span>
                        </div>
                        <Badge className="bg-red-100 text-red-700 border-red-200 font-semibold">
                          {item.stok} {item.satuan}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {(isSelectionMode || selectedItems.length > 0) && (
            <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-700">Mode Pilih Multiple</span>
                    </div>
                    {selectedItems.length > 0 && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1 font-semibold">
                        {selectedItems.length} item dipilih
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearSelection}
                      className="border-gray-300 hover:bg-gray-50"
                      aria-label="Batalkan Pilihan"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Batalkan
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAll}
                      className="border-blue-300 text-blue-600 hover:bg-blue-50"
                      aria-label="Pilih Semua"
                    >
                      Pilih Semua ({bahanBaku.length})
                    </Button>

                    {selectedItems.length > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowBulkDeleteDialog(true)}
                        disabled={isBulkDeleting}
                        className="bg-red-600 hover:bg-red-700"
                        aria-label="Hapus Item Terpilih"
                      >
                        {isBulkDeleting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Hapus {selectedItems.length} Item
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="bg-white rounded-xl shadow-xl border border-gray-200/80 overflow-hidden">
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
                    onClick={toggleSelectionMode}
                    className={isSelectionMode ? "bg-blue-600 hover:bg-blue-700" : "border-blue-300 text-blue-600 hover:bg-blue-50"}
                    aria-label={isSelectionMode ? "Keluar Mode Pilih" : "Masuk Mode Pilih"}
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
                    placeholder="Cari bahan baku, kategori, atau supplier..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="pl-10 border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 w-full lg:w-80"
                    aria-label="Cari Bahan Baku"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table className="min-w-full text-sm text-left text-gray-700">
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b border-gray-200">
                    <TableHead className="w-12 p-4">
                      {isSelectionMode && (
                        <Checkbox
                          checked={allCurrentSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someCurrentSelected;
                          }}
                          onCheckedChange={handleSelectAllCurrent}
                          className="border-gray-400"
                          aria-label="Pilih Semua Item Saat Ini"
                        />
                      )}
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">Nama Bahan</TableHead>
                    <TableHead className="font-semibold text-gray-700">Kategori</TableHead>
                    <TableHead className="font-semibold text-gray-700">Stok</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700">Harga Satuan</TableHead>
                    <TableHead className="font-semibold text-gray-700">Minimum</TableHead>
                    <TableHead className="font-semibold text-gray-700">Supplier</TableHead>
                    <TableHead className="font-semibold text-gray-700">Kadaluwarsa</TableHead>
                    <TableHead className="text-center font-semibold text-gray-700 w-20">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appDataLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3" role="alert" aria-label="Loading data">
                          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                          <span className="text-gray-500 font-medium">Memuat bahan baku...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                          <Package className="h-16 w-16 text-gray-300" />
                          <div className="text-center">
                            <p className="text-lg font-medium text-gray-600 mb-2">
                              {searchTerm ? 'Tidak ada bahan baku yang cocok dengan pencarian' : 'Belum ada bahan baku di gudang'}
                            </p>
                            <p className="text-gray-500 text-sm mb-4">
                              {searchTerm ? 'Coba ubah kata kunci pencarian Anda' : 'Mulai dengan menambahkan bahan baku pertama'}
                            </p>
                          </div>
                          {!searchTerm && (
                            <Button
                              onClick={() => setShowAddForm(true)}
                              className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow-md transition-all duration-200"
                              aria-label="Tambah Bahan Pertama"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Tambah Bahan Pertama
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentItems.map((item, index) => (
                      <TableRow 
                        key={item.id} 
                        className={cn(
                          "hover:bg-orange-50/50 transition-colors border-b border-gray-100",
                          isSelected(item.id) && "bg-blue-50 border-l-4 border-l-blue-500",
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                        )}
                      >
                        <TableCell className="p-4">
                          {isSelectionMode && (
                            <Checkbox
                              checked={isSelected(item.id)}
                              onCheckedChange={() => toggleSelection(item.id)}
                              className="border-gray-400"
                              aria-label={`Pilih ${item.nama}`}
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-gray-900 p-4">
                          <div className="flex flex-col">
                            <span>{item.nama}</span>
                            <span className="text-xs text-gray-500">{item.satuan}</span>
                          </div>
                        </TableCell>
                        <TableCell className="p-4">
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 font-medium">
                            {item.kategori}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-4">
                          <div className="flex flex-col">
                            <span className={cn(
                              "font-bold text-lg",
                              item.stok <= item.minimum 
                                ? 'text-red-600' 
                                : item.stok <= item.minimum * 1.5 
                                  ? 'text-yellow-600' 
                                  : 'text-green-600'
                            )}>
                              {item.stok}
                            </span>
                            {item.stok <= item.minimum && (
                              <div className="flex items-center text-xs text-red-500 mt-1">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Stok Rendah
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right p-4">
                          <div className="flex flex-col items-end">
                            <span className="font-semibold text-green-600 text-base">
                              {formatCurrency(item.hargaSatuan)}
                            </span>
                            <span className="text-xs text-gray-500">per {item.satuan}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600 p-4">
                          <span className="font-medium">{item.minimum}</span>
                          <span className="text-xs text-gray-500 ml-1">{item.satuan}</span>
                        </TableCell>
                        <TableCell className="text-gray-600 p-4">{item.supplier || '-'}</TableCell>
                        <TableCell className="text-gray-600 p-4">
                          {item.tanggalKadaluwarsa ? formatDateForDisplay(item.tanggalKadaluwarsa) : '-'}
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
                                <DropdownMenuItem onClick={() => handleEdit(item)} className="cursor-pointer">
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(item.id, item.nama)} 
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
                  )}
                </TableBody>
              </Table>
            </div>

            {filteredItems.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:px-6 border-t border-gray-200 bg-gray-50/50">
                <div className="text-sm text-gray-600 mb-4 sm:mb-0">
                  Showing <span className="font-semibold">{Math.max(1, indexOfFirstItem + 1)}</span> to{' '}
                  <span className="font-semibold">{Math.min(indexOfLastItem, filteredItems.length)}</span> of{' '}
                  <span className="font-semibold">{filteredItems.length}</span> entries
                  {selectedItems.length > 0 && (
                    <span className="ml-2 text-blue-600 font-medium">
                      ({selectedItems.length} selected)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 hover:bg-gray-100"
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous Page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    const pageNumber = page;
                    return (
                      <Button
                        key={pageNumber}
                        onClick={() => paginate(pageNumber)}
                        className={cn(
                          "h-9 w-9",
                          currentPage === pageNumber
                            ? "bg-orange-500 text-white shadow-md hover:bg-orange-600"
                            : "hover:bg-gray-100"
                        )}
                        variant={currentPage === pageNumber ? "default" : "ghost"}
                        aria-label={`Page ${pageNumber}`}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 hover:bg-gray-100"
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Next Page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
            <AlertDialogContent className="max-w-md">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Konfirmasi Hapus Multiple Item
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Anda akan menghapus <strong>{selectedItems.length} item</strong> bahan baku:
                  
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                    <ul className="space-y-1">
                      {(getSelectedItems() || []).slice(0, 5).map((item) => (
                        <li key={item.id} className="flex items-center gap-2 text-sm">
                          <Trash2 className="h-3 w-3 text-red-500 flex-shrink-0" />
                          <span className="font-medium">{item.nama}</span>
                          <span className="text-gray-500">({item.kategori})</span>
                        </li>
                      ))}
                      {selectedItems.length > 5 && (
                        <li className="text-sm text-gray-500 italic">
                          ... dan {selectedItems.length - 5} item lainnya
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
                <AlertDialogCancel disabled={isBulkDeleting}>
                  Batal
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isBulkDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menghapus...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Hapus {selectedItems.length} Item
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-800">Tambah Bahan Baku</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                  <div className="md:col-span-2">
                    <Label htmlFor="nama" className="font-medium">Nama Bahan *</Label>
                    <Input
                      id="nama"
                      value={newItem.nama}
                      onChange={(e) => setNewItem({ ...newItem, nama: e.target.value })}
                      placeholder="Masukkan nama bahan"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="kategori" className="font-medium">Kategori *</Label>
                    <Input
                      id="kategori"
                      value={newItem.kategori}
                      onChange={(e) => setNewItem({ ...newItem, kategori: e.target.value })}
                      placeholder="Masukkan kategori"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stok" className="font-medium">Stok *</Label>
                    <Input
                      id="stok"
                      type="number"
                      value={getInputValue(newItem.stok)}
                      onChange={(e) => setNewItem({ ...newItem, stok: parseFloat(e.target.value) || 0 })}
                      placeholder="Masukkan stok"
                      min="0"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="satuan" className="font-medium">Satuan *</Label>
                    <Input
                      id="satuan"
                      value={getInputValue(newItem.satuan)}
                      onChange={(e) => setNewItem({ ...newItem, satuan: e.target.value })}
                      placeholder="Masukkan satuan (e.g., kg, gram)"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hargaSatuan" className="font-medium">Harga Satuan *</Label>
                    <Input
                      id="hargaSatuan"
                      type="number"
                      value={getInputValue(newItem.hargaSatuan)}
                      onChange={(e) => setNewItem({ ...newItem, hargaSatuan: parseFloat(e.target.value) || 0 })}
                      placeholder="Masukkan harga satuan"
                      min="0"
                      required
                      readOnly
                      className="bg-gray-100 cursor-not-allowed mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Harga per {getInputValue(newItem.satuan) || 'unit'} akan dihitung otomatis jika 'Detail Pembelian' diisi.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="minimum" className="font-medium">Stok Minimum</Label>
                    <Input
                      id="minimum"
                      type="number"
                      value={getInputValue(newItem.minimum)}
                      onChange={(e) => setNewItem({ ...newItem, minimum: parseFloat(e.target.value) || 0 })}
                      placeholder="Masukkan minimum stok"
                      min="0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="supplier" className="font-medium">Supplier</Label>
                    <Input
                      id="supplier"
                      value={getInputValue(newItem.supplier)}
                      onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                      placeholder="Masukkan nama supplier"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tanggalKadaluwarsa" className="font-medium">Tanggal Kadaluwarsa</Label>
                    <Input
                      id="tanggalKadaluwarsa"
                      type="date"
                      value={getDateInputValue(newItem.tanggalKadaluwarsa)}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : null;
                        setNewItem(prev => ({
                          ...prev,
                          tanggalKadaluwarsa: date && !isNaN(date.getTime()) ? date : null,
                        }));
                      }}
                      placeholder="Pilih tanggal kadaluwarsa"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <Card className="border-orange-200 bg-orange-50/50 shadow-sm rounded-lg">
                    <CardHeader className="py-3">
                      <CardTitle className="text-base text-gray-800">Detail Pembelian</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="jumlahBeliKemasan" className="text-sm font-medium">Jumlah Beli Kemasan</Label>
                          <Input
                            id="jumlahBeliKemasan"
                            type="number"
                            value={getInputValue(newItem.jumlahBeliKemasan)}
                            onChange={(e) => setNewItem({ ...newItem, jumlahBeliKemasan: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                            min="0"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="satuanKemasan" className="text-sm font-medium">Satuan Kemasan</Label>
                          <Select
                            value={getInputValue(newItem.satuanKemasan) as string}
                            onValueChange={(value) => setNewItem({ ...newItem, satuanKemasan: value })}
                          >
                            <SelectTrigger className="rounded-md mt-1">
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
                          <Label htmlFor="hargaTotalBeliKemasan" className="text-sm font-medium">Harga Total Beli Kemasan</Label>
                          <Input
                            id="hargaTotalBeliKemasan"
                            type="number"
                            value={getInputValue(newItem.hargaTotalBeliKemasan)}
                            onChange={(e) => setNewItem({ ...newItem, hargaTotalBeliKemasan: parseFloat(e.target.value) || 0 })}
                            placeholder="Masukkan harga total beli kemasan"
                            min="0"
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        Harga Satuan akan dihitung otomatis jika detail pembelian diisi.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <DialogFooter className="mt-6">
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

          {editingItem && (
            <BahanBakuEditDialog
              item={editingItem}
              onSave={handleEditSave}
              onClose={() => setEditingItem(null)}
              isOpen={!!editingItem}
            />
          )}
        </>
      )}
    </div>
  );
};

export default WarehousePage;