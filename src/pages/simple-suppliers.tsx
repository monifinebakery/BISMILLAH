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
  Truck,
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
  Building,
  Package,
  DollarSign,
  Clock,
} from "lucide-react"
import { useState } from "react"

interface Supplier {
  id: string
  name: string
  contact_person: string
  phone: string
  email: string
  address: string
  category: string
  rating: number
  total_orders: number
  total_value: number
  last_order: string
  status: string
  payment_terms: string
  notes: string
}

export function SimpleSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    {
      id: "SUP-001",
      name: "CV Toko Bahan Kue",
      contact_person: "Pak Ahmad",
      phone: "081234567890",
      email: "ahmad@tokobahankue.com",
      address: "Jl. Pasar Minggu No. 123, Jakarta Selatan",
      category: "raw_materials",
      rating: 4.8,
      total_orders: 25,
      total_value: 15750000,
      last_order: "2024-01-15",
      status: "active",
      payment_terms: "30 days",
      notes: "Supplier utama untuk tepung dan gula"
    },
    {
      id: "SUP-002", 
      name: "Supplier Coklat Jakarta",
      contact_person: "Ibu Sari",
      phone: "081234567891",
      email: "sari@coklatjakarta.com",
      address: "Jl. Kemang Raya No. 456, Jakarta Selatan",
      category: "specialty_ingredients",
      rating: 4.5,
      total_orders: 12,
      total_value: 8950000,
      last_order: "2024-01-14",
      status: "active",
      payment_terms: "14 days",
      notes: "Kualitas coklat sangat baik"
    },
    {
      id: "SUP-003",
      name: "Toko Kemasan Murah",
      contact_person: "Pak Budi",
      phone: "081234567892", 
      email: "budi@kemasanmurah.com",
      address: "Jl. Cibubur No. 789, Depok",
      category: "packaging",
      rating: 4.2,
      total_orders: 8,
      total_value: 3200000,
      last_order: "2024-01-10",
      status: "active",
      payment_terms: "Cash",
      notes: "Harga kompetitif untuk kemasan"
    },
    {
      id: "SUP-004",
      name: "Equipment Pro",
      contact_person: "Bu Dewi",
      phone: "081234567893",
      email: "dewi@equipmentpro.com", 
      address: "Jl. Industri No. 321, Tangerang",
      category: "equipment",
      rating: 4.9,
      total_orders: 3,
      total_value: 12500000,
      last_order: "2024-01-05",
      status: "inactive",
      payment_terms: "COD",
      notes: "Peralatan berkualitas tinggi"
    }
  ])

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    category: "raw_materials",
    payment_terms: "30 days",
    notes: ""
  })

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

  const getStatusBadge = (status: string) => {
    return status === 'active' ? 
      <Badge className="bg-green-100 text-green-800">Active</Badge> : 
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inactive</Badge>
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

  const handleAddSupplier = () => {
    const id = `SUP-${String(suppliers.length + 1).padStart(3, '0')}`
    const supplier: Supplier = {
      ...newSupplier as Supplier,
      id,
      rating: 0,
      total_orders: 0,
      total_value: 0,
      last_order: new Date().toISOString().split('T')[0],
      status: 'active'
    }
    setSuppliers([...suppliers, supplier])
    setNewSupplier({
      name: "",
      contact_person: "",
      phone: "",
      email: "",
      address: "",
      category: "raw_materials",
      payment_terms: "30 days",
      notes: ""
    })
    setIsAddDialogOpen(false)
  }

  const handleEditSupplier = () => {
    if (selectedSupplier) {
      setSuppliers(suppliers.map(s => s.id === selectedSupplier.id ? selectedSupplier : s))
      setIsEditDialogOpen(false)
      setSelectedSupplier(null)
    }
  }

  const handleDeleteSupplier = (id: string) => {
    setSuppliers(suppliers.filter(s => s.id !== id))
  }

  // Statistics
  const activeSuppliers = suppliers.filter(s => s.status === 'active').length
  const totalValue = suppliers.reduce((sum, s) => sum + s.total_value, 0)
  const avgRating = suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground">
            Manage supplier relationships and vendor information
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
            </SelectContent>
          </Select>
          
          {/* Add Supplier Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Supplier</DialogTitle>
                <DialogDescription>
                  Enter supplier details to add them to your vendor list
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Supplier Name</Label>
                    <Input
                      id="name"
                      value={newSupplier.name}
                      onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                      placeholder="Enter supplier name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_person">Contact Person</Label>
                    <Input
                      id="contact_person"
                      value={newSupplier.contact_person}
                      onChange={(e) => setNewSupplier({...newSupplier, contact_person: e.target.value})}
                      placeholder="Contact person name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newSupplier.phone}
                      onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
                      placeholder="Phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newSupplier.email}
                      onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}
                      placeholder="Email address"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}
                    placeholder="Full address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={newSupplier.category} 
                      onValueChange={(value) => setNewSupplier({...newSupplier, category: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="raw_materials">Bahan Baku</SelectItem>
                        <SelectItem value="specialty_ingredients">Bahan Khusus</SelectItem>
                        <SelectItem value="packaging">Kemasan</SelectItem>
                        <SelectItem value="equipment">Peralatan</SelectItem>
                        <SelectItem value="dairy">Dairy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment_terms">Payment Terms</Label>
                    <Select 
                      value={newSupplier.payment_terms} 
                      onValueChange={(value) => setNewSupplier({...newSupplier, payment_terms: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="COD">COD</SelectItem>
                        <SelectItem value="14 days">14 Days</SelectItem>
                        <SelectItem value="30 days">30 Days</SelectItem>
                        <SelectItem value="60 days">60 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newSupplier.notes}
                    onChange={(e) => setNewSupplier({...newSupplier, notes: e.target.value})}
                    placeholder="Additional notes about supplier"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSupplier}>
                  Add Supplier
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
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
            <p className="text-xs text-muted-foreground">Registered vendors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            <Truck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeSuppliers}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(totalValue)}</div>
            <p className="text-xs text-muted-foreground">Total purchase value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Supplier quality rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Supplier Directory</CardTitle>
              <CardDescription>Manage all supplier information and relationships</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search suppliers..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Last Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <Building className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{supplier.name}</div>
                          <div className="text-sm text-muted-foreground">{supplier.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {supplier.phone}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {supplier.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getCategoryBadge(supplier.category)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getRatingStars(supplier.rating)}
                        <span className="text-sm ml-1">{supplier.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{supplier.total_orders}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatRupiah(supplier.total_value)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {new Date(supplier.last_order).toLocaleDateString('id-ID')}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(supplier.status)}
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
                            setSelectedSupplier(supplier)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteSupplier(supplier.id)}
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

      {/* Edit Supplier Dialog */}
      {selectedSupplier && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Supplier</DialogTitle>
              <DialogDescription>
                Update supplier information
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Supplier Name</Label>
                  <Input
                    id="edit-name"
                    value={selectedSupplier.name}
                    onChange={(e) => setSelectedSupplier({...selectedSupplier, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-contact">Contact Person</Label>
                  <Input
                    id="edit-contact"
                    value={selectedSupplier.contact_person}
                    onChange={(e) => setSelectedSupplier({...selectedSupplier, contact_person: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={selectedSupplier.phone}
                    onChange={(e) => setSelectedSupplier({...selectedSupplier, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    value={selectedSupplier.email}
                    onChange={(e) => setSelectedSupplier({...selectedSupplier, email: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditSupplier}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}