
import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

function hasDialogDescription(children: React.ReactNode): boolean {
  return React.Children.toArray(children).some((child) => {
    if (!React.isValidElement(child)) return false
    if (child.type === DialogDescription) return true
    return child.props?.children ? hasDialogDescription(child.props.children) : false
  })
}

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[75] bg-black/60 backdrop-blur-[2px]",
      "data-[state=open]:animate-in data-[state=closed]:animate-out", 
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "data-[state=open]:duration-200 data-[state=closed]:duration-150",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

type CenterMode = "translate" | "overlay"

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    hideCloseButton?: boolean
    /** 
     * "overlay" → full-screen overlay with centered panel (recommended for forms).
     * "translate" (default) → fixed position with transform centering (shadcn style).
     */
    centerMode?: CenterMode
    /**
     * Size variant for the dialog
     */
    size?: "sm" | "md" | "md+" | "lg" | "xl" | "full"
  }
>(({ className, children, hideCloseButton = false, centerMode = "translate", size = "md", ...props }, ref) => {
  const hasDescription = hasDialogDescription(children)
  const mergedProps = {
    ...props,
    ...(!hasDescription && !("aria-describedby" in props) ? { "aria-describedby": undefined } : {}),
  }

  // Size classes for translate mode
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg", 
    "md+": "max-w-xl",
    lg: "max-w-2xl",
    xl: "max-w-3xl",
    full: "max-w-[95vw]"
  }

  // Base classes per mode
  const baseClassByMode: Record<CenterMode, string> = {
    // Mode overlay: container for child panel
    overlay:
      "fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-4 outline-none",
    // Mode translate: direct panel styling (shadcn-compatible)
    translate:
      `fixed left-1/2 top-1/2 z-[75] w-full ${sizeClasses[size]} -translate-x-1/2 -translate-y-1/2 ` +
      "border bg-background shadow-2xl duration-200 mx-auto rounded-xl " +
      // Enhanced animations
      "data-[state=open]:animate-in data-[state=closed]:animate-out " +
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 " +
      "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 " +
      "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] " +
      "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] " +
      // Better height management
      "max-h-[90dvh] overflow-hidden flex flex-col",
  }

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(baseClassByMode[centerMode], className)}
        {...mergedProps}
      >
        {centerMode === "overlay" ? (
          <div
            className={cn(
              "relative w-full mx-auto",
              sizeClasses[size],
              "border bg-background shadow-2xl duration-200 rounded-xl",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              "max-h-[90dvh] overflow-hidden flex flex-col"
            )}
          >
            {children}
            {!hideCloseButton && (
              <DialogPrimitive.Close
                className={cn(
                  "absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background",
                  "transition-all duration-200 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "disabled:pointer-events-none p-1",
                  "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                )}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            )}
          </div>
        ) : (
          <>
            {children}
            {!hideCloseButton && (
              <DialogPrimitive.Close
                className={cn(
                  "absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background",
                  "transition-all duration-200 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "disabled:pointer-events-none p-1"
                )}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            )}
          </>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div 
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      "flex-shrink-0", // Prevent header from shrinking
      className
    )} 
    {...props} 
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div 
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      "gap-2 sm:gap-0", // Better spacing on mobile
      "flex-shrink-0", // Prevent footer from shrinking
      className
    )} 
    {...props} 
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title 
    ref={ref} 
    className={cn(
      "text-lg sm:text-xl font-semibold leading-none tracking-tight",
      "text-gray-900 dark:text-gray-100",
      className
    )} 
    {...props} 
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description 
    ref={ref} 
    className={cn(
      "text-sm text-muted-foreground leading-relaxed",
      "mt-2",
      className
    )} 
    {...props} 
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
