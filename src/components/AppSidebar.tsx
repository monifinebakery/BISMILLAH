import React, { useState } from "react";
import {
  Sidebar, SidebarHeader, SidebarContent, SidebarGroup, SidebarGroupLabel,
  SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  SidebarFooter
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { DashboardIcon } from "@radix-ui/react-icons";
import {
  Calculator, ChefHat, Package, Users, ShoppingCart, FileText,
  TrendingUp, Settings, Building2, LogOut, Download, Receipt, DollarSign,
  BarChart3, BookOpen
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { performSignOut } from "@/lib/authUtils";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

import { usePaymentContext } from "@/contexts/PaymentContext";
import { useBahanBaku } from "@/components/warehouse/context/WarehouseContext";
import { useSupplier } from "@/contexts/SupplierContext";
import { usePurchase } from "@/components/purchase/hooks/usePurchase";
import { useRecipe } from "@/contexts/RecipeContext";
import { useActivity } from "@/contexts/ActivityContext";
import { useOrder } from "@/components/orders/context/OrderContext";
import { useFinancial } from "@/components/financial/contexts/FinancialContext";
import { useUserSettings } from "@/contexts/UserSettingsContext";
import { usePromo } from "@/components/promoCalculator/context/PromoContext";
import { useOperationalCost } from "@/components/operational-costs/context/OperationalCostContext";

import { useAssetQuery } from "@/components/assets";
import { useAuth } from "@/contexts/AuthContext";


import { useProfitAnalysis } from "@/components/profitAnalysis";
import { exportAllDataToExcel } from "@/utils/exportUtils";

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { user } = useAuth();
  const { settings } = useUserSettings();
  const { isPaid } = usePaymentContext();

  // Use warehouse hook directly with defensive check
  let bahanBaku: Array<any> = [];
  try {
    const warehouseContext = useBahanBaku();
    bahanBaku = warehouseContext?.bahanBaku || [];
  } catch (error) {
    console.warn('Failed to get warehouse data in AppSidebar:', error);
    bahanBaku = [];
  }
  
  const { suppliers } = useSupplier();
  const { purchases } = usePurchase();
  const { recipes } = useRecipe();
  const { activities } = useActivity();
  const { orders } = useOrder();
  const { financialTransactions } = useFinancial();
  const { promos } = usePromo();
  const { state: operationalCostState } = useOperationalCost();

  const { assets, isLoading: assetsLoading } = useAssetQuery({ userId: user?.id, enableRealtime: false });
  const { currentAnalysis: profitAnalysis, profitHistory, loading: profitLoading } =
    useProfitAnalysis({ autoCalculate: false, enableRealTime: false });

  const menuGroups = [
    { label: "Dashboard", items: [
      { title: "Dashboard", url: "/", icon: DashboardIcon },
      { title: "Kalkulator Promo", url: "/promo", icon: Calculator },
      { title: "Tutorial HPP & WAC", url: "/tutorial", icon: BookOpen },
    ]},
    { label: "Hitung HPP", items: [
      { title: "Manajemen Resep", url: "/resep", icon: ChefHat },
      { title: "Gudang Bahan Baku", url: "/gudang", icon: Package },
      { title: "Biaya Operasional", url: "/biaya-operasional", icon: DollarSign },
    ]},
    { label: "Bisnis", items: [
      { title: "Supplier", url: "/supplier", icon: Users },
      { title: "Pembelian", url: "/pembelian", icon: ShoppingCart },
      { title: "Pesanan", url: "/pesanan", icon: FileText },
    ]},
    { label: "Laporan & Analisis", items: [
      { title: "Laporan Keuangan", url: "/laporan", icon: TrendingUp },
      { title: "Analisis Profit", url: "/analisis-profit", icon: BarChart3 },
      { title: "Manajemen Aset", url: "/aset", icon: Building2 },
      { title: "Invoice", url: "/invoice", icon: Receipt },
    ]},
  ];

  const settingsItems = [
    { title: "Pengaturan", url: "/pengaturan", icon: Settings },
  ];

  const confirmLogout = async () => {
    const ok = await performSignOut();
    if (ok) { toast.success("Berhasil keluar"); setTimeout(() => window.location.reload(), 500); }
    else toast.error("Gagal keluar");
  };

  // Expanded: rata kiri — Collapsed: center (tanpa padding, tombol jadi square)
  const baseMenuButtonClass =
    "w-full justify-start text-left px-3 py-2 gap-3 transition-all duration-200 relative group " +
    "group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0 " +
    "group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center " +
    "[&:hover]:!bg-orange-50 [&:hover]:!text-orange-600 hover:scale-[1.02] " +
    "[&:active]:!bg-orange-200 [&:active]:!text-orange-700 active:scale-[0.98] " +
    "[&:focus]:!bg-orange-100 [&:focus]:!text-orange-600";

  const baseMenuButtonStyle = {
    "--hover-bg": "#fed7aa",
    "--hover-text": "#ea580c",
    "--active-bg": "#fdba74",
    "--active-text": "#c2410c",
  } as React.CSSProperties;

  const handleExportAllData = (format: 'xlsx' | 'csv' = 'xlsx') => {
    if (assetsLoading) { toast.info("Tunggu sebentar, sedang memuat data aset..."); return; }
    exportAllDataToExcel({
      bahanBaku, suppliers, purchases, recipes, activities, orders, assets,
      financialTransactions, promos,
      operationalCosts: operationalCostState.costs,
      allocationSettings: operationalCostState.allocationSettings,
      costSummary: operationalCostState.summary,
      profitAnalysis, profitHistory,
    }, settings.businessName, format);
  };

  const renderMenuItem = (item: { title: string; url: string; icon: React.ElementType }, isActive: boolean) => {
    return (
      <SidebarMenuButton
        tooltip={item.title}
        onClick={() => navigate(item.url)}
        isActive={isActive}
        style={baseMenuButtonStyle}
        className={cn(baseMenuButtonClass, "flex items-center", isActive && "!bg-orange-100 !text-orange-600 !border-orange-200")}
      >
        <item.icon className="h-5 w-5 flex-shrink-0" />
        <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
      </SidebarMenuButton>
    );
  };

  const renderActionButton = (onClick: () => void, Icon: React.ElementType, text: string, className = "") => (
    <SidebarMenuButton
      tooltip={text}
      onClick={onClick}
      style={baseMenuButtonStyle}
      className={cn(baseMenuButtonClass, "flex items-center", className)}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span className="group-data-[collapsible=icon]:hidden">{text}</span>
    </SidebarMenuButton>
  );

  return (
    <Sidebar collapsible="icon" className="border-r transition-all duration-300 ease-in-out">
      {/* Header */}
      <SidebarHeader className="p-4 border-b group-data-[collapsible=icon]:px-0">
        <div className="flex items-center w-full group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mx-auto">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white flex-shrink-0 group-data-[collapsible=icon]:mx-auto">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className="ml-3 opacity-100 transition-opacity duration-300 group-data-[collapsible=icon]:hidden">
            <h2 className="text-lg font-bold whitespace-nowrap">HPP by Monifine</h2>
          </div>
        </div>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent className="flex flex-col flex-grow px-2 py-4 group-data-[collapsible=icon]:px-0">
        {menuGroups.map((group, gi) => (
          <SidebarGroup key={group.label} className={cn("mb-4 w-full", `delay-[${gi * 50}ms]`)}>
            <SidebarGroupLabel className="text-sm font-semibold text-muted-foreground mb-1 px-3 group-data-[collapsible=icon]:hidden">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1 flex flex-col w-full">
                {group.items.map((item, ii) => (
                  <SidebarMenuItem key={item.title} className={cn("w-full", `delay-[${(gi * 100) + (ii * 25)}ms]`)}>
                    {renderMenuItem(item, location.pathname === item.url)}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-2 border-t mt-auto">
        <SidebarMenu className="space-y-1 flex flex-col w-full">
          <SidebarMenuItem className="w-full">
            {renderActionButton(() => handleExportAllData('xlsx'), Download, (assetsLoading || profitLoading) ? "Memuat..." : "Export Semua Data")}
          </SidebarMenuItem>
          {settingsItems.map((item) => (
            <SidebarMenuItem key={item.title} className="w-full">
              {renderMenuItem(item, location.pathname === item.url)}
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem className="w-full">
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
            <AlertDialogDescription>Apakah Anda yakin ingin keluar?</AlertDialogDescription>
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
