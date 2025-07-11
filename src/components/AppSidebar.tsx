import { Calendar, ChefHat, Home, Package, ShoppingCart, FileText, TrendingUp, Settings, Users, ShoppingBag, LogOut } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar
} from "@/components/ui/sidebar"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { performSignOut } from "@/lib/authUtils"

// Menu items grouped by category
const menuGroups = [
  {
    label: "Dashboard",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: Home,
      },
      {
        title: "Kalkulator HPP Cepat",
        url: "/hpp",
        icon: TrendingUp,
      },
    ]
  },
  {
    label: "Produksi",
    items: [
      {
        title: "Manajemen Resep",
        url: "/resep",
        icon: ChefHat,
      },
      {
        title: "Gudang Bahan Baku",
        url: "/gudang",
        icon: Package,
      },
    ]
  },
  {
    label: "Bisnis",
    items: [
      {
        title: "Supplier",
        url: "/supplier",
        icon: Users,
      },
      {
        title: "Pembelian Bahan Baku",
        url: "/pembelian",
        icon: ShoppingBag,
      },
      {
        title: "Pesanan",
        url: "/pesanan",
        icon: ShoppingCart
      },
    ]
  },
  {
    label: "Laporan & Analisis",
    items: [
      {
        title: "Laporan Keuangan",
        url: "/laporan",
        icon: FileText,
      },
      {
        title: "Manajemen Aset",
        url: "/aset",
        icon: Calendar,
      },
    ]
  }
]

const settingsItems = [
  {
    title: "Pengaturan",
    url: "/pengaturan",
    icon: Settings,
  },
]

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { state } = useSidebar()

  const handleLogout = async () => {
    try {
      const success = await performSignOut();
      
      if (success) {
        toast.success("Berhasil keluar");
        
        // Force page reload for complete cleanup
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        toast.error("Gagal keluar");
      }
    } catch (error) {
      toast.error("Gagal keluar");
    }
  }

  return (
    <Sidebar className="border-r border-gray-200 bg-white">
      <SidebarHeader className={`p-4 border-b border-gray-200 ${state === "collapsed" ? "flex justify-center items-center" : ""}`}>
        <div className={`flex items-center ${state === "collapsed" ? "justify-center" : "space-x-3"}`}>
          <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-white" />
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
                      className={`
                        px-3 py-2 rounded-lg text-base font-medium transition-all duration-200
                        ${location.pathname === item.url 
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md' 
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
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
                    className={`
                      px-3 py-2 rounded-lg text-base font-medium transition-all duration-200
                      ${location.pathname === item.url 
                        ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-md' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
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
    </Sidebar>
  )
}