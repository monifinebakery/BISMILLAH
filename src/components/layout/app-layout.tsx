import { useState } from "react"
import { cn } from "@/lib/utils"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { Outlet } from "react-router-dom"

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden md:flex",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <Sidebar isCollapsed={sidebarCollapsed} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-y-0 left-0 w-64 bg-background shadow-lg">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div
        className={cn(
          "flex flex-col",
          "md:pl-64",
          sidebarCollapsed && "md:pl-16"
        )}
      >
        <Header onToggleSidebar={toggleSidebar} />
        
        <main className="flex-1 p-6">
          <div className="container max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}