// src/components/orders/components/OrdersAddEditPage.tsx - Full Page Order Form with Breadcrumbs

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, Plus, Trash2, User, Phone, Mail, MapPin, FileText, Calculator, ChefHat, Search, Calendar, Info, AlertCircle, Zap, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormField, ActionButtons, StatusBadge, LoadingStates } from '@/components/ui';
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
import { Label } from '@/components/ui/label';
import OrderItemsSection from './dialogs/OrderItemsSection';

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
      filtered = filtered.filter(recipe => (recipe as any).kategoriResep === selectedCategory || (recipe as any).kategori_resep === selectedCategory);
    }
    
    const getName = (r: any) => (r?.namaResep ?? r?.nama_resep ?? r?.nama ?? '').toString();
    return filtered.sort((a, b) => getName(a).localeCompare(getName(b)));
  }, [recipes, recipeSearchTerm, selectedCategory, searchRecipes]);

  // Get unique categories from recipes
  const availableCategories = useMemo(() => {
    return getUniqueCategories();
  }, [getUniqueCategories]);

  // Helper function to detect if recipe uses enhanced HPP calculations
  const getCalculationMethodIndicator = (recipe: Recipe) => {
    const hasEnhancedCalculation = recipe.updatedAt && 
      new Date((recipe as any).updatedAt ?? (recipe as any).updated_at) > new Date('2024-01-01') && 
      ((recipe as any).biayaOverhead ?? (recipe as any).biaya_overhead) % 100 === 0;
    
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
    const pricePerPortion = (recipe as any).hargaJualPorsi 
      ?? (recipe as any).harga_jual_porsi 
      ?? (recipe as any).hppPerPorsi 
      ?? (recipe as any).hpp_per_porsi 
      ?? 0;
    const pcsPerPortion = (recipe as any).jumlahPcsPerPorsi ?? (recipe as any).jumlah_pcs_per_porsi ?? 1;
    const pricePerPiece = (recipe as any).hargaJualPerPcs 
      ?? (recipe as any).harga_jual_per_pcs 
      ?? (pricePerPortion / (pcsPerPortion || 1)) 
      ?? 0;
    const defaultPricingMode = 'per_portion';
    
    const newItem: OrderItem = {
      id: Date.now().toString(),
      name: (recipe as any).namaResep ?? (recipe as any).nama_resep ?? (recipe as any).nama ?? '',
      quantity: 1,
      price: pricePerPortion,
      total: pricePerPortion,
      recipeId: (recipe as any).id,
      recipeCategory: (recipe as any).kategoriResep ?? (recipe as any).kategori_resep,
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
    const rawName = (recipe as any).nama_resep ?? (recipe as any).namaResep ?? (recipe as any).nama ?? '';
    const recipeName = typeof rawName === 'string' && rawName.trim() ? rawName : 'Item';
    toast.success(`${recipeName} ditambahkan ke pesanan`);
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
              <FormField
                type="text"
                name="namaPelanggan"
                label="Nama Pelanggan"
                value={formData.namaPelanggan}
                onChange={(e) => updateField('namaPelanggan', e.target.value)}
                placeholder="Masukkan nama pelanggan"
                icon={User}
                required
              />
              
              <FormField
                type="text"
                name="teleponPelanggan"
                label="Telepon"
                value={formData.teleponPelanggan}
                onChange={(e) => updateField('teleponPelanggan', e.target.value)}
                placeholder="Masukkan nomor telepon"
                icon={Phone}
              />
              
              <FormField
                type="email"
                name="emailPelanggan"
                label="Email"
                value={formData.emailPelanggan}
                onChange={(e) => updateField('emailPelanggan', e.target.value)}
                placeholder="Masukkan email pelanggan"
                icon={Mail}
              />
              
              <FormField
                type="date"
                name="tanggal"
                label="Tanggal Pesanan"
                value={formData.tanggal}
                onChange={(e) => updateField('tanggal', e.target.value)}
                icon={Calendar}
                required
              />
              
              <FormField
                type="select"
                name="status"
                label="Status"
                value={formData.status}
                onChange={(value) => updateField('status', value)}
                options={ORDER_STATUSES.map(status => ({
                  value: status,
                  label: getStatusText(status)
                }))}
                placeholder="Pilih status pesanan"
              />
            </div>
            
            <FormField
              type="textarea"
              name="alamatPengiriman"
              label="Alamat Pengiriman"
              value={formData.alamatPengiriman}
              onChange={(e) => updateField('alamatPengiriman', e.target.value)}
              placeholder="Masukkan alamat lengkap pengiriman"
              rows={3}
              icon={MapPin}
            />
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
            <OrderItemsSection
              items={formData.items as any}
              recipes={recipes as any}
              filteredRecipes={filteredRecipes as any}
              availableCategories={availableCategories as any}
              isRecipeSelectOpen={isRecipeSelectOpen}
              setIsRecipeSelectOpen={setIsRecipeSelectOpen}
              recipeSearchTerm={recipeSearchTerm}
              setRecipeSearchTerm={setRecipeSearchTerm}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              addItemFromRecipe={addItemFromRecipe as any}
              addCustomItem={addCustomItem}
              updateItem={updateItem as any}
              removeItem={removeItem}
              getCalculationMethodIndicator={getCalculationMethodIndicator as any}
            />
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
            <FormField
              type="textarea"
              name="catatan"
              label="Catatan Tambahan"
              value={formData.catatan}
              onChange={(e) => updateField('catatan', e.target.value)}
              placeholder="Catatan atau instruksi khusus untuk pesanan ini"
              rows={3}
              icon={FileText}
              helpText="Opsional: Tambahkan catatan atau instruksi khusus"
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <ActionButtons
          onCancel={handleCancel}
          onSubmit={() => {}} // Form submission handled by form element
          submitText={loading ? 'Menyimpan...' : (isEditMode ? 'Update Pesanan' : 'Buat Pesanan')}
          isLoading={loading}
          disabled={loading || formData.items.length === 0}
          className="pt-6"
        />
      </form>
    </div>
  );
};

export default OrdersAddEditPage;
