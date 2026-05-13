import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Check, Copy, MessageCircle, ChevronRight, Scissors, Clock, Link2, Loader2, Plus } from 'lucide-react'
import { apiService } from '@/lib/api'
import { T, DISPLAY } from '@/lib/tokens'
import { toast } from 'sonner'

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

/* ── Main wizard ────────────────────────────────── */
export function OnboardingWizard({ onDone }) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

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

  const STEPS = 3

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    onDone()
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
      setStep(1)
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
    try {
      // Check if one already exists
      const existing = await apiService.getAppointmentLinks()
      const links = existing?.appointment_links || existing || []
      let link = links[0]

      if (!link) {
        const res = await apiService.createAppointmentLink({
          name:        'Meus Agendamentos',
          active:      true,
          link_type:   'normal',
        })
        link = res?.appointment_link || res
      }

      const base = window.location.origin
      const url = link?.token
        ? `${base}/agendar/${link.token}`
        : `${base}/agendar`
      setBookingUrl(url)
    } catch {
      setBookingUrl(window.location.origin + '/agendar')
    } finally { setSaving(false) }
    setStep(2)
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

        {/* ── Step 0: serviço ─────────────────── */}
        {step === 0 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: '#EEF2FA', display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center', marginBottom: 14,
              }}>
                <Scissors size={24} style={{ color: '#4C60AA' }} />
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
                    placeholder="ex: Corte masculino"
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

        {/* ── Step 1: horário ─────────────────── */}
        {step === 1 && (
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

        {/* ── Step 2: link pronto ─────────────── */}
        {step === 2 && (
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
            <div style={{
              background: T.bg, border: `1px solid var(--border)`,
              borderRadius: 10, padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
            }}>
              <Link2 size={16} style={{ color: '#4C60AA', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: T.text, flex: 1, wordBreak: 'break-all', lineHeight: 1.4 }}>
                {bookingUrl || 'Gerando link…'}
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

            <button
              onClick={finish}
              style={{
                width: '100%', padding: '13px', borderRadius: 10,
                border: 'none', background: '#4C60AA',
                color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Entrar no sistema →
            </button>

            <p style={{ textAlign: 'center', fontSize: 12, color: T.muted, marginTop: 12, margin: '12px 0 0' }}>
              Você pode personalizar o link depois em <strong>Links de Agendamento</strong>.
            </p>
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
