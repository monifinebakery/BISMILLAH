// src/pages/PurchaseManagement.tsx

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { usePurchase } from '@/contexts/PurchaseContext';
import { useSupplier } from '@/contexts/SupplierContext';
import { useBahanBaku } from '@/contexts/BahanBakuContext';
import { useActivity } from '@/contexts/ActivityContext';
import { toast } from 'sonner';
import { formatDateForDisplay } from '@/utils/dateUtils';
import { generateUUID } from '@/utils/uuid';
import { formatCurrency } from '@/utils/currencyUtils';
import { Purchase, PurchaseItem } from '@/types/supplier'; 

const PurchaseManagement = () => {
  const { purchases, addPurchase, updatePurchase, deletePurchase, isLoading } = usePurchase();
  const { suppliers } = useSupplier();
  const { bahanBaku } = useBahanBaku();
  const { addActivity } = useActivity();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // State tunggal untuk form
  const [formData, setFormData] = useState({
    supplier: '',
    tanggal: new Date(),
    status: 'pending' as Purchase['status'],
    items: [] as PurchaseItem[],
  });

  // State terpisah untuk baris item baru
  const [newItem, setNewItem] = useState({
    namaBarang: '',
    jumlah: 0,
    satuan: '',
    hargaSatuan: 0,
  });

  const openDialog = (purchase: Purchase | null = null) => {
    setEditingPurchase(purchase);
    if (purchase) {
      setFormData({
        supplier: purchase.supplier,
        tanggal: purchase.tanggal instanceof Date ? purchase.tanggal : new Date(purchase.tanggal),
        status: purchase.status,
        items: purchase.items,
      });
    } else {
      setFormData({ supplier: '', tanggal: new Date(), status: 'pending', items: [] });
    }
    setNewItem({ namaBarang: '', jumlah: 0, satuan: '', hargaSatuan: 0 });
    setIsDialogOpen(true);
  };

  const handleAddItem = () => {
    if (!newItem.namaBarang || newItem.jumlah <= 0 || newItem.hargaSatuan < 0) {
      toast.error('Nama, jumlah (>0), dan harga satuan (>=0) wajib diisi.');
      return;
    }
    const itemToAdd: PurchaseItem = {
      id: generateUUID(),
      namaBarang: newItem.namaBarang,
      jumlah: newItem.jumlah,
      satuan: newItem.satuan,
      hargaSatuan: newItem.hargaSatuan,
      totalHarga: newItem.jumlah * newItem.hargaSatuan,
    };
    setFormData(prev => ({ ...prev, items: [...prev.items, itemToAdd] }));
    setNewItem({ namaBarang: '', jumlah: 0, satuan: '', hargaSatuan: 0 });
  };

  const handleRemoveItem = (itemId: string) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== itemId) }));
  };

  const handleSavePurchase = async () => {
    if (!formData.supplier || formData.items.length === 0) {
      toast.error('Supplier dan minimal satu item wajib diisi.');
      return;
    }
    const totalNilai = formData.items.reduce((sum, item) => sum + item.totalHarga, 0);
    const purchaseData = { ...formData, totalNilai, metodePerhitungan: 'FIFO' as const };

    let success = false;
    if (editingPurchase) {
      success = await updatePurchase(editingPurchase.id, purchaseData);
    } else {
      success = await addPurchase(purchaseData);
    }

    if (success) {
      const supplierName = suppliers.find(s => s.id === formData.supplier)?.nama || 'Supplier';
      const toastMessage = editingPurchase ? 'Pembelian berhasil diperbarui!' : 'Pembelian berhasil ditambahkan!';
      toast.success(toastMessage);
      addActivity({
        title: editingPurchase ? 'Pembelian Diperbarui' : 'Pembelian Ditambahkan',
        description: `Pembelian dari ${supplierName} senilai ${formatCurrency(totalNilai)}`,
        type: 'purchase', value: null
      });
      setIsDialogOpen(false);
      setEditingPurchase(null);
    }
  };

  const handleDelete = async (purchase: Purchase) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus pembelian ini? Ini tidak akan mengembalikan stok.')) {
      const success = await deletePurchase(purchase.id);
      if(success){
        const supplierName = suppliers.find(s => s.id === purchase.supplier)?.nama || 'Supplier';
        toast.success('Pembelian berhasil dihapus.');
        addActivity({ title: 'Pembelian Dihapus', description: `Pembelian dari ${supplierName} telah dihapus.`, type: 'purchase', value: null });
      }
    }
  };
  
  const filteredPurchases = useMemo(() => purchases.filter(p => {
    const supplierData = suppliers.find(s => s.id === p.supplier);
    const matchesSearch = supplierData?.nama.toLowerCase().includes(searchTerm.toLowerCase()) ?? false;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [purchases, suppliers, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => { /* ... fungsi getStatusBadge ... */ };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Manajemen Pembelian</h1>
          <p className="text-muted-foreground">Kelola semua transaksi pembelian bahan baku.</p>
        </div>
        <Button onClick={() => openDialog()} className="mt-4 sm:mt-0"><Plus className="h-4 w-4 mr-2" /> Tambah Pembelian</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input placeholder="Cari berdasarkan nama supplier..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="flex-1"/>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Filter status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem><SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem><SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Tanggal</TableHead><TableHead>Supplier</TableHead><TableHead>Jumlah Item</TableHead><TableHead>Total Nilai</TableHead><TableHead>Status</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? (<TableRow><TableCell colSpan={6} className="text-center h-24">Memuat data...</TableCell></TableRow>) 
              : filteredPurchases.length > 0 ? (
                filteredPurchases.map((purchase) => {
                  const supplierData = suppliers.find(s => s.id === purchase.supplier);
                  return (
                    <TableRow key={purchase.id}>
                      <TableCell>{formatDateForDisplay(purchase.tanggal)}</TableCell><TableCell>{supplierData?.nama || 'N/A'}</TableCell>
                      <TableCell>{purchase.items.length}</TableCell><TableCell>{formatCurrency(purchase.totalNilai)}</TableCell>
                      <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openDialog(purchase)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(purchase)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (<TableRow><TableCell colSpan={6} className="text-center h-24">Tidak ada data pembelian.</TableCell></TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader><DialogTitle>{editingPurchase ? 'Edit Pembelian' : 'Tambah Pembelian Baru'}</DialogTitle></DialogHeader>
          <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Supplier *</Label>
                <Select value={formData.supplier} onValueChange={(val) => setFormData(prev => ({...prev, supplier: val}))}>
                  <SelectTrigger><SelectValue placeholder="Pilih supplier" /></SelectTrigger>
                  <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.nama}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tanggal *</Label>
                <Input type="date" value={formData.tanggal.toISOString().split('T')[0]} onChange={(e) => setFormData(prev => ({...prev, tanggal: new Date(e.target.value)}))}/>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(val: 'pending' | 'completed' | 'cancelled') => setFormData(prev => ({ ...prev, status: val }))}>
                  <SelectTrigger><SelectValue placeholder="Pilih status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem><SelectItem value="completed">Selesai</SelectItem><SelectItem value="cancelled">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Card>
              <CardHeader><CardTitle className="text-lg">Tambah Item</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
                <div className="sm:col-span-2">
                  <Label>Nama Barang *</Label>
                  <Select value={newItem.namaBarang} onValueChange={(val) => {
                    const selectedBahan = bahanBaku.find(b => b.nama === val);
                    setNewItem({ ...newItem, namaBarang: val, satuan: selectedBahan?.satuan || '', hargaSatuan: selectedBahan?.hargaSatuan || 0 });
                  }}>
                    <SelectTrigger><SelectValue placeholder="Pilih Bahan Baku" /></SelectTrigger>
                    <SelectContent>{bahanBaku.map(b => <SelectItem key={b.id} value={b.nama}>{b.nama}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Jumlah *</Label><Input type="number" value={newItem.jumlah} onChange={(e) => setNewItem({...newItem, jumlah: parseFloat(e.target.value)})} /></div>
                <div><Label>Harga Satuan *</Label><Input type="number" value={newItem.hargaSatuan} onChange={(e) => setNewItem({...newItem, hargaSatuan: parseFloat(e.target.value)})} /></div>
                <Button onClick={handleAddItem}><Plus className="h-4 w-4 mr-2"/>Tambah</Button>
              </CardContent>
            </Card>
            {formData.items.length > 0 &&
              <Table>
                <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>Jumlah</TableHead><TableHead>Harga/Satuan</TableHead><TableHead>Total</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader>
                <TableBody>
                  {formData.items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.namaBarang}</TableCell><TableCell>{item.jumlah} {item.satuan}</TableCell>
                      <TableCell>{formatCurrency(item.hargaSatuan)}</TableCell><TableCell>{formatCurrency(item.totalHarga)}</TableCell>
                      <TableCell><Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            }
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSavePurchase}>{editingPurchase ? "Update Pembelian" : "Simpan Pembelian"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseManagement;