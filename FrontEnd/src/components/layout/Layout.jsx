import { useState, useEffect, useCallback } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { BottomNavigation } from './BottomNavigation'
import { SupportBanner } from './SupportBanner'
import { cn } from '@/lib/utils'
import { useTheme } from '../../contexts/ThemeContext'

export function Layout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Inicializar baseado no tamanho da tela, mas permitir controle manual depois
    if (typeof window !== 'undefined') {
      const width = window.innerWidth
      if (width >= 768 && width < 1024) return true // Small desktop - colapsado
      if (width >= 1440) return false // Large desktop - expandido
      return false // Default - expandido
    }
    return false
  })
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isManualControl, setIsManualControl] = useState(false) // Flag para controle manual
  const { isDarkMode } = useTheme()

  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth
      const mobile = width < 768 // Standard mobile breakpoint
      setIsMobile(mobile)
      
      if (width >= 768) {
        setIsMobileOpen(false)
      }
      
      // Só aplicar auto-collapse se não estiver em controle manual
      // Auto-collapse apenas em mudanças significativas de tamanho
      if (!isManualControl) {
        if (width >= 768 && width < 1024) {
          // Small desktop - colapsar
          setIsCollapsed(true)
        } else if (width >= 1440) {
          // Large desktop - expandir
          setIsCollapsed(false)
        }
      }
    }

    checkMobile()
    
    // Debounce resize para melhor performance
    let resizeTimer
    const handleResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(checkMobile, 150)
    }
    
    window.addEventListener('resize', handleResize)
    
    // Usar Visual Viewport API se disponível (melhor para zoom)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize)
      window.visualViewport.addEventListener('scroll', handleResize)
    }
    
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(resizeTimer)
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize)
        window.visualViewport.removeEventListener('scroll', handleResize)
      }
    }
  }, [isManualControl])

  // Handler para toggle manual do sidebar
  const handleToggleSidebar = useCallback(() => {
    setIsManualControl(true) // Ativar controle manual ao primeiro toggle
    setIsCollapsed(prev => !prev) // Toggle o estado
  }, [])

  const handleMobileMenuClick = () => {
    setIsMobileOpen(true)
  }

  return (
    <div className={cn(
      "min-h-screen flex gap-0 w-full max-w-full overflow-x-hidden",
      isDarkMode ? "bg-gray-900" : "bg-gray-50"
    )}>
      {/* Mobile overlay */}
      {isMobile && isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar - Desktop only */}
      {!isMobile && (
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out",
          // No desktop: quando expandido é relative (ocupa espaço natural, sem margin no conteúdo)
          // quando colapsado continua fixed (precisa margin no conteúdo)
          !isCollapsed && "md:relative md:translate-x-0 md:flex-shrink-0",
          isCollapsed && "md:fixed"
        )}>
          <Sidebar
            isCollapsed={isCollapsed}
            setIsCollapsed={handleToggleSidebar}
            isMobile={false}
            setIsMobileOpen={setIsMobileOpen}
          />
        </div>
      )}

      {/* Sidebar - Mobile drawer */}
      {isMobile && (
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out",
          !isMobileOpen && "-translate-x-full"
        )}>
          <Sidebar
            isCollapsed={false}
            setIsCollapsed={setIsCollapsed}
            isMobile={true}
            setIsMobileOpen={setIsMobileOpen}
          />
        </div>
      )}

      {/* Main content */}
      <div className={cn(
        "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out",
        "w-full max-w-full min-w-0 overflow-x-hidden",
        // Quando sidebar está expandido (relative), ele já empurra o conteúdo naturalmente
        // Quando colapsado (fixed), precisa de margin para não ficar embaixo
        !isMobile && isCollapsed && "md:ml-14",
        // Mobile padding para bottom navigation
        isMobile && "pb-16"
      )}>
        {/* Header */}
        <Header 
          onMobileMenuClick={handleMobileMenuClick}
          isMobile={isMobile}
        />
        
        {/* Support Banner */}
        <SupportBanner />
        
        {/* Main content area */}
        <main className={cn(
          "flex-1 w-full max-w-full min-w-0",
          isMobile 
            ? "p-2 sm:p-3 pb-4" 
            : "p-2 md:p-4 lg:p-6 xl:p-8"
        )}>
          <div className="w-full max-w-full min-w-0">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Navigation - Mobile only */}
      {isMobile && <BottomNavigation />}
    </div>
  )
}

