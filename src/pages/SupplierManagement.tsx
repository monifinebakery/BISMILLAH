import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Plus, Edit, Trash2, Phone, Mail, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Supplier } from '@/types/supplier';
import { useSupplier } from '@/contexts/SupplierContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SupplierManagement = () => {
  const { suppliers, isLoading, addSupplier, updateSupplier, deleteSupplier } = useSupplier();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [newSupplier, setNewSupplier] = useState({
    nama: '', kontak: '', email: '', telepon: '', alamat: '', catatan: '',
  });

  const filteredSuppliers = useMemo(() => 
    suppliers.filter(supplier =>
      supplier.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.kontak.toLowerCase().includes(searchTerm.toLowerCase())
  ), [suppliers, searchTerm]);

  const currentSuppliers = useMemo(() => {
    const firstItemIndex = (currentPage - 1) * itemsPerPage;
    return filteredSuppliers.slice(firstItemIndex, firstItemIndex + itemsPerPage);
  }, [filteredSuppliers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);

  const handleSaveSupplier = async () => {
    if (!newSupplier.nama || !newSupplier.kontak) {
      toast.error('Nama supplier dan nama kontak wajib diisi');
      return;
    }
    const dataToSave = { ...newSupplier, catatan: newSupplier.catatan || null };
    const success = editingSupplier 
      ? await updateSupplier(editingSupplier.id, dataToSave)
      : await addSupplier(dataToSave);

    if (success) setIsDialogOpen(false);
  };

  const openDialog = (supplier: Supplier | null = null) => {
    setEditingSupplier(supplier);
    setNewSupplier(
      supplier ? {
        nama: supplier.nama, kontak: supplier.kontak, email: supplier.email || '',
        telepon: supplier.telepon || '', alamat: supplier.alamat || '', catatan: supplier.catatan || ''
      } : {
        nama: '', kontak: '', email: '', telepon: '', alamat: '', catatan: ''
      }
    );
    setIsDialogOpen(true);
  };

  const handleDeleteSupplier = (id: string) => deleteSupplier(id);

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Memuat data supplier...</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* ✨ Header (Mirip Halaman Pesanan) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-full">
            <Users className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Manajemen Supplier</h1>
            <p className="text-muted-foreground">Kelola semua informasi partner dan pemasok Anda.</p>
          </div>
        </div>
        <Button onClick={() => openDialog(null)} className="mt-4 sm:mt-0 w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" /> Tambah Supplier
        </Button>
      </div>

      {/* ✨ Filter Card (Terpisah Seperti Halaman Pesanan) */}
      <Card>
        <CardHeader><CardTitle>Filter Supplier</CardTitle></CardHeader>
        <CardContent>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari Nama Supplier / Kontak..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* ✨ Main Content Card (Mirip Halaman Pesanan) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daftar Supplier ({filteredSuppliers.length})</CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <Label htmlFor="itemsPerPage">Baris per halaman:</Label>
              <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Supplier</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentSuppliers.length > 0 ? currentSuppliers.map(supplier => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.nama}</TableCell>
                    <TableCell>{supplier.kontak}</TableCell>
                    <TableCell>{supplier.email || '-'}</TableCell>
                    <TableCell>{supplier.telepon || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(supplier)}><Edit className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Anda Yakin?</AlertDialogTitle><AlertDialogDescription>Tindakan ini akan menghapus supplier secara permanen.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteSupplier(supplier.id)} className="bg-red-600 hover:bg-red-700">Ya, Hapus</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      {searchTerm ? 'Supplier tidak ditemukan.' : 'Belum ada data supplier.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {/* ✨ Pagination Footer (Mirip Halaman Pesanan) */}
        {totalPages > 1 && (
          <CardFooter className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-muted-foreground">
              Menampilkan {Math.min(filteredSuppliers.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredSuppliers.length, currentPage * itemsPerPage)} dari {filteredSuppliers.length} supplier
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="px-4 text-sm font-medium">Hal {currentPage} / {totalPages}</span>
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Tambah Supplier Baru'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label htmlFor="nama">Nama Supplier *</Label><Input id="nama" value={newSupplier.nama} onChange={(e) => setNewSupplier({ ...newSupplier, nama: e.target.value })} /></div>
              <div><Label htmlFor="kontak">Nama Kontak *</Label><Input id="kontak" value={newSupplier.kontak} onChange={(e) => setNewSupplier({ ...newSupplier, kontak: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={newSupplier.email} onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })} /></div>
              <div><Label htmlFor="telepon">Telepon</Label><Input id="telepon" type="tel" value={newSupplier.telepon} onChange={(e) => setNewSupplier({ ...newSupplier, telepon: e.target.value })} /></div>
            </div>
            <div><Label htmlFor="alamat">Alamat</Label><Textarea id="alamat" value={newSupplier.alamat} onChange={(e) => setNewSupplier({ ...newSupplier, alamat: e.target.value })} rows={2} /></div>
            <div><Label htmlFor="catatan">Catatan</Label><Textarea id="catatan" value={newSupplier.catatan} onChange={(e) => setNewSupplier({ ...newSupplier, catatan: e.target.value })} rows={2} /></div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
              <Button onClick={handleSaveSupplier} className="bg-orange-600 hover:bg-orange-700 text-white">{editingSupplier ? 'Perbarui' : 'Simpan'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupplierManagement;