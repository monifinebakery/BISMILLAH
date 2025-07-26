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
  TrendingUp, Settings, Building2, LogOut, Download, Receipt 
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
import { useBahanBaku } from "@/components/warehouse/context/BahanBakuContext";
import { useSupplier } from "@/contexts/SupplierContext";
import { usePurchase } from "@/components/purchase/context/PurchaseContext";
import { useRecipe } from "@/contexts/RecipeContext";
import { useActivity } from "@/contexts/ActivityContext";
import { useOrder } from "@/components/orders/context/OrderContext";
import { useAssets } from "@/contexts/AssetContext";
import { useFinancial } from "@/components/financial/contexts/FinancialContext";
import { useUserSettings } from "@/contexts/UserSettingsContext";
// ✅ NEW: Import PromoContext
import { usePromo } from "@/contexts/PromoContext";

// --- Impor Fungsi Export Baru ---
import { exportAllDataToExcel } from "@/utils/exportUtils";

export function AppSidebar() {
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { state } = useSidebar();
  
  // Check if sidebar is collapsed
  const isCollapsed = state === "collapsed";
  
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

  // ✅ UPDATED: Menu groups dengan Kalkulator Promo
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

  // ✅ UPDATED: Include promo data in export
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
    };
    
    exportAllDataToExcel(allAppData, settings.businessName);
  };

  // Render menu item with conditional tooltip
  const renderMenuItem = (item, isActive) => {
    const menuButton = (
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className={cn(
          "flex items-center",
          isCollapsed ? "justify-center px-2" : "justify-start space-x-3"
        )}
      >
        <Link 
          to={item.url} 
          className={cn(
            "flex items-center",
            isCollapsed ? "justify-center" : "space-x-3"
          )}
        >
          <item.icon className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span>{item.title}</span>}
        </Link>
      </SidebarMenuButton>
    );

    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {menuButton}
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return menuButton;
  };

  // Render action button with conditional tooltip
  const renderActionButton = (
    button, 
    tooltipText
  ) => {
    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {tooltipText}
          </TooltipContent>
        </Tooltip>
      );
    }
    return button;
  };

  return (
    <TooltipProvider>
      <Sidebar className="border-r">
        <SidebarHeader className={cn("p-4", isCollapsed && "px-2")}>
          <div className={cn(
            "flex items-center",
            isCollapsed ? "justify-center" : "space-x-3"
          )}>
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white flex-shrink-0">
              <TrendingUp className="h-6 w-6" />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-bold">HPP by Monifine</h2>
              </div>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className={cn("px-2 py-4 flex-grow", isCollapsed && "px-1")}>
          {menuGroups.map((group) => (
            <SidebarGroup key={group.label} className="mb-4">
              {!isCollapsed && (
                <SidebarGroupLabel className="text-sm font-semibold text-muted-foreground mb-1 px-3">
                  {group.label}
                </SidebarGroupLabel>
              )}
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

        <SidebarFooter className={cn("p-2 border-t mt-auto", isCollapsed && "px-1")}>
          <SidebarMenu className="space-y-1">
            {/* Export Button */}
            <SidebarMenuItem>
              {renderActionButton(
                <SidebarMenuButton
                  onClick={handleExportAllData}
                  variant="outline"
                  className={cn(
                    isCollapsed ? "justify-center px-2" : "w-full"
                  )}
                >
                  <div className={cn(
                    "flex items-center",
                    isCollapsed ? "justify-center" : "space-x-3"
                  )}>
                    <Download className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && <span>Export Semua Data</span>}
                  </div>
                </SidebarMenuButton>,
                "Export Semua Data"
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
                <SidebarMenuButton 
                  onClick={() => setShowLogoutConfirm(true)} 
                  className={cn(
                    "text-red-500 hover:bg-red-50 hover:text-red-600",
                    isCollapsed ? "justify-center px-2" : "w-full"
                  )}
                >
                  <div className={cn(
                    "flex items-center",
                    isCollapsed ? "justify-center" : "space-x-3"
                  )}>
                    <LogOut className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && <span>Keluar</span>}
                  </div>
                </SidebarMenuButton>,
                "Keluar"
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

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
    </TooltipProvider>
  );
}