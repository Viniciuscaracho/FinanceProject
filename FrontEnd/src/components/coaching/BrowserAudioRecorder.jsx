import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Mic, MicOff, Brain, Sparkles, Check, Loader2, X,
  ChevronRight, Plus, Moon, Dumbbell, MessageSquare, ArrowUpRight,
  AlertCircle,
} from 'lucide-react'
import { apiService } from '@/lib/api'
import { T } from '@/lib/tokens'

const BRAND = '#4C60AA'
const FONT  = { fontFamily: "'Space Grotesk', system-ui, sans-serif" }

/* ─── Onda animada durante gravação ─────────────────────────────── */
function RecordingWave({ active }) {
  const bars = [4, 10, 16, 22, 14, 26, 8, 20, 12, 18, 24, 6, 16, 10, 22]
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, height: 36 }}>
      {bars.map((h, i) => (
        <span
          key={i}
          style={{
            display: 'block',
            width: 3,
            borderRadius: 3,
            background: BRAND,
            height: active ? h : 4,
            opacity: active ? 1 : 0.3,
            transition: `height ${0.15 + (i % 4) * 0.05}s ease-in-out`,
            animation: active ? `bar-wave-${i % 4} ${0.6 + (i % 3) * 0.2}s ease-in-out infinite alternate` : 'none',
          }}
        />
      ))}
      <style>{`
        @keyframes bar-wave-0 { from { height: 6px } to { height: 24px } }
        @keyframes bar-wave-1 { from { height: 10px } to { height: 28px } }
        @keyframes bar-wave-2 { from { height: 4px } to { height: 20px } }
        @keyframes bar-wave-3 { from { height: 8px } to { height: 18px } }
      `}</style>
    </div>
  )
}

/* ─── Chip de resultado ──────────────────────────────────────────── */
function ResultChip({ icon: Icon, label, value, color }) {
  if (!value) return null
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '10px 12px',
        background: color + '0D',
        border: `1px solid ${color}28`,
        borderRadius: 10,
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginTop: 1,
      }}>
        <Icon size={14} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: T.muted, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
        <p style={{ fontSize: 13, color: T.text, margin: 0, lineHeight: 1.45 }}>{value}</p>
      </div>
    </motion.div>
  )
}

/* ─── Modal principal ────────────────────────────────────────────── */
export function BrowserAudioRecorder({ onClose }) {
  const navigate = useNavigate()

  // step: 'select' | 'record' | 'processing' | 'done' | 'error'
  const [step, setStep] = useState('select')

  // Contact selection
  const [contacts, setContacts]             = useState([])
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [search, setSearch]                 = useState('')
  const [selectedContact, setSelectedContact] = useState(null)
  const [showNew, setShowNew]               = useState(false)
  const [newName, setNewName]               = useState('')
  const [creatingContact, setCreatingContact] = useState(false)

  // Recording
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration]       = useState(0)
  const mediaRecorderRef  = useRef(null)
  const audioChunksRef    = useRef([])
  const timerRef          = useRef(null)
  const streamRef         = useRef(null)

  // Processing / result
  const [processStage, setProcessStage] = useState(0)
  const [result, setResult]             = useState(null)
  const [errorMsg, setErrorMsg]         = useState('')

  /* Carrega contatos */
  useEffect(() => {
    apiService.getContacts(1, 200)
      .then(res => setContacts(res.contacts || res || []))
      .catch(() => {})
      .finally(() => setLoadingContacts(false))
  }, [])

  /* Escape fecha */
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', esc)
      document.body.style.overflow = ''
      clearInterval(timerRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [onClose])

  const filtered = contacts.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  )

  /* Cria contato rápido */
  const handleCreateContact = async () => {
    if (!newName.trim()) return
    setCreatingContact(true)
    try {
      const res = await apiService.createContact({ name: newName.trim() })
      const contact = res.contact || res
      setContacts(prev => [contact, ...prev])
      setSelectedContact(contact)
      setShowNew(false)
      setNewName('')
    } catch {
      // keep form open
    } finally {
      setCreatingContact(false)
    }
  }

  /* Inicia gravação */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      audioChunksRef.current = []

      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      const recorder = new MediaRecorder(stream, { mimeType })

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        streamRef.current = null
        setIsRecording(false)
        clearInterval(timerRef.current)

        const blob = new Blob(audioChunksRef.current, { type: mimeType })
        if (blob.size === 0) return

        setStep('processing')
        setProcessStage(0)
        const stageTimer = setTimeout(() => setProcessStage(1), 7000)

        try {
          const res = await apiService.uploadAudioNote(selectedContact.id, blob)
          clearTimeout(stageTimer)
          setResult(res)
          setStep('done')
        } catch (err) {
          clearTimeout(stageTimer)
          setErrorMsg(err?.message || 'Erro ao processar. Tente novamente.')
          setStep('error')
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
      setDuration(0)
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
      setStep('record')
    } catch {
      setErrorMsg('Acesso ao microfone negado. Verifique as permissões do navegador.')
      setStep('error')
    }
  }

  const stopRecording = () => mediaRecorderRef.current?.stop()

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const event = result?.event

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(14,16,32,0.68)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.white,
          borderRadius: 24,
          width: '100%',
          maxWidth: 440,
          maxHeight: '90dvh',
          overflowY: 'auto',
          boxShadow: '0 32px 96px rgba(14,16,32,0.28)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Fechar */}
        {step !== 'processing' && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16, zIndex: 10,
              width: 32, height: 32, borderRadius: '50%',
              border: 'none', background: T.light, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={14} color={T.muted} />
          </button>
        )}

        {/* ── Step: select ──────────────────────────────────────── */}
        {step === 'select' && (
          <div style={{ padding: '32px 28px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: T.light, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Mic size={22} color={BRAND} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: '0 0 6px', ...FONT }}>
                Gravar áudio no browser
              </h2>
              <p style={{ fontSize: 13.5, color: T.muted, margin: 0, lineHeight: 1.6 }}>
                Para qual atleta é esse registro?
              </p>
            </div>

            {/* Busca */}
            <input
              type="text"
              placeholder="Buscar atleta..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowNew(false) }}
              autoFocus
              style={{
                width: '100%', height: 42, borderRadius: 10,
                border: `1.5px solid ${T.border}`,
                padding: '0 12px', fontSize: 14, color: T.text,
                outline: 'none', boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => { e.target.style.borderColor = BRAND }}
              onBlur={(e) => { e.target.style.borderColor = T.border }}
            />

            {/* Lista de contatos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
              {loadingContacts ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
                  <Loader2 size={18} color={T.muted} style={{ animation: 'br-spin 1s linear infinite' }} />
                </div>
              ) : filtered.length === 0 && !showNew ? (
                <p style={{ fontSize: 13, color: T.muted, textAlign: 'center', padding: '12px 0' }}>
                  Nenhum atleta encontrado
                </p>
              ) : (
                filtered.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedContact(c)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 10,
                      border: `1.5px solid ${selectedContact?.id === c.id ? BRAND : T.border}`,
                      background: selectedContact?.id === c.id ? BRAND + '0C' : 'transparent',
                      cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                      transition: 'all 120ms',
                    }}
                  >
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                      background: selectedContact?.id === c.id ? BRAND + '20' : T.light,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700,
                      color: selectedContact?.id === c.id ? BRAND : T.muted,
                    }}>
                      {c.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: T.text, flex: 1 }}>{c.name}</span>
                    {selectedContact?.id === c.id && <Check size={15} color={BRAND} />}
                  </button>
                ))
              )}
            </div>

            {/* Novo atleta */}
            {!showNew ? (
              <button
                onClick={() => { setShowNew(true); setSelectedContact(null) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 12px', borderRadius: 10,
                  border: `1.5px dashed ${T.border}`,
                  background: 'transparent', cursor: 'pointer',
                  fontFamily: 'inherit', color: BRAND,
                  fontSize: 13.5, fontWeight: 600,
                }}
              >
                <Plus size={15} /> Novo atleta...
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Nome do atleta"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreateContact() }}
                  style={{
                    flex: 1, height: 40, borderRadius: 10,
                    border: `1.5px solid ${BRAND}`,
                    padding: '0 12px', fontSize: 14, color: T.text,
                    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                  }}
                />
                <button
                  onClick={handleCreateContact}
                  disabled={!newName.trim() || creatingContact}
                  style={{
                    height: 40, padding: '0 14px', borderRadius: 10,
                    background: BRAND, color: '#fff',
                    border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                    opacity: (!newName.trim() || creatingContact) ? 0.55 : 1,
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontFamily: 'inherit',
                  }}
                >
                  {creatingContact
                    ? <Loader2 size={14} style={{ animation: 'br-spin 1s linear infinite' }} />
                    : 'Criar'
                  }
                </button>
                <button
                  onClick={() => { setShowNew(false); setNewName('') }}
                  style={{ height: 40, width: 40, borderRadius: 10, border: `1px solid ${T.border}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={14} color={T.muted} />
                </button>
              </div>
            )}

            {/* Próximo */}
            <button
              onClick={startRecording}
              disabled={!selectedContact}
              style={{
                width: '100%', height: 48, borderRadius: 12,
                background: selectedContact ? BRAND : T.border,
                color: '#fff', border: 'none', cursor: selectedContact ? 'pointer' : 'not-allowed',
                fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 150ms',
              }}
            >
              <Mic size={16} />
              {selectedContact ? `Gravar para ${selectedContact.name}` : 'Selecione um atleta para gravar'}
            </button>
          </div>
        )}

        {/* ── Step: record ──────────────────────────────────────── */}
        {step === 'record' && (
          <div style={{ padding: '40px 28px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, textAlign: 'center' }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: BRAND, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 6px' }}>
                Gravando para
              </p>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: T.text, margin: 0, ...FONT }}>
                {selectedContact?.name}
              </h2>
            </div>

            <RecordingWave active={isRecording} />

            {/* Timer */}
            <div style={{ fontSize: 36, fontWeight: 700, color: T.text, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em', ...FONT }}>
              {fmt(duration)}
            </div>

            <p style={{ fontSize: 13, color: T.muted, margin: 0, maxWidth: '32ch', lineHeight: 1.6 }}>
              Fale sobre o treino, o sono, a dieta ou qualquer observação sobre o atleta.
            </p>

            {/* Botão parar */}
            <button
              onClick={stopRecording}
              style={{
                width: 72, height: 72, borderRadius: '50%',
                background: '#EF4444',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 20px rgba(239,68,68,0.4)',
                animation: 'br-pulse 1.5s ease-in-out infinite',
              }}
            >
              <MicOff size={28} color="#fff" />
            </button>
            <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>Toque para parar e enviar</p>
          </div>
        )}

        {/* ── Step: processing ─────────────────────────────────── */}
        {step === 'processing' && (
          <div style={{ padding: '48px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              style={{ width: 56, height: 56, borderRadius: 16, background: T.light, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Brain size={26} color={BRAND} />
            </motion.div>

            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: '0 0 8px', ...FONT }}>
                {processStage === 0 ? 'Transcrevendo áudio...' : 'Organizando com IA...'}
              </h2>
              <p style={{ fontSize: 13.5, color: T.muted, margin: 0, lineHeight: 1.6, maxWidth: '30ch' }}>
                {processStage === 0
                  ? 'Whisper está convertendo sua fala em texto'
                  : 'A IA está estruturando sono, carga e observações'
                }
              </p>
            </div>

            {/* Progress bar fake */}
            <div style={{ width: '100%', height: 4, background: T.light, borderRadius: 4, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: '5%' }}
                animate={{ width: processStage === 0 ? '55%' : '90%' }}
                transition={{ duration: processStage === 0 ? 7 : 8, ease: 'easeOut' }}
                style={{ height: '100%', background: BRAND, borderRadius: 4 }}
              />
            </div>

            <p style={{ fontSize: 12, color: '#bbb', margin: 0 }}>Isso leva alguns segundos...</p>
          </div>
        )}

        {/* ── Step: done ───────────────────────────────────────── */}
        {step === 'done' && event && (
          <div style={{ padding: '32px 28px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Check size={22} color="#16A34A" />
              </div>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: '0 0 3px', ...FONT }}>
                  Registro salvo!
                </h2>
                <p style={{ fontSize: 12.5, color: T.muted, margin: 0 }}>
                  {selectedContact?.name} · agora
                </p>
              </div>
            </div>

            {/* Transcrição resumida */}
            {result?.transcript && (
              <div style={{ padding: '10px 13px', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: T.muted, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Transcrição</p>
                <p style={{ fontSize: 12.5, color: '#333', margin: 0, lineHeight: 1.55 }}>
                  {result.transcript.slice(0, 200)}{result.transcript.length > 200 ? '...' : ''}
                </p>
              </div>
            )}

            {/* Campos estruturados */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: T.muted, margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={11} color={BRAND} /> Estruturado pela IA
              </p>
              <ResultChip icon={Moon}          label="Sono"         value={event.sono}          color="#6366F1" />
              <ResultChip icon={Dumbbell}      label="Carga"        value={event.carga}         color="#F59E0B" />
              <ResultChip icon={MessageSquare} label="Observação"   value={event.observacao}    color="#EF4444" />
              <ResultChip icon={ArrowUpRight}  label="Próxima ação" value={event.proxima_acao}  color="#10B981" />
              {!event.sono && !event.carga && !event.observacao && !event.proxima_acao && (
                <div style={{ padding: '10px 13px', background: T.bg, borderRadius: 10, border: `1px solid ${T.border}` }}>
                  <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>Registro salvo na timeline do atleta.</p>
                </div>
              )}
            </div>

            {/* Créditos */}
            {result?.credits_balance != null && (
              <p style={{ fontSize: 11.5, color: T.muted, margin: 0 }}>
                Créditos restantes: <strong style={{ color: T.text }}>{result.credits_balance}</strong>
              </p>
            )}

            {/* Ações */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => { onClose(); navigate(`/contacts/${selectedContact.id}`) }}
                style={{
                  flex: 1, height: 44, borderRadius: 10,
                  background: BRAND, color: '#fff',
                  border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                }}
              >
                Ver perfil de {selectedContact?.name?.split(' ')[0]} →
              </button>
              <button
                onClick={() => { setStep('select'); setResult(null); setDuration(0) }}
                style={{
                  height: 44, padding: '0 16px', borderRadius: 10,
                  border: `1.5px solid ${T.border}`, background: 'transparent',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  color: T.muted, fontFamily: 'inherit',
                }}
              >
                Gravar outro
              </button>
            </div>
          </div>
        )}

        {/* ── Step: error ──────────────────────────────────────── */}
        {step === 'error' && (
          <div style={{ padding: '40px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={24} color="#EF4444" />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: T.text, margin: '0 0 8px', ...FONT }}>Algo deu errado</h2>
              <p style={{ fontSize: 13.5, color: T.muted, margin: 0, lineHeight: 1.6 }}>{errorMsg}</p>
            </div>
            <button
              onClick={() => { setStep('select'); setErrorMsg('') }}
              style={{
                height: 44, padding: '0 24px', borderRadius: 10,
                background: BRAND, color: '#fff',
                border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
              }}
            >
              Tentar novamente
            </button>
          </div>
        )}

        <style>{`
          @keyframes br-spin  { to { transform: rotate(360deg) } }
          @keyframes br-pulse { 0%,100% { box-shadow: 0 6px 20px rgba(239,68,68,0.4) } 50% { box-shadow: 0 6px 32px rgba(239,68,68,0.7) } }
        `}</style>
      </motion.div>
    </motion.div>
  )
}
