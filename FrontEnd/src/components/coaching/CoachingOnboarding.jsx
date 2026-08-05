import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Mic, MicOff, Loader2, CheckCircle2, ArrowRight, Zap, Brain, FileText, Users, User } from 'lucide-react'
import { apiService } from '@/lib/api'
import { T } from '@/lib/tokens'

const WA_LINK = 'https://wa.me/5511989324130'
const WA_NUMBER_DISPLAY = '(11) 98932-4130'

function WhatsAppIcon({ size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

const STORAGE_KEY = 'coaching_onboard_v1'
const BRAND = '#4C60AA'

/* ── Hook de exibição ───────────────────────────────────────────────── */
export function useCoachingOnboarding(contacts, totalEvents) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return
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

/* ── Animação de "como funciona" — treinador ────────────────────────── */
function HowItWorksTrainer() {
  const steps = [
    { icon: Mic,      label: 'Você fala',           sub: 'Áudio, texto ou arquivo sobre o atleta' },
    { icon: Brain,    label: 'A IA estrutura',       sub: 'Sono, carga, observação, próxima ação' },
    { icon: FileText, label: 'Registro automático',  sub: 'Fica salvo no perfil do atleta' },
  ]
  return <HowItWorksList steps={steps} />
}

/* ── Animação de "como funciona" — atleta ───────────────────────────── */
function HowItWorksAthlete() {
  const steps = [
    { icon: Mic,      label: 'Você registra',        sub: 'Áudio, texto ou arquivo sobre você' },
    { icon: Brain,    label: 'A IA organiza',         sub: 'Sono, treino, evolução, próximos passos' },
    { icon: FileText, label: 'Histórico próprio',     sub: 'Tudo salvo no seu perfil pessoal' },
  ]
  return <HowItWorksList steps={steps} />
}

function HowItWorksList({ steps }) {
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

/* ── Card de seleção de perfil ──────────────────────────────────────── */
function RoleCard({ icon: Icon, title, description, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', padding: '16px 18px',
        border: `2px solid ${selected ? BRAND : T.border}`,
        borderRadius: 12, cursor: 'pointer',
        background: selected ? BRAND + '08' : T.white,
        textAlign: 'left', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', gap: 14,
        transition: 'all 150ms',
      }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
        background: selected ? BRAND + '18' : T.chip,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={20} style={{ color: selected ? BRAND : T.muted }} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>{title}</p>
        <p style={{ margin: '3px 0 0', fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{description}</p>
      </div>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${selected ? BRAND : T.border}`,
        background: selected ? BRAND : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
      </div>
    </button>
  )
}

/* ── Componente principal ───────────────────────────────────────────── */
export function CoachingOnboarding({ contacts, onDone, onRoleSelected }) {
  const [role, setRole]   = useState(null)   // 'trainer' | 'athlete'
  const [step, setStep]   = useState(0)      // 0 = role selection, 1 = welcome, 2 = test, 3 = result
  const [setupLoading, setSetupLoading] = useState(false)
  const [setupError, setSetupError]     = useState(null)

  // Step 2 — áudio/texto
  const [isRecording, setIsRecording]       = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [textInput, setTextInput]           = useState('')
  const [result, setResult]                 = useState(null)
  const [error, setError]                   = useState(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef   = useRef([])

  const firstContact = contacts?.[0]

  const totalSteps = 4  // role, welcome, test, result

  /* ── Confirmar perfil ──────────────────────────────────────────── */
  const confirmRole = async () => {
    if (!role) return

    if (role === 'athlete') {
      setSetupLoading(true)
      setSetupError(null)
      try {
        const res = await apiService.setupAthlete()
        if (onRoleSelected) onRoleSelected('athlete', res.contact_id)
        setStep(1)
      } catch {
        setSetupError('Erro ao configurar conta. Tente novamente.')
      } finally {
        setSetupLoading(false)
      }
    } else {
      if (onRoleSelected) onRoleSelected('trainer', null)
      setStep(1)
    }
  }

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
          if (res?.event) { setResult(res.event); setStep(3) }
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
      if (res?.event) { setResult(res.event); setStep(3) }
    } catch {
      setError('Erro ao processar. Tente novamente.')
    } finally {
      setIsTranscribing(false)
    }
  }

  const athleteTestPlaceholder = 'Ex: Hoje fiz 3x10 supino com 60kg, senti bem. Sono de 7h, disposição alta. Semana que vem quero aumentar carga.'
  const trainerTestPlaceholder = 'Ex: Felipe treinou hoje carga 8/10, sono de 7h, queixou de leve dor no joelho direito. Próxima sessão foco em mobilidade.'

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
        <Dots step={step} total={totalSteps} />

        {/* ── STEP 0: Seleção de perfil ─────────────────────────── */}
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
                Bem-vindo ao Orbi
              </h2>
              <p style={{ fontSize: 14, color: T.muted, margin: 0, lineHeight: 1.6 }}>
                Como você vai usar o Orbi?
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              <RoleCard
                icon={Users}
                title="Sou treinador / profissional"
                description="Gerencio atletas, registro treinos e acompanho a evolução dos meus alunos."
                selected={role === 'trainer'}
                onClick={() => setRole('trainer')}
              />
              <RoleCard
                icon={User}
                title="Sou atleta independente"
                description="Quero registrar meu próprio treino, acompanhar minha evolução e montar minha dieta."
                selected={role === 'athlete'}
                onClick={() => setRole('athlete')}
              />
            </div>

            {setupError && (
              <p style={{ fontSize: 12, color: '#EF4444', marginBottom: 12, textAlign: 'center' }}>{setupError}</p>
            )}

            <button
              onClick={confirmRole}
              disabled={!role || setupLoading}
              style={{
                width: '100%', padding: '13px',
                background: !role || setupLoading ? T.border : BRAND,
                color: '#fff', border: 'none', borderRadius: 10,
                cursor: !role || setupLoading ? 'default' : 'pointer',
                fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 150ms',
              }}
            >
              {setupLoading
                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Configurando…</>
                : <>Continuar <ArrowRight size={16} /></>
              }
            </button>
          </div>
        )}

        {/* ── STEP 1: Boas-vindas ───────────────────────────────── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: BRAND + '15',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <Brain size={24} style={{ color: BRAND }} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: '0 0 8px' }}>
                {role === 'athlete' ? 'Seu treinamento, organizado' : 'Orbi Coaching'}
              </h2>
              <p style={{ fontSize: 14, color: T.muted, margin: 0, lineHeight: 1.6 }}>
                {role === 'athlete'
                  ? 'Você registra o que aconteceu — por áudio, texto ou arquivo — e a IA organiza tudo automaticamente.'
                  : 'Você registra o que aconteceu com seus atletas — por áudio, texto ou arquivo — e a IA estrutura tudo automaticamente.'
                }
              </p>
            </div>

            {role === 'athlete' ? <HowItWorksAthlete /> : <HowItWorksTrainer />}

            <button
              onClick={() => setStep(role === 'trainer' && firstContact ? 2 : 3)}
              style={{
                width: '100%', padding: '13px',
                background: BRAND, color: '#fff',
                border: 'none', borderRadius: 10, cursor: 'pointer',
                fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {role === 'trainer' && firstContact ? 'Testar agora' : 'Ir para o dashboard'}
              <ArrowRight size={16} />
            </button>

            {role === 'trainer' && !firstContact && (
              <p style={{ textAlign: 'center', fontSize: 12, color: T.muted, marginTop: 10 }}>
                Adicione atletas em <strong>Contatos</strong> para começar a registrar.
              </p>
            )}
          </div>
        )}

        {/* ── STEP 2: Teste ao vivo (treinador) ────────────────── */}
        {step === 2 && (
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

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: T.border }} />
              <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>ou escreva</span>
              <div style={{ flex: 1, height: 1, background: T.border }} />
            </div>

            <textarea
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              disabled={isRecording || isTranscribing}
              placeholder={trainerTestPlaceholder}
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
                onClick={() => setStep(1)}
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

            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginTop: 16, padding: '12px 14px',
                background: '#F0FDF4', border: '1px solid #BBF7D0',
                borderRadius: 10, textDecoration: 'none', color: '#15803D',
              }}
            >
              <WhatsAppIcon size={18} />
              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#15803D' }}>
                  Prefere testar pelo WhatsApp?
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#16A34A' }}>
                  Envie um áudio para {WA_NUMBER_DISPLAY} — o registro aparece automaticamente aqui.
                </p>
              </div>
            </a>
          </div>
        )}

        {/* ── STEP 3: Resultado / Conclusão ─────────────────────── */}
        {step === 3 && (
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
                  : role === 'athlete'
                    ? 'Seu perfil de atleta está pronto. Comece registrando seu primeiro treino.'
                    : 'Você está pronto para começar a usar o Orbi Coaching.'
                }
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
                  {role === 'athlete'
                    ? 'Use a aba Desempenho para registrar seus treinos e a aba Plano Alimentar para montar sua dieta com controle de macros.'
                    : 'Abra o perfil de qualquer atleta e registre a primeira nota de coaching — por áudio, texto ou arquivo PDF.'
                  }
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
