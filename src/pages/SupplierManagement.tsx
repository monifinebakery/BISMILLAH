import React, { useState, useMemo, useEffect } from 'react';
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

const SupplierManagement = () => {
  // Ambil state & fungsi lengkap dari context
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
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);

  // LOGGING: Untuk diagnosis jika ada fungsi yang tidak terdefinisi
  useEffect(() => {
    console.log("✔️ Inisialisasi SupplierContext:", { addSupplier, updateSupplier, deleteSupplier, bulkDeleteSupplier, toggleSelectionMode });
  }, []);

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

  const allCurrentPageSelected = currentSuppliers.length > 0 && typeof isSelected === 'function' && currentSuppliers.every(supplier => isSelected(supplier.id));

  const handleSelectAllCurrentPage = () => {
    if (typeof toggleSelection !== 'function') return toast.error("Fungsi 'toggleSelection' tidak tersedia.");
    currentSuppliers.forEach(supplier => {
      const isCurrentlySelected = isSelected(supplier.id);
      if (allCurrentPageSelected && isCurrentlySelected) {
        toggleSelection(supplier.id); // Deselect
      } else if (!allCurrentPageSelected && !isCurrentlySelected) {
        toggleSelection(supplier.id); // Select
      }
    });
  };

  const handleSaveSupplier = async () => {
    if (!newSupplier.nama || !newSupplier.kontak) return toast.error('Nama supplier dan kontak wajib diisi');
    const dataToSave = { ...newSupplier, catatan: newSupplier.catatan || null };

    const action = editingSupplier ? updateSupplier : addSupplier;
    if (typeof action !== 'function') return toast.error(`Error: Fungsi ${editingSupplier ? 'updateSupplier' : 'addSupplier'} tidak tersedia.`);
    
    const success = await action(editingSupplier ? editingSupplier.id : dataToSave, editingSupplier ? dataToSave : undefined);
    if (success) setIsDialogOpen(false);
  };

  const openDialog = (supplier: Supplier | null = null) => {
    setEditingSupplier(supplier);
    setNewSupplier(
      supplier ? { ...supplier, email: supplier.email || '', telepon: supplier.telepon || '', alamat: supplier.alamat || '', catatan: supplier.catatan || '' }
               : { nama: '', kontak: '', email: '', telepon: '', alamat: '', catatan: '' }
    );
    setIsDialogOpen(true);
  };
  
  const handleDeleteSingleSupplier = async () => {
    if (!supplierToDelete) return;
    if (typeof deleteSupplier !== 'function') return toast.error("Error: Fungsi 'deleteSupplier' tidak tersedia.");
    await deleteSupplier(supplierToDelete.id);
    setSupplierToDelete(null);
  };
  
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return toast.warning("Tidak ada supplier yang dipilih.");
    if (typeof bulkDeleteSupplier !== 'function') return toast.error("Error: Fungsi 'bulkDeleteSupplier' tidak tersedia.");
    
    const success = await bulkDeleteSupplier(selectedItems);
    if (success) setShowBulkDeleteDialog(false);
  };

  if (isLoading) return <div className="p-6 text-center text-muted-foreground">Memuat data supplier...</div>;

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
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

      <Card>
        <CardHeader><CardTitle>Filter & Aksi</CardTitle></CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input placeholder="Cari Nama Supplier / Kontak..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-10" />
          </div>
          <Button variant="outline" onClick={() => typeof toggleSelectionMode === 'function' ? toggleSelectionMode() : toast.error("Fungsi 'toggleSelectionMode' tidak tersedia.")}>
            {isSelectionMode ? <X className="h-4 w-4 mr-2" /> : <CheckSquare className="h-4 w-4 mr-2" />}
            {isSelectionMode ? "Keluar Mode Pilih" : "Mode Pilih"}
          </Button>
        </CardContent>
      </Card>
      
      {isSelectionMode && (
        <Card className="bg-muted border-primary/20">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Badge variant="secondary" className="text-base">{selectedItems.length} item dipilih</Badge>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => typeof selectAll === 'function' ? selectAll() : toast.error("Fungsi 'selectAll' tidak ada.")}>Pilih Semua ({suppliers.length})</Button>
                <Button variant="outline" size="sm" onClick={() => typeof clearSelection === 'function' ? clearSelection() : toast.error("Fungsi 'clearSelection' tidak ada.")}>Batalkan</Button>
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daftar Supplier ({filteredSuppliers.length})</CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <Label htmlFor="itemsPerPage">Baris:</Label>
              <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="5">5</SelectItem><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {isSelectionMode && (
                    <TableHead className="w-12"><Checkbox checked={allCurrentPageSelected} onCheckedChange={handleSelectAllCurrentPage} /></TableHead>
                  )}
                  <TableHead>Nama Supplier</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentSuppliers.length > 0 ? currentSuppliers.map(supplier => {
                  const isRowSelected = typeof isSelected === 'function' && isSelected(supplier.id);
                  return (
                    <TableRow key={supplier.id} data-state={isRowSelected ? "selected" : ""}>
                        {isSelectionMode && (
                            <TableCell><Checkbox checked={isRowSelected} onCheckedChange={() => typeof toggleSelection === 'function' && toggleSelection(supplier.id)} /></TableCell>
                        )}
                        <TableCell className="font-medium">{supplier.nama}</TableCell>
                        <TableCell>{supplier.kontak}</TableCell>
                        <TableCell>{supplier.email || '-'}</TableCell>
                        <TableCell>{supplier.telepon || '-'}</TableCell>
                        <TableCell className="text-right">
                          {!isSelectionMode && (
                            <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openDialog(supplier)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => setSupplierToDelete(supplier)}><Trash2 className="mr-2 h-4 w-4" /> Hapus</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow><TableCell colSpan={isSelectionMode ? 6 : 5} className="text-center h-24">{searchTerm ? 'Supplier tidak ditemukan.' : 'Belum ada data supplier.'}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {totalPages > 1 && (
          <CardFooter className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-muted-foreground">Halaman {currentPage} dari {totalPages}</div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </CardFooter>
        )}
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>{/* ... Konten Dialog Form Tambah/Edit ... */}</Dialog>
      
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="text-red-500" />Konfirmasi Hapus</AlertDialogTitle><AlertDialogDescription>Anda yakin ingin menghapus <strong>{selectedItems.length} supplier</strong> yang dipilih? Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={isBulkDeleting} className="bg-red-600 hover:bg-red-700">{isBulkDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} Ya, Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!supplierToDelete} onOpenChange={(open) => !open && setSupplierToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Anda Yakin?</AlertDialogTitle><AlertDialogDescription>Tindakan ini akan menghapus supplier <strong>{supplierToDelete?.nama}</strong> secara permanen.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSingleSupplier} className="bg-red-600 hover:bg-red-700">Ya, Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SupplierManagement;