// src/components/invoice/hooks/useInvoiceForm.tsx
import { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { 
  formatInvoiceNumber, 
  generatePaymentInstructions, 
  getDefaultNotes,
  validateInvoice 
} from '../utils';
import type { 
  InvoiceData, 
  InvoiceItem, 
  Customer, 
  Discount, 
  Tax, 
  InvoiceStatus, 
  OrderData,
  ValidationError 
} from '../types';

interface UseInvoiceFormOptions {
  initialData?: Partial<InvoiceData>;
  orderData?: OrderData;
}

export const useInvoiceForm = ({ initialData, orderData }: UseInvoiceFormOptions = {}) => {
  const { settings } = useUserSettings();
  
  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState(
    initialData?.invoiceNumber || formatInvoiceNumber()
  );
  const [issueDate, setIssueDate] = useState(
    initialData?.issueDate || new Date()
  );
  const [dueDate, setDueDate] = useState(
    initialData?.dueDate || new Date(new Date().setDate(new Date().getDate() + 14))
  );
  const [customer, setCustomer] = useState<Customer>(
    initialData?.customer || { name: '', address: '', phone: '', email: '' }
  );
  const [items, setItems] = useState<InvoiceItem[]>(
    initialData?.items || [{ id: Date.now(), description: '', quantity: 1, price: 0 }]
  );
  const [discount, setDiscount] = useState<Discount>(
    initialData?.discount || { type: 'percent', value: 0 }
  );
  const [tax, setTax] = useState<Tax>(
    initialData?.tax || { type: 'percent', value: 0 }
  );
  const [shipping, setShipping] = useState(initialData?.shipping || 0);
  const [notes, setNotes] = useState(
    initialData?.notes || getDefaultNotes()
  );
  const [paymentInstructions, setPaymentInstructions] = useState(
    initialData?.paymentInstructions || generatePaymentInstructions(settings.businessName)
  );
  const [status, setStatus] = useState<InvoiceStatus>(
    initialData?.status || 'BELUM LUNAS'
  );

  // Validation state
  const [errors, setErrors] = useState<ValidationError[]>([]);

  // Update payment instructions when business name changes
  useEffect(() => {
    if (!initialData?.paymentInstructions) {
      setPaymentInstructions(generatePaymentInstructions(settings.businessName));
    }
  }, [settings.businessName, initialData?.paymentInstructions]);

  // Update form when order data is loaded
  useEffect(() => {
    if (orderData) {
      setInvoiceNumber(`INV-${orderData.nomorPesanan}`);
      setCustomer({
        name: orderData.namaPelanggan,
        address: orderData.alamatPelanggan || '',
        phone: orderData.telefonPelanggan || '',
        email: orderData.emailPelanggan || ''
      });
      
      const invoiceItems = orderData.items.map((item, index) => ({
        id: Date.now() + index,
        description: item.namaBarang,
        quantity: item.quantity,
        price: item.hargaSatuan
      }));
      
      setItems(invoiceItems.length > 0 ? invoiceItems : [
        { id: Date.now(), description: '', quantity: 1, price: 0 }
      ]);
    }
  }, [orderData]);

  // Item handlers
  const handleItemChange = useCallback((
    id: number, 
    field: keyof Omit<InvoiceItem, 'id'>, 
    value: string | number
  ) => {
    setItems(items => items.map(item => 
      item.id === id 
        ? { ...item, [field]: field === 'description' ? value : Number(value) || 0 } 
        : item
    ));
  }, []);

  const addItem = useCallback(() => {
    setItems(items => [...items, { 
      id: Date.now(), 
      description: '', 
      quantity: 1, 
      price: 0 
    }]);
  }, []);
  
  const removeItem = useCallback((id: number) => {
    setItems(items => {
      if (items.length > 1) {
        return items.filter(item => item.id !== id);
      }
      return items;
    });
  }, []);

  // Form actions
  const resetForm = useCallback(() => {
    setInvoiceNumber(formatInvoiceNumber());
    setIssueDate(new Date());
    setDueDate(new Date(new Date().setDate(new Date().getDate() + 14)));
    setCustomer({ name: '', address: '', phone: '', email: '' });
    setItems([{ id: Date.now(), description: '', quantity: 1, price: 0 }]);
    setDiscount({ type: 'percent', value: 0 });
    setTax({ type: 'percent', value: 0 });
    setShipping(0);
    setStatus('BELUM LUNAS');
    setNotes(getDefaultNotes());
    setPaymentInstructions(generatePaymentInstructions(settings.businessName));
    setErrors([]);
  }, [settings.businessName]);

  const duplicateInvoice = useCallback(() => {
    const newInvoiceNumber = `INV/${format(new Date(), 'yyyyMMdd')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    setInvoiceNumber(newInvoiceNumber);
    setIssueDate(new Date());
    setDueDate(new Date(new Date().setDate(new Date().getDate() + 14)));
    setStatus('BELUM LUNAS');
  }, []);

  // Validation
  const validateForm = useCallback((): boolean => {
    const invoiceData: InvoiceData = {
      invoiceNumber,
      issueDate,
      dueDate,
      status,
      customer,
      items,
      discount,
      tax,
      shipping,
      notes,
      paymentInstructions
    };

    const validationErrors = validateInvoice(invoiceData);
    setErrors(validationErrors);
    return validationErrors.length === 0;
  }, [invoiceNumber, issueDate, dueDate, status, customer, items, discount, tax, shipping, notes, paymentInstructions]);

  // Get form data
  const getFormData = useCallback((): InvoiceData => ({
    invoiceNumber,
    issueDate,
    dueDate,
    status,
    customer,
    items,
    discount,
    tax,
    shipping,
    notes,
    paymentInstructions
  }), [invoiceNumber, issueDate, dueDate, status, customer, items, discount, tax, shipping, notes, paymentInstructions]);

  return {
    // Form state
    invoiceNumber,
    setInvoiceNumber,
    issueDate,
    setIssueDate,
    dueDate,
    setDueDate,
    customer,
    setCustomer,
    items,
    setItems,
    discount,
    setDiscount,
    tax,
    setTax,
    shipping,
    setShipping,
    notes,
    setNotes,
    paymentInstructions,
    setPaymentInstructions,
    status,
    setStatus,
    
    // Item handlers
    handleItemChange,
    addItem,
    removeItem,
    
    // Form actions
    resetForm,
    duplicateInvoice,
    validateForm,
    getFormData,
    
    // Validation
    errors,
    isValid: errors.length === 0
  };
};