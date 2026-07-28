import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import {
  Home, Users,
  X, ChevronLeft, ChevronRight, ChevronDown,
  Calendar, Apple, Clock, Link2, Crown, Shield, FileEdit, Globe, ClipboardList, UtensilsCrossed, Brain, MessageCircle,
} from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { COACHING_ONLY } from '../../config/featureFlags'

const BRAND = '#4C60AA'

/* ─── Estrutura de navegação em grupos ────────── */
const FULL_NAV = [
  {
    label: null,
    items: [
      { icon: Home,       label: 'Início',       path: '/' },
      { icon: Brain,      label: 'Coaching',     path: '/coaching' },
      { icon: Users,      label: 'Atletas',      path: '/contacts' },
      { icon: Calendar,   label: 'Agendamentos', path: '/appointments' },
      { icon: Globe,      label: 'Vitrine',      path: '/vitrine' },
    ],
  },
  {
    label: 'Nutrição',
    collapsible: true,
    storageKey: 'orbi_nutri_nav',
    items: [
      { icon: UtensilsCrossed, label: 'Modelos Alim.', path: '/meal-plan-templates' },
    ],
  },
  {
    label: 'Configurar',
    collapsible: true,
    storageKey: 'orbi_config_nav',
    items: [
      { icon: Link2,         label: 'Links',         path: '/appointment-links' },
      { icon: Users,         label: 'Profissionais', path: '/professionals' },
      { icon: Apple,         label: 'Serviços',      path: '/services' },
      { icon: Clock,         label: 'Horários',      path: '/working-hours' },
      { icon: FileEdit,         label: 'Documentos',    path: '/document-templates' },
      { icon: ClipboardList,    label: 'Anamnese',      path: '/anamnese' },
    ],
  },
  {
    label: null,
    items: [
      { icon: Crown,  label: 'Assinatura', path: '/subscription' },
      { icon: Shield, label: 'Admin',      path: '/admin', adminOnly: true },
    ],
  },
]

/* Menu enxuto do modo coaching — só o fluxo essencial:
   análise (Coaching), atletas e a conexão do WhatsApp (recebimento de áudio/mensagem). */
const COACHING_NAV = [
  {
    label: null,
    items: [
      { icon: Brain, label: 'Coaching', path: '/coaching' },
      { icon: Users, label: 'Atletas',  path: '/contacts' },
    ],
  },
  {
    label: 'Configurar',
    items: [
      { icon: MessageCircle, label: 'WhatsApp', path: '/settings' },
    ],
  },
]

const NAV = COACHING_ONLY ? COACHING_NAV : FULL_NAV

export function Sidebar({ isCollapsed, setIsCollapsed, isMobile, setIsMobileOpen }) {
  const location = useLocation()
  const navigate  = useNavigate()
  const { isDarkMode } = useTheme()
  const { user }  = useAuth()
  const isAdmin   = user?.admin === true

  // Persistir estado de cada grupo colapsável { storageKey → bool }
  // Padrão: aberto (true) — seções fecham por preferência do usuário, não por default
  const [openSections, setOpenSections] = useState(() => {
    const result = {}
    NAV.forEach(s => {
      if (s.collapsible && s.storageKey) {
        try { result[s.storageKey] = JSON.parse(localStorage.getItem(s.storageKey) ?? 'true') }
        catch { result[s.storageKey] = true }
      }
    })
    return result
  })

  const toggleSection = (storageKey) => {
    setOpenSections(prev => {
      const next = { ...prev, [storageKey]: !prev[storageKey] }
      localStorage.setItem(storageKey, JSON.stringify(next[storageKey]))
      return next
    })
  }

  const toggleSidebar = () => {
    if (isMobile) setIsMobileOpen(false)
    else if (typeof setIsCollapsed === 'function') setIsCollapsed()
  }

  const bg        = isDarkMode ? '#161616' : '#FFFFFF'
  const border    = isDarkMode ? '#242424' : '#E3E2DF'
  const headerBg  = isDarkMode ? '#1A1A1A' : '#F9F8F5'
  const iconDim   = isDarkMode ? '#4A4A4A' : '#AEAEAD'
  const textDim   = isDarkMode ? '#5A5A5A' : '#8A8A88'
  const labelClr  = isDarkMode ? '#333333' : '#C8C7C4'
  const hoverBg   = isDarkMode ? '#1F1F1F' : '#F5F5F2'

  const collapsed = isCollapsed && !isMobile

  const handleNav = (path) => {
    navigate(path)
    if (isMobile) setIsMobileOpen(false)
  }

  const isActive = (path) => location.pathname === path

  const NavItem = ({ item }) => {
    const Icon   = item.icon
    const active = isActive(item.path)
    return (
      <Link
        to={item.path}
        onClick={() => { if (isMobile) setIsMobileOpen(false) }}
        title={collapsed ? item.label : undefined}
        style={{
          display: 'flex', alignItems: 'center',
          gap: collapsed ? 0 : 9,
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '9px 0' : '7px 10px',
          borderRadius: 8, cursor: 'pointer',
          background: active ? BRAND : 'transparent',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation', userSelect: 'none',
          transition: 'background 120ms ease',
          textDecoration: 'none',
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = hoverBg }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
      >
        <Icon size={15} style={{ color: active ? '#fff' : iconDim, flexShrink: 0 }} />
        {!collapsed && (
          <span style={{ fontSize: 13, fontWeight: 500, color: active ? '#fff' : textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.label}
          </span>
        )}
      </Link>
    )
  }

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: bg, borderRight: `1px solid ${border}`,
      width: '100%', flexShrink: 0,
    }}>

      {/* ── Header ─────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: '10px 10px',
        borderBottom: `1px solid ${border}`,
        background: headerBg, flexShrink: 0,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <img src="/orbi-logo.png" width={28} height={28} alt="Orbi" style={{ flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: isDarkMode ? '#fff' : '#111', margin: 0, letterSpacing: '-0.02em' }}>Orbi</p>
              <p style={{ fontSize: 10, color: iconDim, margin: 0 }}>Gestão Profissional</p>
            </div>
          </div>
        )}
        <button onClick={toggleSidebar} style={{
          padding: 6, border: 'none', borderRadius: 6, cursor: 'pointer',
          background: 'transparent', color: iconDim,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, minHeight: 0, minWidth: 0,
        }}>
          {isMobile ? <X size={15} /> : collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* ── Navigation ─────────────────────────── */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: 6, display: 'flex', flexDirection: 'column', gap: 0 }}>

        {NAV.map((section, si) => {
          const visibleItems = section.items.filter(item => !item.adminOnly || isAdmin)
          if (!visibleItems.length) return null

          // Auto-show collapsible section if a child is currently active
          const hasActive = visibleItems.some(i => isActive(i.path))
          const isCollapsibleSection = section.collapsible && section.storageKey
          const sectionOpen = !isCollapsibleSection || openSections[section.storageKey] || hasActive
          const showItems = sectionOpen

          return (
            <div key={si} style={{ marginBottom: si < NAV.length - 1 ? 4 : 0 }}>

              {/* Section label + toggle (only when expanded) */}
              {!collapsed && section.label && (
                isCollapsibleSection ? (
                  <button
                    onClick={() => toggleSection(section.storageKey)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', padding: '8px 10px 4px',
                      border: 'none', background: 'transparent', cursor: 'pointer',
                      color: labelClr, fontFamily: 'inherit',
                    }}
                  >
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {section.label}
                    </span>
                    <ChevronDown
                      size={12}
                      style={{ color: labelClr, transition: 'transform 200ms ease', transform: showItems ? 'rotate(180deg)' : 'none' }}
                    />
                  </button>
                ) : (
                  <p style={{
                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.08em', color: labelClr,
                    padding: '8px 10px 4px', margin: 0,
                  }}>
                    {section.label}
                  </p>
                )
              )}

              {/* Items */}
              {(!isCollapsibleSection || showItems) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {visibleItems.map(item => <NavItem key={item.path} item={item} />)}
                </div>
              )}

              {/* Separator entre grupos */}
              {si < NAV.length - 1 && !collapsed && (
                <div style={{ height: 1, background: border, margin: '8px 10px 4px' }} />
              )}
            </div>
          )
        })}
      </nav>

      {/* ── Footer ─────────────────────────────── */}
      {!collapsed && (
        <div style={{ padding: '10px 12px', borderTop: `1px solid ${border}`, flexShrink: 0 }}>
          <p style={{ fontSize: 11, color: iconDim, margin: 0, textAlign: 'center', letterSpacing: '0.02em' }}>
            Período de avaliação
          </p>
        </div>
      )}
    </div>
  )
}
