import { useState, useEffect, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Star, Navigation, Loader2, ChevronRight, Calendar, AlertCircle } from 'lucide-react'
import { apiService } from '../lib/api'
import { profileSlug, SPECIALTIES } from '../lib/seoSlugs'

const T = {
  bg: '#f8f9fa', white: '#ffffff', brand: '#16a34a', brandLight: '#dcfce7',
  text: '#111827', muted: '#6b7280', border: '#e5e7eb', light: '#f3f4f6',
  star: '#f59e0b',
}

const RADIUS_KM = 15

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function boundsFromCenter(lat, lng, radiusKm) {
  const latDelta = radiusKm / 111
  const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180))
  return {
    sw_lat: lat - latDelta, ne_lat: lat + latDelta,
    sw_lng: lng - lngDelta, ne_lng: lng + lngDelta,
  }
}

function formatPrice(cents) {
  if (!cents) return null
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

function getInitials(name) {
  return (name || '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function DistanceBadge({ km }) {
  if (!km) return null
  const label = km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: 11, fontWeight: 600, color: T.brand,
      background: T.brandLight, padding: '2px 8px', borderRadius: 20,
    }}>
      <Navigation size={10} /> {label}
    </span>
  )
}

function ProCard({ pro, userLat, userLng }) {
  const navigate = useNavigate()
  const slug = profileSlug(pro.name, pro.id)
  const price = pro.services_preview?.[0]?.price_cents
  const dist = (userLat && userLng && pro.location?.latitude && pro.location?.longitude)
    ? haversineKm(userLat, userLng, pro.location.latitude, pro.location.longitude)
    : null

  return (
    <article
      onClick={() => navigate(`/nutricionista/${slug}`)}
      style={{
        background: T.white, borderRadius: 14, border: `1px solid ${T.border}`,
        cursor: 'pointer', display: 'flex', gap: 0, overflow: 'hidden',
        transition: 'box-shadow 0.15s, transform 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.09)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
    >
      {/* Foto */}
      <div style={{ width: 96, flexShrink: 0, background: T.light, position: 'relative' }}>
        {pro.logo_url
          ? <img src={pro.logo_url} alt={pro.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.brandLight }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: T.brand }}>{getInitials(pro.name)}</span>
            </div>
        }
      </div>

      <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text, lineHeight: 1.3 }}>{pro.name}</h3>
          <DistanceBadge km={dist} />
        </div>

        {pro.specialties?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {pro.specialties.slice(0, 2).map(s => (
              <span key={s} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 20, background: T.light, color: T.muted, fontWeight: 500, textTransform: 'capitalize' }}>{s}</span>
            ))}
          </div>
        )}

        {pro.ratings_count > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Star size={11} fill={T.star} color={T.star} />
            <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{pro.ratings_average?.toFixed(1)}</span>
            <span style={{ fontSize: 11, color: T.muted }}>({pro.ratings_count})</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
          {pro.location?.district && (
            <span style={{ fontSize: 12, color: T.muted, display: 'flex', alignItems: 'center', gap: 3 }}>
              <MapPin size={11} color={T.muted} /> {pro.location.district}
            </span>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
            {price && <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>a partir de {formatPrice(price)}</span>}
            <Link
              to={`/nutricionista/${slug}`}
              onClick={e => e.stopPropagation()}
              style={{ fontSize: 12, fontWeight: 600, color: T.white, background: T.brand, padding: '6px 12px', borderRadius: 7, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
            >
              <Calendar size={11} /> Ver perfil
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

function SkeletonCard() {
  return (
    <div style={{ background: T.white, borderRadius: 14, border: `1px solid ${T.border}`, display: 'flex', overflow: 'hidden', height: 110 }}>
      <div style={{ width: 96, background: T.light, animation: 'pulse 1.4s ease-in-out infinite' }} />
      <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ height: 14, width: '55%', borderRadius: 6, background: T.light, animation: 'pulse 1.4s ease-in-out infinite' }} />
        <div style={{ height: 11, width: '35%', borderRadius: 6, background: T.light, animation: 'pulse 1.4s ease-in-out infinite' }} />
        <div style={{ height: 28, width: '40%', borderRadius: 7, background: T.light, animation: 'pulse 1.4s ease-in-out infinite', marginTop: 'auto' }} />
      </div>
    </div>
  )
}

const FAQ = [
  {
    q: 'Como encontrar nutricionistas perto de mim?',
    a: 'Clique em "Usar minha localização", autorize o acesso e veja automaticamente os nutricionistas mais próximos de você, com distância em km exibida em cada perfil.',
  },
  {
    q: 'Os nutricionistas exibidos atendem presencialmente?',
    a: 'Sim. Os resultados priorizam profissionais com consultório próximo ao seu endereço. Muitos também oferecem atendimento online, exibido no perfil.',
  },
  {
    q: 'Qual o raio de busca utilizado?',
    a: `A busca cobre um raio de ${RADIUS_KM} km a partir da sua localização atual. Você pode ampliar buscando por cidade na página de diretório.`,
  },
  {
    q: 'Precisa criar conta para agendar?',
    a: 'Não. Você pode ver o perfil completo e acionar o agendamento online sem criar conta no OrbiNutri.',
  },
]

export default function NutritionistNearMe() {
  const [status,   setStatus]   = useState('idle') // idle | requesting | loading | ready | error | denied
  const [userLat,  setUserLat]  = useState(null)
  const [userLng,  setUserLng]  = useState(null)
  const [results,  setResults]  = useState([])
  const [total,    setTotal]    = useState(0)
  const [page,     setPage]     = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const fetchNearby = useCallback(async (lat, lng, pg, append) => {
    pg === 0 ? setStatus('loading') : setLoadingMore(true)
    try {
      const bounds = boundsFromCenter(lat, lng, RADIUS_KM)
      const data = await apiService.discoverSearch({ ...bounds, lat, lng, page: pg })
      setTotal(data.total || 0)
      setResults(prev => append ? [...prev, ...(data.results || [])] : (data.results || []))
      setStatus('ready')
    } catch {
      setStatus('error')
      setErrorMsg('Não foi possível carregar os resultados.')
    } finally {
      setLoadingMore(false)
    }
  }, [])

  function requestLocation() {
    if (!navigator.geolocation) {
      setStatus('error'); setErrorMsg('Seu navegador não suporta geolocalização.')
      return
    }
    setStatus('requesting')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLat(coords.latitude)
        setUserLng(coords.longitude)
        fetchNearby(coords.latitude, coords.longitude, 0, false)
      },
      (err) => {
        if (err.code === 1) setStatus('denied')
        else { setStatus('error'); setErrorMsg('Não foi possível obter sua localização.') }
      },
      { timeout: 10000, maximumAge: 60000 }
    )
  }

  function handleLoadMore() {
    const next = page + 1
    setPage(next)
    fetchNearby(userLat, userLng, next, true)
  }

  const schemaJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://orbinutri.com.br/' },
          { '@type': 'ListItem', position: 2, name: 'Nutricionistas', item: 'https://orbinutri.com.br/nutricionistas' },
          { '@type': 'ListItem', position: 3, name: 'Perto de mim', item: 'https://orbinutri.com.br/nutricionistas/perto-de-mim' },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ.map(f => ({
          '@type': 'Question', name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  })

  return (
    <>
      <Helmet>
        <title>Nutricionistas perto de mim | OrbiNutri</title>
        <meta name="description" content="Encontre nutricionistas perto de você agora. Veja perfis verificados com avaliações, especialidades e agendamento online no OrbiNutri." />
        <link rel="canonical" href="https://orbinutri.com.br/nutricionistas/perto-de-mim" />
        <meta property="og:title" content="Nutricionistas perto de mim | OrbiNutri" />
        <meta property="og:description" content="Encontre nutricionistas próximos à sua localização com agendamento online." />
        <script type="application/ld+json">{schemaJson}</script>
      </Helmet>

      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'system-ui, -apple-system, sans-serif' }}>

        {/* Breadcrumb */}
        <header style={{ background: T.white, borderBottom: `1px solid ${T.border}`, padding: '12px 20px' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: T.muted }}>
            <Link to="/nutricionistas" style={{ color: T.muted, textDecoration: 'none' }}>Nutricionistas</Link>
            <ChevronRight size={12} />
            <span style={{ color: T.text, fontWeight: 600 }}>Perto de mim</span>
          </div>
        </header>

        <main style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px 60px' }}>

          {/* Hero */}
          <section style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: T.text, margin: '0 0 10px', lineHeight: 1.2 }}>
              Nutricionistas perto de mim
            </h1>
            <p style={{ fontSize: 15, color: T.muted, margin: 0, lineHeight: 1.6, maxWidth: 560 }}>
              Encontre nutricionistas próximos à sua localização com perfis verificados e agendamento online.
            </p>
          </section>

          {/* Estado: idle */}
          {status === 'idle' && (
            <div style={{ background: T.white, borderRadius: 16, border: `1px solid ${T.border}`, padding: '48px 32px', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: T.brandLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Navigation size={28} color={T.brand} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: '0 0 8px' }}>
                Autorize o acesso à localização
              </h2>
              <p style={{ fontSize: 14, color: T.muted, margin: '0 0 24px', lineHeight: 1.6 }}>
                Para mostrar nutricionistas próximos a você, precisamos saber onde você está. Seus dados não são armazenados.
              </p>
              <button
                onClick={requestLocation}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 28px', background: T.brand, color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <Navigation size={16} /> Usar minha localização
              </button>
              <p style={{ fontSize: 12, color: T.muted, marginTop: 16 }}>
                Raio de busca: {RADIUS_KM} km
              </p>
            </div>
          )}

          {/* Estado: requesting */}
          {status === 'requesting' && (
            <div style={{ background: T.white, borderRadius: 16, border: `1px solid ${T.border}`, padding: '48px 32px', textAlign: 'center' }}>
              <Loader2 size={32} color={T.brand} style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
              <p style={{ fontSize: 14, color: T.muted, margin: 0 }}>Obtendo sua localização…</p>
            </div>
          )}

          {/* Estado: denied */}
          {status === 'denied' && (
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 14, padding: '24px 28px' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <AlertCircle size={20} color='#ea580c' style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600, color: '#9a3412' }}>Permissão de localização negada</p>
                  <p style={{ margin: '0 0 16px', fontSize: 13, color: '#c2410c', lineHeight: 1.6 }}>
                    Para usar esta funcionalidade, permita o acesso à localização nas configurações do navegador e recarregue a página.
                  </p>
                  <Link to="/nutricionistas" style={{ fontSize: 13, fontWeight: 600, color: T.brand, textDecoration: 'none' }}>
                    ← Ver todos os nutricionistas
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Estado: error */}
          {status === 'error' && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, padding: '20px 24px' }}>
              <p style={{ margin: '0 0 12px', fontSize: 14, color: '#991b1b' }}>{errorMsg}</p>
              <button onClick={requestLocation} style={{ fontSize: 13, fontWeight: 600, color: T.brand, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Tentar novamente
              </button>
            </div>
          )}

          {/* Estado: loading */}
          {status === 'loading' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Estado: ready */}
          {status === 'ready' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <p style={{ margin: 0, fontSize: 13, color: T.muted }}>
                  <span style={{ fontWeight: 700, color: T.text }}>{total}</span> nutricionista{total !== 1 ? 's' : ''} encontrada{total !== 1 ? 's' : ''} em até {RADIUS_KM} km
                </p>
                <button
                  onClick={requestLocation}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.brand, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                >
                  <Navigation size={12} /> Atualizar localização
                </button>
              </div>

              {results.length === 0 ? (
                <div style={{ background: T.white, borderRadius: 14, border: `1px solid ${T.border}`, padding: '48px 32px', textAlign: 'center' }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: T.text, margin: '0 0 8px' }}>Nenhum nutricionista encontrado neste raio</p>
                  <p style={{ fontSize: 13, color: T.muted, margin: '0 0 20px' }}>Tente buscar por cidade para ampliar os resultados.</p>
                  <Link to="/nutricionistas/sao-paulo" style={{ padding: '10px 20px', background: T.brand, color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                    Nutricionistas em São Paulo
                  </Link>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {results.map(pro => <ProCard key={pro.id} pro={pro} userLat={userLat} userLng={userLng} />)}
                  </div>

                  {results.length < total && (
                    <div style={{ textAlign: 'center', marginTop: 24 }}>
                      <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        style={{ padding: '11px 28px', border: `1px solid ${T.border}`, borderRadius: 8, background: T.white, color: T.text, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                      >
                        {loadingMore ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Carregando…</> : `Ver mais ${total - results.length}`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Links internos */}
          <section style={{ marginTop: 48 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: '0 0 12px' }}>Buscar por especialidade</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SPECIALTIES.slice(0, 7).map(s => (
                <Link
                  key={s.slug}
                  to={`/nutricionistas/especialidade/${s.slug}`}
                  style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${T.border}`, background: T.white, color: T.text, textDecoration: 'none', fontSize: 13 }}
                >
                  {s.label}
                </Link>
              ))}
              <Link to="/nutricionistas" style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${T.border}`, background: T.white, color: T.text, textDecoration: 'none', fontSize: 13 }}>
                Ver todos →
              </Link>
            </div>
          </section>

          {/* FAQ */}
          <section style={{ marginTop: 40 }} itemScope itemType="https://schema.org/FAQPage">
            <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: '0 0 16px' }}>Perguntas frequentes</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FAQ.map((f, i) => (
                <details
                  key={i}
                  itemScope itemProp="mainEntity" itemType="https://schema.org/Question"
                  style={{ background: T.white, borderRadius: 10, border: `1px solid ${T.border}`, padding: '14px 18px' }}
                >
                  <summary itemProp="name" style={{ fontWeight: 600, fontSize: 14, color: T.text, cursor: 'pointer', listStyle: 'none' }}>
                    {f.q}
                  </summary>
                  <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                    <p itemProp="text" style={{ margin: '10px 0 0', fontSize: 13, color: T.muted, lineHeight: 1.7 }}>{f.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>

        </main>
      </div>
    </>
  )
}
