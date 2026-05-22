import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Check, Copy, MessageCircle, ChevronRight, Briefcase, Clock, Link2, Loader2, Plus, FileText } from 'lucide-react'
import { apiService } from '@/lib/api'
import { T, DISPLAY } from '@/lib/tokens'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

const STORAGE_KEY = 'onboarding_v1_done'

const DAYS = [
  { key: 'monday',    short: 'Seg' },
  { key: 'tuesday',   short: 'Ter' },
  { key: 'wednesday', short: 'Qua' },
  { key: 'thursday',  short: 'Qui' },
  { key: 'friday',    short: 'Sex' },
  { key: 'saturday',  short: 'Sáb' },
  { key: 'sunday',    short: 'Dom' },
]


function buildSchedulePayload(days, startTime, endTime) {
  const payload = {}
  DAYS.forEach(({ key }) => {
    payload[key] = {
      enabled:    days.includes(key),
      start_time: startTime,
      end_time:   endTime,
      has_break:  false,
      break_start: '12:00',
      break_end:   '13:00',
    }
  })
  return payload
}

/* ── Step dots ──────────────────────────────────── */
function Dots({ step, total }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === step ? 20 : 7, height: 7,
          borderRadius: 4,
          background: i === step ? '#4C60AA' : i < step ? '#4C60AA60' : 'var(--border)',
          transition: 'all 250ms cubic-bezier(0.16,1,0.3,1)',
        }} />
      ))}
    </div>
  )
}

/* ── Pill toggle ────────────────────────────────── */
function DayPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600,
        border: `1px solid ${active ? '#4C60AA' : 'var(--border)'}`,
        background: active ? '#4C60AA' : T.white,
        color: active ? '#fff' : T.muted,
        cursor: 'pointer', transition: 'all 150ms',
        minHeight: 36,
      }}
    >
      {label}
    </button>
  )
}

function formatDocument(value) {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

function validateCpf(cpf) {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i)
  let r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  if (r !== parseInt(d[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i)
  r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  return r === parseInt(d[10])
}

/* ── Main wizard ────────────────────────────────── */
export function OnboardingWizard({ onDone }) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const qc = useQueryClient()

  // Step 0 — document
  const [docNumber, setDocNumber]        = useState('')
  const [docLookupLoading, setDocLookupLoading] = useState(false)
  const [docInfo, setDocInfo]           = useState(null) // { name, valid }
  const docLookupTimer                  = useRef(null)

  // Pula step 0 se já tem documento cadastrado
  useEffect(() => {
    const cached = qc.getQueryData(['account-settings-doc-check'])
    if (cached) {
      sessionStorage.setItem('orbi_doc_status', 'ok')
      setStep(1)
      return
    }
    apiService.getAccountSettings().then(res => {
      const doc = res?.account?.company?.document_1
      if (doc) {
        setDocNumber(doc)
        sessionStorage.setItem('orbi_doc_status', 'ok')
        qc.setQueryData(['account-settings-doc-check'], doc)
        setStep(1)
      }
    }).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Step 1 — service
  const [serviceName, setServiceName]   = useState('')
  const [servicePrice, setServicePrice] = useState('')
  const [extraServices, setExtraServices] = useState([{ name: '', price: '' }])

  // Step 2 — schedule
  const [activeDays, setActiveDays] = useState(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'])
  const [startTime, setStartTime]   = useState('09:00')
  const [endTime, setEndTime]       = useState('19:00')

  // Step 3 — link
  const [bookingUrl, setBookingUrl] = useState('')
  const [copied, setCopied]         = useState(false)

  const STEPS = 4

  const finish = async () => {
    setSaving(true)
    try {
      await apiService.seedDemoData()
      localStorage.setItem('demo_data_active', '1')
      window.dispatchEvent(new CustomEvent('demo-seeded'))
    } catch { /* não bloquear o onboarding se seed falhar */ }
    setSaving(false)
    localStorage.setItem(STORAGE_KEY, '1')
    onDone()
  }

  /* ── Document input handler ─────────────────── */
  const handleDocumentChange = (e) => {
    const formatted = formatDocument(e.target.value)
    setDocNumber(formatted)
    setDocInfo(null)

    const digits = formatted.replace(/\D/g, '')

    if (digits.length === 14) {
      clearTimeout(docLookupTimer.current)
      docLookupTimer.current = setTimeout(async () => {
        setDocLookupLoading(true)
        try {
          const data = await apiService.lookupCnpj(digits)
          const name = data.nome_fantasia || data.razao_social || ''
          setDocInfo({ name, valid: true, type: 'cnpj' })
        } catch {
          setDocInfo({ name: '', valid: false, type: 'cnpj' })
        } finally {
          setDocLookupLoading(false)
        }
      }, 600)
    } else if (digits.length === 11) {
      setDocInfo({ valid: validateCpf(digits), type: 'cpf', name: '' })
    }
  }

  /* ── Step 0: save document ──────────────────── */
  const saveDocument = async () => {
    const digits = docNumber.replace(/\D/g, '')
    if (digits.length !== 11 && digits.length !== 14) {
      toast.error('Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido')
      return
    }
    if (digits.length === 11 && !validateCpf(digits)) {
      toast.error('CPF inválido')
      return
    }
    if (digits.length === 14 && docInfo?.valid === false) {
      toast.error('CNPJ não encontrado na Receita Federal')
      return
    }
    setSaving(true)
    try {
      await apiService.updateAccountSettings({
        company_attributes: { document_1: docNumber },
      })
      sessionStorage.setItem('orbi_doc_status', 'ok')
      qc.invalidateQueries({ queryKey: ['account-settings-doc-check'] })
    } catch {
      toast.error('Não foi possível salvar o documento. Você pode corrigir isso nas Configurações.')
    } finally {
      setSaving(false)
    }
    setStep(1)
  }

  /* ── Step 1: create service ─────────────────── */
  const saveService = async () => {
    if (!serviceName.trim()) { toast.error('Informe o nome do serviço'); return }
    setSaving(true)
    try {
      const toCreate = [
        { name: serviceName.trim(), price: servicePrice },
        ...extraServices.filter(s => s.name.trim()),
      ]
      for (const svc of toCreate) {
        const priceVal = parseFloat((svc.price || '0').replace(',', '.')) || 0
        await apiService.createService({
          name:               svc.name.trim(),
          selling_price_cents: Math.round(priceVal * 100),
        })
      }
      setStep(2)
    } catch {
      toast.error('Não foi possível salvar o serviço')
    } finally { setSaving(false) }
  }

  /* ── Step 2: save schedule ──────────────────── */
  const saveSchedule = async () => {
    setSaving(true)
    try {
      const res = await apiService.getProfessionals()
      const prof = res?.professionals?.[0]
      if (prof) {
        await apiService.updateProfessionalSchedule(
          prof.id,
          buildSchedulePayload(activeDays, startTime, endTime)
        )
      }
    } catch { /* schedule is optional */ }
    setSaving(false)
    await createLink()
  }

  /* ── Step 3: create booking link ───────────── */
  const createLink = async () => {
    setSaving(true)
    let link = null

    // 1. tenta achar um link existente
    try {
      const existing = await apiService.getAppointmentLinks()
      const arr = Array.isArray(existing) ? existing : (existing?.appointment_links || [])
      link = arr[0] || null
    } catch (err) {
      console.error('[OnboardingWizard] getAppointmentLinks error:', err)
    }

    // 2. se não tem, cria um novo
    if (!link) {
      try {
        const res = await apiService.createAppointmentLink({
          name:      'Meus Agendamentos',
          active:    true,
          link_type: 'normal',
        })
        link = res?.appointment_link || res || null
      } catch (err) {
        console.error('[OnboardingWizard] createAppointmentLink error:', err)
        toast.error('Não foi possível criar o link. Crie manualmente em Links de Agendamento.')
      }
    }

    const base = import.meta.env.VITE_PUBLIC_URL || window.location.origin
    const url = link?.public_url || (link?.token ? `${base}/agendar/${link.token}` : null)
    setBookingUrl(url || null)
    setSaving(false)
    setStep(3)
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { toast.error('Não foi possível copiar') }
  }

  const whatsappShare = () => {
    const text = encodeURIComponent(`Olá! Faça seu agendamento diretamente pelo meu link: ${bookingUrl}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: `1px solid var(--border)`, background: T.white,
    color: T.text, fontSize: 15, outline: 'none',
    fontFamily: DISPLAY.fontFamily, boxSizing: 'border-box',
  }

  const labelStyle = { fontSize: 13, fontWeight: 600, color: T.muted, marginBottom: 6, display: 'block' }

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(6px)',
      ...DISPLAY,
    }}>
      <div style={{
        width: '100%', maxWidth: 460,
        background: T.white,
        borderRadius: 20,
        padding: '32px 28px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
        animation: 'orbi-zoom-in 280ms cubic-bezier(0.16,1,0.3,1) both',
      }}>
        <style>{`@keyframes orbi-zoom-in { from { opacity:0; transform:scale(0.94) } to { opacity:1; transform:scale(1) } }`}</style>

        <Dots step={step} total={STEPS} />

        {/* ── Step 0: documento ───────────────── */}
        {step === 0 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: '#EEF2FA', display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center', marginBottom: 14,
              }}>
                <FileText size={24} style={{ color: '#4C60AA' }} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: '0 0 6px' }}>
                Qual é o seu CPF ou CNPJ?
              </h2>
              <p style={{ fontSize: 14, color: T.muted, margin: 0 }}>
                Usado para emissão de documentos e notas. Você pode alterar depois.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <input
                  style={inputStyle}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  value={docNumber}
                  onChange={handleDocumentChange}
                  inputMode="numeric"
                  autoFocus
                />
                {docLookupLoading && (
                  <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                    <Loader2 size={16} style={{ color: T.muted, animation: 'spin 1s linear infinite' }} />
                  </div>
                )}
              </div>

              {docInfo && !docLookupLoading && (
                <div style={{
                  padding: '10px 14px', borderRadius: 8,
                  background: docInfo.valid ? '#ECFDF5' : '#FEF2F2',
                  border: `1px solid ${docInfo.valid ? '#6EE7B7' : '#FECACA'}`,
                  fontSize: 13, color: docInfo.valid ? '#065F46' : '#991B1B',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  {docInfo.valid ? <Check size={14} /> : null}
                  {docInfo.type === 'cnpj'
                    ? (docInfo.valid ? `${docInfo.name || 'CNPJ encontrado'}` : 'CNPJ não encontrado na Receita Federal')
                    : (docInfo.valid ? 'CPF válido' : 'CPF inválido')}
                </div>
              )}
            </div>

            <button
              onClick={saveDocument}
              disabled={saving}
              style={{
                marginTop: 24, width: '100%', padding: '13px',
                borderRadius: 10, border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                background: saving ? 'var(--border)' : '#4C60AA',
                color: '#fff', fontSize: 15, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 150ms',
              }}
            >
              {saving
                ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                : <>Continuar <ChevronRight size={18} /></>}
            </button>
          </>
        )}

        {/* ── Step 1: serviço ─────────────────── */}
        {step === 1 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: '#EEF2FA', display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center', marginBottom: 14,
              }}>
                <Briefcase size={24} style={{ color: '#4C60AA' }} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: '0 0 6px' }}>
                Qual é seu serviço principal?
              </h2>
              <p style={{ fontSize: 14, color: T.muted, margin: 0 }}>
                Você pode adicionar mais depois. Comece com o que mais vende.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Serviço principal */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end' }}>
                <div>
                  <label style={labelStyle}>Nome do serviço</label>
                  <input
                    style={inputStyle}
                    placeholder="ex: Consulta Nutricional"
                    value={serviceName}
                    onChange={e => setServiceName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveService()}
                    autoFocus
                  />
                </div>
                <div>
                  <label style={labelStyle}>Preço (R$)</label>
                  <input
                    style={{ ...inputStyle, width: 90 }}
                    placeholder="0,00"
                    value={servicePrice}
                    onChange={e => setServicePrice(e.target.value)}
                    inputMode="decimal"
                  />
                </div>
              </div>

              {/* Serviços extras */}
              {extraServices.map((svc, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end' }}>
                  <input
                    style={{ ...inputStyle, color: svc.name ? T.text : T.muted }}
                    placeholder="Outro serviço (opcional)"
                    value={svc.name}
                    onChange={e => {
                      const next = [...extraServices]
                      next[idx].name = e.target.value
                      setExtraServices(next)
                    }}
                  />
                  <input
                    style={{ ...inputStyle, width: 90 }}
                    placeholder="R$"
                    value={svc.price}
                    onChange={e => {
                      const next = [...extraServices]
                      next[idx].price = e.target.value
                      setExtraServices(next)
                    }}
                    inputMode="decimal"
                  />
                </div>
              ))}

              <button
                onClick={() => setExtraServices(p => [...p, { name: '', price: '' }])}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#4C60AA', fontSize: 13, fontWeight: 600, padding: '4px 0',
                }}
              >
                <Plus size={14} /> Adicionar outro serviço
              </button>
            </div>

            <button
              onClick={saveService}
              disabled={saving || !serviceName.trim()}
              style={{
                marginTop: 24, width: '100%', padding: '13px',
                borderRadius: 10, border: 'none', cursor: saving || !serviceName.trim() ? 'not-allowed' : 'pointer',
                background: saving || !serviceName.trim() ? 'var(--border)' : '#4C60AA',
                color: '#fff', fontSize: 15, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 150ms',
              }}
            >
              {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <>Continuar <ChevronRight size={18} /></>}
            </button>
          </>
        )}

        {/* ── Step 2: horário ─────────────────── */}
        {step === 2 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: '#EEF2FA', display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center', marginBottom: 14,
              }}>
                <Clock size={24} style={{ color: '#4C60AA' }} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: '0 0 6px' }}>
                Quando você atende?
              </h2>
              <p style={{ fontSize: 14, color: T.muted, margin: 0 }}>
                Defina seus dias e horários para que clientes possam agendar online.
              </p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {DAYS.map(d => (
                <DayPill
                  key={d.key}
                  label={d.short}
                  active={activeDays.includes(d.key)}
                  onClick={() => setActiveDays(prev =>
                    prev.includes(d.key) ? prev.filter(x => x !== d.key) : [...prev, d.key]
                  )}
                />
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              <div>
                <label style={labelStyle}>Início</label>
                <input type="time" style={inputStyle} value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Fim</label>
                <input type="time" style={inputStyle} value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={saveSchedule}
                disabled={saving}
                style={{
                  width: '100%', padding: '13px', borderRadius: 10, border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  background: saving ? 'var(--border)' : '#4C60AA',
                  color: '#fff', fontSize: 15, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'background 150ms',
                }}
              >
                {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <>Salvar horários <ChevronRight size={18} /></>}
              </button>
              <button
                onClick={() => createLink()}
                disabled={saving}
                style={{
                  width: '100%', padding: '11px', borderRadius: 10,
                  border: `1px solid var(--border)`, background: 'transparent',
                  color: T.muted, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Pular por agora
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: link pronto ─────────────── */}
        {step === 3 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: '#ECFDF5', display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center', marginBottom: 14,
              }}>
                <Check size={26} style={{ color: '#10B981' }} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: '0 0 6px' }}>
                Seu link está pronto!
              </h2>
              <p style={{ fontSize: 14, color: T.muted, margin: 0 }}>
                Compartilhe com clientes e receba agendamentos automaticamente.
              </p>
            </div>

            {/* URL box */}
            {bookingUrl ? (
              <>
                <div style={{
                  background: T.bg, border: `1px solid var(--border)`,
                  borderRadius: 10, padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
                }}>
                  <Link2 size={16} style={{ color: '#4C60AA', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: T.text, flex: 1, wordBreak: 'break-all', lineHeight: 1.4 }}>
                    {bookingUrl}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  <button
                    onClick={copyLink}
                    style={{
                      width: '100%', padding: '12px', borderRadius: 10,
                      border: `1px solid ${copied ? '#10B981' : 'var(--border)'}`,
                      background: copied ? '#ECFDF5' : T.white,
                      color: copied ? '#10B981' : T.text,
                      fontSize: 14, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'all 200ms',
                    }}
                  >
                    {copied ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar link</>}
                  </button>

                  <button
                    onClick={whatsappShare}
                    style={{
                      width: '100%', padding: '12px', borderRadius: 10,
                      border: 'none', background: '#25D366',
                      color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    <MessageCircle size={16} /> Compartilhar no WhatsApp
                  </button>
                </div>
              </>
            ) : (
              <div style={{
                background: '#FFFBEB', border: `1px solid #FDE68A`,
                borderRadius: 10, padding: '12px 14px', marginBottom: 24,
                fontSize: 13, color: '#92400E', lineHeight: 1.5,
              }}>
                Não foi possível gerar o link automaticamente. Acesse <strong>Links de Agendamento</strong> para criar o seu link.
              </div>
            )}

            <button
              onClick={finish}
              disabled={saving}
              style={{
                width: '100%', padding: '13px', borderRadius: 10,
                border: 'none', background: saving ? 'var(--border)' : '#4C60AA',
                color: '#fff', fontSize: 15, fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 150ms',
              }}
            >
              {saving
                ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Preparando...</>
                : 'Entrar no sistema →'}
            </button>

            {bookingUrl && (
              <p style={{ textAlign: 'center', fontSize: 12, color: T.muted, marginTop: 12, margin: '12px 0 0' }}>
                Você pode personalizar o link depois em <strong>Links de Agendamento</strong>.
              </p>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  )
}

/* ── Hook: decide se mostra o wizard ────────────── */
export function useOnboarding() {
  const [show, setShow] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) { setChecked(true); return }

    // Check via API: se não tem nenhum serviço cadastrado = novo usuário
    apiService.getServices()
      .then(res => {
        const services = res?.services || res || []
        if (services.length === 0) setShow(true)
      })
      .catch(() => { /* silently fail */ })
      .finally(() => setChecked(true))
  }, [])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setShow(false)
  }

  return { show: show && checked, dismiss }
}
