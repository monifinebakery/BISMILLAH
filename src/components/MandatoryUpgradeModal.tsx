import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';  
import { CheckCircle, ExternalLink, Crown, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePaymentContext } from '@/contexts/PaymentContext';
import PaymentVerificationLoader from '@/components/PaymentVerificationLoader';

const MandatoryUpgradeModal = () => {
  const { showMandatoryUpgrade, previewTimeLeft, isPaid, hasAccess, isLoading } = usePaymentContext() as any;
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [processingStage, setProcessingStage] = React.useState<'verifying' | 'linking'>('verifying');

  // Don't show timer or modal for paid users or when access is granted or while loading
  if (isPaid || hasAccess || isLoading) {
    return null;
  }

  const handleUpgrade = async () => {
    setIsProcessing(true);
    setProcessingStage('verifying');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('User tidak terautentikasi');
        return;
      }

      // Generate unique payment ID for Scalev
      const paymentId = `hpp_${user.id.substring(0, 8)}_${Date.now()}`;
      
      try {
        // Check if payment record already exists
        const { data: existingPayment } = await supabase
          .from('user_payments')
          .select(`
            id,
            user_id,
            order_id,
            email,
            payment_status,
            is_paid
          `)
          .eq('user_id', user.id)
          .single();

        if (existingPayment) {
          // Update existing record
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
          // Create new payment record
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
      } catch (dbError) {
        console.error('Database operation error:', dbError);
        // Continue with payment flow even if DB operation fails
      }

      // Change to linking stage
      setProcessingStage('linking');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay for UX
      
      // Open payment URL in new tab
      const scalevPaymentUrl = `https://monifine.my.id/checkout-page-growth-kit?discount_code=HPP2025`;
      window.open(scalevPaymentUrl, '_blank');
      
      toast.success('Halaman pembayaran dibuka di tab baru!');
      
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error('Terjadi kesalahan saat memproses pembayaran');
    } finally {
      setIsProcessing(false);
    }
  };

  // Show processing loader when upgrading
  if (isProcessing) {
    return (
      <PaymentVerificationLoader
        stage={processingStage}
        message={processingStage === 'verifying' ? 'Mempersiapkan Pembayaran' : 'Membuka Halaman Pembayaran'}
        timeout={6000}
        onTimeout={() => {
          setIsProcessing(false);
          toast.error('Proses terlalu lama. Silakan coba lagi.');
        }}
      />
    );
  }

  if (!showMandatoryUpgrade && previewTimeLeft > 0) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-orange-100 border border-orange-300 rounded-lg p-3">
          <div className="flex items-center gap-2 text-orange-800">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">
              Preview gratis berakhir dalam {previewTimeLeft} detik
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-md mx-auto" 
        hideCloseButton={true}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center">
            <Crown className="h-6 w-6 text-yellow-500" />
            Upgrade ke Premium Sekarang
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-red-600 font-bold mb-2">
              ⏰ Waktu preview gratis telah habis!
            </div>
            <div className="text-3xl font-bold text-green-600 mb-1">
              Rp 145.000
            </div>
            <Badge variant="secondary" className="mb-2">
              Pembayaran Sekali - Akses Selamanya
            </Badge>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800 text-center">
              Untuk melanjutkan menggunakan aplikasi HPP by Monifine, 
              Anda perlu upgrade ke versi Premium
            </p>
          </div>

          <div className="space-y-3">
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
                <h3 className="font-medium text-sm">Aktivasi Instan</h3>
                <p className="text-xs text-gray-600">Langsung aktif setelah pembayaran</p>
              </div>
            </div>
          </div>

          <Button 
            onClick={handleUpgrade}
            disabled={isProcessing}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Memproses...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-2" />
                Upgrade Sekarang
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Setelah pembayaran selesai, refresh halaman untuk mengaktifkan akun premium
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MandatoryUpgradeModal;
