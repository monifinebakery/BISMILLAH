import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BahanBaku } from '../../types/warehouse';
import { toast } from 'sonner';

interface AddItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<boolean>;
}

const AddItemDialog: React.FC<AddItemDialogProps> = ({ isOpen, onClose, onAdd }) => {
  const [newItem, setNewItem] = useState<Omit<BahanBaku, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>({
    nama: '',
    kategori: '',
    stok: 0,
    satuan: '',
    hargaSatuan: 0,
    minimum: 0,
    supplier: '',
    tanggalKadaluwarsa: null,
    jumlahBeliKemasan: 0,
    satuanKemasan: '',
    hargaTotalBeliKemasan: 0,
  });

  const unitConversionMap: { [baseUnit: string]: { [purchaseUnit: string]: number } } = {
    'gram': { 'kg': 1000, 'gram': 1, 'pon': 453.592, 'ons': 28.3495 },
    'ml': { 'liter': 1000, 'ml': 1, 'galon': 3785.41 },
    'pcs': { 'pcs': 1, 'lusin': 12, 'gross': 144, 'box': 1, 'bungkus': 1 },
    'butir': { 'butir': 1, 'tray': 30, 'lusin': 12 },
    'kg': { 'gram': 0.001, 'kg': 1, 'pon': 0.453592 },
    'liter': { 'ml': 0.001, 'liter': 1 },
  };

  // Calculate hargaSatuan with validation
  useEffect(() => {
    const purchaseQuantity = newItem.jumlahBeliKemasan;
    const purchaseUnit = newItem.satuanKemasan.toLowerCase();
    const purchaseTotalPrice = newItem.hargaTotalBeliKemasan;
    const baseUnit = newItem.satuan.toLowerCase();

    const isPurchaseDetailsActive = purchaseQuantity > 0 && purchaseTotalPrice > 0 && purchaseUnit && baseUnit;

    if (isPurchaseDetailsActive) {
      const conversionRates = unitConversionMap[baseUnit];
      if (conversionRates && conversionRates[purchaseUnit]) {
        const factor = conversionRates[purchaseUnit];
        const calculatedHarga = purchaseTotalPrice / (purchaseQuantity * factor);
        setNewItem(prev => ({ ...prev, hargaSatuan: parseFloat(calculatedHarga.toFixed(2)) || 0 }));
      } else if (purchaseUnit === baseUnit) {
        const calculatedHarga = purchaseTotalPrice / purchaseQuantity;
        setNewItem(prev => ({ ...prev, hargaSatuan: parseFloat(calculatedHarga.toFixed(2)) || 0 }));
      } else {
        setNewItem(prev => ({ ...prev, hargaSatuan: 0 }));
        toast.warning('Unit konversi tidak sesuai. Harga Satuan diatur ke 0.');
      }
    } else {
      setNewItem(prev => ({ ...prev, hargaSatuan: 0 }));
    }
  }, [newItem.jumlahBeliKemasan, newItem.satuanKemasan, newItem.hargaTotalBeliKemasan, newItem.satuan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newItem.nama || !newItem.kategori || newItem.stok <= 0 || !newItem.satuan || newItem.hargaSatuan <= 0 || newItem.minimum < 0) {
      toast.error('Harap lengkapi semua field yang wajib diisi dan pastikan Stok serta Harga Satuan lebih dari 0.');
      return;
    }
    if (newItem.jumlahBeliKemasan > 0 && newItem.hargaTotalBeliKemasan <= 0) {
      toast.error('Harga Total Beli Kemasan harus lebih dari 0 jika Jumlah Beli Kemasan diisi.');
      return;
    }

    const success = await onAdd(newItem);
    if (success) {
      onClose();
      setNewItem({
        nama: '',
        kategori: '',
        stok: 0,
        satuan: '',
        hargaSatuan: 0,
        minimum: 0,
        supplier: '',
        tanggalKadaluwarsa: null,
        jumlahBeliKemasan: 0,
        satuanKemasan: '',
        hargaTotalBeliKemasan: 0,
      });
      toast.success('Bahan baku berhasil ditambahkan!');
    }
  };

  const getInputValue = <T extends string | number | null | undefined>(value: T): string | number => 
    value === null || value === undefined ? '' : value;

  const getDateInputValue = (date: Date | null): string => 
    date instanceof Date && !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">Tambah Bahan Baku</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
            <div className="md:col-span-2">
              <Label htmlFor="nama" className="font-medium">Nama Bahan *</Label>
              <Input
                id="nama"
                value={newItem.nama}
                onChange={(e) => setNewItem({ ...newItem, nama: e.target.value })}
                placeholder="Masukkan nama bahan"
                required
                className="mt-1"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="kategori" className="font-medium">Kategori *</Label>
              <Input
                id="kategori"
                value={newItem.kategori}
                onChange={(e) => setNewItem({ ...newItem, kategori: e.target.value })}
                placeholder="Masukkan kategori"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="stok" className="font-medium">Stok *</Label>
              <Input
                id="stok"
                type="number"
                value={getInputValue(newItem.stok)}
                onChange={(e) => setNewItem({ ...newItem, stok: parseFloat(e.target.value) || 0 })}
                placeholder="Masukkan stok"
                min="0"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="satuan" className="font-medium">Satuan *</Label>
              <Input
                id="satuan"
                value={getInputValue(newItem.satuan)}
                onChange={(e) => setNewItem({ ...newItem, satuan: e.target.value })}
                placeholder="Masukkan satuan (e.g., kg, gram)"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="hargaSatuan" className="font-medium">Harga Satuan *</Label>
              <Input
                id="hargaSatuan"
                type="number"
                value={getInputValue(newItem.hargaSatuan)}
                onChange={(e) => setNewItem({ ...newItem, hargaSatuan: parseFloat(e.target.value) || 0 })}
                placeholder="Masukkan harga satuan"
                min="0"
                required
                readOnly
                className="bg-gray-100 cursor-not-allowed mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Harga per {getInputValue(newItem.satuan) || 'unit'} akan dihitung otomatis jika 'Detail Pembelian' diisi.
              </p>
            </div>
            <div>
              <Label htmlFor="minimum" className="font-medium">Stok Minimum</Label>
              <Input
                id="minimum"
                type="number"
                value={getInputValue(newItem.minimum)}
                onChange={(e) => setNewItem({ ...newItem, minimum: parseFloat(e.target.value) || 0 })}
                placeholder="Masukkan minimum stok"
                min="0"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="supplier" className="font-medium">Supplier</Label>
              <Input
                id="supplier"
                value={getInputValue(newItem.supplier)}
                onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                placeholder="Masukkan nama supplier"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="tanggalKadaluwarsa" className="font-medium">Tanggal Kadaluwarsa</Label>
              <Input
                id="tanggalKadaluwarsa"
                type="date"
                value={getDateInputValue(newItem.tanggalKadaluwarsa)}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  setNewItem(prev => ({
                    ...prev,
                    tanggalKadaluwarsa: date && !isNaN(date.getTime()) ? date : null,
                  }));
                }}
                placeholder="Pilih tanggal kadaluwarsa"
                className="mt-1"
              />
            </div>
          </div>

          <div className="mt-6">
            <Card className="border-orange-200 bg-orange-50/50 shadow-sm rounded-lg">
              <CardHeader className="py-3">
                <CardTitle className="text-base text-gray-800">Detail Pembelian</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="jumlahBeliKemasan" className="text-sm font-medium">Jumlah Beli Kemasan</Label>
                    <Input
                      id="jumlahBeliKemasan"
                      type="number"
                      value={getInputValue(newItem.jumlahBeliKemasan)}
                      onChange={(e) => setNewItem({ ...newItem, jumlahBeliKemasan: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      min="0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="satuanKemasan" className="text-sm font-medium">Satuan Kemasan</Label>
                    <Select
                      value={getInputValue(newItem.satuanKemasan) as string}
                      onValueChange={(value) => setNewItem({ ...newItem, satuanKemasan: value })}
                    >
                      <SelectTrigger className="rounded-md mt-1">
                        <SelectValue placeholder="Pilih satuan" />
                      </SelectTrigger>
                      <SelectContent>
                        {['kg', 'liter', 'pcs', 'bungkus', 'karung', 'box', 'tray', 'lusin', 'butir', 'gram', 'ml', 'pon', 'ons', 'galon'].map(unit => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="hargaTotalBeliKemasan" className="text-sm font-medium">Harga Total Beli Kemasan</Label>
                    <Input
                      id="hargaTotalBeliKemasan"
                      type="number"
                      value={getInputValue(newItem.hargaTotalBeliKemasan)}
                      onChange={(e) => setNewItem({ ...newItem, hargaTotalBeliKemasan: parseFloat(e.target.value) || 0 })}
                      placeholder="Masukkan harga total beli kemasan"
                      min="0"
                      className="mt-1"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Harga Satuan akan dihitung otomatis jika detail pembelian diisi.
                </p>
              </CardContent>
            </Card>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddItemDialog;