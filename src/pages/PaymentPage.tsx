import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';  
import { CheckCircle, ExternalLink, Zap, LogIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import { validateAuthSession } from '@/lib/authUtils';

const PaymentPage = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { paymentStatus, refetch } = usePaymentStatus();

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('User tidak terautentikasi');
        return;
      }

      // Check if payment record already exists
      const { data: existingPayment } = await supabase
        .from('user_payments')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Generate unique payment ID for Scalev
      const paymentId = `hpp_${user.id.substring(0, 8)}_${Date.now()}`;
      
      if (existingPayment) {
        // Update existing record instead of creating new one
        const { error: updateError } = await supabase
          .from('user_payments')
          .update({ 
            pg_reference_id: paymentId,
            payment_status: 'pending'
          })
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Error updating payment record:', updateError);
          toast.error('Gagal memperbarui record pembayaran');
          return;
        }
      } else {
        // Create new payment record only if it doesn't exist
        const { error: insertError } = await supabase
          .from('user_payments')
          .insert({
            user_id: user.id,
            is_paid: false,
            payment_status: 'pending',
            pg_reference_id: paymentId
          });

        if (insertError) {
          console.error('Error creating payment record:', insertError);
          toast.error('Gagal membuat record pembayaran');
          return;
        }
      }

      // Open payment URL in new tab
      const scalevPaymentUrl = `https://monifine.my.id/checkout-page-growth-kit?discount_code=HPP2025`;
      
      console.log('Opening Scalev payment URL in new tab:', scalevPaymentUrl);

      // Open in new tab instead of redirect
      window.open(scalevPaymentUrl, '_blank');
      
      toast.success('Halaman pembayaran dibuka di tab baru. Setelah pembayaran selesai, refresh halaman ini.');
      
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error('Terjadi kesalahan saat memproses pembayaran');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefreshStatus = async () => {
    await validateAuthSession();
    await refetch();
    toast.info('Status pembayaran diperbarui');
  };

  const handleGoToLogin = async () => {
    // Sign out current user first
    await supabase.auth.signOut();
    // Redirect to login page - this will trigger AuthGuard to show login form
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Upgrade ke Premium
            </h1>
            <p className="text-gray-600">
              Dapatkan akses penuh ke semua fitur aplikasi HPP
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Features Card */}
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-6 w-6 text-blue-600" />
                  Fitur Premium
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-sm">Kalkulator HPP Unlimited</h3>
                    <p className="text-xs text-gray-600">Hitung HPP tanpa batas</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-sm">Manajemen Resep</h3>
                    <p className="text-xs text-gray-600">Simpan resep favorit</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-sm">Laporan & Analytics</h3>
                    <p className="text-xs text-gray-600">Analisis bisnis mendalam</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-sm">Aktivasi Instan</h3>
                    <p className="text-xs text-gray-600">Langsung aktif setelah pembayaran</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Card */}
            <Card className="border-2 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-6 w-6 text-green-600" />
                  Paket Premium
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-1">
                    Rp 145.000
                  </div>
                  <Badge variant="secondary" className="mb-2">
                    Pembayaran Sekali
                  </Badge>
                  <p className="text-sm text-gray-600">
                    Akses selamanya ke semua fitur premium
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Pembayaran aman dengan Scalev</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Aktivasi instan setelah pembayaran</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Dukungan teknis prioritas</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Memproses...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Bayar Sekarang (Tab Baru)
                      </>
                    )}
                  </Button>

                  <Button 
                    onClick={handleRefreshStatus}
                    variant="outline"
                    className="w-full"
                  >
                    Refresh Status Pembayaran
                  </Button>

                  {/* Tombol untuk mengarahkan ke login */}
                  <Button 
                    onClick={handleGoToLogin}
                    variant="secondary"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Sudah Bayar? Akses Aplikasi
                  </Button>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Setelah pembayaran selesai, klik "Sudah Bayar? Akses Aplikasi" untuk login dan mengaktifkan akun premium Anda
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Current Status */}
          {paymentStatus && (
            <Card className="mt-8 bg-orange-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-orange-800">Status Pembayaran</h3>
                    <p className="text-sm text-orange-600">
                      Status: {paymentStatus.payment_status} | 
                      {paymentStatus.pg_reference_id && ` ID: ${paymentStatus.pg_reference_id}`}
                      {paymentStatus.order_id && ` | Order: ${paymentStatus.order_id}`}
                      {paymentStatus.name && ` | Nama: ${paymentStatus.name}`}
                      {paymentStatus.email && ` | Email: ${paymentStatus.email}`}
                    </p>
                  </div>
                  <Badge variant={paymentStatus.is_paid ? "default" : "secondary"}>
                    {paymentStatus.is_paid ? "Lunas" : "Belum Lunas"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;