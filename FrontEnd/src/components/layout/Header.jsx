import { useState, useEffect } from 'react'
import { Search, Bell, Menu, User, Settings, LogOut, ChevronDown, Wallet, X, TrendingUp, Moon, Sun, Home, RefreshCw, Building2 } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useNavigate, useLocation } from 'react-router-dom'
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
import { useBankAccount } from '../../contexts/BankAccountContext'
import { cn } from '@/lib/utils'

export function Header({ onMobileMenuClick, isMobile = false }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, logout } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const isHomePage = location.pathname === '/'
  
  // Bank account context
  const { 
    selectedAccount, 
    bankAccounts, 
    selectAccount, 
    balance, 
    balanceLoading, 
    lastUpdated,
    refreshBalance,
    isLoading: loadingAccounts
  } = useBankAccount()

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

  const handleLogout = async () => {
    // Fazer logout
    await logout()
    
    // Limpar storage local e de sessão
    window.localStorage.clear()
    window.sessionStorage.clear()
    
    // Redirecionar para login usando replace para limpar o histórico
    // O replace: true garante que não há como voltar para a página anterior
    navigate('/login', { replace: true })
    
    // Forçar scroll para o topo para garantir que a página de login seja visível
    window.scrollTo(0, 0)
  }

  const formatBalance = () => {
    if (balanceLoading) return null
    return `R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <header className={cn(
      "sticky top-0 z-10 w-full max-w-full overflow-x-hidden",
      "h-14 sm:h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700",
      scrolled && "shadow-sm"
    )}>
      <div className="w-full h-full px-3 sm:px-4 flex items-center justify-between gap-2 transition-colors duration-200">
        {/* Left side - Hamburger (mobile) + Wallet */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Hamburger button - mobile only */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMobileMenuClick}
              className="h-9 w-9 p-0 flex-shrink-0 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </Button>
          )}

          {!loadingAccounts && bankAccounts.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {/* Desktop: full wallet widget | Mobile: compact icon + balance */}
                <div className={cn(
                  "flex items-center cursor-pointer rounded-xl border transition-colors",
                  "border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-900/20 shadow-sm",
                  "hover:bg-emerald-50 dark:hover:bg-emerald-900/30",
                  isMobile ? "gap-2 px-2.5 py-1.5" : "gap-3 px-4 py-2"
                )}>
                  <div className={cn(
                    "flex items-center justify-center rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white flex-shrink-0",
                    isMobile ? "w-7 h-7" : "w-9 h-9"
                  )}>
                    <Wallet className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
                  </div>

                  {/* Desktop-only labels */}
                  {!isMobile && (
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">{selectedAccount?.name || 'Wallet'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        Saldo atual
                        {lastUpdated && (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Atualizado agora
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  <p className={cn(
                    "font-semibold text-emerald-600 dark:text-emerald-400",
                    isMobile ? "text-sm" : "text-lg ml-4"
                  )}>
                    {balanceLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin inline" />
                    ) : formatBalance()}
                  </p>
                  <ChevronDown className={cn("text-gray-400 dark:text-gray-500", isMobile ? "h-3 w-3" : "h-4 w-4 ml-2")} />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="start" 
                className="w-80 sm:w-96 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow-xl"
                sideOffset={8}
                noScroll={true}
              >
                <DropdownMenuLabel className="p-0">
                  <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-emerald-600 dark:bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Wallet className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Selecionar Conta</p>
                        <p className="text-xs text-gray-700 dark:text-gray-300">Escolha uma conta bancária</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        refreshBalance()
                      }}
                      className="h-8 w-8 p-0 flex-shrink-0 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                      title="Atualizar saldo"
                    >
                      <RefreshCw className={`h-4 w-4 text-gray-600 dark:text-gray-400 ${balanceLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </DropdownMenuLabel>
                <div className="p-2">
                  {bankAccounts.map((account) => (
                    <DropdownMenuItem
                      key={account.id}
                      className={cn(
                        "hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors rounded-md p-3 cursor-pointer mb-1",
                        selectedAccount?.id === account.id && "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700"
                      )}
                      onClick={() => selectAccount(account.id)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                            selectedAccount?.id === account.id
                              ? "bg-emerald-600 dark:bg-emerald-500"
                              : "bg-gray-200 dark:bg-gray-700"
                          )}>
                            <Wallet className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{account.name}</p>
                            {account.bank_name && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{account.bank_name}</p>
                            )}
                          </div>
                        </div>
                        {selectedAccount?.id === account.id && (
                          <div className="w-2 h-2 bg-emerald-600 dark:bg-emerald-400 rounded-full flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className={cn(
              "flex items-center rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-900/20 shadow-sm",
              isMobile ? "gap-2 px-2.5 py-1.5" : "gap-3 px-4 py-2"
            )}>
              <div className={cn(
                "flex items-center justify-center rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white flex-shrink-0",
                isMobile ? "w-7 h-7" : "w-9 h-9"
              )}>
                <Wallet className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
              </div>

              {!isMobile && (
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">Wallet</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    Saldo atual
                    {lastUpdated && (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Atualizado agora
                      </span>
                    )}
                  </p>
                </div>
              )}

              <p className={cn(
                "font-semibold text-emerald-600 dark:text-emerald-400",
                isMobile ? "text-sm" : "text-lg ml-4"
              )}>
                {balanceLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin inline" />
                ) : formatBalance()}
              </p>
            </div>
          )}
        </div>

        {/* Right side - Theme Toggle & User */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Theme Toggle Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-9 w-9 p-0 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
            title={isDarkMode ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
              <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {/* Desktop: avatar + name + email | Mobile: avatar only */}
              <div className={cn(
                "flex items-center cursor-pointer hover:opacity-80 transition-opacity rounded-lg",
                isMobile ? "gap-0 px-1 py-1" : "gap-4 px-2 py-1"
              )}>
                <div className={cn(
                  "flex items-center justify-center rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white font-semibold flex-shrink-0",
                  isMobile ? "w-8 h-8 text-sm" : "w-10 h-10"
                )}>
                  {user?.name?.charAt(0) || 'A'}
                </div>

                {!isMobile && (
                  <>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">{user?.name || 'Admin Exemplo'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || 'admin@exemplo.com'}</p>
                    </div>
                    <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              data-testid="profile-modal"
              className="w-80 sm:w-96 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow-xl"
              sideOffset={8}
              noScroll={true}
            >
              <DropdownMenuLabel className="p-0">
                <div className="flex items-center space-x-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
                  <div className="w-14 h-14 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xl">
                      {user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-gray-900 dark:text-white truncate">
                      {user?.name || 'Usuário'}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {user?.email || 'user@example.com'}
                    </p>
                    <div className="flex items-center space-x-2 mt-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                        Premium
                      </Badge>
                      <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                        Admin
                      </Badge>
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>
              <div className="p-2">
                <DropdownMenuItem 
                  data-testid="profile-menu-item"
                  className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors rounded-md p-3 cursor-pointer mb-1 w-full"
                  onClick={() => {
                    navigate('/profile')
                  }}
                >
                  <User className="mr-3 h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0 overflow-visible">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">Meu Perfil</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Configurações pessoais</p>
                  </div>
                </DropdownMenuItem>
                {(user?.account_admin || user?.account_owner) && (
                  <DropdownMenuItem 
                    data-testid="company-settings-menu-item"
                    className="hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors rounded-md p-3 cursor-pointer mb-1 w-full"
                    onClick={() => {
                      navigate('/company-settings')
                    }}
                  >
                    <Building2 className="mr-3 h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0 overflow-visible">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">Configurações da Empresa</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Apenas para administradores</p>
                    </div>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  data-testid="settings-menu-item"
                  className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-md p-3 cursor-pointer mb-1 w-full"
                  onClick={() => {
                    navigate('/settings')
                  }}
                >
                  <Settings className="mr-3 h-5 w-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0 overflow-visible">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">Preferências</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Configurações do sistema</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2 bg-gray-200 dark:bg-gray-700" />
                <DropdownMenuItem 
                  data-testid="logout-menu-item"
                  className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-md p-3 cursor-pointer w-full"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0 overflow-visible">
                    <p className="font-semibold truncate">Sair</p>
                    <p className="text-xs text-red-500 dark:text-red-400 truncate">Encerrar sessão</p>
                  </div>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

