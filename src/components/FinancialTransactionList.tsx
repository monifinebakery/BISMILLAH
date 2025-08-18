import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Calendar, DollarSign } from 'lucide-react';
import { FinancialTransaction, FinancialTransactionType } from '@/components/financial/types/financial'; // ✅ PERBAIKAN: Pastikan impor FinancialTransactionType dari '@/types/financial'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDateForDisplay, toSafeISOString, safeParseDate } from '@/utils/unifiedDateUtils'; // ✅ PERBAIKAN: Impor toSafeISOString dan safeParseDate
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
  
  // ✅ PERBAIKAN: Type untuk 'type' diubah menjadi 'income' | 'expense'
  const [formData, setFormData] = useState({
    type: 'expense' as FinancialTransactionType, // Gunakan tipe yang sudah didefinisikan
    category: '',
    amount: 0,
    description: '',
    date: toSafeISOString(new Date()) || '', // ✅ PERBAIKAN: Gunakan toSafeISOString untuk inisialisasi tanggal
  });

  const handleChange = (field: keyof typeof formData, value: string | number | FinancialTransactionType) => { // ✅ PERBAIKAN: Tambahkan FinancialTransactionType ke type value
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'type') {
        newData.category = ''; // Reset kategori saat tipe diubah
      }
      return newData;
    });
  };

  const handleEdit = (transaction: FinancialTransaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type, // ✅ PERBAIKAN: Langsung gunakan transaction.type
      category: transaction.category || '',
      amount: transaction.amount || 0,
      description: transaction.description || '',
      // ✅ PERBAIKAN: Pastikan tanggal diubah ke format YYYY-MM-DD
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
    // ✅ PERBAIKAN: Pastikan type dan date diubah ke format yang benar untuk onUpdateTransaction
    const success = await onUpdateTransaction(editingTransaction.id, {
      type: formData.type, // ✅ PERBAIKAN: Kirim 'income' atau 'expense'
      category: formData.category,
      amount: Number(formData.amount),
      description: formData.description,
      date: safeParseDate(formData.date), // ✅ PERBAIKAN: Kirim Date object
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
    return <Card className="text-center p-8"><p>Memuat transaksi...</p></Card>;
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
          cCard key={transaction.id}e
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {/* ✅ PERBAIKAN: Badge berdasarkan type 'income'/'expense' */}
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
                      {/* ✅ PERBAIKAN: Warna teks jumlah berdasarkan type 'income'/'expense' */}
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
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Transaksi</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Tipe Transaksi</Label>
              {/* ✅ PERBAIKAN: onValueChange sekarang menerima FinancialTransactionType */}
              <Select value={formData.type} onValueChange={(value: FinancialTransactionType) => handleChange('type', value)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {/* ✅ PERBAIKAN: Value diubah ke 'income' dan 'expense' */}
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
                  {/* ✅ PERBAIKAN: Categories berdasarkan formData.type ('income'/'expense') */}
                  {(formData.type === 'income' ? categories.income : categories.expense).map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Jumlah</Label>
              <Input type="number" name="amount" value={formData.amount} onChange={(e) => handleChange('amount', e.target.value)} className="mt-1" placeholder="Masukkan jumlah" />
            </div>
            <div>
              <Label>Deskripsi</Label>
              <Input type="text" name="description" value={formData.description || ''} onChange={(e) => handleChange('description', e.target.value)} className="mt-1" placeholder="Masukkan deskripsi" />
            </div>
            <div>
              <Label>Tanggal</Label>
              <Input type="date" name="date" value={formData.date} onChange={(e) => handleChange('date', e.target.value)} className="mt-1" />
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-4">
            <Button onClick={() => setEditingTransaction(null)} variant="outline">Batal</Button>
            <Button onClick={handleSave}>Simpan</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FinancialTransactionList;
