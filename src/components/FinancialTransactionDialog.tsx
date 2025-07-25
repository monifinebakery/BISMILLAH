import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FinancialTransaction } from '@/components/financial/types';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Tipe data untuk form
type TransactionFormData = Omit<FinancialTransaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

interface FinancialTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<FinancialTransaction, 'id' | 'userId' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  onUpdateTransaction?: (id: string, transaction: Partial<FinancialTransaction>) => Promise<boolean>;
  transactionToEdit?: FinancialTransaction | null;
  // PERBAIKAN: Menerima objek kategori yang lebih terstruktur
  categories: {
    income: string[];
    expense: string[];
  };
}

const FinancialTransactionDialog: React.FC<FinancialTransactionDialogProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  onUpdateTransaction,
  transactionToEdit,
  categories,
}) => {
  const initialFormState: TransactionFormData = {
    type: 'pengeluaran',
    amount: 0,
    category: '',
    description: '',
    date: new Date(),
  };

  const [formData, setFormData] = useState<TransactionFormData>(initialFormState);

  useEffect(() => {
    if (transactionToEdit) {
      setFormData({
        type: transactionToEdit.type,
        amount: transactionToEdit.amount,
        category: transactionToEdit.category || '',
        description: transactionToEdit.description || '',
        date: transactionToEdit.date ? new Date(transactionToEdit.date) : new Date(),
      });
    } else {
      setFormData(initialFormState);
    }
  }, [transactionToEdit, isOpen]);

  const handleChange = (field: keyof TransactionFormData, value: string | number | Date) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      // Jika tipe diubah, reset kategori
      if (field === 'type') {
        newData.category = '';
      }
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) {
      toast.error("Jumlah transaksi harus lebih dari 0.");
      return;
    }
    if (!formData.category) {
      toast.error("Kategori wajib dipilih.");
      return;
    }

    let success = false;
    if (transactionToEdit && onUpdateTransaction) {
      success = await onUpdateTransaction(transactionToEdit.id, formData);
    } else {
      success = await onAddTransaction(formData);
    }

    if (success) {
      onClose();
    }
  };

  // ✅ PERBAIKAN: Tentukan daftar kategori yang akan ditampilkan berdasarkan tipe yang dipilih
  const currentCategoryList = formData.type === 'pemasukan' ? categories.income : categories.expense;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{transactionToEdit ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Tipe</Label>
              <Select
                name="type"
                value={formData.type}
                onValueChange={(value: 'pemasukan' | 'pengeluaran') => handleChange('type', value)}
              >
                <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pengeluaran">Pengeluaran</SelectItem>
                  <SelectItem value="pemasukan">Pemasukan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount">Jumlah (Rp)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                placeholder="0"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="category">Kategori</Label>
            <Select
              name="category"
              value={formData.category || ''}
              onValueChange={(value) => handleChange('category', value)}
            >
              <SelectTrigger id="category"><SelectValue placeholder="Pilih kategori..." /></SelectTrigger>
              <SelectContent>
                {/* ✅ PERBAIKAN: Gunakan `currentCategoryList` untuk me-render item */}
                {currentCategoryList.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <Input
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Contoh: Beli Tepung Terigu"
            />
          </div>
          <div>
            <Label htmlFor="date">Tanggal</Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date ? format(formData.date, 'yyyy-MM-dd') : ''}
              onChange={(e) => handleChange('date', new Date(e.target.value))}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Batal</Button>
            <Button type="submit">Simpan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialTransactionDialog;