// src/components/financial/components/DebtTracker.tsx

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Calendar, AlertTriangle, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ==============================================
// TYPES
// ==============================================

interface DebtItem {
  id: string;
  type: 'hutang' | 'piutang'; // hutang = kita yang ngutang, piutang = orang yang ngutang ke kita
  name: string; // nama orang/toko
  amount: number;
  description: string;
  dueDate: string;
  status: 'belum_bayar' | 'sudah_bayar';
  createdAt: string;
}

interface DebtTrackerProps {
  className?: string;
}

// ==============================================
// MAIN COMPONENT
// ==============================================

const DebtTracker: React.FC<DebtTrackerProps> = ({ className }) => {
  // State untuk data hutang piutang (dalam praktik nyata, ini harus dari database)
  const [debts, setDebts] = useState<DebtItem[]>(() => {
    const saved = localStorage.getItem('umkm-debt-tracker');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'hutang' as 'hutang' | 'piutang',
    name: '',
    amount: '',
    description: '',
    dueDate: ''
  });

  // Save to localStorage whenever debts change
  const saveDebts = (newDebts: DebtItem[]) => {
    setDebts(newDebts);
    localStorage.setItem('umkm-debt-tracker', JSON.stringify(newDebts));
  };

  // Analisis data hutang piutang
  const debtAnalysis = useMemo(() => {
    const activeDebts = debts.filter(d => d.status === 'belum_bayar');
    
    const totalHutang = activeDebts
      .filter(d => d.type === 'hutang')
      .reduce((sum, d) => sum + d.amount, 0);
    
    const totalPiutang = activeDebts
      .filter(d => d.type === 'piutang')
      .reduce((sum, d) => sum + d.amount, 0);
    
    // Cek yang jatuh tempo dalam 7 hari
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const dueSoon = activeDebts.filter(d => {
      const dueDate = new Date(d.dueDate);
      return dueDate <= nextWeek && dueDate >= today;
    });
    
    // Yang sudah lewat jatuh tempo
    const overdue = activeDebts.filter(d => {
      const dueDate = new Date(d.dueDate);
      return dueDate < today;
    });

    return {
      totalHutang,
      totalPiutang,
      netPosition: totalPiutang - totalHutang,
      dueSoon,
      overdue,
      activeDebts
    };
  }, [debts]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.amount || !formData.dueDate) {
      alert('Mohon isi semua field yang wajib');
      return;
    }

    const newDebt: DebtItem = {
      id: Date.now().toString(),
      type: formData.type,
      name: formData.name,
      amount: parseFloat(formData.amount),
      description: formData.description,
      dueDate: formData.dueDate,
      status: 'belum_bayar',
      createdAt: new Date().toISOString()
    };

    saveDebts([...debts, newDebt]);
    
    // Reset form
    setFormData({
      type: 'hutang',
      name: '',
      amount: '',
      description: '',
      dueDate: ''
    });
    
    setIsDialogOpen(false);
  };

  const markAsPaid = (id: string) => {
    const updatedDebts = debts.map(debt => 
      debt.id === id ? { ...debt, status: 'sudah_bayar' as const } : debt
    );
    saveDebts(updatedDebts);
  };

  const deleteDebt = (id: string) => {
    if (confirm('Yakin mau hapus data ini?')) {
      const updatedDebts = debts.filter(debt => debt.id !== id);
      saveDebts(updatedDebts);
    }
  };

  const getStatusColor = (debt: DebtItem) => {
    const daysUntilDue = getDaysUntilDue(debt.dueDate);
    
    if (daysUntilDue < 0) return 'border-red-500 bg-red-50'; // Overdue
    if (daysUntilDue <= 3) return 'border-orange-500 bg-orange-50'; // Due soon
    return 'border-gray-200 bg-white'; // Normal
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600" />
              Hutang Piutang
            </CardTitle>
            <p className="text-sm text-orange-600">
              Catat siapa yang ngutang dan kapan harus bayar
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Tambah
              </Button>
            </DialogTrigger>
            <DialogContent centerMode="overlay" size="md">
                <DialogHeader className="dialog-header-pad">
                  <DialogTitle>Tambah Hutang/Piutang Baru</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="dialog-body space-y-4 py-4">
                <div>
                  <Label htmlFor="type">Jenis</Label>
                  <Select value={formData.type} onValueChange={(value: 'hutang' | 'piutang') => setFormData({...formData, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hutang">Hutang (Kita yang ngutang)</SelectItem>
                      <SelectItem value="piutang">Piutang (Orang yang ngutang ke kita)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="name">Nama Orang/Toko *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Contoh: Pak Budi, Toko Makmur"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="amount">Jumlah (Rupiah) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="100000"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Keterangan</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Contoh: Beli bahan baku, Jual produk"
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label htmlFor="dueDate">Tanggal Jatuh Tempo *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    required
                  />
                  </div>
                  
                  </div>
                  
                <DialogFooter className="dialog-footer-pad pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                    <Button type="submit">Simpan</Button>
                  </DialogFooter>
                </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-orange-800 mb-1">Total Hutang</h4>
            <p className="text-xl font-bold text-orange-700">{formatCurrency(debtAnalysis.totalHutang)}</p>
            <p className="text-xs text-orange-600">Yang harus kita bayar</p>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-orange-800 mb-1">Total Piutang</h4>
            <p className="text-xl font-bold text-orange-700">{formatCurrency(debtAnalysis.totalPiutang)}</p>
            <p className="text-xs text-orange-600">Yang harus dibayar ke kita</p>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-orange-800 mb-1">
              Posisi Bersih
            </h4>
            <p className="text-xl font-bold text-orange-700">
              {formatCurrency(Math.abs(debtAnalysis.netPosition))}
            </p>
            <p className="text-xs text-orange-600">
              {debtAnalysis.netPosition >= 0 ? "Lebih banyak piutang" : "Lebih banyak hutang"}
            </p>
          </div>
        </div>

        {/* Alerts */}
        {debtAnalysis.overdue.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <h4 className="font-medium text-orange-800">Sudah Lewat Jatuh Tempo!</h4>
            </div>
            <p className="text-sm text-orange-700">
              Ada {debtAnalysis.overdue.length} item yang sudah lewat jatuh tempo. Segera tindak lanjuti!
            </p>
          </div>
        )}

        {debtAnalysis.dueSoon.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <h4 className="font-medium text-orange-800">Jatuh Tempo Minggu Ini</h4>
            </div>
            <p className="text-sm text-orange-700">
              Ada {debtAnalysis.dueSoon.length} item yang jatuh tempo dalam 7 hari ke depan.
            </p>
          </div>
        )}

        {/* Debt List */}
        <div className="space-y-3">
          <h4 className="font-medium text-orange-800">Daftar Hutang Piutang Aktif:</h4>
          
          {debtAnalysis.activeDebts.length === 0 ? (
            <div className="text-center py-8 text-orange-500">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Belum ada data hutang piutang</p>
              <p className="text-sm">Klik tombol "Tambah" untuk mulai mencatat</p>
            </div>
          ) : (
            debtAnalysis.activeDebts.map((debt) => {
              const daysUntilDue = getDaysUntilDue(debt.dueDate);
              
              return (
                <div key={debt.id} className={cn("border rounded-lg p-4", getStatusColor(debt))}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          debt.type === 'hutang' 
                            ? "bg-red-100 text-red-700" 
                            : "bg-green-100 text-green-700"
                        )}>
                          {debt.type === 'hutang' ? 'Hutang' : 'Piutang'}
                        </span>
                        <h5 className="font-medium text-orange-800">{debt.name}</h5>
                      </div>
                      
                      <p className="text-lg font-bold text-orange-900">{formatCurrency(debt.amount)}</p>
                      
                      {debt.description && (
                        <p className="text-sm text-orange-600 mt-1">{debt.description}</p>
                      )}
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-orange-500" />
                          <span className="text-orange-600">
                            {formatDate(debt.dueDate)}
                          </span>
                        </div>
                        
                        <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700">
                          {daysUntilDue < 0 ? `Telat ${Math.abs(daysUntilDue)} hari` :
                           daysUntilDue === 0 ? 'Jatuh tempo hari ini' :
                           `${daysUntilDue} hari lagi`}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 ml-0 sm:ml-4 mt-3 sm:mt-0">
                      <Button
                        size="sm"
                        onClick={() => markAsPaid(debt.id)}
                        className="flex items-center gap-1 w-full sm:w-auto"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Lunas
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteDebt(debt.id)}
                        className="flex items-center gap-1 text-orange-600 hover:text-orange-700 w-full sm:w-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Tips */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h5 className="font-medium text-orange-800 mb-2">💡 Tips Kelola Hutang Piutang:</h5>
          <ul className="text-sm text-orange-700 space-y-1">
            <li>• Catat semua hutang piutang, jangan andalkan ingatan</li>
            <li>• Set reminder sebelum jatuh tempo</li>
            <li>• Untuk piutang, follow up secara sopan tapi tegas</li>
            <li>• Jangan biarkan hutang menumpuk terlalu banyak</li>
            <li>• Buat kesepakatan tertulis untuk jumlah besar</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default DebtTracker;