import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
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
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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
    color: 'text-purple-600',
    badge: '5'
  },
  { 
    icon: BarChart3, 
    label: 'Relatórios', 
    path: '/reports', 
    color: 'text-orange-600',
    badge: '7'
  },
  { 
    icon: Upload, 
    label: 'Importações', 
    path: '/imports', 
    color: 'text-pink-600',
    badge: '8'
  },
  { 
    icon: FileText, 
    label: 'Conciliações (OFX)', 
    path: '/reconciliations', 
    color: 'text-indigo-600',
    badge: '2'
  },
]

export function Sidebar({ isCollapsed, setIsCollapsed, isMobile, setIsMobileOpen }) {
  const location = useLocation()
  const [progressWidth, setProgressWidth] = useState(0)

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
      setIsCollapsed(!isCollapsed)
    }
  }

  return (
    <div className={cn(
      "h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out preserve-colors",
      isCollapsed && !isMobile ? "w-12" : "w-48" // Reduced from w-60 to w-48 (192px)
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-2 lg:p-3 border-b border-gray-200 bg-gray-50">
        {(!isCollapsed || isMobile) && (
          <div className="flex items-center space-x-2 lg:space-x-3">
            <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs lg:text-sm">P</span>
            </div>
            <div>
              <span className="font-bold text-sm lg:text-lg text-gray-900">Procfy</span>
              <p className="text-xs text-gray-600">Controle Financeiro</p>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="p-1 h-auto hover:bg-gray-200 transition-colors rounded-md"
        >
          {isMobile ? (
            <X className="h-3 w-3 lg:h-4 lg:w-4" />
          ) : isCollapsed ? (
            <ChevronRight className="h-3 w-3 lg:h-4 lg:w-4" />
          ) : (
            <ChevronLeft className="h-3 w-3 lg:h-4 lg:w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 lg:p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "group flex items-center space-x-2 lg:space-x-3 px-2 lg:px-3 py-2 lg:py-2.5 rounded-lg transition-all duration-200 relative preserve-colors",
                "hover:bg-gray-100",
                isActive ? 
                  "bg-blue-50 text-blue-700 border-l-4 border-blue-600" : 
                  "text-gray-700 hover:text-gray-900",
                isCollapsed && !isMobile && "justify-center space-x-0 px-1 lg:px-2"
              )}
              title={isCollapsed && !isMobile ? item.label : undefined}
            >
              <Icon className={cn(
                "h-4 w-4 lg:h-5 lg:w-5 flex-shrink-0 transition-colors duration-200 preserve-colors",
                isActive ? "text-blue-600" : item.color
              )} />
              
              {(!isCollapsed || isMobile) && (
                <div className="flex items-center justify-between flex-1">
                  <span className="font-medium text-xs lg:text-sm preserve-colors">
                    {item.label}
                  </span>
                  
                  <Badge 
                    variant={isActive ? "default" : "secondary"}
                    className={cn(
                      "text-xs h-4 lg:h-5 px-1 lg:px-1.5 preserve-colors",
                      isActive ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
                    )}
                  >
                    {item.badge}
                  </Badge>
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      {(!isCollapsed || isMobile) && (
        <div className="p-2 lg:p-3 border-t border-gray-200">
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-2 lg:p-3 border border-blue-100">
            <div className="flex items-center space-x-1 lg:space-x-2 mb-1 lg:mb-2">
              <Sparkles className="h-3 w-3 lg:h-4 lg:w-4 text-blue-600" />
              <p className="text-xs lg:text-sm font-semibold text-blue-700">
                Período de Avaliação
              </p>
            </div>
            <p className="text-xs text-blue-600 mb-1 lg:mb-2">
              430 dias restantes
            </p>
            <div className="w-full bg-blue-200 rounded-full h-1.5 lg:h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-green-500 h-1.5 lg:h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressWidth}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-gray-600">
                75% utilizado
              </span>
              <div className="flex items-center space-x-1 text-green-600">
                <TrendingUp className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                <span className="font-semibold text-xs">Excelente!</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

