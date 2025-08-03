import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OrderConfirmationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (payment: any) => void;
}

const OrderConfirmationPopup = ({ isOpen, onClose, onSuccess }: OrderConfirmationPopupProps) => {
  const [orderId, setOrderId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirmOrder = async () => {
    if (!orderId.trim()) {
      setError('Please enter your Order ID');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Please log in first');
        return;
      }

      // Find payment by order_id
      const { data: payment, error: findError } = await supabase
        .from('user_payments')
        .select('*')
        .eq('order_id', orderId.trim())
        .single();

      if (findError || !payment) {
        setError('Order ID not found. Please check and try again.');
        return;
      }

      if (payment.user_id && payment.user_id !== user.id) {
        setError('This order is already linked to another account.');
        return;
      }

      // Link payment to current user
      const { error: updateError } = await supabase
        .from('user_payments')
        .update({
          user_id: user.id,
          email: user.email
        })
        .eq('order_id', orderId.trim());

      if (updateError) {
        setError('Failed to link order. Please try again.');
        return;
      }

      onSuccess?.(payment);
      onClose();
      setOrderId('');
      
    } catch (error) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Link Your Payment</h2>
        
        <p className="text-gray-600 mb-4">
          Enter your Order ID to link your payment to your account:
        </p>
        
        <input
          type="text"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value.toUpperCase())}
          placeholder="e.g., 250803WIJAUFI"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          disabled={isLoading}
        />
        
        {error && (
          <div className="text-red-600 text-sm mb-4">
            {error}
          </div>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={() => {
              onClose();
              setOrderId('');
              setError('');
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={isLoading}
          >
            Cancel
          </button>
          
          <button
            onClick={handleConfirmOrder}
            disabled={isLoading || !orderId.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Linking...' : 'Link Payment'}
          </button>
        </div>
        
        <div className="mt-4 text-xs text-gray-500">
          💡 Your Order ID can be found in your payment confirmation email or receipt.
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPopup;