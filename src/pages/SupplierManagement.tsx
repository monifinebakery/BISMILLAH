import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Users, Plus, AlertTriangle, Edit, Trash2, Search, ChevronLeft, ChevronRight, CheckSquare, X, Loader2, MoreHorizontal } from 'lucide-react';
import { useSupplier } from '@/contexts/SupplierContext';
import { toast } from 'sonner';
import { Supplier } from '@/types/supplier';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Eye } from 'lucide-react';

const SupplierManagement = () => {
  const { suppliers, isLoading, addSupplier, updateSupplier, deleteSupplier } = useSupplier();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  const [newSupplier, setNewSupplier] = useState({
    nama: '', kontak: '', email: '', telepon: '', alamat: '', catatan: '',
  });

  // 🔧 FIXED: Enhanced validation with optional email
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!newSupplier.nama.trim()) {
      errors.nama = 'Nama supplier wajib diisi';
    }
    
    if (!newSupplier.kontak.trim()) {
      errors.kontak = 'Nama kontak wajib diisi';
    }
    
    // 🔧 FIXED: Email validation only if provided
    if (newSupplier.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newSupplier.email)) {
      errors.email = 'Format email tidak valid';
    }
    
    // Validate phone number if provided
    if (newSupplier.telepon.trim() && !/^[\d\s\-\+\(\)]+$/.test(newSupplier.telepon)) {
      errors.telepon = 'Format nomor telepon tidak valid';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveSupplier = async () => {
    if (!validateForm()) {
      toast.error('Mohon periksa kembali data yang diisi');
      return;
    }

    // 🔧 FIXED: Clean data before saving - make email optional
    const dataToSave = { 
      ...newSupplier, 
      email: newSupplier.email.trim() || null, // Optional email
      telepon: newSupplier.telepon.trim() || null,
      alamat: newSupplier.alamat.trim() || null,
      catatan: newSupplier.catatan.trim() || null 
    };
    
    const success = editingSupplier 
      ? await updateSupplier(editingSupplier.id, dataToSave)
      : await addSupplier(dataToSave);

    if (success) {
      setIsDialogOpen(false);
      setEditingSupplier(null);
      setFormErrors({});
      setSelectedSupplierIds(prev => prev.filter(id => id !== (editingSupplier?.id || '')));
    }
  };

  const openDialog = (supplier: Supplier | null = null) => {
    setEditingSupplier(supplier);
    setFormErrors({});
    setNewSupplier(
      supplier ? {
        nama: supplier.nama, 
        kontak: supplier.kontak, 
        email: supplier.email || '',
        telepon: supplier.telepon || '', 
        alamat: supplier.alamat || '', 
        catatan: supplier.catatan || ''
      } : {
        nama: '', kontak: '', email: '', telepon: '', alamat: '', catatan: ''
      }
    );
    setIsDialogOpen(true);
  };

  const handleDeleteSupplier = async (id: string) => {
    setSelectedSupplierIds(prev => prev.filter(sId => sId !== id)); // Update state sebelum penghapusan
    await deleteSupplier(id);
    toast.success('Supplier berhasil dihapus.');
  };

  const handleBulkDelete = async () => {
    if (selectedSupplierIds.length === 0) {
      toast.warning('Pilih item yang ingin dihapus terlebih dahulu');
      return;
    }
    setSelectedSupplierIds([]); // Bersihkan state seleksi sebelum penghapusan
    const success = await Promise.all(selectedSupplierIds.map(id => deleteSupplier(id)));
    if (success.every(s => s)) {
      setShowBulkDeleteDialog(false);
      setIsSelectionMode(false);
      toast.success('Supplier berhasil dihapus!');
    }
  };

  const toggleSelectAllCurrent = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedSupplierIds(prev => [...new Set([...prev, ...currentSuppliers.map(s => s.id)])]);
    } else {
      setSelectedSupplierIds(prev => prev.filter(id => !currentSuppliers.some(s => s.id === id)));
    }
  };

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
  const allCurrentSelected = currentSuppliers.length > 0 && currentSuppliers.every(s => selectedSupplierIds.includes(s.id));
  const someCurrentSelected = currentSuppliers.some(s => selectedSupplierIds.includes(s.id)) && !allCurrentSelected;

  return (
    <div className="container mx-auto p-4 sm:p-8">
      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-6 mb-8 shadow-xl">
        <div className="flex items-center gap-4 mb-4 lg:mb-0">
          <div className="flex-shrink-0 bg-white bg-opacity-20 p-3 rounded-xl backdrop-blur-sm">
            <Users className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Manajemen Supplier</h1>
            <p className="text-sm opacity-90 mt-1">Kelola semua informasi partner dan pemasok Anda dengan mudah.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <Button
            onClick={() => openDialog(null)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-orange-600 font-semibold rounded-lg shadow-md hover:bg-gray-100 transition-all duration-200 hover:shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Tambah Supplier
          </Button>
        </div>
      </header>

      {/* Bulk Actions Toolbar */}
      {(isSelectionMode || selectedSupplierIds.length > 0) && (
        <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-700">Mode Pilih Multiple</span>
                </div>
                {selectedSupplierIds.length > 0 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1 font-semibold">
                    {selectedSupplierIds.length} item dipilih
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setSelectedSupplierIds([]); setIsSelectionMode(false); }}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Batalkan
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allIds = filteredSuppliers.map(s => s.id);
                    setSelectedSupplierIds(prev => prev.length === allIds.length ? [] : allIds);
                  }}
                  className="border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  Pilih Semua ({filteredSuppliers.length})
                </Button>
                {selectedSupplierIds.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowBulkDeleteDialog(true)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus {selectedSupplierIds.length} Item
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-200/80 overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50/50">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Label htmlFor="show-entries" className="whitespace-nowrap font-medium">Show</Label>
                <Select value={String(itemsPerPage)} onValueChange={(value) => { setItemsPerPage(Number(value)); setCurrentPage(1); }}>
                  <SelectTrigger className="w-20 border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="font-medium">entries</span>
              </div>
              <Button
                variant={isSelectionMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsSelectionMode(!isSelectionMode)}
                className={isSelectionMode ? "bg-blue-600 hover:bg-blue-700" : "border-blue-300 text-blue-600 hover:bg-blue-50"}
              >
                {isSelectionMode ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Keluar Mode Pilih
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Mode Pilih
                  </>
                )}
              </Button>
            </div>
            <div className="w-full lg:w-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cari Nama Supplier / Kontak..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-10 border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 w-full lg:w-80"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <Table className="min-w-full text-sm text-left text-gray-700">
            <TableHeader>
              <TableRow className="bg-gray-50 border-b border-gray-200">
                <TableHead className="w-12 p-4">
                  {isSelectionMode && (
                    <Checkbox
                      checked={allCurrentSelected}
                      ref={(el) => { if (el) el.indeterminate = someCurrentSelected; }}
                      onCheckedChange={toggleSelectAllCurrent}
                      className="border-gray-400"
                    />
                  )}
                </TableHead>
                <TableHead className="font-semibold text-gray-700">Nama Supplier</TableHead>
                <TableHead className="font-semibold text-gray-700">Kontak</TableHead>
                <TableHead className="font-semibold text-gray-700">Email</TableHead>
                <TableHead className="font-semibold text-gray-700">Telepon</TableHead>
                <TableHead className="text-center font-semibold text-gray-700 w-20">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                      <span className="text-gray-500 font-medium">Memuat data supplier...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <Users className="h-16 w-16 text-gray-300" />
                      <div className="text-center">
                        <p className="text-lg font-medium text-gray-600 mb-2">
                          {searchTerm ? 'Tidak ada supplier yang cocok dengan pencarian' : 'Belum ada data supplier'}
                        </p>
                        <p className="text-gray-500 text-sm mb-4">
                          {searchTerm ? 'Coba ubah kata kunci pencarian Anda' : 'Mulai dengan menambahkan supplier pertama'}
                        </p>
                      </div>
                      {!searchTerm && (
                        <Button
                          onClick={() => openDialog(null)}
                          className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow-md transition-all duration-200"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Tambah Supplier Pertama
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                currentSuppliers.map((supplier, index) => (
                  <TableRow
                    key={supplier.id}
                    className={cn(
                      "hover:bg-orange-50/50 transition-colors border-b border-gray-100",
                      selectedSupplierIds.includes(supplier.id) && "bg-blue-50 border-l-4 border-l-blue-500",
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    )}
                  >
                    <TableCell className="p-4">
                      {isSelectionMode && (
                        <Checkbox
                          checked={selectedSupplierIds.includes(supplier.id)}
                          onCheckedChange={(checked) => {
                            setSelectedSupplierIds(prev => 
                              checked ? [...prev, supplier.id] : prev.filter(id => id !== supplier.id)
                            );
                          }}
                          className="border-gray-400"
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900 p-4">{supplier.nama}</TableCell>
                    <TableCell className="p-4">{supplier.kontak}</TableCell>
                    <TableCell className="p-4">
                      {supplier.email ? (
                        <span className="text-blue-600 hover:text-blue-800">
                          {supplier.email}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Tidak ada email</span>
                      )}
                    </TableCell>
                    <TableCell className="p-4">{supplier.telepon || '-'}</TableCell>
                    <TableCell className="text-center p-4">
                      {!isSelectionMode && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => openDialog(supplier)} className="cursor-pointer">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteSupplier(supplier.id)}
                              className="cursor-pointer text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {filteredSuppliers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:px-6 border-t border-gray-200 bg-gray-50/50">
            <div className="text-sm text-gray-600 mb-4 sm:mb-0">
              Showing <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filteredSuppliers.length)}</span> of{' '}
              <span className="font-semibold">{filteredSuppliers.length}</span> entries
              {selectedSupplierIds.length > 0 && (
                <span className="ml-2 text-blue-600 font-medium">
                  ({selectedSupplierIds.length} selected)
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-gray-100"
                onClick={() => setCurrentPage(p => p - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "h-9 w-9",
                    currentPage === page
                      ? "bg-orange-500 text-white shadow-md hover:bg-orange-600"
                      : "hover:bg-gray-100"
                  )}
                  variant={currentPage === page ? "default" : "ghost"}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 hover:bg-gray-100"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Konfirmasi Hapus Multiple Item
            </AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menghapus <strong>{selectedSupplierIds.length} item</strong> supplier:
              <div className="mt-3 p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                <ul className="space-y-1">
                  {currentSuppliers.filter(s => selectedSupplierIds.includes(s.id)).slice(0, 5).map(s => (
                    <li key={s.id} className="flex items-center gap-2 text-sm">
                      <Trash2 className="h-3 w-3 text-red-500 flex-shrink-0" />
                      <span className="font-medium">{s.nama}</span>
                    </li>
                  ))}
                  {selectedSupplierIds.length > 5 && (
                    <li className="text-sm text-gray-500 italic">
                      ... dan {selectedSupplierIds.length - 5} item lainnya
                    </li>
                  )}
                </ul>
              </div>
              <p className="mt-3 text-red-600 font-medium text-sm">
                ⚠️ Tindakan ini tidak dapat dibatalkan!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus {selectedSupplierIds.length} Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">
              {editingSupplier ? 'Edit Supplier' : 'Tambah Supplier'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleSaveSupplier(); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
              <div className="md:col-span-2">
                <Label htmlFor="nama" className="font-medium">
                  Nama Supplier <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nama"
                  value={newSupplier.nama}
                  onChange={(e) => setNewSupplier({ ...newSupplier, nama: e.target.value })}
                  placeholder="Masukkan nama supplier"
                  required
                  className={cn("mt-1", formErrors.nama && "border-red-500")}
                />
                {formErrors.nama && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.nama}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="kontak" className="font-medium">
                  Nama Kontak <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="kontak"
                  value={newSupplier.kontak}
                  onChange={(e) => setNewSupplier({ ...newSupplier, kontak: e.target.value })}
                  placeholder="Masukkan nama kontak"
                  required
                  className={cn("mt-1", formErrors.kontak && "border-red-500")}
                />
                {formErrors.kontak && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.kontak}</p>
                )}
              </div>
              
              {/* 🔧 FIXED: Email field made optional */}
              <div>
                <Label htmlFor="email" className="font-medium">
                  Email <span className="text-gray-400 text-sm">(opsional)</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                  placeholder="email@contoh.com"
                  className={cn("mt-1", formErrors.email && "border-red-500")}
                />
                {formErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  Email tidak wajib diisi, namun jika diisi harap gunakan format yang benar
                </p>
              </div>
              
              <div>
                <Label htmlFor="telepon" className="font-medium">
                  Telepon <span className="text-gray-400 text-sm">(opsional)</span>
                </Label>
                <Input
                  id="telepon"
                  type="tel"
                  value={newSupplier.telepon}
                  onChange={(e) => setNewSupplier({ ...newSupplier, telepon: e.target.value })}
                  placeholder="08xx-xxxx-xxxx"
                  className={cn("mt-1", formErrors.telepon && "border-red-500")}
                />
                {formErrors.telepon && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.telepon}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="alamat" className="font-medium">
                  Alamat <span className="text-gray-400 text-sm">(opsional)</span>
                </Label>
                <Input
                  id="alamat"
                  value={newSupplier.alamat}
                  onChange={(e) => setNewSupplier({ ...newSupplier, alamat: e.target.value })}
                  placeholder="Masukkan alamat lengkap"
                  className="mt-1"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="catatan" className="font-medium">
                  Catatan <span className="text-gray-400 text-sm">(opsional)</span>
                </Label>
                <Input
                  id="catatan"
                  value={newSupplier.catatan}
                  onChange={(e) => setNewSupplier({ ...newSupplier, catatan: e.target.value })}
                  placeholder="Catatan tambahan tentang supplier"
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg mt-4">
              <p className="text-sm text-blue-700">
                <span className="font-medium">Catatan:</span> Hanya Nama Supplier dan Nama Kontak yang wajib diisi. Field lainnya bersifat opsional.
              </p>
            </div>
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                {editingSupplier ? 'Perbarui' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupplierManagement;