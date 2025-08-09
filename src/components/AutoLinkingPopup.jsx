import React, { useState, useEffect } from 'react';
import { X, CreditCard, User, CheckCircle, AlertCircle, Loader2, Zap } from 'lucide-react';

// AutoLinkingPopup - For webhook-detected payments that need user linking
// This complements OrderConfirmationPopup which handles manual Order ID input
const AutoLinkingPopup = ({ 
  isOpen, 
  onClose, 
  unlinkedPayments = [],
  currentUser,
  supabaseClient 
}) => {
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [isLinking, setIsLinking] = useState(false);
  const [linkingResults, setLinkingResults] = useState([]);
  const [showResults, setShowResults] = useState(false);

  // Reset state when popup opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPayments([]);
      setLinkingResults([]);
      setShowResults(false);
    }
  }, [isOpen]);

  const handlePaymentToggle = (payment) => {
    setSelectedPayments(prev => {
      const isSelected = prev.some(p => p.order_id === payment.order_id);
      if (isSelected) {
        return prev.filter(p => p.order_id !== payment.order_id);
      } else {
        return [...prev, payment];
      }
    });
  };

  const handleAutoLinkPayments = async () => {
    if (!currentUser || selectedPayments.length === 0) return;

    setIsLinking(true);
    const results = [];

    try {
      for (const payment of selectedPayments) {
        try {
          const { data, error } = await supabaseClient
            .from('user_payments')
            .update({
              user_id: currentUser.id,
              auth_email: currentUser.email,
              linked_at: new Date().toISOString(),
              // Preserve original email from webhook
              email: payment.email // Don't overwrite this
            })
            .eq('order_id', payment.order_id)
            .select()
            .single();

          if (error) throw error;

          results.push({
            order_id: payment.order_id,
            success: true,
            data
          });
        } catch (error) {
          results.push({
            order_id: payment.order_id,
            success: false,
            error: error.message
          });
        }
      }

      setLinkingResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Auto-linking error:', error);
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

  const formatCurrency = (amount) => {
    if (!amount) return 'Amount not available';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
                Auto-Link Detected Payments
              </h2>
              <p className="text-sm text-gray-500">
                Connect webhook-detected payments to your account
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
                      Auto-detected payments will be linked to this account
                    </p>
                  </div>
                </div>
              </div>

              {/* Unlinked Payments */}
              {unlinkedPayments.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-600">No auto-detected payments found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    All webhook payments are already linked!
                  </p>
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      💡 <strong>Have a new payment?</strong> Use the "Hubungkan Pembayaran" button to manually link a payment with Order ID.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">
                      Webhook-Detected Payments ({unlinkedPayments.length})
                    </h3>
                    <p className="text-sm text-gray-500">
                      These payments were automatically detected by our webhook system but need to be linked to your account
                    </p>
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
                                onChange={() => {}}
                                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
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
                                AUTO-DETECTED
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Webhook Email:</span>
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
                                <span className="text-gray-500">Detected:</span>
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
                  Auto-Linking Results
                </h3>
                <p className="text-sm text-gray-500">
                  {linkingResults.filter(r => r.success).length} of {linkingResults.length} payments auto-linked successfully
                </p>
              </div>

              <div className="space-y-3">
                {linkingResults.map((result, index) => (
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
                            Successfully auto-linked to your account
                          </p>
                        ) : (
                          <p className="text-sm text-red-700">
                            Auto-link failed: {result.error}
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
                  `${selectedPayments.length} payment${selectedPayments.length !== 1 ? 's' : ''} selected for auto-linking`
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAutoLinkPayments}
                  disabled={selectedPayments.length === 0 || isLinking}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isLinking && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Zap className="w-4 h-4" />
                  Auto-Link {selectedPayments.length > 0 && `${selectedPayments.length} `}Payment{selectedPayments.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end">
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutoLinkingPopup;