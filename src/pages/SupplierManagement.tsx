import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Users, Plus, Edit, Trash2, Mail, Phone, MapPin, Search, ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Supplier } from '@/types/supplier';
import { useSupplier } from '@/contexts/SupplierContext'; // Pastikan path benar
import { formatDateForDisplay } from '@/utils/dateUtils';
import { cn } from '@/lib/utils'; // Pastikan cn diimpor jika digunakan

const SupplierManagement = () => {
  const { suppliers, loading, addSupplier, updateSupplier, deleteSupplier } = useSupplier();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Supplier; direction: 'asc' | 'desc' } | null>({ key: 'nama', direction: 'asc' });
  const [selectedRows, setSelectedRows] = useState<string[]>([]); // Untuk checkbox

  // State untuk form tambah/edit
  const [supplierFormData, setSupplierFormData] = useState({
    nama: '', kontak: '', email: '', telepon: '', alamat: '', catatan: '',
  });

  // Memoized filtering, sorting, and pagination logic
  const sortedSuppliers = useMemo(() => {
    let filtered = suppliers.filter(supplier =>
      supplier.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.kontak.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (supplier.telepon && supplier.telepon.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        const valA = a[sortConfig.key] || '';
        const valB = b[sortConfig.key] || '';
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        // Fallback for date sorting
        if (sortConfig.key === 'createdAt' && a.createdAt instanceof Date && b.createdAt instanceof Date) {
          return sortConfig.direction === 'asc' ? a.createdAt.getTime() - b.createdAt.getTime() : b.createdAt.getTime() - a.createdAt.getTime();
        }
        return 0;
      });
    }
    return filtered;
  }, [suppliers, searchTerm, sortConfig]);

  const paginatedSuppliers = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    return sortedSuppliers.slice(startIndex, startIndex + entriesPerPage);
  }, [sortedSuppliers, currentPage, entriesPerPage]);

  const totalPages = Math.ceil(sortedSuppliers.length / entriesPerPage);
  
  const handleSort = (key: keyof Supplier) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setCurrentPage(1); // Reset to first page on sort
    setSortConfig({ key, direction });
  };

  // Handlers untuk Select All dan Select Row (untuk implementasi checkbox)
  const handleSelectAll = (checked: boolean) => setSelectedRows(checked ? paginatedSuppliers.map(s => s.id) : []);
  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedRows(prev => checked ? [...prev, id] : prev.filter(rowId => rowId !== id));
  };
  
  const handleOpenDialog = (supplier: Supplier | null = null) => {
    setEditingSupplier(supplier);
    if (supplier) {
      setSupplierFormData({
        nama: supplier.nama, kontak: supplier.kontak, email: supplier.email || '',
        telepon: supplier.telepon || '', alamat: supplier.alamat || '', catatan: supplier.catatan || '',
      });
    } else {
      setSupplierFormData({ nama: '', kontak: '', email: '', telepon: '', alamat: '', catatan: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSaveSupplier = async () => {
    if (!supplierFormData.nama || !supplierFormData.kontak) {
      toast.error('Nama supplier dan kontak wajib diisi');
      return;
    }

    const dataToSave: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'userId'> = {
        ...supplierFormData,
        catatan: supplierFormData.catatan === '' ? null : supplierFormData.catatan,
    };

    let success = false;
    if (editingSupplier) {
      success = await updateSupplier(editingSupplier.id, dataToSave);
    } else {
      success = await addSupplier(dataToSave);
    }

    if (success) {
      setIsDialogOpen(false);
      setEditingSupplier(null);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus supplier ini?")) {
      await toast.promise(deleteSupplier(id), {
        loading: 'Menghapus supplier...',
        success: 'Supplier berhasil dihapus!',
        error: (err) => `Gagal menghapus supplier: ${err.message || 'Terjadi kesalahan'}`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 p-4 sm:p-8">
      {/* Header Utama Halaman */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 bg-orange-100 p-3 rounded-full">
            <Users className="h-8 w-8 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Manajemen Supplier</h1>
            <p className="text-muted-foreground">Kelola informasi supplier dan kontak Anda.</p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()} className="mt-4 sm:mt-0 w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg shadow-md hover:bg-orange-600 transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Supplier
        </Button>
      </header>

      {/* Tabel Utama dalam Card */}
      <Card className="shadow-lg border-0">
        <CardHeader className="border-b px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Label htmlFor="show-entries" className="whitespace-nowrap">Show</Label>
              <Select value={String(entriesPerPage)} onValueChange={(value) => { setEntriesPerPage(Number(value)); setCurrentPage(1); }}>
                <SelectTrigger id="show-entries" className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="5">5</SelectItem><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem></SelectContent>
              </Select>
              <span className="text-muted-foreground">entries</span>
            </div>
            <div className="w-full sm:w-auto relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Cari supplier atau kontak..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full sm:w-64 pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"><Checkbox onCheckedChange={handleSelectAll} /></TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('nama')}><div className="flex items-center gap-2">Nama Supplier <ArrowUpDown className="h-4 w-4" /></div></TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Alamat & Kontak</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('createdAt')}><div className="flex items-center gap-2">Tanggal Ditambahkan <ArrowUpDown className="h-4 w-4" /></div></TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">Memuat data supplier...</TableCell></TableRow>
                ) : paginatedSuppliers.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">Tidak ada supplier ditemukan.</TableCell></TableRow>
                ) : (
                  paginatedSuppliers.map((supplier) => (
                    <TableRow key={supplier.id} className="hover:bg-orange-50/50">
                      <TableCell><Checkbox checked={selectedRows.includes(supplier.id)} onCheckedChange={(checked) => handleSelectRow(supplier.id, !!checked)} /></TableCell>
                      <TableCell className="font-medium">{supplier.nama}</TableCell>
                      <TableCell className="text-muted-foreground">{supplier.kontak}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-sm">
                          {supplier.email && (<span className="flex items-center gap-2 text-gray-500"><Mail className="h-4 w-4" /> <span>{supplier.email}</span></span>)}
                          {supplier.telepon && (<span className="flex items-center gap-2 text-gray-500"><Phone className="h-4 w-4" /> <span>{supplier.telepon}</span></span>)}
                          {supplier.alamat && (<span className="flex items-center gap-2 text-gray-500"><MapPin className="h-4 w-4" /> <span>{supplier.alamat}</span></span>)}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{supplier.createdAt ? formatDateForDisplay(supplier.createdAt) : '-'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenDialog(supplier)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteSupplier(supplier.id)} className="text-destructive">Hapus</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between px-6 py-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {Math.min((currentPage - 1) * entriesPerPage + 1, sortedSuppliers.length) || 0} to {Math.min(currentPage * entriesPerPage, sortedSuppliers.length)} of {sortedSuppliers.length} entries.
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage(c => c - 1); }} /></PaginationItem>
              {[...Array(totalPages).keys()].slice(0, 5).map(page => (
                <PaginationItem key={page}><PaginationLink href="#" isActive={currentPage === page + 1} onClick={(e) => { e.preventDefault(); setCurrentPage(page + 1); }}>{page + 1}</PaginationLink></PaginationItem>
              ))}
              <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(c => c + 1); }} /></PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardFooter>
      </Card>

      {/* Dialog for Add/Edit Supplier */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Tambah Supplier Baru'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nama">Nama Supplier *</Label>
                <Input id="nama" value={supplierFormData.nama} onChange={(e) => setSupplierFormData({ ...supplierFormData, nama: e.target.value })} placeholder="Nama perusahaan supplier" required/>
              </div>
              <div>
                <Label htmlFor="kontak">Nama Kontak *</Label>
                <Input id="kontak" value={supplierFormData.kontak} onChange={(e) => setSupplierFormData({ ...supplierFormData, kontak: e.target.value })} placeholder="Nama penanggung jawab" required/>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={supplierFormData.email} onChange={(e) => setSupplierFormData({ ...supplierFormData, email: e.target.value })} placeholder="email@supplier.com"/>
              </div>
              <div>
                <Label htmlFor="telepon">Telepon</Label>
                <Input id="telepon" type="tel" value={supplierFormData.telepon} onChange={(e) => setSupplierFormData({ ...supplierFormData, telepon: e.target.value })} placeholder="08123456789"/>
              </div>
            </div>
            <div>
              <Label htmlFor="alamat">Alamat</Label>
              <Textarea id="alamat" value={supplierFormData.alamat} onChange={(e) => setSupplierFormData({ ...supplierFormData, alamat: e.target.value })} placeholder="Alamat lengkap supplier" rows={3}/>
            </div>
            <div>
              <Label htmlFor="catatan">Catatan</Label>
              <Textarea id="catatan" value={supplierFormData.catatan} onChange={(e) => setSupplierFormData({ ...supplierFormData, catatan: e.target.value })} placeholder="Catatan tambahan tentang supplier" rows={2}/>
            </div>
            <div className="flex justify-end space-x-2">
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