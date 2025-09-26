import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { useTranslation } from "react-i18next"
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  LineChart,
  Settings,
  FileText,
  DollarSign,
  Truck,
  Calculator,
  BarChart3,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { useState } from "react"
import { Link, useLocation } from "react-router-dom"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isCollapsed?: boolean
}

interface NavItem {
  title: string
  titleKey: string // Translation key
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  badgeKey?: string // Translation key for badge
  children?: NavItem[]
}

const navigation: NavItem[] = [
  {
    title: "Dashboard",
    titleKey: "common:navigation.dashboard",
    href: "/",
    icon: Home,
  },
  {
    title: "Inventory",
    titleKey: "common:navigation.inventory",
    href: "/warehouse",
    icon: Package,
    children: [
      { title: "Modern Inventory", titleKey: "Modern Inventory", href: "/warehouse/inventory", icon: Package },
      { title: "Simple Warehouse", titleKey: "Simple Warehouse", href: "/simple-warehouse", icon: Package },
      { title: "Stock Alerts", titleKey: "Stock Alerts", href: "/warehouse/alerts", icon: Package },
    ],
  },
  {
    title: "Suppliers",
    titleKey: "common:navigation.suppliers",
    href: "/suppliers",
    icon: Truck,
    children: [
      { title: "Modern Suppliers", titleKey: "Modern Suppliers", href: "/suppliers", icon: Truck },
      { title: "Simple Suppliers", titleKey: "Simple Suppliers", href: "/simple-suppliers", icon: Truck },
    ],
  },
  {
    title: "Customers",
    titleKey: "common:navigation.customers",
    href: "/customers",
    icon: Users,
    children: [
      { title: "Modern Customers", titleKey: "Modern Customers", href: "/customers", icon: Users },
      { title: "Simple Customers", titleKey: "Simple Customers", href: "/simple-customers", icon: Users },
      { title: "Customer Analytics", titleKey: "Customer Analytics", href: "/customers/analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Purchases",
    titleKey: "common:navigation.purchases",
    href: "/purchases",
    icon: ShoppingCart,
    children: [
      { title: "All Purchases", titleKey: "All Purchases", href: "/purchases", icon: ShoppingCart },
      { title: "Simple Purchases", titleKey: "Simple Purchases", href: "/simple-purchases", icon: ShoppingCart },
    ],
  },
  {
    title: "Orders",
    titleKey: "common:navigation.orders",
    href: "/orders",
    icon: FileText,
    badge: "New",
    badgeKey: "common:status.pending",
    children: [
      { title: "All Orders", titleKey: "All Orders", href: "/pesanan", icon: FileText },
      { title: "Simple Orders", titleKey: "Simple Orders", href: "/simple-orders", icon: FileText },
    ],
  },
  {
    title: "Recipes",
    titleKey: "common:navigation.recipes",
    href: "/recipes",
    icon: Calculator,
    children: [
      { title: "All Recipes", titleKey: "All Recipes", href: "/resep", icon: Calculator },
      { title: "Simple Recipes", titleKey: "Simple Recipes", href: "/simple-recipes", icon: Calculator },
    ],
  },
  {
    title: "Financial",
    titleKey: "common:navigation.finance",
    href: "/financial",
    icon: DollarSign,
    children: [
      { title: "Transactions", titleKey: "Transactions", href: "/financial/transactions", icon: DollarSign },
      { title: "Operational Costs", titleKey: "Operational Costs", href: "/financial/operational-costs", icon: BarChart3 },
      { title: "Simple Financial", titleKey: "Simple Financial", href: "/simple-financial", icon: DollarSign },
    ],
  },
  {
    title: "Analytics",
    titleKey: "common:navigation.reports",
    href: "/analytics",
    icon: LineChart,
    children: [
      { title: "Profit Analysis", titleKey: "Profit Analysis", href: "/analisis-profit", icon: BarChart3 },
      { title: "Reports", titleKey: "Reports", href: "/analytics/reports", icon: FileText },
      { title: "Simple Analytics", titleKey: "Simple Analytics", href: "/simple-analytics", icon: LineChart },
    ],
  },
  {
    title: "Settings",
    titleKey: "common:navigation.settings",
    href: "/settings",
    icon: Settings,
    children: [
      { title: "Advanced Settings", titleKey: "Advanced Settings", href: "/pengaturan", icon: Settings },
      { title: "Simple Settings", titleKey: "Simple Settings", href: "/simple-settings", icon: Settings },
    ],
  },
]

export function Sidebar({ className, isCollapsed = false }: SidebarProps) {
  const location = useLocation()
  const { t } = useTranslation()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/"
    }
    return location.pathname.startsWith(href)
  }

  const renderNavItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.title)
    const active = isActive(item.href)

    return (
      <div key={item.title}>
        <Button
          variant={active ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start h-10",
            depth > 0 && "pl-8",
            isCollapsed && "px-2"
          )}
          asChild={!hasChildren}
          onClick={hasChildren ? () => toggleExpanded(item.title) : undefined}
        >
          {hasChildren ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4" />
                {!isCollapsed && (
                  <span className="text-sm font-medium">{t(item.titleKey)}</span>
                )}
              </div>
              {!isCollapsed && (
                <div className="flex items-center gap-1">
                  {item.badge && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      {item.badgeKey ? t(item.badgeKey) : item.badge}
                    </Badge>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              )}
            </div>
          ) : (
            <Link to={item.href} className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4" />
                {!isCollapsed && (
                  <span className="text-sm font-medium">{t(item.titleKey)}</span>
                )}
              </div>
              {!isCollapsed && item.badge && (
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {item.badgeKey ? t(item.badgeKey) : item.badge}
                </Badge>
              )}
            </Link>
          )}
        </Button>

        {hasChildren && isExpanded && !isCollapsed && (
          <div className="mt-1 space-y-1">
            {item.children?.map(child => renderNavItem(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full bg-background border-r", className)}>
      <div className="p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">B</span>
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-semibold text-lg">Bismillah</h1>
              <p className="text-xs text-muted-foreground">Business Manager</p>
            </div>
          )}
        </div>
      </div>

      <Separator />

      <ScrollArea className="flex-1 p-4">
        <nav className="space-y-2">
          {navigation.map(item => renderNavItem(item))}
        </nav>
      </ScrollArea>
      
      {!isCollapsed && (
        <>
          <Separator />
          <div className="p-4">
            <LanguageSwitcher />
          </div>
        </>
      )}
    </div>
  )
}