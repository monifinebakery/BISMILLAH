import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { AnimatedContainer, StaggeredContainer } from "@/components/ui/animated-container"
import { AnimatedButton, LoadingButton } from "@/components/ui/animated-button"
import { AnimatedGrid, HoverCard, StatsCard } from "@/components/ui/animated-card"
import { Button } from "@/components/ui/button"
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
  ShoppingCart,
  DollarSign,
  Clock,
  TrendingUp,
  UserCheck,
  ChevronRight,
  Calendar,
  Award,
} from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address: string
  type: string
  total_orders: number
  total_spent: number
  last_order: string
  status: string
  loyalty_points: number
  join_date: string
  notes: string
  rating: number
}

export function ModernCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: "CUST-001",
      name: "Sari Bakery",
      email: "owner@saribakery.com",
      phone: "081234567890",
      address: "Jl. Kemang Raya No. 123, Jakarta Selatan",
      type: "business",
      total_orders: 45,
      total_spent: 25750000,
      last_order: "2024-01-15",
      status: "active",
      loyalty_points: 2575,
      join_date: "2023-06-15",
      notes: "Pelanggan VIP, selalu order dalam jumlah besar",
      rating: 4.9
    },
    {
      id: "CUST-002",
      name: "Budi Hartono",
      email: "budi.hartono@gmail.com",
      phone: "081234567891",
      address: "Jl. Merdeka No. 456, Bandung",
      type: "individual",
      total_orders: 12,
      total_spent: 3200000,
      last_order: "2024-01-10",
      status: "active",
      loyalty_points: 320,
      join_date: "2023-11-20",
      notes: "Suka produk premium, pembayaran selalu tepat waktu",
      rating: 4.7
    },
    {
      id: "CUST-003",
      name: "Toko Roti Mawar",
      email: "info@rotimawar.co.id",
      phone: "081234567892",
      address: "Jl. Diponegoro No. 789, Surabaya",
      type: "business",
      total_orders: 28,
      total_spent: 18950000,
      last_order: "2024-01-12",
      status: "active",
      loyalty_points: 1895,
      join_date: "2023-08-10",
      notes: "Rutin order setiap minggu, sangat terpercaya",
      rating: 4.8
    },
    {
      id: "CUST-004",
      name: "Maya Sari",
      email: "maya.sari@yahoo.com",
      phone: "081234567893",
      address: "Jl. Sudirman No. 321, Medan",
      type: "individual",
      total_orders: 8,
      total_spent: 1500000,
      last_order: "2023-12-20",
      status: "inactive",
      loyalty_points: 150,
      join_date: "2023-09-05",
      notes: "Pelanggan seasonal, biasanya order saat ada event",
      rating: 4.3
    }
  ])

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: "",
    email: "",
    phone: "",
    address: "",
    type: "individual",
    notes: ""
  })

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      business: { label: "Business", className: "bg-blue-50 text-blue-700 border-blue-200" },
      individual: { label: "Individual", className: "bg-green-50 text-green-700 border-green-200" },
    }
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.individual
    
    return (
      <Badge variant="outline" className={config.className}>
        <ShoppingCart className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    return status === 'active' ? 
      <Badge className="bg-green-50 text-green-700 border-green-200">
        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
        Active
      </Badge> : 
      <Badge variant="secondary" className="bg-gray-50 text-gray-600 border-gray-200">
        <div className="w-2 h-2 bg-gray-400 rounded-full mr-1"></div>
        Inactive
      </Badge>
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-3 w-3 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
      />
    ))
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount)
  }

  const handleAddCustomer = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const id = `CUST-${String(customers.length + 1).padStart(3, '0')}`
    const customer: Customer = {
      ...newCustomer as Customer,
      id,
      total_orders: 0,
      total_spent: 0,
      loyalty_points: 0,
      last_order: new Date().toISOString().split('T')[0],
      join_date: new Date().toISOString().split('T')[0],
      status: 'active',
      rating: 5.0
    }
    setCustomers([...customers, customer])
    setNewCustomer({
      name: "",
      email: "",
      phone: "",
      address: "",
      type: "individual",
      notes: ""
    })
    setIsAddDialogOpen(false)
    setIsLoading(false)
  }

  const handleEditCustomer = async () => {
    if (selectedCustomer) {
      setIsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setCustomers(customers.map(c => c.id === selectedCustomer.id ? selectedCustomer : c))
      setIsEditDialogOpen(false)
      setSelectedCustomer(null)
      setIsLoading(false)
    }
  }

  const handleDeleteCustomer = (id: string) => {
    setCustomers(customers.filter(c => c.id !== id))
  }

  // Filter customers
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || customer.type === typeFilter
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  // Statistics
  const activeCustomers = customers.filter(c => c.status === 'active').length
  const totalSpent = customers.reduce((sum, c) => sum + c.total_spent, 0)
  const avgOrderValue = customers.length > 0 ? totalSpent / customers.reduce((sum, c) => sum + c.total_orders, 0) : 0
  const totalLoyaltyPoints = customers.reduce((sum, c) => sum + c.loyalty_points, 0)

  const stats = [
    {
      title: "Total Customers",
      value: customers.length.toString(),
      change: "+5.2%",
      changeType: "increase" as const,
      icon: Users,
      description: "Registered customers",
    },
    {
      title: "Active Customers",
      value: activeCustomers.toString(),
      change: "+2.8%",
      changeType: "increase" as const,
      icon: UserCheck,
      description: "Currently active",
    },
    {
      title: "Total Revenue",
      value: formatRupiah(totalSpent),
      change: "+18.5%",
      changeType: "increase" as const,
      icon: DollarSign,
      description: "From all customers",
    },
    {
      title: "Avg Order Value",
      value: formatRupiah(avgOrderValue),
      change: "+3.2%",
      changeType: "increase" as const,
      icon: TrendingUp,
      description: "Per order average",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <AnimatedContainer variant="slideUp" className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage customer relationships and order history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AnimatedButton variant="outline" delay={0.2}>
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </AnimatedButton>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="individual">Individual</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Add Customer Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <AnimatedButton delay={0.4}>
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </AnimatedButton>
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
                    <Label htmlFor="type">Customer Type</Label>
                    <Select 
                      value={newCustomer.type} 
                      onValueChange={(value) => setNewCustomer({...newCustomer, type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                      placeholder="Phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                      placeholder="Email address"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                    placeholder="Full address"
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
                <LoadingButton 
                  loading={isLoading} 
                  onClick={handleAddCustomer}
                >
                  Add Customer
                </LoadingButton>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </AnimatedContainer>

      {/* Stats Cards */}
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

      {/* Customers Table */}
      <HoverCard>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Customer Directory</CardTitle>
              <CardDescription>Manage all customer information and order history</CardDescription>
            </div>
            <Badge variant="secondary" className="ml-auto">
              {filteredCustomers.length} customers
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
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
                <StaggeredContainer>
                  {filteredCustomers.map((customer, index) => (
                    <motion.tr 
                      key={customer.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group hover:bg-accent/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <motion.div 
                            className="h-10 w-10 rounded-lg bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center text-white font-medium"
                            whileHover={{ scale: 1.1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          >
                            {customer.name.charAt(0)}
                          </motion.div>
                          <div>
                            <div className="font-medium group-hover:text-primary transition-colors">{customer.name}</div>
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
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getTypeBadge(customer.type)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{customer.total_orders}</div>
                          <div className="flex items-center gap-1">
                            {getRatingStars(customer.rating)}
                            <span className="text-xs ml-1">{customer.rating}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatRupiah(customer.total_spent)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Award className="h-3 w-3 text-yellow-500" />
                          <span className="font-medium">{customer.loyalty_points.toLocaleString()}</span>
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
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <AnimatedButton variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </AnimatedButton>
                          <AnimatedButton 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedCustomer(customer)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </AnimatedButton>
                          <AnimatedButton 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteCustomer(customer.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </AnimatedButton>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </StaggeredContainer>
              </TableBody>
            </Table>
          </div>

          {filteredCustomers.length === 0 && (
            <AnimatedContainer variant="slideUp" className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No customers found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
            </AnimatedContainer>
          )}
        </CardContent>
      </HoverCard>

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
                  <Label htmlFor="edit-type">Customer Type</Label>
                  <Select 
                    value={selectedCustomer.type} 
                    onValueChange={(value) => setSelectedCustomer({...selectedCustomer, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={selectedCustomer.phone}
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    value={selectedCustomer.email}
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Textarea
                  id="edit-address"
                  value={selectedCustomer.address}
                  onChange={(e) => setSelectedCustomer({...selectedCustomer, address: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={selectedCustomer.notes}
                  onChange={(e) => setSelectedCustomer({...selectedCustomer, notes: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <LoadingButton 
                loading={isLoading}
                onClick={handleEditCustomer}
              >
                Save Changes
              </LoadingButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}