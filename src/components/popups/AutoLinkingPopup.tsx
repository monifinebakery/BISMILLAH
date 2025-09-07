// src/components/popups/AutoLinkingPopup.tsx - FIXED JSX SYNTAX
import React, { useState, useEffect, useRef } from 'react';
import { X, User, CheckCircle, AlertCircle, Loader2, Zap, LogOut, Clock } from 'lucide-react';
import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';

interface AutoLinkingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  unlinkedPayments?: any[];
  currentUser?: any;
  supabaseClient?: any;
  onSuccess?: (payments: any[]) => void;
}

// ✅ UUID Sanitization function
const sanitizeUserId = (userId: any): string | null => {
  if (userId === null || 
      userId === undefined || 
      userId === 'null' || 
      userId === 'undefined' || 
      userId === '' ||
      userId === 'NULL') {
    return null;
  }
  
  if (typeof userId === 'string' && userId.length > 0) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(userId)) {
      return userId;
    }
  }
  
  logger.warn('AutoLinkingPopup: Invalid user ID detected:', { userId, type: typeof userId });
  return null;
};

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
  
  // Auto-retry state
  const [isDismissed, setIsDismissed] = useState(false);
  const [autoRetryTimer, setAutoRetryTimer] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const retryIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state when popup opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPayments([]);
      setLinkingResults([]);
      setShowResults(false);
      setIsDismissed(false);
      setAutoRetryTimer(0);
      logger.debug('AutoLinkingPopup: Reset state, showing', unlinkedPayments.length, 'payments');
    }
  }, [isOpen, unlinkedPayments.length]);

  // Auto-select all payments by default
  useEffect(() => {
    if (isOpen && unlinkedPayments.length > 0 && selectedPayments.length === 0) {
      setSelectedPayments([...unlinkedPayments]);
      logger.debug('AutoLinkingPopup: Auto-selected all payments');
    }
  }, [isOpen, unlinkedPayments, selectedPayments.length]);

  // Auto-retry popup logic
  useEffect(() => {
    if (!isOpen && !isDismissed && unlinkedPayments.length > 0 && !showResults) {
      logger.debug('AutoLinkingPopup: Setting up auto-retry in 10 seconds');
      
      setAutoRetryTimer(10);
      countdownIntervalRef.current = setInterval(() => {
        setAutoRetryTimer(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      retryIntervalRef.current = setTimeout(() => {
        if (!isDismissed) {
          logger.info('AutoLinkingPopup: Auto-reopening popup after 10 seconds');
          onClose();
        }
      }, 10000);
    }

    return () => {
      if (retryIntervalRef.current) {
        clearTimeout(retryIntervalRef.current);
        retryIntervalRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [isOpen, isDismissed, unlinkedPayments.length, showResults, onClose]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryIntervalRef.current) clearTimeout(retryIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

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

  // ✅ ENHANCED DEBUG VERSION
  const handleAutoLinkPayments = async () => {
    if (!currentUser || selectedPayments.length === 0 || !supabaseClient) {
      logger.error('AutoLinkingPopup: Missing requirements for linking');
      alert('❌ Persyaratan untuk linking tidak lengkap. Silakan refresh halaman.');
      return;
    }

    // ✅ ENHANCED: Comprehensive user validation
    logger.debug('AutoLinkingPopup: Validating user before linking:', {
      userId: currentUser.id,
      userIdType: typeof currentUser.id,
      email: currentUser.email,
      hasEmail: !!currentUser.email
    });

    // ✅ CRITICAL: Validate and sanitize user ID before any operations
    const sanitizedUserId = sanitizeUserId(currentUser.id);
    
    if (!sanitizedUserId) {
      logger.error('AutoLinkingPopup: Invalid current user ID:', {
        originalId: currentUser.id,
        type: typeof currentUser.id,
        email: currentUser.email
      });
      
      alert('❌ Invalid user session. Please logout and login again.');
      return;
    }

    if (!currentUser.email) {
      logger.error('AutoLinkingPopup: Missing user email');
      alert('❌ User email missing. Please logout and login again.');
      return;
    }

    setIsLinking(true);
    const results: any[] = [];

    try {
      logger.info('AutoLinkingPopup: Starting auto-link for', selectedPayments.length, 'payments with sanitized user ID:', sanitizedUserId);

      for (const payment of selectedPayments) {
        try {
          logger.debug('AutoLinkingPopup: Linking payment', payment.order_id, 'to user ID:', sanitizedUserId);

          // ✅ ENHANCED DEBUG: First check if payment exists and is unlinked
          logger.debug('AutoLinkingPopup: Starting pre-check for payment:', {
            order_id: payment.order_id,
            target_user_id: sanitizedUserId,
            target_email: currentUser.email
          });
          
          const { data: checkData, error: checkError } = await supabaseClient
            .from('user_payments')
            .select(`
              id,
              user_id,
              order_id,
              name,
              email,
              payment_status,
              is_paid,
              pg_reference_id,
              created_at,
              updated_at
            `)
            .eq('order_id', payment.order_id);

          logger.debug('AutoLinkingPopup: Pre-update check:', {
            order_id: payment.order_id,
            checkData,
            checkError,
            dataLength: checkData?.length || 0
          });

          if (checkError) {
            logger.error('AutoLinkingPopup: Pre-update check error:', checkError);
            
            // ✅ ENHANCED: Specific error handling for common issues
            let errorMessage = 'Unknown database error';
            
            if (checkError?.message) {
              errorMessage = checkError.message;
            } else if (checkError?.error) {
              errorMessage = checkError.error;
            } else if (checkError?.code) {
              errorMessage = `Database error (Code: ${checkError.code})`;
            } else if (checkError?.details) {
              errorMessage = checkError.details;
            } else if (typeof checkError === 'string') {
              errorMessage = checkError;
            } else {
              errorMessage = `Koneksi database bermasalah. Silakan coba lagi atau refresh halaman.`;
            }
            
            // ✅ Specific error messages for Indonesian UI
            if (errorMessage.includes('permission denied') || errorMessage.includes('42501')) {
              errorMessage = 'Tidak memiliki izin akses. Silakan login ulang.';
            } else if (errorMessage.includes('connection') || errorMessage.includes('network')) {
              errorMessage = 'Koneksi internet bermasalah. Silakan coba lagi.';
            }
            
            throw new Error(`Pre-check failed: ${errorMessage}`);
          }

          if (!checkData || checkData.length === 0) {
            throw new Error('Payment not found in database');
          }

          const existingPayment = checkData[0];
          logger.debug('AutoLinkingPopup: Existing payment:', {
            order_id: existingPayment.order_id,
            current_user_id: existingPayment.user_id,
            current_email: existingPayment.email,
            is_paid: existingPayment.is_paid,
            payment_status: existingPayment.payment_status
          });

          if (existingPayment.user_id !== null) {
            throw new Error(`Payment already linked to user: ${existingPayment.user_id}`);
          }

          // ✅ SIMPLIFIED: Only user_id, email, and updated_at
          const updateData = {
            user_id: sanitizedUserId,
            email: currentUser.email,
            updated_at: new Date().toISOString()
          };

          logger.debug('AutoLinkingPopup: Update data:', updateData);

          // ✅ ENHANCED: Try stored function first (bypasses RLS), fallback to direct update
          let data, error, count;
          
          try {
            // Method 1: Use stored function that bypasses RLS
            logger.debug('AutoLinkingPopup: Trying stored function approach...');
            const { data: functionResult, error: functionError } = await supabaseClient
              .rpc('link_payment_to_user', {
                p_order_id: payment.order_id,
                p_user_id: sanitizedUserId,
                p_user_email: currentUser.email
              });

            if (!functionError && functionResult?.success) {
              logger.success('AutoLinkingPopup: Stored function succeeded!');
              data = [functionResult.data];
              error = null;
              count = 1;
            } else if (!functionError && !functionResult?.success) {
              logger.warn('AutoLinkingPopup: Stored function returned failure:', functionResult);
              throw new Error(functionResult?.error || 'Stored function failed');
            } else {
              logger.warn('AutoLinkingPopup: Stored function not available, trying direct update...', functionError);
              throw functionError;
            }
          } catch (funcError) {
            // Method 2: Fallback to direct update (original approach)
            logger.debug('AutoLinkingPopup: Fallback to direct update approach...');
            const updateResult = await supabaseClient
              .from('user_payments')
              .update(updateData)
              .eq('order_id', payment.order_id)
              .is('user_id', null) // ✅ SAFETY: Only update if still unlinked
              .select(`
                id,
                user_id,
                order_id,
                name,
                email,
                payment_status,
                is_paid,
                pg_reference_id,
                created_at,
                updated_at
              `);
            
            data = updateResult.data;
            error = updateResult.error;
            count = updateResult.count;
          }

          logger.debug('AutoLinkingPopup: Update result:', {
            order_id: payment.order_id,
            data,
            error,
            count,
            dataLength: data?.length || 0
          });

          if (error) {
            logger.error('AutoLinkingPopup: Database error for', payment.order_id, error);
            
            // ✅ ENHANCED: Better error detection
            if (error.message?.includes('invalid input syntax for type uuid')) {
              logger.error('AutoLinkingPopup: UUID syntax error:', {
                sanitizedUserId,
                updateData,
                originalUserId: currentUser.id,
                errorDetails: error
              });
              throw new Error('Invalid user ID format detected. Please logout and login again.');
            }
            
            if (error.code === '23505') {
              logger.error('AutoLinkingPopup: Constraint violation:', error);
              throw new Error('Constraint violation - payment may already be linked');
            }
            
            if (error.code === '42501') {
              logger.error('AutoLinkingPopup: Permission denied:', error);
              throw new Error('Permission denied - check RLS policies');
            }
            
            throw new Error(`Database error: ${error.message} (Code: ${error.code})`);
          }

          if (!data || data.length === 0) {
            // ✅ ENHANCED DEBUG: Detailed investigation of why no rows were updated
            console.error('🚨 DEBUG 250901: UPDATE returned no rows! Investigating...');
            
            // Check if payment still exists and get full details
            const { data: recheckData } = await supabaseClient
              .from('user_payments')
              .select('*') // Get ALL columns for debugging
              .eq('order_id', payment.order_id);

            // Check how many rows match each condition separately
            const { count: totalOrderMatches } = await supabaseClient
              .from('user_payments')
              .select('*', { count: 'exact', head: true })
              .eq('order_id', payment.order_id);

            const { count: userIdNullMatches } = await supabaseClient
              .from('user_payments')
              .select('*', { count: 'exact', head: true })
              .eq('order_id', payment.order_id)
              .is('user_id', null);

            const { count: paidMatches } = await supabaseClient
              .from('user_payments')
              .select('*', { count: 'exact', head: true })
              .eq('order_id', payment.order_id)
              .eq('is_paid', true);

            const { count: settledMatches } = await supabaseClient
              .from('user_payments')
              .select('*', { count: 'exact', head: true })
              .eq('order_id', payment.order_id)
              .eq('payment_status', 'settled');

            const { count: allConditionsMatch } = await supabaseClient
              .from('user_payments')
              .select('*', { count: 'exact', head: true })
              .eq('order_id', payment.order_id)
              .is('user_id', null)
              .eq('is_paid', true)
              .eq('payment_status', 'settled');

            const debugInfo = {
              error_code: '250901EYIRBGB',
              order_id: payment.order_id,
              attempted_user_id: sanitizedUserId,
              update_data: updateData,
              current_payment_data: recheckData?.[0],
              condition_analysis: {
                total_with_order_id: totalOrderMatches,
                with_null_user_id: userIdNullMatches,
                with_is_paid_true: paidMatches,
                with_settled_status: settledMatches,
                all_conditions_match: allConditionsMatch
              },
              potential_issues: []
            };

            // Analyze potential issues
            if (totalOrderMatches === 0) {
              debugInfo.potential_issues.push('Order ID not found in database');
            }
            if (userIdNullMatches === 0 && totalOrderMatches > 0) {
              debugInfo.potential_issues.push('Payment already has user_id (not null)');
            }
            if (paidMatches === 0 && totalOrderMatches > 0) {
              debugInfo.potential_issues.push('Payment is_paid is false');
            }
            if (settledMatches === 0 && totalOrderMatches > 0) {
              debugInfo.potential_issues.push('Payment status is not settled');
            }
            if (allConditionsMatch === 0) {
              debugInfo.potential_issues.push('No rows match all conditions for update');
            }

            console.error('🚨 DETAILED DEBUG INFO:', debugInfo);
            logger.error('AutoLinkingPopup: Detailed debug info for failed update:', debugInfo);

            // Provide specific error based on analysis
            if (recheckData?.[0]?.user_id !== null) {
              const linkedUserId = recheckData[0].user_id;
              if (linkedUserId === sanitizedUserId) {
                // Already linked to same user - treat as success
                logger.info('AutoLinkingPopup: Payment already linked to same user');
                results.push({
                  order_id: payment.order_id,
                  success: true,
                  data: recheckData[0],
                  note: 'Already linked to current user'
                });
                continue; // Skip to next payment
              } else {
                throw new Error(`Payment already linked to different user: ${linkedUserId}`);
              }
            } else if (totalOrderMatches === 0) {
              throw new Error(`Order ${payment.order_id} not found in database`);
            } else if (!recheckData?.[0]?.is_paid) {
              throw new Error(`Order ${payment.order_id} is not marked as paid (is_paid=${recheckData?.[0]?.is_paid})`);
            } else if (recheckData?.[0]?.payment_status !== 'settled') {
              throw new Error(`Order ${payment.order_id} status is '${recheckData?.[0]?.payment_status}', not 'settled'`);
            } else {
              throw new Error(`No rows updated for Order ${payment.order_id}. Debug: ${JSON.stringify(debugInfo.condition_analysis)}`);
            }
          }

          const updatedPayment = data[0];
          logger.success('AutoLinkingPopup: Successfully linked', payment.order_id, 'to user:', sanitizedUserId);
          logger.debug('AutoLinkingPopup: Updated payment data:', updatedPayment);
          
          results.push({
            order_id: payment.order_id,
            success: true,
            data: updatedPayment
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

      const successfulPayments = results.filter(r => r.success).map(r => r.data);
      if (successfulPayments.length > 0) {
        logger.success('AutoLinkingPopup: Successfully linked', successfulPayments.length, 'payments');
        if (onSuccess) {
          onSuccess(successfulPayments);
        }
        setIsDismissed(true);
      }

      // ✅ ENHANCED: Show specific error for UUID issues
      const uuidErrors = results.filter(r => !r.success && r.error.includes('Invalid user ID'));
      if (uuidErrors.length > 0) {
        alert('❌ UUID validation failed. Please logout and login again to fix user session.');
      }

    } catch (error) {
      logger.error('AutoLinkingPopup: General linking error:', error);
      
      if (error.message?.includes('Invalid user ID')) {
        alert('❌ User session issue detected. Please logout and login again.');
      }
    } finally {
      setIsLinking(false);
    }
  };

  const handleClose = (dismiss = false) => {
    if (dismiss) {
      setIsDismissed(true);
      logger.debug('AutoLinkingPopup: Dismissed - will not auto-retry');
    }
    
    setSelectedPayments([]);
    setLinkingResults([]);
    setShowResults(false);
    onClose();
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      logger.info('AutoLinkingPopup: User requested logout');
      
      await supabase.auth.signOut();
      
      setIsDismissed(true);
      handleClose(true);
      
      alert('✅ Successfully logged out. You can now login with a different account.');
      
    } catch (error) {
      logger.error('AutoLinkingPopup: Logout failed:', error);
      alert('❌ Logout failed: ' + error.message);
    } finally {
      setIsLoggingOut(false);
    }
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

  // Show countdown when popup is closed but will retry
  if (!isOpen && autoRetryTimer > 0 && !isDismissed && unlinkedPayments.length > 0) {
    return (
      <div className="fixed bottom-2 right-2 sm:bottom-4 sm:right-4 bg-white border border-orange-300 rounded-lg p-3 sm:p-4 max-w-xs sm:max-w-sm z-50">
        <div className="flex items-center gap-2 sm:gap-3 mb-3">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-medium text-gray-900 text-sm">Auto-Link Reminder</p>
            <p className="text-xs sm:text-sm text-gray-600">
              Popup will reopen in {autoRetryTimer}s
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => onClose()}
            className="flex-1 px-3 py-2 bg-orange-500 text-white rounded text-xs sm:text-sm hover:bg-orange-600 font-medium"
          >
            Open Now
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded text-xs sm:text-sm hover:bg-gray-400"
          >
            Stop
          </button>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  // ✅ Show user ID debug info in development
  const showDebugInfo = import.meta.env.DEV && currentUser;

  return (
    <div className="dialog-overlay-center p-2 sm:p-4">
      <div className="dialog-panel w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
        {/* Header with Enhanced Debug Info */}
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="p-2 bg-orange-100 rounded-lg flex-shrink-0">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 break-words">
                Pembayaran Terdeteksi
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Klik hubungkan untuk akses aplikasi
              </p>
              
              {/* ✅ ENHANCED DEBUG: Show detailed user info */}
              {showDebugInfo && (
                <div className="text-xs mt-2 bg-gray-100 p-2 rounded overflow-hidden">
                  <div className="font-mono space-y-1">
                    <div className={`${currentUser.id === 'null' ? 'text-red-600' : 'text-green-600'} break-all`}>
                      <strong>User ID:</strong> {currentUser.id} ({typeof currentUser.id})
                    </div>
                    <div className="break-all"><strong>Email:</strong> {currentUser.email}</div>
                    <div className="break-all"><strong>Sanitized:</strong> {sanitizeUserId(currentUser.id) || 'NULL'}</div>
                    <div><strong>UUID Valid:</strong> {sanitizeUserId(currentUser.id) ? '✅' : '❌'}</div>
                  </div>
                  {currentUser.id === 'null' && <div className="text-red-600 font-bold mt-1">⚠️ STRING NULL DETECTED!</div>}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
            <button
              onClick={handleLogout}
              disabled={isLinking || isLoggingOut}
              className="p-1.5 sm:p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 text-red-600"
              title="Logout and login with different account"
            >
              {isLoggingOut ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
            
            <button
              onClick={() => handleClose(false)}
              disabled={isLinking}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Close (will reopen in 10 seconds)"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 sm:p-6 max-h-[calc(95vh-140px)] sm:max-h-[calc(90vh-200px)] overflow-y-auto">
          {!showResults ? (
            /* Payment Selection */
            <>
              {/* User Info */}
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm sm:text-base break-all">
                        {currentUser?.email || 'Current User'}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        Akun yang akan dihubungkan
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    disabled={isLinking || isLoggingOut}
                    className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50 flex-shrink-0"
                  >
                    {isLoggingOut ? 'Logging out...' : 'Wrong account? Logout'}
                  </button>
                </div>
              </div>

              {unlinkedPayments.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-sm sm:text-base text-gray-600">Tidak ada pembayaran webhook yang terdeteksi</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">
                        Pembayaran Terdeteksi Webhook ({unlinkedPayments.length})
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Pembayaran ini terdeteksi otomatis oleh sistem webhook
                      </p>
                    </div>
                    <button
                      onClick={handleSelectAll}
                      className="text-xs sm:text-sm text-orange-600 hover:text-orange-700 font-medium self-start sm:self-auto"
                    >
                      {selectedPayments.length === unlinkedPayments.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {unlinkedPayments.map((payment) => (
                      <div
                        key={payment.order_id}
                        className={`border rounded-lg p-3 sm:p-4 cursor-pointer transition-all ${
                          selectedPayments.some(p => p.order_id === payment.order_id)
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handlePaymentToggle(payment)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                              <input
                                type="checkbox"
                                checked={selectedPayments.some(p => p.order_id === payment.order_id)}
                                onChange={() => handlePaymentToggle(payment)}
                                className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="font-mono text-xs sm:text-sm bg-gray-100 px-2 py-1 rounded break-all">
                                {payment.order_id}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                                payment.is_paid 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {payment.is_paid ? 'PAID' : 'PENDING'}
                              </span>
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 flex-shrink-0">
                                WEBHOOK
                              </span>
                              {/* Debug info */}
                              {showDebugInfo && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                                  USER_ID: {payment.user_id || 'NULL'}
                                </span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                              <div>
                                <span className="text-gray-500">Email:</span>
                                <span className="ml-2 font-medium break-all">
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
                                <span className="ml-2 font-mono text-xs break-all">
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
            </>
          ) : (
            /* Results Display */
            <>
              <div className="mb-4 sm:mb-6">
                <h3 className="font-medium text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">
                  Hasil Auto-Linking (DEBUG)
                </h3>
                <p className="text-xs sm:text-sm text-gray-500">
                  {linkingResults.filter(r => r.success).length} dari {linkingResults.length} pembayaran berhasil dihubungkan
                </p>
              </div>

              <div className="space-y-3">
                {linkingResults.map((result) => (
                  <div
                    key={result.order_id}
                    className={`border rounded-lg p-3 sm:p-4 ${
                      result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      {result.success ? (
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs sm:text-sm mb-1 break-all">
                          {result.order_id}
                        </div>
                        {result.success ? (
                          <p className="text-xs sm:text-sm text-green-700">
                            Berhasil dihubungkan ke akun Anda
                          </p>
                        ) : (
                          <div>
                            <p className="text-xs sm:text-sm text-red-700 break-words">
                              Gagal: {result.error}
                            </p>
                            {showDebugInfo && (
                              <p className="text-xs text-red-600 mt-1 font-mono">
                                Check console for detailed error info
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 sm:p-6">
          {!showResults ? (
            <div className="space-y-3">
              <div className="text-xs sm:text-sm text-gray-500 text-center">
                {selectedPayments.length > 0 && (
                  `${selectedPayments.length} dari ${unlinkedPayments.length} pembayaran dipilih`
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => handleClose(false)}
                  disabled={isLinking}
                  className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 order-2 sm:order-1"
                  title="Close temporarily (will reopen in 10s)"
                >
                  Tutup Sementara
                </button>
                
                <button
                  onClick={() => handleClose(true)}
                  disabled={isLinking}
                  className="flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-700 hover:bg-red-50 border border-red-300 rounded-lg transition-colors disabled:opacity-50 order-3 sm:order-2"
                  title="Dismiss permanently (won't reopen automatically)"
                >
                  Batal Permanen
                </button>
                
                <button
                  onClick={handleAutoLinkPayments}
                  disabled={selectedPayments.length === 0 || isLinking || sanitizeUserId(currentUser?.id) === null}
                  className="flex-1 sm:flex-none sm:min-w-0 px-4 sm:px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm order-1 sm:order-3"
                  title={sanitizeUserId(currentUser?.id) === null ? 'Invalid user ID - please logout and login again' : ''}
                >
                  {isLinking && <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />}
                  <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="font-medium">
                    {isLinking ? 'Menghubungkan...' : `Hubungkan ${selectedPayments.length}`}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="text-xs sm:text-sm text-gray-600">
                {linkingResults.filter(r => r.success).length > 0 && (
                  `${linkingResults.filter(r => r.success).length} pembayaran berhasil dihubungkan`
                )}
              </div>
              <button
                onClick={() => handleClose(true)}
                className="px-4 sm:px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
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