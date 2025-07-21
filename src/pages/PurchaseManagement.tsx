import React, { useState, useMemo } from 'react';
 import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
 import { ShoppingCart, Plus, Edit, Trash2, Package, Search, ChevronLeft, ChevronRight } from 'lucide-react';
 import { usePurchase } from '@/contexts/PurchaseContext';
 import { useSupplier } from '@/contexts/SupplierContext';
 import { useBahanBaku } from '@/contexts/BahanBakuContext';
import { BahanBaku } from '@/types/bahanBaku';
 import { toast } from 'sonner';
 import { formatDateForDisplay } from '@/utils/dateUtils';
 import { generateUUID } from '@/utils/uuid';
 import { formatCurrency } from '@/utils/currencyUtils';
 import { Purchase, PurchaseItem } from '@/types/supplier';
 import { cn } from '@/lib/utils';
 import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
 
 const PurchaseManagement = () => {
   const { purchases, addPurchase, updatePurchase, deletePurchase, isLoading } = usePurchase();
   const { suppliers } = useSupplier();
   const { bahanBaku } = useBahanBaku();
   
   const [isDialogOpen, setIsDialogOpen] = useState(false);
   const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
   const [searchTerm, setSearchTerm] = useState('');
   const [statusFilter, setStatusFilter] = useState<string>('all');
   const [currentPage, setCurrentPage] = useState(1);
   const [itemsPerPage, setItemsPerPage] = useState(10);
 
   const [newPurchase, setNewPurchase] = useState<{
     supplier: string;
     tanggal: Date;
     items: PurchaseItem[];
     status: 'pending' | 'completed' | 'cancelled';
   }>({
     supplier: '',
     tanggal: new Date(),
     items: [],
     status: 'pending',
   });
 
   const [newItem, setNewItem] = useState({ namaBarang: '', jumlah: 0, satuan: '', hargaSatuan: 0 });
 
   const handleAddItem = () => {
     if (!newItem.namaBarang || newItem.jumlah <= 0 || newItem.hargaSatuan <= 0) {
       toast.error('Nama, kuantitas (>0), dan harga satuan (>0) wajib diisi.');
       return;
     }
     const item: PurchaseItem = {
       id: generateUUID(),
       namaBarang: newItem.namaBarang,
       jumlah: newItem.jumlah,
       satuan: newItem.satuan,
       hargaSatuan: newItem.hargaSatuan,
       totalHarga: newItem.jumlah * newItem.hargaSatuan,
     };
     setNewPurchase(prev => ({
       ...prev,
       items: [...prev.items, item],
     }));
     setNewItem({ namaBarang: '', jumlah: 0, satuan: '', hargaSatuan: 0 });
     toast.success('Item berhasil ditambahkan.');
   };
 
   const handleRemoveItem = (itemId: string) => {
     setNewPurchase(prev => ({
       ...prev,
       items: prev.items.filter(item => item.id !== itemId),
     }));
     toast.success('Item berhasil dihapus.');
   };
 
   const handleSavePurchase = async () => {
     if (!newPurchase.supplier || newPurchase.items.length === 0) {
       toast.error('Supplier dan minimal satu item wajib diisi.');
       return;
     }
     const totalNilai = newPurchase.items.reduce((sum, item) => sum + item.totalHarga, 0);
     const purchaseData = { ...newPurchase, totalNilai };
 
     let success = false;
     if (editingPurchase) {
       success = await updatePurchase(editingPurchase.id, purchaseData);
     } else {
       success = await addPurchase(purchaseData);
     }
 
     if (success) {
       setIsDialogOpen(false);
       setEditingPurchase(null);
     }
   };
 
   const handleStatusChange = async (purchaseId: string, newStatus: string) => {
     const success = await updatePurchase(purchaseId, { status: newStatus as Purchase['status'] });
     if (success) {
       toast.success(`Status pembelian berhasil diubah.`);
     }
   };
 
   const handleOpenNewDialog = () => {
     setEditingPurchase(null);
     setNewPurchase({
       supplier: '',
       tanggal: new Date(),
       items: [],
       status: 'pending',
     });
     setNewItem({ namaBarang: '', jumlah: 0, satuan: '', hargaSatuan: 0 });
     setIsDialogOpen(true);
   };
   
   const handleEdit = (purchase: Purchase) => {
     setEditingPurchase(purchase);
     setNewPurchase({
       ...purchase,
       tanggal: purchase.tanggal instanceof Date ? purchase.tanggal : new Date(purchase.tanggal),
       status: purchase.status as 'pending' | 'completed' | 'cancelled',
     });
     setNewItem({ namaBarang: '', jumlah: 0, satuan: '', hargaSatuan: 0 });
     setIsDialogOpen(true);
   };
 
   const handleDelete = (id: string) => deletePurchase(id);
 
   const filteredPurchases = useMemo(() => {
     return purchases.filter(p => {
       const supplierData = suppliers.find(s => s.id === p.supplier);
       const matchesSearch = supplierData?.nama.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
       const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
       return matchesSearch && matchesStatus;
     });
   }, [purchases, suppliers, searchTerm, statusFilter]);
   
   const currentItems = useMemo(() => {
     const firstItem = (currentPage - 1) * itemsPerPage;
     return filteredPurchases.slice(firstItem, firstItem + itemsPerPage);
   }, [filteredPurchases, currentPage, itemsPerPage]);
   
   const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);
 
   return (
     <div className="container mx-auto p-4 sm:p-6 space-y-6">
       {/* Header */}
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
         <div className="flex items-center gap-4">
           <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-full">
             <ShoppingCart className="h-8 w-8 text-white" />
           </div>
           <div>
             <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
               Manajemen Pembelian Bahan Baku
             </h1>
             <p className="text-muted-foreground">Kelola semua transaksi pembelian bahan baku Anda</p>
           </div>
         </div>
         <Button
           className="flex items-center gap-2 bg-gradient-to-r from-[#FF9500] to-[#FF2E2E] hover:from-[#FF8A00] hover:to-[#E82A2A] text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-300 py-3 px-5 rounded-lg"
           onClick={handleOpenNewDialog}
         >
           <Plus className="h-5 w-5 stroke-[3]" />
           <span className="font-medium text-base">Tambah Pembelian</span>
         </Button>
       </div>
 
       <Card>
         <CardHeader><CardTitle>Filter Pembelian</CardTitle></CardHeader>
         <CardContent>
           <div className="flex flex-col sm:flex-row gap-4">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
               <Input placeholder="Cari nama supplier..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
             </div>
             <Select value={statusFilter} onValueChange={setStatusFilter}>
               <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter status" /></SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">Semua Status</SelectItem>
                 <SelectItem value="pending">Pending</SelectItem>
                 <SelectItem value="completed">Selesai</SelectItem>
                 <SelectItem value="cancelled">Dibatalkan</SelectItem>
               </SelectContent>
             </Select>
           </div>
         </CardContent>
       </Card>
       
       <Card>
         <CardHeader>
           <div className="flex items-center justify-between">
             <CardTitle>Daftar Pembelian</CardTitle>
             <div className="flex items-center gap-2 text-sm text-gray-600">
                 <Label htmlFor="itemsPerPage">Baris per halaman:</Label>
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
                   <TableHead>Tanggal</TableHead>
                   <TableHead>Supplier</TableHead>
                   <TableHead>Total Nilai</TableHead>
                   <TableHead className="w-[180px]">Status</TableHead>
                   <TableHead className="text-right">Aksi</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {isLoading ? (
                   <TableRow><TableCell colSpan={5} className="text-center h-24">Memuat data...</TableCell></TableRow>
                 ) : currentItems.length === 0 ? (
                   <TableRow><TableCell colSpan={5} className="text-center h-24">Tidak ada data pembelian.</TableCell></TableRow>
                 ) : (
                   currentItems.map((purchase) => {
                     const supplierData = suppliers.find(s => s.id === purchase.supplier);
                     return (
                       <TableRow key={purchase.id}>
                         <TableCell>{formatDateForDisplay(purchase.tanggal)}</TableCell>
                         <TableCell className="font-medium">{supplierData?.nama || 'N/A'}</TableCell>
                         <TableCell className="font-semibold">{formatCurrency(purchase.totalNilai)}</TableCell>
                         <TableCell>
                           <Select value={purchase.status} onValueChange={(newStatus) => handleStatusChange(purchase.id, newStatus)}>
                             <SelectTrigger className={cn("h-8 border-none text-xs", {
                               'bg-yellow-100 text-yellow-800': purchase.status === 'pending',
                               'bg-green-100 text-green-800': purchase.status === 'completed',
                               'bg-red-100 text-red-800': purchase.status === 'cancelled',
                             })}>
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="pending">Pending</SelectItem>
                               <SelectItem value="completed">Selesai</SelectItem>
                               <SelectItem value="cancelled">Dibatalkan</SelectItem>
                             </SelectContent>
                           </Select>
                         </TableCell>
                         <TableCell className="text-right">
                           <div className="flex gap-1 justify-end">
                             <Button variant="ghost" size="icon" onClick={() => handleEdit(purchase)}><Edit className="h-4 w-4" /></Button>
                             <AlertDialog>
                               <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                               <AlertDialogContent>
                                 <AlertDialogHeader><AlertDialogTitle>Anda Yakin?</AlertDialogTitle><AlertDialogDescription>Tindakan ini akan menghapus data pembelian secara permanen.</AlertDialogDescription></AlertDialogHeader>
                                 <AlertDialogFooter>
                                   <AlertDialogCancel>Batal</AlertDialogCancel>
                                   <AlertDialogAction onClick={() => handleDelete(purchase.id)} className="bg-red-600 hover:bg-red-700">Ya, Hapus</AlertDialogAction>
                                 </AlertDialogFooter>
                               </AlertDialogContent>
                             </AlertDialog>
                           </div>
                         </TableCell>
                       </TableRow>
                     );
                   })
                 )}
               </TableBody>
             </Table>
           </div>
         </CardContent>
         <CardFooter className="flex items-center justify-between p-4">
           <div className="text-sm text-muted-foreground">Menampilkan {Math.min(filteredPurchases.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredPurchases.length, currentPage * itemsPerPage)} dari {filteredPurchases.length} pesanan</div>
           <div className="flex items-center gap-1">
             <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
             <span className="px-4 text-sm">Hal {currentPage} / {totalPages || 1}</span>
             <Button variant="outline" size="icon" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages || totalPages === 0}><ChevronRight className="h-4 w-4" /></Button>
           </div>
         </CardFooter>
       </Card>
 
       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
         <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
           <DialogHeader><DialogTitle>{editingPurchase ? 'Edit Pembelian' : 'Tambah Pembelian Baru'}</DialogTitle></DialogHeader>
           <div className="flex-grow overflow-y-auto p-1 space-y-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                 <Label>Supplier *</Label>
                 <Select value={newPurchase.supplier} onValueChange={(val) => setNewPurchase(p => ({...p, supplier: val}))}>
                   <SelectTrigger><SelectValue placeholder="Pilih supplier" /></SelectTrigger>
                   <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.nama}</SelectItem>)}</SelectContent>
                 </Select>
               </div>
               <div>
                 <Label>Tanggal *</Label>
                 <Input type="date" value={newPurchase.tanggal.toISOString().split('T')[0]} onChange={(e) => setNewPurchase(p => ({...p, tanggal: new Date(e.target.value)}))} />
               </div>
             </div>
             <Card>
               <CardHeader><CardTitle className="text-base">Tambah Item</CardTitle></CardHeader>
               <CardContent className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end pt-2">
                 <div className="sm:col-span-2">
                   <Label>Nama Barang *</Label>
                   <Select value={newItem.namaBarang} onValueChange={(val) => { const sb = bahanBaku.find(b => b.nama === val); setNewItem({ ...newItem, namaBarang: val, satuan: sb?.satuan || '', hargaSatuan: sb?.hargaSatuan || 0 }); }}>
                     <SelectTrigger><SelectValue placeholder="Pilih Bahan Baku" /></SelectTrigger>
                     <SelectContent>{bahanBaku.map(b => <SelectItem key={b.id} value={b.nama}>{b.nama}</SelectItem>)}</SelectContent>
                   </Select>
                 </div>
                 <div><Label>Jumlah *</Label><Input type="number" value={newItem.jumlah} onChange={(e) => setNewItem({...newItem, jumlah: parseFloat(e.target.value) || 0})} /></div>
                 <div><Label>Harga Satuan *</Label><Input type="number" value={newItem.hargaSatuan} onChange={(e) => setNewItem({...newItem, hargaSatuan: parseFloat(e.target.value) || 0})} /></div>
                 <Button
                   className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                   onClick={handleAddItem}
                 >
                   <Plus className="h-4 w-4 mr-2"/>Tambah
                 </Button>
               </CardContent>
             </Card>
             {newPurchase.items.length > 0 && (
               <Table>
                 <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>Jumlah</TableHead><TableHead>Harga/Satuan</TableHead><TableHead>Total</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader>
                 <TableBody>
                   {newPurchase.items.map(item => (
                     <TableRow key={item.id}>
                       <TableCell>{item.namaBarang}</TableCell><TableCell>{item.jumlah} {item.satuan}</TableCell>
                       <TableCell>{formatCurrency(item.hargaSatuan)}</TableCell><TableCell className="font-semibold">{formatCurrency(item.totalHarga)}</TableCell>
                       <TableCell><Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             )}
           </div>
           <DialogFooter className="flex justify-end gap-2 pt-4 border-t">
             <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
             <Button
               className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
               onClick={handleSavePurchase}
             >
               {editingPurchase ? "Update" : "Simpan"}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
     </div>
   );
 };
 
 export default PurchaseManagement;