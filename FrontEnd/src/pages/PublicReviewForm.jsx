import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, Link } from 'react-router-dom'
import { Star, Send, Check, Loader2, ChevronLeft } from 'lucide-react'
import { apiService } from '../lib/api'
import { profileSlug } from '../lib/seoSlugs'

const T = {
  bg: '#f8f9fa', white: '#ffffff', brand: '#16a34a', brandLight: '#dcfce7',
  text: '#111827', muted: '#6b7280', border: '#e5e7eb', light: '#f3f4f6',
  star: '#f59e0b', starEmpty: '#e5e7eb', error: '#dc2626',
}

const STAR_LABELS = ['', 'Ruim', 'Regular', 'Bom', 'Ótimo', 'Excelente']

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0)
  const active = hover || value

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, lineHeight: 1 }}
            aria-label={`${n} estrelas`}
          >
            <Star
              size={36}
              fill={n <= active ? T.star : T.starEmpty}
              color={n <= active ? T.star : T.border}
              style={{ transition: 'all 120ms' }}
            />
          </button>
        ))}
      </div>
      {active > 0 && (
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: T.star }}>
          {STAR_LABELS[active]}
        </p>
      )}
    </div>
  )
}

function getInitials(name) {
  return (name || '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export default function PublicReviewForm() {
  const { id } = useParams()

  const [pro,      setPro]      = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [status,   setStatus]   = useState('idle') // idle | submitting | done | error
  const [errors,   setErrors]   = useState([])

  const [form, setForm] = useState({
    rating: 0, reviewer_name: '', reviewer_email: '', comment: '',
  })

  useEffect(() => {
    apiService.getReviewProfile(id)
      .then(setPro)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  function update(key, val) { setForm(f => ({ ...f, [key]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = []
    if (!form.rating)         errs.push('Selecione uma avaliação de 1 a 5 estrelas')
    if (!form.reviewer_name.trim()) errs.push('Informe seu nome')
    if (errs.length) { setErrors(errs); return }

    setErrors([])
    setStatus('submitting')
    try {
      await apiService.submitReview(id, {
        rating:         form.rating,
        reviewer_name:  form.reviewer_name.trim(),
        reviewer_email: form.reviewer_email.trim() || undefined,
        comment:        form.comment.trim() || undefined,
      })
      setStatus('done')
    } catch (err) {
      const msgs = err?.errors || [err?.message || 'Erro ao enviar avaliação']
      setErrors(Array.isArray(msgs) ? msgs : [msgs])
      setStatus('error')
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg }}>
      <Loader2 size={28} color={T.brand} style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  )

  if (!pro) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: T.bg }}>
      <p style={{ fontSize: 15, color: T.muted }}>Profissional não encontrado.</p>
      <Link to="/nutricionistas" style={{ color: T.brand, textDecoration: 'none', fontWeight: 600 }}>← Ver nutricionistas</Link>
    </div>
  )

  const slug = profileSlug(pro.name, pro.id)

  return (
    <>
      <Helmet>
        <title>Avaliar {pro.name} | OrbiNutri</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px 60px' }}>

        <div style={{ width: '100%', maxWidth: 520 }}>

          {/* Voltar */}
          <Link to={`/nutricionista/${slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: T.muted, textDecoration: 'none', marginBottom: 24 }}>
            <ChevronLeft size={14} /> Voltar ao perfil
          </Link>

          {/* Card do profissional */}
          <div style={{ background: T.white, borderRadius: 16, border: `1px solid ${T.border}`, padding: '20px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: T.brandLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {pro.logo_url
                ? <img src={pro.logo_url} alt={pro.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 20, fontWeight: 700, color: T.brand }}>{getInitials(pro.name)}</span>
              }
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text }}>{pro.name}</p>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: T.muted }}>{pro.profession_category}</p>
              {pro.ratings_count > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <Star size={11} fill={T.star} color={T.star} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{pro.ratings_average?.toFixed(1)}</span>
                  <span style={{ fontSize: 12, color: T.muted }}>({pro.ratings_count} avaliações)</span>
                </div>
              )}
            </div>
          </div>

          {/* Sucesso */}
          {status === 'done' ? (
            <div style={{ background: T.white, borderRadius: 16, border: `1px solid ${T.border}`, padding: '48px 32px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: T.brandLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Check size={28} color={T.brand} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: '0 0 10px' }}>Avaliação enviada!</h2>
              <p style={{ fontSize: 14, color: T.muted, margin: '0 0 28px', lineHeight: 1.6 }}>
                Obrigado por avaliar {pro.name}. Sua opinião ajuda outros pacientes a encontrar o profissional certo.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to={`/nutricionista/${slug}`} style={{ padding: '10px 20px', background: T.brand, color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                  Ver perfil
                </Link>
                <Link to="/nutricionistas" style={{ padding: '10px 20px', border: `1px solid ${T.border}`, borderRadius: 8, textDecoration: 'none', fontSize: 14, color: T.text, fontWeight: 500 }}>
                  Ver outros nutricionistas
                </Link>
              </div>
            </div>
          ) : (
            /* Formulário */
            <form onSubmit={handleSubmit}>
              <div style={{ background: T.white, borderRadius: 16, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
                <div style={{ padding: '24px 24px 0' }}>
                  <h1 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: T.text }}>
                    Como foi sua consulta?
                  </h1>
                  <p style={{ margin: '0 0 24px', fontSize: 13, color: T.muted }}>
                    Sua avaliação aparece no perfil público de {pro.name} e ajuda outros pacientes.
                  </p>
                </div>

                <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                  {/* Estrelas */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 10 }}>
                      Avaliação geral <span style={{ color: T.error }}>*</span>
                    </label>
                    <StarPicker value={form.rating} onChange={v => update('rating', v)} />
                  </div>

                  {/* Nome */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>
                      Seu nome <span style={{ color: T.error }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={form.reviewer_name}
                      onChange={e => update('reviewer_name', e.target.value)}
                      placeholder="Ex: Maria S."
                      maxLength={100}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, color: T.text, fontFamily: 'inherit', outline: 'none' }}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>
                      E-mail <span style={{ fontSize: 11, color: T.muted, fontWeight: 400 }}>(opcional, não publicado)</span>
                    </label>
                    <input
                      type="email"
                      value={form.reviewer_email}
                      onChange={e => update('reviewer_email', e.target.value)}
                      placeholder="seu@email.com"
                      style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, color: T.text, fontFamily: 'inherit', outline: 'none' }}
                    />
                  </div>

                  {/* Comentário */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>
                      Comentário <span style={{ fontSize: 11, color: T.muted, fontWeight: 400 }}>(opcional)</span>
                    </label>
                    <textarea
                      value={form.comment}
                      onChange={e => update('comment', e.target.value)}
                      placeholder="Conte como foi sua experiência com o profissional…"
                      rows={4}
                      maxLength={1000}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 14, color: T.text, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }}
                    />
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: T.muted, textAlign: 'right' }}>
                      {form.comment.length}/1000
                    </p>
                  </div>

                  {/* Erros */}
                  {errors.length > 0 && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px' }}>
                      {errors.map((e, i) => (
                        <p key={i} style={{ margin: i === 0 ? 0 : '6px 0 0', fontSize: 13, color: T.error }}>{e}</p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div style={{ padding: '20px 24px 24px', marginTop: 4, borderTop: `1px solid ${T.border}`, marginTop: 20 }}>
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    style={{ width: '100%', padding: '13px', background: T.brand, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: status === 'submitting' ? 0.7 : 1 }}
                  >
                    {status === 'submitting'
                      ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Enviando…</>
                      : <><Send size={15} /> Enviar avaliação</>
                    }
                  </button>
                  <p style={{ margin: '12px 0 0', fontSize: 11, color: T.muted, textAlign: 'center', lineHeight: 1.5 }}>
                    Ao enviar, você concorda com os <Link to="/termos-de-uso" style={{ color: T.muted }}>Termos de Uso</Link>. Avaliações falsas serão removidas.
                  </p>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
