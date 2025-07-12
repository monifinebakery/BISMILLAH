import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Package, Edit, Trash2, AlertTriangle, Search } from 'lucide-react';
import { useAppData } from '@/contexts/AppDataContext';
import { BahanBaku } from '@/types/recipe'; // Asumsi BahanBaku type sudah sesuai DB
import BahanBakuEditDialog from '@/components/BahanBakuEditDialog';
import MenuExportButton from '@/components/MenuExportButton';

const WarehousePage = () => {
  const { bahanBaku, addBahanBaku, updateBahanBaku, deleteBahanBaku } = useAppData();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<BahanBaku | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // MODIFIED: Sesuaikan nama properti state newItem dengan nama kolom database
  const [newItem, setNewItem] = useState({
    nama: '',
    kategori: '',
    stok: 0,
    satuan: '',
    harga_satuan: 0, // Disesuaikan: hargaSatuan -> harga_satuan
    minimum: 0,
    supplier: '',
    tanggal_kadaluwarsa: '' // Disesuaikan: tanggalKadaluwarsa -> tanggal_kadaluwarsa
  });

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // MODIFIED: Pastikan nama properti yang dikirim ke addBahanBaku sesuai dengan DB
    const itemData = {
      nama: newItem.nama,
      kategori: newItem.kategori,
      stok: newItem.stok,
      satuan: newItem.satuan,
      harga_satuan: newItem.harga_satuan, // Disesuaikan
      minimum: newItem.minimum,
      supplier: newItem.supplier,
      // Konversi tanggal_kadaluwarsa ke format Date atau ISO string jika diperlukan oleh backend/DB
      tanggal_kadaluwarsa: newItem.tanggal_kadaluwarsa ? new Date(newItem.tanggal_kadaluwarsa).toISOString() : null // Disesuaikan, dan handle null/undefined
    };

    const success = await addBahanBaku(itemData);
    if (success) {
      setShowAddForm(false);
      // Reset form setelah berhasil disimpan
      setNewItem({
        nama: '',
        kategori: '',
        stok: 0,
        satuan: '',
        harga_satuan: 0,
        minimum: 0,
        supplier: '',
        tanggal_kadaluwarsa: ''
      });
    }
  };

  const handleEdit = (item: BahanBaku) => {
    // MODIFIED: Pastikan saat mengedit, nilai tanggal kadaluwarsa diformat untuk input type="date"
    // Jika item.tanggal_kadaluwarsa adalah objek Date atau ISO string, konversi ke YYYY-MM-DD
    const formattedDate = item.tanggal_kadaluwarsa instanceof Date
        ? item.tanggal_kadaluwarsa.toISOString().split('T')[0]
        : (typeof item.tanggal_kadaluwarsa === 'string' && item.tanggal_kadaluwarsa.includes('T'))
            ? item.tanggal_kadaluwarsa.split('T')[0]
            : item.tanggal_kadaluwarsa; // Biarkan apa adanya jika sudah YYYY-MM-DD atau null

    setEditingItem({
        ...item,
        tanggal_kadaluwarsa: formattedDate // Pastikan format YYYY-MM-DD untuk input date
    });
  };

  const handleEditSave = async (updates: Partial<BahanBaku>) => {
    if (editingItem) {
      // MODIFIED: Pastikan tanggal_kadaluwarsa di updates juga dikirim dalam format yang benar ke DB
      const updatedData = {
          ...updates,
          tanggal_kadaluwarsa: updates.tanggal_kadaluwarsa ? new Date(updates.tanggal_kadaluwarsa).toISOString() : null
      };
      await updateBahanBaku(editingItem.id, updatedData);
      setEditingItem(null);
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    // MODIFIED: Ganti confirm() dengan modal kustom jika ini untuk lingkungan iFrame
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
                      <Label htmlFor="nama">Nama Bahan</Label>
                      <Input
                        id="nama"
                        value={newItem.nama}
                        onChange={(e) => setNewItem({...newItem, nama: e.target.value})}
                        required
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-md"
                      />
                    </div>
                    <div>
                      <Label htmlFor="kategori">Kategori</Label>
                      <Input
                        id="kategori"
                        value={newItem.kategori}
                        onChange={(e) => setNewItem({...newItem, kategori: e.target.value})}
                        required
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-md"
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
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-md"
                      />
                    </div>
                    <div>
                      <Label htmlFor="satuan">Satuan</Label>
                      <Input
                        id="satuan"
                        value={newItem.satuan}
                        onChange={(e) => setNewItem({...newItem, satuan: e.target.value})}
                        required
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-md"
                      />
                    </div>
                    <div>
                      <Label htmlFor="harga_satuan">Harga Satuan</Label>
                      <Input
                        id="harga_satuan"
                        type="number"
                        value={newItem.harga_satuan} // Menggunakan harga_satuan
                        onChange={(e) => setNewItem({...newItem, harga_satuan: parseFloat(e.target.value) || 0})} // Menggunakan harga_satuan
                        required
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-md"
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
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-md"
                      />
                    </div>
                    <div>
                      <Label htmlFor="supplier">Supplier</Label>
                      <Input
                        id="supplier"
                        value={newItem.supplier}
                        onChange={(e) => setNewItem({...newItem, supplier: e.target.value})}
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-md"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tanggal_kadaluwarsa">Tanggal Kadaluwarsa</Label>
                      <Input
                        id="tanggal_kadaluwarsa"
                        type="date"
                        value={newItem.tanggal_kadaluwarsa} // Menggunakan tanggal_kadaluwarsa
                        onChange={(e) => setNewItem({...newItem, tanggal_kadaluwarsa: e.target.value})} // Menggunakan tanggal_kadaluwarsa
                        className="border-gray-200 focus:border-orange-500 focus:ring-orange-500 rounded-md"
                      />
                    </div>
                  </div>
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
                          <p className="font-semibold text-green-600">{formatCurrency(item.harga_satuan)}</p> {/* Menggunakan item.harga_satuan */}
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Minimum</p>
                          <p className="font-semibold text-gray-800">{item.minimum} {item.satuan}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Supplier</p>
                          <p className="font-semibold text-gray-800">{item.supplier || '-'}</p>
                        </div>
                        {/* MODIFIED: Tampilkan Tanggal Kadaluwarsa */}
                        {item.tanggal_kadaluwarsa && (
                            <div>
                                <p className="text-sm text-gray-500">Kadaluwarsa</p>
                                <p className="font-semibold text-gray-800">
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
