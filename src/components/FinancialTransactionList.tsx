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
import { getInputValue } from '@/utils/inputUtils';

interface FinancialTransactionListProps {
  transactions: FinancialTransaction[];
  loading: boolean;
  onUpdateTransaction: (id: string, transaction: Omit<FinancialTransaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
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
    type: 'pemasukan' as 'pemasukan' | 'pengeluaran',
    category: '' as string | null,
    amount: 0 as number,
    description: '' as string | null,
    date: new Date().toISOString().split('T')[0],
  });

  const handleEdit = (transaction: FinancialTransaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      category: transaction.category || '',
      amount: transaction.amount || 0,
      description: transaction.description || '',
      date: transaction.date instanceof Date && !isNaN(transaction.date.getTime())
        ? transaction.date.toISOString().split('T')[0]
        : '',
    });
  };

  const handleSave = async () => {
    if (!editingTransaction) return;

    if (formData.amount === '' || isNaN(Number(formData.amount))) {
        toast.error('Jumlah tidak boleh kosong dan harus berupa angka.');
        return;
    }
    if (!formData.description?.trim()) {
      toast.error('Deskripsi transaksi wajib diisi.');
      return;
    }
    if (!formData.category?.trim()) {
      toast.error('Kategori transaksi wajib dipilih.');
      return;
    }


    const success = await onUpdateTransaction(editingTransaction.id, {
      type: formData.type,
      category: formData.category || null,
      amount: parseFloat(String(formData.amount)) || 0,
      description: formData.description || null,
      date: new Date(formData.date),
    });

    if (success) {
      setEditingTransaction(null);
      toast.success('Transaksi berhasil disimpan!');
    } else {
      toast.error('Gagal menyimpan transaksi.');
    }
  };

  const handleDelete = async (id: string, description: string | null) => {
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
                      // MODIFIED: Perbaikan perbandingan tipe transaksi
                      className={
                        transaction.type === 'pemasukan' // <-- DIUBAH KE 'pemasukan'
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {/* MODIFIED: Perbaikan teks tampilan tipe transaksi */}
                      {transaction.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'} {/* <-- DIUBAH KE 'pemasukan' */}
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
                        transaction.type === 'pemasukan' ? 'text-green-600' : 'text-red-600' // <-- DIUBAH KE 'pemasukan'
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
                value={getInputValue(formData.type) as string}
                onValueChange={(value: 'pemasukan' | 'pengeluaran') => handleChange('type', value)}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pemasukan">Pemasukan</SelectItem>
                  <SelectItem value="pengeluaran">Pengeluaran</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Kategori</Label>
              <Select
                value={getInputValue(formData.category) as string}
                onValueChange={(value) => handleChange('category', value)}
              >
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-placeholder-category-" disabled>Pilih Kategori</SelectItem>
                  {(formData.type === 'pemasukan' ? categories.income : categories.expense).map((cat) => (
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
                value={getInputValue(formData.amount)}
                onChange={(e) => handleChange('amount', Number(e.target.value))}
                className="mt-1 w-full"
                placeholder="Masukkan jumlah"
              />
            </div>

            <div>
              <Label>Deskripsi</Label>
              <Input
                type="text"
                name="description"
                value={getInputValue(formData.description)}
                onChange={(e) => handleChange('description', e.target.value)}
                className="mt-1 w-full"
                placeholder="Masukkan deskripsi"
              />
            </div>

            <div>
              <Label>Tanggal</Label>
              <Input
                type="date"
                name="date"
                value={formatDateToYYYYMMDD(formData.date)}
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
    </>
  );
};

export default FinancialTransactionList;