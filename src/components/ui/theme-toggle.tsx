import * as React from "react"
import { useTheme } from "@/lib/theme"
import { Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"

export const ThemeToggle = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => setMounted(true), [])
    if (!mounted) return null

    const isDark = theme === "dark"

    return (
      <button
        ref={ref}
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={cn("flex items-center gap-2 rounded p-2", className)}
        {...props}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        {children ? children : <span className="sr-only">Toggle tema</span>}
      </button>
    )
  }
)

ThemeToggle.displayName = "ThemeToggle"
