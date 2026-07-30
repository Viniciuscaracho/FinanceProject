import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Mic, MicOff, Loader2, CheckCircle2, ArrowRight, Zap, Brain, FileText } from 'lucide-react'
import { apiService } from '@/lib/api'
import { T } from '@/lib/tokens'

const STORAGE_KEY = 'coaching_onboard_v1'
const BRAND = '#4C60AA'

/* ── Hook de exibição ───────────────────────────────────────────────── */
export function useCoachingOnboarding(contacts, totalEvents) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return
    // Só exibe se a conta ainda não tem registros (usuário novo)
    if (totalEvents === 0) setShow(true)
  }, [totalEvents])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setShow(false)
  }

  return { show, dismiss }
}

/* ── Dots de progresso ──────────────────────────────────────────────── */
function Dots({ step, total }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 32 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === step ? 24 : 7, height: 7, borderRadius: 4,
          background: i === step ? BRAND : i < step ? BRAND + '60' : T.border,
          transition: 'all 300ms cubic-bezier(0.16,1,0.3,1)',
        }} />
      ))}
    </div>
  )
}

/* ── Resultado estruturado pela IA ──────────────────────────────────── */
function StructuredResult({ event }) {
  const fields = [
    { key: 'sono',         label: 'Sono',          color: '#6366F1' },
    { key: 'carga',        label: 'Carga',          color: '#F59E0B' },
    { key: 'observacao',   label: 'Observação',     color: BRAND },
    { key: 'proxima_acao', label: 'Próxima ação',   color: '#10B981' },
  ].filter(f => event[f.key])

  if (!fields.length) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 10, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
      {fields.map((f, i) => (
        <div key={f.key} style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '10px 14px',
          borderBottom: i < fields.length - 1 ? `1px solid ${T.border}` : 'none',
          background: T.white,
        }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
            background: f.color + '15', color: f.color,
            borderRadius: 20, padding: '2px 8px',
            whiteSpace: 'nowrap', flexShrink: 0, marginTop: 2,
          }}>
            {f.label}
          </span>
          <span style={{ fontSize: 13, color: T.text, lineHeight: 1.6 }}>{event[f.key]}</span>
        </div>
      ))}
    </div>
  )
}

/* ── Animação de "como funciona" ─────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    { icon: Mic,      label: 'Você fala',           sub: 'Áudio, texto ou arquivo' },
    { icon: Brain,    label: 'A IA estrutura',       sub: 'Sono, carga, observação, próxima ação' },
    { icon: FileText, label: 'Registro automático',  sub: 'Fica salvo no perfil do atleta' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 12, border: `1px solid ${T.border}`, overflow: 'hidden', marginBottom: 28 }}>
      {steps.map((s, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 18px',
          borderBottom: i < steps.length - 1 ? `1px solid ${T.border}` : 'none',
          background: T.white,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: BRAND + '12',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <s.icon size={16} style={{ color: BRAND }} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text }}>{s.label}</p>
            <p style={{ margin: 0, fontSize: 12, color: T.muted }}>{s.sub}</p>
          </div>
          {i < steps.length - 1 && (
            <ArrowRight size={14} style={{ color: T.border, marginLeft: 'auto', flexShrink: 0 }} />
          )}
        </div>
      ))}
    </div>
  )
}

/* ── Componente principal ───────────────────────────────────────────── */
export function CoachingOnboarding({ contacts, onDone }) {
  const [step, setStep] = useState(0)

  // Step 1 — áudio/texto
  const [isRecording, setIsRecording]     = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [textInput, setTextInput]         = useState('')
  const [result, setResult]               = useState(null)
  const [error, setError]                 = useState(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef   = useRef([])

  const firstContact = contacts?.[0]

  /* ── Gravação de áudio ─────────────────────────────────────────── */
  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const recorder = new MediaRecorder(stream, { mimeType })
      audioChunksRef.current = []

      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        setIsRecording(false)
        if (!firstContact) return

        const blob = new Blob(audioChunksRef.current, { type: mimeType })
        setIsTranscribing(true)
        setError(null)
        try {
          const res = await apiService.uploadAudioNote(firstContact.contact_id, blob)
          if (res?.event) { setResult(res.event); setStep(2) }
        } catch {
          setError('Não foi possível processar o áudio. Tente pelo texto.')
        } finally {
          setIsTranscribing(false)
        }
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch {
      setError('Microfone não disponível. Use o campo de texto abaixo.')
    }
  }

  /* ── Envio por texto ───────────────────────────────────────────── */
  const handleSendText = async () => {
    if (!textInput.trim() || !firstContact) return
    setIsTranscribing(true)
    setError(null)
    try {
      const res = await apiService.createTimelineEvent(firstContact.contact_id, textInput.trim())
      if (res?.event) { setResult(res.event); setStep(2) }
    } catch {
      setError('Erro ao processar. Tente novamente.')
    } finally {
      setIsTranscribing(false)
    }
  }

  /* ── Render ────────────────────────────────────────────────────── */
  return createPortal(
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '16px',
    }}>
      <div style={{
        background: T.bg || '#F9FAFB',
        borderRadius: 16,
        width: '100%', maxWidth: 480,
        maxHeight: '90vh', overflowY: 'auto',
        padding: '32px 28px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
      }}>
        <Dots step={step} total={3} />

        {/* ── STEP 0: Boas-vindas ───────────────────────────────── */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: BRAND + '15',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <Zap size={24} style={{ color: BRAND }} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: '0 0 8px' }}>
                Bem-vindo ao Orbi Coaching
              </h2>
              <p style={{ fontSize: 14, color: T.muted, margin: 0, lineHeight: 1.6 }}>
                Você registra o que aconteceu com seus atletas — por áudio, texto ou arquivo — e a IA estrutura tudo automaticamente.
              </p>
            </div>

            <HowItWorks />

            <button
              onClick={() => setStep(firstContact ? 1 : 2)}
              style={{
                width: '100%', padding: '13px',
                background: BRAND, color: '#fff',
                border: 'none', borderRadius: 10, cursor: 'pointer',
                fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {firstContact ? 'Testar agora' : 'Entrar no dashboard'}
              <ArrowRight size={16} />
            </button>

            {!firstContact && (
              <p style={{ textAlign: 'center', fontSize: 12, color: T.muted, marginTop: 10 }}>
                Adicione atletas em <strong>Contatos</strong> para começar a registrar.
              </p>
            )}
          </div>
        )}

        {/* ── STEP 1: Teste ao vivo ─────────────────────────────── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: '0 0 8px' }}>
                Teste com um atleta real
              </h2>
              <p style={{ fontSize: 13, color: T.muted, margin: 0, lineHeight: 1.6 }}>
                Grave um áudio ou escreva sobre o treino de{' '}
                <strong style={{ color: T.text }}>{firstContact?.contact_name}</strong>.
                A IA vai estruturar e salvar no perfil dele.
              </p>
            </div>

            {/* Gravador */}
            <div style={{
              border: `2px dashed ${isRecording ? '#EF4444' : T.border}`,
              borderRadius: 12, padding: '28px 20px', textAlign: 'center',
              marginBottom: 16, transition: 'border-color 200ms',
              background: isRecording ? '#FEF2F2' : T.white,
            }}>
              <button
                onClick={toggleRecording}
                disabled={isTranscribing}
                className={isRecording ? 'animate-pulse' : ''}
                style={{
                  width: 64, height: 64, borderRadius: '50%', border: 'none', cursor: isTranscribing ? 'default' : 'pointer',
                  background: isRecording ? '#EF4444' : BRAND,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 12, transition: 'background 200ms',
                  boxShadow: isRecording ? '0 0 0 8px #EF444420' : '0 4px 12px rgba(76,96,170,0.3)',
                }}
              >
                {isTranscribing
                  ? <Loader2 size={26} style={{ color: '#fff', animation: 'spin 1s linear infinite' }} />
                  : isRecording
                    ? <MicOff size={26} style={{ color: '#fff' }} />
                    : <Mic size={26} style={{ color: '#fff' }} />
                }
              </button>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: isRecording ? '#EF4444' : T.text }}>
                {isTranscribing ? 'IA processando…' : isRecording ? 'Toque para parar' : 'Toque para gravar'}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted }}>
                {isRecording ? 'Fale sobre o treino, disposição, observações…' : 'Até 5 minutos de áudio'}
              </p>
            </div>

            {/* Divisor */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: T.border }} />
              <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>ou escreva</span>
              <div style={{ flex: 1, height: 1, background: T.border }} />
            </div>

            {/* Textarea de texto */}
            <textarea
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              disabled={isRecording || isTranscribing}
              placeholder="Ex: Felipe treinou hoje carga 8/10, sono de 7h, queixou de leve dor no joelho direito. Próxima sessão foco em mobilidade."
              rows={4}
              style={{
                width: '100%', padding: '12px 14px',
                border: `1px solid ${T.border}`, borderRadius: 10,
                fontSize: 13, fontFamily: 'inherit', color: T.text,
                resize: 'none', outline: 'none', boxSizing: 'border-box',
                background: (isRecording || isTranscribing) ? T.bg : T.white,
                marginBottom: 12,
              }}
            />

            {error && (
              <p style={{ fontSize: 12, color: '#EF4444', margin: '0 0 12px', textAlign: 'center' }}>{error}</p>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setStep(0)}
                style={{
                  flex: 1, padding: '11px', border: `1px solid ${T.border}`,
                  borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  color: T.muted, background: 'transparent', fontFamily: 'inherit',
                }}
              >
                Voltar
              </button>
              <button
                onClick={handleSendText}
                disabled={!textInput.trim() || isTranscribing || isRecording}
                style={{
                  flex: 2, padding: '11px',
                  background: !textInput.trim() || isTranscribing ? T.border : BRAND,
                  color: '#fff', border: 'none', borderRadius: 10,
                  cursor: !textInput.trim() || isTranscribing ? 'default' : 'pointer',
                  fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'background 150ms',
                }}
              >
                {isTranscribing
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Processando…</>
                  : <><Brain size={14} /> Estruturar com IA</>
                }
              </button>
            </div>

            <button
              onClick={() => { localStorage.setItem(STORAGE_KEY, '1'); onDone() }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: T.muted, marginTop: 14, fontFamily: 'inherit', textDecoration: 'underline' }}
            >
              Pular por agora
            </button>
          </div>
        )}

        {/* ── STEP 2: Resultado ─────────────────────────────────── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: '#DCFCE7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <CheckCircle2 size={26} style={{ color: '#16A34A' }} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: '0 0 8px' }}>
                {result ? 'A IA estruturou o registro!' : 'Tudo pronto!'}
              </h2>
              <p style={{ fontSize: 13, color: T.muted, margin: 0, lineHeight: 1.6 }}>
                {result
                  ? `Salvo no perfil de ${firstContact?.contact_name || 'seu atleta'}. Isso é o que fica registrado:`
                  : 'Você está pronto para começar a usar o Orbi Coaching.'}
              </p>
            </div>

            {result && (
              <div style={{ marginBottom: 24 }}>
                <StructuredResult event={result} />
              </div>
            )}

            {!result && (
              <div style={{ marginBottom: 24, padding: '20px', background: T.white, borderRadius: 12, border: `1px solid ${T.border}`, textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
                  Abra o perfil de qualquer atleta e registre a primeira nota — por áudio, texto ou arquivo PDF.
                  A IA extrai sono, carga, observações e próxima ação automaticamente.
                </p>
              </div>
            )}

            <button
              onClick={() => { localStorage.setItem(STORAGE_KEY, '1'); onDone() }}
              style={{
                width: '100%', padding: '13px',
                background: BRAND, color: '#fff',
                border: 'none', borderRadius: 10, cursor: 'pointer',
                fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              Ir para o dashboard
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .animate-pulse { animation: pulse 1.5s ease-in-out infinite }
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.65 } }
      `}</style>
    </div>,
    document.body
  )
}
