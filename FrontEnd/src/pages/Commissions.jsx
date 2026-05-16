import { useState, useEffect, useMemo } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DollarSign, Users, Calendar, Loader2, RefreshCw, ChevronDown, ChevronUp, Percent } from 'lucide-react'
import { apiService } from '../lib/api'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { useIsMobile } from '@/hooks/use-mobile'
import { T, DISPLAY } from '@/lib/tokens'

const fmtBRL = (cents) => {
  if (typeof cents === 'object' && cents?.cents !== undefined) {
    const v = cents.cents || 0
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: cents.currency || 'BRL' }).format(v / 100)
  }
  const v = cents || 0
  if (isNaN(v) || !isFinite(v)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v / 100)
}

const fmtDate = (d) => {
  if (!d) return '—'
  try { return format(parseISO(d), 'dd/MM/yy HH:mm', { locale: ptBR }) }
  catch { try { return format(new Date(d), 'dd/MM/yy HH:mm', { locale: ptBR }) } catch { return d } }
}

function Panel({ children, style }) {
  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, ...style }}>
      {children}
    </div>
  )
}

function Avatar({ name, size = 36 }) {
  const initial = (name || '?').charAt(0).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.25,
      background: T.chip, color: T.brand,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.38, flexShrink: 0,
    }}>
      {initial}
    </div>
  )
}

export function Commissions() {
  const isMobile = useIsMobile()

  const [startDate, setStartDate] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
  )
  const [endDate, setEndDate] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd')
  )
  const [selectedProfessional, setSelectedProfessional] = useState('all')
  const [professionals, setProfessionals] = useState([])
  const [commissionsData, setCommissionsData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedProfs, setExpandedProfs] = useState({})

  useEffect(() => {
    apiService.getProfessionals()
      .then(r => setProfessionals(Array.isArray(r) ? r : []))
      .catch(() => {})
  }, [])

  const loadCommissions = async () => {
    setLoading(true); setError(null)
    try {
      const professionalId = selectedProfessional !== 'all' ? selectedProfessional : null
      const r = await apiService.getCommissions(startDate, endDate, professionalId)
      setCommissionsData(r)
      // auto-expand if only one professional
      if (r?.commissions?.length === 1) {
        setExpandedProfs({ [r.commissions[0].professional.id]: true })
      }
    } catch (err) {
      setError(err.message || 'Erro ao carregar comissões')
    } finally { setLoading(false) }
  }

  useEffect(() => { loadCommissions() }, [startDate, endDate, selectedProfessional])

  const toggleProf = (id) =>
    setExpandedProfs(p => ({ ...p, [id]: !p[id] }))

  // Ranking data for horizontal bars
  const rankingData = useMemo(() => {
    if (!commissionsData?.commissions?.length) return []
    const total = commissionsData.commissions.reduce(
      (s, p) => s + (p.total_commission?.cents || 0), 0
    )
    return commissionsData.commissions
      .map(p => ({
        id: p.professional.id,
        name: p.professional.name,
        amount: p.total_commission?.cents || 0,
        sessions: p.commissions?.length || 0,
        pct: total > 0 ? ((p.total_commission?.cents || 0) / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [commissionsData])

  const summary = commissionsData?.summary

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: isMobile ? 80 : 0, ...DISPLAY }}>

      {/* ══ HERO ═══════════════════════════════════ */}
      <div style={{
        background: T.hero, borderRadius: 12,
        padding: isMobile ? '20px 20px' : '22px 28px',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
        justifyContent: 'space-between', gap: 16,
      }}>
        <div>
          <p style={{ fontSize: isMobile ? 18 : 21, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
            Comissões
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0, marginTop: 2 }}>
            {summary
              ? `${format(parseISO(summary.period.start_date), "dd 'de' MMM", { locale: ptBR })} → ${format(parseISO(summary.period.end_date), "dd 'de' MMM yyyy", { locale: ptBR })}`
              : 'Período selecionado'}
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? 20 : 36 }}>
          <div>
            <p style={{ fontSize: isMobile ? 19 : 22, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
              {summary ? fmtBRL(summary.total_revenue) : '—'}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Receita gerada</p>
          </div>
          <div>
            <p style={{ fontSize: isMobile ? 19 : 22, fontWeight: 700, color: T.green, margin: 0, letterSpacing: '-0.02em' }}>
              {summary ? fmtBRL(summary.total_commissions) : '—'}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Total a pagar</p>
          </div>
          <div>
            <p style={{ fontSize: isMobile ? 19 : 22, fontWeight: 700, color: 'rgba(255,255,255,0.7)', margin: 0, letterSpacing: '-0.02em' }}>
              {summary?.total_revenue?.cents > 0
                ? `${((summary.total_commissions.cents / summary.total_revenue.cents) * 100).toFixed(1)}%`
                : '—'}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Taxa média</p>
          </div>
          <div>
            <p style={{ fontSize: isMobile ? 19 : 22, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
              {summary?.total_appointments ?? '—'}
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Sessões</p>
          </div>
        </div>
      </div>

      {/* ══ FILTROS ════════════════════════════════ */}
      <Panel style={{ padding: '14px 16px' }}>
        <div style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 10,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              De
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={{
                border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 10px',
                fontSize: 13, color: T.text, background: T.bg, fontFamily: 'inherit',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 130 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Até
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              style={{
                border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 10px',
                fontSize: 13, color: T.text, background: T.bg, fontFamily: 'inherit',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 180 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Profissional
            </label>
            <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
              <SelectTrigger style={{ height: 36, fontSize: 13, border: `1px solid ${T.border}`, background: T.bg, borderRadius: 8 }}>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os profissionais</SelectItem>
                {professionals.map(p => (
                  <SelectItem key={p.id} value={p.id.toString()}>{p.name || p.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button
            onClick={loadCommissions}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 600, color: T.brand,
              background: T.chip, border: `1px solid #DDE3F5`,
              borderRadius: 8, padding: '7px 14px', cursor: 'pointer',
              fontFamily: 'inherit', marginLeft: 'auto',
            }}
          >
            {loading
              ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
              : <RefreshCw size={14} />}
            Atualizar
          </button>
        </div>
      </Panel>

      {/* ══ ERRO ═══════════════════════════════════ */}
      {error && (
        <div style={{ background: T.red + '12', border: `1px solid ${T.red}30`, borderRadius: 10, padding: '12px 16px', fontSize: 13, color: T.red }}>
          {error}
        </div>
      )}

      {/* ══ LOADING ════════════════════════════════ */}
      {loading && !commissionsData && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
          <Loader2 size={24} style={{ color: T.brand, animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {/* ══ RANKING ════════════════════════════════ */}
      {rankingData.length > 1 && (
        <Panel>
          <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${T.border}` }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted, margin: 0 }}>
              Ranking do período
            </p>
          </div>
          <div style={{ padding: '8px 20px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {rankingData.map((p, i) => (
              <div key={p.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.muted, width: 16, textAlign: 'right', flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  <Avatar name={p.name} size={28} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.text, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </span>
                  <span style={{ fontSize: 11, color: T.muted, flexShrink: 0 }}>
                    {p.sessions} sessões
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.green, flexShrink: 0, minWidth: 90, textAlign: 'right' }}>
                    {fmtBRL(p.amount)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 16, flexShrink: 0 }} />
                  <div style={{ flex: 1, height: 5, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${p.pct}%`, height: '100%', background: T.brand, borderRadius: 3, transition: 'width 400ms ease' }} />
                  </div>
                  <span style={{ fontSize: 11, color: T.muted, width: 36, textAlign: 'right', flexShrink: 0 }}>
                    {p.pct.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ══ POR PROFISSIONAL ═══════════════════════ */}
      {!loading && commissionsData?.commissions?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {commissionsData.commissions.map((profComm) => {
            const isOpen = !!expandedProfs[profComm.professional.id]
            const totalCents = profComm.total_commission?.cents || 0
            const sessions = profComm.commissions?.length || 0
            return (
              <Panel key={profComm.professional.id}>
                {/* Cabeçalho do profissional */}
                <div
                  onClick={() => toggleProf(profComm.professional.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 20px', cursor: 'pointer',
                    borderBottom: isOpen ? `1px solid ${T.border}` : 'none',
                    transition: 'background 100ms',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = T.bg}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Avatar name={profComm.professional.name} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0 }}>
                      {profComm.professional.name}
                    </p>
                    <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>
                      {profComm.professional.email} · {sessions} {sessions !== 1 ? 'sessões' : 'sessão'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 18, fontWeight: 700, color: T.green, margin: 0, letterSpacing: '-0.02em' }}>
                      {fmtBRL(totalCents)}
                    </p>
                    <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>a pagar</p>
                  </div>
                  <div style={{ color: T.muted, flexShrink: 0, marginLeft: 4 }}>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Lista de comissões */}
                {isOpen && (
                  isMobile ? (
                    <div style={{ padding: '8px 16px 14px', display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {profComm.commissions.map((c, i) => {
                        const isLast = i === profComm.commissions.length - 1
                        const isPerc = c.commission_type === 'percentage'
                        return (
                          <div
                            key={c.id || i}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '9px 0',
                              borderBottom: isLast ? 'none' : `1px solid ${T.border}`,
                              borderLeft: `3px solid ${T.green}`,
                              paddingLeft: 10, marginLeft: -4,
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {c.client}
                              </p>
                              <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>
                                {c.service} · {fmtDate(c.date)}
                              </p>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <p style={{ fontSize: 13, fontWeight: 700, color: T.green, margin: 0 }}>
                                {fmtBRL(c.commission_amount)}
                              </p>
                              <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>
                                {isPerc ? `${c.commission_value}%` : 'Fixo'} de {fmtBRL(c.appointment_price)}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: '0 0 4px' }}>
                      <Table>
                        <TableHeader>
                          <TableRow style={{ background: T.bg }}>
                            <TableHead style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Data</TableHead>
                            <TableHead style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cliente</TableHead>
                            <TableHead style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Serviço</TableHead>
                            <TableHead style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Atendimento</TableHead>
                            <TableHead style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Taxa</TableHead>
                            <TableHead style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>Comissão</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {profComm.commissions.map((c, i) => {
                            const isPerc = c.commission_type === 'percentage'
                            return (
                              <TableRow
                                key={c.id || i}
                                style={{ borderLeft: `3px solid ${T.green}`, transition: 'background 100ms' }}
                                onMouseEnter={e => e.currentTarget.style.background = T.bg}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                              >
                                <TableCell style={{ fontSize: 12, color: T.muted, whiteSpace: 'nowrap', paddingLeft: 20 }}>
                                  {fmtDate(c.date)}
                                </TableCell>
                                <TableCell style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                                  {c.client}
                                </TableCell>
                                <TableCell style={{ fontSize: 13, color: T.muted }}>
                                  {c.service}
                                </TableCell>
                                <TableCell style={{ fontSize: 13, color: T.muted }}>
                                  {fmtBRL(c.appointment_price)}
                                </TableCell>
                                <TableCell>
                                  <span style={{
                                    borderRadius: 20, padding: '3px 8px', fontSize: 11, fontWeight: 600,
                                    background: isPerc ? T.chip : T.light,
                                    color: isPerc ? T.brand : T.muted,
                                    display: 'inline-flex', alignItems: 'center', gap: 3,
                                  }}>
                                    {isPerc ? <Percent size={10} /> : null}
                                    {isPerc ? `${c.commission_value}%` : 'Fixo'}
                                  </span>
                                </TableCell>
                                <TableCell style={{ fontWeight: 700, color: T.green, textAlign: 'right', fontSize: 14 }}>
                                  {fmtBRL(c.commission_amount)}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>

                      {/* Subtotal */}
                      <div style={{
                        display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12,
                        padding: '10px 20px', borderTop: `1px solid ${T.border}`,
                        background: T.bg,
                      }}>
                        <span style={{ fontSize: 12, color: T.muted }}>{sessions} {sessions !== 1 ? 'sessões' : 'sessão'}</span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: T.green }}>
                          {fmtBRL(totalCents)}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </Panel>
            )
          })}
        </div>
      )}

      {/* ══ EMPTY ══════════════════════════════════ */}
      {!loading && commissionsData && commissionsData.commissions?.length === 0 && (
        <Panel style={{ padding: '48px 24px', textAlign: 'center' }}>
          <Percent size={32} style={{ color: T.border, margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, color: T.muted, margin: 0 }}>
            Nenhuma comissão encontrada para o período selecionado.
          </p>
        </Panel>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
