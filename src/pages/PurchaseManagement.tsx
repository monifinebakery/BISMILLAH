import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, Edit, Trash2, Package, Search } from 'lucide-react';
import { usePurchase } from '@/contexts/PurchaseContext';
import { useSupplier } from '@/contexts/SupplierContext';
import { useBahanBaku } from '@/contexts/BahanBakuContext';
import { toast } from 'sonner';
import { formatDateForDisplay } from '@/utils/dateUtils';
import { useIsMobile } from '@/hooks/use-mobile';
import { generateUUID } from '@/utils/uuid';
import { formatCurrency } from '@/utils/currencyUtils';
import { Purchase, PurchaseItem } from '@/types/supplier'; 

const PurchaseManagement = () => {
  const isMobile = useIsMobile();
  const { purchases, addPurchase, updatePurchase, deletePurchase } = usePurchase();
  const { suppliers } = useSupplier();
  const { bahanBaku } = useBahanBaku();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [newPurchase, setNewPurchase] = useState<{
    supplier: string;
    tanggal: Date;
    items: PurchaseItem[];
    status: 'pending' | 'completed' | 'cancelled';
    metodePerhitungan: 'FIFO' | 'LIFO' | 'Average'; // Termasuk ini di state
    totalNilai: number;
  }>({
    supplier: '',
    tanggal: new Date(),
    items: [],
    status: 'pending',
    metodePerhitungan: 'FIFO', // Default value
    totalNilai: 0,
  });

  const [newItem, setNewItem] = useState({
    namaBarang: '',
    jumlah: 0,
    satuan: '',
    hargaSatuan: 0,
  });

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
    // Pastikan objek ini sesuai dengan apa yang diharapkan oleh addPurchase/updatePurchase di PurchaseContext
    const purchaseDataToSend: Omit<Purchase, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      supplier: newPurchase.supplier,
      tanggal: newPurchase.tanggal,
      items: newPurchase.items,
      status: newPurchase.status,
      metodePerhitungan: newPurchase.metodePerhitungan, // Pastikan ini disertakan
      totalNilai: totalNilai,
    };

    let success = false;
    if (editingPurchase) {
      // Untuk update, kirim ID dan data partial
      success = await updatePurchase(editingPurchase.id, purchaseDataToSend); // Langsung kirim purchaseDataToSend
    } else {
      success = await addPurchase(purchaseDataToSend);
    }

    if (success) {
      setIsDialogOpen(false);
      setEditingPurchase(null);
    }
  };

  const handleOpenNewDialog = () => {
    setEditingPurchase(null);
    setNewPurchase({
      supplier: '',
      tanggal: new Date(),
      items: [],
      status: 'pending',
      metodePerhitungan: 'FIFO',
      totalNilai: 0,
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
      // Pastikan metodePerhitungan juga dimuat dari data pembelian yang ada
      metodePerhitungan: purchase.metodePerhitungan || 'FIFO', // Default jika tidak ada
    });
    setNewItem({ namaBarang: '', jumlah: 0, satuan: '', hargaSatuan: 0 }); // Reset newItem saat edit
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus pembelian ini?')) {
      await deletePurchase(id);
    }
  };
  
  const filteredPurchases = purchases.filter(p => {
    const supplierData = suppliers.find(s => s.id === p.supplier);
    const matchesSearch = supplierData?.nama.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-800">Selesai</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'cancelled': return <Badge className="bg-red-100 text-red-800">Dibatalkan</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Manajemen Pembelian Bahan Baku</h1>
          <p className="text-muted-foreground">Kelola semua transaksi pembelian bahan baku Anda.</p>
        </div>
        <Button onClick={handleOpenNewDialog} className="mt-4 sm:mt-0">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Pembelian
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Cari berdasarkan nama supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
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
        <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Jumlah Item</TableHead>
                  <TableHead>Total Nilai</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.length > 0 ? (
                  filteredPurchases.map((purchase) => {
                    const supplierData = suppliers.find(s => s.id === purchase.supplier);
                    return (
                        <TableRow key={purchase.id}>
                          <TableCell>{formatDateForDisplay(purchase.tanggal)}</TableCell>
                          <TableCell>{supplierData?.nama || 'N/A'}</TableCell>
                          <TableCell>{purchase.items.length}</TableCell>
                          <TableCell>{formatCurrency(purchase.totalNilai)}</TableCell>
                          <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(purchase)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(purchase.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                    );
                })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      Tidak ada data pembelian.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader>
                <DialogTitle>{editingPurchase ? 'Edit Pembelian' : 'Tambah Pembelian Baru'}</DialogTitle>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-4">
                {/* Form Header */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <Label>Supplier *</Label>
                        <Select
                            value={newPurchase.supplier}
                            onValueChange={(val) => setNewPurchase(prev => ({...prev, supplier: val}))}
                        >
                            <SelectTrigger><SelectValue placeholder="Pilih supplier" /></SelectTrigger>
                            <SelectContent>
                                {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.nama}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Tanggal *</Label>
                        <Input
                            type="date"
                            value={newPurchase.tanggal.toISOString().split('T')[0]}
                            onChange={(e) => setNewPurchase(prev => ({...prev, tanggal: new Date(e.target.value)}))}
                        />
                    </div>
                        {/* --- TAMBAHAN UNTUK STATUS PEMBELIAN --- */}
                        <div>
                            <Label>Status</Label>
                            <Select
                                value={newPurchase.status}
                                onValueChange={(val: 'pending' | 'completed' | 'cancelled') =>
                                    setNewPurchase(prev => ({ ...prev, status: val }))
                                }
                            >
                                <SelectTrigger><SelectValue placeholder="Pilih status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="completed">Selesai</SelectItem>
                                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                </div>

                {/* Add Item Form */}
                <Card>
                    <CardHeader><CardTitle className="text-lg">Tambah Item</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
                         <div className="sm:col-span-2">
                            <Label>Nama Barang *</Label>
                            <Select
                                value={newItem.namaBarang}
                                onValueChange={(val) => {
                                    const selectedBahan = bahanBaku.find(b => b.nama === val);
                                    setNewItem({
                                        ...newItem,
                                        namaBarang: val,
                                        satuan: selectedBahan?.satuan || '',
                                        hargaSatuan: selectedBahan?.hargaSatuan || 0,
                                    });
                                }}
                            >
                                <SelectTrigger><SelectValue placeholder="Pilih Bahan Baku" /></SelectTrigger>
                                <SelectContent>
                                    {bahanBaku.map(b => <SelectItem key={b.id} value={b.nama}>{b.nama}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Jumlah *</Label>
                            <Input type="number" value={newItem.jumlah} onChange={(e) => setNewItem({...newItem, jumlah: parseFloat(e.target.value)})} />
                        </div>
                        <div>
                            <Label>Harga Satuan *</Label>
                            <Input type="number" value={newItem.hargaSatuan} onChange={(e) => setNewItem({...newItem, hargaSatuan: parseFloat(e.target.value)})} />
                        </div>
                        <Button onClick={handleAddItem}><Plus className="h-4 w-4 mr-2"/>Tambah</Button>
                    </CardContent>
                </Card>
                
                {/* Items Table */}
                {newPurchase.items.length > 0 &&
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama</TableHead>
                                <TableHead>Jumlah</TableHead>
                                <TableHead>Harga/Satuan</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {newPurchase.items.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.namaBarang}</TableCell>
                                    <TableCell>{item.jumlah} {item.satuan}</TableCell>
                                    <TableCell>{formatCurrency(item.hargaSatuan)}</TableCell>
                                    <TableCell>{formatCurrency(item.totalHarga)}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                }
            </div>
             <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                <Button onClick={handleSavePurchase}>{editingPurchase ? "Update" : "Simpan"}</Button>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseManagement;