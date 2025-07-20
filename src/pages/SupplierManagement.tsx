import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Edit, Trash2, Phone, Mail, MapPin, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Supplier } from '@/types/supplier';
import { useSuppliers } from '@/hooks/useSuppliers';
import { formatDateForDisplay } from '@/utils/dateUtils';
import { useIsMobile } from '@/hooks/use-mobile';

// PERUBAHAN: Skema warna diubah dari ungu/biru menjadi oranye/merah.

const SupplierManagement = () => {
  const isMobile = useIsMobile();
  const { suppliers, loading, addSupplier, updateSupplier, deleteSupplier } = useSuppliers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newSupplier, setNewSupplier] = useState({
    nama: '',
    kontak: '',
    email: '',
    telepon: '',
    alamat: '',
    catatan: '',
  });

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.kontak.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (supplier.telepon && supplier.telepon.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSaveSupplier = async () => {
    if (!newSupplier.nama || !newSupplier.kontak) {
      toast.error('Nama supplier dan kontak wajib diisi');
      return;
    }

    const supplierDataToSave: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'userId'> = {
        ...newSupplier,
        catatan: newSupplier.catatan === '' ? null : newSupplier.catatan,
    };

    let success = false;
    if (editingSupplier) {
      success = await updateSupplier(editingSupplier.id, supplierDataToSave);
    } else {
      success = await addSupplier(supplierDataToSave);
    }

    if (success) {
      setIsDialogOpen(false);
      setEditingSupplier(null);
      setNewSupplier({
        nama: '',
        kontak: '',
        email: '',
        telepon: '',
        alamat: '',
        catatan: '',
      });
    }
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setNewSupplier({
      nama: supplier.nama,
      kontak: supplier.kontak,
      email: supplier.email || '',
      telepon: supplier.telepon || '',
      alamat: supplier.alamat || '',
      catatan: supplier.catatan || '',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteSupplier = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus supplier ini?")) {
      await toast.promise(deleteSupplier(id), {
        loading: 'Menghapus supplier...',
        success: 'Supplier berhasil dihapus!',
        error: (err) => `Gagal menghapus supplier: ${err.message || 'Terjadi kesalahan'}`,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 p-3 sm:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data supplier...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
            <div className="flex items-center mb-3 sm:mb-0">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-full mr-4">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                  Manajemen Supplier
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Kelola informasi supplier dan kontak
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 w-full sm:w-auto text-white"
                    onClick={() => {
                        setEditingSupplier(null);
                        setNewSupplier({ nama: '', kontak: '', email: '', telepon: '', alamat: '', catatan: '' });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Supplier
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingSupplier ? 'Edit Supplier' : 'Tambah Supplier Baru'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nama">Nama Supplier *</Label>
                        <Input
                          id="nama"
                          value={newSupplier.nama}
                          onChange={(e) => setNewSupplier({ ...newSupplier, nama: e.target.value })}
                          placeholder="Nama perusahaan supplier"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="kontak">Nama Kontak *</Label>
                        <Input
                          id="kontak"
                          value={newSupplier.kontak}
                          onChange={(e) => setNewSupplier({ ...newSupplier, kontak: e.target.value })}
                          placeholder="Nama penanggung jawab"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newSupplier.email}
                          onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                          placeholder="email@supplier.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="telepon">Telepon</Label>
                        <Input
                          id="telepon"
                          type="tel"
                          value={newSupplier.telepon}
                          onChange={(e) => setNewSupplier({ ...newSupplier, telepon: e.target.value })}
                          placeholder="08123456789"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="alamat">Alamat</Label>
                      <Textarea
                        id="alamat"
                        value={newSupplier.alamat}
                        onChange={(e) => setNewSupplier({ ...newSupplier, alamat: e.target.value })}
                        placeholder="Alamat lengkap supplier"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="catatan">Catatan</Label>
                      <Textarea
                        id="catatan"
                        value={newSupplier.catatan}
                        onChange={(e) => setNewSupplier({ ...newSupplier, catatan: e.target.value })}
                        placeholder="Catatan tambahan tentang supplier"
                        rows={2}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Batal
                      </Button>
                      <Button onClick={handleSaveSupplier} className="bg-orange-600 hover:bg-orange-700 text-white">
                        {editingSupplier ? 'Perbarui' : 'Simpan'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari supplier atau kontak..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Supplier List */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
            <CardTitle className="text-lg sm:text-xl">Daftar Supplier</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {filteredSuppliers.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                <Users className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
                  {searchTerm ? 'Supplier tidak ditemukan' : 'Belum ada supplier'}
                </h3>
                <p className="text-sm sm:text-base text-gray-500 mb-4">
                  {searchTerm ? 'Coba kata kunci lain' : 'Mulai dengan menambahkan supplier pertama'}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => {
                        setIsDialogOpen(true);
                        setEditingSupplier(null);
                        setNewSupplier({ nama: '', kontak: '', email: '', telepon: '', alamat: '', catatan: '' });
                    }}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Supplier
                  </Button>
                )}
              </div>
            ) : isMobile ? (
              // Mobile View (Cards)
              <div className="p-4 space-y-4">
                {filteredSuppliers.map((supplier) => (
                  <Card key={supplier.id} className="border border-orange-200 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-base text-gray-900">{supplier.nama}</h3>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSupplier(supplier)}
                            className="h-8 w-8 p-0 hover:bg-orange-50 hover:text-orange-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSupplier(supplier.id)}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-gray-700">
                        <p>Kontak: <span className="font-medium text-gray-900">{supplier.kontak}</span></p>
                        {supplier.email && (
                          <p className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                            {supplier.email}
                          </p>
                        )}
                        {supplier.telepon && (
                          <p className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                            {supplier.telepon}
                          </p>
                        )}
                        {supplier.alamat && (
                          <p className="flex items-start">
                            <MapPin className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                            <span className="flex-1">{supplier.alamat}</span>
                          </p>
                        )}
                        {supplier.createdAt && (
                           <p>Ditambahkan: <span className="font-medium text-gray-900">{formatDateForDisplay(supplier.createdAt)}</span></p>
                        )}
                        {supplier.catatan && (
                          <p>Catatan: <span className="font-medium text-gray-900">{supplier.catatan}</span></p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              // Desktop View (Table)
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Nama Supplier</TableHead>
                      <TableHead className="min-w-[120px]">Kontak</TableHead>
                      <TableHead className="min-w-[150px]">Email</TableHead>
                      <TableHead className="min-w-[120px]">Telepon</TableHead>
                      <TableHead className="min-w-[200px]">Alamat</TableHead>
                      <TableHead className="min-w-[100px]">Tanggal</TableHead>
                      <TableHead className="min-w-[120px]">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSuppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.nama}</TableCell>
                        <TableCell>{supplier.kontak}</TableCell>
                        <TableCell>
                          {supplier.email ? (
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-1 text-gray-400" />
                              {supplier.email}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {supplier.telepon ? (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-1 text-gray-400" />
                              {supplier.telepon}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {supplier.alamat ? (
                            <div className="flex items-start">
                              <MapPin className="h-4 w-4 mr-1 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{supplier.alamat}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {supplier.createdAt ? formatDateForDisplay(supplier.createdAt) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSupplier(supplier)}
                              className="hover:bg-orange-50 hover:text-orange-600"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSupplier(supplier.id)}
                              className="hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SupplierManagement;