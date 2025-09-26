import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  const stats = [
    {
      title: "Total Revenue",
      value: "Rp 45,231,890",
      change: "+20.1%",
      changeType: "increase" as const,
      icon: DollarSign,
      description: "from last month",
    },
    {
      title: "Active Orders",
      value: "234",
      change: "+12.3%",
      changeType: "increase" as const,
      icon: ShoppingCart,
      description: "pending orders",
    },
    {
      title: "Inventory Items",
      value: "1,234",
      change: "-2.4%",
      changeType: "decrease" as const,
      icon: Package,
      description: "total stock",
    },
    {
      title: "Profit Margin",
      value: "32.4%",
      change: "+4.2%",
      changeType: "increase" as const,
      icon: TrendingUp,
      description: "gross margin",
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your business.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Quick Add
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {stat.changeType === "increase" ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span
                  className={
                    stat.changeType === "increase"
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {stat.change}
                </span>
                {stat.description}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Frequently used actions for your business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {quickActions.map((action) => (
              <div
                key={action.title}
                className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
              >
                <div className="p-2 bg-primary/10 rounded-lg">
                  <action.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>
              Latest updates from your business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start gap-4">
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
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}