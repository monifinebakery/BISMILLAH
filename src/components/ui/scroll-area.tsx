import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
import { cn } from "@/lib/utils"

interface ScrollAreaProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  className?: string
  children: React.ReactNode
  // Enhanced props
  hideScrollbar?: boolean
  scrollbarSize?: 'sm' | 'md' | 'lg'
  thumbClassName?: string
}

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  ScrollAreaProps
>(({ className, children, hideScrollbar = false, scrollbarSize = 'md', thumbClassName, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    {!hideScrollbar && <ScrollBar size={scrollbarSize} thumbClassName={thumbClassName} />}
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

interface ScrollBarProps extends React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> {
  className?: string
  orientation?: "vertical" | "horizontal"
  size?: 'sm' | 'md' | 'lg'
  thumbClassName?: string
}

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  ScrollBarProps
>(({ className, orientation = "vertical", size = 'md', thumbClassName, ...props }, ref) => {
  const sizeClasses = {
    sm: orientation === "vertical" ? "w-1.5" : "h-1.5",
    md: orientation === "vertical" ? "w-2.5" : "h-2.5", 
    lg: orientation === "vertical" ? "w-4" : "h-4"
  }

  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      ref={ref}
      orientation={orientation}
      className={cn(
        "flex touch-none select-none transition-colors",
        orientation === "vertical" &&
          "h-full border-l border-l-transparent p-[1px]",
        orientation === "horizontal" &&
          "flex-col border-t border-t-transparent p-[1px]",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb 
        className={cn(
          "relative flex-1 rounded-full bg-border hover:bg-border/80 transition-colors",
          thumbClassName
        )} 
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
})
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }