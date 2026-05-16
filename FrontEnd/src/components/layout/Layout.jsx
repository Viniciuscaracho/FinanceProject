import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { BottomNavigation } from './BottomNavigation'
import { SupportBanner } from './SupportBanner'
import { useTheme } from '../../contexts/ThemeContext'
import { useIsMobile, useBreakpoint } from '@/hooks/use-mobile'
import { ArrowUp, AlertTriangle } from 'lucide-react'
import { OnboardingWizard, useOnboarding } from '@/components/onboarding/OnboardingWizard'
import { useQuery } from '@tanstack/react-query'
import { apiService } from '../../lib/api'

function useCompanyDocument() {
  const { data, isFetching } = useQuery({
    queryKey: ['account-settings-doc-check'],
    queryFn: async () => {
      const res = await apiService.getAccountSettings()
      return res?.account?.company?.document_1 || null
    },
    staleTime: 60 * 1000,
    retry: false,
  })
  // While fetching (initial load or re-fetch after save), treat as unknown
  // so the banner never flashes during transitions
  if (isFetching) return undefined
  return data === undefined ? undefined : (data || null)
}

function DocumentWarningBanner({ isMobile }) {
  const navigate = useNavigate()
  const location = useLocation()
  const document1 = useCompanyDocument()

  if (!document1 && document1 !== undefined && location.pathname !== '/company-settings') {
    return (
      <div style={{
        background: '#FEF3C7',
        borderBottom: '1px solid #F59E0B40',
        padding: isMobile ? '8px 12px' : '8px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
      }}>
        <AlertTriangle size={15} style={{ color: '#D97706', flexShrink: 0 }} />
        <p style={{ fontSize: 13, color: '#92400E', margin: 0, flex: 1, lineHeight: 1.4 }}>
          <strong>CPF/CNPJ não cadastrado.</strong> Alguns documentos e relatórios podem ficar incompletos.
        </p>
        <button
          onClick={() => navigate('/company-settings')}
          style={{
            fontSize: 12, fontWeight: 600, color: '#D97706',
            background: 'rgba(217,119,6,0.12)', border: '1px solid #F59E0B60',
            borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          Configurar →
        </button>
      </div>
    )
  }
  return null
}

const SIDEBAR_EXPANDED = 192
const SIDEBAR_COLLAPSED = 56

export function Layout({ children }) {
  const isMobile  = useIsMobile()
  const breakpoint = useBreakpoint()
  const { show: showOnboarding, dismiss: dismissOnboarding } = useOnboarding()
  const { isDarkMode } = useTheme()

  const [isCollapsed,    setIsCollapsed]    = useState(() => {
    if (typeof window === 'undefined') return false
    const w = window.visualViewport?.width || window.innerWidth
    return w < 1536 // colapsa em tudo abaixo de 2xl por padrão
  })
  const [isMobileOpen,   setIsMobileOpen]   = useState(false)
  const [isManualControl, setIsManualControl] = useState(false)
  const [showScrollTop,  setShowScrollTop]  = useState(false)

  /* ── scroll-to-top ───────────────────────────── */
  useEffect(() => {
    const handle = () => setShowScrollTop(window.scrollY > 300)
    window.addEventListener('scroll', handle, { passive: true })
    return () => window.removeEventListener('scroll', handle)
  }, [])

  /* ── auto-collapse baseado em breakpoint ─────── */
  useEffect(() => {
    if (isMobile) return
    // Colapsa em tudo abaixo de 2xl (inclui zoom 110-125% em displays ≤1440px)
    if (['xs', 'sm', 'md', 'lg', 'xl'].includes(breakpoint)) {
      setIsCollapsed(true)
    } else if (!isManualControl && breakpoint === '2xl') {
      setIsCollapsed(false)
    }
  }, [breakpoint, isManualControl, isMobile])

  /* ── fecha drawer mobile ao sair do modo mobile ─ */
  useEffect(() => {
    if (!isMobile) setIsMobileOpen(false)
  }, [isMobile])

  const handleToggleSidebar = useCallback(() => {
    setIsManualControl(true)
    setIsCollapsed(prev => !prev)
  }, [])

  const handleMobileMenuClick = useCallback(() => setIsMobileOpen(true), [])

  /* ── largura do sidebar para cálculo do margin ── */
  const sidebarW = isMobile ? 0 : (isCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED)

  const bg = isDarkMode ? '#111111' : '#F5F5F2'

  return (
    /* Outer shell — overflow-x:hidden aqui captura qualquer vazamento
       horizontal de páginas filhas sem esconder o sidebar (que é fixed). */
    <div style={{ minHeight: '100vh', background: bg }}>
      {showOnboarding && <OnboardingWizard onDone={dismissOnboarding} />}

      {/* ── Overlay mobile ──────────────────────── */}
      {isMobile && isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(2px)',
            zIndex: 40,
          }}
        />
      )}

      {/* ── Sidebar desktop: SEMPRE fixed ────────── */}
      {!isMobile && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          width: isCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED,
          zIndex: 50,
          transition: 'width 280ms ease',
          overflow: 'hidden',
        }}>
          <Sidebar
            isCollapsed={isCollapsed}
            setIsCollapsed={handleToggleSidebar}
            isMobile={false}
            setIsMobileOpen={setIsMobileOpen}
          />
        </div>
      )}

      {/* ── Sidebar mobile: drawer deslizante ────── */}
      {isMobile && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          width: 280,
          zIndex: 50,
          transform: isMobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 280ms ease',
        }}>
          <Sidebar
            isCollapsed={false}
            setIsCollapsed={setIsCollapsed}
            isMobile={true}
            setIsMobileOpen={setIsMobileOpen}
          />
        </div>
      )}

      {/* ── Conteúdo principal ────────────────────
          marginLeft = largura exata do sidebar (fixed).
          O sidebar nunca entra no fluxo do documento,
          então nunca há sobreposição nem corte.        */}
      <div style={{
        marginLeft: sidebarW,
        transition: 'margin-left 280ms ease',
        minHeight: '100vh',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Header
          onMobileMenuClick={handleMobileMenuClick}
          isMobile={isMobile}
        />

        <SupportBanner />
        <DocumentWarningBanner isMobile={isMobile} />

        <main style={{
          flex: 1,
          padding: isMobile ? '8px 8px 80px' : '12px 16px',
          boxSizing: 'border-box',
          width: '100%',
          overflowX: 'auto',
        }}>
          {children}
        </main>

        {isMobile && <BottomNavigation />}
      </div>

      {/* ── Scroll to top ────────────────────────── */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{
            position: 'fixed',
            bottom: isMobile ? 80 : 24,
            right: 16,
            zIndex: 50,
            width: 36, height: 36,
            borderRadius: '50%',
            background: '#4C60AA',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(76,96,170,0.35)',
          }}
          aria-label="Voltar ao topo"
        >
          <ArrowUp style={{ width: 16, height: 16 }} />
        </button>
      )}
    </div>
  )
}
