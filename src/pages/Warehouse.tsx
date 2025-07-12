import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Package, Edit, Trash2, AlertTriangle, Search } from 'lucide-react';
// MODIFIED: Import 'useAppData' instead of 'useBahanBaku'
import { useAppData } from '@/contexts/AppDataContext';
import { BahanBaku } from '@/types/recipe';
import BahanBakuEditDialog from '@/components/BahanBakuEditDialog';
import MenuExportButton from '@/components/MenuExportButton';

const WarehousePage = () => {
  // MODIFIED: Use the AppDataContext hook
  const { bahanBaku, addBahanBaku, updateBahanBaku, deleteBahanBaku } = useAppData();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<BahanBaku | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newItem, setNewItem] = useState({
    nama: '',
    kategori: '',
    stok: 0,
    satuan: '',
    hargaSatuan: 0,
    minimum: 0,
    supplier: '',
    tanggalKadaluwarsa: ''
  });

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const itemData = {
      ...newItem,
      tanggalKadaluwarsa: newItem.tanggalKadaluwarsa ? new Date(newItem.tanggalKadaluwarsa) : undefined
    };

    const success = await addBahanBaku(itemData);
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
        tanggalKadaluwarsa: ''
      });
    }
  };

  const handleEdit = (item: BahanBaku) => {
    setEditingItem(item);
  };

  const handleEditSave = async (updates: Partial<BahanBaku>) => {
    if (editingItem) {
      await updateBahanBaku(editingItem.id, updates);
      setEditingItem(null);
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus "${nama}"?`)) {
      await deleteBahanBaku(id);
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

  // MODIFIED: Removed the loading state block as requested
  // The AppDataContext will handle the loading state globally.

  return (
    <div className="min-h-screen bg-white p-3 sm:p-6">
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
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
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
            <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-red-700">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Peringatan Stok Rendah ({lowStockItems.length} item)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {lowStockItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                      <span className="font-medium text-gray-800">{item.nama}</span>
                      <Badge className="bg-red-100 text-red-700">
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
              className="pl-10 bg-white border-gray-200 focus:border-orange-500 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="mb-6">
            <Card className="bg-white shadow-lg border-orange-200">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-800">Tambah Bahan Baku</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddItem} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nama">Nama Bahan</Label>
                      <Input
                        id="nama"
                        value={newItem.nama}
                        onChange={(e) => setNewItem({...newItem, nama: e.target.value})}
                        required
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="kategori">Kategori</Label>
                      <Input
                        id="kategori"
                        value={newItem.kategori}
                        onChange={(e) => setNewItem({...newItem, kategori: e.target.value})}
                        required
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="stok">Stok</Label>
                      <Input
                        id="stok"
                        type="number"
                        value={newItem.stok}
                        onChange={(e) => setNewItem({...newItem, stok: parseFloat(e.target.value) || 0})}
                        required
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="satuan">Satuan</Label>
                      <Input
                        id="satuan"
                        value={newItem.satuan}
                        onChange={(e) => setNewItem({...newItem, satuan: e.target.value})}
                        required
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hargaSatuan">Harga Satuan</Label>
                      <Input
                        id="hargaSatuan"
                        type="number"
                        value={newItem.hargaSatuan}
                        onChange={(e) => setNewItem({...newItem, hargaSatuan: parseFloat(e.target.value) || 0})}
                        required
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="minimum">Stok Minimum</Label>
                      <Input
                        id="minimum"
                        type="number"
                        value={newItem.minimum}
                        onChange={(e) => setNewItem({...newItem, minimum: parseFloat(e.target.value) || 0})}
                        required
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="supplier">Supplier</Label>
                      <Input
                        id="supplier"
                        value={newItem.supplier}
                        onChange={(e) => setNewItem({...newItem, supplier: e.target.value})}
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tanggalKadaluwarsa">Tanggal Kadaluwarsa</Label>
                      <Input
                        id="tanggalKadaluwarsa"
                        type="date"
                        value={newItem.tanggalKadaluwarsa}
                        onChange={(e) => setNewItem({...newItem, tanggalKadaluwarsa: e.target.value})}
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
                      Simpan
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
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
            <Card className="text-center p-8 bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'Tidak ada bahan baku yang cocok dengan pencarian' : 'Belum ada bahan baku di gudang'}
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setShowAddForm(true)}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                >
                  Tambah Bahan Pertama
                </Button>
              )}
            </Card>
          ) : (
            filteredItems.map((item) => (
              <Card key={item.id} className="bg-white/80 backdrop-blur-sm shadow-lg border-0 hover:shadow-xl transition-all duration-300">
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
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(item.id, item.nama)}
                        className="flex items-center gap-2 border-red-200 text-red-700 hover:bg-red-50"
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
