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

  // ✅ ENHANCED: Render menu item with smooth fade animation
  const renderMenuItem = (item, isActive) => {
    const menuButton = (
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className={cn(
          "flex items-center transition-all duration-300 ease-in-out overflow-hidden",
          isCollapsed ? "justify-center px-2 w-12" : "justify-start space-x-3 px-3"
        )}
      >
        <Link 
          to={item.url} 
          className={cn(
            "flex items-center transition-all duration-300 ease-in-out",
            isCollapsed ? "justify-center w-8" : "space-x-3 w-full"
          )}
        >
          {/* ✅ ENHANCED: Icon with consistent size and fade animation */}
          <div className={cn(
            "flex items-center justify-center transition-all duration-300 ease-in-out",
            "w-5 h-5 flex-shrink-0"
          )}>
            <item.icon className={cn(
              "transition-all duration-300 ease-in-out",
              isCollapsed ? "w-5 h-5 opacity-100" : "w-5 h-5 opacity-100"
            )} />
          </div>
          
          {/* ✅ ENHANCED: Text with smooth fade animation */}
          <span className={cn(
            "transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden",
            isCollapsed 
              ? "w-0 opacity-0 translate-x-2" 
              : "w-auto opacity-100 translate-x-0"
          )}>
            {item.title}
          </span>
        </Link>
      </SidebarMenuButton>
    );

    // ✅ ENHANCED: Tooltip with better positioning
    if (isCollapsed) {
      return (
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            {menuButton}
          </TooltipTrigger>
          <TooltipContent 
            side="right" 
            className="font-medium ml-2 bg-gray-900 text-white border-gray-700"
            sideOffset={5}
          >
            {item.title}
          </TooltipContent>
        </Tooltip>
      );
    }

    return menuButton;
  };

  // ✅ ENHANCED: Render action button with smooth animation
  const renderActionButton = (
    button, 
    tooltipText
  ) => {
    if (isCollapsed) {
      return (
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent 
            side="right" 
            className="font-medium ml-2 bg-gray-900 text-white border-gray-700"
            sideOffset={5}
          >
            {tooltipText}
          </TooltipContent>
        </Tooltip>
      );
    }
    return button;
  };

  return (
    <TooltipProvider>
      <Sidebar className={cn(
        "border-r transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}>
        {/* ✅ ENHANCED: Header with smooth animation */}
        <SidebarHeader className={cn(
          "p-4 transition-all duration-300 ease-in-out border-b",
          isCollapsed && "px-2"
        )}>
          <div className={cn(
            "flex items-center transition-all duration-300 ease-in-out",
            isCollapsed ? "justify-center" : "space-x-3"
          )}>
            {/* ✅ ENHANCED: Logo with consistent animation */}
            <div className={cn(
              "bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white flex-shrink-0 transition-all duration-300 ease-in-out",
              isCollapsed ? "w-8 h-8" : "w-10 h-10"
            )}>
              <TrendingUp className={cn(
                "transition-all duration-300 ease-in-out",
                isCollapsed ? "h-4 w-4" : "h-6 w-6"
              )} />
            </div>
            
            {/* ✅ ENHANCED: Title with fade animation */}
            <div className={cn(
              "transition-all duration-300 ease-in-out overflow-hidden",
              isCollapsed 
                ? "w-0 opacity-0 translate-x-2" 
                : "w-auto opacity-100 translate-x-0"
            )}>
              <h2 className="text-lg font-bold whitespace-nowrap">HPP by Monifine</h2>
            </div>
          </div>
        </SidebarHeader>

        {/* ✅ ENHANCED: Content with smooth transitions */}
        <SidebarContent className={cn(
          "flex-grow transition-all duration-300 ease-in-out",
          isCollapsed ? "px-1 py-4" : "px-2 py-4"
        )}>
          {menuGroups.map((group) => (
            <SidebarGroup key={group.label} className="mb-4">
              {/* ✅ ENHANCED: Group label with fade animation */}
              <div className={cn(
                "transition-all duration-300 ease-in-out overflow-hidden mb-1",
                isCollapsed 
                  ? "h-0 opacity-0" 
                  : "h-auto opacity-100"
              )}>
                <SidebarGroupLabel className="text-sm font-semibold text-muted-foreground px-3">
                  {group.label}
                </SidebarGroupLabel>
              </div>
              
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

        {/* ✅ ENHANCED: Footer with smooth transitions */}
        <SidebarFooter className={cn(
          "border-t mt-auto transition-all duration-300 ease-in-out",
          isCollapsed ? "p-1" : "p-2"
        )}>
          <SidebarMenu className="space-y-1">
            {/* ✅ ENHANCED: Export Button with animation */}
            <SidebarMenuItem>
              {renderActionButton(
                <SidebarMenuButton
                  onClick={handleExportAllData}
                  variant="outline"
                  className={cn(
                    "transition-all duration-300 ease-in-out",
                    isCollapsed ? "justify-center px-2 w-12" : "w-full px-3"
                  )}
                >
                  <div className={cn(
                    "flex items-center transition-all duration-300 ease-in-out",
                    isCollapsed ? "justify-center w-8" : "space-x-3 w-full"
                  )}>
                    <Download className="h-5 w-5 flex-shrink-0" />
                    <span className={cn(
                      "transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden",
                      isCollapsed 
                        ? "w-0 opacity-0 translate-x-2" 
                        : "w-auto opacity-100 translate-x-0"
                    )}>
                      Export Semua Data
                    </span>
                  </div>
                </SidebarMenuButton>,
                "Export Semua Data"
              )}
            </SidebarMenuItem>
            
            {/* ✅ ENHANCED: Settings with animation */}
            {settingsItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                {renderMenuItem(item, location.pathname === item.url)}
              </SidebarMenuItem>
            ))}

            {/* ✅ ENHANCED: Logout with animation */}
            <SidebarMenuItem>
              {renderActionButton(
                <SidebarMenuButton 
                  onClick={() => setShowLogoutConfirm(true)} 
                  className={cn(
                    "text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-300 ease-in-out",
                    isCollapsed ? "justify-center px-2 w-12" : "w-full px-3"
                  )}
                >
                  <div className={cn(
                    "flex items-center transition-all duration-300 ease-in-out",
                    isCollapsed ? "justify-center w-8" : "space-x-3 w-full"
                  )}>
                    <LogOut className="h-5 w-5 flex-shrink-0" />
                    <span className={cn(
                      "transition-all duration-300 ease-in-out whitespace-nowrap overflow-hidden",
                      isCollapsed 
                        ? "w-0 opacity-0 translate-x-2" 
                        : "w-auto opacity-100 translate-x-0"
                    )}>
                      Keluar
                    </span>
                  </div>
                </SidebarMenuButton>,
                "Keluar"
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        {/* ✅ ENHANCED: Alert Dialog (unchanged but for completeness) */}
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