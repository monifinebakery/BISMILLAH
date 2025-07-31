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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { DashboardIcon } from "@radix-ui/react-icons";
import { 
  Calculator, ChefHat, Package, Users, ShoppingCart, FileText, 
  TrendingUp, Settings, Building2, LogOut, Download, Receipt, DollarSign 
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
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

// --- Impor Hook Konteks ---
import { usePaymentContext } from "@/contexts/PaymentContext";
import { useBahanBaku } from "@/components/warehouse/context/WarehouseContext";
import { useSupplier } from "@/contexts/SupplierContext";
import { usePurchase } from "@/components/purchase/context/PurchaseContext";
import { useRecipe } from "@/contexts/RecipeContext";
import { useActivity } from "@/contexts/ActivityContext";
import { useOrder } from "@/components/orders/context/OrderContext";
import { useAssets } from "@/contexts/AssetContext";
import { useFinancial } from "@/components/financial/contexts/FinancialContext";
import { useUserSettings } from "@/contexts/UserSettingsContext";
// ✅ NEW: Import PromoContext
import { usePromo } from "@/components/promoCalculator/context/PromoContext";
// ✅ NEW: Import OperationalCostContext
import { useOperationalCost } from "@/components/operational-costs/context/OperationalCostContext";

// --- Impor Fungsi Export Baru ---
import { exportAllDataToExcel } from "@/utils/exportUtils";

export function AppSidebar() {
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { state } = useSidebar();
  
  // ✅ FIXED: Check if sidebar is collapsed using correct state
  const isCollapsed = state === "collapsed";
  
  console.log('Sidebar state:', state, 'isCollapsed:', isCollapsed); // Debug log
  
  // --- Panggil semua hook untuk mendapatkan data ---
  const { settings } = useUserSettings();
  const { isPaid } = usePaymentContext();
  const { bahanBaku } = useBahanBaku();
  const { suppliers } = useSupplier();
  const { purchases } = usePurchase();
  const { recipes, hppResults } = useRecipe();
  const { activities } = useActivity();
  const { orders } = useOrder();
  const { assets } = useAssets();
  const { financialTransactions } = useFinancial();
  // ✅ NEW: Get promo data for export
  const { promos } = usePromo();
  // ✅ NEW: Get operational costs data for export
  const { state: operationalCostState } = useOperationalCost();

  // ✅ UPDATED: Menu groups dengan Biaya Operasional
  const menuGroups = [
    {
      label: "Dashboard",
      items: [
        { title: "Dashboard", url: "/", icon: DashboardIcon },
        // ✅ NEW: Kalkulator Promo added to Dashboard group
        { title: "Kalkulator Promo", url: "/promo", icon: Calculator },
      ]
    },
    {
      label: "Hitung HPP",
      items: [
        { title: "Manajemen Resep", url: "/resep", icon: ChefHat },
        { title: "Gudang Bahan Baku", url: "/gudang", icon: Package },
        // ✅ NEW: Biaya Operasional untuk overhead calculation
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

  // ✅ UPDATED: Include operational costs data in export
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
      // ✅ NEW: Include promo data
      promos,
      // ✅ NEW: Include operational costs data
      operationalCosts: operationalCostState.costs,
      allocationSettings: operationalCostState.allocationSettings,
      costSummary: operationalCostState.summary,
    };
    
    exportAllDataToExcel(allAppData, settings.businessName);
  };

  // ✅ FIXED: Proper menu item rendering with tooltip integration
  const renderMenuItem = (item, isActive) => {
    const menuButton = (
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={isCollapsed ? item.title : undefined} // Use built-in tooltip from SidebarMenuButton
        className={cn(
          "flex items-center transition-all duration-300 ease-in-out",
          "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2",
          "justify-start px-3"
        )}
      >
        <Link 
          to={item.url} 
          className="flex items-center w-full"
        >
          {/* ✅ ALWAYS VISIBLE ICON */}
          <item.icon className="h-5 w-5 flex-shrink-0" />
          
          {/* ✅ TEXT WITH FADE ANIMATION - Using span for proper hiding */}
          <span className={cn(
            "ml-3 transition-all duration-300 ease-in-out",
            "group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:ml-0 group-data-[collapsible=icon]:overflow-hidden"
          )}>
            {item.title}
          </span>
        </Link>
      </SidebarMenuButton>
    );

    return menuButton;
  };

  // ✅ FIXED: Action button with proper tooltip
  const renderActionButton = (onClick, icon: React.ElementType, text: string, className = "") => {
    return (
      <SidebarMenuButton
        onClick={onClick}
        tooltip={isCollapsed ? text : undefined}
        className={cn(
          "flex items-center transition-all duration-300 ease-in-out",
          "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2",
          "justify-start px-3 w-full",
          className
        )}
      >
        <div className="flex items-center w-full">
          {/* ✅ ALWAYS VISIBLE ICON */}
          <icon className="h-5 w-5 flex-shrink-0" />
          
          {/* ✅ TEXT WITH FADE ANIMATION */}
          <span className={cn(
            "ml-3 transition-all duration-300 ease-in-out",
            "group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:ml-0 group-data-[collapsible=icon]:overflow-hidden"
          )}>
            {text}
          </span>
        </div>
      </SidebarMenuButton>
    );
  };

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r transition-all duration-300 ease-in-out"
    >
      {/* ✅ HEADER WITH ANIMATION */}
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center">
          {/* ✅ LOGO - Always visible */}
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white flex-shrink-0">
            <TrendingUp className="h-6 w-6" />
          </div>
          
          {/* ✅ TITLE with fade animation */}
          <div className={cn(
            "ml-3 transition-all duration-300 ease-in-out",
            "group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:ml-0 group-data-[collapsible=icon]:overflow-hidden"
          )}>
            <h2 className="text-lg font-bold whitespace-nowrap">HPP by Monifine</h2>
          </div>
        </div>
      </SidebarHeader>

      {/* ✅ CONTENT */}
      <SidebarContent className="flex-grow px-2 py-4">
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label} className="mb-4">
            {/* ✅ GROUP LABEL with fade animation */}
            <SidebarGroupLabel className={cn(
              "text-sm font-semibold text-muted-foreground mb-1 px-3 transition-all duration-300 ease-in-out",
              "group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:h-0 group-data-[collapsible=icon]:mb-0 group-data-[collapsible=icon]:overflow-hidden"
            )}>
              {group.label}
            </SidebarGroupLabel>
            
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {renderMenuItem(item, location.pathname === item.url)}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* ✅ FOOTER */}
      <SidebarFooter className="p-2 border-t mt-auto">
        <SidebarMenu className="space-y-1">
          {/* Export Button */}
          <SidebarMenuItem>
            {renderActionButton(
              handleExportAllData,
              Download,
              "Export Semua Data",
              "hover:bg-gray-100"
            )}
          </SidebarMenuItem>
          
          {/* Settings */}
          {settingsItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              {renderMenuItem(item, location.pathname === item.url)}
            </SidebarMenuItem>
          ))}

          {/* Logout */}
          <SidebarMenuItem>
            {renderActionButton(
              () => setShowLogoutConfirm(true),
              LogOut,
              "Keluar",
              "text-red-500 hover:bg-red-50 hover:text-red-600"
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* ✅ LOGOUT DIALOG */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin keluar?
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