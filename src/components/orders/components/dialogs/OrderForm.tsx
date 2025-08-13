import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, User, Phone, Mail, MapPin, FileText, Calculator, ChefHat, Search, Calendar } from 'lucide-react';
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

  // Form state dengan tambahan tanggalPesanan
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
    tanggalPesanan: new Date().toISOString().split('T')[0], // Default to current date
  });

  const [loading, setLoading] = useState(false);
  
  // Recipe selector states
  const [isRecipeSelectOpen, setIsRecipeSelectOpen] = useState(false);
  const [recipeSearchTerm, setRecipeSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Initialize form dengan data existing jika edit mode
  useEffect(() => {
    if (initialData) {
      setFormData({
        namaPelanggan: initialData.namaPelanggan || '',
        teleponPelanggan: initialData.teleponPelanggan || '',
        emailPelanggan: initialData.emailPelanggan || '',
        alamatPengiriman: initialData.alamatPengiriman || '',
        status: initialData.status || 'pending',
        catatan: initialData.catatan || '',
        items: initialData.items || [],
        subtotal: initialData.subtotal || 0,
        pajak: initialData.pajak || 0,
        totalPesanan: initialData.totalPesanan || 0,
        isTaxEnabled: !!initialData.pajak,
        tanggalPesanan: initialData.tanggalPesanan 
          ? new Date(initialData.tanggalPesanan).toISOString().split('T')[0] 
          : new Date().toISOString().split('T')[0],
      });
    } else {
      // Reset form untuk mode baru
      setFormData({
        namaPelanggan: '',
        teleponPelanggan: '',
        emailPelanggan: '',
        alamatPengiriman: '',
        status: 'pending',
        catatan: '',
        items: [],
        subtotal: 0,
        pajak: 0,
        totalPesanan: 0,
        isTaxEnabled: false,
        tanggalPesanan: new Date().toISOString().split('T')[0],
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
      filtered = filtered.filter(recipe => recipe.kategoriResep === selectedCategory);
    }
    
    return filtered.sort((a, b) => a.namaResep.localeCompare(b.namaResep));
  }, [recipes, recipeSearchTerm, selectedCategory, searchRecipes]);

  // Get unique categories from recipes
  const availableCategories = React.useMemo(() => {
    return getUniqueCategories();
  }, [getUniqueCategories]);

  // Update form field
  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Add item from recipe
  const addItemFromRecipe = (recipe: Recipe) => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      name: recipe.namaResep,
      quantity: 1,
      price: recipe.hargaJualPorsi || recipe.hppPerPorsi || 0,
      total: recipe.hargaJualPorsi || recipe.hppPerPorsi || 0,
      recipeId: recipe.id,
      recipeCategory: recipe.kategoriResep,
      isFromRecipe: true,
    };
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    
    setIsRecipeSelectOpen(false);
    toast.success(`${recipe.namaResep} ditambahkan ke pesanan`);
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

  // Update item
  const updateItem = (itemId: string, field: keyof OrderItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' || field === 'price') {
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

  // Handle submit dengan validation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateOrderData(formData);
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    setLoading(true);
    
    try {
      await onSubmit(formData);
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isEditMode ? 'Edit Pesanan' : 'Pesanan Baru'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Informasi Pelanggan
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="namaPelanggan">Nama Pelanggan *</Label>
                <Input
                  id="namaPelanggan"
                  value={formData.namaPelanggan}
                  onChange={(e) => updateField('namaPelanggan', e.target.value)}
                  placeholder="Masukkan nama pelanggan"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="teleponPelanggan">Telepon</Label>
                <Input
                  id="teleponPelanggan"
                  value={formData.teleponPelanggan}
                  onChange={(e) => updateField('teleponPelanggan', e.target.value)}
                  placeholder="Masukkan nomor telepon"
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
                />
              </div>
              
              <div>
                <Label htmlFor="tanggalPesanan">Tanggal Pesanan</Label>
                <div className="relative">
                  <Input
                    id="tanggalPesanan"
                    type="date"
                    value={formData.tanggalPesanan}
                    onChange={(e) => updateField('tanggalPesanan', e.target.value)}
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
                      {recipesLoading ? 'Memuat...' : 'Dari Resep'}
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
                        {filteredRecipes.map((recipe) => (
                          <CommandItem
                            key={recipe.id}
                            onSelect={() => addItemFromRecipe(recipe)}
                            className="flex flex-col items-start gap-1 p-3"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-medium">{recipe.namaResep}</span>
                              <Badge variant="secondary" className="text-xs">
                                Rp {recipe.hargaJualPorsi?.toLocaleString('id-ID') || 'N/A'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
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
                        ))}
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
                {formData.items.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-3 p-4 border rounded-lg bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Input
                          placeholder="Nama item"
                          value={item.name}
                          onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                          disabled={item.isFromRecipe}
                          className={item.isFromRecipe ? 'bg-blue-50' : ''}
                        />
                        {item.isFromRecipe && (
                          <Badge variant="outline" className="text-blue-600 border-blue-200">
                            <ChefHat className="h-3 w-3 mr-1" />
                            Resep
                          </Badge>
                        )}
                        {item.recipeCategory && (
                          <Badge variant="secondary" className="text-xs">
                            {item.recipeCategory}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="w-24">
                      <Label className="text-xs text-gray-500">Qty</Label>
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        min="1"
                      />
                    </div>
                    <div className="w-32">
                      <Label className="text-xs text-gray-500">Harga</Label>
                      <Input
                        type="number"
                        placeholder="Harga"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        min="0"
                      />
                    </div>
                    <div className="w-32 text-right">
                      <Label className="text-xs text-gray-500">Total</Label>
                      <div className="font-semibold text-lg">
                        Rp {item.total.toLocaleString('id-ID')}
                      </div>
                    </div>
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
                ))}
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

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
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
            >
              {loading ? 'Menyimpan...' : (isEditMode ? 'Update Pesanan' : 'Buat Pesanan')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderForm;