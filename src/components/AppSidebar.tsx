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
// ✅ FIXED: Import useNavigate
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
import { useAssets } from "@/contexts/AssetContext";
import { useFinancial } from "@/components/financial/contexts/FinancialContext";
import { useUserSettings } from "@/contexts/UserSettingsContext";
import { usePromo } from "@/components/promoCalculator/context/PromoContext";
import { useOperationalCost } from "@/components/operational-costs/context/OperationalCostContext";

// --- Import Fungsi Export ---
import { exportAllDataToExcel } from "@/utils/exportUtils";

export function AppSidebar() {
  const location = useLocation();
  // ✅ FIXED: Initialize useNavigate
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { state } = useSidebar();
  
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
  const { promos } = usePromo();
  const { state: operationalCostState } = useOperationalCost();

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

  // ✅ FINAL FIX: Use programmatic navigation for collapsed view to ensure centering
  const renderMenuItem = (item, isActive) => {
    if (isCollapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              {/* Render a standard button that navigates on click */}
              <SidebarMenuButton
                onClick={() => navigate(item.url)}
                isActive={isActive}
                className="w-full justify-center px-2"
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
              </SidebarMenuButton>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{item.title}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    // For expanded view, use Link for better accessibility and SEO
    return (
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className="w-full justify-start px-3"
      >
        <Link to={item.url} className="flex items-center w-full h-full">
          <item.icon className="h-5 w-5 flex-shrink-0" />
          <span className="ml-3">{item.title}</span>
        </Link>
      </SidebarMenuButton>
    );
  };

  // This function already works correctly
  const renderActionButton = (onClick, IconComponent: React.ElementType, text: string, className = "") => {
    const buttonContent = (
      <>
        <IconComponent className="h-5 w-5 flex-shrink-0" />
        {!isCollapsed && <span className="ml-3">{text}</span>}
      </>
    );

    if (isCollapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarMenuButton
                onClick={onClick}
                className={cn("w-full justify-center px-2", className)}
              >
                {buttonContent}
              </SidebarMenuButton>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{text}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <SidebarMenuButton
        onClick={onClick}
        className={cn("w-full justify-start px-3", className)}
      >
        {buttonContent}
      </SidebarMenuButton>
    );
  };

  return (
    <Sidebar 
      collapsible="icon" 
      className="border-r"
    >
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white flex-shrink-0">
            <TrendingUp className="h-6 w-6" />
          </div>
          {!isCollapsed && (
            <div className="ml-3">
              <h2 className="text-lg font-bold">HPP by Monifine</h2>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="flex-grow px-2 py-4">
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

      {/* Logout Dialog */}
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
