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
  Bell,
  TrendingUp // ✅ NEW: Icon for Profit Analysis
} from 'lucide-react';
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

// ✅ Import Update Badge untuk indicator
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

  // ✅ Simplified menu structure with profit analysis
  const menuItems = [
    {
      title: 'Dashboard',
      icon: BarChart3,
      path: '/',
    },
    {
      title: 'Kalkulator Promo',
      icon: Calculator,
      path: '/promo',
    },
    {
      title: 'Manajemen Resep',
      icon: ChefHat,
      path: '/resep',
    },
    {
      title: 'Gudang Bahan Baku',
      icon: Package,
      path: '/gudang',
    },
    {
      title: 'Biaya Operasional',
      icon: DollarSign,
      path: '/biaya-operasional',
    },
    {
      title: 'Supplier',
      icon: Users,
      path: '/supplier',
    },
    {
      title: 'Pembelian',
      icon: Truck,
      path: '/pembelian',
    },
    {
      title: 'Pesanan',
      icon: ShoppingCartIcon,
      path: '/pesanan',
    },
    {
      title: 'Laporan Keuangan',
      icon: BarChart3,
      path: '/laporan',
    },
    // ✅ NEW: Add Profit Analysis menu
    {
      title: 'Analisis Profit',
      icon: TrendingUp,
      path: '/analisis-profit',
    },
    {
      title: 'Manajemen Aset',
      icon: Archive,
      path: '/aset',
    },
    {
      title: 'Invoice',
      icon: Receipt,
      path: '/invoice',
    },
    // ✅ Updates menu with special handling
    {
      title: 'Pembaruan',
      icon: Bell,
      path: '/updates',
      isUpdates: true
    },
    {
      title: 'Pengaturan',
      icon: Settings,
      path: '/pengaturan',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
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

      {/* Menu Grid - Simplified */}
      <div className="max-w-md mx-auto p-4 pb-20">
        <div className="grid grid-cols-2 gap-3">
          {menuItems.map((item) => (
            <Card 
              key={item.path}
              className="cursor-pointer hover:shadow-md transition-all duration-200 border-gray-200 bg-white rounded-xl hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => navigate(item.path)}
            >
              <CardContent className="p-4 text-center">
                <div className="flex flex-col items-center gap-2">
                  {/* Icon with Update Badge Support */}
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center relative">
                    {item.isUpdates ? (
                      <UpdateBadge className="text-orange-600" showCount={false} />
                    ) : (
                      <item.icon className="h-5 w-5 text-orange-600" />
                    )}
                  </div>
                  
                  {/* Title */}
                  <span className="text-sm font-medium text-gray-700 leading-tight text-center">
                    {item.title}
                  </span>
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
        <AlertDialogContent className="max-w-sm mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">Konfirmasi Keluar</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {logoutType === 'global' 
                ? "Keluar dari SEMUA perangkat? Anda perlu login kembali di semua perangkat."
                : "Keluar dari perangkat ini? Anda tetap login di perangkat lain."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="flex-1">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout} className="flex-1">
              Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MenuPage;