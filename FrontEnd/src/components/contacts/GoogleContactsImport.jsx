import { useState, useEffect } from 'react'
import { Users, Loader2, Check, X, Search, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiService } from '@/lib/api'
import { toast } from 'sonner'
import { T, DISPLAY } from '@/lib/tokens'

/* ── Ícone Google (SVG inline para não depender de lib) ── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

/* ── Row de contato selecionável ── */
function ContactRow({ contact, selected, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
        background: selected ? T.chip : 'transparent',
        border: `1px solid ${selected ? '#4C60AA40' : 'transparent'}`,
        transition: 'all 120ms',
      }}
    >
      {/* Checkbox visual */}
      <div style={{
        width: 20, height: 20, borderRadius: 5, flexShrink: 0,
        border: `2px solid ${selected ? '#4C60AA' : 'var(--border)'}`,
        background: selected ? '#4C60AA' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 120ms',
      }}>
        {selected && <Check size={12} color="#fff" strokeWidth={3} />}
      </div>

      {/* Avatar */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 700, color: '#4C60AA',
      }}>
        {(contact.name?.[0] || contact.email?.[0] || '?').toUpperCase()}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {contact.name || '(sem nome)'}
        </div>
        <div style={{ fontSize: 12, color: T.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {[contact.email, contact.phone].filter(Boolean).join(' · ') || '—'}
        </div>
      </div>
    </div>
  )
}

/* ── Modal principal ── */
export function GoogleContactsImport({ onImported, onClose }) {
  const [status, setStatus]       = useState('idle') // idle | loading | listing | importing | done | error
  const [contacts, setContacts]   = useState([])
  const [selected, setSelected]   = useState(new Set())
  const [search, setSearch]       = useState('')
  const [connected, setConnected] = useState(false)
  const [errorMsg, setErrorMsg]   = useState('')

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    setStatus('loading')
    try {
      const res = await apiService.getGoogleContactsStatus()
      setConnected(res.connected)
      if (res.connected) await loadContacts()
      else setStatus('idle')
    } catch {
      setStatus('idle')
    }
  }

  const connectGoogle = async () => {
    setStatus('loading')
    try {
      const res = await apiService.getGoogleContactsOAuthUrl()
      window.location.href = res.oauth_url
    } catch {
      setErrorMsg('Não foi possível iniciar a conexão com o Google.')
      setStatus('error')
    }
  }

  const loadContacts = async () => {
    setStatus('loading')
    try {
      const res = await apiService.listGoogleContacts()
      setContacts(res.contacts || [])
      setStatus('listing')
    } catch (e) {
      setErrorMsg(e.message || 'Erro ao carregar contatos do Google.')
      setStatus('error')
    }
  }

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((_, i) => contacts.indexOf(filtered[i]))))
    }
  }

  const toggle = (idx) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  const doImport = async () => {
    const toImport = [...selected].map(i => contacts[i])
    if (!toImport.length) { toast.error('Selecione pelo menos um contato'); return }

    setStatus('importing')
    try {
      const res = await apiService.importGoogleContacts(toImport)
      toast.success(`${res.imported} contato(s) importado(s)${res.skipped ? `, ${res.skipped} já existia(m)` : ''}`)
      onImported?.()
      onClose()
    } catch {
      toast.error('Erro ao importar contatos')
      setStatus('listing')
    }
  }

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase()
    return !q || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
  })

  const overlay = {
    position: 'fixed', inset: 0, zIndex: 9000,
    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  }

  const card = {
    width: '100%', maxWidth: 520, maxHeight: '85vh',
    background: T.white, borderRadius: 16,
    boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
    display: 'flex', flexDirection: 'column',
    ...DISPLAY,
  }

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={card}>

        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <GoogleIcon />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: T.text }}>Importar do Google</div>
            <div style={{ fontSize: 12, color: T.muted }}>
              {status === 'listing' ? `${contacts.length} contato(s) encontrado(s)` : 'Conecte sua conta Google'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

          {/* Estado: carregando */}
          {(status === 'loading' || status === 'importing') && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '32px 0', color: T.muted }}>
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 14 }}>
                {status === 'importing' ? 'Importando contatos…' : 'Conectando ao Google…'}
              </span>
            </div>
          )}

          {/* Estado: não conectado */}
          {status === 'idle' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '24px 0', textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: T.muted, maxWidth: 320 }}>
                Conecte sua conta Google para importar sua lista de contatos automaticamente.
              </div>
              <button
                onClick={connectGoogle}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 20px', borderRadius: 10,
                  border: '1px solid var(--border)', background: T.white,
                  fontSize: 14, fontWeight: 600, color: T.text, cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}
              >
                <GoogleIcon />
                Entrar com o Google
              </button>
            </div>
          )}

          {/* Estado: erro */}
          {status === 'error' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 0', color: '#DC2626', textAlign: 'center' }}>
              <AlertCircle size={24} />
              <span style={{ fontSize: 14 }}>{errorMsg}</span>
              <button onClick={() => setStatus('idle')} style={{ fontSize: 13, color: '#4C60AA', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Tentar novamente
              </button>
            </div>
          )}

          {/* Estado: listando */}
          {status === 'listing' && (
            <>
              {/* Barra de busca + selecionar todos */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.muted }} />
                  <input
                    style={{
                      width: '100%', padding: '8px 10px 8px 30px',
                      borderRadius: 8, border: '1px solid var(--border)',
                      fontSize: 13, color: T.text, background: T.white, boxSizing: 'border-box', outline: 'none',
                    }}
                    placeholder="Buscar contato…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <button
                  onClick={toggleAll}
                  style={{
                    fontSize: 12, fontWeight: 600, color: '#4C60AA',
                    background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                  }}
                >
                  {selected.size === filtered.length && filtered.length > 0 ? 'Desmarcar todos' : 'Selecionar todos'}
                </button>
              </div>

              {/* Lista */}
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: T.muted, fontSize: 13 }}>
                  Nenhum contato encontrado
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {filtered.map((c) => {
                    const idx = contacts.indexOf(c)
                    return (
                      <ContactRow
                        key={idx}
                        contact={c}
                        selected={selected.has(idx)}
                        onToggle={() => toggle(idx)}
                      />
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {status === 'listing' && (
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ fontSize: 13, color: T.muted }}>
              {selected.size > 0 ? `${selected.size} selecionado(s)` : 'Nenhum selecionado'}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={onClose}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', fontSize: 14, color: T.muted, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={doImport}
                disabled={selected.size === 0}
                style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none',
                  background: selected.size === 0 ? 'var(--border)' : '#4C60AA',
                  color: '#fff', fontSize: 14, fontWeight: 700, cursor: selected.size === 0 ? 'not-allowed' : 'pointer',
                  transition: 'background 150ms',
                }}
              >
                Importar {selected.size > 0 ? `(${selected.size})` : ''}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
