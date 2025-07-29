import { useState, useEffect } from 'react'
import { Search, Bell, Menu, User, Settings, LogOut, ChevronDown, Wallet, X, TrendingUp, Moon, Sun } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '../../contexts/AuthContext'

export function Header({ onMobileMenuClick }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, logout } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()

  // Detect scroll for dynamic header styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSearchFocus = () => {
    setIsSearchExpanded(true)
  }

  const handleSearchBlur = () => {
    if (!searchQuery) {
      setIsSearchExpanded(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setIsSearchExpanded(false)
  }

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/98 backdrop-blur-md shadow-lg border-b border-gray-200/50' 
        : 'bg-white/95 backdrop-blur-sm border-b border-gray-200'
    }`}>
      <div className="px-2 sm:px-3 lg:px-4 py-2 lg:py-3">
        <div className="flex items-center justify-between w-full">
          {/* Left side - Mobile menu + Search */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden p-2 hover:bg-gray-100 hover:scale-105 transition-all duration-200 rounded-xl"
              onClick={onMobileMenuClick}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Search - Fully responsive */}
            <div className={`relative transition-all duration-300 ${
              isSearchExpanded 
                ? 'flex-1 max-w-full' 
                : 'flex-1 max-w-sm lg:max-w-md'
            }`}>
              <Search className={`absolute left-2 lg:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 lg:h-4 lg:w-4 transition-colors duration-200 ${
                isSearchExpanded ? 'text-blue-500' : 'text-gray-400'
              }`} />
              <Input
                type="text"
                placeholder="Pesquisar transações, contatos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                className={`pl-7 lg:pl-10 pr-8 lg:pr-10 w-full transition-all duration-300 rounded-lg lg:rounded-xl text-xs lg:text-sm ${
                  isSearchExpanded
                    ? 'bg-blue-50 border-blue-300 focus:border-blue-500 shadow-md'
                    : 'bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500'
                }`}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-1 lg:right-2 top-1/2 transform -translate-y-1/2 p-0.5 lg:p-1 h-5 w-5 lg:h-6 lg:w-6 hover:bg-gray-200 rounded-full transition-all duration-200"
                >
                  <X className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Right side - Notifications + Account + User */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-3">
            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative p-1.5 lg:p-2 hover:bg-gray-100 hover:scale-105 transition-all duration-200 rounded-lg lg:rounded-xl preserve-colors"
            >
              <Bell className="h-4 w-4 lg:h-5 lg:w-5 preserve-colors" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-4 w-4 lg:h-5 lg:w-5 p-0 flex items-center justify-center text-xs animate-pulse rounded-full preserve-colors"
              >
                3
              </Badge>
            </Button>

            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleTheme}
              className="p-1.5 lg:p-2 hover:bg-gray-100 hover:scale-105 transition-all duration-300 rounded-lg lg:rounded-xl relative overflow-hidden theme-toggle-ripple preserve-colors"
              title={isDarkMode ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            >
              <div className="relative w-5 h-5 lg:w-6 lg:h-6">
                <Sun 
                  className={`absolute inset-0 h-4 w-4 lg:h-5 lg:w-5 transition-all duration-300 preserve-colors ${
                    isDarkMode 
                      ? 'text-yellow-400 opacity-100 rotate-0 scale-100' 
                      : 'text-gray-400 opacity-0 -rotate-90 scale-75'
                  }`} 
                />
                <Moon 
                  className={`absolute inset-0 h-4 w-4 lg:h-5 lg:w-5 transition-all duration-300 preserve-colors ${
                    isDarkMode 
                      ? 'text-gray-400 opacity-0 rotate-90 scale-75' 
                      : 'text-gray-600 opacity-100 rotate-0 scale-100'
                  }`} 
                />
              </div>
            </Button>

            {/* Account selector - Responsive visibility */}
            <div className="hidden xl:flex items-center space-x-2 lg:space-x-3 bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50 rounded-lg lg:rounded-xl px-3 lg:px-4 py-2 lg:py-2.5 border border-emerald-200/50 hover:shadow-md transition-all duration-300 group">
              <div className="w-7 h-7 lg:w-9 lg:h-9 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 rounded-lg lg:rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200 preserve-colors">
                <Wallet className="h-3 w-3 lg:h-4 lg:w-4 text-white preserve-colors" />
              </div>
              <div className="text-xs lg:text-sm">
                <p className="font-semibold text-gray-900">Conta Principal</p>
                <p className="text-gray-600 text-xs">Saldo atual</p>
              </div>
              <div className="text-right">
                <p className="text-sm lg:text-lg font-bold text-emerald-600">R$ 0,00</p>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-green-500" />
                  <p className="text-xs text-gray-500">Atualizado agora</p>
                </div>
              </div>
            </div>

            {/* Compact account info for large screens */}
            <div className="hidden lg:flex xl:hidden items-center bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg lg:rounded-xl px-2 lg:px-3 py-1.5 lg:py-2 border border-emerald-200/50">
              <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center preserve-colors">
                <Wallet className="h-3 w-3 lg:h-4 lg:w-4 text-white preserve-colors" />
              </div>
              <div className="ml-2 text-right">
                <p className="text-xs lg:text-sm font-bold text-emerald-600">R$ 0,00</p>
                <p className="text-xs text-gray-500">Principal</p>
              </div>
            </div>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex items-center space-x-1 lg:space-x-2 p-1.5 lg:p-2 hover:bg-gray-100 hover:scale-105 transition-all duration-200 rounded-lg lg:rounded-xl preserve-colors"
                >
                  <div className="w-7 h-7 lg:w-9 lg:h-9 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg lg:rounded-xl flex items-center justify-center shadow-sm preserve-colors">
                    <span className="text-white font-bold text-xs lg:text-sm preserve-colors">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs lg:text-sm font-semibold text-gray-900">
                      {user?.name || 'Usuário'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.email || 'user@example.com'}
                    </p>
                  </div>
                  <ChevronDown className="h-3 w-3 lg:h-4 lg:w-4 text-gray-400 hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-72 shadow-xl border-0 bg-white/98 backdrop-blur-md rounded-2xl overflow-hidden"
                sideOffset={8}
              >
                <DropdownMenuLabel className="p-0">
                  <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="w-14 h-14 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-xl">
                        {user?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-gray-900 truncate">
                        {user?.name || 'Usuário'}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {user?.email || 'user@example.com'}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200">
                          Premium
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Admin
                        </Badge>
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <div className="p-2">
                  <DropdownMenuItem className="hover:bg-blue-50 transition-colors rounded-xl p-3 cursor-pointer">
                    <User className="mr-3 h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Meu Perfil</p>
                      <p className="text-xs text-gray-500">Configurações da conta</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-gray-50 transition-colors rounded-xl p-3 cursor-pointer">
                    <Settings className="mr-3 h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Configurações</p>
                      <p className="text-xs text-gray-500">Preferências do sistema</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem 
                    className="text-red-600 hover:bg-red-50 transition-colors rounded-xl p-3 cursor-pointer"
                    onClick={logout}
                  >
                    <LogOut className="mr-3 h-5 w-5" />
                    <div>
                      <p className="font-semibold">Sair</p>
                      <p className="text-xs text-red-400">Encerrar sessão</p>
                    </div>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}

