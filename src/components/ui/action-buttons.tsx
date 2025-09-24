import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// Interface for action items
interface ActionItem {
  type: 'primary' | 'secondary' | 'destructive';
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon?: React.ComponentType<any>;
}

interface ActionButtonsProps {
  onCancel?: () => void;
  onSubmit?: () => void;
  submitText?: string;
  cancelText?: string;
  isLoading?: boolean;
  disabled?: boolean;
  submitVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  cancelVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  showCancel?: boolean;
  className?: string;
  submitClassName?: string;
  cancelClassName?: string;
  /** Custom buttons to show instead of default cancel/submit */
  children?: React.ReactNode;
  /** Layout direction */
  direction?: 'row' | 'col';
  /** Array of custom actions (used by dialogs) */
  actions?: ActionItem[];
  /** Loading text for custom actions */
  loadingText?: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onCancel,
  onSubmit,
  submitText = 'Simpan',
  cancelText = 'Batal',
  isLoading = false,
  disabled = false,
  submitVariant = 'default',
  cancelVariant = 'outline',
  showCancel = true,
  className,
  submitClassName,
  cancelClassName,
  children,
  direction = 'row',
  actions,
  loadingText,
}) => {
  // If actions array is provided, use custom actions layout
  if (actions && actions.length > 0) {
    return (
      <div className={cn(
        'flex gap-2',
        direction === 'col' ? 'flex-col' : 'flex-col-reverse sm:flex-row sm:justify-end',
        className
      )}>
        {actions.map((action, index) => {
          const Icon = action.icon;
          const isDisabled = action.disabled || isLoading;
          
          return (
            <Button
              key={index}
              type="button"
              variant={action.type === 'primary' ? 'default' : action.type === 'destructive' ? 'destructive' : 'outline'}
              onClick={action.onClick}
              disabled={isDisabled}
              className={cn(
                'input-mobile-safe',
                action.type === 'primary' && 'bg-orange-500 hover:bg-orange-600',
                submitClassName
              )}
            >
              {isLoading && loadingText && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {Icon && <Icon className="h-4 w-4 mr-2" />}
              <span className="text-overflow-safe">
                {isLoading && loadingText ? loadingText : action.label}
              </span>
            </Button>
          );
        })}
      </div>
    );
  }

  // If children provided, use custom layout
  if (children) {
    return (
      <div className={cn(
        'flex gap-2',
        direction === 'col' ? 'flex-col' : 'flex-col-reverse sm:flex-row sm:justify-end',
        className
      )}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn(
      'flex gap-2',
      direction === 'col' 
        ? 'flex-col' 
        : 'flex-col-reverse sm:flex-row sm:justify-end dialog-responsive-buttons',
      className
    )}>
      
      {/* Cancel Button */}
      {showCancel && onCancel && (
        <Button
          type="button"
          variant={cancelVariant}
          onClick={onCancel}
          disabled={isLoading || disabled}
          className={cn('input-mobile-safe', cancelClassName)}
        >
          <span className="text-overflow-safe">{cancelText}</span>
        </Button>
      )}

      {/* Submit Button */}
      {onSubmit && (
        <Button
          type="submit"
          variant={submitVariant}
          onClick={onSubmit}
          disabled={isLoading || disabled}
          className={cn(
            'input-mobile-safe',
            submitVariant === 'default' && 'bg-orange-500 hover:bg-orange-600',
            submitClassName
          )}
        >
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <span className="text-overflow-safe">{submitText}</span>
        </Button>
      )}
    </div>
  );
};

/**
 * Preset untuk form actions yang umum
 */
const FormActions = {
  // Basic Save/Cancel
  SaveCancel: (props: Partial<ActionButtonsProps>) => (
    <ActionButtons
      submitText="Simpan"
      cancelText="Batal"
      {...props}
    />
  ),

  // Create/Cancel  
  CreateCancel: (props: Partial<ActionButtonsProps>) => (
    <ActionButtons
      submitText="Buat"
      cancelText="Batal"
      {...props}
    />
  ),

  // Update/Cancel
  UpdateCancel: (props: Partial<ActionButtonsProps>) => (
    <ActionButtons
      submitText="Perbarui"
      cancelText="Batal"
      {...props}
    />
  ),

  // Delete/Cancel (Destructive)
  DeleteCancel: (props: Partial<ActionButtonsProps>) => (
    <ActionButtons
      submitText="Hapus"
      cancelText="Batal"
      submitVariant="destructive"
      {...props}
    />
  ),

  // Continue/Back (Navigation)
  ContinueBack: (props: Partial<ActionButtonsProps>) => (
    <ActionButtons
      submitText="Lanjutkan"
      cancelText="Kembali"
      {...props}
    />
  ),

  // OK/Cancel (Confirmation)
  OkCancel: (props: Partial<ActionButtonsProps>) => (
    <ActionButtons
      submitText="OK"
      cancelText="Batal"
      {...props}
    />
  ),
};

export { ActionButtons, FormActions };
export type { ActionButtonsProps, ActionItem };
