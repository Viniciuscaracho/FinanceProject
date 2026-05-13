import { useState, useEffect } from 'react'
import { Search, Bell, Menu, User, Settings, LogOut, ChevronDown, Landmark, X, TrendingUp, Moon, Sun, Home, RefreshCw, Building2 } from 'lucide-react'
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
import { T } from '@/lib/tokens'

const BRAND  = '#4C60AA'

export function Header({ onMobileMenuClick, isMobile = false }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, logout } = useAuth()
  const { isDarkMode, toggleTheme } = useTheme()
  const navigate  = useNavigate()
  const location  = useLocation()

  const {
    selectedAccount,
    bankAccounts,
    selectAccount,
    balance,
    balanceLoading,
    lastUpdated,
    refreshBalance,
    isLoading: loadingAccounts,
  } = useBankAccount()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const clearSearch = () => {
    setSearchQuery('')
    setIsSearchExpanded(false)
  }

  const handleLogout = async () => {
    await logout()
    window.localStorage.clear()
    window.sessionStorage.clear()
    navigate('/login', { replace: true })
    window.scrollTo(0, 0)
  }

  const formatBalance = () => {
    if (balanceLoading) return null
    return `R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  /* ── Caixa widget (trigger reutilizável) ────── */
  const CaixaWidget = ({ hasAccounts }) => (
    <div style={{
      display: 'flex', alignItems: 'center', cursor: hasAccounts ? 'pointer' : 'default',
      borderRadius: 10, border: `1px solid var(--border)`,
      background: T.chip,
      gap: isMobile ? 8 : 10,
      padding: isMobile ? '6px 10px' : '7px 14px',
      transition: 'background 120ms',
    }}
    onMouseEnter={e => { if (hasAccounts) e.currentTarget.style.background = T.light }}
    onMouseLeave={e => { e.currentTarget.style.background = T.chip }}
    >
      <div style={{
        width: isMobile ? 28 : 32, height: isMobile ? 28 : 32,
        borderRadius: 8, background: BRAND,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Landmark size={isMobile ? 14 : 16} style={{ color: '#fff' }} />
      </div>

      {!isMobile && (
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0, lineHeight: 1.3 }}>
            {selectedAccount?.name || 'Caixa'}
          </p>
          <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>
            Saldo atual
          </p>
        </div>
      )}

      <p style={{
        fontSize: isMobile ? 13 : 16,
        fontWeight: 700,
        color: BRAND,
        margin: isMobile ? 0 : '0 0 0 4px',
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
      }}>
        {balanceLoading
          ? <RefreshCw size={14} style={{ display: 'inline', animation: 'spin 1s linear infinite' }} />
          : formatBalance()}
      </p>

      {hasAccounts && (
        <ChevronDown size={isMobile ? 12 : 14} style={{ color: T.muted, flexShrink: 0 }} />
      )}
    </div>
  )

  return (
    <header
      className={cn('sticky top-0 z-10 w-full max-w-full overflow-x-hidden h-14 sm:h-16 border-b', scrolled && 'shadow-sm')}
      style={{ background: T.white, borderColor: 'var(--border)' }}
    >
      <div className="w-full h-full px-3 sm:px-4 flex items-center justify-between gap-2 transition-colors duration-200">

        {/* ── Esquerda: hamburger + caixa ── */}
        <div className="flex items-center gap-2 min-w-0">
          {isMobile && (
            <Button
              variant="ghost" size="sm"
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
                <div><CaixaWidget hasAccounts /></div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-80 sm:w-96 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl shadow-xl"
                sideOffset={8}
                noScroll={true}
              >
                {/* Cabeçalho do dropdown */}
                <DropdownMenuLabel className="p-0">
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 16px', borderBottom: '1px solid var(--border)',
                    background: T.chip,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 38, height: 38, background: BRAND, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Landmark size={18} style={{ color: '#fff' }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: T.text, margin: 0 }}>Selecionar conta</p>
                        <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>Conta bancária ativa</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost" size="sm"
                      onClick={e => { e.stopPropagation(); refreshBalance() }}
                      className="h-8 w-8 p-0 flex-shrink-0 rounded-lg"
                      title="Atualizar saldo"
                    >
                      <RefreshCw className={`h-4 w-4 text-gray-500 ${balanceLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </DropdownMenuLabel>

                {/* Lista de contas */}
                <div className="p-2">
                  {bankAccounts.map(account => {
                    const isSelected = selectedAccount?.id === account.id
                    return (
                      <DropdownMenuItem
                        key={account.id}
                        className="transition-colors rounded-lg p-3 cursor-pointer mb-1"
                        style={{
                          background: isSelected ? T.chip : 'transparent',
                          border: isSelected ? `1px solid var(--border)` : '1px solid transparent',
                        }}
                        onClick={() => selectAccount(account.id)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                              background: isSelected ? BRAND : '#E5E7EB',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Landmark size={14} style={{ color: isSelected ? '#fff' : '#6B7280' }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }} className="truncate">{account.name}</p>
                              {account.bank_name && (
                                <p style={{ fontSize: 11, color: T.muted, margin: 0 }} className="truncate">{account.bank_name}</p>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: BRAND, flexShrink: 0, marginLeft: 8 }} />
                          )}
                        </div>
                      </DropdownMenuItem>
                    )
                  })}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <CaixaWidget hasAccounts={false} />
          )}
        </div>

        {/* ── Direita: tema + usuário ─────── */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost" size="sm"
            onClick={toggleTheme}
            className="h-9 w-9 p-0 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
            title={isDarkMode ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
          >
            {isDarkMode
              ? <Sun className="h-5 w-5 text-yellow-500" />
              : <Moon className="h-5 w-5 text-gray-500" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className={cn(
                'flex items-center cursor-pointer hover:opacity-80 transition-opacity rounded-lg',
                isMobile ? 'gap-0 px-1 py-1' : 'gap-3 px-2 py-1',
              )}>
                <div
                  className={cn('flex items-center justify-center rounded-lg text-white font-semibold flex-shrink-0', isMobile ? 'w-8 h-8 text-sm' : 'w-9 h-9')}
                  style={{ background: BRAND }}
                >
                  {user?.name?.charAt(0) || 'A'}
                </div>
                {!isMobile && (
                  <>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white">{user?.name || 'Admin'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || ''}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </>
                )}
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              data-testid="profile-modal"
              className="w-72 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl shadow-xl"
              sideOffset={8}
              noScroll={true}
            >
              <DropdownMenuLabel className="p-0">
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', background: T.chip, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{user?.name?.charAt(0) || 'U'}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }} className="truncate">{user?.name || 'Usuário'}</p>
                    <p style={{ fontSize: 12, color: T.muted, margin: 0 }} className="truncate">{user?.email || ''}</p>
                  </div>
                </div>
              </DropdownMenuLabel>

              <div className="p-2">
                <DropdownMenuItem
                  data-testid="profile-menu-item"
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg p-3 cursor-pointer mb-1 w-full"
                  onClick={() => navigate('/profile')}
                >
                  <User className="mr-3 h-4 w-4 text-gray-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">Meu Perfil</p>
                    <p className="text-xs text-gray-500">Configurações pessoais</p>
                  </div>
                </DropdownMenuItem>

                {(user?.account_admin || user?.account_owner) && (
                  <DropdownMenuItem
                    data-testid="company-settings-menu-item"
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg p-3 cursor-pointer mb-1 w-full"
                    onClick={() => navigate('/company-settings')}
                  >
                    <Building2 className="mr-3 h-4 w-4 text-gray-500 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">Configurações</p>
                      <p className="text-xs text-gray-500">Empresa e preferências</p>
                    </div>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="my-2 bg-gray-100 dark:bg-gray-700" />

                <DropdownMenuItem
                  data-testid="logout-menu-item"
                  className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-lg p-3 cursor-pointer w-full"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-3 h-4 w-4 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Sair</p>
                    <p className="text-xs text-red-400">Encerrar sessão</p>
                  </div>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </header>
  )
}
