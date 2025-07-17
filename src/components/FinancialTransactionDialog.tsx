import React, { useState } from 'react';
import { toast } from 'sonner';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface FinancialTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: any) => Promise<boolean>;
  categories: string[];
}

const FinancialTransactionDialog: React.FC<FinancialTransactionDialogProps> = ({ isOpen, onClose, onAddTransaction, categories }) => {
  const [formData, setFormData] = useState({
    user_id: '',
    type: 'pemasukan' as 'pemasukan' | 'pengeluaran',
    category: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleChange = (name: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!formData.category || formData.amount <= 0 || !formData.description || !formData.date) {
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
      setFormData({
        user_id: '',
        type: 'pemasukan',
        category: '',
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      toast.success('Transaksi berhasil ditambahkan!');
    }
  };

  if (!isOpen) return null;

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Tambah Transaksi Keuangan</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Tipe Transaksi</label>
          <Select name="type" value={formData.type} onValueChange={(value) => handleChange('type', value)}>
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
          <label className="block text-sm font-medium text-gray-700">Kategori</label>
          <Select name="category" value={formData.category} onValueChange={(value) => handleChange('category', value)}>
            <SelectTrigger className="mt-1 w-full">
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Pilih Kategori</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Jumlah</label>
          <Input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={(e) => handleChange('amount', e.target.value)}
            className="mt-1 w-full"
            placeholder="Masukkan jumlah"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
          <Input
            type="text"
            name="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="mt-1 w-full"
            placeholder="Masukkan deskripsi"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Tanggal</label>
          <Input
            type="date"
            name="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            className="mt-1 w-full"
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
  );
};

export default FinancialTransactionDialog;