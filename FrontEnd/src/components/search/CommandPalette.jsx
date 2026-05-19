import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Search, X, ChevronRight,
  Home, Calendar, Users, CreditCard, BarChart3, Globe,
  Link2, Scissors, Clock, FileEdit, ClipboardList,
  Percent, Upload, FileText, Crown, Settings, Plus,
  ClipboardCheck, Utensils, ArrowUpRight, ArrowDownLeft,
  Loader2,
} from 'lucide-react'
import { T } from '@/lib/tokens'
import { apiService } from '@/lib/api'
import { useCommandPalette } from '@/contexts/CommandPaletteContext'

// ── Utilitários ──────────────────────────────────────────────────────────────

function norm(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}
function fuzzy(haystack, query) {
  const q = norm(query).trim()
  if (!q) return true
  return q.split(/\s+/).every(w => norm(haystack).includes(w))
}
function formatBRL(cents) {
  return 'R$ ' + (Number(cents || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

// ── Itens estáticos ─────────────────────────────────────────────────────────

const PAGES = [
  { icon: Home,          label: 'Início',               desc: 'Dashboard principal',         path: '/',                   kw: 'inicio home dashboard resumo' },
  { icon: Calendar,      label: 'Agendamentos',         desc: 'Gerenciar agenda',             path: '/appointments',       kw: 'agenda scheduling booking consultas' },
  { icon: Users,         label: 'Pacientes',            desc: 'Lista e prontuários',          path: '/contacts',           kw: 'contatos clientes prontuario ficha historico clinico' },
  { icon: CreditCard,    label: 'Transações',           desc: 'Fluxo financeiro',             path: '/transactions',       kw: 'financeiro pagamentos receitas despesas caixa' },
  { icon: Globe,         label: 'Vitrine',              desc: 'Perfil público',               path: '/vitrine',            kw: 'publico showcase descobrir' },
  { icon: BarChart3,     label: 'Relatórios',           desc: 'Análises e métricas',          path: '/reports',            kw: 'analytics graficos metricas dre extrato' },
  { icon: Percent,       label: 'Comissões',            desc: 'Comissões por profissional',   path: '/commissions',        kw: '' },
  { icon: Link2,         label: 'Links de Agendamento', desc: 'Links públicos de agenda',     path: '/appointment-links',  kw: 'links booking url' },
  { icon: Users,         label: 'Profissionais',        desc: 'Equipe',                       path: '/professionals',      kw: 'equipe team staff colaboradores' },
  { icon: Scissors,      label: 'Serviços',             desc: 'Catálogo de serviços',         path: '/services',           kw: 'servicos catalog procedimentos' },
  { icon: Clock,         label: 'Horários',             desc: 'Horários de atendimento',      path: '/working-hours',      kw: 'horario disponibilidade availability grade' },
  { icon: FileEdit,      label: 'Documentos',           desc: 'Modelos de documentos',        path: '/document-templates', kw: 'templates docs modelos' },
  { icon: ClipboardList, label: 'Anamnese',             desc: 'Formulários de anamnese',      path: '/anamnese',           kw: 'forms formularios questionario' },
  { icon: Upload,        label: 'Importações',          desc: 'Importar dados',               path: '/imports',            kw: 'import csv dados' },
  { icon: FileText,      label: 'Conciliações',         desc: 'Conciliação financeira',       path: '/reconciliations',    kw: 'conciliar financeiro' },
  { icon: Crown,         label: 'Assinatura',           desc: 'Plano e faturamento',          path: '/subscription',       kw: 'plano billing plan pagamento' },
  { icon: Settings,      label: 'Configurações',        desc: 'Empresa e preferências',       path: '/company-settings',   kw: 'empresa settings cnpj cpf preferences' },
]

const ACTIONS = [
  { icon: Plus, label: 'Novo Paciente',    desc: 'Cadastrar novo paciente',   path: '/contacts',     kw: 'criar add novo prontuario' },
  { icon: Plus, label: 'Nova Transação',   desc: 'Lançar receita ou despesa', path: '/transactions', kw: 'criar add financeiro' },
  { icon: Plus, label: 'Novo Agendamento', desc: 'Criar agendamento',         path: '/appointments', kw: 'criar add booking' },
]

// ── Subcomponente de item ────────────────────────────────────────────────────

function ResultItem({ item, active, globalIdx, onSelect, onHover }) {
  const Icon = item.icon
  return (
    <div
      data-idx={globalIdx}
      onClick={() => onSelect(item)}
      onMouseEnter={() => onHover(globalIdx)}
      style={{
        display: 'flex', alignItems: 'center', gap: 11,
        padding: '8px 14px', cursor: 'pointer',
        background: active ? T.brand + '12' : 'transparent',
        borderLeft: `3px solid ${active ? T.brand : 'transparent'}`,
        transition: 'background 60ms, border-color 60ms',
      }}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 7, flexShrink: 0,
        background: active ? (item.iconBg || T.brand) : T.chip,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 60ms',
      }}>
        <Icon size={14} style={{ color: active ? '#fff' : (item.iconColor || T.muted) }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.label}
        </p>
        {item.desc && (
          <p style={{ fontSize: 11, color: T.muted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</p>
        )}
      </div>
      {item.badge && (
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '2px 6px',
          borderRadius: 4, background: (item.badgeColor || T.brand) + '20',
          color: item.badgeColor || T.brand, flexShrink: 0, whiteSpace: 'nowrap',
        }}>{item.badge}</span>
      )}
      {active && <ChevronRight size={13} style={{ color: T.brand, flexShrink: 0 }} />}
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────

export function CommandPalette() {
  const { isOpen, close } = useCommandPalette()
  const navigate = useNavigate()

  const [query,         setQuery]         = useState('')
  const [contacts,      setContacts]      = useState([])
  const [transactions,  setTransactions]  = useState([])
  const [appointments,  setAppointments]  = useState([])
  const [mealPlanCache, setMealPlanCache] = useState({}) // contactId → plan[]
  const [activeIdx,     setActiveIdx]     = useState(0)
  const [loading,       setLoading]       = useState(false)

  const inputRef  = useRef(null)
  const listRef   = useRef(null)
  const planTimer = useRef(null)

  // ── Abrir: foco + fetch inicial ──────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) { setQuery(''); setActiveIdx(0); return }

    requestAnimationFrame(() => inputRef.current?.focus())
    setLoading(true)

    Promise.all([
      apiService.getContacts(1, 100).then(r => r?.contacts || []).catch(() => []),
      apiService.getTransactions(1, 80).then(r => r?.transactions || []).catch(() => []),
      apiService.getAppointments({ per_page: 60 }).then(r => Array.isArray(r) ? r : (r?.appointments || [])).catch(() => []),
    ]).then(([c, t, a]) => {
      setContacts(c)
      setTransactions(t)
      setAppointments(a)
    }).finally(() => setLoading(false))
  }, [isOpen])

  // ── Fechar com Escape ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    const h = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [isOpen, close])

  // ── Planos alimentares: carga lazy para pacientes encontrados ────────────
  useEffect(() => {
    clearTimeout(planTimer.current)
    if (!isOpen || query.length < 2) return

    planTimer.current = setTimeout(() => {
      const matched = contacts
        .filter(c => fuzzy(c.name || '', query))
        .slice(0, 4)
        .filter(c => !(c.id in mealPlanCache))

      if (!matched.length) return

      Promise.all(
        matched.map(c =>
          apiService.getMealPlans(c.id)
            .then(r => [c.id, r?.meal_plans || []])
            .catch(() => [c.id, []])
        )
      ).then(pairs => {
        setMealPlanCache(prev => {
          const next = { ...prev }
          pairs.forEach(([id, plans]) => { next[id] = plans })
          return next
        })
      })
    }, 300)

    return () => clearTimeout(planTimer.current)
  }, [query, contacts, isOpen])

  // ── Montar grupos de resultado ───────────────────────────────────────────
  const groups = useMemo(() => {
    const q = query.trim()
    const raw = []

    // ── Ações rápidas ──────────────────────────────────────────────────────
    const actions = ACTIONS.filter(a => fuzzy(`${a.label} ${a.desc} ${a.kw}`, q))
    if (actions.length) {
      raw.push({ label: 'Ações Rápidas', items: actions.map(a => ({ ...a, type: 'action' })) })
    }

    // ── Páginas ────────────────────────────────────────────────────────────
    const pages = PAGES.filter(p => fuzzy(`${p.label} ${p.desc} ${p.kw}`, q))
    if (pages.length) {
      raw.push({ label: 'Páginas', items: pages.map(p => ({ ...p, type: 'page' })) })
    }

    if (q.length >= 1) {

      // ── Prontuários ──────────────────────────────────────────────────────
      const matchedContacts = contacts.filter(c =>
        fuzzy(`${c.name || ''} ${c.email || ''} ${c.phone || ''} prontuario ficha`, q)
      ).slice(0, 6)

      if (matchedContacts.length) {
        raw.push({
          label: 'Prontuários',
          items: matchedContacts.map(c => ({
            icon: ClipboardCheck,
            label: c.name || 'Paciente',
            desc: [c.email, c.phone].filter(Boolean).join(' · ') || 'Abrir prontuário',
            path: `/contacts/${c.id}`,
            type: 'prontuario',
          })),
        })
      }

      // ── Planos alimentares ───────────────────────────────────────────────
      const planItems = []
      // Planos de pacientes que combinam com a query
      matchedContacts.forEach(contact => {
        const plans = mealPlanCache[contact.id]
        if (!plans) return
        plans.forEach(plan => {
          planItems.push({
            icon: Utensils,
            label: plan.name || 'Plano Alimentar',
            desc: contact.name,
            badge: plan.active ? 'Ativo' : undefined,
            badgeColor: '#10B981',
            path: `/contacts/${contact.id}/meal-plans/${plan.id}`,
            type: 'meal_plan',
          })
        })
      })
      // Busca ampla em todo o cache: quando query é sobre "plano"/"alimentar"/"dieta"
      if (fuzzy('plano alimentar nutricao dieta refeicao', q) && q.length >= 4) {
        Object.entries(mealPlanCache).forEach(([contactId, plans]) => {
          const contact = contacts.find(c => String(c.id) === String(contactId))
          if (!contact) return
          plans.forEach(plan => {
            if (!planItems.some(p => p.path.includes(`/meal-plans/${plan.id}`))) {
              planItems.push({
                icon: Utensils,
                label: plan.name || 'Plano Alimentar',
                desc: contact.name,
                badge: plan.active ? 'Ativo' : undefined,
                badgeColor: '#10B981',
                path: `/contacts/${contactId}/meal-plans/${plan.id}`,
                type: 'meal_plan',
              })
            }
          })
        })
      }
      // Filtro adicional: se query contém nome de plano específico
      const filteredPlans = planItems.filter(p =>
        fuzzy(`${p.label} ${p.desc} plano alimentar nutricao`, q)
      )
      if (filteredPlans.length) {
        raw.push({ label: 'Planos Alimentares', items: filteredPlans.slice(0, 8) })
      }

      // ── Transações ───────────────────────────────────────────────────────
      const txItems = transactions.filter(t =>
        fuzzy(`${t.name || t.description || ''} ${t.category?.name || ''}`, q)
      ).slice(0, 6).map(t => {
        const isReceita = t.transaction_type_cd === 0
        const valor = formatBRL(t.amount_cents)
        const data = t.due_date || t.paid_at
          ? format(new Date(t.due_date || t.paid_at), 'dd/MM/yy', { locale: ptBR })
          : null
        return {
          icon: isReceita ? ArrowUpRight : ArrowDownLeft,
          iconColor: isReceita ? '#10B981' : '#EF4444',
          label: t.name || t.description || 'Transação',
          desc: [valor, t.category?.name, data].filter(Boolean).join(' · '),
          badge: t.status === 'paid' ? 'Pago' : t.status === 'pending' ? 'Pendente' : null,
          badgeColor: t.status === 'paid' ? '#10B981' : '#F59E0B',
          // Navega para /transactions com busca pré-preenchida
          path: '/transactions',
          state: { search: t.name || t.description || '' },
          type: 'transaction',
        }
      })
      if (txItems.length) {
        raw.push({ label: 'Transações', items: txItems })
      }

      // ── Agendamentos ─────────────────────────────────────────────────────
      const aptItems = appointments.filter(a => {
        const patient = a.contact?.name || a.client?.name || a.whatsapp_number || ''
        const service = a.service?.name || ''
        const professional = a.professional?.name || ''
        return fuzzy(`${patient} ${service} ${professional}`, q)
      }).slice(0, 5).map(a => {
        const patient = a.contact?.name || a.client?.name || a.whatsapp_number || 'Paciente'
        const service = a.service?.name || ''
        const dataStr = a.start_time
          ? format(new Date(a.start_time), "dd/MM 'às' HH:mm", { locale: ptBR })
          : null
        return {
          icon: Calendar,
          label: patient,
          desc: [service, dataStr].filter(Boolean).join(' · '),
          path: '/appointments',
          state: { search: patient },
          type: 'appointment',
        }
      })
      if (aptItems.length) {
        raw.push({ label: 'Agendamentos', items: aptItems })
      }
    }

    // Anotação de índice global plano (para navegação ↑↓)
    let idx = 0
    return raw.map(group => ({
      ...group,
      items: group.items.map(item => ({ ...item, _idx: idx++ })),
    }))
  }, [query, contacts, transactions, appointments, mealPlanCache])

  const totalItems = groups.reduce((s, g) => s + g.items.length, 0)

  useEffect(() => { setActiveIdx(0) }, [query])

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${activeIdx}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'instant' })
  }, [activeIdx])

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => (i + 1) % (totalItems || 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => (i - 1 + (totalItems || 1)) % (totalItems || 1)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      const item = groups.flatMap(g => g.items)[activeIdx]
      if (item) select(item)
    }
  }

  const select = (item) => {
    close()
    navigate(item.path, item.state ? { state: item.state } : undefined)
  }

  if (!isOpen) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.48)',
          backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
          zIndex: 9000, animation: 'cp-fade-in 120ms ease',
        }}
      />

      {/* Palette */}
      <div style={{
        position: 'fixed', top: '14vh', left: '50%',
        transform: 'translateX(-50%)',
        width: '100%', maxWidth: 620,
        padding: '0 16px', boxSizing: 'border-box',
        zIndex: 9001, animation: 'cp-slide-in 140ms cubic-bezier(0.16,1,0.3,1)',
      }}>
        <div style={{
          background: T.white, borderRadius: 16,
          border: `1px solid ${T.border}`,
          boxShadow: '0 32px 64px rgba(0,0,0,0.22), 0 8px 24px rgba(0,0,0,0.12)',
          overflow: 'hidden',
        }}>

          {/* ── Input ──────────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
            borderBottom: (totalItems > 0 || query || !query) ? `1px solid ${T.border}` : 'none',
          }}>
            {loading
              ? <Loader2 size={17} style={{ color: T.muted, flexShrink: 0, animation: 'cp-spin 0.8s linear infinite' }} />
              : <Search size={17} style={{ color: T.muted, flexShrink: 0 }} />
            }
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pacientes, prontuários, planos, transações, agendamentos..."
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontSize: 15, color: T.text,
                fontFamily: "'Space Grotesk', system-ui, sans-serif",
              }}
              autoComplete="off"
              spellCheck={false}
            />
            {query ? (
              <button
                onClick={() => { setQuery(''); inputRef.current?.focus() }}
                style={{ border: 'none', background: T.chip, cursor: 'pointer', color: T.muted, display: 'flex', padding: '3px 5px', borderRadius: 5, alignItems: 'center' }}
              >
                <X size={13} />
              </button>
            ) : (
              <kbd style={{ fontSize: 11, color: T.muted, background: T.chip, border: `1px solid ${T.border}`, borderRadius: 5, padding: '2px 7px', fontFamily: 'monospace', flexShrink: 0, lineHeight: 1.6 }}>
                Ctrl K
              </kbd>
            )}
          </div>

          {/* ── Resultados ─────────────────────────── */}
          {totalItems > 0 && (
            <div ref={listRef} style={{ maxHeight: 420, overflowY: 'auto', padding: '4px 0' }}>
              {groups.map(group => (
                <div key={group.label}>
                  <p style={{ margin: 0, padding: '10px 16px 3px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: T.muted }}>
                    {group.label}
                  </p>
                  {group.items.map(item => (
                    <ResultItem
                      key={item.path + item._idx}
                      item={item}
                      active={item._idx === activeIdx}
                      globalIdx={item._idx}
                      onSelect={select}
                      onHover={setActiveIdx}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Sem resultados */}
          {totalItems === 0 && query && !loading && (
            <div style={{ padding: '28px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>
                Nenhum resultado para <strong style={{ color: T.text }}>"{query}"</strong>
              </p>
            </div>
          )}

          {/* Estado inicial — sem query */}
          {!query && (
            <div style={{ padding: '6px 14px 10px' }}>
              {[
                { icon: ClipboardCheck, text: 'Nome do paciente → abre o prontuário diretamente',     color: T.brand },
                { icon: Utensils,       text: 'Nome do paciente → carrega os planos alimentares',     color: '#10B981' },
                { icon: CreditCard,     text: 'Descrição da transação → filtra as transações',        color: '#F59E0B' },
                { icon: Calendar,       text: 'Nome do paciente → filtra os agendamentos',             color: '#8B5CF6' },
              ].map(({ icon: Icon, text, color }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 2px' }}>
                  <Icon size={13} style={{ color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: T.muted }}>{text}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Barra de atalhos ───────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '7px 14px', borderTop: `1px solid ${T.border}`, background: T.chip,
          }}>
            {[['↑↓', 'navegar'], ['↵', 'selecionar'], ['Esc', 'fechar']].map(([key, label]) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <kbd style={{ fontSize: 10, color: T.muted, background: T.white, border: `1px solid ${T.border}`, borderRadius: 4, padding: '1px 5px', fontFamily: 'monospace', lineHeight: 1.6 }}>{key}</kbd>
                <span style={{ fontSize: 11, color: T.muted }}>{label}</span>
              </span>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: 11, color: T.muted }}>
              {loading ? 'Carregando...' : totalItems > 0 ? `${totalItems} resultado${totalItems !== 1 ? 's' : ''}` : 'Ctrl K para abrir'}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cp-fade-in  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cp-slide-in {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px) scale(0.97) }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1) }
        }
        @keyframes cp-spin { to { transform: rotate(360deg) } }
      `}</style>
    </>,
    document.body
  )
}
