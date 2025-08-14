import { useState } from 'react';
import type { PurchaseItem } from '../types/purchase.types';
import { toast } from 'sonner';

interface BahanBakuItem {
  id: string;
  nama: string;
  satuan: string;
}

interface UsePurchaseItemManagerProps {
  bahanBaku: BahanBakuItem[];
  items: PurchaseItem[];
  addItem: (item: Omit<PurchaseItem, 'subtotal'>) => void;
  updateItem: (index: number, item: Partial<PurchaseItem>) => void;
}

export const usePurchaseItemManager = ({
  bahanBaku,
  items,
  addItem,
  updateItem,
}: UsePurchaseItemManagerProps) => {
  const [newItem, setNewItem] = useState<Partial<PurchaseItem>>({
    bahanBakuId: '',
    nama: '',
    kuantitas: 0,
    satuan: '',
    hargaSatuan: 0,
    keterangan: '',
  });

  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const handleBahanBakuSelect = (bahanBakuId: string) => {
    const selectedBahan = bahanBaku.find((b) => b.id === bahanBakuId);
    if (selectedBahan) {
      setNewItem((prev) => ({
        ...prev,
        bahanBakuId,
        nama: selectedBahan.nama,
        satuan: selectedBahan.satuan,
      }));
    }
  };

  const handleAddItem = () => {
    if (!newItem.bahanBakuId || !newItem.nama || !newItem.kuantitas || !newItem.hargaSatuan) {
      toast.error('Lengkapi data item terlebih dahulu');
      return;
    }

    addItem({
      bahanBakuId: newItem.bahanBakuId!,
      nama: newItem.nama!,
      kuantitas: newItem.kuantitas!,
      satuan: newItem.satuan!,
      hargaSatuan: newItem.hargaSatuan!,
      keterangan: newItem.keterangan,
    });

    setNewItem({
      bahanBakuId: '',
      nama: '',
      kuantitas: 0,
      satuan: '',
      hargaSatuan: 0,
      keterangan: '',
    });
    setShowAddItem(false);
    toast.success('Item berhasil ditambahkan');
  };

  const handleEditItem = (index: number) => {
    setEditingItemIndex(index);
    toast.info('Mode edit item aktif');
  };

  const handleSaveEditedItem = (index: number, updatedItem: Partial<PurchaseItem>) => {
    if (!updatedItem.kuantitas || !updatedItem.hargaSatuan) {
      toast.error('Kuantitas dan harga satuan harus diisi');
      return;
    }

    updateItem(index, {
      ...updatedItem,
      subtotal: (updatedItem.kuantitas || 0) * (updatedItem.hargaSatuan || 0),
    });

    setEditingItemIndex(null);
    toast.success('Item berhasil diperbarui');
  };

  const handleCancelEditItem = () => {
    setEditingItemIndex(null);
  };

  return {
    newItem,
    setNewItem,
    showAddItem,
    setShowAddItem,
    editingItemIndex,
    handleBahanBakuSelect,
    handleAddItem,
    handleEditItem,
    handleSaveEditedItem,
    handleCancelEditItem,
  };
};

