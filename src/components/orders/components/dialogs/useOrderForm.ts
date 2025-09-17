// src/components/orders/components/dialogs/useOrderForm.ts
import React from 'react';
import { toast } from 'sonner';
import { useRecipe } from '@/contexts/RecipeContext';
import type { Recipe } from '@/components/recipe/types';
import type { Order, NewOrder, OrderItem } from '../../types';
import { validateOrderData } from '../../utils';

interface UseOrderFormArgs {
  open: boolean;
  initialData?: Order | null;
  onSubmit: (data: Partial<Order> | Partial<NewOrder>) => Promise<void> | void;
  onOpenChange: (open: boolean) => void;
}

export const useOrderForm = ({ open, initialData, onSubmit, onOpenChange }: UseOrderFormArgs) => {
  const isEditMode = !!initialData;

  const { recipes, isLoading: recipesLoading, searchRecipes, getUniqueCategories } = useRecipe();

  const [formData, setFormData] = React.useState({
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
    tanggal: new Date().toISOString().split('T')[0],
  });

  const [loading, setLoading] = React.useState(false);

  // Recipe selector states
  const [isRecipeSelectOpen, setIsRecipeSelectOpen] = React.useState(false);
  const [recipeSearchTerm, setRecipeSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');

  const normalizePhoneNumber = (raw: string): string => {
    if (!raw) return '';
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('62')) return `+${digits}`;
    if (digits.startsWith('8')) return `0${digits}`;
    if (digits.startsWith('0')) return digits;
    return digits;
  };

  React.useEffect(() => {
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
        status: (initialData as any).status || 'pending',
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
        isTaxEnabled: !!(initialData as any).pajak,
        usePromo: !!((initialData as any).promoCode || (initialData as any).diskonPromo),
        promoId: (initialData as any).promoId || '',
        promoCode: (initialData as any).promoCode || '',
        promoType: (initialData as any).promoType || '',
        tanggal: (initialData as any).tanggal 
          ? new Date((initialData as any).tanggal).toISOString().split('T')[0] 
          : new Date().toISOString().split('T')[0],
      });
    } else {
      setFormData(prev => ({
        ...prev,
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
      }));
    }
  }, [initialData, open]);

  const filteredRecipes = React.useMemo(() => {
    let filtered = recipes;
    if (recipeSearchTerm.trim()) filtered = searchRecipes(recipeSearchTerm);
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter((recipe: any) => (recipe.kategoriResep === selectedCategory || recipe.kategori_resep === selectedCategory));
    }
    const getName = (r: any) => (r?.namaResep ?? r?.nama_resep ?? r?.nama ?? '').toString();
    return filtered.slice().sort((a: any, b: any) => getName(a).localeCompare(getName(b)));
  }, [recipes, recipeSearchTerm, selectedCategory, searchRecipes]);

  const availableCategories = React.useMemo(() => getUniqueCategories(), [getUniqueCategories]);

  const getCalculationMethodIndicator = (recipe: Recipe) => {
    const updatedAt: any = (recipe as any).updatedAt ?? (recipe as any).updated_at;
    const biayaOverhead: any = (recipe as any).biayaOverhead ?? (recipe as any).biaya_overhead;
    const hasEnhancedCalculation = updatedAt && new Date(updatedAt) > new Date('2024-01-01') && biayaOverhead && biayaOverhead % 100 === 0;
    return hasEnhancedCalculation
      ? { isEnhanced: true, label: 'Enhanced HPP', className: 'text-blue-600 bg-blue-50 border-blue-200' }
      : { isEnhanced: false, label: 'Standard HPP', className: 'text-gray-600 bg-gray-50 border-gray-200' };
  };

  const updateField = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));

  const addItemFromRecipe = (recipe: Recipe) => {
    const anyRec: any = recipe as any;
    const pricePerPortion = anyRec.hargaJualPorsi ?? anyRec.harga_jual_porsi ?? anyRec.hppPerPorsi ?? anyRec.hpp_per_porsi ?? 0;
    const pcsPerPortion = anyRec.jumlahPcsPerPorsi ?? anyRec.jumlah_pcs_per_porsi ?? 1;
    const pricePerPiece = anyRec.hargaJualPerPcs ?? anyRec.harga_jual_per_pcs ?? (pricePerPortion / (pcsPerPortion || 1)) ?? 0;
    const defaultPricingMode = 'per_portion';

    const newItem: OrderItem = {
      id: Date.now().toString(),
      name: anyRec.namaResep ?? anyRec.nama_resep ?? anyRec.nama ?? '',
      quantity: 1,
      price: pricePerPortion,
      total: pricePerPortion,
      recipeId: anyRec.id,
      recipeCategory: anyRec.kategoriResep ?? anyRec.kategori_resep,
      isFromRecipe: true,
      pricingMode: defaultPricingMode,
      pricePerPortion,
      pricePerPiece,
    };

    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    setIsRecipeSelectOpen(false);
    const rawName = anyRec.nama_resep ?? anyRec.namaResep ?? anyRec.nama ?? '';
    const recipeName = typeof rawName === 'string' && rawName.trim() ? rawName : 'Item';
    toast.success(`${recipeName} ditambahkan ke pesanan`);
  };

  const addCustomItem = () => {
    const newItem: OrderItem = { id: Date.now().toString(), name: '', quantity: 1, price: 0, total: 0, isFromRecipe: false } as any;
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const updateItem = (itemId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id !== itemId) return item;
        const updatedItem: any = { ...item, [field]: value };
        if (field === 'pricingMode') {
          if (value === 'per_portion' && updatedItem.pricePerPortion) updatedItem.price = updatedItem.pricePerPortion;
          else if (value === 'per_piece' && updatedItem.pricePerPiece) updatedItem.price = updatedItem.pricePerPiece;
          updatedItem.total = updatedItem.quantity * updatedItem.price;
        } else if (field === 'quantity' || field === 'price') {
          updatedItem.total = updatedItem.quantity * updatedItem.price;
        }
        return updatedItem;
      })
    }));
  };

  const removeItem = (itemId: string) => setFormData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== itemId) }));

  React.useEffect(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
    const diskonAktif = formData.usePromo ? (formData.diskonPromo || 0) : 0;
    const totalSetelahDiskon = subtotal - diskonAktif;
    const pajak = formData.isTaxEnabled ? totalSetelahDiskon * 0.1 : 0;
    const totalAmount = totalSetelahDiskon + pajak;
    setFormData(prev => ({ ...prev, subtotal, totalSetelahDiskon, pajak, totalAmount }));
  }, [formData.items, formData.isTaxEnabled, formData.diskonPromo, formData.usePromo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      promoId: (formData as any).promoId,
      promoCode: (formData as any).promoCode,
      promoType: (formData as any).promoType,
      diskonPromo: (formData as any).diskonPromo,
      totalSetelahDiskon: (formData as any).totalSetelahDiskon,
    };

    const validation = validateOrderData(mapped as any);
    if (!validation.isValid) {
      validation.errors.forEach((error: string) => toast.error(error));
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

  return {
    // state
    formData,
    loading,
    // recipe search state
    isRecipeSelectOpen,
    setIsRecipeSelectOpen,
    recipeSearchTerm,
    setRecipeSearchTerm,
    selectedCategory,
    setSelectedCategory,
    filteredRecipes,
    availableCategories,
    // handlers
    updateField,
    addItemFromRecipe,
    addCustomItem,
    updateItem,
    removeItem,
    handleSubmit,
    // helpers
    getCalculationMethodIndicator,
  };
};

export default useOrderForm;
