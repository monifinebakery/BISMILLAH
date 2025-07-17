import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SidebarClose, SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { DashboardIcon } from "@radix-ui/react-icons"; // Pastikan ini diimpor
import { Calculator, ChefHat, Package, Users, ShoppingCart, FileText, TrendingUp, Settings, Building2, LogOut, Download } from "lucide-react"; // MODIFIED: Hapus Home dari sini
import { Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { performSignOut } from "@/lib/authUtils";
import { usePaymentContext } from "@/contexts/PaymentContext";
import PaymentStatusIndicator from "@/components/PaymentStatusIndicator";
import CloudSyncButton from "@/components/CloudSyncButton";
import DateTimeDisplay from "@/components/DateTimeDisplay";
import NotificationBell from "@/components/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";
import { useAppData } from "@/contexts/AppDataContext";
import React, { useState } from "react";

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

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const { isPaid } = usePaymentContext();
  const { getStatistics, bahanBaku, suppliers, purchases, recipes, hppResults, activities, orders, assets, financialTransactions } = useAppData();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navItems = [
    {
      title: "Dashboard",
      icon: DashboardIcon, // MODIFIED: Gunakan DashboardIcon
      href: "/",
      section: "Dashboard",
    },
    {
      title: "Kalkulator HPP Cepat",
      icon: Calculator,
      href: "/hpp",
      section: "Dashboard",
    },
    {
      title: "Manajemen Resep",
      icon: ChefHat,
      href: "/resep",
      section: "Produksi",
    },
    {
      title: "Gudang Bahan Baku",
      icon: Package,
      href: "/gudang",
      section: "Produksi",
    },
    {
      title: "Supplier",
      icon: Users,
      href: "/supplier",
      section: "Bisnis",
    },
    {
      title: "Pembelian Bahan Baku",
      icon: ShoppingCart,
      href: "/pembelian",
      section: "Bisnis",
    },
    {
      title: "Pesanan",
      icon: ShoppingCart,
      href: "/pesanan",
      section: "Bisnis",
    },
    {
      title: "Laporan Keuangan",
      icon: FileText,
      href: "/laporan",
      section: "Laporan & Analisis",
    },
    {
      title: "Manajemen Aset",
      icon: Building2,
      href: "/aset",
      section: "Laporan & Analisis",
    },
    {
      title: "Pengaturan",
      icon: Settings,
      href: "/pengaturan",
      section: "Lainnya",
    },
  ];

  const settingsItems = [
    {
      title: "Pengaturan",
      url: "/pengaturan",
      icon: Settings,
    },
  ];

  const handleLogout = async () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
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

  const handleExportAllData = () => {
    const allAppData = {
      bahanBaku,
      suppliers,
      purchases,
      recipes,
      hppResults,
      activities,
      orders,
      assets,
      financialTransactions,
    };
    exportAllDataToExcel(allAppData);
  };


  return (
    <Sidebar className="border-r border-gray-200 bg-white">
      <SidebarHeader className={`p-4 border-b border-gray-200 ${state === "collapsed" ? "flex justify-center items-center" : ""}`}>
        <div className={`flex items-center ${state === "collapsed" ? "justify-center" : "space-x-3"}`}>
          <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="h-6 w-6" />
          </div>
          {state === "expanded" && (
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                HPP by Monifine
              </h2>
              <p className="text-sm text-gray-600">Sistem Manajemen Bisnis</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label} className="mb-4">
            {state === "expanded" && (
              <SidebarGroupLabel className="text-sm font-semibold text-gray-700 mb-1 px-3">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild
                      isActive={location.pathname === item.url}
                      className={cn(
                        "px-3 py-2 rounded-lg text-base font-medium transition-all duration-200",
                        location.pathname === item.url 
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md' 
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                      tooltip={item.title}
                    >
                      <Link to={item.url} className="flex items-center space-x-3">
                        <item.icon className="h-5 w-5" />
                        <span className="min-w-0 truncate">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-gray-200 mt-auto">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location.pathname === item.url}
                    className={cn(
                      "px-3 py-2 rounded-lg text-base font-medium transition-all duration-200",
                      location.pathname === item.url 
                        ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-md' 
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                    tooltip={item.title}
                  >
                    <Link to={item.url} className="flex items-center space-x-3">
                      <item.icon className="h-5 w-5" />
                      <span className="min-w-0 truncate">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 text-red-600 hover:bg-red-50 hover:text-red-700 w-full"
                  tooltip="Keluar"
                >
                  <div className="flex items-center space-x-3">
                    <LogOut className="h-5 w-5" />
                    {state === "expanded" && <span>Keluar</span>}
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>

      {/* AlertDialog untuk konfirmasi logout */}
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
    </Sidebar>
  );
}
