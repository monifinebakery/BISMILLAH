import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calculator, 
  Settings, 
  BarChart3, 
  Users, 
  Truck, 
  Archive, 
  LogOut, 
  ShoppingCart as ShoppingCartIcon, 
  ChefHat, 
  Package, 
  Receipt, 
  DollarSign, 

  TrendingUp, // ✅ NEW: Icon for Profit Analysis
  BookOpen // ✅ NEW: Icon for Tutorial
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { performSignOut, performGlobalSignOut } from '@/lib/authUtils';
import PWAInstallButton from '@/components/pwa/PWAInstallButton';
import { useIsMobile } from '@/hooks/use-mobile';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";



const MenuPage = () => {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutType, setLogoutType] = useState<'local' | 'global'>('local');
  const isMobile = useIsMobile();

  const handleLogout = (type: 'local' | 'global' = 'local') => {
    setLogoutType(type);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      let success;
      if (logoutType === 'global') {
        success = await performGlobalSignOut();
        if (success) {
          toast.success("Berhasil keluar dari semua perangkat");
        }
      } else {
        success = await performSignOut();
        if (success) {
          toast.success("Berhasil keluar dari perangkat ini");
        }
      }
      
      if (success) {
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        toast.error("Gagal keluar");
      }
    } catch (error) {
      toast.error("Gagal keluar");
    }
  };

  // ✅ Struktur menu dengan judul dan deskripsi
  const menuItems = [
    {
      title: 'Dashboard',
      description: 'Ringkasan usaha',
      icon: BarChart3,
      path: '/',
    },
    {
      title: 'Kalkulator Promo',
      description: 'Hitung harga promo',
      icon: Calculator,
      path: '/promo',
    },
    {
      title: 'Tutorial HPP',
      description: 'Panduan lengkap HPP',
      icon: BookOpen,
      path: '/tutorial',
    },
    {
      title: 'Manajemen Resep',
      description: 'Kelola resep menu',
      icon: ChefHat,
      path: '/resep',
    },
    {
      title: 'Gudang Bahan Baku',
      description: 'Pantau stok bahan',
      icon: Package,
      path: '/gudang',
    },
    {
      title: 'Biaya Operasional',
      description: 'Catat pengeluaran',
      icon: DollarSign,
      path: '/biaya-operasional',
    },
    {
      title: 'Supplier',
      description: 'Data pemasok',
      icon: Users,
      path: '/supplier',
    },
    {
      title: 'Pembelian',
      description: 'Kelola pembelian',
      icon: Truck,
      path: '/pembelian',
    },
    {
      title: 'Pesanan',
      description: 'Kelola pesanan',
      icon: ShoppingCartIcon,
      path: '/pesanan',
    },
    {
      title: 'Laporan Keuangan',
      description: 'Analisis keuangan',
      icon: BarChart3,
      path: '/laporan',
    },
    // ✅ Menu analisis profit
    {
      title: 'Analisis Profit',
      description: 'Pantau profit',
      icon: TrendingUp,
      path: '/analisis-profit',
    },
    {
      title: 'Manajemen Aset',
      description: 'Kelola aset',
      icon: Archive,
      path: '/aset',
    },
    {
      title: 'Invoice',
      description: 'Kelola invoice',
      icon: Receipt,
      path: '/invoice',
    },

    {
      title: 'Pengaturan',
      description: 'Sesuaikan preferensi',
      icon: Settings,
      path: '/pengaturan',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="w-full px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">HPP Menu</h1>
              <p className="text-xs text-gray-500">Pilih fitur aplikasi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Install CTA - only show on mobile */}
      {isMobile && (
        <div className="w-full px-4 pt-4">
          <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between">
            <div className="text-sm text-gray-700">Install aplikasi untuk akses cepat</div>
            <PWAInstallButton showNetworkStatus={false} />
          </div>
        </div>
      )}

      {/* Menu List - Simplified */}
      <div className="w-full p-4 pb-20">
        <div className="space-y-3">
          {menuItems.map((item) => (
            <Card
              key={item.path}
              className="cursor-pointer hover:border-gray-300 transition-all duration-200 border-gray-200 bg-white rounded-xl hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => navigate(item.path)}
            >
              <CardContent className="p-4 flex items-start gap-4">
                {/* Icon */}
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center relative">
                  <item.icon className="h-5 w-5 text-orange-600" />
                </div>

                {/* Title and Description */}
                <div className="text-left">
                  <h3 className="text-sm font-medium text-gray-700 leading-tight">{item.title}</h3>
                  {item.description && (
                    <p className="text-xs text-gray-500">{item.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Logout Section - Simplified */}
        <div className="mt-8 space-y-3">
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-3">
              <Button
                onClick={() => handleLogout('local')}
                variant="outline"
                size="sm"
                className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Keluar Perangkat Ini
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-3">
              <Button
                onClick={() => handleLogout('global')}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Keluar Semua Perangkat
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">Konfirmasi Keluar</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {logoutType === 'global' 
                ? "Keluar dari SEMUA perangkat? Anda perlu login kembali di semua perangkat."
                : "Keluar dari perangkat ini? Anda tetap login di perangkat lain."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout}>
              Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MenuPage;
