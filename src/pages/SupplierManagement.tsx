import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Users, Plus, Edit, Trash2, Search, ChevronLeft, ChevronRight, MoreHorizontal, CheckSquare, X, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Supplier } from '@/types/supplier';
import { useSupplier } from '@/contexts/SupplierContext';
import { cn } from '@/lib/utils';


const SupplierManagement = () => {
  // ✨ Ambil state & fungsi baru dari context untuk selection dan bulk delete
  const { 
    suppliers, isLoading, addSupplier, updateSupplier, deleteSupplier,
    selectedItems, isSelectionMode, isBulkDeleting,
    toggleSelection, selectAll, clearSelection, toggleSelectionMode, isSelected, bulkDeleteSupplier
  } = useSupplier();
  
  // State lokal untuk UI
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [newSupplier, setNewSupplier] = useState({
    nama: '', kontak: '', email: '', telepon: '', alamat: '', catatan: '',
  });
  // ✨ State untuk dialog konfirmasi bulk delete
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

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

  // ✨ Logic untuk checkbox "select all"
  const allCurrentPageSelected = currentSuppliers.length > 0 && currentSuppliers.every(supplier => isSelected(supplier.id));
  const someCurrentPageSelected = currentSuppliers.some(supplier => isSelected(supplier.id)) && !allCurrentPageSelected;

  const handleSelectAllCurrentPage = () => {
    currentSuppliers.forEach(supplier => {
        if (allCurrentPageSelected) {
            // Deselect all
            if (isSelected(supplier.id)) toggleSelection(supplier.id);
        } else {
            // Select all
            if (!isSelected(supplier.id)) toggleSelection(supplier.id);
        }
    });
  };

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

  const handleDeleteSingleSupplier = (id: string) => deleteSupplier(id);

  // ✨ Fungsi untuk menjalankan bulk delete
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      toast.warning("Tidak ada supplier yang dipilih.");
      return;
    }
    const success = await bulkDeleteSupplier(selectedItems);
    if (success) {
      setShowBulkDeleteDialog(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center text-muted-foreground">Memuat data supplier...</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-full"><Users className="h-8 w-8 text-white" /></div>
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Manajemen Supplier</h1>
                <p className="text-muted-foreground">Kelola semua informasi partner dan pemasok Anda.</p>
            </div>
        </div>
        <Button onClick={() => openDialog(null)} className="mt-4 sm:mt-0 w-full sm:w-auto"><Plus className="h-4 w-4 mr-2" /> Tambah Supplier</Button>
      </div>

      {/* Filter Card */}
      <Card>
        <CardHeader><CardTitle>Filter & Aksi</CardTitle></CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari Nama Supplier / Kontak..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-10"
            />
          </div>
          {/* ✨ Tombol untuk mengaktifkan Mode Pilih */}
          <Button variant={isSelectionMode ? "secondary" : "outline"} onClick={toggleSelectionMode}>
            {isSelectionMode ? <X className="h-4 w-4 mr-2" /> : <CheckSquare className="h-4 w-4 mr-2" />}
            {isSelectionMode ? "Keluar Mode Pilih" : "Mode Pilih"}
          </Button>
        </CardContent>
      </Card>
      
      {/* ✨ Toolbar Aksi Bulk */}
      {isSelectionMode && (
        <Card className="bg-muted">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <span className="font-semibold">Mode Pilih Aktif:</span>
                <Badge variant="secondary">{selectedItems.length} item dipilih</Badge>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => selectAll(filteredSuppliers.map(s => s.id))}>Pilih Semua ({filteredSuppliers.length})</Button>
                <Button variant="outline" size="sm" onClick={clearSelection}>Batalkan Pilihan</Button>
                {selectedItems.length > 0 && (
                  <Button variant="destructive" size="sm" onClick={() => setShowBulkDeleteDialog(true)} disabled={isBulkDeleting}>
                    {isBulkDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    Hapus Terpilih
                  </Button>
                )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Card */}
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
                  {/* ✨ Kolom Checkbox */}
                  {isSelectionMode && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allCurrentPageSelected || (someCurrentPageSelected && 'indeterminate')}
                        onCheckedChange={handleSelectAllCurrentPage}
                      />
                    </TableHead>
                  )}
                  <TableHead>Nama Supplier</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentSuppliers.length > 0 ? currentSuppliers.map(supplier => (
                  <TableRow key={supplier.id} data-state={isSelected(supplier.id) ? "selected" : ""}>
                    {/* ✨ Sel Checkbox */}
                    {isSelectionMode && (
                        <TableCell>
                          <Checkbox checked={isSelected(supplier.id)} onCheckedChange={() => toggleSelection(supplier.id)} />
                        </TableCell>
                    )}
                    <TableCell className="font-medium">{supplier.nama}</TableCell>
                    <TableCell>{supplier.kontak}</TableCell>
                    <TableCell>{supplier.email || '-'}</TableCell>
                    <TableCell>{supplier.telepon || '-'}</TableCell>
                    <TableCell className="text-right">
                      {/* ✨ Sembunyikan aksi jika dalam mode pilih */}
                      {!isSelectionMode && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openDialog(supplier)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteSingleSupplier(supplier.id)}><Trash2 className="mr-2 h-4 w-4" /> Hapus</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={isSelectionMode ? 6 : 5} className="text-center h-24">
                      {searchTerm ? 'Supplier tidak ditemukan.' : 'Belum ada data supplier.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {totalPages > 1 && (
          <CardFooter className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-muted-foreground">Menampilkan {Math.min(filteredSuppliers.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredSuppliers.length, currentPage * itemsPerPage)} dari {filteredSuppliers.length} supplier</div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="px-4 text-sm font-medium">Hal {currentPage} / {totalPages}</span>
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </CardFooter>
        )}
      </Card>
      
      {/* Dialog Form Tambah/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
         {/* ... (Konten Dialog Form tidak berubah) ... */}
      </Dialog>
      
      {/* ✨ Dialog Konfirmasi Bulk Delete */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-red-500" />Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus <strong>{selectedItems.length} supplier</strong> yang dipilih? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={isBulkDeleting} className="bg-red-600 hover:bg-red-700">
              {isBulkDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SupplierManagement;