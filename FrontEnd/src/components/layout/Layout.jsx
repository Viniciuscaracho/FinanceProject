import { useState, useEffect, useCallback, useMemo } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { BottomNavigation } from './BottomNavigation'
import { SupportBanner } from './SupportBanner'
import { cn } from '@/lib/utils'
import { useTheme } from '../../contexts/ThemeContext'
import { useIsMobile, useBreakpoint } from '@/hooks/use-mobile'
import { BREAKPOINTS } from '@/lib/breakpoints'
import { ArrowUp } from 'lucide-react'

export function Layout({ children }) {
  const isMobile = useIsMobile()
  const breakpoint = useBreakpoint()
  
  // Inicializar estado do sidebar baseado no breakpoint
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const width = window.visualViewport?.width || window.innerWidth
      // Tablet (md) - colapsado por padrão
      if (width >= BREAKPOINTS.md && width < BREAKPOINTS.lg) return true
      // Large desktop (xl+) - expandido
      if (width >= BREAKPOINTS.xl) return false
      // Default - expandido
      return false
    }
    return false
  })
  
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isManualControl, setIsManualControl] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const { isDarkMode } = useTheme()

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-ajustar sidebar baseado no breakpoint (apenas se não estiver em controle manual)
  useEffect(() => {
    if (isManualControl || isMobile) return

    // Usar breakpoint atual para decidir
    if (breakpoint === 'md') {
      // Tablet - colapsar
      setIsCollapsed(true)
    } else if (breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl') {
      // Desktop grande - expandir
      setIsCollapsed(false)
    }
  }, [breakpoint, isManualControl, isMobile])

  // Fechar menu mobile quando sair de mobile
  useEffect(() => {
    if (!isMobile) {
      setIsMobileOpen(false)
    }
  }, [isMobile])

  // Handler para toggle manual do sidebar
  const handleToggleSidebar = useCallback(() => {
    setIsManualControl(true) // Ativar controle manual ao primeiro toggle
    setIsCollapsed(prev => !prev) // Toggle o estado
  }, [])

  const handleMobileMenuClick = useCallback(() => {
    setIsMobileOpen(true)
  }, [])

  // Memoizar classes para melhor performance
  const layoutClasses = useMemo(() => cn(
    "min-h-screen flex gap-0 w-full max-w-full overflow-x-hidden",
    isDarkMode ? "bg-gray-900" : "bg-gray-100"
  ), [isDarkMode])

  const mainContentClasses = useMemo(() => cn(
    "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out",
    "w-full max-w-full min-w-0 overflow-x-hidden",
    // When sidebar is fixed+collapsed on desktop, push content right by sidebar width
    !isMobile && isCollapsed && "md:ml-14",
    isMobile && "pb-16"
  ), [isMobile, isCollapsed])

  return (
    <div className={layoutClasses}>
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
      <div className={mainContentClasses}>
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
            : "p-3 md:p-4"
        )}>
          <div className="w-full max-w-full min-w-0">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Navigation - Mobile only */}
      {isMobile && <BottomNavigation />}

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={cn(
            "fixed z-50 rounded-full p-2.5 shadow-lg transition-all duration-200",
            "bg-gray-800 hover:bg-gray-700 dark:bg-gray-200 dark:hover:bg-gray-100",
            "text-white dark:text-gray-800",
            isMobile ? "bottom-20 right-4" : "bottom-6 right-6"
          )}
          aria-label="Voltar ao topo"
          title="Voltar ao topo"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

