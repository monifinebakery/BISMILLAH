import { motion, HTMLMotionProps } from "framer-motion"
import { Button, ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AnimatedButtonProps extends ButtonProps {
  motionProps?: Omit<HTMLMotionProps<"button">, "children">
  enableHoverScale?: boolean
  enableTap?: boolean
}

export function AnimatedButton({
  children,
  className,
  motionProps = {},
  enableHoverScale = true,
  enableTap = true,
  ...buttonProps
}: AnimatedButtonProps) {
  const defaultMotionProps: HTMLMotionProps<"button"> = {
    whileHover: enableHoverScale ? { scale: 1.02 } : undefined,
    whileTap: enableTap ? { scale: 0.98 } : undefined,
    transition: { type: "spring", stiffness: 400, damping: 17 },
    ...motionProps
  }

  return (
    <Button
      asChild
      className={cn("cursor-pointer", className)}
      {...buttonProps}
    >
      <motion.button
        {...defaultMotionProps}
      >
        {children}
      </motion.button>
    </Button>
  )
}

// Floating Action Button with pulse animation
export function FloatingActionButton({
  children,
  className,
  ...props
}: AnimatedButtonProps) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={cn(
        "fixed bottom-6 right-6 z-50",
        className
      )}
    >
      <Button
        size="lg"
        className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-300"
        {...props}
      >
        {children}
      </Button>
    </motion.div>
  )
}

// Loading button with spinner
interface LoadingButtonProps extends AnimatedButtonProps {
  loading?: boolean
  loadingText?: string
}

export function LoadingButton({
  children,
  loading = false,
  loadingText = "Loading...",
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <AnimatedButton
      disabled={disabled || loading}
      enableHoverScale={!loading}
      enableTap={!loading}
      {...props}
    >
      <motion.div
        className="flex items-center gap-2"
        animate={{ opacity: loading ? 0.7 : 1 }}
      >
        {loading && (
          <motion.div
            className="h-4 w-4 border-2 border-current border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        )}
        <span>{loading ? loadingText : children}</span>
      </motion.div>
    </AnimatedButton>
  )
}