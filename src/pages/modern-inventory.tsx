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
  Package,
  Search,
  Plus,
  Filter,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Box,
  Layers,
  DollarSign,
  Calendar,
  Zap,
  Archive,
} from "lucide-react"
import { useState } from "react"
import { motion } from "framer-motion"

interface InventoryItem {
  id: string
  name: string
  category: string
  unit: string
  current_stock: number
  min_stock: number
  max_stock: number
  unit_price: number
  total_value: number
  supplier: string
  location: string
  expiry_date?: string
  status: string
  last_updated: string
  notes: string
}

export function ModernInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([
    {
      id: "INV-001",
      name: "Tepung Terigu Premium",
      category: "raw_materials",
      unit: "kg",
      current_stock: 150,
      min_stock: 50,
      max_stock: 500,
      unit_price: 12000,
      total_value: 1800000,
      supplier: "CV Toko Bahan Kue",
      location: "Gudang A - Rak 1",
      expiry_date: "2024-06-15",
      status: "good",
      last_updated: "2024-01-15",
      notes: "Kualitas premium untuk roti dan kue"
    },
    {
      id: "INV-002",
      name: "Coklat Bubuk",
      category: "specialty_ingredients",
      unit: "kg",
      current_stock: 25,
      min_stock: 30,
      max_stock: 100,
      unit_price: 85000,
      total_value: 2125000,
      supplier: "Supplier Coklat Jakarta",
      location: "Gudang A - Rak 2",
      expiry_date: "2024-12-20",
      status: "low",
      last_updated: "2024-01-14",
      notes: "Perlu restock segera, stok hampir habis"
    },
    {
      id: "INV-003",
      name: "Kemasan Box Kue",
      category: "packaging",
      unit: "pcs",
      current_stock: 500,
      min_stock: 100,
      max_stock: 1000,
      unit_price: 2500,
      total_value: 1250000,
      supplier: "Toko Kemasan Murah",
      location: "Gudang B - Rak 1",
      status: "good",
      last_updated: "2024-01-12",
      notes: "Kemasan berkualitas untuk produk premium"
    },
    {
      id: "INV-004",
      name: "Mixer Stand KitchenAid",
      category: "equipment",
      unit: "unit",
      current_stock: 2,
      min_stock: 1,
      max_stock: 5,
      unit_price: 4500000,
      total_value: 9000000,
      supplier: "Equipment Pro",
      location: "Area Produksi",
      status: "good",
      last_updated: "2024-01-10",
      notes: "Peralatan utama untuk produksi cake"
    },
    {
      id: "INV-005",
      name: "Susu Bubuk Full Cream",
      category: "dairy",
      unit: "kg",
      current_stock: 10,
      min_stock: 15,
      max_stock: 80,
      unit_price: 45000,
      total_value: 450000,
      supplier: "Dairy Fresh Indonesia",
      location: "Gudang A - Rak 3",
      expiry_date: "2024-03-15",
      status: "critical",
      last_updated: "2024-01-13",
      notes: "Stok kritis! Segera lakukan pembelian"
    }
  ])

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: "",
    category: "raw_materials",
    unit: "kg",
    current_stock: 0,
    min_stock: 0,
    max_stock: 0,
    unit_price: 0,
    supplier: "",
    location: "",
    notes: ""
  })

  const getCategoryBadge = (category: string) => {
    const categoryConfig = {
      raw_materials: { label: "Raw Materials", className: "bg-blue-50 text-blue-700 border-blue-200", icon: Box },
      specialty_ingredients: { label: "Specialty", className: "bg-purple-50 text-purple-700 border-purple-200", icon: Zap },
      packaging: { label: "Packaging", className: "bg-green-50 text-green-700 border-green-200", icon: Package },
      equipment: { label: "Equipment", className: "bg-orange-50 text-orange-700 border-orange-200", icon: Archive },
      dairy: { label: "Dairy", className: "bg-cyan-50 text-cyan-700 border-cyan-200", icon: Layers }
    }
    
    const config = categoryConfig[category as keyof typeof categoryConfig] || categoryConfig.raw_materials
    
    return (
      <Badge variant="outline" className={config.className}>
        <config.icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getStatusBadge = (item: InventoryItem) => {
    let status = 'good'
    let config = { 
      label: 'Good', 
      className: "bg-green-50 text-green-700 border-green-200",
      icon: CheckCircle
    }

    if (item.current_stock <= 0) {
      status = 'out_of_stock'
      config = { 
        label: 'Out of Stock', 
        className: "bg-red-50 text-red-700 border-red-200",
        icon: XCircle
      }
    } else if (item.current_stock <= item.min_stock * 0.5) {
      status = 'critical'
      config = { 
        label: 'Critical', 
        className: "bg-red-50 text-red-700 border-red-200",
        icon: AlertTriangle
      }
    } else if (item.current_stock <= item.min_stock) {
      status = 'low'
      config = { 
        label: 'Low Stock', 
        className: "bg-yellow-50 text-yellow-700 border-yellow-200",
        icon: AlertTriangle
      }
    }

    return (
      <Badge variant="outline" className={config.className}>
        <config.icon className="w-3 h-3 mr-1" />
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

  const getStockIndicator = (current: number, min: number, max: number) => {
    const percentage = (current / max) * 100
    let color = "bg-green-500"
    
    if (current <= 0) color = "bg-red-500"
    else if (current <= min * 0.5) color = "bg-red-500"
    else if (current <= min) color = "bg-yellow-500"
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    )
  }

  const handleAddItem = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const id = `INV-${String(inventory.length + 1).padStart(3, '0')}`
    const item: InventoryItem = {
      ...newItem as InventoryItem,
      id,
      total_value: (newItem.current_stock || 0) * (newItem.unit_price || 0),
      status: 'good',
      last_updated: new Date().toISOString().split('T')[0]
    }
    setInventory([...inventory, item])
    setNewItem({
      name: "",
      category: "raw_materials",
      unit: "kg",
      current_stock: 0,
      min_stock: 0,
      max_stock: 0,
      unit_price: 0,
      supplier: "",
      location: "",
      notes: ""
    })
    setIsAddDialogOpen(false)
    setIsLoading(false)
  }

  const handleEditItem = async () => {
    if (selectedItem) {
      setIsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const updatedItem = {
        ...selectedItem,
        total_value: selectedItem.current_stock * selectedItem.unit_price,
        last_updated: new Date().toISOString().split('T')[0]
      }
      
      setInventory(inventory.map(item => item.id === selectedItem.id ? updatedItem : item))
      setIsEditDialogOpen(false)
      setSelectedItem(null)
      setIsLoading(false)
    }
  }

  const handleDeleteItem = (id: string) => {
    setInventory(inventory.filter(item => item.id !== id))
  }

  // Filter inventory
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
    
    let matchesStatus = true
    if (statusFilter !== "all") {
      const itemStatus = item.current_stock <= 0 ? 'out_of_stock' :
                        item.current_stock <= item.min_stock * 0.5 ? 'critical' :
                        item.current_stock <= item.min_stock ? 'low' : 'good'
      matchesStatus = itemStatus === statusFilter
    }
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Statistics
  const totalItems = inventory.length
  const totalValue = inventory.reduce((sum, item) => sum + item.total_value, 0)
  const lowStockItems = inventory.filter(item => item.current_stock <= item.min_stock).length
  const outOfStockItems = inventory.filter(item => item.current_stock <= 0).length

  const stats = [
    {
      title: "Total Items",
      value: totalItems.toString(),
      change: "+3.2%",
      changeType: "increase" as const,
      icon: Package,
      description: "Items in inventory",
    },
    {
      title: "Total Value",
      value: formatRupiah(totalValue),
      change: "+8.1%",
      changeType: "increase" as const,
      icon: DollarSign,
      description: "Inventory value",
    },
    {
      title: "Low Stock",
      value: lowStockItems.toString(),
      change: "-2.5%",
      changeType: "decrease" as const,
      icon: AlertTriangle,
      description: "Need restock",
    },
    {
      title: "Out of Stock",
      value: outOfStockItems.toString(),
      change: "0%",
      changeType: "increase" as const,
      icon: XCircle,
      description: "Requires immediate action",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <AnimatedContainer variant="slideUp" className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Track stock levels, manage items, and monitor inventory health
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AnimatedButton variant="outline" delay={0.2}>
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </AnimatedButton>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="raw_materials">Raw Materials</SelectItem>
              <SelectItem value="specialty_ingredients">Specialty</SelectItem>
              <SelectItem value="packaging">Packaging</SelectItem>
              <SelectItem value="equipment">Equipment</SelectItem>
              <SelectItem value="dairy">Dairy</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Add Item Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <AnimatedButton delay={0.4}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </AnimatedButton>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Inventory Item</DialogTitle>
                <DialogDescription>
                  Enter item details to add to your inventory
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Item Name</Label>
                    <Input
                      id="name"
                      value={newItem.name}
                      onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                      placeholder="Enter item name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={newItem.category} 
                      onValueChange={(value) => setNewItem({...newItem, category: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="raw_materials">Raw Materials</SelectItem>
                        <SelectItem value="specialty_ingredients">Specialty Ingredients</SelectItem>
                        <SelectItem value="packaging">Packaging</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="dairy">Dairy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select 
                      value={newItem.unit} 
                      onValueChange={(value) => setNewItem({...newItem, unit: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kilogram (kg)</SelectItem>
                        <SelectItem value="g">Gram (g)</SelectItem>
                        <SelectItem value="ltr">Liter (ltr)</SelectItem>
                        <SelectItem value="ml">Milliliter (ml)</SelectItem>
                        <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                        <SelectItem value="unit">Unit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="current_stock">Current Stock</Label>
                    <Input
                      id="current_stock"
                      type="number"
                      value={newItem.current_stock}
                      onChange={(e) => setNewItem({...newItem, current_stock: parseInt(e.target.value) || 0})}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit_price">Unit Price</Label>
                    <Input
                      id="unit_price"
                      type="number"
                      value={newItem.unit_price}
                      onChange={(e) => setNewItem({...newItem, unit_price: parseInt(e.target.value) || 0})}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min_stock">Min Stock</Label>
                    <Input
                      id="min_stock"
                      type="number"
                      value={newItem.min_stock}
                      onChange={(e) => setNewItem({...newItem, min_stock: parseInt(e.target.value) || 0})}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_stock">Max Stock</Label>
                    <Input
                      id="max_stock"
                      type="number"
                      value={newItem.max_stock}
                      onChange={(e) => setNewItem({...newItem, max_stock: parseInt(e.target.value) || 0})}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      value={newItem.supplier}
                      onChange={(e) => setNewItem({...newItem, supplier: e.target.value})}
                      placeholder="Supplier name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Storage Location</Label>
                    <Input
                      id="location"
                      value={newItem.location}
                      onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                      placeholder="Storage location"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newItem.notes}
                    onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
                    placeholder="Additional notes"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <LoadingButton 
                  loading={isLoading} 
                  onClick={handleAddItem}
                >
                  Add Item
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

      {/* Inventory Table */}
      <HoverCard>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Inventory Items</CardTitle>
              <CardDescription>Monitor stock levels and manage your inventory</CardDescription>
            </div>
            <Badge variant="secondary" className="ml-auto">
              {filteredInventory.length} items
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search inventory..."
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
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <StaggeredContainer>
                  {filteredInventory.map((item, index) => (
                    <motion.tr 
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group hover:bg-accent/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <motion.div 
                            className="h-10 w-10 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center text-white font-medium"
                            whileHover={{ scale: 1.1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          >
                            {item.name.charAt(0)}
                          </motion.div>
                          <div>
                            <div className="font-medium group-hover:text-primary transition-colors">{item.name}</div>
                            <div className="text-sm text-muted-foreground">{item.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getCategoryBadge(item.category)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{item.current_stock} {item.unit}</span>
                            <span className="text-muted-foreground">/ {item.max_stock}</span>
                          </div>
                          {getStockIndicator(item.current_stock, item.min_stock, item.max_stock)}
                          <div className="text-xs text-muted-foreground">
                            Min: {item.min_stock} {item.unit}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatRupiah(item.unit_price)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatRupiah(item.total_value)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{item.supplier}</div>
                        <div className="text-xs text-muted-foreground">{item.location}</div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item)}
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
                              setSelectedItem(item)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </AnimatedButton>
                          <AnimatedButton 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
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

          {filteredInventory.length === 0 && (
            <AnimatedContainer variant="slideUp" className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No inventory items found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
            </AnimatedContainer>
          )}
        </CardContent>
      </HoverCard>

      {/* Edit Item Dialog */}
      {selectedItem && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Inventory Item</DialogTitle>
              <DialogDescription>
                Update item information
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Item Name</Label>
                  <Input
                    id="edit-name"
                    value={selectedItem.name}
                    onChange={(e) => setSelectedItem({...selectedItem, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select 
                    value={selectedItem.category} 
                    onValueChange={(value) => setSelectedItem({...selectedItem, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="raw_materials">Raw Materials</SelectItem>
                      <SelectItem value="specialty_ingredients">Specialty Ingredients</SelectItem>
                      <SelectItem value="packaging">Packaging</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="dairy">Dairy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-current-stock">Current Stock</Label>
                  <Input
                    id="edit-current-stock"
                    type="number"
                    value={selectedItem.current_stock}
                    onChange={(e) => setSelectedItem({...selectedItem, current_stock: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-min-stock">Min Stock</Label>
                  <Input
                    id="edit-min-stock"
                    type="number"
                    value={selectedItem.min_stock}
                    onChange={(e) => setSelectedItem({...selectedItem, min_stock: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-unit-price">Unit Price</Label>
                  <Input
                    id="edit-unit-price"
                    type="number"
                    value={selectedItem.unit_price}
                    onChange={(e) => setSelectedItem({...selectedItem, unit_price: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <LoadingButton 
                loading={isLoading}
                onClick={handleEditItem}
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