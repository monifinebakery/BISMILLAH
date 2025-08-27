import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePaymentStatus } from '@/hooks/usePaymentStatus';
import { toast } from 'sonner';
import { validateAuthSession } from '@/lib/authUtils';
import { formatDateForDisplay } from '@/utils/unifiedDateUtils';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const { paymentStatus, refetch, isPaid, userName } = usePaymentStatus();

  useEffect(() => {
    // Validate auth session and refresh payment status when page loads
    const checkPaymentStatus = async () => {
      await validateAuthSession();
      await refetch();
      
      // Show success message
      if (isPaid) {
        toast.success('Pembayaran berhasil! Selamat datang di Premium!');
      }
    };
    
    checkPaymentStatus();
  }, [refetch, isPaid]);

  const handleContinue = () => {
    navigate('/');
  };

  const getWelcomeMessage = () => {
    if (userName) {
      return `Selamat ${userName}! Akun Anda telah berhasil diupgrade ke Premium.`;
    }
    return "Terima kasih! Akun Anda telah berhasil diupgrade ke Premium.";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="border border-green-200">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">
              Pembayaran Berhasil!
            </CardTitle>
          </CardHeader>
          
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              {getWelcomeMessage()}
            </p>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">Yang Bisa Anda Lakukan Sekarang:</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>✓ Akses unlimited ke kalkulator HPP</li>
                <li>✓ Simpan resep favorit Anda</li>
                <li>✓ Lihat laporan keuangan lengkap</li>
                <li>✓ Sync data ke cloud</li>
              </ul>
            </div>

            {paymentStatus && (
              <div className="bg-gray-50 p-3 rounded text-xs text-gray-600">
                <p>ID Pembayaran: {paymentStatus.pg_reference_id}</p>
                {paymentStatus.order_id && <p>Order ID: {paymentStatus.order_id}</p>}
                {paymentStatus.name && <p>Nama: {paymentStatus.name}</p>}
                {paymentStatus.email && <p>Email: {paymentStatus.email}</p>}
                <p>Tanggal: {formatDateForDisplay(paymentStatus.updated_at)}</p>
              </div>
            )}

            <Button 
              onClick={handleContinue}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              Mulai Menggunakan Premium
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;