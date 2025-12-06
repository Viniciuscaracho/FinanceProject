import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  Home, 
  CreditCard, 
  Users, 
  BarChart3, 
  Upload, 
  FileText, 
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Calendar,
  DollarSign,
  Scissors,
  Clock,
  Link2,
  Crown,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'

// Função auxiliar para obter cor do ícone baseado no modo escuro
const getIconColor = (color, isDarkMode, isActive) => {
  if (isActive) {
    return isDarkMode ? 'text-blue-400' : 'text-blue-600'
  }
  if (isDarkMode) {
    // Mapear cores -600 para versões mais claras no modo escuro
    const colorMap = {
      'text-blue-600': 'text-blue-400',
      'text-green-600': 'text-green-400',
      'text-[#5B7A9E]': 'text-[#6B8FA3]',
      'text-teal-600': 'text-teal-400',
      'text-emerald-600': 'text-emerald-400',
      'text-indigo-600': 'text-indigo-400',
      'text-[#5B7A9E]': 'text-[#6B8FA3]',
      'text-amber-600': 'text-amber-400',
      'text-orange-600': 'text-orange-400',
    }
    return colorMap[color] || 'text-gray-400'
  }
  return color
}

const menuItems = [
  { 
    icon: Home, 
    label: 'Página inicial', 
    path: '/', 
    color: 'text-blue-600',
    badge: '4'
  },
  { 
    icon: CreditCard, 
    label: 'Transações', 
    path: '/transactions', 
    color: 'text-green-600',
    badge: '5'
  },
  { 
    icon: Users, 
    label: 'Contatos', 
    path: '/contacts', 
    color: 'text-[#5B7A9E]',
    badge: '5'
  },
  { 
    icon: Calendar, 
    label: 'Agendamentos', 
    path: '/appointments', 
    color: 'text-teal-600',
    badge: '0'
  },
  { 
    icon: Link2, 
    label: 'Links de Agendamento', 
    path: '/appointment-links', 
    color: 'text-cyan-600',
    badge: '0'
  },
  { 
    icon: Users, 
    label: 'Profissionais', 
    path: '/professionals', 
    color: 'text-indigo-600',
    badge: '0'
  },
  { 
    icon: Scissors, 
    label: 'Serviços', 
    path: '/services', 
    color: 'text-[#5B7A9E]',
    badge: '0'
  },
  { 
    icon: Clock, 
    label: 'Horários', 
    path: '/working-hours', 
    color: 'text-amber-600',
    badge: '0'
  },
  { 
    icon: BarChart3, 
    label: 'Relatórios Financeiros', 
    path: '/reports', 
    color: 'text-orange-600',
    badge: '7'
  },
  { 
    icon: Upload, 
    label: 'Importações', 
    path: '/imports', 
    color: 'text-[#5B7A9E]',
    badge: '8'
  },
  { 
    icon: FileText, 
    label: 'Conciliações (OFX)', 
    path: '/reconciliations', 
    color: 'text-indigo-600',
    badge: '2'
  },
  { 
    icon: Crown, 
    label: 'Assinatura', 
    path: '/subscription', 
    color: 'text-yellow-600',
    badge: '0'
  },
  { 
    icon: Shield, 
    label: 'Admin', 
    path: '/admin', 
    color: 'text-purple-600',
    badge: '0',
    adminOnly: true
  },
]

export function Sidebar({ isCollapsed, setIsCollapsed, isMobile, setIsMobileOpen }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const { user } = useAuth()
  const [progressWidth, setProgressWidth] = useState(0)
  
  // Verificar se o usuário é admin (conta com admin: true)
  const isAdmin = user?.account?.admin === true

  // Animate progress bar on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgressWidth(75)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const toggleSidebar = () => {
    if (isMobile) {
      setIsMobileOpen(false)
    } else {
      // Toggle sempre funciona - o Layout gerencia o estado
      if (typeof setIsCollapsed === 'function') {
        setIsCollapsed()
      }
    }
  }

  return (
    <div className={cn(
      "h-full flex flex-col transition-all duration-300 ease-in-out preserve-colors",
      // Background e bordas com suporte a modo escuro
      isDarkMode 
        ? "bg-gray-800 border-r border-gray-700" 
        : "bg-white border-r border-gray-200",
      // Responsive width: mobile full-width, desktop variable
      isMobile 
        ? "w-full max-w-sm" 
        : isCollapsed 
          ? "w-14" 
          : "w-64 lg:w-72"
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center justify-between border-b transition-colors duration-200",
        "p-2 sm:p-3 lg:p-4",
        isDarkMode 
          ? "border-gray-700 bg-gray-800/50" 
          : "border-gray-200 bg-gray-50"
      )}>
        {(!isCollapsed || isMobile) && (
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            <div className="w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 bg-[var(--brand-primary)] rounded-[var(--radius-sm)] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs sm:text-sm">P</span>
            </div>
            <div className="min-w-0 flex-1">
              <span className={cn(
                "font-bold block leading-tight",
                "text-xs sm:text-sm md:text-base lg:text-lg",
                isDarkMode ? "text-gray-100" : "text-gray-900",
                "whitespace-nowrap"
              )}>
                BarberManagement
              </span>
              <p className={cn(
                "text-[10px] sm:text-xs leading-tight mt-0.5",
                isDarkMode ? "text-gray-400" : "text-gray-600",
                "truncate"
              )}>
                Controle Financeiro
              </p>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className={cn(
            "p-1.5 h-auto transition-colors rounded-md",
            isDarkMode 
              ? "hover:bg-gray-700 text-gray-300 hover:text-gray-100" 
              : "hover:bg-gray-200 text-gray-600"
          )}
        >
          {isMobile ? (
            <X className="h-4 w-4 lg:h-5 lg:w-5" />
          ) : isCollapsed ? (
            <ChevronRight className="h-4 w-4 lg:h-5 lg:w-5" />
          ) : (
            <ChevronLeft className="h-4 w-4 lg:h-5 lg:w-5" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className={cn(
        "flex-1 overflow-y-auto overflow-x-hidden transition-colors duration-200",
        // Responsive padding e espaçamento
        "p-2 sm:p-3 lg:p-4 space-y-1.5 sm:space-y-2"
      )}>
        {menuItems.filter((item) => {
          // Filtrar itens admin-only se o usuário não for admin
          if (item.adminOnly && !isAdmin) {
            return false
          }
          return true
        }).map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <div
              key={item.path}
              onClick={() => {
                // Forçar navegação usando navigate para garantir funcionamento no emulador
                navigate(item.path);
                // Fechar menu mobile se estiver aberto
                if (isMobile) {
                  setIsMobileOpen(false);
                }
              }}
              className={cn(
                "group flex items-center transition-all duration-200 relative preserve-colors cursor-pointer",
                // Responsive padding e espaçamento
                "px-2 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 rounded-lg",
                "space-x-2 sm:space-x-3 lg:space-x-4",
                // Hover e active states com suporte a modo escuro
                isDarkMode 
                  ? isActive
                    ? "bg-blue-900/40 text-blue-400 border-l-4 border-blue-500 hover:bg-blue-900/50 active:bg-blue-900/60"
                    : "text-gray-300 hover:bg-gray-700/80 active:bg-gray-700 hover:text-gray-100"
                  : isActive
                    ? "bg-blue-50 text-blue-700 border-l-4 border-blue-600 hover:bg-blue-100 active:bg-blue-100"
                    : "text-gray-700 hover:bg-gray-100 active:bg-gray-200 hover:text-gray-900",
                isCollapsed && !isMobile && "justify-center space-x-0 px-2 lg:px-2.5"
              )}
              title={isCollapsed && !isMobile ? item.label : undefined}
              style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
            >
              <Icon className={cn(
                "flex-shrink-0 transition-all duration-200 preserve-colors",
                // Responsive icon sizes
                "h-4 w-4 sm:h-5 sm:w-5",
                getIconColor(item.color, isDarkMode, isActive),
                !isActive && "group-hover:opacity-100 opacity-90"
              )} />
              
              {(!isCollapsed || isMobile) && (
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className={cn(
                    "font-medium preserve-colors",
                    "text-xs sm:text-sm",
                    isDarkMode 
                      ? isActive 
                        ? "text-blue-400" 
                        : "text-gray-300"
                      : isActive 
                        ? "text-blue-700" 
                        : "text-gray-700"
                  )}>
                    {item.label}
                  </span>
                  
                  <Badge 
                    variant={isActive ? "default" : "secondary"}
                    className={cn(
                      "text-[10px] sm:text-xs h-4 sm:h-5 px-1.5 sm:px-2 ml-1.5 sm:ml-2 preserve-colors flex-shrink-0",
                      isDarkMode
                        ? isActive
                          ? "bg-blue-600 text-white border-blue-500"
                          : "bg-gray-700 text-gray-300 border-gray-600"
                        : isActive
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-600"
                    )}
                  >
                    {item.badge}
                  </Badge>
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      {(!isCollapsed || isMobile) && (
        <div className={cn(
          "p-2 sm:p-3 lg:p-4 border-t transition-colors duration-200",
          isDarkMode ? "border-gray-700" : "border-gray-200"
        )}>
          <div className={cn(
            "rounded-lg p-2 sm:p-3 lg:p-4 border transition-colors duration-200",
            isDarkMode
              ? "bg-blue-900/30 border-blue-800/50"
              : "bg-blue-50 border-blue-100"
          )}>
            <div className="flex items-center space-x-1.5 sm:space-x-2 mb-1.5 sm:mb-2">
              <Sparkles className={cn(
                "h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0",
                isDarkMode ? "text-blue-400" : "text-blue-600"
              )} />
              <p className={cn(
                "text-[10px] sm:text-xs lg:text-sm font-semibold",
                isDarkMode ? "text-blue-400" : "text-blue-700"
              )}>
                Período de Avaliação
              </p>
            </div>
            <p className={cn(
              "text-[10px] sm:text-xs mb-1.5 sm:mb-2",
              isDarkMode ? "text-blue-300" : "text-blue-600"
            )}>
              430 dias restantes
            </p>
            <div className={cn(
              "w-full rounded-full transition-colors duration-200",
              "h-1.5 sm:h-2",
              isDarkMode ? "bg-blue-900/50" : "bg-blue-200"
            )}>
              <div 
                className={cn(
                  "bg-[var(--brand-accent)] rounded-[var(--radius-sm)] transition-colors duration-100",
                  "h-1.5 sm:h-2"
                )}
                style={{ width: `${progressWidth}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5 sm:mt-2">
              <span className={cn(
                "text-[10px] sm:text-xs",
                isDarkMode ? "text-gray-400" : "text-gray-600"
              )}>
                75% utilizado
              </span>
              <div className={cn(
                "flex items-center space-x-1",
                isDarkMode ? "text-green-400" : "text-green-600"
              )}>
                <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="font-semibold text-[10px] sm:text-xs">Excelente!</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

