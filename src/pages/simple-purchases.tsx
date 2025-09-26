import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ShoppingCart,
  Search,
  Plus,
  Filter,
  Eye,
  Edit,
  Truck,
  Calendar,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  Building,
} from "lucide-react"

export function SimplePurchases() {
  const purchases = [
    {
      id: "PO-001",
      date: "2024-01-15",
      supplier: "CV Toko Bahan Kue",
      contact: "081234567890",
      items: [
        { name: "Tepung Terigu Premium", qty: 25, unit: "kg", price: 18000 },
        { name: "Gula Pasir", qty: 20, unit: "kg", price: 12000 }
      ],
      total: 690000,
      status: "completed",
      delivery_date: "2024-01-16",
      payment_status: "paid",
      category: "raw_materials"
    },
    {
      id: "PO-002",
      date: "2024-01-14", 
      supplier: "Supplier Coklat Jakarta",
      contact: "081234567891",
      items: [
        { name: "Dark Chocolate Compound", qty: 10, unit: "kg", price: 85000 },
        { name: "Cocoa Powder", qty: 5, unit: "kg", price: 45000 }
      ],
      total: 1075000,
      status: "shipped",
      delivery_date: "2024-01-17",
      payment_status: "paid",
      category: "specialty_ingredients"
    },
    {
      id: "PO-003",
      date: "2024-01-13",
      supplier: "Toko Kemasan Murah",
      contact: "081234567892",
      items: [
        { name: "Kotak Kue 20x20", qty: 100, unit: "pcs", price: 3500 },
        { name: "Plastik Wrapping", qty: 50, unit: "roll", price: 8000 }
      ],
      total: 750000,
      status: "pending",
      delivery_date: "2024-01-18",
      payment_status: "pending",
      category: "packaging"
    },
    {
      id: "PO-004",
      date: "2024-01-12",
      supplier: "Equipment Pro",
      contact: "081234567893",
      items: [
        { name: "Mixer Stand Baru", qty: 1, unit: "unit", price: 2500000 }
      ],
      total: 2500000,
      status: "cancelled",
      delivery_date: "2024-01-20",
      payment_status: "refunded",
      category: "equipment"
    },
    {
      id: "PO-005",
      date: "2024-01-11",
      supplier: "Dairy Farm Supply",
      contact: "081234567894", 
      items: [
        { name: "Mentega Premium", qty: 15, unit: "kg", price: 55000 },
        { name: "Keju Parmesan", qty: 2, unit: "kg", price: 125000 }
      ],
      total: 1075000,
      status: "ordered",
      delivery_date: "2024-01-19",
      payment_status: "partial",
      category: "dairy"
    }
  ]

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", icon: Clock, className: "bg-yellow-100 text-yellow-800" },
      ordered: { label: "Ordered", icon: Package, className: "bg-blue-100 text-blue-800" },
      shipped: { label: "Shipped", icon: Truck, className: "bg-purple-100 text-purple-800" },
      completed: { label: "Received", icon: CheckCircle, className: "bg-green-100 text-green-800" },
      cancelled: { label: "Cancelled", icon: AlertCircle, className: "bg-red-100 text-red-800" }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const IconComponent = config.icon
    
    return (
      <Badge variant="outline" className={config.className}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getPaymentBadge = (status: string) => {
    const paymentConfig = {
      pending: { label: "Belum Bayar", className: "bg-orange-100 text-orange-800" },
      paid: { label: "Lunas", className: "bg-green-100 text-green-800" },
      partial: { label: "DP", className: "bg-yellow-100 text-yellow-800" },
      refunded: { label: "Refund", className: "bg-gray-100 text-gray-800" }
    }
    
    const config = paymentConfig[status as keyof typeof paymentConfig] || paymentConfig.pending
    
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const getCategoryBadge = (category: string) => {
    const categoryConfig = {
      raw_materials: { label: "Bahan Baku", className: "bg-blue-50 text-blue-700" },
      specialty_ingredients: { label: "Bahan Khusus", className: "bg-purple-50 text-purple-700" },
      packaging: { label: "Kemasan", className: "bg-green-50 text-green-700" },
      equipment: { label: "Peralatan", className: "bg-orange-50 text-orange-700" },
      dairy: { label: "Dairy", className: "bg-cyan-50 text-cyan-700" }
    }
    
    const config = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.raw_materials
    
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount)
  }

  const getTotalItems = (items: any[]) => {
    return items.reduce((total, item) => total + item.qty, 0)
  }

  // Statistics
  const totalPurchases = purchases.length
  const completedPurchases = purchases.filter(p => p.status === 'completed').length
  const pendingPurchases = purchases.filter(p => p.status === 'pending' || p.status === 'ordered').length
  const totalSpent = purchases.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.total, 0)
  const uniqueSuppliers = new Set(purchases.map(p => p.supplier)).size

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchases</h1>
          <p className="text-muted-foreground">
            Manage purchase orders and supplier relationships
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Select defaultValue="all">
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="raw_materials">Bahan Baku</SelectItem>
              <SelectItem value="specialty_ingredients">Bahan Khusus</SelectItem>
              <SelectItem value="packaging">Kemasan</SelectItem>
              <SelectItem value="equipment">Peralatan</SelectItem>
              <SelectItem value="dairy">Dairy</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Purchase Order
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total POs</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPurchases}</div>
            <p className="text-xs text-muted-foreground">All purchase orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedPurchases}</div>
            <p className="text-xs text-muted-foreground">Received orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingPurchases}</div>
            <p className="text-xs text-muted-foreground">Awaiting delivery</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(totalSpent)}</div>
            <p className="text-xs text-muted-foreground">Completed orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueSuppliers}</div>
            <p className="text-xs text-muted-foreground">Active suppliers</p>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Purchase Orders</CardTitle>
              <CardDescription>Track and manage all purchase orders</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search purchases..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      <div className="font-medium">{purchase.id}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{purchase.supplier}</div>
                          <div className="text-sm text-muted-foreground">{purchase.contact}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getCategoryBadge(purchase.category)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{getTotalItems(purchase.items)} items</div>
                        <div className="text-muted-foreground">
                          {purchase.items[0]?.name}
                          {purchase.items.length > 1 && ` +${purchase.items.length - 1} more`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {new Date(purchase.date).toLocaleDateString('id-ID')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(purchase.delivery_date).toLocaleDateString('id-ID')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatRupiah(purchase.total)}</div>
                    </TableCell>
                    <TableCell>
                      {getPaymentBadge(purchase.payment_status)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(purchase.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}