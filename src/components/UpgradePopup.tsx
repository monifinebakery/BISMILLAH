import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';  
import { CheckCircle, ExternalLink, Zap, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePaymentContext } from '@/contexts/PaymentContext';

const UpgradePopup = () => {
  const { showUpgradePopup, setShowUpgradePopup, isPaid } = usePaymentContext();
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Don't show for paid users
  if (isPaid) {
    return null;
  }

  const handleUpgrade = async () => {
    setIsProcessing(true);
    
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
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle(); // Menggunakan maybeSingle, bukan single, agar tidak error jika tidak ada

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
              // MODIFIED: Memberikan nilai fallback untuk email dan menambahkan order_id
              email: String(user.email || 'unknown@example.com'), 
              order_id: paymentId, // Menambahkan order_id
              // Jika kolom 'name' juga NOT NULL, Anda bisa tambahkan:
              // name: user.user_metadata?.full_name || user.email, 
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
      } catch (dbError: any) { // Tangani error database operation secara spesifik
        console.error('Database operation error:', dbError.message);
        toast.error('Terjadi kesalahan database saat menyiapkan pembayaran.');
        // Lanjutkan dengan payment flow meskipun ada error DB jika dianggap non-kritikal
      }

      // Open payment URL in new tab
      const scalevPaymentUrl = `https://monifine.my.id/checkout-page-growth-kit?discount_code=HPP2025`;
      window.open(scalevPaymentUrl, '_blank');
      
      toast.success('Halaman pembayaran dibuka di tab baru!');
      setShowUpgradePopup(false);
      
    } catch (error: any) { // Tangani error umum inisiasi pembayaran
      console.error('Payment initiation error:', error instanceof Error ? error.message : String(error));
      toast.error('Terjadi kesalahan saat memproses pembayaran');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={showUpgradePopup} onOpenChange={setShowUpgradePopup}>
      <DialogContent className="dialog-overlay-center">
        <div className="dialog-panel">
          <DialogHeader className="dialog-header-pad">
            <DialogTitle className="flex items-center gap-2 text-center">
              <Zap className="h-6 w-6 text-yellow-500" />
              Upgrade ke Premium
            </DialogTitle>
          </DialogHeader>
          
          <div className="dialog-body space-y-4 py-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              Rp 145.000
            </div>
            <Badge variant="secondary" className="mb-2">
              Pembayaran Sekali - Akses Selamanya
            </Badge>
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
                <h3 className="font-medium text-sm">Dukungan Teknis Prioritas</h3>
                <p className="text-xs text-gray-600">Bantuan langsung dari tim kami</p>
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

          <div className="space-y-2">

            </div>
            
            <p className="text-xs text-gray-500 text-center">
              Setelah pembayaran selesai, refresh halaman untuk mengaktifkan akun premium
            </p>
          </div>
          
          <DialogFooter className="dialog-footer-pad pt-4">
            <Button 
              onClick={() => setShowUpgradePopup(false)}
              variant="outline"
            >
              Nanti Saja
            </Button>
            <Button
              onClick={handleUpgrade}
              disabled={isProcessing}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold"
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
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradePopup;