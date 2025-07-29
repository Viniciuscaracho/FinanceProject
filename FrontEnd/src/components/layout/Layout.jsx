import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { cn } from '@/lib/utils'

export function Layout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 // Standard mobile breakpoint
      setIsMobile(mobile)
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false)
      }
      // Auto-collapse sidebar on smaller desktop screens
      if (window.innerWidth < 1200 && window.innerWidth >= 768) {
        setIsCollapsed(true)
      } else if (window.innerWidth >= 1200) {
        setIsCollapsed(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleMobileMenuClick = () => {
    setIsMobileOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {isMobile && isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out",
        isMobile && !isMobileOpen && "-translate-x-full",
        "md:relative md:translate-x-0"
      )}>
        <Sidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isMobile={isMobile}
          setIsMobileOpen={setIsMobileOpen}
        />
      </div>

      {/* Main content */}
      <div className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out",
        !isMobile && (isCollapsed ? "md:ml-12" : "md:ml-48")
      )}>
        {/* Header */}
        <Header onMobileMenuClick={handleMobileMenuClick} />
        
        {/* Main content area */}
        <main className="flex-1 p-1 md:p-2 lg:p-4">
          <div className="w-full max-w-none">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

