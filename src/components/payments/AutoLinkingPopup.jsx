// src/components/popups/AutoLinkingPopup.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { X, User, CheckCircle, AlertCircle, Loader2, Zap } from 'lucide-react';
import { logger } from '@/utils/logger';

interface AutoLinkingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  unlinkedPayments?: any[];
  currentUser?: any;
  supabaseClient?: any;
  onSuccess?: (payments: any[]) => void;
}

// AutoLinkingPopup - For webhook-detected payments that need user linking
// This complements OrderConfirmationPopup which handles manual Order ID input
const AutoLinkingPopup: React.FC<AutoLinkingPopupProps> = ({ 
  isOpen, 
  onClose, 
  unlinkedPayments = [],
  currentUser,
  supabaseClient,
  onSuccess
}) => {
  const [selectedPayments, setSelectedPayments] = useState<any[]>([]);
  const [isLinking, setIsLinking] = useState(false);
  const [linkingResults, setLinkingResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  // ✅ FIXED: Reset state when popup opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPayments([]);
      setLinkingResults([]);
      setShowResults(false);
      logger.debug('AutoLinkingPopup: Reset state, showing', unlinkedPayments.length, 'payments');
    }
  }, [isOpen, unlinkedPayments.length]);

  // ✅ FIXED: Auto-select all payments by default
  useEffect(() => {
    if (isOpen && unlinkedPayments.length > 0 && selectedPayments.length === 0) {
      setSelectedPayments([...unlinkedPayments]);
      logger.debug('AutoLinkingPopup: Auto-selected all payments');
    }
  }, [isOpen, unlinkedPayments, selectedPayments.length]);

  const handlePaymentToggle = (payment: any) => {
    setSelectedPayments(prev => {
      const isSelected = prev.some(p => p.order_id === payment.order_id);
      if (isSelected) {
        return prev.filter(p => p.order_id !== payment.order_id);
      } else {
        return [...prev, payment];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedPayments.length === unlinkedPayments.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments([...unlinkedPayments]);
    }
  };

  // ✅ FIXED: Enhanced auto-linking with better error handling
  const handleAutoLinkPayments = async () => {
    if (!currentUser || selectedPayments.length === 0 || !supabaseClient) {
      logger.error('AutoLinkingPopup: Missing requirements for linking');
      return;
    }

    setIsLinking(true);
    const results: any[] = [];

    try {
      logger.info('AutoLinkingPopup: Starting auto-link for', selectedPayments.length, 'payments');

      for (const payment of selectedPayments) {
        try {
          logger.debug('AutoLinkingPopup: Linking payment', payment.order_id);

          const { data, error } = await supabaseClient
            .from('user_payments')
            .update({
              user_id: currentUser.id,
              auth_email: currentUser.email,
              linked_at: new Date().toISOString(),
              // ✅ FIXED: Preserve original email from webhook
              // Don't overwrite the email field as it contains the original webhook email
            })
            .eq('order_id', payment.order_id)
            .eq('user_id', null) // ✅ SAFETY: Only update if still unlinked
            .select()
            .single();

          if (error) {
            logger.error('AutoLinkingPopup: Database error for', payment.order_id, error);
            throw error;
          }

          if (!data) {
            throw new Error('Payment not found or already linked');
          }

          logger.success('AutoLinkingPopup: Successfully linked', payment.order_id);
          results.push({
            order_id: payment.order_id,
            success: true,
            data
          });
        } catch (error: any) {
          logger.error('AutoLinkingPopup: Failed to link', payment.order_id, error);
          results.push({
            order_id: payment.order_id,
            success: false,
            error: error.message
          });
        }
      }

      setLinkingResults(results);
      setShowResults(true);

      // ✅ FIXED: Enhanced success callback
      const successfulPayments = results.filter(r => r.success).map(r => r.data);
      if (successfulPayments.length > 0) {
        logger.success('AutoLinkingPopup: Successfully linked', successfulPayments.length, 'payments');
        if (onSuccess) {
          onSuccess(successfulPayments);
        }
      }

    } catch (error) {
      logger.error('AutoLinkingPopup: General linking error:', error);
    } finally {
      setIsLinking(false);
    }
  };

  const handleClose = () => {
    setSelectedPayments([]);
    setLinkingResults([]);
    setShowResults(false);
    onClose();
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // ✅ FIXED: Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Zap className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Auto-Link Pembayaran Terdeteksi
              </h2>
              <p className="text-sm text-gray-500">
                Hubungkan pembayaran webhook ke akun Anda
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLinking}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {!showResults ? (
            /* Payment Selection */
            <div className="p-6">
              {/* User Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {currentUser?.email || 'Current User'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Pembayaran akan dihubungkan ke akun ini
                    </p>
                  </div>
                </div>
              </div>

              {/* Unlinked Payments */}
              {unlinkedPayments.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-600">Tidak ada pembayaran webhook yang terdeteksi</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Semua pembayaran webhook sudah terhubung!
                  </p>
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      💡 <strong>Punya pembayaran baru?</strong> Gunakan tombol "Hubungkan Pembayaran" untuk menghubungkan pembayaran dengan Order ID secara manual.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">
                        Pembayaran Terdeteksi Webhook ({unlinkedPayments.length})
                      </h3>
                      <p className="text-sm text-gray-500">
                        Pembayaran ini terdeteksi otomatis oleh sistem webhook
                      </p>
                    </div>
                    <button
                      onClick={handleSelectAll}
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      {selectedPayments.length === unlinkedPayments.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {unlinkedPayments.map((payment) => (
                      <div
                        key={payment.order_id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedPayments.some(p => p.order_id === payment.order_id)
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handlePaymentToggle(payment)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <input
                                type="checkbox"
                                checked={selectedPayments.some(p => p.order_id === payment.order_id)}
                                onChange={() => handlePaymentToggle(payment)}
                                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                                {payment.order_id}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                payment.is_paid 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {payment.is_paid ? 'PAID' : 'PENDING'}
                              </span>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                WEBHOOK
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Email:</span>
                                <span className="ml-2 font-medium">
                                  {payment.email === 'unlinked@payment.com' || payment.email === 'pending@webhook.com' 
                                    ? 'Auto-generated' 
                                    : payment.email || 'No email'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Status:</span>
                                <span className="ml-2 font-medium">
                                  {payment.payment_status || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Terdeteksi:</span>
                                <span className="ml-2">
                                  {formatDate(payment.created_at)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Reference:</span>
                                <span className="ml-2 font-mono text-xs">
                                  {payment.pg_reference_id || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Results Display */
            <div className="p-6">
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-2">
                  Hasil Auto-Linking
                </h3>
                <p className="text-sm text-gray-500">
                  {linkingResults.filter(r => r.success).length} dari {linkingResults.length} pembayaran berhasil dihubungkan
                </p>
              </div>

              <div className="space-y-3">
                {linkingResults.map((result) => (
                  <div
                    key={result.order_id}
                    className={`border rounded-lg p-4 ${
                      result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="font-mono text-sm mb-1">
                          {result.order_id}
                        </div>
                        {result.success ? (
                          <p className="text-sm text-green-700">
                            Berhasil dihubungkan ke akun Anda
                          </p>
                        ) : (
                          <p className="text-sm text-red-700">
                            Gagal: {result.error}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          {!showResults ? (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {selectedPayments.length > 0 && (
                  `${selectedPayments.length} dari ${unlinkedPayments.length} pembayaran dipilih`
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  disabled={isLinking}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleAutoLinkPayments}
                  disabled={selectedPayments.length === 0 || isLinking}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isLinking && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Zap className="w-4 h-4" />
                  {isLinking ? 'Menghubungkan...' : `Hubungkan ${selectedPayments.length} Pembayaran`}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {linkingResults.filter(r => r.success).length > 0 && (
                  `${linkingResults.filter(r => r.success).length} pembayaran berhasil dihubungkan`
                )}
              </div>
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Selesai
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutoLinkingPopup;