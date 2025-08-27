// src/pages/PaymentPage.tsx atau di mana pun file ini berada
// VERSI FINAL - Menerapkan arsitektur yang benar dimana frontend hanya mengarahkan ke checkout

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ExternalLink, Zap, LogIn, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';

// Fungsi helper untuk membuat Order ID yang unik.
// ID ini adalah "benang merah" yang menghubungkan aksi di frontend
// dengan webhook yang diterima di backend, memastikan data sinkron.
const generateUniqueOrderId = (userId: string): string => {
  const now = new Date();
  const datePart = `${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
  const userPart = userId.substring(0, 4).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `HPP-${datePart}-${userPart}-${randomPart}`;
};


const PaymentPage = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  // Hook ini sekarang hanya digunakan untuk MENAMPILKAN status, bukan memanipulasi data.
  const { paymentStatus, refetch, isLoading } = usePaymentStatus();

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) {
        toast.error('Anda harus login untuk melanjutkan pembayaran.');
        setIsProcessing(false);
        return;
      }

      // 1. BUAT ORDER ID UNIK DI SISI KLIEN
      // ID ini akan kita teruskan ke Scalev, dan Scalev akan mengembalikannya di webhook.
      const orderId = generateUniqueOrderId(user.id);
      
      // 2. BANGUN URL CHECKOUT SCALEV DENGAN PARAMETER
      // Kita meneruskan data penting (order_id, email, nama) sebagai parameter URL.
      // Scalev akan membaca parameter ini dan menyertakannya di webhook 'order.created'.
      const scalevCheckoutUrl = new URL(`https://monifine.my.id/checkout-page-growth-kit`);
      scalevCheckoutUrl.searchParams.append('discount_code', 'HPP2025');
      scalevCheckoutUrl.searchParams.append('order_id', orderId); // WAJIB
      scalevCheckoutUrl.searchParams.append('email', user.email); // WAJIB
      scalevCheckoutUrl.searchParams.append('name', user.user_metadata?.full_name || 'Premium User');
      
      console.log('Membuka URL Checkout Scalev:', scalevCheckoutUrl.toString());

      // 3. BUKA URL DI TAB BARU
      // Tidak ada lagi interaksi INSERT/UPDATE dengan tabel 'user_payments' di sini!
      // Semua logika database diserahkan ke webhook.
      window.open(scalevCheckoutUrl.toString(), '_blank');
      
      toast.success('Halaman pembayaran dibuka di tab baru. Setelah pembayaran selesai, status Anda akan diperbarui secara otomatis.');
      
    } catch (error: any) {
      console.error('Payment initiation error:', error instanceof Error ? error.message : String(error));
      toast.error('Terjadi kesalahan saat memulai pembayaran');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefreshStatus = async () => {
    toast.info('Memeriksa status pembayaran...');
    await refetch();
  };

  const handleGoToApp = () => {
    // Arahkan pengguna ke halaman utama aplikasi setelah membayar
    window.location.href = '/dashboard'; 
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Upgrade Akun Anda ke Premium
            </h1>
            <p className="text-gray-600">
              Buka semua fitur canggih untuk mengelola bisnis kuliner Anda.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Features Card */}
            <Card className="border border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap className="h-6 w-6 text-blue-600" />Fitur Premium</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-green-500 mt-0.5" /><div><h3 className="font-medium text-sm">Kalkulator HPP Tanpa Batas</h3><p className="text-xs text-gray-600">Hitung biaya produksi untuk semua produk Anda.</p></div></div>
                <div className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-green-500 mt-0.5" /><div><h3 className="font-medium text-sm">Manajemen Resep & Bahan Baku</h3><p className="text-xs text-gray-600">Simpan dan kelola semua resep Anda secara terpusat.</p></div></div>
                <div className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-green-500 mt-0.5" /><div><h3 className="font-medium text-sm">Laporan & Analisis Keuangan</h3><p className="text-xs text-gray-600">Dapatkan wawasan mendalam tentang profitabilitas bisnis.</p></div></div>
                <div className="flex items-start gap-3"><CheckCircle className="h-5 w-5 text-green-500 mt-0.5" /><div><h3 className="font-medium text-sm">Aktivasi Instan & Akses Selamanya</h3><p className="text-xs text-gray-600">Langsung aktif setelah pembayaran, tanpa biaya bulanan.</p></div></div>
              </CardContent>
            </Card>

            {/* Payment Card */}
            <Card className="border border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap className="h-6 w-6 text-green-600" />Paket Premium</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-1">Rp 145.000</div>
                    <Badge variant="secondary" className="mb-2">Pembayaran Sekali</Badge>
                    <p className="text-sm text-gray-600">Akses selamanya ke semua fitur premium.</p>
                </div>
                <div className="space-y-3">
                  <Button onClick={handlePayment} disabled={isProcessing} className="w-full bg-green-600 hover:bg-green-700 text-white py-3" size="lg">
                    {isProcessing ? 'Memproses...' : <><ExternalLink className="h-4 w-4 mr-2" />Bayar Sekarang</>}
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button onClick={handleRefreshStatus} variant="outline" className="w-full">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Cek Status
                    </Button>
                    <Button onClick={handleGoToApp} variant="secondary" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      <LogIn className="h-4 w-4 mr-2" />Masuk Aplikasi
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Status Anda akan diperbarui secara otomatis setelah pembayaran berhasil.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Current Status */}
          <div className="mt-8">
            {isLoading && <p className="text-center text-gray-600">Memuat status pembayaran Anda...</p>}
            {paymentStatus && (
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-orange-800">Status Pembayaran Terakhir Anda</h3>
                      <p className="text-sm text-orange-600">Order ID: {paymentStatus.order_id || 'N/A'}</p>
                    </div>
                    <Badge className={paymentStatus.is_paid ? "bg-green-600 text-white" : "bg-gray-500 text-white"}>
                      {paymentStatus.is_paid ? "Lunas" : "Belum Lunas"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;