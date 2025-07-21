import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, Plus, Edit, Trash2, Phone, Mail, Search, ChevronLeft, ChevronRight,
  CheckSquare, X, Loader2, MoreHorizontal, Eye, MapPin, FileText,
  AlertTriangle, Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { Supplier } from '@/types/supplier';
import { useSupplier } from '@/contexts/SupplierContext';
import { cn } from '@/lib/utils';

const SupplierManagement = () => {
  const { suppliers, isLoading, addSupplier, updateSupplier, deleteSupplier } = useSupplier();
  
  // Form and dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [newSupplier, setNewSupplier] = useState({
    nama: '', kontak: '', email: '', telepon: '', alamat: '', catatan: '',
  });

  // Table and pagination state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Bulk selection state
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // Filtered and paginated data
  const filteredSuppliers = useMemo(() => 
    suppliers.filter(supplier =>
      supplier.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.kontak.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (supplier.telepon && supplier.telepon.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [suppliers, searchTerm]);

  const currentSuppliers = useMemo(() => {
    const firstItemIndex = (currentPage - 1) * itemsPerPage;
    return filteredSuppliers.slice(firstItemIndex, firstItemIndex + itemsPerPage);
  }, [filteredSuppliers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);

  // Bulk selection functions
  const toggleSupplierSelection = (id: string) => {
    setSelectedSuppliers(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const selectAllSuppliers = () => {
    setSelectedSuppliers(filteredSuppliers.map(supplier => supplier.id));
  };

  const clearSupplierSelection = () => {
    setSelectedSuppliers([]);
    setIsSelectionMode(false);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(prev => !prev);
    if (isSelectionMode) {
      setSelectedSuppliers([]);
    }
  };

  const isSupplierSelected = (id: string) => selectedSuppliers.includes(id);

  const getSelectedSuppliers = () => {
    return filteredSuppliers.filter(supplier => selectedSuppliers.includes(supplier.id));
  };

  const allCurrentSelected = currentSuppliers.length > 0 && currentSuppliers.every(supplier => isSupplierSelected(supplier.id));
  const someCurrentSelected = currentSuppliers.some(supplier => isSupplierSelected(supplier.id)) && !allCurrentSelected;

  const handleSelectAllCurrent = () => {
    if (allCurrentSelected) {
      currentSuppliers.forEach(supplier => {
        if (isSupplierSelected(supplier.id)) {
          toggleSupplierSelection(supplier.id);
        }
      });
    } else {
      currentSuppliers.forEach(supplier => {
        if (!isSupplierSelected(supplier.id)) {
          toggleSupplierSelection(supplier.id);
        }
      });
    }
  };

  // Bulk delete function
  const handleBulkDeleteSuppliers = async () => {
    if (selectedSuppliers.length === 0) {
      toast.warning('Pilih supplier yang ingin dihapus terlebih dahulu');
      return;
    }

    setIsBulkDeleting(true);
    try {
      let successCount = 0;
      const suppliersToDelete = getSelectedSuppliers();
      
      // Optimistic update - remove from UI first
      const previousSuppliers = [...suppliers];
      
      for (const supplierId of selectedSuppliers) {
        const success = await deleteSupplier(supplierId);
        if (success) successCount++;
      }

      if (successCount === selectedSuppliers.length) {
        toast.success(`${successCount} supplier berhasil dihapus!`);
        setSelectedSuppliers([]);
        setIsSelectionMode(false);
        setShowBulkDeleteDialog(false);
      } else if (successCount > 0) {
        toast.warning(`${successCount} dari ${selectedSuppliers.length} supplier berhasil dihapus`);
        // Refresh selection to remove successfully deleted items
        setSelectedSuppliers(prev => prev.filter(id => 
          !suppliersToDelete.slice(0, successCount).map(s => s.id).includes(id)
        ));
      } else {
        toast.error('Gagal menghapus supplier');
      }
    } catch (error) {
      console.error('Error bulk deleting suppliers:', error);
      toast.error('Terjadi kesalahan saat menghapus supplier');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Form handling
  const handleSaveSupplier = async () => {
    if (!newSupplier.nama || !newSupplier.kontak) {
      toast.error('Nama supplier dan nama kontak wajib diisi');
      return;
    }
    
    const dataToSave = { ...newSupplier, catatan: newSupplier.catatan || null };
    const success = editingSupplier 
      ? await updateSupplier(editingSupplier.id, dataToSave)
      : await addSupplier(dataToSave);

    if (success) {
      setIsDialogOpen(false);
      resetForm();
    }
  };

  const openDialog = (supplier: Supplier | null = null) => {
    setEditingSupplier(supplier);
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

  const resetForm = () => {
    setNewSupplier({
      nama: '', kontak: '', email: '', telepon: '', alamat: '', catatan: ''
    });
    setEditingSupplier(null);
  };

  const handleDeleteSupplier = async (id: string, name: string) => {
    const success = await deleteSupplier(id);
    if (success) {
      toast.success(`Supplier "${name}" berhasil dihapus`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Memuat data supplier...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-4 sm:p-8 space-y-8">
        {/* Enhanced Header */}
        <div className="bg-white rounded-2xl shadow-xl border-0 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Manajemen Supplier</h1>
                  <p className="text-blue-100 text-lg mt-1">
                    Kelola semua partner dan pemasok bisnis Anda
                  </p>
                  <p className="text-blue-200 text-sm mt-1">
                    Total {filteredSuppliers.length} supplier terdaftar
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <Button
                  onClick={() => openDialog(null)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow-md hover:bg-gray-100 transition-all duration-200"
                >
                  <Plus className="h-5 w-5" />
                  Tambah Supplier
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {(isSelectionMode || selectedSuppliers.length > 0) && (
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-700">Mode Pilih Multiple</span>
                  </div>
                  {selectedSuppliers.length > 0 && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1 font-semibold">
                      {selectedSuppliers.length} supplier dipilih
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSupplierSelection}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Batalkan
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllSuppliers}
                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    Pilih Semua ({filteredSuppliers.length})
                  </Button>

                  {selectedSuppliers.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowBulkDeleteDialog(true)}
                      disabled={isBulkDeleting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isBulkDeleting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Hapus {selectedSuppliers.length} Supplier
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
                  onClick={toggleSelectionMode}
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
                  placeholder="Cari supplier, kontak, email, atau telepon..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="pl-10 border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 w-full lg:w-80"
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
                        ref={(el) => {
                          if (el) el.indeterminate = someCurrentSelected;
                        }}
                        onCheckedChange={handleSelectAllCurrent}
                        className="border-gray-400"
                      />
                    )}
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">Supplier</TableHead>
                  <TableHead className="font-semibold text-gray-700">Kontak Person</TableHead>
                  <TableHead className="font-semibold text-gray-700">Email</TableHead>
                  <TableHead className="font-semibold text-gray-700">Telepon</TableHead>
                  <TableHead className="font-semibold text-gray-700">Alamat</TableHead>
                  <TableHead className="text-center font-semibold text-gray-700 w-20">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentSuppliers.length > 0 ? (
                  currentSuppliers.map((supplier, index) => (
                    <TableRow 
                      key={supplier.id} 
                      className={cn(
                        "hover:bg-blue-50/50 transition-colors border-b border-gray-100",
                        isSupplierSelected(supplier.id) && "bg-blue-50 border-l-4 border-l-blue-500",
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                      )}
                    >
                      <TableCell className="p-4">
                        {isSelectionMode && (
                          <Checkbox
                            checked={isSupplierSelected(supplier.id)}
                            onCheckedChange={() => toggleSupplierSelection(supplier.id)}
                            className="border-gray-400"
                          />
                        )}
                      </TableCell>
                      
                      <TableCell className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <Building2 className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{supplier.nama}</p>
                            {supplier.catatan && (
                              <p className="text-xs text-gray-500 mt-1 truncate max-w-[200px]" title={supplier.catatan}>
                                {supplier.catatan}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="p-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-800">{supplier.kontak}</span>
                        </div>
                      </TableCell>

                      <TableCell className="p-4">
                        {supplier.email ? (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <a 
                              href={`mailto:${supplier.email}`} 
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {supplier.email}
                            </a>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>

                      <TableCell className="p-4">
                        {supplier.telepon ? (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <a 
                              href={`tel:${supplier.telepon}`} 
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {supplier.telepon}
                            </a>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>

                      <TableCell className="p-4">
                        {supplier.alamat ? (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-700 truncate max-w-[150px]" title={supplier.alamat}>
                              {supplier.alamat}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>

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
                                Edit Supplier
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer">
                                <Eye className="h-4 w-4 mr-2" />
                                Lihat Detail
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteSupplier(supplier.id, supplier.nama)} 
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
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-4">
                        <Users className="h-16 w-16 text-gray-300" />
                        <div className="text-center">
                          <p className="text-lg font-medium text-gray-600 mb-2">
                            {searchTerm ? 'Supplier tidak ditemukan' : 'Belum ada data supplier'}
                          </p>
                          <p className="text-gray-500 text-sm mb-4">
                            {searchTerm ? 'Coba ubah kata kunci pencarian Anda' : 'Mulai dengan menambahkan supplier pertama'}
                          </p>
                        </div>
                        {!searchTerm && (
                          <Button
                            onClick={() => openDialog(null)}
                            className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-md transition-all duration-200"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Supplier Pertama
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Footer */}
          {filteredSuppliers.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:px-6 border-t border-gray-200 bg-gray-50/50">
              <div className="text-sm text-gray-600 mb-4 sm:mb-0">
                Showing <span className="font-semibold">{Math.min(filteredSuppliers.length, (currentPage - 1) * itemsPerPage + 1)}</span> to{' '}
                <span className="font-semibold">{Math.min(filteredSuppliers.length, currentPage * itemsPerPage)}</span> of{' '}
                <span className="font-semibold">{filteredSuppliers.length}</span> suppliers
                {selectedSuppliers.length > 0 && (
                  <span className="ml-2 text-blue-600 font-medium">
                    ({selectedSuppliers.length} selected)
                  </span>
                )}
              </div>
              {totalPages > 1 && (
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
                          ? "bg-blue-500 text-white shadow-md hover:bg-blue-600"
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
              )}
            </div>
          )}
        </div>

        {/* Bulk Delete Confirmation Dialog */}
        <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Konfirmasi Hapus Multiple Supplier
              </AlertDialogTitle>
              <AlertDialogDescription>
                Anda akan menghapus <strong>{selectedSuppliers.length} supplier</strong>:
                
                <div className="mt-3 p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                  <ul className="space-y-1">
                    {getSelectedSuppliers().slice(0, 5).map((supplier) => (
                      <li key={supplier.id} className="flex items-center gap-2 text-sm">
                        <Trash2 className="h-3 w-3 text-red-500 flex-shrink-0" />
                        <span className="font-medium">{supplier.nama}</span>
                        <span className="text-gray-500">({supplier.kontak})</span>
                      </li>
                    ))}
                    {selectedSuppliers.length > 5 && (
                      <li className="text-sm text-gray-500 italic">
                        ... dan {selectedSuppliers.length - 5} supplier lainnya
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
              <AlertDialogCancel disabled={isBulkDeleting}>
                Batal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBulkDeleteSuppliers}
                disabled={isBulkDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isBulkDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Hapus {selectedSuppliers.length} Supplier
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add/Edit Supplier Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                {editingSupplier ? (
                  <>
                    <Edit className="h-5 w-5" />
                    Edit Supplier
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    Tambah Supplier Baru
                  </>
                )}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nama" className="font-medium text-gray-700">Nama Supplier *</Label>
                  <Input 
                    id="nama" 
                    value={newSupplier.nama} 
                    onChange={(e) => setNewSupplier({ ...newSupplier, nama: e.target.value })} 
                    placeholder="PT. Supplier Utama"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="kontak" className="font-medium text-gray-700">Nama Kontak *</Label>
                  <Input 
                    id="kontak" 
                    value={newSupplier.kontak} 
                    onChange={(e) => setNewSupplier({ ...newSupplier, kontak: e.target.value })} 
                    placeholder="Budi Santoso"
                    className="mt-1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="font-medium text-gray-700">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={newSupplier.email} 
                    onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })} 
                    placeholder="kontak@supplier.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="telepon" className="font-medium text-gray-700">Telepon</Label>
                  <Input 
                    id="telepon" 
                    type="tel" 
                    value={newSupplier.telepon} 
                    onChange={(e) => setNewSupplier({ ...newSupplier, telepon: e.target.value })} 
                    placeholder="+62 812 3456 7890"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="alamat" className="font-medium text-gray-700">Alamat</Label>
                <Textarea 
                  id="alamat" 
                  value={newSupplier.alamat} 
                  onChange={(e) => setNewSupplier({ ...newSupplier, alamat: e.target.value })} 
                  rows={3}
                  placeholder="Jl. Supplier No. 123, Jakarta"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="catatan" className="font-medium text-gray-700">Catatan</Label>
                <Textarea 
                  id="catatan" 
                  value={newSupplier.catatan} 
                  onChange={(e) => setNewSupplier({ ...newSupplier, catatan: e.target.value })} 
                  rows={3}
                  placeholder="Catatan tambahan tentang supplier..."
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button 
                  onClick={handleSaveSupplier} 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {editingSupplier ? (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Perbarui Supplier
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Supplier
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SupplierManagement;