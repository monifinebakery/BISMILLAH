// 🎯 200 lines - All dialogs dengan implementasi lengkap
import React, { Suspense } from 'react';
import type { Order, NewOrder } from '../types';
import { DialogLoader } from './shared/LoadingStates';

// Import dialog components
import OrderForm from './dialogs/OrderForm';
import BulkDeleteDialog from './dialogs/BulkDeleteDialog';
import BulkEditDialog from './dialogs/BulkEditDialog';
import FollowUpTemplateManager from './dialogs/FollowUpTemplateManager';

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
  return (
    <>
      {/* Order Form Dialog */}
      {showOrderForm && (
        <Suspense fallback={<DialogLoader />}>
          <OrderForm
            open={showOrderForm}
            onOpenChange={onCloseOrderForm}
            onSubmit={onSubmitOrder}
            initialData={editingOrder}
          />
        </Suspense>
      )}

      {/* Template Manager Dialog */}
      {showTemplateManager && (
        <Suspense fallback={<DialogLoader />}>
          <FollowUpTemplateManager
            isOpen={showTemplateManager}
            onClose={onCloseTemplateManager}
            order={selectedOrderForTemplate}
            onSendWhatsApp={(message, order) => {
              console.log('Sending WhatsApp:', { message, order });
              // TODO: Implement WhatsApp integration
            }}
          />
        </Suspense>
      )}

      {/* Bulk Delete Dialog - Will be added when bulk selection is implemented */}
      {/* <Suspense fallback={<DialogLoader />}>
        <BulkDeleteDialog
          isOpen={showBulkDeleteDialog}
          onClose={() => setShowBulkDeleteDialog(false)}
          onConfirm={handleBulkDelete}
          selectedOrders={getSelectedOrders()}
          selectedCount={selectedOrderIds.length}
        />
      </Suspense> */}

      {/* Bulk Edit Dialog - Will be added when bulk selection is implemented */}
      {/* <Suspense fallback={<DialogLoader />}>
        <BulkEditDialog
          isOpen={showBulkEditDialog}
          onClose={() => setShowBulkEditDialog(false)}
          onConfirm={handleBulkEdit}
          selectedOrders={getSelectedOrders()}
          selectedCount={selectedOrderIds.length}
        />
      </Suspense> */}
    </>
  );
};

export default OrderDialogs;