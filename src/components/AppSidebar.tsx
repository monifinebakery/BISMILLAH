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
  TrendingUp, Settings, Building2, LogOut, Download, Receipt, DollarSign, Bell,
  BarChart3 // ✅ NEW: Icon for Profit Analysis
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

// ✅ NEW: Import Update System
import { UpdateBadge } from "@/components/update";

// ✅ NEW: Import Profit Analysis Hook
import { useProfitAnalysis } from "@/components/profitAnalysis";

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
  
  // Add defensive check for useBahanBaku
  let bahanBaku = [];
  try {
    const warehouseContext = useBahanBaku();
    bahanBaku = warehouseContext?.bahanBaku || [];
  } catch (error) {
    console.warn('Failed to get warehouse data:', error);
    bahanBaku = [];
  }
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

  // ✅ NEW: Use profit analysis hook for export data
  const { 
    currentAnalysis: profitAnalysis, 
    profitHistory,
    loading: profitLoading 
  } = useProfitAnalysis({
    autoCalculate: false, // Don't auto-calculate in sidebar
    enableRealTime: false // No real-time updates in sidebar
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
      label: "Laporan & Analisis", // ✅ UPDATED: Changed label to include analysis
      items: [
        { title: "Laporan Keuangan", url: "/laporan", icon: TrendingUp },
        { title: "Analisis Profit", url: "/analisis-profit", icon: BarChart3 }, // ✅ NEW: Profit Analysis menu
        { title: "Manajemen Aset", url: "/aset", icon: Building2 },
        { title: "Invoice", url: "/invoice", icon: Receipt },
      ]
    }
  ];

  const settingsItems = [
    { title: "Pengaturan", url: "/pengaturan", icon: Settings },
    // ✅ NEW: Add Updates menu item  
    { title: "Pembaruan", url: "/updates", icon: Bell },
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

  const handleExportAllData = (format: 'xlsx' | 'csv' = 'xlsx') => {
    // Check if assets are still loading
    if (assetsLoading) {
      toast.info("Tunggu sebentar, sedang memuat data aset...");
      return;
    }

    // ✅ NEW: Include profit analysis data in export
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
      // ✅ NEW: Add profit analysis data
      profitAnalysis,
      profitHistory,
    };

    exportAllDataToExcel(allAppData, settings.businessName, format);
  };

  // ✅ Enhanced menu item rendering with Update Badge support and tooltips
  const renderMenuItem = (item, isActive) => {
    const isUpdatesMenu = item.url === "/updates";
    
    return (
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
          "w-full justify-start px-3 py-2 gap-3 transition-all duration-200 relative group group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center",

          "[&:hover]:!bg-orange-50 [&:hover]:!text-orange-600 hover:scale-[1.02]",
          "[&:active]:!bg-orange-200 [&:active]:!text-orange-700 active:scale-[0.98]",
          "[&:focus]:!bg-orange-100 [&:focus]:!text-orange-600",
          isActive && "!bg-orange-100 !text-orange-600 !border-orange-200"
        )}
      >
        {/* ✅ NEW: Use UpdateBadge for Updates menu */}
        {isUpdatesMenu ? (
          <UpdateBadge className="flex-shrink-0" />
        ) : (
          <item.icon className="h-5 w-5 flex-shrink-0" />
        )}
        <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
        {/* Tooltip untuk mode collapse */}
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 invisible transition-none z-50 whitespace-nowrap pointer-events-none group-data-[collapsible=icon]:group-hover:opacity-100 group-data-[collapsible=icon]:group-hover:visible">
          {item.title}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-1 w-2 h-2 bg-gray-800 rotate-45"></div>
        </div>
      </SidebarMenuButton>
    );
  };

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
        "w-full justify-start px-3 py-2 gap-3 transition-all duration-200 relative group group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2 group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center",
        "[&:hover]:!bg-orange-50 [&:hover]:!text-orange-600 hover:scale-[1.02]",
        "[&:active]:!bg-orange-200 [&:active]:!text-orange-700 active:scale-[0.98]",
        "[&:focus]:!bg-orange-100 [&:focus]:!text-orange-600",
        className
      )}
    >
      <IconComponent className="h-5 w-5 flex-shrink-0" />
      <span className="group-data-[collapsible=icon]:hidden">{text}</span>
      {/* Tooltip untuk mode collapse */}
      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 invisible transition-none z-50 whitespace-nowrap pointer-events-none group-data-[collapsible=icon]:group-hover:opacity-100 group-data-[collapsible=icon]:group-hover:visible">

        {text}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-1 w-2 h-2 bg-gray-800 rotate-45"></div>
      </div>
    </SidebarMenuButton>
  );

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "border-r transition-all duration-300 ease-in-out",
        "data-[state=open]:animate-in data-[state=open]:slide-in-from-left-0",
        "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left-0"
      )}
    >
      {/* ✅ Header with smooth transitions and consistent padding */}
      <SidebarHeader className="p-4 border-b group-data-[collapsible=icon]:px-2">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white flex-shrink-0">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className="ml-3 opacity-100 transition-opacity duration-300 group-data-[collapsible=icon]:hidden">
            <h2 className="text-lg font-bold whitespace-nowrap">HPP by Monifine</h2>
          </div>
        </div>
      </SidebarHeader>

      {/* ✅ Content with staggered animations and consistent padding */}
      <SidebarContent className="flex-grow px-2 py-4 group-data-[collapsible=icon]:px-2">
        {menuGroups.map((group, groupIndex) => (
          <SidebarGroup 
            key={group.label} 
            className={cn(
              "mb-4 opacity-100 transition-all duration-300 ease-in-out",
              // Staggered animation delay for each group
              `delay-[${groupIndex * 50}ms]`
            )}
          >
            <SidebarGroupLabel className="text-sm font-semibold text-muted-foreground mb-1 px-3 transition-opacity duration-300 group-data-[collapsible=icon]:hidden">
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

      {/* ✅ Footer with delayed animation and consistent padding */}
      <SidebarFooter className="p-2 border-t mt-auto opacity-100 transition-all duration-300 delay-200 group-data-[collapsible=icon]:px-2">
        <SidebarMenu className="space-y-1">
          {/* Export Button */}
          <SidebarMenuItem className="transition-all duration-200 ease-in-out">
            {renderActionButton(
              () => handleExportAllData('xlsx'),
              Download,
              // ✅ NEW: Show loading state for both assets and profit data
              (assetsLoading || profitLoading) ? "Memuat Data..." : "Export Semua Data"
            )}
          </SidebarMenuItem>
          
          {/* Settings and Updates */}
          {settingsItems.map((item) => (
            <SidebarMenuItem 
              key={item.title}
              className="transition-all duration-200 ease-in-out"
            >
              {renderMenuItem(item, location.pathname === item.url)}
            </SidebarMenuItem>
          ))}

          {/* Logout */}
          <SidebarMenuItem className="transition-all duration-200 ease-in-out mt-2">
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