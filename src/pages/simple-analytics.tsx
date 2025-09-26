import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MultipleLineChart, presetConfigurations } from "@/components/ui/multiple-line-chart"
import { SimpleBarChart, barPresetConfigurations } from "@/components/ui/bar-chart"
import {
  LineChart,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  FileText,
  Calendar,
  Download,
  RefreshCw,
  Target,
  PieChart,
  Activity,
} from "lucide-react"

export function SimpleAnalytics() {
  // Sample data for analytics
  const monthlyData = [
    { month: "Jan", revenue: 2500000, costs: 1800000, profit: 700000, orders: 45 },
    { month: "Feb", revenue: 2800000, costs: 1950000, profit: 850000, orders: 52 },
    { month: "Mar", revenue: 3200000, costs: 2100000, profit: 1100000, orders: 68 },
    { month: "Apr", revenue: 2900000, costs: 2000000, profit: 900000, orders: 58 },
    { month: "May", revenue: 3500000, costs: 2250000, profit: 1250000, orders: 75 },
    { month: "Jun", revenue: 4100000, costs: 2600000, profit: 1500000, orders: 89 }
  ]

  const productAnalysis = [
    { product: "Kue Lapis Legit", sales: 45, revenue: 1575000, profit_margin: 46, trend: "up" },
    { product: "Brownies Coklat", sales: 68, revenue: 1020000, profit_margin: 44, trend: "up" },
    { product: "Cupcakes Vanilla", sales: 120, revenue: 600000, profit_margin: 50, trend: "stable" },
    { product: "Roti Tawar", sales: 85, revenue: 510000, profit_margin: 48, trend: "down" }
  ]

  const kpiTargets = [
    { name: "Monthly Revenue", current: 4100000, target: 4500000, percentage: 91 },
    { name: "Profit Margin", current: 36.6, target: 40, percentage: 91.5 },
    { name: "Orders", current: 89, target: 100, percentage: 89 },
    { name: "Customer Satisfaction", current: 4.7, target: 4.8, percentage: 97.9 }
  ]

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount)
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up":
        return "text-green-600"
      case "down":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getKpiColor = (percentage: number) => {
    if (percentage >= 95) return "text-green-600"
    if (percentage >= 80) return "text-yellow-600"
    return "text-red-600"
  }

  // Calculate current period stats
  const currentMonth = monthlyData[monthlyData.length - 1]
  const previousMonth = monthlyData[monthlyData.length - 2]
  const revenueGrowth = ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue * 100).toFixed(1)
  const profitGrowth = ((currentMonth.profit - previousMonth.profit) / previousMonth.profit * 100).toFixed(1)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Business insights, profit analysis, and performance reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="6months">
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(currentMonth.revenue)}</div>
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+{revenueGrowth}%</span>
              <span className="text-muted-foreground">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatRupiah(currentMonth.profit)}</div>
            <div className="flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+{profitGrowth}%</span>
              <span className="text-muted-foreground">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{((currentMonth.profit / currentMonth.revenue) * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Target: 40%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonth.orders}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
            <CardDescription>Revenue and profit trends over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <MultipleLineChart
              data={monthlyData}
              lines={presetConfigurations.revenueProfit}
              xAxisDataKey="month"
              height={320}
            />
          </CardContent>
        </Card>

        {/* KPI Targets */}
        <Card>
          <CardHeader>
            <CardTitle>KPI Targets</CardTitle>
            <CardDescription>Progress towards monthly business goals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {kpiTargets.map((kpi, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{kpi.name}</span>
                  <span className={`text-sm font-bold ${getKpiColor(kpi.percentage)}`}>
                    {kpi.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      kpi.percentage >= 95 ? 'bg-green-600' : 
                      kpi.percentage >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${kpi.percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Current: {kpi.name.includes('Revenue') || kpi.name.includes('Margin') ? 
                    (kpi.name.includes('Revenue') ? formatRupiah(kpi.current) : `${kpi.current}%`) : kpi.current}
                  </span>
                  <span>Target: {kpi.name.includes('Revenue') || kpi.name.includes('Margin') ? 
                    (kpi.name.includes('Revenue') ? formatRupiah(kpi.target) : `${kpi.target}%`) : kpi.target}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Product Performance */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Product Performance</CardTitle>
              <CardDescription>Best performing products by sales and profitability</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <PieChart className="h-4 w-4 mr-2" />
              View Chart
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {productAnalysis.map((product, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium">{product.product}</div>
                    <div className="text-sm text-muted-foreground">{product.sales} units sold</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="font-medium">{formatRupiah(product.revenue)}</div>
                    <div className="text-sm text-muted-foreground">Revenue</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600">{product.profit_margin}%</div>
                    <div className="text-sm text-muted-foreground">Profit Margin</div>
                  </div>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(product.trend)}
                    <span className={`text-sm capitalize ${getTrendColor(product.trend)}`}>
                      {product.trend}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Product Sales Chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Product Sales Comparison</CardTitle>
            <CardDescription>Sales volume by product category</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={productAnalysis}
              bars={[{
                dataKey: 'sales',
                color: 'hsl(var(--primary))',
                name: 'Units Sold',
                radius: [4, 4, 0, 0]
              }]}
              xAxisDataKey="product"
              height={280}
              formatXAxisLabel={(value) => value.split(' ')[0]} // Show only first word
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Product</CardTitle>
            <CardDescription>Revenue contribution from each product</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={productAnalysis}
              bars={[{
                dataKey: 'revenue',
                color: 'hsl(142, 76%, 36%)',
                name: 'Revenue',
                radius: [4, 4, 0, 0]
              }]}
              xAxisDataKey="product"
              height={280}
              formatXAxisLabel={(value) => value.split(' ')[0]} // Show only first word
            />
          </CardContent>
        </Card>
      </div>

      {/* Quick Reports */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Monthly Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Comprehensive monthly business performance report
            </p>
            <Button variant="outline" size="sm">
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Profit Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Deep dive into profit margins and cost optimization
            </p>
            <Button variant="outline" size="sm">
              View Analysis
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Custom Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Create custom reports for specific time periods
            </p>
            <Button variant="outline" size="sm">
              Create Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}