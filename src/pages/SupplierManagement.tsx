import React, { useState, useMemo } from 'react';
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
import { useSupplier } from '@/contexts/SupplierContext'; // PERBAIKAN: Menggunakan useSupplier
import { formatDateForDisplay } from '@/utils/dateUtils';
import { useIsMobile } from '@/hooks/use-mobile';

const SupplierManagement = () => {
  const isMobile = useIsMobile();
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, isLoading } = useSupplier();
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

  const filteredSuppliers = useMemo(() => suppliers.filter(supplier =>
    supplier.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.kontak.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (supplier.telepon || '').toLowerCase().includes(searchTerm.toLowerCase())
  ), [suppliers, searchTerm]);

  const handleSaveSupplier = async () => {
    if (!newSupplier.nama || !newSupplier.kontak) {
      toast.error('Nama supplier dan kontak wajib diisi');
      return;
    }

    const supplierDataToSave = {
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
    }
  };

  const handleOpenDialog = (supplier: Supplier | null = null) => {
    setEditingSupplier(supplier);
    if (supplier) {
        setNewSupplier({
            nama: supplier.nama,
            kontak: supplier.kontak,
            email: supplier.email || '',
            telepon: supplier.telepon || '',
            alamat: supplier.alamat || '',
            catatan: supplier.catatan || '',
        });
    } else {
        setNewSupplier({ nama: '', kontak: '', email: '', telepon: '', alamat: '', catatan: '' });
    }
    setIsDialogOpen(true);
  };

  const handleDeleteSupplier = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus supplier ini?")) {
      await deleteSupplier(id);
    }
  };

  if (isLoading && suppliers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Manajemen Supplier</h1>
          <p className="text-muted-foreground">Kelola informasi supplier dan kontak Anda.</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="mt-4 sm:mt-0 bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Supplier
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Cari berdasarkan nama, kontak, email, atau telepon..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Daftar Supplier */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
          <CardTitle>Daftar Supplier</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSuppliers.length === 0 ? (
            <div className="text-center p-8 text-gray-500">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {searchTerm ? 'Supplier tidak ditemukan' : 'Belum ada supplier'}
              </h3>
            </div>
          ) : isMobile ? (
            // Tampilan Mobile
            <div className="p-4 space-y-4">
              {filteredSuppliers.map((supplier) => (
                <Card key={supplier.id} className="border shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-base">{supplier.nama}</h3>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(supplier)} className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteSupplier(supplier.id)} className="h-8 w-8"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-gray-700">
                      <p>Kontak: <span className="font-medium">{supplier.kontak}</span></p>
                      {supplier.email && <p className="flex items-center"><Mail className="h-4 w-4 mr-2 flex-shrink-0" />{supplier.email}</p>}
                      {supplier.telepon && <p className="flex items-center"><Phone className="h-4 w-4 mr-2 flex-shrink-0" />{supplier.telepon}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // Tampilan Desktop
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Supplier</TableHead>
                    <TableHead>Kontak</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Ditambahkan</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.nama}</TableCell>
                      <TableCell>{supplier.kontak}</TableCell>
                      <TableCell>{supplier.email || '-'}</TableCell>
                      <TableCell>{supplier.telepon || '-'}</TableCell>
                      <TableCell>{supplier.createdAt ? formatDateForDisplay(supplier.createdAt) : '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(supplier)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteSupplier(supplier.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Tambah Supplier Baru'}</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label htmlFor="nama">Nama Supplier *</Label><Input id="nama" value={newSupplier.nama} onChange={(e) => setNewSupplier({ ...newSupplier, nama: e.target.value })} /></div>
              <div><Label htmlFor="kontak">Nama Kontak *</Label><Input id="kontak" value={newSupplier.kontak} onChange={(e) => setNewSupplier({ ...newSupplier, kontak: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={newSupplier.email} onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })} /></div>
              <div><Label htmlFor="telepon">Telepon</Label><Input id="telepon" value={newSupplier.telepon} onChange={(e) => setNewSupplier({ ...newSupplier, telepon: e.target.value })} /></div>
            </div>
            <div><Label htmlFor="alamat">Alamat</Label><Textarea id="alamat" value={newSupplier.alamat} onChange={(e) => setNewSupplier({ ...newSupplier, alamat: e.target.value })} /></div>
            <div><Label htmlFor="catatan">Catatan</Label><Textarea id="catatan" value={newSupplier.catatan} onChange={(e) => setNewSupplier({ ...newSupplier, catatan: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSaveSupplier}>{editingSupplier ? 'Perbarui' : 'Simpan'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupplierManagement;
