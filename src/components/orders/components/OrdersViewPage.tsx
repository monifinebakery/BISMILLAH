// src/components/orders/components/OrdersViewPage.tsx - Full Page Order Detail View with Breadcrumbs

import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Home, FileText, User, Phone, Mail, MapPin, Calendar, Edit2, Package, Calculator, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge, LoadingStates, EmptyState } from '@/components/ui';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

// Import Breadcrumb components
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// Import utilities and context

import { formatDateForDisplay } from '@/utils/unifiedDateUtils';
import { getStatusText } from '../constants';
import { useOrder } from '../context/OrderContext';
import type { Order } from '../types';

const OrdersViewPage: React.FC = () => {
  const { formatCurrency } = useCurrency();  const navigate = useNavigate();
  const { id: orderId } = useParams<{ id: string }>();
  const { formatCurrency } = useCurrency();
  // Order Context
  const { orders, loading: ordersLoading } = useOrder();

  // Find the order
  const order = useMemo(() => {
  const { formatCurrency } = useCurrency();    if (!orderId) return null;
    return orders.find(o => o.id === orderId) || null;
  }, [orderId, orders]);

  // Handle navigation
  const handleBack = () => {
  const { formatCurrency } = useCurrency();    navigate('/pesanan');
  };

  const handleEdit = () => {
  const { formatCurrency } = useCurrency();    if (order?.id) {
      navigate(`/pesanan/edit/${order.id}`);
    }
  };

  const handleWhatsApp = () => {
  const { formatCurrency } = useCurrency();    if (!order?.teleponPelanggan) {
      toast.error('Nomor telepon tidak tersedia');
      return;
    }

    try {
      // Create a basic message for follow-up
      const message = `Halo ${order.namaPelanggan}, terima kasih atas pesanan Anda #${order.nomorPesanan}. Status pesanan: ${getStatusText(order.status)}.`;
  const { formatCurrency } = useCurrency();      
      // Format phone number
      const cleanPhoneNumber = order.teleponPelanggan.replace(/\D/g, '');
      
      // Create WhatsApp URL
      const whatsappUrl = `https://wa.me/${cleanPhoneNumber}?text=${encodeURIComponent(message)}`;
  const { formatCurrency } = useCurrency();      
      // Open WhatsApp
      window.open(whatsappUrl, '_blank');
      
      toast.success('WhatsApp berhasil dibuka');
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      toast.error('Gagal membuka WhatsApp');
    }
  };

  // Loading state
  if (ordersLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <LoadingStates.Page text="Memuat data pesanan..." />
      </div>
    );
  }

  // Order not found
  if (!order) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <EmptyState
          title="Pesanan Tidak Ditemukan"
          description="Pesanan yang Anda cari tidak dapat ditemukan atau telah dihapus."
          actionText="Kembali ke Daftar Pesanan"
          onAction={handleBack}
          customIllustration={
            <div className="text-red-500 text-6xl mb-4">📋</div>
          }
        />
      </div>
    );
  }

  // Status badge will auto-detect colors based on status text

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
                <Button variant="ghost" size="sm" onClick={handleBack}>
                  <FileText className="h-4 w-4" />
                  Pesanan
                </Button>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                Detail Pesanan #{order.nomorPesanan}
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
              onClick={handleBack}
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
                Detail Pesanan #{order.nomorPesanan}
                <StatusBadge 
                  status={getStatusText(order.status)} 
                  size="sm"
                />
              </h1>
              <p className="text-gray-600 mt-1">
                Informasi lengkap tentang pesanan dari {order.namaPelanggan}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {order.teleponPelanggan && (
              <Button
                onClick={handleWhatsApp}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-green-600 border-green-200 hover:bg-green-50"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </Button>
            )}
            
            <Button
              onClick={handleEdit}
              size="sm"
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600"
            >
              <Edit2 className="h-4 w-4" />
              <span className="hidden sm:inline">Edit Pesanan</span>
              <span className="sm:hidden">Edit</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Customer Information */}
        <Card className="border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-orange-600" />
              Informasi Pelanggan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Nama Pelanggan</p>
                <p className="text-base font-medium text-gray-900">{order.namaPelanggan}</p>
              </div>

              {order.teleponPelanggan && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Telepon</p>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-base font-medium text-gray-900">{order.teleponPelanggan}</p>
                  </div>
                </div>
              )}

              {order.emailPelanggan && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-base font-medium text-gray-900">{order.emailPelanggan}</p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600 mb-1">Tanggal Pesanan</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-base font-medium text-gray-900">
                    {formatDateForDisplay(order.tanggal)}
                  </p>
                </div>
              </div>
            </div>

            {order.alamatPengiriman && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Alamat Pengiriman</p>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <p className="text-base font-medium text-gray-900">{order.alamatPengiriman}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Items */}
        {order.items?.length > 0 && (
          <Card className="border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-600" />
                Item Pesanan ({order.items.length} item)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Mobile Card Layout */}
                <div className="block md:hidden">
                  {order.items.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(item.total || 0)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Jumlah:</span>
                          <div className="font-medium">{item.quantity}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Harga Satuan:</span>
                          <div className="font-medium">{formatCurrency(item.price || 0)}</div>
                        </div>
                      </div>
                      {item.recipeCategory && (
                        <div className="mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {item.recipeCategory}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden md:block">
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Item
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Jumlah
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Harga Satuan
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {order.items.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{item.name}</div>
                              {item.recipeCategory && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  {item.recipeCategory}
                                </Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-900">{item.quantity}</td>
                            <td className="px-4 py-3 text-gray-900">
                              {formatCurrency(item.price || 0)}
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {formatCurrency(item.total || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Summary */}
        <Card className="border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5 text-orange-600" />
              Ringkasan Pesanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(order.subtotal || 0)}</span>
              </div>
              
              {order.pajak > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pajak (10%):</span>
                  <span className="font-medium">{formatCurrency(order.pajak)}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between font-bold text-xl">
                <span className="text-gray-900">Total Pesanan:</span>
                <span className="text-orange-600">{formatCurrency(order.totalPesanan)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {order.catatan && (
          <Card className="border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-600" />
                Catatan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-900 whitespace-pre-wrap">{order.catatan}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleEdit}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600"
              >
                <Edit2 className="h-4 w-4" />
                Edit Pesanan
              </Button>

              {order.teleponPelanggan && (
                <Button
                  onClick={handleWhatsApp}
                  variant="outline"
                  className="flex items-center gap-2 text-green-600 border-green-200 hover:bg-green-50"
                >
                  <MessageSquare className="h-4 w-4" />
                  Kirim WhatsApp
                </Button>
              )}

              <Button
                onClick={handleBack}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Daftar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrdersViewPage;
