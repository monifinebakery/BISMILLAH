import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, User, Phone, Mail, MapPin, FileText, Calculator, ChefHat, Search, Calendar, Info, AlertCircle, Zap } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Import Recipe Context dan Types
import { useRecipe } from '@/contexts/RecipeContext';
import type { Recipe } from '@/components/recipe/types';

// Import Order Types
import type { Order, NewOrder, OrderItem } from '../../types';
import { ORDER_STATUSES, getStatusText } from '../../constants';
import { validateOrderData } from '../../utils';

interface OrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Order> | Partial<NewOrder>) => void;
  initialData?: Order | null;
}

const OrderForm: React.FC<OrderFormProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData
}) => {
  const isEditMode = !!initialData;
  
  // Recipe Context
  const { 
    recipes, 
    isLoading: recipesLoading, 
    searchRecipes,
    getUniqueCategories 
  } = useRecipe();

  // Form state (dialog-local, mapped to NewOrder shape on submit)
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    alamatPengiriman: '',
    status: 'pending' as Order['status'],
    catatan: '',
    items: [] as OrderItem[],
    subtotal: 0,
    diskonPromo: 0,
    totalSetelahDiskon: 0,
    pajak: 0,
    totalAmount: 0,
    isTaxEnabled: false,
    usePromo: false,
    promoId: '',
    promoCode: '',
    promoType: '',
    tanggal: new Date().toISOString().split('T')[0], // Changed from tanggalPesanan to tanggal
  });

  const [loading, setLoading] = useState(false);
  
  // Recipe selector states
  const [isRecipeSelectOpen, setIsRecipeSelectOpen] = useState(false);
  const [recipeSearchTerm, setRecipeSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Helper: normalize Indonesian phone number inputs to match validation
  const normalizePhoneNumber = (raw: string): string => {
    if (!raw) return '';
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    // If starts with 62 (and not already with +), format as +62...
    if (digits.startsWith('62')) {
      return `+${digits}`; // +62XXXXXXXXXX
    }
    // If starts with 8 (common mobile shorthand), prefix 0
    if (digits.startsWith('8')) {
      return `0${digits}`; // 08XXXXXXXXX
    }
    // If already starts with 0, keep as is
    if (digits.startsWith('0')) {
      return digits;
    }
    // Fallback: return digits (will likely fail validation and show error)
    return digits;
  };

  // Initialize form dengan data existing jika edit mode
  useEffect(() => {
    if (initialData) {
      setFormData({
        customerName: (initialData as any).customerName 
          || (initialData as any).namaPelanggan 
          || (initialData as any).customer_name 
          || (initialData as any).nama_pelanggan 
          || '',
        customerPhone: (initialData as any).customerPhone 
          || (initialData as any).teleponPelanggan 
          || (initialData as any).customer_phone 
          || (initialData as any).telepon_pelanggan 
          || '',
        customerEmail: (initialData as any).customerEmail 
          || (initialData as any).emailPelanggan 
          || (initialData as any).customer_email 
          || (initialData as any).email_pelanggan 
          || '',
        alamatPengiriman: (initialData as any).alamatPengiriman 
          || (initialData as any).alamat_pengiriman 
          || '',
        status: initialData.status || 'pending',
        catatan: (initialData as any).catatan || '',
        items: (initialData as any).items || [],
        subtotal: (initialData as any).subtotal || 0,
        diskonPromo: (initialData as any).diskonPromo 
          || (initialData as any).diskon_promo 
          || 0,
        totalSetelahDiskon: (initialData as any).totalSetelahDiskon 
          || (initialData as any).total_setelah_diskon 
          || 0,
        pajak: (initialData as any).pajak 
          || (initialData as any).tax_amount 
          || 0,
        totalAmount: (initialData as any).totalAmount 
          || (initialData as any).totalPesanan 
          || (initialData as any).total_pesanan 
          || 0,
        isTaxEnabled: !!initialData.pajak,
        usePromo: !!(initialData.promoCode || initialData.diskonPromo),
        promoId: initialData.promoId || '',
        promoCode: initialData.promoCode || '',
        promoType: initialData.promoType || '',
        tanggal: (initialData as any).tanggal 
          ? new Date((initialData as any).tanggal).toISOString().split('T')[0] 
          : new Date().toISOString().split('T')[0], // Changed from tanggalPesanan to tanggal
      });
    } else {
      // Reset form untuk mode baru
      setFormData({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        alamatPengiriman: '',
        status: 'pending',
        catatan: '',
        items: [],
        subtotal: 0,
        diskonPromo: 0,
        totalSetelahDiskon: 0,
        pajak: 0,
        totalAmount: 0,
        isTaxEnabled: false,
        usePromo: false,
        promoId: '',
        promoCode: '',
        promoType: '',
        tanggal: new Date().toISOString().split('T')[0],
      });
    }
  }, [initialData, open]);

  // Filter recipes berdasarkan search dan category
  const filteredRecipes = React.useMemo(() => {
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
  const availableCategories = React.useMemo(() => {
    return getUniqueCategories();
  }, [getUniqueCategories]);

  // Helper function to detect if recipe uses enhanced HPP calculations
  const getCalculationMethodIndicator = (recipe: Recipe) => {
    // Check if recipe has enhanced calculation metadata or specific patterns
    const updatedAt = (recipe as any).updatedAt ?? (recipe as any).updated_at;
    const biayaOverhead = (recipe as any).biayaOverhead ?? (recipe as any).biaya_overhead;
    const hasEnhancedCalculation = updatedAt && 
      new Date(updatedAt) > new Date('2024-01-01') && 
      biayaOverhead && biayaOverhead % 100 === 0; // heuristic
    
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
  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Add item from recipe
  const addItemFromRecipe = (recipe: Recipe) => {
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
    const defaultPricingMode = 'per_portion'; // Default to per portion
    
    const newItem: OrderItem = {
      id: Date.now().toString(),
      name: (recipe as any).namaResep ?? (recipe as any).nama_resep ?? (recipe as any).nama ?? '',
      quantity: 1,
      price: pricePerPortion, // Default to per portion price
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
  };

  // Add custom item
  const addCustomItem = () => {
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
  };

  // Update item with pricing mode support
  const updateItem = (itemId: string, field: keyof OrderItem, value: any) => {
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
  };

  // Remove item
  const removeItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  // Calculate totals dengan pajak opsional dan promo
  useEffect(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
    // Hanya terapkan diskon jika usePromo aktif
    const diskonAktif = formData.usePromo ? (formData.diskonPromo || 0) : 0;
    const totalSetelahDiskon = subtotal - diskonAktif;
    const pajak = formData.isTaxEnabled ? totalSetelahDiskon * 0.1 : 0;
    const totalAmount = totalSetelahDiskon + pajak;

    setFormData(prev => ({
      ...prev,
      subtotal,
      totalSetelahDiskon,
      pajak,
      totalAmount
    }));
  }, [formData.items, formData.isTaxEnabled, formData.diskonPromo, formData.usePromo]);

  // Handle submit dengan validation (map dialog fields -> NewOrder expected fields)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build mapped payload to match validateOrderData/addOrder expectations
    const mapped: Partial<NewOrder> & Record<string, any> = {
      namaPelanggan: formData.customerName?.trim() || '',
      teleponPelanggan: normalizePhoneNumber(formData.customerPhone),
      emailPelanggan: formData.customerEmail?.trim() || '',
      alamatPengiriman: formData.alamatPengiriman?.trim() || '',
      status: formData.status,
      catatan: formData.catatan,
      items: formData.items,
      subtotal: Number(formData.subtotal) || 0,
      pajak: Number(formData.pajak) || 0,
      totalPesanan: Number(formData.totalAmount) || 0,
      tanggal: new Date(formData.tanggal),
      // Carry promo extras if present
      promoId: (formData as any).promoId,
      promoCode: (formData as any).promoCode,
      promoType: (formData as any).promoType,
      diskonPromo: (formData as any).diskonPromo,
      totalSetelahDiskon: (formData as any).totalSetelahDiskon,
    };
    
    const validation = validateOrderData(mapped as any);
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    setLoading(true);
    
    try {
      await onSubmit(mapped);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Gagal menyimpan pesanan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        size="xl" 
        className="w-full max-w-4xl max-h-[95vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isEditMode ? 'Edit Pesanan' : 'Pesanan Baru'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Informasi Pelanggan
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 md:col-span-1">
                <Label htmlFor="customerName">Nama Pelanggan *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => updateField('customerName', e.target.value)}
                  placeholder="Masukkan nama pelanggan"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="customerPhone">Telepon</Label>
                <Input
                  id="customerPhone"
                  value={formData.customerPhone}
                  onChange={(e) => updateField('customerPhone', e.target.value)}
                  placeholder="Masukkan nomor telepon"
                />
              </div>
              
              <div>
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => updateField('customerEmail', e.target.value)}
                  placeholder="Masukkan email pelanggan"
                />
              </div>
              
              <div>
                <Label htmlFor="tanggal">Tanggal Pesanan</Label> {/* Changed label to Tanggal Pesanan */}
                <div className="relative">
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
              
              <div className="sm:col-span-2 md:col-span-1">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => updateField('status', value)}
                >
                  <SelectTrigger>
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
              />
            </div>
          </div>

          <Separator />

          {/* Order Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Item Pesanan
              </h3>
              <div className="flex gap-2">
                <Popover open={isRecipeSelectOpen} onOpenChange={setIsRecipeSelectOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex items-center gap-2"
                      disabled={recipesLoading}
                    >
                      <ChefHat className="h-4 w-4" />
                      {recipesLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      ) : 'Dari Resep'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
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
                        const anyRec: any = recipe as any;
                        const safeName = (anyRec.nama_resep ?? anyRec.namaResep ?? anyRec.nama ?? '') as string;
                        const displayName = typeof safeName === 'string' && safeName.trim() ? safeName : 'Item';
                        const rawPrice = (anyRec.harga_jual_porsi ?? anyRec.hargaJualPorsi) as number | undefined;
                        const safePrice = typeof rawPrice === 'number' && !isNaN(rawPrice) ? rawPrice : undefined;
                        const safeCategory = (anyRec.kategori_resep ?? anyRec.kategoriResep ?? '') as string;
                        const rawJumlah = (anyRec.jumlah_porsi ?? anyRec.jumlahPorsi) as number | undefined;
                        const jumlahPorsi = typeof rawJumlah === 'number' && rawJumlah > 0 ? rawJumlah : undefined;
                        const rawHpp = (anyRec.hpp_per_porsi ?? anyRec.hppPerPorsi) as number | undefined;
                        const hppPerPorsi = typeof rawHpp === 'number' && rawHpp > 0 ? rawHpp : undefined;
                        
                        return (
                          <CommandItem
                            key={recipe.id}
                            onSelect={() => addItemFromRecipe(recipe)}
                            className="flex flex-col items-start gap-2 p-3"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-medium">{displayName}</span>
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${methodIndicator.className}`}
                                >
                                  <methodIndicator.icon className="w-3 h-3 mr-1" />
                                  {methodIndicator.label}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {safePrice !== undefined ? `Rp ${safePrice.toLocaleString('id-ID')}` : 'Rp N/A'}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 w-full">
                              <span>{safeCategory}</span>
                              {jumlahPorsi ? (
                                <>
                                  <span>•</span>
                                  <span>{jumlahPorsi} porsi</span>
                                </>
                              ) : null}
                              {hppPerPorsi !== undefined && (
                                <>
                                  <span>•</span>
                                  <span>HPP: Rp {hppPerPorsi.toLocaleString('id-ID')}</span>
                                </>
                              )}
                              {methodIndicator.isEnhanced && (
                                <>
                                  <span>•</span>
                                  <span className="text-blue-600 font-medium">Overhead Otomatis</span>
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
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Item Manual
                </Button>
              </div>
            </div>
            
            {formData.items.length > 0 ? (
              <div className="space-y-3">
                {formData.items.map((item, index) => {
                  // Get recipe data if item is from recipe
                  const recipe = item.recipeId ? recipes.find(r => r.id === item.recipeId) : null;
                  const methodIndicator = recipe ? getCalculationMethodIndicator(recipe) : null;
                  
                  return (
                    <div key={item.id} className="p-4 border rounded-lg bg-gray-50 space-y-3">
                      {/* Top Row: Menu Name with Badges */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
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
                            className="text-red-600 hover:text-red-700 flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Badges Row */}
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
                              title={`Menggunakan ${methodIndicator.label} untuk kalkulasi HPP`}
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
                      
                      {/* Bottom Row: Quantity, Price, and Total */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
                            disabled={item.isFromRecipe} // Disable manual price editing for recipe items
                          />
                          {item.isFromRecipe && (
                            <p className="text-xs text-blue-600 mt-1">
                              Harga dari resep ({item.pricingMode === 'per_piece' ? 'per pcs' : 'per porsi'})
                            </p>
                          )}
                        </div>
                        
                        <div className="sm:col-span-2 lg:col-span-2">
                          <Label className="text-xs text-gray-500 font-medium">Total Harga</Label>
                          <div className="mt-1 p-2 bg-white border rounded-md">
                            <div className="font-semibold text-lg text-green-700">
                              Rp {item.total.toLocaleString('id-ID')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.quantity} × Rp {item.price.toLocaleString('id-ID')} {item.pricingMode === 'per_piece' ? '(per pcs)' : '(per porsi)'}
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
          </div>

          {/* Order Summary */}
          {formData.items.length > 0 && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg border">
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
              
              {/* Promo Section - Enhanced UI */}
               <div className="mb-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-lg">
                 <div className="flex items-center justify-between mb-3">
                   <div className="flex items-center gap-3">
                     <div className="flex items-center gap-2">
                       <Zap className="w-5 h-5 text-orange-500" />
                       <h4 className="font-semibold text-orange-800">Promo & Diskon</h4>
                     </div>
                     <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-orange-200">
                       <Label htmlFor="usePromo" className="text-sm font-medium text-orange-700 cursor-pointer">Aktifkan Promo</Label>
                       <Switch
                         id="usePromo"
                         checked={formData.usePromo || false}
                         onCheckedChange={(checked) => {
                           updateField('usePromo', checked);
                           if (!checked) {
                             // Reset promo fields when disabled
                             updateField('promoCode', '');
                             updateField('diskonPromo', 0);
                             updateField('promoId', '');
                             updateField('promoType', '');
                           }
                         }}
                       />
                     </div>
                   </div>
                   {formData.usePromo && (
                     <div className="flex gap-2">
                       <Button
                         type="button"
                         variant="outline"
                         size="sm"
                         onClick={() => {
                           // Open promo calculator in new tab/window
                           window.open('/promo-calculator', '_blank');
                           toast.success('Kalkulator promo dibuka di tab baru');
                         }}
                         className="text-xs bg-white hover:bg-orange-50 border-orange-300"
                       >
                         <Calculator className="w-3 h-3 mr-1" />
                         Hitung Promo
                       </Button>
                       <Button
                         type="button"
                         variant="outline"
                         size="sm"
                         onClick={() => {
                           // Import promo data from calculator
                           const savedPromo = localStorage.getItem('calculatedPromo');
                           if (savedPromo) {
                             try {
                               const promoData = JSON.parse(savedPromo);
                               updateField('kodePromo', promoData.kodePromo || '');
                               updateField('diskonPromo', promoData.totalDiskon || 0);
                               toast.success('Data promo berhasil diimpor dari kalkulator');
                               // Clear the saved data after import
                               localStorage.removeItem('calculatedPromo');
                             } catch (error) {
                               toast.error('Gagal mengimpor data promo');
                             }
                           } else {
                             toast.info('Tidak ada data promo yang tersimpan dari kalkulator');
                           }
                         }}
                         className="text-xs bg-white hover:bg-green-50 border-green-300"
                       >
                         <Zap className="w-3 h-3 mr-1" />
                         Impor Promo
                       </Button>
                     </div>
                   )}
                 </div>
                 
                 {!formData.usePromo && (
                   <div className="text-center py-2">
                     <p className="text-sm text-orange-600 flex items-center justify-center gap-2">
                       <Info className="w-4 h-4" />
                       Aktifkan promo untuk mendapatkan diskon khusus
                     </p>
                   </div>
                 )}
                 
                 {formData.usePromo && (
                   <div className="space-y-4">
                     {/* Display imported promo data (read-only) */}
                     {(formData.promoCode || formData.diskonPromo > 0) ? (
                       <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                         <div className="flex items-center gap-2 mb-3">
                           <AlertCircle className="w-4 h-4 text-green-600" />
                           <span className="text-sm font-medium text-green-700">Promo Berhasil Diimpor</span>
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                           <div className="space-y-1">
                             <Label className="text-xs font-medium text-green-800">Kode Promo</Label>
                             <div className="bg-white p-2 rounded border border-green-200">
                               <span className="text-sm font-medium">{formData.promoCode || 'Tidak ada kode'}</span>
                             </div>
                           </div>
                           <div className="space-y-1">
                             <Label className="text-xs font-medium text-green-800">Nilai Diskon</Label>
                             <div className="bg-white p-2 rounded border border-green-200">
                               <span className="text-sm font-medium text-green-600">
                                 Rp {(formData.diskonPromo || 0).toLocaleString('id-ID')}
                               </span>
                             </div>
                           </div>
                         </div>
                         <div className="mt-3 text-xs text-green-600">
                           Data promo diimpor dari kalkulator. Untuk mengubah, gunakan kalkulator promo.
                         </div>
                       </div>
                     ) : (
                       <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                         <div className="flex items-center gap-2 mb-2">
                           <Info className="w-4 h-4 text-orange-600" />
                           <span className="text-sm font-medium text-orange-700">Belum Ada Promo</span>
                         </div>
                         <div className="text-xs text-orange-600">
                           Gunakan kalkulator promo untuk menghitung dan mengimpor data promo.
                         </div>
                       </div>
                     )}
                   </div>
                 )}
               </div>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({formData.items.length} item):</span>
                  <span>Rp {formData.subtotal.toLocaleString('id-ID')}</span>
                </div>
                {formData.usePromo && formData.diskonPromo > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Diskon Promo:</span>
                    <span>- Rp {formData.diskonPromo.toLocaleString('id-ID')}</span>
                  </div>
                )}
                {formData.usePromo && formData.diskonPromo > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Setelah Diskon:</span>
                    <span>Rp {(formData.totalSetelahDiskon || 0).toLocaleString('id-ID')}</span>
                  </div>
                )}
                {formData.isTaxEnabled && (
                  <div className="flex justify-between text-gray-600">
                    <span>Pajak (10%):</span>
                    <span>Rp {formData.pajak.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-xl text-orange-600">
                  <span>Total Pesanan:</span>
                  <span>Rp {formData.totalAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Catatan */}
          <div>
            <Label htmlFor="catatan">Catatan Tambahan</Label>
            <Textarea
              id="catatan"
              value={formData.catatan}
              onChange={(e) => updateField('catatan', e.target.value)}
              placeholder="Catatan atau instruksi khusus untuk pesanan ini"
              rows={3}
            />
          </div>

            </form>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={loading || formData.items.length === 0}
            className="min-w-[120px] bg-orange-500 hover:bg-orange-600"
            onClick={handleSubmit}
          >
            {loading ? 'Menyimpan...' : (isEditMode ? 'Update Pesanan' : 'Buat Pesanan')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderForm;
