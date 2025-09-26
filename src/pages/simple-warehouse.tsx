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
  Package,
  Search,
  Plus,
  AlertTriangle,
  Filter,
} from "lucide-react"

export function SimpleWarehouse() {
  const warehouseItems = [
    {
      id: 1,
      nama: "Tepung Terigu",
      kategori: "Baking",
      stok: 25,
      satuan: "kg",
      minimum: 10,
      harga_rata_rata: 15000,
      supplier: "ABC Supplier",
      status: "normal"
    },
    {
      id: 2,
      nama: "Gula Pasir",
      kategori: "Baking", 
      stok: 8,
      satuan: "kg",
      minimum: 15,
      harga_rata_rata: 12000,
      supplier: "XYZ Supplier",
      status: "low"
    },
    {
      id: 3,
      nama: "Telur Ayam",
      kategori: "Dairy",
      stok: 50,
      satuan: "butir",
      minimum: 20,
      harga_rata_rata: 2500,
      supplier: "Farm Fresh",
      status: "normal"
    },
    {
      id: 4,
      nama: "Mentega",
      kategori: "Dairy",
      stok: 3,
      satuan: "kg", 
      minimum: 5,
      harga_rata_rata: 45000,
      supplier: "Dairy Co",
      status: "critical"
    },
  ]

  const getStatusBadge = (status: string, stok: number, minimum: number) => {
    if (stok <= minimum / 2) {
      return <Badge variant="destructive">Critical</Badge>
    } else if (stok <= minimum) {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Low Stock</Badge>
    }
    return <Badge variant="outline" className="bg-green-50 text-green-800">Normal</Badge>
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Warehouse</h1>
          <p className="text-muted-foreground">
            Manage your inventory and stock levels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warehouseItems.length}</div>
            <p className="text-xs text-muted-foreground">Active inventory items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {warehouseItems.filter(item => item.stok <= item.minimum).length}
            </div>
            <p className="text-xs text-muted-foreground">Items need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatRupiah(
                warehouseItems.reduce((total, item) => total + (item.stok * item.harga_rata_rata), 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">Current inventory value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(warehouseItems.map(item => item.kategori)).size}
            </div>
            <p className="text-xs text-muted-foreground">Product categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>Manage your warehouse inventory</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Items Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouseItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.nama}</div>
                        <div className="text-sm text-muted-foreground">
                          Min: {item.minimum} {item.satuan}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.kategori}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {item.stok} {item.satuan}
                      </div>
                    </TableCell>
                    <TableCell>{formatRupiah(item.harga_rata_rata)}</TableCell>
                    <TableCell className="font-medium">
                      {formatRupiah(item.stok * item.harga_rata_rata)}
                    </TableCell>
                    <TableCell className="text-sm">{item.supplier}</TableCell>
                    <TableCell>
                      {getStatusBadge(item.status, item.stok, item.minimum)}
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