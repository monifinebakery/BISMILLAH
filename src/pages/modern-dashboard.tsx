import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AnimatedContainer, StaggeredContainer } from "@/components/ui/animated-container"
import { AnimatedButton, LoadingButton } from "@/components/ui/animated-button"
import { AnimatedGrid, HoverCard, StatsCard } from "@/components/ui/animated-card"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import {
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  FileText,
  AlertTriangle,
  Plus,
} from "lucide-react"

export function ModernDashboard() {
  const { t } = useTranslation(['dashboard', 'common'])
  
  const stats = [
    {
      title: t('dashboard:stats.totalRevenue'),
      value: "Rp 45,231,890",
      change: "+20.1%",
      changeType: "increase" as const,
      icon: DollarSign,
      description: t('dashboard:stats.fromLastMonth'),
    },
    {
      title: t('dashboard:stats.activeOrders'),
      value: "234",
      change: "+12.3%",
      changeType: "increase" as const,
      icon: ShoppingCart,
      description: t('dashboard:stats.pendingOrders'),
    },
    {
      title: t('dashboard:stats.inventoryItems'),
      value: "1,234",
      change: "-2.4%",
      changeType: "decrease" as const,
      icon: Package,
      description: t('dashboard:stats.totalStock'),
    },
    {
      title: t('dashboard:stats.profitMargin'),
      value: "32.4%",
      change: "+4.2%",
      changeType: "increase" as const,
      icon: TrendingUp,
      description: t('dashboard:stats.grossMargin'),
    },
  ]

  const recentActivities = [
    {
      type: "order",
      title: "New order received",
      description: "Order #12345 from John Doe",
      time: "2 minutes ago",
      status: "new",
    },
    {
      type: "inventory",
      title: "Low stock alert",
      description: "Flour (1kg) is running low",
      time: "15 minutes ago",
      status: "warning",
    },
    {
      type: "purchase",
      title: "Purchase completed",
      description: "Purchase #P-456 from ABC Supplier",
      time: "1 hour ago",
      status: "completed",
    },
    {
      type: "financial",
      title: "Payment received",
      description: "Rp 1,500,000 from Order #12340",
      time: "2 hours ago",
      status: "completed",
    },
  ]

  const quickActions = [
    {
      title: "New Purchase",
      description: "Add new purchase order",
      icon: ShoppingCart,
      href: "/purchases/new",
    },
    {
      title: "Add Inventory",
      description: "Add new inventory item",
      icon: Package,
      href: "/warehouse/new",
    },
    {
      title: "Create Order",
      description: "Create new customer order",
      icon: FileText,
      href: "/orders/new",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <AnimatedContainer variant="slideUp" className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('dashboard:title')}</h1>
          <p className="text-muted-foreground">
            {t('dashboard:subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AnimatedButton variant="outline" delay={0.3}>
            <FileText className="h-4 w-4 mr-2" />
            {t('dashboard:buttons.exportReport')}
          </AnimatedButton>
          <AnimatedButton delay={0.4}>
            <Plus className="h-4 w-4 mr-2" />
            {t('dashboard:buttons.quickAdd')}
          </AnimatedButton>
        </div>
      </AnimatedContainer>

      {/* Stats Grid */}
      <StaggeredContainer className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            changeType={stat.changeType}
            icon={stat.icon}
            description={stat.description}
            index={index}
          />
        ))}
      </StaggeredContainer>

      <AnimatedGrid className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <HoverCard>
          <CardHeader>
            <CardTitle>{t('dashboard:quickActions.title')}</CardTitle>
            <CardDescription>
              {t('dashboard:quickActions.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <StaggeredContainer>
              {quickActions.map((action, index) => (
                <AnimatedContainer
                  key={action.title}
                  variant="slideUp"
                  delay={index * 0.1}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer group"
                >
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <action.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                  <AnimatedButton variant="ghost" size="sm">
                    <Plus className="h-4 w-4" />
                  </AnimatedButton>
                </AnimatedContainer>
              ))}
            </StaggeredContainer>
          </CardContent>
        </HoverCard>

        {/* Recent Activities */}
        <HoverCard>
          <CardHeader>
            <CardTitle>{t('dashboard:recentActivities.title')}</CardTitle>
            <CardDescription>
              {t('dashboard:recentActivities.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <StaggeredContainer>
              {recentActivities.map((activity, index) => (
                <AnimatedContainer
                  key={index}
                  variant="slideUp"
                  delay={index * 0.1}
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="p-2 bg-muted rounded-lg">
                    {activity.type === "order" && <ShoppingCart className="h-4 w-4" />}
                    {activity.type === "inventory" && <AlertTriangle className="h-4 w-4 text-orange-600" />}
                    {activity.type === "purchase" && <Package className="h-4 w-4" />}
                    {activity.type === "financial" && <DollarSign className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium">{activity.title}</h4>
                      <Badge
                        variant={
                          activity.status === "new"
                            ? "default"
                            : activity.status === "warning"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {activity.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </AnimatedContainer>
              ))}
            </StaggeredContainer>
          </CardContent>
        </HoverCard>
      </AnimatedGrid>
    </div>
  )
}