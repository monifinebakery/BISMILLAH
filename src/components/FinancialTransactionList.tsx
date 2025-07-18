import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Calendar, DollarSign } from 'lucide-react';
import { FinancialTransaction } from '@/types/financial';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDateForDisplay } from '@/utils/dateUtils';
import { formatCurrency } from '@/utils/currencyUtils';

interface FinancialTransactionListProps {
  transactions: FinancialTransaction[];
  loading: boolean;
  onUpdateTransaction: (id: string, transaction: Omit<FinancialTransaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>; // Tambahkan updatedAt
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
    type: 'income' as 'income' | 'expense',
    category: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  // FUNGSI formatCurrency LOKAL DIHAPUS DARI SINI
  // const formatCurrency = (value: number) => { ... };

  const handleEdit = (transaction: FinancialTransaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      category: transaction.category || '', // Pastikan category string
      amount: transaction.amount,
      description: transaction.description || '', // Pastikan description string
      // Pastikan transaction.date adalah objek Date yang valid sebelum memanggil toISOString
      date: transaction.date instanceof Date && !isNaN(transaction.date.getTime())
        ? transaction.date.toISOString().split('T')[0]
        : '',
    });
  };

  const handleSave = async () => {
    if (!editingTransaction) return;

    // Pastikan nilai yang dikirim sesuai dengan interface Omit<FinancialTransaction, 'id' | 'createdAt' | 'updatedAt'>
    // Category dan Description bisa null di interface, jadi tidak perlu cek !formData.category
    if (!formData.amount) {
        toast.error('Jumlah tidak boleh kosong.');
        return;
    }

    const success = await onUpdateTransaction(editingTransaction.id, {
      type: formData.type,
      category: formData.category || null, // Kirim null jika string kosong
      amount: formData.amount,
      description: formData.description || null, // Kirim null jika string kosong
      date: new Date(formData.date), // Pastikan ini Date objek
      // createdAt dan updatedAt tidak perlu disertakan di sini karena Omit<...>
      // userId juga tidak perlu
    });

    if (success) {
      setEditingTransaction(null);
      toast.success('Transaksi berhasil disimpan!');
    } else {
      toast.error('Gagal menyimpan transaksi.');
    }
  };

  const handleDelete = async (id: string, description: string | null) => { // description bisa null
    if (confirm(`Apakah Anda yakin ingin menghapus transaksi "${description || 'Tanpa Deskripsi'}"?`)) {
      const success = await onDeleteTransaction(id);
      if (success) {
        toast.success('Transaksi berhasil dihapus!');
      } else {
        toast.error('Gagal menghapus transaksi.');
      }
    }
  };

  if (loading) {
    return (
      <Card className="text-center p-8">
        <p className="text-gray-500">Memuat transaksi...</p>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="text-center p-8">
        <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Belum ada transaksi dalam periode ini</p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {transactions.map((transaction) => (
          <Card key={transaction.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      className={
                        transaction.type === 'income' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                    </Badge>
                    <span className="text-sm text-gray-500">{transaction.category || 'Tidak Berkategori'}</span>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-1">{transaction.description || 'Tidak Ada Deskripsi'}</h3>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDateForDisplay(transaction.date)}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span className={`font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(transaction)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(transaction.id, transaction.description)}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Hapus
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editingTransaction} onOpenChange={() => setEditingTransaction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Transaksi</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Tipe Transaksi</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'income' | 'expense') =>
                  setFormData({ ...formData, type: value, category: '' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Pemasukan</SelectItem>
                  <SelectItem value="expense">Pengeluaran</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Kategori</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {(formData.type === 'income' ? categories.income : categories.expense).map(
                    (category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Jumlah (Rp)</Label>
              <Input
                type="number"
                value={formData.amount || ''}
                onChange={(e) =>
                  setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                }
                placeholder="0"
              />
            </div>

            <div>
              <Label>Deskripsi</Label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Deskripsi transaksi"
              />
            </div>

            <div>
              <Label>Tanggal</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <Button variant="outline" onClick={() => setEditingTransaction(null)} className="flex-1">
              Batal
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FinancialTransactionList;