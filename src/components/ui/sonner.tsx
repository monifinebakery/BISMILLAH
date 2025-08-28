import { Toaster as Sonner, toast } from "sonner"
import React from 'react'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-right"
      expand={true}
      visibleToasts={4}
      closeButton={true}
      richColors={true}
      theme="light"
      toastOptions={{
        duration: 5000,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg select-none cursor-pointer",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          closeButton:
            "group-[.toast]:bg-black/10 group-[.toast]:text-foreground/80 group-[.toast]:border-0 hover:group-[.toast]:bg-black/20 group-[.toast]:left-auto group-[.toast]:right-2 group-[.toast]:top-2",
          success: "group-[.toast]:bg-green-50 group-[.toast]:border-green-200 group-[.toast]:text-green-900",
          error: "group-[.toast]:bg-red-50 group-[.toast]:border-red-200 group-[.toast]:text-red-900",
          warning: "group-[.toast]:bg-yellow-50 group-[.toast]:border-yellow-200 group-[.toast]:text-yellow-900",
          info: "group-[.toast]:bg-blue-50 group-[.toast]:border-blue-200 group-[.toast]:text-blue-900",
        },
      }}
      {...props}
    />
  )
}

// Enhanced toast functions with swipe hints
const enhancedToast = {
  ...toast,
  success: (message: string, options?: any) => {
    return toast.success(message, {
      ...options,
      description: options?.description || "👆 Swipe right or click ✕ to dismiss"
    })
  },
  error: (message: string, options?: any) => {
    return toast.error(message, {
      ...options, 
      description: options?.description || "👆 Swipe right or click ✕ to dismiss"
    })
  },
  warning: (message: string, options?: any) => {
    return toast.warning(message, {
      ...options,
      description: options?.description || "👆 Swipe right or click ✕ to dismiss"
    })
  },
  info: (message: string, options?: any) => {
    return toast.info(message, {
      ...options,
      description: options?.description || "👆 Swipe right or click ✕ to dismiss"
    })
  },
  message: (message: string, options?: any) => {
    return toast.message(message, {
      ...options,
      description: options?.description || "👆 Swipe right or click ✕ to dismiss"
    })
  }
}

export { Toaster, enhancedToast as toast }
