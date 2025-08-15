// src/components/purchase/components/PurchaseDialog.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatCurrency } from '@/utils/formatUtils';
import { X, Save, Edit, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import SimplePurchaseItemForm from './SimplePurchaseItemForm';

// Helper baru: normalisasi angka yang tahan banting
const toNumber = (v: string | number | '' | undefined) => {
  if (v === '' || v == null) return 0;
  if (typeof v === 'number') return isFinite(v) ? v : 0;

  // buang spasi & karakter non angka/koma/titik
  let s = v.toString().trim().replace(/\s+/g, '');
  s = s.replace(/[^\d,.\-]/g, '');

  // kalau ada KOMA dan TITIK sekaligus: anggap TITIK = pemisah ribuan → hapus semua titik, koma jadi desimal
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(/,/g, '.');
  } else {
    // kalau cuma koma → pakai koma sebagai desimal
    s = s.replace(/,/g, '.');
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

interface PurchaseItem {
  id: string;
  bahanBakuId: string;
  nama: string;
  satuan: string;
  kuantitas: number;
  hargaSatuan: number;
  keterangan: string;
  jumlahKemasan?: number;
  isiPerKemasan?: number;
  satuanKemasan?: string;
  hargaTotalBeliKemasan?: number;
}

interface BahanBaku {
  id: string;
  nama: string;
  satuan: string;
}

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    items: PurchaseItem[];
    supplier?: string;
    tanggal?: string;
    catatan?: string;
  };
  bahanBaku: BahanBaku[];
  onSave: (data: any) => void;
  suppliers: any[];
}

const PurchaseDialog: React.FC<PurchaseDialogProps> = ({
  open,
  onOpenChange,
  initialData,
  bahanBaku,
  onSave,
  suppliers,
}) => {
  const [items, setItems] = useState<PurchaseItem[]>(initialData?.items || []);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editedItem, setEditedItem] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Edit Item Form Component (Integrated)
  const EditItemForm = () => {
    if (!editedItem) return null;

    const subtotal = toNumber(editedItem.kuantitas) * toNumber(editedItem.hargaSatuan);

    return (
      <Dialog open onOpenChange={() => setEditingItemId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>Edit Item</span>
              <span className="text-gray-500 font-normal text-sm">{editedItem.nama}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Kuantitas</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={String(editedItem.kuantitas ?? '')}
                onChange={(e) => setEditedItem(prev => ({ ...prev, kuantitas: e.target.value }))}
                placeholder="0"
                className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                autoComplete="off"
                autoCorrect="off"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Harga Satuan</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={String(editedItem.hargaSatuan ?? '')}
                  onChange={(e) => setEditedItem(prev => ({ ...prev, hargaSatuan: e.target.value }))}
                  className="h-11 pl-8 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                  placeholder="0"
                  autoComplete="off"
                  autoCorrect="off"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Keterangan</Label>
              <Input
                value={editedItem.keterangan}
                onChange={(e) => setEditedItem(prev => ({ ...prev, keterangan: e.target.value }))}
                placeholder="Keterangan tambahan (opsional)"
                className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
              />
            </div>

            {/* Subtotal Preview */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600">Subtotal</div>
              <div className="font-semibold text-lg text-orange-600">
                {formatCurrency(subtotal)}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setEditingItemId(null)}
              className="border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-2" />
              Batal
            </Button>
            <Button
              onClick={() => {
                const updatedItems = items.map(item => 
                  item.id === editedItem.id ? {
                    ...item,
                    kuantitas: toNumber(editedItem.kuantitas),
                    hargaSatuan: toNumber(editedItem.hargaSatuan),
                    keterangan: editedItem.keterangan,
                  } : item
                );
                setItems(updatedItems);
                setEditingItemId(null);
                toast.success('Item berhasil diupdate');
              }}
              disabled={toNumber(editedItem.kuantitas) <= 0 || toNumber(editedItem.hargaSatuan) <= 0}
              className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-sm disabled:bg-gray-300 disabled:text-gray-500"
            >
              <Save className="h-4 w-4 mr-2" />
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const handleAddItem = (newItem: any) => {
    const itemWithId = {
      ...newItem,
      id: Date.now().toString(),
    };
    setItems(prev => [...prev, itemWithId]);
    setShowAddForm(false);
    toast.success('Item berhasil ditambahkan');
  };

  const handleEditItem = (item: PurchaseItem) => {
    setEditedItem({
      id: item.id,
      nama: item.nama,
      kuantitas: String(item.kuantitas),
      hargaSatuan: String(item.hargaSatuan),
      keterangan: item.keterangan || '',
    });
    setEditingItemId(item.id);
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    toast.success('Item berhasil dihapus');
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      return total + (toNumber(item.kuantitas) * toNumber(item.hargaSatuan));
    }, 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData?.items ? 'Edit Pembelian' : 'Tambah Pembelian Baru'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Items List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Daftar Item</h3>
              <Button 
                onClick={() => setShowAddForm(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Item
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Belum ada item. Klik "Tambah Item" untuk menambahkan.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="font-medium">{item.nama}</div>
                      <div className="text-sm text-gray-600">
                        {toNumber(item.kuantitas)} {item.satuan} × {formatCurrency(toNumber(item.hargaSatuan))}
                      </div>
                      {item.keterangan && (
                        <div className="text-xs text-gray-500 mt-1">{item.keterangan}</div>
                      )}
                    </div>
                    <div className="font-semibold text-orange-600">
                      {formatCurrency(toNumber(item.kuantitas) * toNumber(item.hargaSatuan))}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditItem(item)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteItem(item.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Item Form */}
          {showAddForm && (
            <SimplePurchaseItemForm
              bahanBaku={bahanBaku}
              onCancel={() => setShowAddForm(false)}
              onAdd={handleAddItem}
            />
          )}

          {/* Edit Item Form */}
          {editingItemId && <EditItemForm />}

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-2xl font-bold text-orange-600">
                {formatCurrency(calculateTotal())}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button 
            onClick={() => {
              if (items.length === 0) {
                toast.error('Tambahkan minimal 1 item');
                return;
              }
              onSave({ items });
            }}
            disabled={items.length === 0}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Simpan Pembelian
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseDialog;