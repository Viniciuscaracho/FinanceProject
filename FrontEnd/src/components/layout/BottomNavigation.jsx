import { useLocation, useNavigate } from 'react-router-dom'
import { 
  Home, 
  CreditCard, 
  Users, 
  Calendar,
  BarChart3,
  MoreHorizontal,
  Crown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '../../contexts/ThemeContext'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'

const bottomNavItems = [
  { 
    icon: Home, 
    label: 'Início', 
    path: '/',
  },
  { 
    icon: CreditCard, 
    label: 'Transações', 
    path: '/transactions',
  },
  { 
    icon: Calendar, 
    label: 'Agendamentos', 
    path: '/appointments',
  },
  { 
    icon: Users, 
    label: 'Contatos', 
    path: '/contacts',
  },
]

const moreMenuItems = [
  { 
    icon: Users, 
    label: 'Profissionais', 
    path: '/professionals',
  },
  { 
    icon: Home, 
    label: 'Serviços', 
    path: '/services',
  },
  { 
    icon: Home, 
    label: 'Horários', 
    path: '/working-hours',
  },
  { 
    icon: BarChart3, 
    label: 'Relatórios Financeiros', 
    path: '/reports',
  },
  { 
    icon: Crown, 
    label: 'Assinatura', 
    path: '/subscription',
  },
]

export function BottomNavigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()

  const handleNavigation = (path) => {
    navigate(path)
    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "border-t",
          "w-full max-w-full overflow-x-hidden",
          isDarkMode 
            ? "bg-gray-900 border-gray-700" 
            : "bg-white border-gray-200",
          "safe-area-inset-bottom", // Para iPhone com notch
          "border-t-2"
        )}
        style={{ 
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-center justify-around h-16 px-1 sm:px-2 w-full max-w-full min-w-0">
          {bottomNavItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  "flex flex-col items-center justify-center",
                  "flex-1 h-full min-w-0",
                  "transition-colors duration-100",
                  "touch-manipulation", // Melhora resposta touch
                  "overflow-hidden",
                  isActive
                    ? isDarkMode
                      ? "text-blue-400"
                      : "text-blue-600"
                    : isDarkMode
                      ? "text-gray-400"
                      : "text-gray-600"
                )}
                aria-label={item.label}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <div className={cn(
                  "relative mb-1 flex-shrink-0"
                )}>
                  <Icon className={cn(
                    "h-5 w-5 sm:h-6 sm:w-6 transition-colors duration-100"
                  )} />
                  {isActive && (
                    <span 
                      className={cn(
                        "absolute -bottom-1 left-1/2 -translate-x-1/2",
                        "w-1 h-1 rounded-full",
                        isDarkMode ? "bg-blue-400" : "bg-blue-600"
                      )} 
                    />
                  )}
                </div>
                <span className={cn(
                  "text-[10px] sm:text-xs font-medium truncate w-full px-0.5",
                  isActive && "font-semibold"
                )}>
                  {item.label}
                </span>
              </button>
            )
          })}
          
          {/* More Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-center",
                  "flex-1 h-full",
                  "transition-colors duration-100",
                  "min-w-0",
                  "touch-manipulation",
                  location.pathname.startsWith('/professionals') ||
                  location.pathname.startsWith('/services') ||
                  location.pathname.startsWith('/working-hours') ||
                  location.pathname.startsWith('/reports') ||
                  location.pathname.startsWith('/subscription')
                    ? isDarkMode
                      ? "text-blue-400"
                      : "text-blue-600"
                    : isDarkMode
                      ? "text-gray-400"
                      : "text-gray-600"
                )}
                aria-label="Mais opções"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <MoreHorizontal className="h-6 w-6" />
                <span className={cn(
                  "text-xs font-medium truncate max-w-full",
                  (location.pathname.startsWith('/professionals') ||
                  location.pathname.startsWith('/services') ||
                  location.pathname.startsWith('/working-hours') ||
                  location.pathname.startsWith('/reports') ||
                  location.pathname.startsWith('/subscription')) && "font-semibold"
                )}>
                  Mais
                </span>
              </button>
            </SheetTrigger>
            <SheetContent 
              side="bottom"
              className={cn(
                "h-[80vh] rounded-t-[var(--radius-sm)]",
                isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
              )}
            >
              <div className="space-y-2 mt-4">
                <h3 className={cn(
                  "text-lg font-bold px-4 mb-4",
                  isDarkMode ? "text-gray-100" : "text-gray-900"
                )}>
                  Mais Opções
                </h3>
                {moreMenuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path
                  
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        handleNavigation(item.path)
                        // Close sheet after navigation
                        setTimeout(() => {
                          document.querySelector('[data-state="open"]')?.click()
                        }, 100)
                      }}
                      className={cn(
                        "w-full flex items-center space-x-4 px-4 py-4",
                        "rounded-[var(--radius-sm)] transition-colors duration-100",
                        "touch-manipulation",
                        isActive
                          ? isDarkMode
                            ? "bg-blue-900/40 text-blue-400"
                            : "bg-blue-50 text-blue-700"
                          : isDarkMode
                            ? "hover:bg-gray-800 text-gray-300"
                            : "hover:bg-gray-50 text-gray-700"
                      )}
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      <Icon className={cn(
                        "h-5 w-5 flex-shrink-0"
                      )} />
                      <span className={cn(
                        "font-medium text-left flex-1",
                        isActive && "font-semibold"
                      )}>
                        {item.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
      
      {/* Spacer para o conteúdo não ficar embaixo da bottom nav */}
      <div 
        className="h-16 safe-area-inset-bottom"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      />
    </>
  )
}

