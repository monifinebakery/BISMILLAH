// 🎯 200 lines - All dialogs placeholder (will be implemented later)
import React, { Suspense } from 'react';
import type { Order, NewOrder } from '../types';
import { DialogLoader } from '../shared/LoadingStates';

// Lazy load dialog components (when implemented)
// const OrderForm = React.lazy(() => import('./dialogs/OrderForm'));
// const BulkDeleteDialog = React.lazy(() => import('./dialogs/BulkDeleteDialog'));
// const BulkEditDialog = React.lazy(() => import('./dialogs/BulkEditDialog'));
// const FollowUpTemplateManager = React.lazy(() => import('./dialogs/FollowUpTemplateManager'));

interface OrderDialogsProps {
  showOrderForm: boolean;
  editingOrder: Order | null;
  showTemplateManager: boolean;
  selectedOrderForTemplate: Order | null;
  onSubmitOrder: (data: Partial<Order> | Partial<NewOrder>) => void;
  onCloseOrderForm: () => void;
  onCloseTemplateManager: () => void;
}

const OrderDialogs: React.FC<OrderDialogsProps> = ({
  showOrderForm,
  editingOrder,
  showTemplateManager,
  selectedOrderForTemplate,
  onSubmitOrder,
  onCloseOrderForm,
  onCloseTemplateManager
}) => {
  // Placeholder implementation
  // In real implementation, this would render the actual dialogs
  
  return (
    <>
      {/* Order Form Dialog */}
      {showOrderForm && (
        <Suspense fallback={<DialogLoader />}>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">
                {editingOrder ? 'Edit Pesanan' : 'Pesanan Baru'}
              </h3>
              <p className="text-gray-600 mb-4">
                Dialog form akan diimplementasi nanti...
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={onCloseOrderForm}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    // Placeholder save action
                    onSubmitOrder({
                      namaPelanggan: 'Test Customer',
                      totalPesanan: 100000,
                      items: []
                    });
                  }}
                  className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </Suspense>
      )}

      {/* Template Manager Dialog */}
      {showTemplateManager && (
        <Suspense fallback={<DialogLoader />}>
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Template Manager</h3>
              <p className="text-gray-600 mb-4">
                Template manager akan diimplementasi nanti...
              </p>
              <div className="flex justify-end">
                <button
                  onClick={onCloseTemplateManager}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </Suspense>
      )}
    </>
  );
};

export default OrderDialogs;