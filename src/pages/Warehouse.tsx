// src/pages/Warehouse.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Package, Edit, Trash2, AlertTriangle, Search } from 'lucide-react';
import { BahanBaku } from '@/types/recipe'; // Pastikan BahanBaku dari types/recipe
import { useAppData } from '@/contexts/AppDataContext';

import BahanBakuEditDialog from '@/components/BahanBakuEditDialog';
import MenuExportButton from '@/components/MenuExportButton';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const WarehousePage = () => {
  const { bahanBaku, addBahanBaku, updateBahanBaku, deleteBahanBaku, isLoading: appDataLoading } = useAppData();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<BahanBaku | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // MODIFIED: Inisialisasi newItem dengan null untuk properti pembelian detail
  const [newItem, setNewItem] = useState<Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>({
    nama: '',
    kategori: '',
    stok: 0,
    satuan: '',
    hargaSatuan: 0,
    minimum: 0,
    supplier: '',
    tanggalKadaluwarsa: undefined,
    jumlahBeliKemasan: null,   // MODIFIED: Default ke null
    satuanKemasan: null,       // MODIFIED: Default ke null
    hargaTotalBeliKemasan: null, // MODIFIED: Default ke null
  });

  // purchaseDetails ini untuk form ADD, jadi default 0/'' itu wajar
  const [purchaseDetails, setPurchaseDetails] = useState({
    purchaseQuantity: 0,
    purchaseUnit: '',
    purchaseTotalPrice: 0,
  });

  const unitConversionMap: { [baseUnit: string]: { [purchaseUnit: string]: number } } = {
    'gram': { 'kg': 1000, 'gram': 1, 'pon': 453.592 },
    'ml': { 'liter': 1000, 'ml': 1, 'galon': 3785.41 },
    'pcs': { 'pcs': 1, 'lusin': 12, 'gross': 144, 'box': 1, 'bungkus': 1 },
    'butir': { 'butir': 1, 'tray': 30, 'lusin': 12 },
  };

  useEffect(() => {
    const { purchaseQuantity, purchaseUnit, purchaseTotalPrice } = purchaseDetails;
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
        }
      }
      setNewItem(prev => ({ ...prev, hargaSatuan: parseFloat(calculatedHarga.toFixed(2)) }));
    } else {
      setNewItem(prev => ({ ...prev, hargaSatuan: 0 }));
    }
  }, [purchaseDetails, newItem.satuan]);


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
        nama: '', kategori: '', stok: 0, satuan: '', hargaSatuan: 0, minimum: 0, supplier: '', tanggalKadaluwarsa: undefined,
        jumlahBeliKemasan: null, satuanKemasan: null, hargaTotalBeliKemasan: null,
      });
      setPurchaseDetails({ purchaseQuantity: 0, purchaseUnit: '', purchaseTotalPrice: 0 }); // Reset purchaseDetails for Add form
    }
  };

  const handleEdit = (item: BahanBaku) => {
    setEditingItem({
        ...item,
        tanggalKadaluwarsa: item.tanggalKadaluwarsa, // Langsung assign Date | undefined dari item
    });
    setPurchaseDetails({
        purchaseQuantity: item.jumlahBeliKemasan || 0,
        purchaseUnit: item.satuanKemasan || '',
        purchaseTotalPrice: item.hargaTotalBeliKemasan || 0,
    });
  };

  const handleEditSave = async (updates: Partial<BahanBaku>) => {
    if (editingItem && editingItem.id) {
        const updatedItemData = {
            ...updates,
            jumlahBeliKemasan: purchaseDetails.purchaseQuantity,
            satuanKemasan: purchaseDetails.purchaseUnit,
            hargaTotalBeliKemasan: purchaseDetails.purchaseTotalPrice,
        };
        
        await updateBahanBaku(editingItem.id, updatedItemData);
        setEditingItem(null);
        setPurchaseDetails({ purchaseQuantity: 0, purchaseUnit: '', purchaseTotalPrice: 0 }); // Reset purchaseDetails di WarehousePage setelah save
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Helper function to safely render values in inputs as string or number
  const getInputValue = <T extends string | number | null | undefined>(value: T): string | number => {
    if (value === null || value === undefined) {
      return '';
    }
    return value;
  };

  return (
    <div className="min-h-screen bg-white p-3 sm:p-6 font-inter">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div className="flex items-center mb-4 sm:mb-0">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-full mr-4">
                <Package className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                  Gudang
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Kelola inventori bahan baku
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <MenuExportButton
                data={bahanBaku}
                filename="gudang"
                menuType="Gudang"
              />
              <Button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-md shadow-md transition-colors duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Bahan
              </Button>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
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

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari bahan baku..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-md"
            />
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="mb-6">
            <Card className="bg-white shadow-lg border-orange-200 rounded-lg">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800">Tambah Bahan Baku</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddItem} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nama">Nama Bahan *</Label>
                      <Input
                        id="nama"
                        value={getInputValue(newItem.nama)}
                        onChange={(e) => setNewItem({ ...newItem, nama: e.target.value })}
                        required
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-md"
                      />
                    </div>
                    <div>
                      <Label htmlFor="kategori">Kategori *</Label>
                      <Input
                        id="kategori"
                        value={getInputValue(newItem.kategori)}
                        onChange={(e) => setNewItem({ ...newItem, kategori: e.target.value })}
                        required
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-md"
                      />
                    </div>
                    <div>
                      <Label htmlFor="stok">Stok *</Label>
                      <Input
                        id="stok"
                        type="number"
                        value={getInputValue(newItem.stok)}
                        onChange={(e) => setNewItem({ ...newItem, stok: parseFloat(e.target.value) || 0 })}
                        required
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-md"
                      />
                    </div>
                    <div>
                      <Label htmlFor="satuan">Satuan *</Label>
                      <Input
                        id="satuan"
                        value={getInputValue(newItem.satuan)}
                        onChange={(e) => setNewItem({ ...newItem, satuan: e.target.value })}
                        required
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-md"
                      />
                    </div>

                    {/* Harga Satuan (Read-Only) */}
                    <div>
                      <Label htmlFor="hargaSatuan">Harga Satuan *</Label>
                      <Input
                        id="hargaSatuan"
                        type="number"
                        value={getInputValue(newItem.hargaSatuan)}
                        readOnly
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-md bg-gray-100 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Harga per {getInputValue(newItem.satuan) || 'unit'} akan dihitung otomatis jika 'Detail Pembelian' diisi.
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="minimum">Stok Minimum *</Label>
                      <Input
                        id="minimum"
                        type="number"
                        value={getInputValue(newItem.minimum)}
                        onChange={(e) => setNewItem({ ...newItem, minimum: parseFloat(e.target.value) || 0 })}
                        required
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-md"
                      />
                    </div>
                    <div>
                      <Label htmlFor="supplier">Supplier</Label>
                      <Input
                        id="supplier"
                        value={getInputValue(newItem.supplier)}
                        onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-md"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tanggalKadaluwarsa">Tanggal Kadaluwarsa</Label>
                      <Input
                        id="tanggalKadaluwarsa"
                        type="date"
                        value={newItem.tanggalKadaluwarsa?.toISOString().split('T')[0] || ''}
                        onChange={(e) => setNewItem({ ...newItem, tanggalKadaluwarsa: e.target.value ? new Date(e.target.value) : undefined })}
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-md"
                      />
                    </div>
                  </div>

                  {/* Detail Pembelian Section */}
                  <Card className="border-orange-200 bg-orange-50 shadow-sm rounded-lg">
                    <CardHeader>
                      <CardTitle className="text-base text-gray-800">Detail Pembelian (Opsional)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="purchaseQuantity">Jumlah Beli Kemasan</Label>
                          <Input
                            id="purchaseQuantity"
                            type="number"
                            value={getInputValue(purchaseDetails.purchaseQuantity)}
                            onChange={(e) => setPurchaseDetails({ ...purchaseDetails, purchaseQuantity: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                            className="rounded-md"
                          />
                        </div>
                        <div>
                          <Label htmlFor="purchaseUnit">Satuan Kemasan</Label>
                          <Select
                            value={getInputValue(purchaseDetails.purchaseUnit) as string}
                            onValueChange={(value) => setPurchaseDetails({ ...purchaseDetails, purchaseUnit: value })}
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
                          <Label htmlFor="purchaseTotalPrice">Harga Total Beli Kemasan</Label>
                          <Input
                            id="purchaseTotalPrice"
                            type="number"
                            value={getInputValue(purchaseDetails.purchaseTotalPrice)}
                            onChange={(e) => setPurchaseDetails({ ...purchaseDetails, purchaseTotalPrice: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                            className="rounded-md"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        Harga Satuan akan dihitung otomatis jika detail pembelian diisi.
                      </p>
                    </CardContent>
                  </Card>

                  <div className="flex gap-2">
                    <Button type="submit" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-md shadow-md transition-colors duration-200">
                      Simpan
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200">
                      Batal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Items List */}
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <Card className="text-center p-8 bg-white/80 backdrop-blur-sm shadow-lg border-0 rounded-lg">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'Tidak ada bahan baku yang cocok dengan pencarian' : 'Belum ada bahan baku di gudang'}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-md shadow-md transition-colors duration-200"
                >
                  Tambah Bahan Pertama
                </Button>
              )}
            </Card>
          ) : (
            filteredItems.map((item) => (
              <Card key={item.id} className="bg-white/80 backdrop-blur-sm shadow-lg border-0 rounded-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-4"> {/* MODIFIED: p-6 changed to p-4 */}
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

                      {/* MODIFIED: Item grid layout */}
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
                        {/* MODIFIED: Tampilkan Detail Pembelian dalam 1 baris */}
                        {Boolean(item.jumlahBeliKemasan || item.satuanKemasan || item.hargaTotalBeliKemasan) && (
                           <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-3"> {/* MODIFIED */}
                              <p className="text-sm text-gray-500 font-semibold">Detail Pembelian</p> {/* MODIFIED */}
                              <p className="text-xs text-gray-700"> {/* MODIFIED */}
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
    </div>
  );
};

export default WarehousePage;