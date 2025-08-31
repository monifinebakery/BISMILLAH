import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface AccessibleDialogTemplateProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  hideTitle?: boolean; // If true, title will be visually hidden but still accessible
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  primaryAction?: {
    label: string;
    onClick: () => void;
    isLoading?: boolean;
    variant?: 'default' | 'destructive';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * AccessibleDialogTemplate - A fully accessible and responsive dialog template
 * Features:
 * - Proper DialogTitle for screen readers (can be visually hidden)
 * - Responsive design for mobile and iPad
 * - Keyboard navigation
 * - ARIA attributes
 * - Loading states
 */
export const AccessibleDialogTemplate: React.FC<AccessibleDialogTemplateProps> = ({
  isOpen,
  onClose,
  title,
  description,
  hideTitle = false,
  children,
  size = 'md',
  primaryAction,
  secondaryAction,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className={`
          sm:max-w-md
          ${size === 'sm' ? 'sm:max-w-sm' : ''}
          ${size === 'lg' ? 'sm:max-w-lg lg:max-w-2xl' : ''}
          ${size === 'xl' ? 'sm:max-w-xl lg:max-w-4xl' : ''}
          max-h-[90vh] 
          overflow-y-auto
          mx-4 
          sm:mx-auto
          w-full
          sm:w-auto
        `}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={() => onClose()}
      >
        <DialogHeader className="pb-4">
          {hideTitle ? (
            <VisuallyHidden>
              <DialogTitle>{title}</DialogTitle>
            </VisuallyHidden>
          ) : (
            <DialogTitle className="text-lg font-semibold text-gray-900 pr-8">
              {title}
            </DialogTitle>
          )}
          
          {description && (
            <DialogDescription className="text-sm text-gray-600 mt-2">
              {description}
            </DialogDescription>
          )}
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        <div className="py-4 space-y-4 max-w-none overflow-x-auto">
          {children}
        </div>

        {(primaryAction || secondaryAction) && (
          <DialogFooter className="pt-4 space-y-2 sm:space-y-0 sm:space-x-2 flex flex-col sm:flex-row">
            {secondaryAction && (
              <Button
                variant="outline"
                onClick={secondaryAction.onClick}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                {secondaryAction.label}
              </Button>
            )}
            {primaryAction && (
              <Button
                variant={primaryAction.variant || 'default'}
                onClick={primaryAction.onClick}
                disabled={primaryAction.isLoading}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                {primaryAction.isLoading ? 'Loading...' : primaryAction.label}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Example usage component
export const ExampleDialog: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Open Dialog
      </Button>
      
      <AccessibleDialogTemplate
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Example Dialog"
        description="This is an example of a fully accessible and responsive dialog."
        size="md"
        primaryAction={{
          label: "Save Changes",
          onClick: () => {
            // Handle save
            setIsOpen(false);
          }
        }}
        secondaryAction={{
          label: "Cancel",
          onClick: () => setIsOpen(false)
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This content area is responsive and will work well on mobile devices,
            tablets, and desktop screens.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium">Section 1</h4>
              <p className="text-sm text-gray-600">Content goes here</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium">Section 2</h4>
              <p className="text-sm text-gray-600">Content goes here</p>
            </div>
          </div>
        </div>
      </AccessibleDialogTemplate>
    </>
  );
};

export default AccessibleDialogTemplate;
