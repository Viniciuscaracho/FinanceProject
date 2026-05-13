import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import {
  FileText,
  TrendingUp,
  DollarSign,
  Calendar,
  Loader2,
  RefreshCw,
  Receipt,
  Download,
  ChevronDown,
  ChevronRight,
  Users,
  Percent,
  BarChart3,
  AlertCircle,
} from 'lucide-react'
import { apiService } from '../lib/api'
import { useReports, useReport } from '../hooks/useReports'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { T, DISPLAY } from '@/lib/tokens'

/* ─── helpers ─────────────────────────────────────── */
const fmtBRL = (cents, currency = 'BRL') => {
  if (typeof cents === 'object' && cents?.cents !== undefined) {
    return cents.formatted || new Intl.NumberFormat('pt-BR', { style: 'currency', currency: cents.currency || 'BRL' }).format((cents.cents || 0) / 100)
  }
  const v = cents || 0
  if (isNaN(v) || !isFinite(v)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(v / 100)
}

const fmtDate = (d) => {
  if (!d) return '-'
  try { return format(new Date(d), 'dd/MM/yyyy', { locale: ptBR }) } catch { return '-' }
}

const APT_COLORS = ['#4C60AA', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

/* ─── Stat pill ───────────────────────────────────── */
function Stat({ label, value, color }) {
  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 16px' }}>
      <p style={{ fontSize: 11, color: T.muted, margin: '0 0 4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      <p style={{ fontSize: 18, fontWeight: 700, color: color || T.text, margin: 0, letterSpacing: '-0.02em' }}>{value}</p>
    </div>
  )
}

/* ─── Professional accordion row ─────────────────── */
function ProfRow({ prof, isMobile }) {
  const [open, setOpen] = useState(false)
  const revenue    = (prof.total_revenue?.cents || 0) / 100
  const commission = (prof.total_commission?.cents || 0) / 100
  const payout     = (prof.pending_payout?.cents || 0) / 100
  const net        = revenue - commission
  const pct        = revenue > 0 ? ((commission / revenue) * 100).toFixed(1) : '0'

  return (
    <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 6 }}>
      {/* Header row */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px', background: open ? T.chip : T.white,
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          borderBottom: open ? `1px solid ${T.border}` : 'none',
          transition: 'background 150ms',
        }}
      >
        <div style={{
          width: 34, height: 34, borderRadius: 8, background: T.brand + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.brand }}>
            {(prof.professional?.name || 'N')[0].toUpperCase()}
          </span>
        </div>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: 0 }}>{prof.professional?.name || 'N/A'}</p>
          <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>{prof.total_services || 0} serviços</p>
        </div>
        <div style={{ display: 'flex', gap: isMobile ? 8 : 24, alignItems: 'center', flexShrink: 0 }}>
          {!isMobile && (
            <>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>Receita</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: T.green, margin: 0 }}>{fmtBRL(revenue * 100)}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>Comissão {pct}%</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#F59E0B', margin: 0 }}>{fmtBRL(commission * 100)}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>Líquido</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: T.brand, margin: 0 }}>{fmtBRL(net * 100)}</p>
              </div>
            </>
          )}
          {isMobile && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.green, margin: 0 }}>{fmtBRL(revenue * 100)}</p>
              <p style={{ fontSize: 11, color: T.muted, margin: 0 }}>Líq: {fmtBRL(net * 100)}</p>
            </div>
          )}
          {open ? <ChevronDown size={14} style={{ color: T.muted }} /> : <ChevronRight size={14} style={{ color: T.muted }} />}
        </div>
      </button>

      {/* Detail */}
      {open && (
        <div style={{ padding: '12px 16px', background: T.bg }}>
          {/* Mobile stats */}
          {isMobile && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <Stat label="Receita Bruta" value={fmtBRL(revenue * 100)} color={T.green} />
              <Stat label="Comissão" value={fmtBRL(commission * 100)} color="#F59E0B" />
              <Stat label="Repasse Pend." value={fmtBRL(payout * 100)} color={T.brand} />
              <Stat label="Receita Líquida" value={fmtBRL(net * 100)} color={T.text} />
            </div>
          )}

          {prof.appointments?.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['Data', 'Serviço', 'Cliente', 'Valor', 'Comissão'].map(h => (
                      <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prof.appointments.map((apt, i) => (
                    <tr key={apt.id || i} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '8px', color: T.muted, whiteSpace: 'nowrap' }}>{fmtDate(apt.date)}</td>
                      <td style={{ padding: '8px', fontWeight: 500, color: T.text }}>{apt.service || 'N/A'}</td>
                      <td style={{ padding: '8px', color: T.muted }}>{apt.client || '—'}</td>
                      <td style={{ padding: '8px', fontWeight: 600, color: T.green }}>{fmtBRL(apt.price?.cents || 0)}</td>
                      <td style={{ padding: '8px', color: '#F59E0B' }}>{fmtBRL(apt.commission?.cents || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: T.muted, textAlign: 'center', padding: '16px 0', margin: 0 }}>Sem atendimentos detalhados</p>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Aba Agendamentos ────────────────────────────── */
function AppointmentReportTab({ isMobile }) {
  const thisMonth = () => {
    const now = new Date()
    return {
      start: format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd'),
      end:   format(new Date(now.getFullYear(), now.getMonth() + 1, 0), 'yyyy-MM-dd'),
    }
  }

  const [startDate, setStartDate] = useState(thisMonth().start)
  const [endDate,   setEndDate]   = useState(thisMonth().end)
  const [profId,    setProfId]    = useState('all')
  const [professionals, setProfessionals] = useState([])
  const [summary,       setSummary]       = useState(null)
  const [byProf,        setByProf]        = useState([])
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState(null)
  const [exporting,     setExporting]     = useState(false)

  useEffect(() => {
    apiService.getAppointmentProfessionals()
      .then(r => setProfessionals(Array.isArray(r) ? r : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!startDate || !endDate) return
    const s = new Date(startDate), e = new Date(endDate)
    if (s > e) { setError('Data inicial não pode ser maior que a final'); return }
    const diff = Math.abs(e - s) / (1000 * 60 * 60 * 24)
    if (diff > 365) { setError('Período máximo é 1 ano'); return }
    setError(null)
    load()
  }, [startDate, endDate, profId])

  const load = async () => {
    try {
      setLoading(true)
      const pid = profId !== 'all' ? profId : null
      const [sumRes, profRes] = await Promise.all([
        apiService.getAppointmentReportsSummary(startDate, endDate),
        apiService.getAppointmentReportsByProfessional(startDate, endDate, pid),
      ])
      setSummary(sumRes?.summary || null)
      setByProf(profRes?.report || [])
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Erro ao carregar relatório')
      setSummary(null); setByProf([])
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    try {
      setExporting(true)
      const rows = [['Profissional','Data','Serviço','Cliente','Valor (R$)','Comissão (R$)','Líquido (R$)'].join(',')]
      byProf.forEach(p => {
        p.appointments?.forEach(a => {
          const rev = (a.price?.cents || 0) / 100
          const com = (a.commission?.cents || 0) / 100
          rows.push([`"${p.professional.name}"`, fmtDate(a.date), `"${a.service||''}"`, `"${a.client||''}"`,
            rev.toFixed(2).replace('.',','), com.toFixed(2).replace('.',','), (rev-com).toFixed(2).replace('.',',')].join(','))
        })
      })
      if (summary) {
        rows.push('', 'RESUMO')
        rows.push(`Total de Agendamentos,${summary.total_appointments||0}`)
        rows.push(`Confirmados,${summary.confirmed||0}`)
        rows.push(`Receita Total,${((summary.total_revenue?.cents||0)/100).toFixed(2).replace('.',',')}`)
        rows.push(`Comissões,${((summary.total_commissions?.cents||0)/100).toFixed(2).replace('.',',')}`)
        rows.push(`Receita Líquida,${((summary.net_revenue?.cents||0)/100).toFixed(2).replace('.',',')}`)
      }
      const blob = new Blob(['﻿' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `agendamentos_${startDate}_${endDate}.csv`; a.click()
      URL.revokeObjectURL(url)
    } catch { setError('Erro ao exportar') }
    finally { setExporting(false) }
  }

  const chartData = byProf.map(p => ({
    name: p.professional?.name || 'N/A',
    receita:  (p.total_revenue?.cents || 0) / 100,
    comissao: (p.total_commission?.cents || 0) / 100,
    liquido:  ((p.total_revenue?.cents || 0) - (p.total_commission?.cents || 0)) / 100,
  }))

  const pieData = byProf.map(p => ({
    name:  p.professional?.name || 'N/A',
    value: (p.total_revenue?.cents || 0) / 100,
  }))

  const netRevenue   = summary?.net_revenue?.cents || 0
  const totalRevenue = summary?.total_revenue?.cents || 0
  const margin       = totalRevenue > 0 ? ((netRevenue / totalRevenue) * 100).toFixed(1) : '0'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Filtros ─────────────────────────────── */}
      <div style={{
        background: T.white, border: `1px solid ${T.border}`, borderRadius: 12,
        padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>De</label>
          <Input type="date" value={startDate} max={endDate} onChange={e => setStartDate(e.target.value)} style={{ height: 32, fontSize: 13 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Até</label>
          <Input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} style={{ height: 32, fontSize: 13 }} />
        </div>
        {professionals.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Profissional</label>
            <Select value={profId} onValueChange={setProfId}>
              <SelectTrigger style={{ height: 32, fontSize: 13 }}>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {professionals.map(p => (
                  <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} style={{ height: 32, fontSize: 12 }}>
            <RefreshCw style={{ width: 13, height: 13, marginRight: 6 }} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}
            disabled={exporting || !summary || byProf.length === 0}
            style={{ height: 32, fontSize: 12 }}
          >
            <Download style={{ width: 13, height: 13, marginRight: 6 }} />
            {exporting ? 'Exportando…' : 'CSV'}
          </Button>
        </div>
      </div>

      {/* ── Erro ────────────────────────────────── */}
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: T.red + '10', border: `1px solid ${T.red}30`, borderRadius: 10 }}>
          <AlertCircle size={14} style={{ color: T.red, flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: T.red, margin: 0 }}>{error}</p>
        </div>
      )}

      {/* ── Loading ─────────────────────────────── */}
      {loading && !summary && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 10 }}>
          <Loader2 size={20} style={{ color: T.brand, animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: 14, color: T.muted, margin: 0 }}>Carregando relatório…</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {/* ── Resumo ──────────────────────────────── */}
      {summary && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)', gap: 8 }}>
            <Stat label="Agendamentos" value={summary.total_appointments || 0} />
            <Stat label="Confirmados"  value={summary.confirmed || 0} color={T.brand} />
            <Stat label="Receita Total" value={fmtBRL(summary.total_revenue?.cents || 0)} color={T.green} />
            <Stat label="Comissões" value={fmtBRL(summary.total_commissions?.cents || 0)} color="#F59E0B" />
            <div style={{ background: T.brand + '12', border: `1px solid ${T.brand}30`, borderRadius: 10, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p style={{ fontSize: 11, color: T.brand, margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Receita Líquida</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: T.green, margin: 0, letterSpacing: '-0.02em' }}>{fmtBRL(netRevenue)}</p>
                <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>{margin}% margem</p>
              </div>
            </div>
          </div>

          {/* ── Gráficos ──────────────────────────── */}
          {byProf.length > 0 && !loading && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 2fr', gap: 12 }}>
              {/* Bar */}
              <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted, margin: '0 0 12px' }}>Receita por Profissional</p>
                <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
                  <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: isMobile ? 40 : 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: T.muted }} angle={isMobile ? -30 : 0} textAnchor={isMobile ? 'end' : 'middle'} />
                    <YAxis tick={{ fontSize: 10, fill: T.muted }} />
                    <Tooltip formatter={v => fmtBRL(v * 100)} contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${T.border}` }} />
                    <Bar dataKey="receita"  fill={T.green}   name="Receita"   radius={[3,3,0,0]} />
                    <Bar dataKey="comissao" fill="#F59E0B"   name="Comissão"  radius={[3,3,0,0]} />
                    <Bar dataKey="liquido"  fill={T.brand}   name="Líquido"   radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  {[['Receita', T.green], ['Comissão', '#F59E0B'], ['Líquido', T.brand]].map(([l, c]) => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                      <span style={{ fontSize: 11, color: T.muted }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pie */}
              <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted, margin: '0 0 12px' }}>Distribuição de Receita</p>
                <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
                  <PieChart>
                    <Pie
                      data={pieData} cx="50%" cy="50%"
                      outerRadius={isMobile ? 60 : 80}
                      dataKey="value"
                      label={isMobile ? false : ({ name, percent }) => `${name.split(' ')[0]} ${(percent*100).toFixed(0)}%`}
                      labelLine={!isMobile}
                    >
                      {pieData.map((_, i) => <Cell key={i} fill={APT_COLORS[i % APT_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={v => fmtBRL(v * 100)} contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${T.border}` }} />
                    {isMobile && <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />}
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── Por profissional ──────────────────── */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted, margin: '0 0 12px' }}>Detalhamento por Profissional</p>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '24px 0', justifyContent: 'center' }}>
                <Loader2 size={16} style={{ color: T.brand, animation: 'spin 1s linear infinite' }} />
                <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>Carregando…</p>
              </div>
            ) : byProf.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <FileText size={32} style={{ color: T.border, margin: '0 auto 8px' }} />
                <p style={{ fontSize: 14, color: T.muted, margin: 0 }}>Nenhum agendamento no período</p>
              </div>
            ) : (
              byProf.map(p => <ProfRow key={p.professional?.id} prof={p} isMobile={isMobile} />)
            )}
          </div>
        </>
      )}

      {!loading && !summary && !error && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <BarChart3 size={36} style={{ color: T.border, margin: '0 auto 8px' }} />
          <p style={{ fontSize: 14, color: T.muted, margin: 0 }}>Nenhum dado para o período selecionado</p>
        </div>
      )}
    </div>
  )
}

/* ─── Aba Financeiro ──────────────────────────────── */
function FinancialReportTab({ isMobile }) {
  const [startDate, setStartDate] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd')
  )
  const [endDate, setEndDate] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd')
  )
  const [selectedBankAccount, setSelectedBankAccount] = useState('all')
  const [bankAccounts, setBankAccounts] = useState([])
  const [extractPage, setExtractPage] = useState(1)
  const [extractPerPage] = useState(100)
  const { data: reports = [], isLoading: reportsLoading } = useReports()
  const [selectedReport, setSelectedReport] = useState(null)

  const reportParams = {
    start_date: startDate,
    end_date: endDate,
    ...(selectedReport === 'extract' && {
      bank_account_ids: selectedBankAccount !== 'all' ? [selectedBankAccount] : [],
      page: extractPage,
      per_page: extractPerPage,
    }),
  }

  const {
    data: reportData,
    isLoading: reportLoading,
    error: reportError,
    refetch: refetchReport,
  } = useReport(selectedReport, reportParams, { enabled: !!selectedReport && !!startDate && !!endDate })

  useEffect(() => {
    if (reports.length > 0 && !selectedReport) {
      const essential = ['dre', 'extract', 'income_expense']
      const first = reports.find(r => essential.includes(r.id))
      setSelectedReport(first?.id || reports[0].id)
    }
  }, [reports, selectedReport])

  useEffect(() => {
    if (selectedReport === 'extract') setExtractPage(1)
  }, [selectedReport, startDate, endDate, selectedBankAccount])

  useEffect(() => {
    apiService.getBankAccounts()
      .then(r => setBankAccounts(r.bank_accounts || []))
      .catch(() => {})
  }, [])

  const loading = reportsLoading || reportLoading
  const essentialReports = reports.filter(r => ['dre', 'extract', 'income_expense'].includes(r.id))

  const getErrorMessage = (err) => {
    if (!err) return null
    if (err.message?.includes('fetch') || err.message?.includes('Network')) return 'Erro de conexão.'
    if (err.status === 401) return 'Sessão expirada.'
    if (err.status === 500) return err.data?.error || err.data?.message || 'Erro interno do servidor.'
    return err.message || 'Erro ao carregar relatório.'
  }
  const error = getErrorMessage(reportError)
  const extractHasMore = selectedReport === 'extract' && reportData?.pagination?.has_more || false

  const formatCurrency = (cents, currency = 'BRL') => {
    if (typeof cents === 'object' && cents?.cents !== undefined) {
      return cents.formatted || new Intl.NumberFormat('pt-BR', { style: 'currency', currency: cents.currency || 'BRL' }).format((cents.cents || 0) / 100)
    }
    const v = cents || 0
    if (isNaN(v) || !isFinite(v)) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(v / 100)
  }

  const renderDre = () => {
    if (!reportData) return <Empty />
    const { gross_income, taxes, variable_expense, fixed_expense, payroll, gross_profit, operating_profit, result } = reportData
    const items = [
      { label: 'Receita Bruta',       value: gross_income,      type: 'revenue' },
      { label: '(-) Impostos',        value: taxes,             type: 'expense' },
      { label: '= Lucro Bruto',       value: gross_profit,      type: 'result' },
      { label: '(-) Desp. Variáveis', value: variable_expense,  type: 'expense' },
      { label: '= Lucro Operacional', value: operating_profit,  type: 'result' },
      { label: '(-) Despesas Fixas',  value: fixed_expense,     type: 'expense' },
      { label: '(-) Folha',           value: payroll,           type: 'expense' },
      { label: '= Resultado Líquido', value: result,            type: 'final' },
    ]
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, i) => {
          const bg = item.type === 'revenue' ? T.green + '12' : item.type === 'expense' ? T.red + '10' : item.type === 'final' ? T.brand + '14' : T.chip
          const border = item.type === 'final' ? `2px solid ${T.brand}` : `1px solid ${T.border}`
          return (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 10, background: bg, border }}>
              <span style={{ fontSize: item.type === 'final' ? 15 : 13, fontWeight: item.type === 'final' ? 700 : 500, color: T.text }}>{item.label}</span>
              <span style={{ fontSize: item.type === 'final' ? 15 : 13, fontWeight: 700, color: T.text }}>{formatCurrency(item.value?.cents || 0, item.value?.currency || 'BRL')}</span>
            </div>
          )
        })}
      </div>
    )
  }

  const renderExtract = () => {
    if (!reportData?.items) return <Empty />
    const { items, totals } = reportData
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { label: 'Saldo Anterior', value: totals?.previous_balance || 0, color: T.text },
            { label: 'Total Receitas', value: totals?.total_revenues || 0,   color: T.green },
            { label: 'Total Despesas', value: Math.abs(totals?.total_expenses || 0), color: T.red },
            { label: 'Saldo Final',    value: totals?.final_balance || 0,    color: T.text },
          ].map(s => (
            <div key={s.label} style={{ background: T.bg, borderRadius: 10, padding: '12px 14px' }}>
              <p style={{ fontSize: 11, color: T.muted, margin: '0 0 4px' }}>{s.label}</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: s.color, margin: 0 }}>{formatCurrency(s.value)}</p>
            </div>
          ))}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Data','Descrição','Categoria','Contato','Valor','Saldo','Status'].map(h => (
                  <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items?.length > 0 ? items.map((item, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '8px 10px', color: T.muted, whiteSpace: 'nowrap' }}>{item.date}</td>
                  <td style={{ padding: '8px 10px', color: T.text, fontWeight: 500 }}>{item.description}</td>
                  <td style={{ padding: '8px 10px', color: T.muted }}>{item.category || '-'}</td>
                  <td style={{ padding: '8px 10px', color: T.muted }}>{item.contact || '-'}</td>
                  <td style={{ padding: '8px 10px', fontWeight: 600, color: item.value >= 0 ? T.green : T.red }}>{formatCurrency(item.value || 0)}</td>
                  <td style={{ padding: '8px 10px', color: T.text }}>{formatCurrency(item.balance || 0)}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ borderRadius: 20, padding: '3px 8px', fontSize: 11, fontWeight: 600, background: item.paid ? T.green + '18' : '#F59E0B18', color: item.paid ? T.green : '#F59E0B' }}>
                      {item.paid ? 'Pago' : 'Pendente'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: T.muted, fontSize: 13 }}>Nenhuma transação no período</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {reportData?.pagination && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: T.muted }}>
              Página {reportData.pagination.page} · {reportData.pagination.total_items || 0} itens
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <Button variant="outline" size="sm" onClick={() => setExtractPage(p => Math.max(1,p-1))} disabled={extractPage === 1 || loading}>Anterior</Button>
              <Button variant="outline" size="sm" onClick={() => setExtractPage(p => p+1)} disabled={!extractHasMore || loading}>Próxima</Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderIncomeExpense = () => {
    if (!reportData) return <Empty />
    const { income, expenses, net, savings_rate } = reportData
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 8 }}>
          <Stat label="Total de Receitas" value={formatCurrency(income || 0)} color={T.green} />
          <Stat label="Total de Despesas" value={formatCurrency(expenses || 0)} color={T.red} />
          <Stat label="Saldo Líquido"     value={formatCurrency(net || 0)} color={(net||0) >= 0 ? T.green : T.red} />
          <Stat label="Taxa de Poupança"  value={`${savings_rate?.toFixed(2) || '0.00'}%`} color={T.brand} />
        </div>
      </div>
    )
  }

  const renderContent = () => {
    if (loading) return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 10 }}>
        <Loader2 size={20} style={{ color: T.brand, animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: 14, color: T.muted, margin: 0 }}>Carregando relatório…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
    if (error) return (
      <div style={{ display: 'flex', gap: 10, padding: '14px 16px', background: T.red + '10', border: `1px solid ${T.red}30`, borderRadius: 10 }}>
        <AlertCircle size={16} style={{ color: T.red, flexShrink: 0, marginTop: 1 }} />
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: T.red, margin: '0 0 6px' }}>Erro ao carregar relatório</p>
          <p style={{ fontSize: 13, color: T.red, margin: '0 0 10px' }}>{error}</p>
          <Button variant="outline" size="sm" onClick={() => refetchReport()}>
            <RefreshCw style={{ width: 12, height: 12, marginRight: 6 }} /> Tentar novamente
          </Button>
        </div>
      </div>
    )
    if (!selectedReport) return <Empty text="Selecione um relatório acima" />
    if (selectedReport && !reportData && !loading) return <Empty text="Nenhum dado disponível para o período selecionado" />
    switch (selectedReport) {
      case 'dre':           return renderDre()
      case 'extract':       return renderExtract()
      case 'income_expense': return renderIncomeExpense()
      default:              return <Empty text="Relatório não implementado" />
    }
  }

  const reportIcons = { dre: Receipt, extract: FileText, income_expense: TrendingUp }
  const reportLabels = { dre: 'DRE', extract: 'Extrato', income_expense: 'Receitas vs Despesas' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Filtros ─────────────────────────────── */}
      <div style={{
        background: T.white, border: `1px solid ${T.border}`, borderRadius: 12,
        padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>De</label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ height: 32, fontSize: 13 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Até</label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ height: 32, fontSize: 13 }} />
        </div>
        {selectedReport === 'extract' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 180 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Conta</label>
            <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount}>
              <SelectTrigger style={{ height: 32, fontSize: 13 }}>
                <SelectValue placeholder="Todas as contas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as contas</SelectItem>
                {bankAccounts.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <Button variant="outline" size="sm" onClick={() => refetchReport()} disabled={loading} style={{ height: 32, fontSize: 12, marginLeft: 'auto' }}>
          <RefreshCw style={{ width: 13, height: 13, marginRight: 6 }} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </Button>
      </div>

      {/* ── Seletor de relatório ─────────────────── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {essentialReports.map(r => {
          const Icon = reportIcons[r.id] || FileText
          const active = selectedReport === r.id
          return (
            <button
              key={r.id}
              onClick={() => setSelectedReport(r.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                borderRadius: 10, border: active ? `2px solid ${T.brand}` : `1px solid ${T.border}`,
                background: active ? T.brand + '10' : T.white,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms',
              }}
            >
              <Icon size={15} style={{ color: active ? T.brand : T.muted }} />
              <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? T.brand : T.text }}>
                {reportLabels[r.id] || r.name}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Conteúdo ────────────────────────────── */}
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, padding: '16px' }}>
        {renderContent()}
      </div>
    </div>
  )
}

function Empty({ text }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <FileText size={32} style={{ color: T.border, margin: '0 auto 8px' }} />
      <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>{text || 'Nenhum dado disponível'}</p>
    </div>
  )
}

/* ─── Page ────────────────────────────────────────── */
export function FinancialReports() {
  const isMobile = useIsMobile()
  const [mainTab, setMainTab] = useState('financial')

  return (
    <div style={{ minHeight: '100vh', background: T.bg, ...DISPLAY }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: T.text, margin: 0, letterSpacing: '-0.02em' }}>
            Relatórios
          </h1>
        </div>

        {/* Main tabs */}
        <Tabs value={mainTab} onValueChange={setMainTab}>
          <TabsList className="h-9 p-0.5 bg-muted border border-border rounded-xl w-full sm:w-auto gap-0.5 mb-4">
            <TabsTrigger
              value="financial"
              className="rounded-lg px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-[#4C60AA] data-[state=active]:shadow-sm transition-all duration-150"
            >
              <Receipt className="w-3.5 h-3.5 mr-1.5" />
              Financeiro
            </TabsTrigger>
            <TabsTrigger
              value="appointments"
              className="rounded-lg px-4 py-1.5 text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-[#4C60AA] data-[state=active]:shadow-sm transition-all duration-150"
            >
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              Agendamentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="financial">
            <FinancialReportTab isMobile={isMobile} />
          </TabsContent>

          <TabsContent value="appointments">
            <AppointmentReportTab isMobile={isMobile} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
