// src/components/financial/components/ExpenseAlerts.tsx

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Bell, Settings, TrendingUp, DollarSign, Calendar, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';

// ==============================================
// TYPES
// ==============================================

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string | null;
  description: string | null;
  date: Date | string | null;
}

interface ExpenseBudget {
  id: string;
  category: string;
  monthlyLimit: number;
  alertThreshold: number; // percentage (e.g., 80 for 80%)
  isActive: boolean;
}

interface ExpenseAlertsProps {
  transactions: Transaction[];
  className?: string;
}

// ==============================================
// MAIN COMPONENT
// ==============================================

const ExpenseAlerts: React.FC<ExpenseAlertsProps> = ({ transactions, className }) => {
  const { formatCurrency } = useCurrency();
  // State untuk budget limits (dalam praktik nyata, ini harus dari database)
  const [budgets, setBudgets] = useState<ExpenseBudget[]>(() => {
    const saved = localStorage.getItem('umkm-expense-budgets');
    return saved ? JSON.parse(saved) : [
      { id: '1', category: 'Beli Bahan', monthlyLimit: 2000000, alertThreshold: 80, isActive: true },
      { id: '2', category: 'Operasional', monthlyLimit: 1000000, alertThreshold: 75, isActive: true },
      { id: '3', category: 'Gaji', monthlyLimit: 3000000, alertThreshold: 90, isActive: true }
    ];
  });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    monthlyLimit: '',
    alertThreshold: '80'
  });

  // Save budgets to localStorage
  const saveBudgets = (newBudgets: ExpenseBudget[]) => {
    setBudgets(newBudgets);
    localStorage.setItem('umkm-expense-budgets', JSON.stringify(newBudgets));
  };

  // Analisis pengeluaran bulan ini
  const monthlyAnalysis = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    // Filter transaksi bulan ini
    const thisMonthExpenses = transactions.filter(t => {
      if (t.type !== 'expense') return false;
      
      let dateStr = '';
      if (t.date instanceof Date) {
        dateStr = t.date.toISOString().slice(0, 7);
      } else if (typeof t.date === 'string' && t.date) {
        dateStr = t.date.slice(0, 7);
      }
      
      return dateStr === currentMonth;
    });

    // Hitung pengeluaran per kategori
    const expensesByCategory = thisMonthExpenses.reduce((acc, t) => {
      const category = t.category || 'Lainnya';
      acc[category] = (acc[category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    // Cek budget alerts
    const alerts = budgets
      .filter(budget => budget.isActive)
      .map(budget => {
        const spent = expensesByCategory[budget.category] || 0;
        const percentage = (spent / budget.monthlyLimit) * 100;
        const isOverBudget = percentage > 100;
        const isNearLimit = percentage >= budget.alertThreshold;
        
        return {
          ...budget,
          spent,
          percentage,
          remaining: budget.monthlyLimit - spent,
          isOverBudget,
          isNearLimit,
          status: isOverBudget ? 'over' : isNearLimit ? 'warning' : 'safe'
        };
      })
      .sort((a, b) => b.percentage - a.percentage);

    const totalBudget = budgets.reduce((sum, b) => sum + (b.isActive ? b.monthlyLimit : 0), 0);
    const totalSpent = Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0);
    const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
      expensesByCategory,
      alerts,
      totalBudget,
      totalSpent,
      totalPercentage,
      hasAlerts: alerts.some(a => a.isNearLimit || a.isOverBudget)
    };
  }, [transactions, budgets]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.monthlyLimit) {
      alert('Mohon isi kategori dan batas budget');
      return;
    }

    const newBudget: ExpenseBudget = {
      id: Date.now().toString(),
      category: formData.category,
      monthlyLimit: parseFloat(formData.monthlyLimit),
      alertThreshold: parseFloat(formData.alertThreshold),
      isActive: true
    };

    saveBudgets([...budgets, newBudget]);
    
    // Reset form
    setFormData({
      category: '',
      monthlyLimit: '',
      alertThreshold: '80'
    });
    
    setIsDialogOpen(false);
  };

  const toggleBudget = (id: string) => {
    const updatedBudgets = budgets.map(budget => 
      budget.id === id ? { ...budget, isActive: !budget.isActive } : budget
    );
    saveBudgets(updatedBudgets);
  };

  const deleteBudget = (id: string) => {
    if (confirm('Yakin mau hapus budget ini?')) {
      const updatedBudgets = budgets.filter(budget => budget.id !== id);
      saveBudgets(updatedBudgets);
    }
  };

  const getAlertColor = (status: string) => {
    switch (status) {
      case 'over': return 'border-red-500 bg-red-50';
      case 'warning': return 'border-orange-500 bg-orange-50';
      default: return 'border-green-500 bg-green-50';
    }
  };

  const getAlertIcon = (status: string) => {
    switch (status) {
      case 'over': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'warning': return <Bell className="h-5 w-5 text-orange-600" />;
      default: return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-600" />
              Peringatan Pengeluaran
            </CardTitle>
            <p className="text-sm text-gray-600">
              Pantau budget dan dapat notifikasi sebelum over spending
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Atur Budget
              </Button>
            </DialogTrigger>
            <DialogContent centerMode="overlay" size="md">
              <div className="dialog-panel dialog-panel-md">
                <DialogHeader className="dialog-header border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl text-gray-900">Tambah Budget Kategori</DialogTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        Atur batas pengeluaran dan peringatan untuk kategori
                      </p>
                    </div>
                  </div>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="dialog-body space-y-4">
                <div>
                  <Label htmlFor="category">Kategori Pengeluaran *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beli Bahan">Beli Bahan</SelectItem>
                      <SelectItem value="Operasional">Operasional</SelectItem>
                      <SelectItem value="Gaji">Gaji Karyawan</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Transportasi">Transportasi</SelectItem>
                      <SelectItem value="Listrik & Air">Listrik & Air</SelectItem>
                      <SelectItem value="Lainnya">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="monthlyLimit">Batas Budget Bulanan (Rupiah) *</Label>
                  <Input
                    id="monthlyLimit"
                    type="number"
                    value={formData.monthlyLimit}
                    onChange={(e) => setFormData({...formData, monthlyLimit: e.target.value})}
                    placeholder="2000000"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="alertThreshold">Peringatan Saat Mencapai (%) *</Label>
                  <Select value={formData.alertThreshold} onValueChange={(value) => setFormData({...formData, alertThreshold: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="70">70% dari budget</SelectItem>
                      <SelectItem value="75">75% dari budget</SelectItem>
                      <SelectItem value="80">80% dari budget</SelectItem>
                      <SelectItem value="85">85% dari budget</SelectItem>
                      <SelectItem value="90">90% dari budget</SelectItem>
                    </SelectContent>
                  </Select>
                  </div>
                  
                  </div>
                  
                  <DialogFooter className="dialog-footer-pad">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                    <Button type="submit">Simpan</Button>
                  </DialogFooter>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-800">Total Budget Bulan Ini</h4>
            <DollarSign className="h-5 w-5 text-gray-600" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Sudah dipakai:</span>
              <span className="font-medium">{formatCurrency(monthlyAnalysis.totalSpent)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total budget:</span>
              <span className="font-medium">{formatCurrency(monthlyAnalysis.totalBudget)}</span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
              <div 
                className={cn(
                  "h-3 rounded-full transition-all",
                  monthlyAnalysis.totalPercentage > 100 ? "bg-red-500" :
                  monthlyAnalysis.totalPercentage > 80 ? "bg-orange-500" :
                  "bg-green-500"
                )}
                style={{ width: `${Math.min(monthlyAnalysis.totalPercentage, 100)}%` }}
              />
            </div>
            
            <div className="flex justify-between text-xs text-gray-600">
              <span>0%</span>
              <span className={cn(
                "font-medium",
                monthlyAnalysis.totalPercentage > 100 ? "text-red-600" :
                monthlyAnalysis.totalPercentage > 80 ? "text-orange-600" :
                "text-green-600"
              )}>
                {monthlyAnalysis.totalPercentage.toFixed(1)}%
              </span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {monthlyAnalysis.hasAlerts && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Peringatan Aktif:
            </h4>
            
            {monthlyAnalysis.alerts
              .filter(alert => alert.isNearLimit || alert.isOverBudget)
              .map((alert) => (
                <div key={alert.id} className={cn("border rounded-lg p-4", getAlertColor(alert.status))}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getAlertIcon(alert.status)}
                      <div>
                        <h5 className="font-medium text-gray-800">{alert.category}</h5>
                        <p className="text-sm text-gray-600">
                          {alert.isOverBudget 
                            ? `Sudah over budget ${formatCurrency(Math.abs(alert.remaining))}!`
                            : `Sudah mencapai ${alert.percentage.toFixed(1)}% dari budget`
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(alert.spent)}</p>
                      <p className="text-xs text-gray-600">dari {formatCurrency(alert.monthlyLimit)}</p>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* Budget List */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-800">Semua Budget Kategori:</h4>
          
          {budgets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Belum ada budget yang diatur</p>
              <p className="text-sm">Klik "Atur Budget" untuk mulai</p>
            </div>
          ) : (
            budgets.map((budget) => {
              const alert = monthlyAnalysis.alerts.find(a => a.id === budget.id);
              const spent = alert?.spent || 0;
              const percentage = alert?.percentage || 0;
              
              return (
                <div key={budget.id} className={cn(
                  "border rounded-lg p-4",
                  !budget.isActive ? "opacity-50 bg-gray-50" : "bg-white"
                )}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        !budget.isActive ? "bg-gray-400" :
                        alert?.status === 'over' ? "bg-red-500" :
                        alert?.status === 'warning' ? "bg-orange-500" :
                        "bg-green-500"
                      )} />
                      <div>
                        <h5 className="font-medium text-gray-800">{budget.category}</h5>
                        <p className="text-sm text-gray-600">
                          Peringatan saat {budget.alertThreshold}%
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleBudget(budget.id)}
                      >
                        {budget.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteBudget(budget.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Hapus
                      </Button>
                    </div>
                  </div>
                  
                  {budget.isActive && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Terpakai: {formatCurrency(spent)}</span>
                        <span>Budget: {formatCurrency(budget.monthlyLimit)}</span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={cn(
                            "h-2 rounded-full transition-all",
                            percentage > 100 ? "bg-red-500" :
                            percentage >= budget.alertThreshold ? "bg-orange-500" :
                            "bg-green-500"
                          )}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{percentage.toFixed(1)}%</span>
                        <span className={cn(
                          percentage > budget.monthlyLimit ? "text-red-600" : "text-gray-600"
                        )}>
                          Sisa: {formatCurrency(Math.max(0, budget.monthlyLimit - spent))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-medium text-blue-800 mb-2">💡 Tips Kelola Budget:</h5>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Set budget realistis berdasarkan pengalaman bulan lalu</li>
            <li>• Cek peringatan setiap hari, jangan tunggu akhir bulan</li>
            <li>• Kalau sering over budget, coba naikin budget atau kurangi pengeluaran</li>
            <li>• Prioritaskan pengeluaran yang penting untuk bisnis</li>
            <li>• Review dan sesuaikan budget setiap bulan</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpenseAlerts;