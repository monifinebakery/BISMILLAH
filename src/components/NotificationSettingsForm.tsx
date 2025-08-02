// src/components/NotificationSettingsForm.tsx

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useNotification } from '@/contexts/NotificationContext';
import { toast } from 'sonner';
import { 
  Loader2, 
  BellRing, 
  Mail, 
  Smartphone, 
  ShoppingCart, 
  Package, 
  AlertTriangle,
  DollarSign,
  TrendingUp,
  FileText
} from 'lucide-react';

// ✅ UPDATED: Extended form state to match database schema
type FormState = {
  // Basic notifications
  email_notifications: boolean;
  push_notifications: boolean;
  
  // Business notifications
  order_notifications: boolean;
  inventory_notifications: boolean;
  system_notifications: boolean;
  
  // Financial & alerts
  financial_alerts: boolean;
  inventory_alerts: boolean;
  stock_alerts: boolean;
  payment_alerts: boolean;
  low_stock_alerts: boolean;
  
  // Reports
  daily_reports: boolean;
  weekly_reports: boolean;
  monthly_reports: boolean;
  
  // Additional
  reminder_notifications: boolean;
  security_alerts: boolean;
  
  // Settings
  low_stock_threshold: number;
  auto_archive_days: number;
};

const NotificationSettingsForm = () => {
  const { settings, updateSettings, isLoading: isContextLoading } = useNotification();
  const [formState, setFormState] = useState<FormState>({
    // Basic notifications
    email_notifications: true,
    push_notifications: true,
    
    // Business notifications
    order_notifications: true,
    inventory_notifications: true,
    system_notifications: true,
    
    // Financial & alerts
    financial_alerts: true,
    inventory_alerts: true,
    stock_alerts: true,
    payment_alerts: true,
    low_stock_alerts: true,
    
    // Reports
    daily_reports: false,
    weekly_reports: false,
    monthly_reports: true,
    
    // Additional
    reminder_notifications: true,
    security_alerts: true,
    
    // Settings
    low_stock_threshold: 10,
    auto_archive_days: 30,
  });
  const [isSaving, setIsSaving] = useState(false);

  // ✅ UPDATED: Load all settings from context
  useEffect(() => {
    if (settings) {
      setFormState({
        email_notifications: settings.email_notifications ?? true,
        push_notifications: settings.push_notifications ?? true,
        order_notifications: settings.order_notifications ?? true,
        inventory_notifications: settings.inventory_notifications ?? true,
        system_notifications: settings.system_notifications ?? true,
        financial_alerts: settings.financial_alerts ?? true,
        inventory_alerts: settings.inventory_alerts ?? true,
        stock_alerts: settings.stock_alerts ?? true,
        payment_alerts: settings.payment_alerts ?? true,
        low_stock_alerts: settings.low_stock_alerts ?? true,
        daily_reports: settings.daily_reports ?? false,
        weekly_reports: settings.weekly_reports ?? false,
        monthly_reports: settings.monthly_reports ?? true,
        reminder_notifications: settings.reminder_notifications ?? true,
        security_alerts: settings.security_alerts ?? true,
        low_stock_threshold: settings.low_stock_threshold ?? 10,
        auto_archive_days: settings.auto_archive_days ?? 30,
      });
    }
  }, [settings]);

  const handleInputChange = (field: keyof FormState, value: boolean | number) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    const success = await updateSettings(formState);
    if (success) {
      toast.success('Pengaturan notifikasi berhasil disimpan');
    }
    setIsSaving(false);
  };

  if (isContextLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Notifikasi</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Memuat pengaturan...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md border">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 bg-blue-100 p-3 rounded-lg">
            <BellRing className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-xl">Pengaturan Notifikasi</CardTitle>
            <CardDescription>
              Atur notifikasi dan peringatan yang ingin Anda terima di dalam aplikasi.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-4">
        
        {/* ✅ BASIC NOTIFICATIONS */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Metode Notifikasi
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-500" />
                <div>
                  <Label className="font-medium">Email</Label>
                  <p className="text-sm text-gray-500">Notifikasi via email</p>
                </div>
              </div>
              <Switch
                checked={formState.email_notifications}
                onCheckedChange={(checked) => handleInputChange('email_notifications', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50">
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-gray-500" />
                <div>
                  <Label className="font-medium">Push Notification</Label>
                  <p className="text-sm text-gray-500">Notifikasi browser</p>
                </div>
              </div>
              <Switch
                checked={formState.push_notifications}
                onCheckedChange={(checked) => handleInputChange('push_notifications', checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* ✅ BUSINESS NOTIFICATIONS */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Notifikasi Bisnis
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50">
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-4 w-4 text-blue-500" />
                <div>
                  <Label className="font-medium">Notifikasi Pesanan</Label>
                  <p className="text-sm text-gray-500">Pesanan baru dan perubahan status</p>
                </div>
              </div>
              <Switch
                checked={formState.order_notifications}
                onCheckedChange={(checked) => handleInputChange('order_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50">
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-green-500" />
                <div>
                  <Label className="font-medium">Notifikasi Gudang & Stok</Label>
                  <p className="text-sm text-gray-500">Perubahan stok dan inventory</p>
                </div>
              </div>
              <Switch
                checked={formState.inventory_notifications}
                onCheckedChange={(checked) => handleInputChange('inventory_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50/50">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <div>
                  <Label className="font-medium">Notifikasi Sistem</Label>
                  <p className="text-sm text-gray-500">Update sistem dan maintenance</p>
                </div>
              </div>
              <Switch
                checked={formState.system_notifications}
                onCheckedChange={(checked) => handleInputChange('system_notifications', checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* ✅ ALERTS & WARNINGS */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Peringatan & Alert
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <Label className="text-sm">Financial Alerts</Label>
              </div>
              <Switch
                checked={formState.financial_alerts}
                onCheckedChange={(checked) => handleInputChange('financial_alerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-500" />
                <Label className="text-sm">Inventory Alerts</Label>
              </div>
              <Switch
                checked={formState.inventory_alerts}
                onCheckedChange={(checked) => handleInputChange('inventory_alerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-red-500" />
                <Label className="text-sm">Stock Alerts</Label>
              </div>
              <Switch
                checked={formState.stock_alerts}
                onCheckedChange={(checked) => handleInputChange('stock_alerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-yellow-500" />
                <Label className="text-sm">Payment Alerts</Label>
              </div>
              <Switch
                checked={formState.payment_alerts}
                onCheckedChange={(checked) => handleInputChange('payment_alerts', checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* ✅ REPORTS */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Laporan Otomatis
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label className="text-sm">Laporan Harian</Label>
              <Switch
                checked={formState.daily_reports}
                onCheckedChange={(checked) => handleInputChange('daily_reports', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label className="text-sm">Laporan Mingguan</Label>
              <Switch
                checked={formState.weekly_reports}
                onCheckedChange={(checked) => handleInputChange('weekly_reports', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <Label className="text-sm">Laporan Bulanan</Label>
              <Switch
                checked={formState.monthly_reports}
                onCheckedChange={(checked) => handleInputChange('monthly_reports', checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* ✅ SETTINGS */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Pengaturan Threshold</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 p-4 border rounded-lg bg-gray-50/50">
              <Label htmlFor="low-stock-threshold" className="font-medium">
                Batas Peringatan Stok Rendah
              </Label>
              <p className="text-sm text-gray-500">
                Kirim peringatan jika stok ≤ angka ini
              </p>
              <Input
                id="low-stock-threshold"
                type="number"
                value={formState.low_stock_threshold}
                onChange={(e) => handleInputChange('low_stock_threshold', parseInt(e.target.value, 10) || 0)}
                className="max-w-xs"
                min="0"
              />
            </div>

            <div className="space-y-2 p-4 border rounded-lg bg-gray-50/50">
              <Label htmlFor="auto-archive" className="font-medium">
                Auto Archive (hari)
              </Label>
              <p className="text-sm text-gray-500">
                Arsipkan data lama setelah X hari
              </p>
              <Input
                id="auto-archive"
                type="number"
                value={formState.auto_archive_days}
                onChange={(e) => handleInputChange('auto_archive_days', parseInt(e.target.value, 10) || 30)}
                className="max-w-xs"
                min="1"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
          <Button onClick={handleSaveSettings} disabled={isSaving} size="lg">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettingsForm;