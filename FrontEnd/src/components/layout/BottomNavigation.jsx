import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  CreditCard,
  Users,
  Calendar,
  BarChart3,
  MoreHorizontal,
  Crown,
  Apple,
  Clock,
  Link2,
  Percent,
  StickyNote,
  Settings,
  Plus,
  CalendarPlus,
  UserPlus,
  Wallet,
  Globe,
  Brain,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '../../contexts/ThemeContext'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'

const bottomNavItems = [
  { icon: Home,     label: 'Início',   path: '/' },
  { icon: Calendar, label: 'Agenda',   path: '/appointments' },
  { icon: Brain,    label: 'Coaching', path: '/coaching' },
]

const moreMenuGroups = [
  {
    title: 'Minha Presença',
    items: [
      { icon: Globe, label: 'Vitrine', path: '/vitrine' },
    ],
  },
  {
    title: 'Cadastros',
    items: [
      { icon: Users,    label: 'Pacientes',      path: '/contacts' },
      { icon: Users,    label: 'Profissionais',  path: '/professionals' },
      { icon: Apple,    label: 'Serviços',        path: '/services' },
    ],
  },
  {
    title: 'Agenda',
    items: [
      { icon: Clock,      label: 'Horários',        path: '/working-hours' },
      { icon: Link2,      label: 'Links de Agend.', path: '/appointment-links' },
      { icon: StickyNote, label: 'Anotações',       path: '/appointment-notes' },
      { icon: Percent,    label: 'Comissões',        path: '/commissions' },
    ],
  },
  {
    title: 'Financeiro',
    items: [
      { icon: CreditCard, label: 'Transações', path: '/transactions' },
      { icon: BarChart3,  label: 'Relatórios', path: '/reports' },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { icon: Settings, label: 'Configurações', path: '/settings' },
      { icon: Crown,    label: 'Assinatura',     path: '/subscription' },
    ],
  },
]

const quickActions = [
  { icon: CalendarPlus, label: 'Novo agendamento', path: '/appointments', state: { openNew: true } },
  { icon: Wallet,       label: 'Nova transação',   path: '/transactions', state: { openNew: true } },
  { icon: UserPlus,     label: 'Novo paciente',    path: '/contacts',     state: { openNew: true } },
  { icon: Brain,        label: 'Ir para Coaching', path: '/coaching' },
]

const moreMenuPaths = moreMenuGroups.flatMap(g => g.items.map(i => i.path))

export function BottomNavigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isDarkMode } = useTheme()
  const [quickOpen, setQuickOpen] = useState(false)

  const handleNavigation = (path, state) => {
    navigate(path, state ? { state } : undefined)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navBg    = isDarkMode ? '#161616' : '#ffffff'
  const navBord  = isDarkMode ? '#242424' : '#E3E2DF'
  const active   = '#4C60AA'
  const inactive = isDarkMode ? '#4A4A4A' : '#AEAEAD'

  return (
    <>
      <nav
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          background: navBg, borderTop: `1.5px solid ${navBord}`,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', height: 60, paddingLeft: 4, paddingRight: 4 }}>

          {/* Left nav items */}
          {bottomNavItems.slice(0, 2).map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                style={{
                  flex: 1, height: '100%', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 3,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: isActive ? active : inactive,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div style={{ position: 'relative' }}>
                  <Icon style={{ width: 22, height: 22 }} />
                  {isActive && (
                    <span style={{
                      position: 'absolute', bottom: -3, left: '50%', transform: 'translateX(-50%)',
                      width: 4, height: 4, borderRadius: '50%', background: active,
                    }} />
                  )}
                </div>
                <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, letterSpacing: '-0.01em' }}>
                  {item.label}
                </span>
              </button>
            )
          })}

          {/* Centro: botão "+" */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Sheet open={quickOpen} onOpenChange={setQuickOpen}>
              <SheetTrigger asChild>
                <button
                  style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: active, border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(76,96,170,0.45)',
                    WebkitTapHighlightColor: 'transparent',
                    transform: quickOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                    transition: 'transform 200ms ease',
                  }}
                  aria-label="Ações rápidas"
                >
                  <Plus style={{ width: 22, height: 22, color: '#fff' }} />
                </button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                style={{
                  background: navBg, borderColor: navBord,
                  borderTopLeftRadius: 20, borderTopRightRadius: 20,
                  padding: '20px 20px 32px',
                }}
              >
                <div style={{ width: 36, height: 4, borderRadius: 2, background: navBord, margin: '0 auto 20px' }} />
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: inactive, marginBottom: 12 }}>
                  Criar novo
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {quickActions.map((a) => {
                    const Icon = a.icon
                    return (
                      <button
                        key={a.label}
                        onClick={() => { setQuickOpen(false); handleNavigation(a.path, a.state) }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 14,
                          padding: '13px 14px', borderRadius: 14,
                          background: isDarkMode ? '#1F1F1F' : '#F5F5F2',
                          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        <div style={{
                          width: 38, height: 38, borderRadius: 10,
                          background: active + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon style={{ width: 18, height: 18, color: active }} />
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 600, color: isDarkMode ? '#E0E0E0' : '#1A1A1A' }}>
                          {a.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Right nav items */}
          {bottomNavItems.slice(2).map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                style={{
                  flex: 1, height: '100%', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 3,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: isActive ? active : inactive,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div style={{ position: 'relative' }}>
                  <Icon style={{ width: 22, height: 22 }} />
                  {isActive && (
                    <span style={{
                      position: 'absolute', bottom: -3, left: '50%', transform: 'translateX(-50%)',
                      width: 4, height: 4, borderRadius: '50%', background: active,
                    }} />
                  )}
                </div>
                <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, letterSpacing: '-0.01em' }}>
                  {item.label}
                </span>
              </button>
            )
          })}

          {/* Mais */}
          <Sheet>
            <SheetTrigger asChild>
              <button
                style={{
                  flex: 1, height: '100%', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 3,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: moreMenuPaths.some(p => location.pathname.startsWith(p)) ? active : inactive,
                  WebkitTapHighlightColor: 'transparent',
                }}
                aria-label="Mais opções"
              >
                <div style={{ position: 'relative' }}>
                  <MoreHorizontal style={{ width: 22, height: 22 }} />
                  {moreMenuPaths.some(p => location.pathname.startsWith(p)) && (
                    <span style={{
                      position: 'absolute', bottom: -3, left: '50%', transform: 'translateX(-50%)',
                      width: 4, height: 4, borderRadius: '50%', background: active,
                    }} />
                  )}
                </div>
                <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '-0.01em' }}>Mais</span>
              </button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              style={{
                background: navBg, borderColor: navBord,
                borderTopLeftRadius: 20, borderTopRightRadius: 20,
                maxHeight: '70vh', overflowY: 'auto',
              }}
            >
              <div style={{ width: 36, height: 4, borderRadius: 2, background: navBord, margin: '12px auto 20px' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '0 4px 24px' }}>
                {moreMenuGroups.map((group) => (
                  <div key={group.title}>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: inactive, marginBottom: 4, paddingLeft: 12 }}>
                      {group.title}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {group.items.map((item) => {
                        const Icon = item.icon
                        const isActive = location.pathname === item.path
                        return (
                          <button
                            key={item.path}
                            onClick={() => handleNavigation(item.path)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 12,
                              padding: '11px 12px', borderRadius: 12,
                              background: isActive ? (isDarkMode ? '#1F2D40' : '#EEF2FA') : 'transparent',
                              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                              color: isActive ? active : (isDarkMode ? '#5A5A5A' : '#6B6B6B'),
                              WebkitTapHighlightColor: 'transparent',
                            }}
                          >
                            <div style={{
                              width: 36, height: 36, borderRadius: 10,
                              background: isActive ? (isDarkMode ? '#1F2D40' : '#EEF2FA') : (isDarkMode ? '#1F1F1F' : '#F5F5F2'),
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Icon style={{ width: 18, height: 18 }} />
                            </div>
                            <span style={{ fontSize: 14, fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>

        </div>
      </nav>

      {/* Spacer */}
      <div style={{ height: `calc(60px + env(safe-area-inset-bottom))` }} />
    </>
  )
}
