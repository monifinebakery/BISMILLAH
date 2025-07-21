import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSupplier } from '@/contexts/SupplierContext';
import { toast } from 'sonner';
import { Supplier } from '@/types/supplier';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

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
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [isMultipleSelectMode, setIsMultipleSelectMode] = useState(false);

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

  const handleDeleteSupplier = async (id: string) => deleteSupplier(id);

  const handleBulkDelete = async () => {
    if (selectedSupplierIds.length === 0) {
      toast.error('Pilih setidaknya satu supplier untuk dihapus');
      return;
    }
    for (const id of selectedSupplierIds) {
      await deleteSupplier(id);
    }
    setSelectedSupplierIds([]);
    setIsMultipleSelectMode(false);
    toast.success('Supplier berhasil dihapus!');
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedSupplierIds(currentSuppliers.map(s => s.id));
    } else {
      setSelectedSupplierIds([]);
    }
  };

  if (isLoading) {
    return <div className="p-2 sm:p-6 text-center text-muted-foreground text-xs sm:text-sm">Memuat data supplier...</div>;
  }

  return (
    <div className="container mx-auto p-2 sm:p-6 space-y-4">
      {/* ✨ Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 sm:p-3 rounded-full">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              Manajemen Supplier
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Kelola semua informasi partner dan pemasok Anda.</p>
          </div>
        </div>
        <Button onClick={() => openDialog(null)} className="w-full sm:w-auto flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-[#FF9500] to-[#FF2E2E] hover:from-[#FF8A00] hover:to-[#E82A2A] text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 py-2 sm:py-3 px-3 sm:px-5 rounded-md text-xs sm:text-base">
          <Plus className="h-4 w-4 sm:h-5 sm:w-5 stroke-[3]" /> Tambah Supplier
        </Button>
      </div>

      {/* ✨ Filter Card */}
      <Card className="overflow-hidden">
        <CardHeader><CardTitle className="text-base sm:text-lg">Filter Supplier</CardTitle></CardHeader>
        <CardContent className="p-2 sm:p-6">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
            <Input
              placeholder="Cari Nama Supplier / Kontak..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-8 pr-2 py-1 sm:py-2 w-full text-xs sm:text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* ✨ Main Content Card */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
            <CardTitle className="text-base sm:text-lg">Daftar Supplier ({filteredSuppliers.length})</CardTitle>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-1 sm:gap-2">
                <Label htmlFor="itemsPerPage" className="whitespace-nowrap">Baris per halaman:</Label>
                <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }} className="w-20">
                  <SelectTrigger className="text-xs sm:text-sm py-1 sm:py-2"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="5">5</SelectItem><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem></SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setIsMultipleSelectMode(!isMultipleSelectMode);
                  setSelectedSupplierIds([]);
                }}
                className="w-full sm:w-auto text-xs sm:text-sm py-1 sm:py-2"
              >
                {isMultipleSelectMode ? 'Keluar Mode Pilih' : 'Mode Pilih Multiple'}
              </Button>
              {isMultipleSelectMode && (
                <Button
                  variant="destructive"
                  onClick={handleBulkDelete}
                  disabled={selectedSupplierIds.length === 0}
                  className="w-full sm:w-auto text-xs sm:text-sm py-1 sm:py-2"
                >
                  Hapus Terpilih
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  {isMultipleSelectMode && (
                    <TableHead className="w-10 p-1 sm:p-2">
                      <input
                        type="checkbox"
                        checked={selectedSupplierIds.length === currentSuppliers.length && currentSuppliers.length > 0}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 sm:h-5 sm:w-5"
                      />
                    </TableHead>
                  )}
                  <TableHead className="p-1 sm:p-2 text-xs sm:text-sm">Nama Supplier</TableHead>
                  <TableHead className="p-1 sm:p-2 text-xs sm:text-sm">Kontak</TableHead>
                  <TableHead className="p-1 sm:p-2 text-xs sm:text-sm">Email</TableHead>
                  <TableHead className="p-1 sm:p-2 text-xs sm:text-sm">Telepon</TableHead>
                  <TableHead className="p-1 sm:p-2 text-xs sm:text-sm text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentSuppliers.length > 0 ? currentSuppliers.map(supplier => (
                  <TableRow key={supplier.id} className="hover:bg-gray-50">
                    {isMultipleSelectMode && (
                      <TableCell className="w-10 p-1 sm:p-2">
                        <input
                          type="checkbox"
                          checked={selectedSupplierIds.includes(supplier.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSupplierIds([...selectedSupplierIds, supplier.id]);
                            } else {
                              setSelectedSupplierIds(selectedSupplierIds.filter(id => id !== supplier.id));
                            }
                          }}
                          className="h-4 w-4 sm:h-5 sm:w-5"
                        />
                      </TableCell>
                    )}
                    <TableCell className="p-1 sm:p-2 text-xs sm:text-sm font-medium">{supplier.nama}</TableCell>
                    <TableCell className="p-1 sm:p-2 text-xs sm:text-sm">{supplier.kontak}</TableCell>
                    <TableCell className="p-1 sm:p-2 text-xs sm:text-sm">{supplier.email || '-'}</TableCell>
                    <TableCell className="p-1 sm:p-2 text-xs sm:text-sm">{supplier.telepon || '-'}</TableCell>
                    <TableCell className="p-1 sm:p-2 text-xs sm:text-sm text-right">
                      <div className="flex gap-1 sm:gap-2 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => openDialog(supplier)} className="h-7 w-7 sm:h-8 sm:w-8"><Edit className="h-3 w-3 sm:h-4 sm:w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-red-500 hover:text-red-700"><Trash2 className="h-3 w-3 sm:h-4 sm:w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent className="max-w-[90%] sm:max-w-md">
                            <AlertDialogHeader><AlertDialogTitle className="text-sm sm:text-base">Anda Yakin?</AlertDialogTitle><AlertDialogDescription className="text-xs sm:text-sm">Tindakan ini akan menghapus supplier secara permanen.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="text-xs sm:text-sm">Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteSupplier(supplier.id)} className="bg-red-600 hover:bg-red-700 text-xs sm:text-sm">Ya, Hapus</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={isMultipleSelectMode ? 6 : 5} className="text-center h-16 sm:h-24 p-2 text-xs sm:text-sm">
                      {searchTerm ? 'Supplier tidak ditemukan.' : 'Belum ada data supplier.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {/* ✨ Pagination Footer */}
        {totalPages > 1 && (
          <CardFooter className="flex flex-col sm:flex-row items-center justify-between p-2 sm:p-4 gap-2 sm:gap-0">
            <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">Menampilkan {Math.min(filteredSuppliers.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredSuppliers.length, currentPage * itemsPerPage)} dari {filteredSuppliers.length} supplier</div>
            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="h-7 w-7 sm:h-8 sm:w-8"><ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" /></Button>
              <span className="px-2 text-xs sm:text-sm font-medium">Hal {currentPage} / {totalPages}</span>
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="h-7 w-7 sm:h-8 sm:w-8"><ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" /></Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95%] sm:max-w-lg max-h-[90vh] flex flex-col p-2 sm:p-4">
          <DialogHeader><DialogTitle className="text-base sm:text-lg">{editingSupplier ? 'Edit Supplier' : 'Tambah Supplier Baru'}</DialogTitle></DialogHeader>
          <div className="flex-grow overflow-y-auto p-1 sm:p-2 space-y-2 sm:space-y-4">
            <div className="grid grid-cols-1 gap-2 sm:gap-4 sm:grid-cols-2">
              <div><Label className="text-xs sm:text-sm">Nama Supplier *</Label><Input id="nama" value={newSupplier.nama} onChange={(e) => setNewSupplier({ ...newSupplier, nama: e.target.value })} className="text-xs sm:text-sm py-1 sm:py-2" /></div>
              <div><Label className="text-xs sm:text-sm">Nama Kontak *</Label><Input id="kontak" value={newSupplier.kontak} onChange={(e) => setNewSupplier({ ...newSupplier, kontak: e.target.value })} className="text-xs sm:text-sm py-1 sm:py-2" /></div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:gap-4 sm:grid-cols-2">
              <div><Label className="text-xs sm:text-sm">Email</Label><Input id="email" type="email" value={newSupplier.email} onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })} className="text-xs sm:text-sm py-1 sm:py-2" /></div>
              <div><Label className="text-xs sm:text-sm">Telepon</Label><Input id="telepon" type="tel" value={newSupplier.telepon} onChange={(e) => setNewSupplier({ ...newSupplier, telepon: e.target.value })} className="text-xs sm:text-sm py-1 sm:py-2" /></div>
            </div>
            <div><Label className="text-xs sm:text-sm">Alamat</Label><Input id="alamat" value={newSupplier.alamat} onChange={(e) => setNewSupplier({ ...newSupplier, alamat: e.target.value })} className="text-xs sm:text-sm py-1 sm:py-2" /></div>
            <div><Label className="text-xs sm:text-sm">Catatan</Label><Input id="catatan" value={newSupplier.catatan} onChange={(e) => setNewSupplier({ ...newSupplier, catatan: e.target.value })} className="text-xs sm:text-sm py-1 sm:py-2" /></div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 sm:pt-4 border-t">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto text-xs sm:text-sm py-1 sm:py-2">Batal</Button>
              <Button onClick={handleSaveSupplier} className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm py-1 sm:py-2">{editingSupplier ? 'Perbarui' : 'Simpan'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupplierManagement;