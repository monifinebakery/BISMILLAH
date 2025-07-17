import React, { useState } from 'react'; // MODIFIED: Import useState
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Settings, BarChart3, Users, Truck, Archive, LogOut, ShoppingCart as ShoppingCartIcon, ChefHat, Package } from 'lucide-react'; // MODIFIED: Tambahkan icon
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { performSignOut } from '@/lib/authUtils';

// MODIFIED: Import AlertDialog components
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const MenuPage = () => {
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // MODIFIED: Tambahkan state

  const handleLogout = async () => {
    setShowLogoutConfirm(true); // MODIFIED: Hanya buka dialog
  };

  const confirmLogout = async () => { // MODIFIED: Fungsi konfirmasi logout
    try {
      const success = await performSignOut();
      
      if (success) {
        toast.success("Berhasil keluar");
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
      title: 'Kalkulator HPP Cepat',
      description: 'Hitung HPP dengan input manual',
      icon: Calculator,
      path: '/hpp',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Manajemen Resep',
      description: 'Kelola dan hitung HPP resep masakan',
      icon: ChefHat,
      path: '/resep',
      color: 'from-orange-500 to-red-500'
    },
    {
      title: 'Gudang Bahan Baku',
      description: 'Manajemen stok bahan baku dan inventory',
      icon: Package,
      path: '/gudang',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Supplier',
      description: 'Kelola data supplier',
      icon: Users,
      path: '/supplier',
      color: 'from-purple-500 to-purple-600'
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
      icon: ShoppingCartIcon, // MODIFIED: Gunakan ShoppingCartIcon
      path: '/pesanan',
      color: 'from-red-500 to-pink-600'
    },
    {
      title: 'Laporan Keuangan',
      description: 'Lihat laporan dan analisis',
      icon: BarChart3,
      path: '/laporan',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Manajemen Aset',
      description: 'Manajemen aset bisnis',
      icon: Archive,
      path: '/aset',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      title: 'Pengaturan',
      description: 'Atur preferensi aplikasi',
      icon: Settings,
      path: '/pengaturan',
      color: 'from-gray-500 to-gray-600'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4 pb-20 font-inter">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Menu Utama</h1>
          <p className="text-gray-600">Akses semua fitur aplikasi HPP</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {menuItems.map((item) => (
            <Card 
              key={item.path}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-0 bg-white/80 backdrop-blur-sm rounded-lg"
              onClick={() => navigate(item.path)}
            >
              <CardHeader className="pb-3">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${item.color} flex items-center justify-center mb-3`}>
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-base leading-tight">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Logout Button */}
        <Card className="bg-red-50 border-red-200 rounded-lg">
          <CardContent className="p-4">
            <Button
              onClick={handleLogout} // MODIFIED: Panggil handleLogout
              variant="destructive"
              className="w-full flex items-center justify-center gap-2 rounded-md"
            >
              <LogOut className="h-5 w-5" />
              <span>Keluar dari Aplikasi</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* MODIFIED: AlertDialog untuk konfirmasi logout */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin keluar dari aplikasi? Anda perlu login kembali untuk mengakses fitur-fitur.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout}>Keluar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MenuPage;
