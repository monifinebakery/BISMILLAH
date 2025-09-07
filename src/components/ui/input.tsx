import * as React from "react"

import { cn } from "@/lib/utils"

interface InputProps extends React.ComponentProps<"input"> {
  mobileOptimized?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, mobileOptimized = false, ...props }, ref) => {
    // Mobile optimization attributes for number inputs
    const mobileAttrs = mobileOptimized && type === "number" ? {
      inputMode: "decimal" as const,
      pattern: "[0-9]*",
      "data-mobile-input": true
    } : {};
    
    return (
      <input
        type={type}
        className={cn(
          // Base styles with improved mobile touch targets
          "flex w-full rounded-md border-[1.5px] border-gray-300 dark:border-gray-600 bg-background px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-orange-400 dark:focus-visible:border-orange-500 disabled:cursor-not-allowed disabled:opacity-50",
          // Mobile-responsive height and font size
          "h-11 text-base sm:h-10 md:text-sm",
          // Improved mobile touch targets for small inputs
          mobileOptimized && "min-h-[44px] text-base sm:min-h-[40px]",
          className
        )}
        ref={ref}
        {...mobileAttrs}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
