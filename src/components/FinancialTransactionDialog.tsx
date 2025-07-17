import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "sonner";

interface FinancialTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: any) => Promise<boolean>;
  categories: { income: string[]; expense: string[] };
}

const FinancialTransactionDialog: React.FC<FinancialTransactionDialogProps> = ({ isOpen, onClose, onAddTransaction, categories }) => {
  const [formData, setFormData] = useState({
    user_id: '',
    type: 'pemasukan' as 'pemasukan' | 'pengeluaran',
    category: '', // Nilai awal adalah string kosong untuk "no selection"
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        user_id: '',
        type: 'pemasukan',
        category: '', // Pastikan reset ke string kosong
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
    }
  }, [isOpen]);

  const handleChange = (name: string, value: string | number) => {
    // MODIFIED: Handle nilai placeholder khusus untuk kategori
    if (name === 'category' && value === "-placeholder-category-") {
      setFormData(prev => ({ ...prev, [name]: '' })); // Simpan sebagai string kosong
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    // MODIFIED: Validasi untuk kategori agar tidak kosong (setelah dikonversi dari placeholder)
    if (!formData.category.trim() || formData.amount <= 0 || !formData.description || !formData.date) {
      toast.error('Kategori, jumlah, deskripsi, dan tanggal wajib diisi, jumlah harus lebih dari 0.');
      return;
    }

    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user.id || '';

    const transactionData = {
      user_id: userId,
      type: formData.type,
      category: formData.category,
      amount: parseFloat(formData.amount.toString()),
      description: formData.description,
      date: new Date(formData.date),
    };

    const success = await onAddTransaction(transactionData);
    if (success) {
      onClose();
      toast.success('Transaksi berhasil ditambahkan!');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Transaksi Keuangan</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="type" className="block text-sm font-medium text-gray-700">Tipe Transaksi</Label>
            <Select name="type" value={String(formData.type)} onValueChange={(value: 'pemasukan' | 'pengeluaran') => handleChange('type', value)}>
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="Pilih tipe transaksi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pemasukan">Pemasukan</SelectItem>
                <SelectItem value="pengeluaran">Pengeluaran</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="category" className="block text-sm font-medium text-gray-700">Kategori</Label>
            <Select
              name="category"
              // MODIFIED: Value untuk Select harus string (formData.category bisa '' jika tidak ada pilihan)
              value={formData.category} // Nilai yang dipilih (string atau '')
              onValueChange={(value) => handleChange('category', value)}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {/* MODIFIED: Item placeholder dengan nilai unik non-kosong dan disabled */}
                <SelectItem value="" disabled>Pilih Kategori</SelectItem>
                {(formData.type === 'pemasukan' ? categories.income : categories.expense).map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="amount" className="block text-sm font-medium text-gray-700">Jumlah</Label>
            <Input
              type="number"
              name="amount"
              value={String(formData.amount)}
              onChange={(e) => handleChange('amount', Number(e.target.value))}
              className="mt-1 w-full"
              placeholder="Masukkan jumlah"
            />
          </div>
          <div>
            <Label htmlFor="description" className="block text-sm font-medium text-gray-700">Deskripsi</Label>
            <Input
              type="text"
              name="description"
              value={String(formData.description)}
              onChange={(e) => handleChange('description', e.target.value)}
              className="mt-1 w-full"
              placeholder="Masukkan deskripsi"
            />
          </div>
          <div>
            <Label htmlFor="date" className="block text-sm font-medium text-gray-700">Tanggal</Label>
            <Input
              type="date"
              name="date"
              value={String(formData.date)}
              onChange={(e) => handleChange('date', e.target.value)}
              className="mt-1 w-full"
              placeholder="Masukkan tanggal"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="px-4 py-2"
          >
            Batal
          </Button>
          <Button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            Simpan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialTransactionDialog;