import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Package, Edit, Trash2, AlertTriangle, Search } from 'lucide-react'; // Menggunakan ikon Lucide React
import { BahanBaku } from '@/types/recipe';
import BahanBakuEditDialog from '@/components/BahanBakuEditDialog';
import MenuExportButton from '@/components/MenuExportButton';
import { useBahanBaku } from '@/contexts/BahanBakuContext';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const WarehousePage = () => {
  const { bahanBaku, addBahanBaku, updateBahanBaku, deleteBahanBaku, isLoading: appDataLoading } = useBahanBaku();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<BahanBaku | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  // Tambahkan state untuk paginasi (jika ingin fungsional)
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
    // Tambahkan konversi lain sesuai kebutuhan
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
          } else if (purchaseUnit.toLowerCase() === baseUnit) { // Jika satuan pembelian sama dengan satuan dasar
            calculatedHarga = purchaseTotalPrice / purchaseQuantity;
          }
        } else if (purchaseUnit.toLowerCase() === baseUnit) { // Jika tidak ada conversionRates tapi satuan sama
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
    }
  };

  const handleEdit = (itemToEdit: BahanBaku) => {
    const fullItem = bahanBaku.find(b => b.id === itemToEdit.id);

    if (fullItem) {
      setEditingItem(fullItem);
    } else {
      console.error("Error: Item tidak ditemukan di daftar bahanBaku untuk diedit.", itemToEdit);
      toast.error("Gagal mengedit: Item tidak ditemukan.");
    }
  };

  const handleEditSave = async (updates: Partial<BahanBaku>) => {
    if (editingItem && editingItem.id) {
      const updatedItemData = { ...updates };
      await updateBahanBaku(editingItem.id, updatedItemData);
      setEditingItem(null);
      toast.success("Bahan baku berhasil diperbarui!");
    } else {
      toast.error("Gagal memperbarui bahan baku.");
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

  // Ini adalah formatCurrency lokal di komponen, bisa dihapus jika sudah ada di utils/currencyUtils.ts
  // const formatCurrency = (value: number) => {
  //   return new Intl.NumberFormat('id-ID', {
  //     style: 'currency',
  //     currency: 'IDR',
  //     minimumFractionDigits: 0,
  //     maximumFractionDigits: 0
  //   }).format(value);
  // };

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

  // Logika Paginasi (jika diaktifkan secara fungsional)
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="container mx-auto p-4 sm:p-8"> {/* Main container */}

        {/* Header Utama Halaman */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div className="flex items-center gap-4">
                <div className="flex-shrink-0 bg-orange-100 p-3 rounded-full">
                    <Package className="text-orange-600 h-8 w-8" /> {/* Ikon Bahan Baku */}
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Manajemen Gudang Bahan Baku</h1>
                    <p className="text-gray-500">Kelola inventori bahan baku Anda.</p>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-4 sm:mt-0">
              {/* MenuExportButton */}
              <MenuExportButton
                data={bahanBaku}
                filename="gudang"
                menuType="Gudang"
              />
              {/* Tombol Tambah Bahan */}
              <Button
                onClick={() => setShowAddForm(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg shadow-md hover:bg-orange-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Tambah Bahan
              </Button>
            </div>
        </header>

        {/* Peringatan Stok Rendah */}
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

        {/* Tabel Bahan Baku dalam Card Utama */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200/80 overflow-hidden">
            
            {/* Kontrol Tabel (Search, Entries) */}
            <div className="p-4 sm:p-6 border-b border-gray-200/80">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Label htmlFor="show-entries" className="whitespace-nowrap">Show</Label>
                        <Select value={String(itemsPerPage)} onValueChange={(value) => setItemsPerPage(Number(value))}>
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
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 border-gray-300 rounded-md shadow-sm focus:border-orange-500 focus:ring-orange-500 w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Konten Tabel (menggunakan Card per item) */}
            <div className="p-4 sm:p-6">
                {appDataLoading ? (
                  <div className="text-center py-8 text-gray-500">Memuat bahan baku...</div>
                ) : filteredItems.length === 0 ? (
                  <Card className="text-center p-8 bg-white/80 backdrop-blur-sm shadow-lg border-0 rounded-lg">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">
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
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {currentItems.map((item) => ( /* Menggunakan currentItems untuk paginasi */
                      <Card key={item.id} className="bg-white/80 backdrop-blur-sm shadow-lg border-0 rounded-lg hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-4">
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="text-xl font-bold text-gray-800">{item.nama}</h3>
                                <Badge className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border-purple-200">
                                  {item.kategori}
                                </Badge>
                                {item.stok <= item.minimum && (
                                  <Badge className="bg-red-100 text-red-700 border-red-200">
                                    Stok Rendah
                                  </Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2">
                                <div>
                                  <p className="text-sm text-gray-500">Stok</p>
                                  <p className="font-semibold text-gray-800">{item.stok} {item.satuan}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Harga Satuan</p>
                                  <p className="font-semibold text-green-600">{formatCurrency(item.hargaSatuan)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Minimum</p>
                                  <p className="font-semibold text-gray-800">{item.minimum} {item.satuan}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Supplier</p>
                                  <p className="font-semibold text-gray-800">{item.supplier || '-'}</p>
                                </div>
                                {item.tanggalKadaluwarsa && (
                                  (item.tanggalKadaluwarsa instanceof Date && !isNaN(item.tanggalKadaluwarsa.getTime()) && typeof item.tanggalKadaluwarsa.toLocaleDateString === 'function') &&
                                  <div>
                                    <p className="text-sm text-gray-500">Kadaluwarsa</p>
                                    <p className="font-semibold text-gray-800">
                                      {item.tanggalKadaluwarsa.toLocaleDateString('id-ID', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </p>
                              </div>
                            )}
                            {Boolean(item.jumlahBeliKemasan || item.satuanKemasan || item.hargaTotalBeliKemasan) && (
                              <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-3">
                                <p className="text-sm text-gray-500 font-semibold">Detail Pembelian</p>
                                <p className="text-xs text-gray-700">
                                  {item.jumlahBeliKemasan || '0'} {item.satuanKemasan || ''} @ {formatCurrency(item.hargaTotalBeliKemasan || 0)}
                                </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 rounded-md transition-colors duration-200"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id, item.nama)}
                        className="flex items-center gap-2 border-red-200 text-red-700 hover:bg-red-50 rounded-md transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                        Hapus
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {editingItem && (
          <BahanBakuEditDialog
            item={editingItem}
            onSave={handleEditSave}
            onClose={() => setEditingItem(null)}
            isOpen={!!editingItem}
          />
        )}
      </div>
    </div>
  );
};

export default WarehousePage;