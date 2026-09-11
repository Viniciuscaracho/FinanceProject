import { useState, useEffect, useCallback } from 'react'
import { BookOpen, Plus, X, Link, FileText, ChevronDown, ChevronUp, RotateCcw, Check, Trash2, Loader2, BookMarked, AlertCircle, MessageSquare } from 'lucide-react'
import { apiService } from '@/lib/api'

/* ── Paleta de tipos de card ─────────────────────────────────────────── */
const TYPE_CONFIG = {
  vocabulary: { label: 'Vocabulary',  color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', icon: BookOpen },
  mistake:    { label: 'Avoid',       color: '#EF4444', bg: '#FEF2F2', border: '#FECACA', icon: AlertCircle },
  phrase:     { label: 'Phrase',      color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0', icon: MessageSquare },
}

const TABS = [
  { key: 'all',        label: 'All' },
  { key: 'vocabulary', label: 'Vocabulary' },
  { key: 'mistake',    label: 'Avoid' },
  { key: 'phrase',     label: 'Phrases' },
  { key: 'review',     label: 'Review' },
]

/* ── Card flip individual ────────────────────────────────────────────── */
function FlashCard({ card, onDelete, reviewMode, onReview }) {
  const [flipped, setFlipped] = useState(false)
  const cfg = TYPE_CONFIG[card.card_type] || TYPE_CONFIG.vocabulary
  const Icon = cfg.icon

  const handleReview = (status, e) => {
    e.stopPropagation()
    onReview(card.id, status)
  }

  return (
    <div
      onClick={() => setFlipped(f => !f)}
      style={{
        cursor: 'pointer',
        borderRadius: 14,
        border: `1.5px solid ${flipped ? cfg.border : '#E5E7EB'}`,
        background: flipped ? cfg.bg : '#FFFFFF',
        padding: '18px 16px',
        minHeight: 140,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
        boxShadow: flipped ? `0 0 0 3px ${cfg.border}` : '0 1px 3px rgba(0,0,0,0.06)',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* type badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
          color: cfg.color, textTransform: 'uppercase',
        }}>
          <Icon size={10} />
          {cfg.label}
        </span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {card.status === 'known' && (
            <span style={{ fontSize: 10, color: '#10B981', fontWeight: 600 }}>✓ Known</span>
          )}
          <button
            onClick={e => { e.stopPropagation(); onDelete(card.id) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#9CA3AF', lineHeight: 0 }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* front / back */}
      <div style={{ flex: 1 }}>
        {!flipped ? (
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827', lineHeight: 1.4 }}>
            {card.front}
          </p>
        ) : (
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
              {card.back}
            </p>
            {card.example && (
              <p style={{ margin: 0, fontSize: 12.5, color: '#6B7280', fontStyle: 'italic', lineHeight: 1.5, borderLeft: `3px solid ${cfg.border}`, paddingLeft: 8 }}>
                "{card.example}"
              </p>
            )}
          </div>
        )}
      </div>

      {/* flip hint */}
      {!flipped && (
        <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>Tap to reveal →</p>
      )}

      {/* review buttons (only when flipped and in review mode) */}
      {reviewMode && flipped && (
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }} onClick={e => e.stopPropagation()}>
          <button onClick={e => handleReview('learning', e)} style={{
            flex: 1, padding: '6px 0', borderRadius: 8, border: '1.5px solid #FCA5A5',
            background: '#FFF', color: '#EF4444', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            Still learning
          </button>
          <button onClick={e => handleReview('known', e)} style={{
            flex: 1, padding: '6px 0', borderRadius: 8, border: '1.5px solid #6EE7B7',
            background: '#FFF', color: '#10B981', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>
            Got it! ✓
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Import form ─────────────────────────────────────────────────────── */
function ImportForm({ onImported }) {
  const [url, setUrl]         = useState('')
  const [text, setText]       = useState('')
  const [mode, setMode]       = useState('paste')  // 'paste' | 'url'
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const submit = async () => {
    setError(null)
    setLoading(true)
    try {
      const payload = mode === 'url'
        ? { url: url.trim() }
        : { raw_text: text.trim() }

      const res = await apiService.request('/english/sessions', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      onImported(res.cards || [])
      setUrl('')
      setText('')
    } catch (e) {
      setError(e?.response?.data?.error || 'Erro ao importar conversa')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = mode === 'url' ? url.trim().length > 10 : text.trim().length > 50

  return (
    <div style={{
      background: '#F9FAFB',
      border: '1.5px solid #E5E7EB',
      borderRadius: 14,
      padding: '18px 20px',
      marginBottom: 24,
    }}>
      <p style={{ margin: '0 0 14px', fontWeight: 700, fontSize: 14, color: '#111827' }}>
        Import a ChatGPT conversation
      </p>

      {/* mode toggle */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 14, border: '1.5px solid #E5E7EB', borderRadius: 10, overflow: 'hidden', width: 'fit-content' }}>
        {[{ key: 'paste', label: 'Paste text', icon: FileText }, { key: 'url', label: 'Share URL', icon: Link }].map(opt => (
          <button key={opt.key} onClick={() => setMode(opt.key)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
            background: mode === opt.key ? '#111827' : '#fff',
            color:      mode === opt.key ? '#fff' : '#6B7280',
            transition: 'background 0.15s, color 0.15s',
          }}>
            <opt.icon size={12} />
            {opt.label}
          </button>
        ))}
      </div>

      {mode === 'url' ? (
        <>
          <p style={{ margin: '0 0 8px', fontSize: 12, color: '#F59E0B' }}>
            ⚠️ O ChatGPT renderiza via JavaScript — a extração por URL pode falhar. Se der erro, use "Paste text".
          </p>
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://chatgpt.com/share/..."
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '9px 12px', borderRadius: 9, border: '1.5px solid #D1D5DB',
            fontSize: 13, color: '#111827', background: '#fff',
            outline: 'none', marginBottom: 10,
          }}
        />
        </>
      ) : (
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Cole aqui a conversa do ChatGPT. No ChatGPT: selecione tudo (Ctrl+A na conversa) e copie. Ou abra a conversa, clique com botão direito → 'Selecionar Tudo' → Copiar."
          rows={6}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '9px 12px', borderRadius: 9, border: '1.5px solid #D1D5DB',
            fontSize: 13, color: '#111827', background: '#fff',
            outline: 'none', resize: 'vertical', fontFamily: 'inherit', marginBottom: 10,
          }}
        />
      )}

      {error && (
        <p style={{ margin: '0 0 10px', fontSize: 12.5, color: '#EF4444' }}>{error}</p>
      )}

      <button
        onClick={submit}
        disabled={!canSubmit || loading}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 18px', borderRadius: 9, border: 'none',
          background: canSubmit && !loading ? '#111827' : '#D1D5DB',
          color: '#fff', fontWeight: 700, fontSize: 13, cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
        }}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        {loading ? 'Extracting cards...' : 'Extract cards'}
      </button>
    </div>
  )
}

/* ── Stats row ───────────────────────────────────────────────────────── */
function Stats({ cards }) {
  const stats = [
    { label: 'Total cards',  value: cards.length,                                    color: '#111827' },
    { label: 'Vocabulary',   value: cards.filter(c => c.card_type === 'vocabulary').length, color: '#3B82F6' },
    { label: 'Avoid',        value: cards.filter(c => c.card_type === 'mistake').length,    color: '#EF4444' },
    { label: 'Phrases',      value: cards.filter(c => c.card_type === 'phrase').length,     color: '#10B981' },
    { label: 'Known',        value: cards.filter(c => c.status === 'known').length,         color: '#6B7280' },
  ]
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
      {stats.map(s => (
        <div key={s.label} style={{
          background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10,
          padding: '10px 16px', minWidth: 80, textAlign: 'center',
        }}>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</p>
          <p style={{ margin: 0, fontSize: 10.5, color: '#9CA3AF', fontWeight: 600, marginTop: 2 }}>{s.label}</p>
        </div>
      ))}
    </div>
  )
}

/* ── Main page ───────────────────────────────────────────────────────── */
export function EnglishLearning() {
  const [cards, setCards]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [showImport, setShowImport] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  const loadCards = useCallback(async () => {
    try {
      const data = await apiService.request('/english/cards')
      setCards(data)
    } catch {
      // silently ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadCards() }, [loadCards])

  const handleImported = (newCards) => {
    setCards(prev => [...newCards, ...prev])
    setShowImport(false)
  }

  const handleDelete = async (id) => {
    try {
      await apiService.request(`/english/cards/${id}`, { method: 'DELETE' })
      setCards(prev => prev.filter(c => c.id !== id))
    } catch { /* ignore */ }
  }

  const handleReview = async (id, status) => {
    try {
      const updated = await apiService.request(`/english/cards/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setCards(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c))
    } catch { /* ignore */ }
  }

  const visibleCards = activeTab === 'all' || activeTab === 'review'
    ? cards
    : cards.filter(c => c.card_type === activeTab)

  const reviewCards = cards.filter(c => c.status === 'learning')
  const isReview = activeTab === 'review'

  return (
    <div style={{ padding: '28px 24px', maxWidth: 900, margin: '0 auto' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11, background: '#111827',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BookMarked size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#111827' }}>English Cards</h1>
            <p style={{ margin: 0, fontSize: 12, color: '#9CA3AF' }}>Your personal learning memory</p>
          </div>
        </div>
        <button
          onClick={() => setShowImport(s => !s)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 10, border: 'none',
            background: '#111827', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}
        >
          {showImport ? <ChevronUp size={14} /> : <Plus size={14} />}
          {showImport ? 'Close' : 'Import conversation'}
        </button>
      </div>

      {/* import form */}
      {showImport && <ImportForm onImported={handleImported} />}

      {/* stats */}
      {!loading && cards.length > 0 && <Stats cards={cards} />}

      {/* tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1.5px solid #F3F4F6', paddingBottom: 0 }}>
        {TABS.map(tab => {
          const count = tab.key === 'all' ? cards.length
            : tab.key === 'review' ? reviewCards.length
            : cards.filter(c => c.card_type === tab.key).length
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '7px 14px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 500,
                color: activeTab === tab.key ? '#111827' : '#9CA3AF',
                borderBottom: activeTab === tab.key ? '2.5px solid #111827' : '2.5px solid transparent',
                marginBottom: -1.5, display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              {tab.label}
              {count > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  background: activeTab === tab.key ? '#111827' : '#F3F4F6',
                  color: activeTab === tab.key ? '#fff' : '#6B7280',
                  borderRadius: 20, padding: '1px 6px',
                }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* review mode hint */}
      {isReview && reviewCards.length > 0 && (
        <div style={{
          background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10,
          padding: '10px 14px', marginBottom: 16, fontSize: 12.5, color: '#92400E',
        }}>
          Flip a card, then mark if you knew it or still need to practice.
        </div>
      )}

      {/* loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
          <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
          <p style={{ margin: 0, fontSize: 13 }}>Loading cards...</p>
        </div>
      )}

      {/* empty state */}
      {!loading && cards.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
          <BookOpen size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600, color: '#6B7280' }}>No cards yet</p>
          <p style={{ margin: 0, fontSize: 13 }}>Import a ChatGPT conversation to extract your first vocabulary cards.</p>
        </div>
      )}

      {/* review empty */}
      {!loading && isReview && reviewCards.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
          <Check size={40} style={{ marginBottom: 12, color: '#10B981', opacity: 0.7 }} />
          <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600, color: '#6B7280' }}>All caught up!</p>
          <p style={{ margin: 0, fontSize: 13 }}>No cards left to review right now.</p>
        </div>
      )}

      {/* cards grid */}
      {!loading && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 14,
        }}>
          {(isReview ? reviewCards : visibleCards).map(card => (
            <FlashCard
              key={card.id}
              card={card}
              onDelete={handleDelete}
              reviewMode={isReview}
              onReview={handleReview}
            />
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
