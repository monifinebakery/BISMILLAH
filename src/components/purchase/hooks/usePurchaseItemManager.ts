// src/components/purchase/hooks/usePurchaseItemManager.ts
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

// Tambahan field kemasan yang kita kirim ke transformer (opsional di DB)
type PackagingExtras = {
  jumlahKemasan?: string;
  isiPerKemasan?: string;
  satuanKemasan?: string;
  hargaTotalBeliKemasan?: string;
};

type NewItemState = {
  bahanBakuId: string;
  nama: string;
  kuantitas: string;
  satuan: string;
  hargaSatuan: string;
  keterangan?: string;
} & PackagingExtras;

const toPosNum = (v: unknown, def = 0): number => {
  const n = Number(v);
  if (Number.isFinite(n) && n > 0) return n;
  if (n === 0) return 0;
  return def;
};

export const usePurchaseItemManager = ({
  bahanBaku,
  items,
  addItem,
  updateItem,
}: UsePurchaseItemManagerProps) => {
  const [newItem, setNewItem] = useState<NewItemState>({
    bahanBakuId: '',
    nama: '',
    kuantitas: '',
    satuan: '',
    hargaSatuan: '',
    keterangan: '',
    // kemasan (opsional)
    jumlahKemasan: '',
    isiPerKemasan: '1',
    satuanKemasan: '',
    hargaTotalBeliKemasan: '',
  });

  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const handleBahanBakuSelect = (bahanBakuId: string) => {
    const selected = bahanBaku.find((b) => b.id === bahanBakuId);
    if (selected) {
      setNewItem((prev) => ({
        ...prev,
        bahanBakuId,
        nama: selected.nama ?? prev.nama ?? '',
        // kalau user sudah isi satuan manual, jangan ditimpa
        satuan: prev.satuan && prev.satuan.trim() ? prev.satuan : (selected.satuan || 'unit'),
      }));
    }
  };

  // Dipanggil dari dialog: handleAddItem({...payload})
  const handleAddItem = (payload?: NewItemState) => {
    const src = payload ?? newItem;

    // sanitasi angka
    const qty = toPosNum(src.kuantitas, 0);
    const price = toPosNum(src.hargaSatuan, 0);

    // validasi minimal
    if (!src.bahanBakuId) return toast.error('Pilih bahan baku dahulu');
    if (!src.nama || !src.nama.trim()) return toast.error('Nama bahan baku tidak valid');
    if (qty <= 0) return toast.error('Kuantitas harus > 0');
    if (price <= 0) return toast.error('Harga satuan harus > 0');

    // kemasan → kirim undefined untuk nilai kosong agar di-NULL di DB
    const jk = toPosNum(src.jumlahKemasan, 0);
    const ipk = toPosNum(src.isiPerKemasan, 0);
    const htot = toPosNum(src.hargaTotalBeliKemasan, 0);
    const sk = (src.satuanKemasan ?? '').trim();

    // addItem minta Omit<PurchaseItem, 'subtotal'> → subtotal dihitung di form/core
    const itemToAdd: Omit<PurchaseItem, 'subtotal'> & {
      jumlahKemasan?: number;
      isiPerKemasan?: number;
      satuanKemasan?: string;
      hargaTotalBeliKemasan?: number;
    } = {
      bahanBakuId: String(src.bahanBakuId),
      nama: String(src.nama).trim(),
      kuantitas: qty,
      satuan: (src.satuan ?? 'unit').trim(),
      hargaSatuan: price,
      keterangan: src.keterangan ? String(src.keterangan).trim() : undefined,
      ...(jk > 0 ? { jumlahKemasan: jk } : {}),
      ...(ipk > 0 ? { isiPerKemasan: ipk } : {}),
      ...(sk ? { satuanKemasan: sk } : {}),
      ...(htot > 0 ? { hargaTotalBeliKemasan: htot } : {}),
    };
    addItem(itemToAdd);

    // reset mini-form
    setNewItem({
      bahanBakuId: '',
      nama: '',
      kuantitas: '',
      satuan: '',
      hargaSatuan: '',
      keterangan: '',
      jumlahKemasan: '',
      isiPerKemasan: '1',
      satuanKemasan: '',
      hargaTotalBeliKemasan: '',
    });
    setShowAddItem(false);
    toast.success('Item berhasil ditambahkan');
  };

  const handleEditItem = (index: number) => {
    setEditingItemIndex(index);
    toast.info('Mode edit item aktif');
  };

  const handleSaveEditedItem = (index: number, updatedItem: Partial<PurchaseItem>) => {
    const qty = toPosNum(updatedItem.kuantitas, 0);
    const price = toPosNum(updatedItem.hargaSatuan, 0);

    if (qty <= 0 || price <= 0) {
      toast.error('Kuantitas dan harga satuan harus > 0');
      return;
    }

    updateItem(index, {
      ...updatedItem,
      subtotal: qty * price,
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
    handleAddItem,          // ← sekarang menerima payload opsional
    handleEditItem,
    handleSaveEditedItem,
    handleCancelEditItem,
  };
};
