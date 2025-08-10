import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupLabel, 
  SidebarGroupContent, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarFooter,
  useSidebar
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { DashboardIcon } from "@radix-ui/react-icons";
import { 
  Calculator, ChefHat, Package, Users, ShoppingCart, FileText, 
  TrendingUp, Settings, Building2, LogOut, Download, Receipt, DollarSign 
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { performSignOut } from "@/lib/authUtils";
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

// --- Import Hook Konteks ---
import { usePaymentContext } from "@/contexts/PaymentContext";
import { useBahanBaku } from "@/components/warehouse/context/WarehouseContext";
import { useSupplier } from "@/contexts/SupplierContext";
import { usePurchase } from "@/components/purchase/context/PurchaseContext";
import { useRecipe } from "@/contexts/RecipeContext";
import { useActivity } from "@/contexts/ActivityContext";
import { useOrder } from "@/components/orders/context/OrderContext";
import { useFinancial } from "@/components/financial/contexts/FinancialContext";
import { useUserSettings } from "@/contexts/UserSettingsContext";
import { usePromo } from "@/components/promoCalculator/context/PromoContext";
import { useOperationalCost } from "@/components/operational-costs/context/OperationalCostContext";

// ✅ RESTORED: Import modular asset hooks (nested QueryClient fixed)
import { useAssetQuery } from "@/components/assets";
import { useAuth } from "@/contexts/AuthContext";

// --- Import Fungsi Export ---
import { exportAllDataToExcel } from "@/utils/exportUtils";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { state, open, setOpen } = useSidebar();
  
  // Get user for asset query
  const { user } = useAuth();
  
  // --- Panggil semua hook untuk mendapatkan data ---
  const { settings } = useUserSettings();
  const { isPaid } = usePaymentContext();
  const { bahanBaku } = useBahanBaku();
  const { suppliers } = useSupplier();
  const { purchases } = usePurchase();
  const { recipes, hppResults } = useRecipe();
  const { activities } = useActivity();
  const { orders } = useOrder();
  const { financialTransactions } = useFinancial();
  const { promos } = usePromo();
  const { state: operationalCostState } = useOperationalCost();
  
  // ✅ RESTORED: Use modular asset hook (nested QueryClient fixed)
  const { assets, isLoading: assetsLoading } = useAssetQuery({ 
    userId: user?.id,
    enableRealtime: false // No need for realtime in sidebar
  });

  const menuGroups = [
    {
      label: "Dashboard",
      items: [
        { title: "Dashboard", url: "/", icon: DashboardIcon },
        { title: "Kalkulator Promo", url: "/promo", icon: Calculator },
      ]
    },
    {
      label: "Hitung HPP",
      items: [
        { title: "Manajemen Resep", url: "/resep", icon: ChefHat },
        { title: "Gudang Bahan Baku", url: "/gudang", icon: Package },
        { title: "Biaya Operasional", url: "/biaya-operasional", icon: DollarSign },
      ]
    },
    {
      label: "Bisnis",
      items: [
        { title: "Supplier", url: "/supplier", icon: Users },
        { title: "Pembelian", url: "/pembelian", icon: ShoppingCart },
        { title: "Pesanan", url: "/pesanan", icon: FileText },
      ]
    },
    {
      label: "Laporan & Aset",
      items: [
        { title: "Laporan Keuangan", url: "/laporan", icon: TrendingUp },
        { title: "Manajemen Aset", url: "/aset", icon: Building2 },
        { title: "Invoice", url: "/invoice", icon: Receipt },
      ]
    }
  ];

  const settingsItems = [
    { title: "Pengaturan", url: "/pengaturan", icon: Settings },
  ];

  const confirmLogout = async () => {
    const success = await performSignOut();
    if (success) {
      toast.success("Berhasil keluar");
      setTimeout(() => window.location.reload(), 500);
    } else {
      toast.error("Gagal keluar");
    }
  };

  const handleExportAllData = () => {
    // Check if assets are still loading
    if (assetsLoading) {
      toast.info("Tunggu sebentar, sedang memuat data aset...");
      return;
    }

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
      promos,
      operationalCosts: operationalCostState.costs,
      allocationSettings: operationalCostState.allocationSettings,
      costSummary: operationalCostState.summary,
    };
    
    exportAllDataToExcel(allAppData, settings.businessName);
  };

  // ✅ Simple menu item rendering with orange hover and active - using style override
  const renderMenuItem = (item, isActive) => (
    <SidebarMenuButton
      onClick={() => navigate(item.url)}
      isActive={isActive}
      style={{
        '--hover-bg': '#fed7aa', // orange-200
        '--hover-text': '#ea580c', // orange-600
        '--active-bg': '#fdba74', // orange-300
        '--active-text': '#c2410c', // orange-700
      }}
      className={cn(
        "w-full justify-start px-3 transition-all duration-200",
        "[&:hover]:!bg-orange-50 [&:hover]:!text-orange-600 hover:scale-[1.02]",
        "[&:active]:!bg-orange-200 [&:active]:!text-orange-700 active:scale-[0.98]",
        "[&:focus]:!bg-orange-100 [&:focus]:!text-orange-600",
        isActive && "!bg-orange-100 !text-orange-600 !border-orange-200"
      )}
    >
      <item.icon className="h-5 w-5 flex-shrink-0" />
      <span className="ml-3">{item.title}</span>
    </SidebarMenuButton>
  );

  // ✅ Simple action button rendering with orange hover and active - using style override
  const renderActionButton = (onClick, IconComponent: React.ElementType, text: string, className = "") => (
    <SidebarMenuButton
      onClick={onClick}
      style={{
        '--hover-bg': '#fed7aa', // orange-200
        '--hover-text': '#ea580c', // orange-600
        '--active-bg': '#fdba74', // orange-300
        '--active-text': '#c2410c', // orange-700
      }}
      className={cn(
        "w-full justify-start px-3 transition-all duration-200",
        "[&:hover]:!bg-orange-50 [&:hover]:!text-orange-600 hover:scale-[1.02]",
        "[&:active]:!bg-orange-200 [&:active]:!text-orange-700 active:scale-[0.98]",
        "[&:focus]:!bg-orange-100 [&:focus]:!text-orange-600",
        className
      )}
    >
      <IconComponent className="h-5 w-5 flex-shrink-0" />
      <span className="ml-3">{text}</span>
    </SidebarMenuButton>
  );

  return (
    <Sidebar 
      collapsible="offcanvas"
      className={cn(
        "border-r transition-all duration-300 ease-in-out",
        "data-[state=open]:animate-in data-[state=open]:slide-in-from-left-0",
        "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left-0"
      )}
    >
      {/* ✅ Header with smooth transitions */}
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white flex-shrink-0">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className="ml-3 opacity-100 transition-opacity duration-300">
            <h2 className="text-lg font-bold whitespace-nowrap">HPP by Monifine</h2>
          </div>
        </div>
      </SidebarHeader>

      {/* ✅ Content with staggered animations */}
      <SidebarContent className="flex-grow px-2 py-4">
        {menuGroups.map((group, groupIndex) => (
          <SidebarGroup 
            key={group.label} 
            className={cn(
              "mb-4 opacity-100 transition-all duration-300 ease-in-out",
              // Staggered animation delay for each group
              `delay-[${groupIndex * 50}ms]`
            )}
          >
            <SidebarGroupLabel className="text-sm font-semibold text-muted-foreground mb-1 px-3 transition-opacity duration-300">
              {group.label}
            </SidebarGroupLabel>
            
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {group.items.map((item, itemIndex) => (
                  <SidebarMenuItem 
                    key={item.title}
                    className={cn(
                      "opacity-100 transition-all duration-300 ease-in-out",
                      // Staggered animation for menu items
                      `delay-[${(groupIndex * 100) + (itemIndex * 25)}ms]`
                    )}
                  >
                    {renderMenuItem(item, location.pathname === item.url)}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* ✅ Footer with delayed animation */}
      <SidebarFooter className="p-2 border-t mt-auto opacity-100 transition-all duration-300 delay-200">
        <SidebarMenu className="space-y-1">
          {/* Export Button */}
          <SidebarMenuItem className="transition-all duration-200 ease-in-out">
            {renderActionButton(
              handleExportAllData,
              Download,
              assetsLoading ? "Memuat Data..." : "Export Semua Data"
            )}
          </SidebarMenuItem>
          
          {/* Settings */}
          {settingsItems.map((item) => (
            <SidebarMenuItem 
              key={item.title}
              className="transition-all duration-200 ease-in-out"
            >
              {renderMenuItem(item, location.pathname === item.url)}
            </SidebarMenuItem>
          ))}

          {/* Logout */}
          <SidebarMenuItem className="transition-all duration-200 ease-in-out">
            {renderActionButton(
              () => setShowLogoutConfirm(true),
              LogOut,
              "Keluar",
              "text-red-500 [&:hover]:!bg-red-50 [&:hover]:!text-red-600 [&:active]:!bg-red-200 [&:active]:!text-red-700"
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Logout Dialog */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className="animate-in fade-in-0 zoom-in-95 duration-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin keluar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="transition-all duration-200 hover:scale-[1.02]">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmLogout}
              className="transition-all duration-200 hover:scale-[1.02]"
            >
              Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  );
}