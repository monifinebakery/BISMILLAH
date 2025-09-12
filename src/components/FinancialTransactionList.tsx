// src/components/financial/components/FinancialTransactionList.tsx
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Calendar, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { FinancialTransaction, FinancialTransactionType } from '@/components/financial/types/financial';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDateForDisplay, toSafeISOString, safeParseDate } from '@/utils/unifiedDateUtils';
import { formatCurrency } from '@/utils/formatUtils';
import { toast } from 'sonner';

interface FinancialTransactionListProps {
  transactions: FinancialTransaction[];
  loading: boolean;
  onUpdateTransaction: (id: string, transaction: Partial<Omit<FinancialTransaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => Promise<boolean>;
  onDeleteTransaction: (id: string) => Promise<boolean>;
  categories: {
    income: string[];
    expense: string[];
  };
}

const FinancialTransactionList = ({
  transactions,
  loading,
  onUpdateTransaction,
  onDeleteTransaction,
  categories,
}: FinancialTransactionListProps) => {
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);
  
  const [formData, setFormData] = useState({
    type: 'expense' as FinancialTransactionType,
    category: '',
    amount: 0,
    description: '',
    date: toSafeISOString(new Date()) || '',
  });

  const handleChange = (field: keyof typeof formData, value: string | number | FinancialTransactionType) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'type') {
        newData.category = '';
      }
      return newData;
    });
  };

  const handleEdit = (transaction: FinancialTransaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      category: transaction.category || '',
      amount: transaction.amount || 0,
      description: transaction.description || '',
      date: transaction.date ? (transaction.date instanceof Date ? toSafeISOString(transaction.date) || '' : toSafeISOString(safeParseDate(transaction.date)) || '') : '',
    });
  };

  const handleSave = async () => {
    if (!editingTransaction) return;
    if (!formData.category) {
      toast.error('Kategori transaksi wajib dipilih.');
      return;
    }
    if (formData.amount <= 0) {
      toast.error('Jumlah transaksi harus lebih dari 0.');
      return;
    }
    
    const success = await onUpdateTransaction(editingTransaction.id, {
      type: formData.type,
      category: formData.category,
      amount: Number(formData.amount),
      description: formData.description,
      date: safeParseDate(formData.date),
    });

    if (success) {
      setEditingTransaction(null);
      toast.success('Transaksi berhasil diperbarui!');
    }
  };

  const handleDelete = async (id: string, description: string | null) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus transaksi "${description || 'Tanpa Deskripsi'}"?`)) {
      await onDeleteTransaction(id);
    }
  };

  if (loading) {
    return (
      <Card className="text-center p-8">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32 mx-auto" />
          <Skeleton className="h-4 w-24 mx-auto" />
        </div>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="text-center p-8">
        <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Belum ada transaksi dalam periode ini.</p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {transactions.map((transaction) => (
          <Card key={transaction.id}>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={
                        transaction.type === 'income'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                    }>
                      {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                    </Badge>
                    <span className="text-sm text-gray-500">{transaction.category || 'Tidak Berkategori'}</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{transaction.description || 'Tidak Ada Deskripsi'}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDateForDisplay(transaction.date)}</div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span className={`font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(transaction.amount)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 self-start sm:self-center">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(transaction)} className="flex items-center gap-2"><Edit className="h-4 w-4" /> Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(transaction.id, transaction.description)} className="flex items-center gap-2"><Trash2 className="h-4 w-4" /> Hapus</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingTransaction} onOpenChange={() => setEditingTransaction(null)}>
        <DialogContent centerMode="overlay" className="dialog-overlay-center">
          <div className="dialog-panel">
            <DialogHeader className="dialog-header-pad">
              <DialogTitle>Edit Transaksi</DialogTitle>
            </DialogHeader>
            <div className="dialog-body">
              <div className="space-y-4 py-4">
                <div>
                  <Label>Tipe Transaksi</Label>
                  <Select value={formData.type} onValueChange={(value: FinancialTransactionType) => handleChange('type', value)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Pemasukan</SelectItem>
                      <SelectItem value="expense">Pengeluaran</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Kategori</Label>
                  <Select value={formData.category || ''} onValueChange={(value) => handleChange('category', value)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                    <SelectContent>
                      {(formData.type === 'income' ? categories.income : categories.expense).map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Jumlah</Label>
                  <Input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                    className="mt-1"
                    placeholder="Masukkan jumlah"
                  />
                </div>
                <div>
                  <Label>Deskripsi</Label>
                  <Input
                    type="text"
                    name="description"
                    value={formData.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    className="mt-1"
                    placeholder="Masukkan deskripsi"
                  />
                </div>
                <div>
                  <Label>Tanggal</Label>
                  <Input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={(e) => handleChange('date', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="dialog-footer-pad">
              <Button onClick={() => setEditingTransaction(null)} variant="outline">Batal</Button>
              <Button onClick={handleSave}>Simpan</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FinancialTransactionList;