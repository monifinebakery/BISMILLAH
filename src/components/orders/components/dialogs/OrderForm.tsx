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
import useOrderForm from './useOrderForm';
import OrderItemsSection from './OrderItemsSection';

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
  const { 
    formData,
    loading,
    isRecipeSelectOpen,
    setIsRecipeSelectOpen,
    recipeSearchTerm,
    setRecipeSearchTerm,
    selectedCategory,
    setSelectedCategory,
    filteredRecipes,
    availableCategories,
    updateField,
    addItemFromRecipe,
    addCustomItem,
    updateItem,
    removeItem,
    handleSubmit,
    getCalculationMethodIndicator,
  } = useOrderForm({ open, initialData, onSubmit, onOpenChange });

  // Access recipes for display-only use in OrderItemsSection
  const { recipes } = useRecipe();

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
          <OrderItemsSection
            items={formData.items}
            recipes={recipes as any}
            filteredRecipes={filteredRecipes as any}
            availableCategories={availableCategories as any}
            isRecipeSelectOpen={isRecipeSelectOpen}
            setIsRecipeSelectOpen={setIsRecipeSelectOpen}
            recipeSearchTerm={recipeSearchTerm}
            setRecipeSearchTerm={setRecipeSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            addItemFromRecipe={addItemFromRecipe}
            addCustomItem={addCustomItem}
            updateItem={updateItem}
            removeItem={removeItem}
            getCalculationMethodIndicator={getCalculationMethodIndicator as any}
          />

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
