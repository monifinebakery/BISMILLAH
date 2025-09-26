import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Label } from "@/components/ui/label"
import {
  Users,
  Search,
  Plus,
  Filter,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Star,
  User,
  Package,
  DollarSign,
  Clock,
  Calendar,
  Heart,
} from "lucide-react"
import { useState } from "react"

interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  address: string
  customer_type: string
  total_orders: number
  total_spent: number
  last_order: string
  status: string
  notes: string
  favorite_products: string[]
  join_date: string
  loyalty_points: number
}

export function SimpleCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: "CUS-001",
      name: "Ibu Sari",
      phone: "081234567890",
      email: "sari@gmail.com",
      address: "Jl. Mangga No. 123, Jakarta Selatan",
      customer_type: "regular",
      total_orders: 15,
      total_spent: 2250000,
      last_order: "2024-01-15",
      status: "active",
      notes: "Suka kue lapis, sering order untuk acara kantor",
      favorite_products: ["Kue Lapis Legit", "Brownies"],
      join_date: "2023-06-15",
      loyalty_points: 225
    },
    {
      id: "CUS-002", 
      name: "Pak Budi",
      phone: "081234567891",
      email: "budi.s@yahoo.com",
      address: "Jl. Kemang Raya No. 456, Jakarta Selatan",
      customer_type: "vip",
      total_orders: 28,
      total_spent: 4200000,
      last_order: "2024-01-14",
      status: "active",
      notes: "Customer VIP, sering order dalam jumlah besar",
      favorite_products: ["Kue Tart", "Cupcakes"],
      join_date: "2023-03-10",
      loyalty_points: 420
    },
    {
      id: "CUS-003",
      name: "Bu Dewi",
      phone: "081234567892", 
      email: "",
      address: "Jl. Cibubur No. 789, Depok",
      customer_type: "regular",
      total_orders: 8,
      total_spent: 960000,
      last_order: "2024-01-10",
      status: "active",
      notes: "Biasanya order untuk ulang tahun anak",
      favorite_products: ["Cupcakes", "Roti Ulang Tahun"],
      join_date: "2023-09-20",
      loyalty_points: 96
    },
    {
      id: "CUS-004",
      name: "Pak Ahmad",
      phone: "081234567893",
      email: "ahmad.123@gmail.com", 
      address: "Jl. Industri No. 321, Tangerang",
      customer_type: "new",
      total_orders: 2,
      total_spent: 300000,
      last_order: "2024-01-05",
      status: "active",
      notes: "Customer baru, berpotensi menjadi regular",
      favorite_products: ["Roti Tawar"],
      join_date: "2024-01-01",
      loyalty_points: 30
    },
    {
      id: "CUS-005",
      name: "Ibu Rina",
      phone: "081234567894",
      email: "rina.w@outlook.com", 
      address: "Jl. Sudirman No. 567, Jakarta Pusat",
      customer_type: "vip",
      total_orders: 22,
      total_spent: 3300000,
      last_order: "2023-12-20",
      status: "inactive",
      notes: "Customer lama, belum order lagi bulan ini",
      favorite_products: ["Kue Lapis Legit", "Brownies", "Cookies"],
      join_date: "2023-01-15",
      loyalty_points: 330
    }
  ])

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: "",
    phone: "",
    email: "",
    address: "",
    customer_type: "new",
    notes: ""
  })

  const getCustomerTypeBadge = (type: string) => {
    const typeConfig = {
      new: { label: "New", className: "bg-blue-50 text-blue-700" },
      regular: { label: "Regular", className: "bg-green-50 text-green-700" },
      vip: { label: "VIP", className: "bg-purple-50 text-purple-700" },
      inactive: { label: "Inactive", className: "bg-gray-50 text-gray-700" }
    }
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.new
    
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    return status === 'active' ? 
      <Badge className="bg-green-100 text-green-800">Active</Badge> : 
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inactive</Badge>
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount)
  }

  const handleAddCustomer = () => {
    const id = `CUS-${String(customers.length + 1).padStart(3, '0')}`
    const customer: Customer = {
      ...newCustomer as Customer,
      id,
      total_orders: 0,
      total_spent: 0,
      last_order: new Date().toISOString().split('T')[0],
      status: 'active',
      favorite_products: [],
      join_date: new Date().toISOString().split('T')[0],
      loyalty_points: 0
    }
    setCustomers([...customers, customer])
    setNewCustomer({
      name: "",
      phone: "",
      email: "",
      address: "",
      customer_type: "new",
      notes: ""
    })
    setIsAddDialogOpen(false)
  }

  const handleEditCustomer = () => {
    if (selectedCustomer) {
      setCustomers(customers.map(c => c.id === selectedCustomer.id ? selectedCustomer : c))
      setIsEditDialogOpen(false)
      setSelectedCustomer(null)
    }
  }

  const handleDeleteCustomer = (id: string) => {
    setCustomers(customers.filter(c => c.id !== id))
  }

  // Statistics
  const activeCustomers = customers.filter(c => c.status === 'active').length
  const vipCustomers = customers.filter(c => c.customer_type === 'vip').length
  const totalSpent = customers.reduce((sum, c) => sum + c.total_spent, 0)
  const avgOrderValue = customers.length > 0 ? totalSpent / customers.reduce((sum, c) => sum + c.total_orders, 0) : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage customer relationships and track order history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Select defaultValue="all">
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Customer Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Add Customer Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>
                  Enter customer details to add them to your customer base
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Customer Name</Label>
                    <Input
                      id="name"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                      placeholder="Phone number"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                      placeholder="Email address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer_type">Customer Type</Label>
                    <Select 
                      value={newCustomer.customer_type} 
                      onValueChange={(value) => setNewCustomer({...newCustomer, customer_type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                    placeholder="Customer address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newCustomer.notes}
                    onChange={(e) => setNewCustomer({...newCustomer, notes: e.target.value})}
                    placeholder="Additional notes about customer"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCustomer}>
                  Add Customer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">Registered customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <User className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCustomers}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VIP Customers</CardTitle>
            <Star className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{vipCustomers}</div>
            <p className="text-xs text-muted-foreground">Premium customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(avgOrderValue)}</div>
            <p className="text-xs text-muted-foreground">Average per order</p>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Customer Directory</CardTitle>
              <CardDescription>Manage all customer information and order history</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Loyalty Points</TableHead>
                  <TableHead>Last Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">{customer.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {customer.phone}
                        </div>
                        {customer.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getCustomerTypeBadge(customer.customer_type)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{customer.total_orders}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatRupiah(customer.total_spent)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3 text-red-500" />
                        <span className="font-medium">{customer.loyalty_points}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {new Date(customer.last_order).toLocaleDateString('id-ID')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(customer.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedCustomer(customer)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteCustomer(customer.id)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Edit Customer Dialog */}
      {selectedCustomer && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
              <DialogDescription>
                Update customer information
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Customer Name</Label>
                  <Input
                    id="edit-name"
                    value={selectedCustomer.name}
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={selectedCustomer.phone}
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    value={selectedCustomer.email}
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-type">Customer Type</Label>
                  <Select 
                    value={selectedCustomer.customer_type} 
                    onValueChange={(value) => setSelectedCustomer({...selectedCustomer, customer_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditCustomer}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}