import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, Settings, BarChart3, Users, Truck, Archive, LogOut, ShoppingCart as ShoppingCartIcon, ChefHat, Package, Receipt, DollarSign, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { performSignOut, performGlobalSignOut } from '@/lib/authUtils';

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

// ✅ NEW: Import Update Badge untuk indicator
import { UpdateBadge } from '@/components/update';

const MenuPage = () => {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutType, setLogoutType] = useState<'local' | 'global'>('local');

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

  const menuItems = [
    {
      title: 'Kalkulator Promo',
      description: 'Hitung Promo dengan Mudah',
      icon: Calculator,
      path: '/promo',
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: 'Manajemen Resep',
      description: 'Kelola dan hitung HPP resep masakan',
      icon: ChefHat,
      path: '/resep',
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: 'Gudang Bahan Baku',
      description: 'Manajemen stok bahan baku dan inventory',
      icon: Package,
      path: '/gudang',
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: 'Biaya Operasional',
      description: 'Kelola biaya operasional untuk perhitungan overhead HPP',
      icon: DollarSign,
      path: '/biaya-operasional',
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: 'Supplier',
      description: 'Kelola data supplier',
      icon: Users,
      path: '/supplier',
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: 'Pembelian Bahan Baku',
      description: 'Kelola pembelian bahan',
      icon: Truck,
      path: '/pembelian',
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: 'Pesanan',
      description: 'Kelola semua pesanan pelanggan',
      icon: ShoppingCartIcon,
      path: '/pesanan',
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: 'Laporan Keuangan',
      description: 'Lihat laporan dan analisis',
      icon: BarChart3,
      path: '/laporan',
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: 'Manajemen Aset',
      description: 'Manajemen aset bisnis',
      icon: Archive,
      path: '/aset',
      color: 'from-orange-500 to-orange-600'
    },
    {
      title: 'Buat Invoice',
      description: 'Buat faktur manual untuk pelanggan',
      icon: Receipt,
      path: '/invoice',
      color: 'from-orange-500 to-orange-600'
    },
    // ✅ NEW: Add Updates menu item
    {
      title: 'Pembaruan Aplikasi',
      description: 'Lihat pembaruan dan fitur terbaru',
      icon: Bell,
      path: '/updates',
      color: 'from-orange-500 to-orange-600',
      isUpdates: true // Special flag for updates
    },
    {
      title: 'Pengaturan',
      description: 'Atur preferensi aplikasi',
      icon: Settings,
      path: '/pengaturan',
      color: 'from-orange-500 to-orange-600'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Menu Utama</h1>
          <p className="text-gray-600">Akses semua fitur aplikasi HPP</p>
        </div>

        {/* Menu Items - Stacked Layout */}
        <div className="space-y-3 mb-6">
          {menuItems.map((item) => (
            <Card 
              key={item.path}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-0 bg-white/80 backdrop-blur-sm rounded-lg hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => navigate(item.path)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Icon with Update Badge Support */}
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${item.color} flex items-center justify-center flex-shrink-0 relative`}>
                    {/* ✅ NEW: Use UpdateBadge for Updates menu */}
                    {item.isUpdates ? (
                      <UpdateBadge className="text-white" showCount={false} />
                    ) : (
                      <item.icon className="h-6 w-6 text-white" />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 text-base mb-1 leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  
                  {/* Arrow indicator */}
                  <div className="text-gray-400 flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Logout Options */}
        <div className="space-y-3">
          {/* Keluar dari Perangkat Ini */}
          <Card className="bg-orange-50 border-orange-200 rounded-lg">
            <CardContent className="p-4">
              <Button
                onClick={() => handleLogout('local')}
                variant="outline"
                className="w-full flex items-center justify-center gap-2 rounded-md border-orange-300 text-orange-600 hover:bg-orange-100"
              >
                <LogOut className="h-5 w-5" />
                <span>Keluar dari Perangkat Ini</span>
              </Button>
            </CardContent>
          </Card>

          {/* Keluar dari Semua Perangkat */}
          <Card className="bg-red-50 border-red-200 rounded-lg">
            <CardContent className="p-4">
              <Button
                onClick={() => handleLogout('global')}
                variant="destructive"
                className="w-full flex items-center justify-center gap-2 rounded-md"
              >
                <LogOut className="h-5 w-5" />
                <span>Keluar dari Semua Perangkat</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog Konfirmasi Keluar */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
            <AlertDialogDescription>
              {logoutType === 'global' 
                ? "Apakah Anda yakin ingin keluar dari SEMUA perangkat? Anda perlu login kembali di semua perangkat untuk mengakses fitur-fitur."
                : "Apakah Anda yakin ingin keluar dari perangkat ini? Anda masih akan tetap login di perangkat lain."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout}>
              {logoutType === 'global' ? 'Keluar dari Semua Perangkat' : 'Keluar dari Perangkat Ini'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MenuPage;