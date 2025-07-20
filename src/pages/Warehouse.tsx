import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Package, Plus, MoreHorizontal, ArrowUpDown, AlertTriangle, Search } from 'lucide-react';
import { BahanBaku } from '@/types/recipe';
import BahanBakuEditDialog from '@/components/BahanBakuEditDialog';
import { useBahanBaku } from '@/contexts/BahanBakuContext';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/currencyUtils';

const WarehousePage = () => {
  const { bahanBaku, addBahanBaku, updateBahanBaku, deleteBahanBaku, isLoading } = useBahanBaku();

  const [editingItem, setEditingItem] = useState<BahanBaku | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof BahanBaku; direction: 'asc' | 'desc' } | null>({ key: 'nama', direction: 'asc' });

  const sortedItems = useMemo(() => {
    let filtered = bahanBaku.filter(item =>
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.kategori && item.kategori.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        const valA = a[sortConfig.key] || '';
        const valB = b[sortConfig.key] || '';
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [bahanBaku, searchTerm, sortConfig]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * entriesPerPage;
    return sortedItems.slice(startIndex, startIndex + entriesPerPage);
  }, [sortedItems, currentPage, entriesPerPage]);

  const totalPages = Math.ceil(sortedItems.length / entriesPerPage);
  
  const handleSort = (key: keyof BahanBaku) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setCurrentPage(1);
    setSortConfig({ key, direction });
  };
  
  const handleEdit = (item: BahanBaku) => setEditingItem(item);
  const handleDelete = async (id: string) => { if (window.confirm('Yakin ingin menghapus item ini?')) await deleteBahanBaku(id); };

  const handleSave = async (data: Partial<BahanBaku>) => {
    let success = false;
    if (editingItem && editingItem.id) { // Mode Edit
      success = await updateBahanBaku(editingItem.id, data);
    } else { // Mode Tambah Baru
      success = await addBahanBaku(data as Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>);
    }
    if (success) setEditingItem(null); // Tutup dialog jika sukses
  };
  
  const lowStockItems = useMemo(() => bahanBaku.filter(item => item.stok <= item.minimum), [bahanBaku]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 p-4 sm:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-full"><Package className="h-8 w-8 text-orange-600" /></div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Gudang Bahan Baku</h1>
            <p className="text-muted-foreground">Kelola inventori bahan baku Anda.</p>
          </div>
        </div>
        <Button onClick={() => setEditingItem({} as BahanBaku)} className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm mt-4 sm:mt-0 w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" /> Tambah Bahan
        </Button>
      </header>

      {lowStockItems.length > 0 && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <CardHeader><CardTitle className="flex items-center text-red-700 text-lg"><AlertTriangle className="h-5 w-5 mr-2" />Peringatan Stok Rendah ({lowStockItems.length})</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-2 pt-4">
            {lowStockItems.map(item => (<Badge key={item.id} variant="destructive">{item.nama}</Badge>))}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg border-0">
        <CardHeader className="border-b px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Label htmlFor="show-entries">Show</Label>
              <Select value={String(entriesPerPage)} onValueChange={(v) => { setEntriesPerPage(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger id="show-entries" className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="5">5</SelectItem><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem></SelectContent>
              </Select>
              <span className="text-muted-foreground">entries</span>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
              <Input placeholder="Cari bahan baku..." value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"><Checkbox /></TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('nama')}>Nama Bahan <ArrowUpDown className="h-4 w-4 inline-block ml-2" /></TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right cursor-pointer" onClick={() => handleSort('stok')}>Stok <ArrowUpDown className="h-4 w-4 inline-block ml-2" /></TableHead>
                  <TableHead className="text-right">Harga Satuan</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Memuat data...</TableCell></TableRow>
                ) : paginatedItems.length > 0 ? (
                  paginatedItems.map((item) => (
                    <TableRow key={item.id} className={item.stok <= item.minimum ? 'bg-red-50/50 hover:bg-red-100/50' : ''}>
                      <TableCell><Checkbox /></TableCell>
                      <TableCell className="font-medium">{item.nama}</TableCell>
                      <TableCell><Badge variant="secondary">{item.kategori}</Badge></TableCell>
                      <TableCell className="text-right font-mono">{item.stok} {item.satuan}</TableCell>
                      <TableCell className="text-right font-mono text-green-600">{formatCurrency(item.hargaSatuan)}</TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(item)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-destructive">Hapus</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">Tidak ada bahan baku ditemukan.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between px-6 py-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {Math.min((currentPage - 1) * entriesPerPage + 1, sortedItems.length) || 0} to {Math.min(currentPage * entriesPerPage, sortedItems.length)} of {sortedItems.length} entries.
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
      
      {editingItem && (
        <BahanBakuEditDialog
          item={editingItem}
          onSave={handleSave}
          onClose={() => setEditingItem(null)}
          isOpen={!!editingItem}
        />
      )}
    </div>
  );
};

export default WarehousePage;