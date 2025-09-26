import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimatedContainerProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
  delay?: number
  duration?: number
  variant?: "fadeIn" | "slideUp" | "slideLeft" | "slideRight" | "scaleIn"
}

const variants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
  },
  slideLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  },
  slideRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 }
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  }
}

export function AnimatedContainer({
  children,
  delay = 0,
  duration = 0.5,
  variant = "fadeIn",
  className,
  ...props
}: AnimatedContainerProps) {
  const selectedVariant = variants[variant]

  return (
    <motion.div
      initial={selectedVariant.initial}
      animate={selectedVariant.animate}
      exit={selectedVariant.exit}
      transition={{
        duration,
        delay,
        ease: "easeOut"
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Staggered children animation container
interface StaggeredContainerProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
  stagger?: number
  variant?: "fadeIn" | "slideUp"
}

export function StaggeredContainer({
  children,
  stagger = 0.1,
  variant = "slideUp",
  className,
  ...props
}: StaggeredContainerProps) {
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
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 }
    },
    slideUp: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(className)}
      {...props}
    >
      {Array.isArray(children)
        ? children.map((child, index) => (
            <motion.div key={index} variants={itemVariants[variant]}>
              {child}
            </motion.div>
          ))
        : <motion.div variants={itemVariants[variant]}>{children}</motion.div>
      }
    </motion.div>
  )
}