import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Package, Edit, Trash2, AlertTriangle, Search } from 'lucide-react';
import { useBahanBaku } from '@/hooks/useBahanBaku';
import { BahanBaku } from '@/types/recipe'; // Asumsi BahanBaku type: { ..., harga_satuan: number, tanggal_kadaluwarsa: string | null, ... }
import BahanBakuEditDialog from '@/components/BahanBakuEditDialog';
import MenuExportButton from '@/components/MenuExportButton';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const WarehousePage = () => {
  const { bahanBaku, addBahanBaku, updateBahanBaku, deleteBahanBaku } = useBahanBaku();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<BahanBaku | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // State untuk form Tambah Bahan Baku
  const [newItem, setNewItem] = useState({
    nama: '',
    kategori: '',
    stok: 0,
    satuan: '', // Satuan dasar bahan baku (e.g., 'gram', 'ml', 'pcs')
    hargaSatuan: 0, // Ini akan dihitung otomatis
    minimum: 0,
    supplier: '',
    tanggalKadaluwarsa: '', // String format YYYY-MM-DD for date input
  });

  // State untuk Detail Pembelian (digunakan untuk perhitungan hargaSatuan)
  const [purchaseDetails, setPurchaseDetails] = useState({
    purchaseQuantity: 0,    // Jumlah Beli Kemasan
    purchaseUnit: '',       // Satuan Kemasan (e.g., 'kg', 'liter', 'box')
    purchaseTotalPrice: 0,  // Harga Total Beli Kemasan
  });

  // unitConversionMap: Faktor konversi dari Satuan Kemasan ke satuan dasar bahan baku
  // Kunci pertama adalah SATUAN DASAR bahan baku (newItem.satuan)
  // Kunci kedua adalah SATUAN PEMBELIAN (purchaseDetails.purchaseUnit)
  // Nilai adalah faktor pengali untuk mengubah satuan pembelian ke satuan dasar.
  // Contoh: 1 kg = 1000 gram, jadi konversi 'kg' ke 'gram' adalah 1000.
  // Jika 1 box = 12 pcs, konversi 'box' ke 'pcs' adalah 12.
  const unitConversionMap: { [baseUnit: string]: { [purchaseUnit: string]: number } } = {
    'gram': {
      'kg': 1000,
      'gram': 1,
      'pon': 453.592, // 1 pon = 453.592 gram
      // Tambahkan konversi lain ke gram
    },
    'ml': {
      'liter': 1000,
      'ml': 1,
      'galon': 3785.41, // 1 galon US = 3785.41 ml
      // Tambahkan konversi lain ke ml
    },
    'pcs': {
      'pcs': 1,
      'lusin': 12,
      'gross': 144,
      'box': 1, // Jika 1 box berisi 1 pcs standar (perlu disesuaikan jika 1 box berisi banyak pcs)
      'bungkus': 1, // Jika 1 bungkus berisi 1 pcs standar
      // Tambahkan konversi lain ke pcs
    },
    'butir': {
      'butir': 1,
      'tray': 30, // Asumsi 1 tray = 30 butir
      'lusin': 12, // 1 lusin = 12 butir
      // Tambahkan konversi lain ke butir
    },
    // Tambahkan satuan dasar lain yang relevan di sini
  };

  // useEffect untuk menghitung hargaSatuan otomatis berdasarkan Detail Pembelian
  useEffect(() => {
    const { purchaseQuantity, purchaseUnit, purchaseTotalPrice } = purchaseDetails;
    const baseUnit = newItem.satuan.toLowerCase(); // Satuan dasar bahan baku yang dipilih (convert to lowercase for map consistency)

    let calculatedHarga = 0;

    // Hanya hitung jika semua input pembelian valid dan satuan dasar sudah diisi
    if (purchaseQuantity > 0 && purchaseTotalPrice > 0 && purchaseUnit && baseUnit) {
      const conversionRates = unitConversionMap[baseUnit];

      if (conversionRates) {
        const factor = conversionRates[purchaseUnit.toLowerCase()];

        if (factor !== undefined && factor > 0) {
          calculatedHarga = purchaseTotalPrice / (purchaseQuantity * factor);
        } else if (purchaseUnit.toLowerCase() === baseUnit) {
          // Jika satuan pembelian sama dengan satuan dasar (e.g., beli 'gram', satuan dasar 'gram')
          calculatedHarga = purchaseTotalPrice / purchaseQuantity;
        } else {
          // Jika satuan dasar ada tapi satuan pembelian tidak memiliki faktor konversi yang valid
          toast.warning(`Tidak ada faktor konversi yang ditemukan untuk '${purchaseUnit}' ke '${baseUnit}'.`, { duration: 3000 });
        }
      } else {
        // Jika satuan dasar bahan baku (newItem.satuan) tidak ada di unitConversionMap
        toast.warning(`Satuan dasar bahan baku '${baseUnit}' tidak ada dalam peta konversi.`, { duration: 3000 });
      }
    }

    // Update hargaSatuan di state newItem, dengan pembatasan desimal
    setNewItem(prev => ({ ...prev, hargaSatuan: parseFloat(calculatedHarga.toFixed(2)) }));

  }, [purchaseDetails, newItem.satuan]); // Dependensi: perubahan detail pembelian atau satuan dasar bahan baku

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi dasar
    if (!newItem.nama || !newItem.kategori || newItem.stok <= 0 || !newItem.satuan || newItem.hargaSatuan <= 0 || newItem.minimum < 0) {
      toast.error('Harap lengkapi semua field yang wajib diisi dan pastikan Stok serta Harga Satuan lebih dari 0.');
      return;
    }

    // Mapping state ke format BahanBaku yang sesuai DB/backend
    const itemData: Omit<BahanBaku, 'id'> = { // Omit 'id' karena ini untuk penambahan
      nama: newItem.nama,
      kategori: newItem.kategori,
      stok: newItem.stok,
      satuan: newItem.satuan,
      harga_satuan: newItem.hargaSatuan, // Mapping hargaSatuan ke harga_satuan (snake_case)
      minimum: newItem.minimum,
      supplier: newItem.supplier,
      tanggal_kadaluwarsa: newItem.tanggalKadaluwarsa || null, // Mapping tanggalKadaluwarsa ke tanggal_kadaluwarsa, pastikan null jika kosong
    };

    const success = await addBahanBaku(itemData);
    if (success) {
      setShowAddForm(false);
      // Reset form
      setNewItem({
        nama: '', kategori: '', stok: 0, satuan: '', hargaSatuan: 0, minimum: 0, supplier: '', tanggalKadaluwarsa: '',
      });
      // Reset detail pembelian
      setPurchaseDetails({ purchaseQuantity: 0, purchaseUnit: '', purchaseTotalPrice: 0 });
      toast.success("Bahan baku berhasil ditambahkan!");
    } else {
      toast.error("Gagal menambahkan bahan baku. Silakan coba lagi.");
    }
  };

  const handleEdit = (item: BahanBaku) => {
    // Memformat tanggal_kadaluwarsa dari object Date/string ISO ke YYYY-MM-DD untuk input type="date"
    const formattedDate = item.tanggal_kadaluwarsa
      ? new Date(item.tanggal_kadaluwarsa).toISOString().split('T')[0]
      : ''; // Gunakan string kosong jika null/undefined

    setEditingItem({
      ...item,
      // Mapping properti dari DB (snake_case) ke state lokal (camelCase) untuk edit form
      hargaSatuan: item.harga_satuan,
      tanggalKadaluwarsa: formattedDate,
    });
  };

  const handleEditSave = async (updates: Partial<BahanBaku>) => {
    if (editingItem && editingItem.id) {
      // Mapping properti dari state lokal (camelCase) ke format DB (snake_case)
      const updatedData: Partial<BahanBaku> = {
        ...updates,
        harga_satuan: (updates as any).hargaSatuan, // Cast to any to access hargaSatuan from updates
        tanggal_kadaluwarsa: updates.tanggalKadaluwarsa ? new Date(updates.tanggalKadaluwarsa).toISOString() : null,
      };
      // Hapus properti camelCase yang tidak ada di type BahanBaku (DB)
      delete (updatedData as any).hargaSatuan;
      delete (updatedData as any).tanggalKadaluwarsa;

      await updateBahanBaku(editingItem.id, updatedData);
      setEditingItem(null);
      toast.success("Bahan baku berhasil diperbarui!");
    } else {
      toast.error("Gagal memperbarui bahan baku.");
    }
  };


  const handleDelete = async (id: string, nama: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus "${nama}"?`)) { // Pertimbangkan modal kustom instead of native confirm()
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
              className="pl-10 bg-white border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-md shadow-sm"
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
                        value={newItem.nama}
                        onChange={(e) => setNewItem({ ...newItem, nama: e.target.value })}
                        required
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-md"
                      />
                    </div>
                    <div>
                      <Label htmlFor="kategori">Kategori *</Label>
                      <Input
                        id="kategori"
                        value={newItem.kategori}
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
                        value={newItem.stok === 0 ? '' : newItem.stok} // Display empty for 0
                        onChange={(e) => setNewItem({ ...newItem, stok: parseFloat(e.target.value) || 0 })}
                        required
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-md"
                      />
                    </div>
                    <div>
                      <Label htmlFor="satuan">Satuan *</Label>
                      <Input
                        id="satuan"
                        value={newItem.satuan}
                        onChange={(e) => setNewItem({ ...newItem, satuan: e.target.value })}
                        required
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-md"
                      />
                    </div>

                    {/* Harga Satuan (Read-Only) - Ini yang perlu muncul kembali */}
                    <div>
                      <Label htmlFor="hargaSatuan">Harga Satuan *</Label>
                      <Input
                        id="hargaSatuan"
                        type="number"
                        value={newItem.hargaSatuan === 0 ? '' : newItem.hargaSatuan}
                        readOnly // Ini harus read-only
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-md bg-gray-100 cursor-not-allowed" // Styling untuk read-only
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Harga per {newItem.satuan || 'unit'} akan dihitung otomatis jika 'Detail Pembelian' diisi.
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="minimum">Stok Minimum *</Label>
                      <Input
                        id="minimum"
                        type="number"
                        value={newItem.minimum === 0 ? '' : newItem.minimum} // Display empty for 0
                        onChange={(e) => setNewItem({ ...newItem, minimum: parseFloat(e.target.value) || 0 })}
                        required
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-md"
                      />
                    </div>
                    <div>
                      <Label htmlFor="supplier">Supplier</Label>
                      <Input
                        id="supplier"
                        value={newItem.supplier}
                        onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-md"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tanggalKadaluwarsa">Tanggal Kadaluwarsa</Label>
                      <Input
                        id="tanggalKadaluwarsa"
                        type="date"
                        value={newItem.tanggalKadaluwarsa}
                        onChange={(e) => setNewItem({ ...newItem, tanggalKadaluwarsa: e.target.value })}
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-md"
                      />
                    </div>
                  </div>

                  {/* Detail Pembelian Section - Ini sudah ada di screenshotmu */}
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
                            value={purchaseDetails.purchaseQuantity || ''}
                            onChange={(e) => setPurchaseDetails({ ...purchaseDetails, purchaseQuantity: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                            className="rounded-md"
                          />
                        </div>
                        <div>
                          <Label htmlFor="purchaseUnit">Satuan Kemasan</Label>
                          <Select
                            value={purchaseDetails.purchaseUnit}
                            onValueChange={(value) => setPurchaseDetails({ ...purchaseDetails, purchaseUnit: value })}
                          >
                            <SelectTrigger className="rounded-md">
                              <SelectValue placeholder="Pilih satuan" />
                            </SelectTrigger>
                            <SelectContent>
                              {/* Pastikan daftar ini lengkap sesuai kebutuhan UMKM */}
                              {['kg', 'liter', 'pcs', 'bungkus', 'karung', 'box', 'tray', 'lusin', 'butir'].map(unit => (
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
                            value={purchaseDetails.purchaseTotalPrice || ''}
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
                <CardContent className="p-6">
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Stok</p>
                          <p className="font-semibold text-gray-800">{item.stok} {item.satuan}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Harga Satuan</p>
                          {/* Menggunakan item.harga_satuan dari DB */}
                          <p className="font-semibold text-green-600">{formatCurrency(item.harga_satuan)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Minimum</p>
                          <p className="font-semibold text-gray-800">{item.minimum} {item.satuan}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Supplier</p>
                          <p className="font-semibold text-gray-800">{item.supplier || '-'}</p>
                        </div>
                        {item.tanggal_kadaluwarsa && (
                          <div>
                            <p className="text-sm text-gray-500">Kadaluwarsa</p>
                            <p className="font-semibold text-gray-800">
                              {/* Pastikan ini menampilkan tanggal yang benar */}
                              {new Date(item.tanggal_kadaluwarsa).toLocaleDateString('id-ID', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
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