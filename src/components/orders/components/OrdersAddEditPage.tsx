// src/components/orders/components/OrdersAddEditPage.tsx - Full Page Order Form with Breadcrumbs

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Plus, Trash2, User, Phone, Mail, MapPin, FileText, Calculator, ChefHat, Search, Calendar, Info, AlertCircle, Zap, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Import Breadcrumb components
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// Import Recipe Context and Types
import { useRecipe } from '@/contexts/RecipeContext';
import type { Recipe } from '@/components/recipe/types';

// Import Order Context and Types
import { useOrder } from '../context/OrderContext';
import type { Order, NewOrder, OrderItem } from '../types';
import { ORDER_STATUSES, getStatusText } from '../constants';
import { validateOrderData } from '../utils';

const OrdersAddEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id: orderId } = useParams<{ id: string }>();
  const isEditMode = !!orderId;

  // Order Context
  const { orders, addOrder, updateOrder, loading: ordersLoading } = useOrder();
  
  // Recipe Context
  const { 
    recipes, 
    isLoading: recipesLoading, 
    searchRecipes,
    getUniqueCategories 
  } = useRecipe();

  // Find existing order if in edit mode
  const existingOrder = useMemo(() => {
    if (!isEditMode || !orderId) return null;
    return orders.find(order => order.id === orderId) || null;
  }, [isEditMode, orderId, orders]);

  // Form state with nama kolom 'tanggal' di backend
  const [formData, setFormData] = useState({
    namaPelanggan: '',
    teleponPelanggan: '',
    emailPelanggan: '',
    alamatPengiriman: '',
    status: 'pending' as Order['status'],
    catatan: '',
    items: [] as OrderItem[],
    subtotal: 0,
    pajak: 0,
    totalPesanan: 0,
    isTaxEnabled: false,
    tanggal: new Date().toISOString().split('T')[0],
  });

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEditMode);
  
  // Recipe selector states
  const [isRecipeSelectOpen, setIsRecipeSelectOpen] = useState(false);
  const [recipeSearchTerm, setRecipeSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Initialize form with existing data if edit mode
  useEffect(() => {
    if (isEditMode) {
      if (!existingOrder && !ordersLoading) {
        toast.error('Pesanan tidak ditemukan');
        navigate('/pesanan');
        return;
      }
      
      if (existingOrder) {
        setFormData({
          namaPelanggan: existingOrder.namaPelanggan || '',
          teleponPelanggan: existingOrder.teleponPelanggan || '',
          emailPelanggan: existingOrder.emailPelanggan || '',
          alamatPengiriman: existingOrder.alamatPengiriman || '',
          status: existingOrder.status || 'pending',
          catatan: existingOrder.catatan || '',
          items: existingOrder.items || [],
          subtotal: existingOrder.subtotal || 0,
          pajak: existingOrder.pajak || 0,
          totalPesanan: existingOrder.totalPesanan || 0,
          isTaxEnabled: !!existingOrder.pajak,
          tanggal: existingOrder.tanggal 
            ? new Date(existingOrder.tanggal).toISOString().split('T')[0] 
            : new Date().toISOString().split('T')[0],
        });
        setPageLoading(false);
      }
    } else {
      setPageLoading(false);
    }
  }, [isEditMode, existingOrder, ordersLoading, navigate]);

  // Filter recipes berdasarkan search dan category
  const filteredRecipes = useMemo(() => {
    let filtered = recipes;
    
    if (recipeSearchTerm.trim()) {
      filtered = searchRecipes(recipeSearchTerm);
    }
    
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(recipe => recipe.kategoriResep === selectedCategory);
    }
    
    return filtered.sort((a, b) => a.namaResep.localeCompare(b.namaResep));
  }, [recipes, recipeSearchTerm, selectedCategory, searchRecipes]);

  // Get unique categories from recipes
  const availableCategories = useMemo(() => {
    return getUniqueCategories();
  }, [getUniqueCategories]);

  // Helper function to detect if recipe uses enhanced HPP calculations
  const getCalculationMethodIndicator = (recipe: Recipe) => {
    const hasEnhancedCalculation = recipe.updatedAt && 
      new Date(recipe.updatedAt) > new Date('2024-01-01') && 
      recipe.biayaOverhead && recipe.biayaOverhead % 100 === 0;
    
    return hasEnhancedCalculation ? {
      isEnhanced: true,
      label: 'Enhanced HPP',
      icon: Zap,
      className: 'text-blue-600 bg-blue-50 border-blue-200'
    } : {
      isEnhanced: false,
      label: 'Standard HPP',
      icon: Calculator,
      className: 'text-gray-600 bg-gray-50 border-gray-200'
    };
  };

  // Update form field
  const updateField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Add item from recipe
  const addItemFromRecipe = useCallback((recipe: Recipe) => {
    const pricePerPortion = recipe.hargaJualPorsi || recipe.hppPerPorsi || 0;
    const pricePerPiece = recipe.hargaJualPerPcs || (pricePerPortion / (recipe.jumlahPcsPerPorsi || 1)) || 0;
    const defaultPricingMode = 'per_portion';
    
    const newItem: OrderItem = {
      id: Date.now().toString(),
      name: recipe.namaResep,
      quantity: 1,
      price: pricePerPortion,
      total: pricePerPortion,
      recipeId: recipe.id,
      recipeCategory: recipe.kategoriResep,
      isFromRecipe: true,
      pricingMode: defaultPricingMode,
      pricePerPortion: pricePerPortion,
      pricePerPiece: pricePerPiece,
    };
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    
    setIsRecipeSelectOpen(false);
    toast.success(`${recipe.namaResep} ditambahkan ke pesanan`);
  }, []);

  // Add custom item
  const addCustomItem = useCallback(() => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      name: '',
      quantity: 1,
      price: 0,
      total: 0,
      isFromRecipe: false,
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  }, []);

  // Update item with pricing mode support
  const updateItem = useCallback((itemId: string, field: keyof OrderItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          
          // Handle pricing mode changes
          if (field === 'pricingMode') {
            if (value === 'per_portion' && updatedItem.pricePerPortion) {
              updatedItem.price = updatedItem.pricePerPortion;
            } else if (value === 'per_piece' && updatedItem.pricePerPiece) {
              updatedItem.price = updatedItem.pricePerPiece;
            }
            updatedItem.total = updatedItem.quantity * updatedItem.price;
          }
          // Handle quantity or direct price changes
          else if (field === 'quantity' || field === 'price') {
            updatedItem.total = updatedItem.quantity * updatedItem.price;
          }
          
          return updatedItem;
        }
        return item;
      })
    }));
  }, []);

  // Remove item
  const removeItem = useCallback((itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  }, []);

  // Calculate totals dengan pajak opsional
  useEffect(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
    const pajak = formData.isTaxEnabled ? subtotal * 0.1 : 0;
    const totalPesanan = subtotal + pajak;

    setFormData(prev => ({
      ...prev,
      subtotal,
      pajak,
      totalPesanan
    }));
  }, [formData.items, formData.isTaxEnabled]);

  // Handle navigation
  const handleCancel = useCallback(() => {
    navigate('/pesanan');
  }, [navigate]);

  // Handle submit dengan validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert string date to Date object for validation and submission
    const dataForSubmission = {
      ...formData,
      tanggal: new Date(formData.tanggal)
    };
    
    const validation = validateOrderData(dataForSubmission);
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    setLoading(true);
    
    try {
      let success = false;
      if (isEditMode && orderId) {
        success = await updateOrder(orderId, dataForSubmission);
      } else {
        success = await addOrder(dataForSubmission as NewOrder);
      }

      if (success) {
        toast.success(isEditMode ? 'Pesanan berhasil diperbarui' : 'Pesanan berhasil dibuat');
        navigate('/pesanan');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Gagal menyimpan pesanan');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (pageLoading || ordersLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <p className="text-sm text-gray-600">
              {isEditMode ? 'Memuat data pesanan...' : 'Memuat halaman...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header with Breadcrumb */}
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                  <Home className="h-4 w-4" />
                  Dashboard
                </Button>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Button variant="ghost" size="sm" onClick={() => navigate('/pesanan')}>
                  <FileText className="h-4 w-4" />
                  Pesanan
                </Button>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {isEditMode ? 'Edit Pesanan' : 'Pesanan Baru'}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Title */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline" 
              size="sm"
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-orange-600" />
                </div>
                {isEditMode ? 'Edit Pesanan' : 'Pesanan Baru'}
                {existingOrder && (
                  <Badge className="ml-2 text-xs bg-blue-100 text-blue-800">
                    #{(existingOrder as any).nomor_pesanan || (existingOrder as any).order_number || (existingOrder as any)['nomorPesanan']}
                  </Badge>
                )}
              </h1>
              <p className="text-gray-600 mt-1">
                {isEditMode
                  ? 'Edit detail pesanan dan item'
                  : 'Buat pesanan baru dari pelanggan'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information Card */}
        <Card className="border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-orange-600" />
              Informasi Pelanggan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="namaPelanggan">Nama Pelanggan *</Label>
                <Input
                  id="namaPelanggan"
                  value={formData.namaPelanggan}
                  onChange={(e) => updateField('namaPelanggan', e.target.value)}
                  placeholder="Masukkan nama pelanggan"
                  required
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="teleponPelanggan">Telepon</Label>
                <Input
                  id="teleponPelanggan"
                  value={formData.teleponPelanggan}
                  onChange={(e) => updateField('teleponPelanggan', e.target.value)}
                  placeholder="Masukkan nomor telepon"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="emailPelanggan">Email</Label>
                <Input
                  id="emailPelanggan"
                  type="email"
                  value={formData.emailPelanggan}
                  onChange={(e) => updateField('emailPelanggan', e.target.value)}
                  placeholder="Masukkan email pelanggan"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="tanggal">Tanggal Pesanan *</Label>
                <div className="relative mt-1">
                  <Input
                    id="tanggal"
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => updateField('tanggal', e.target.value)}
                    className="pl-10"
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => updateField('status', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {getStatusText(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="alamatPengiriman">Alamat Pengiriman</Label>
              <Textarea
                id="alamatPengiriman"
                value={formData.alamatPengiriman}
                onChange={(e) => updateField('alamatPengiriman', e.target.value)}
                placeholder="Masukkan alamat lengkap pengiriman"
                rows={3}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Order Items Card */}
        <Card className="border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-orange-600" />
              Item Pesanan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add Items Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Popover open={isRecipeSelectOpen} onOpenChange={setIsRecipeSelectOpen}>
                <PopoverTrigger asChild>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex items-center gap-2 flex-1 sm:flex-none"
                    disabled={recipesLoading}
                  >
                    <ChefHat className="h-4 w-4" />
                    {recipesLoading ? 'Memuat...' : 'Dari Resep'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <Command>
                    <div className="flex items-center border-b px-3">
                      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                      <CommandInput 
                        placeholder="Cari resep..." 
                        value={recipeSearchTerm}
                        onValueChange={setRecipeSearchTerm}
                      />
                    </div>
                    
                    <div className="p-2 border-b">
                      <Select
                        value={selectedCategory}
                        onValueChange={setSelectedCategory}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Semua kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Kategori</SelectItem>
                          {availableCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <CommandEmpty>Tidak ada resep ditemukan</CommandEmpty>
                    
                    <CommandGroup className="max-h-64 overflow-auto">
                      {filteredRecipes.map((recipe) => {
                        const methodIndicator = getCalculationMethodIndicator(recipe);
                        return (
                          <CommandItem
                            key={recipe.id}
                            onSelect={() => addItemFromRecipe(recipe)}
                            className="flex flex-col items-start gap-2 p-3"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-medium">{recipe.namaResep}</span>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${methodIndicator.className}`}
                                >
                                  <methodIndicator.icon className="w-3 h-3 mr-1" />
                                  {methodIndicator.label}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  Rp {recipe.hargaJualPorsi?.toLocaleString('id-ID') || 'N/A'}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 w-full">
                              <span>{recipe.kategoriResep}</span>
                              <span>•</span>
                              <span>{recipe.jumlahPorsi} porsi</span>
                              {recipe.hppPerPorsi > 0 && (
                                <>
                                  <span>•</span>
                                  <span>HPP: Rp {recipe.hppPerPorsi.toLocaleString('id-ID')}</span>
                                </>
                              )}
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>

              <Button 
                type="button" 
                onClick={addCustomItem} 
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 flex-1 sm:flex-none"
              >
                <Plus className="h-4 w-4" />
                Item Manual
              </Button>
            </div>

            {/* Items List */}
            {formData.items.length > 0 ? (
              <div className="space-y-4">
                {formData.items.map((item, index) => {
                  const recipe = item.recipeId ? recipes.find(r => r.id === item.recipeId) : null;
                  const methodIndicator = recipe ? getCalculationMethodIndicator(recipe) : null;
                  
                  return (
                    <div key={item.id} className="p-4 border rounded-lg bg-gray-50 space-y-4">
                      {/* Item Name and Actions */}
                      <div className="flex items-center gap-3">
                        <Input
                          placeholder="Nama menu/item"
                          value={item.name}
                          onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                          disabled={item.isFromRecipe}
                          className={`flex-1 ${item.isFromRecipe ? 'bg-blue-50' : ''}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.isFromRecipe && (
                          <Badge variant="outline" className="text-blue-600 border-blue-200">
                            <ChefHat className="h-3 w-3 mr-1" />
                            Resep
                          </Badge>
                        )}
                        {methodIndicator && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${methodIndicator.className}`}
                          >
                            <methodIndicator.icon className="w-3 h-3 mr-1" />
                            {methodIndicator.label}
                          </Badge>
                        )}
                        {item.recipeCategory && (
                          <Badge variant="secondary" className="text-xs">
                            {item.recipeCategory}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Pricing Mode Selection (only for recipe items) */}
                      {item.isFromRecipe && (item.pricePerPortion || item.pricePerPiece) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <Label className="text-sm font-medium text-blue-900 mb-2 block">
                            💰 Mode Harga Jual
                          </Label>
                          <RadioGroup
                            value={item.pricingMode || 'per_portion'}
                            onValueChange={(value) => updateItem(item.id, 'pricingMode', value)}
                            className="flex flex-col sm:flex-row gap-3"
                          >
                            {item.pricePerPortion && (
                              <div className="flex items-center space-x-2 bg-white p-2 rounded border">
                                <RadioGroupItem value="per_portion" id={`${item.id}-per_portion`} />
                                <Label htmlFor={`${item.id}-per_portion`} className="text-sm flex-1 cursor-pointer">
                                  <div className="font-medium">Per Porsi</div>
                                  <div className="text-xs text-gray-500">
                                    Rp {item.pricePerPortion?.toLocaleString('id-ID')}
                                  </div>
                                </Label>
                              </div>
                            )}
                            {item.pricePerPiece && (
                              <div className="flex items-center space-x-2 bg-white p-2 rounded border">
                                <RadioGroupItem value="per_piece" id={`${item.id}-per_piece`} />
                                <Label htmlFor={`${item.id}-per_piece`} className="text-sm flex-1 cursor-pointer">
                                  <div className="font-medium">Per Pcs</div>
                                  <div className="text-xs text-gray-500">
                                    Rp {item.pricePerPiece?.toLocaleString('id-ID')}
                                  </div>
                                </Label>
                              </div>
                            )}
                          </RadioGroup>
                        </div>
                      )}
                      
                      {/* Quantity, Price, and Total */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <Label className="text-xs text-gray-500 font-medium">Jumlah</Label>
                          <Input
                            type="number"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                            min="1"
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-xs text-gray-500 font-medium">
                            Harga {item.pricingMode === 'per_piece' ? 'Per Pcs' : 'Per Porsi'}
                          </Label>
                          <Input
                            type="number"
                            placeholder="Harga"
                            value={item.price}
                            onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                            min="0"
                            className="mt-1"
                            disabled={item.isFromRecipe}
                          />
                        </div>
                        
                        <div className="col-span-2">
                          <Label className="text-xs text-gray-500 font-medium">Total Harga</Label>
                          <div className="mt-1 p-2 bg-white border rounded-md">
                            <div className="font-semibold text-lg text-green-700">
                              Rp {item.total.toLocaleString('id-ID')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.quantity} × Rp {item.price.toLocaleString('id-ID')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 border rounded-lg bg-gray-50">
                <ChefHat className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="mb-2">Belum ada item dalam pesanan</p>
                <p className="text-sm">Pilih dari resep yang ada atau tambah item manual</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Summary */}
        {formData.items.length > 0 && (
          <Card className="border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Ringkasan Pesanan
                </h3>
                <div className="flex items-center gap-2">
                  <Label htmlFor="taxToggle">Aktifkan Pajak (10%)</Label>
                  <Switch
                    id="taxToggle"
                    checked={formData.isTaxEnabled}
                    onCheckedChange={(checked) => updateField('isTaxEnabled', checked)}
                  />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({formData.items.length} item):</span>
                  <span>Rp {formData.subtotal.toLocaleString('id-ID')}</span>
                </div>
                {formData.isTaxEnabled && (
                  <div className="flex justify-between text-gray-600">
                    <span>Pajak (10%):</span>
                    <span>Rp {formData.pajak.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-xl text-orange-600">
                  <span>Total Pesanan:</span>
                  <span>Rp {formData.totalPesanan.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes Card */}
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div>
              <Label htmlFor="catatan">Catatan Tambahan</Label>
              <Textarea
                id="catatan"
                value={formData.catatan}
                onChange={(e) => updateField('catatan', e.target.value)}
                placeholder="Catatan atau instruksi khusus untuk pesanan ini"
                rows={3}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Batal
          </Button>
          
          <Button
            type="submit"
            disabled={loading || formData.items.length === 0}
            className="bg-orange-500 hover:bg-orange-600 flex-1 sm:flex-none"
          >
            {loading 
              ? 'Menyimpan...' 
              : (isEditMode ? 'Update Pesanan' : 'Buat Pesanan')
            }
          </Button>
        </div>
      </form>
    </div>
  );
};

export default OrdersAddEditPage;
