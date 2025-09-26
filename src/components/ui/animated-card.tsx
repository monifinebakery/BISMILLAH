import { motion, HTMLMotionProps } from "framer-motion"
import { Card, CardProps } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface AnimatedCardProps extends CardProps {
  motionProps?: Omit<HTMLMotionProps<"div">, "children">
  enableHover?: boolean
  hoverScale?: number
  delay?: number
}

export function AnimatedCard({
  children,
  className,
  motionProps = {},
  enableHover = true,
  hoverScale = 1.02,
  delay = 0,
  ...cardProps
}: AnimatedCardProps) {
  const defaultMotionProps: HTMLMotionProps<"div"> = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { 
      duration: 0.5, 
      delay,
      ease: "easeOut"
    },
    whileHover: enableHover ? { 
      scale: hoverScale,
      transition: { type: "spring", stiffness: 400, damping: 17 }
    } : undefined,
    ...motionProps
  }

  return (
    <Card
      asChild
      className={cn("cursor-pointer", className)}
      {...cardProps}
    >
      <motion.div {...defaultMotionProps}>
        {children}
      </motion.div>
    </Card>
  )
}

// Stats card with counter animation
interface StatsCardProps extends AnimatedCardProps {
  value: number
  previousValue?: number
  suffix?: string
  prefix?: string
  animateValue?: boolean
}

export function StatsCard({
  value,
  previousValue = 0,
  suffix = "",
  prefix = "",
  animateValue = true,
  children,
  ...props
}: StatsCardProps) {
  return (
    <AnimatedCard {...props}>
      <div className="space-y-2">
        <div className="text-2xl font-bold">
          {animateValue ? (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.span
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 100,
                  delay: 0.3,
                  duration: 0.8
                }}
              >
                {prefix}
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    duration: 1,
                    delay: 0.4
                  }}
                >
                  {value.toLocaleString()}
                </motion.span>
                {suffix}
              </motion.span>
            </motion.span>
          ) : (
            `${prefix}${value.toLocaleString()}${suffix}`
          )}
        </div>
        {children}
      </div>
    </AnimatedCard>
  )
}

// Grid container for animated cards
interface AnimatedGridProps {
  children: React.ReactNode
  stagger?: number
  className?: string
}

export function AnimatedGrid({
  children,
  stagger = 0.1,
  className
}: AnimatedGridProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 10 }
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("grid gap-6 md:grid-cols-2 lg:grid-cols-4", className)}
    >
      {Array.isArray(children) 
        ? children.map((child, index) => (
            <motion.div key={index} variants={itemVariants}>
              {child}
            </motion.div>
          ))
        : <motion.div variants={itemVariants}>{children}</motion.div>
      }
    </motion.div>
  )
}

// Hover lift card
export function HoverCard({
  children,
  className,
  ...props
}: AnimatedCardProps) {
  return (
    <motion.div
      whileHover={{
        y: -8,
        transition: { type: "spring", stiffness: 400, damping: 17 }
      }}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-shadow duration-300",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}