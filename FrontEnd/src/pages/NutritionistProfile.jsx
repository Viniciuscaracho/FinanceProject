import { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { MapPin, Star, Calendar, ChevronRight, Phone, Instagram, Clock, Check, Loader2, MessageSquare, PenLine } from 'lucide-react'
import { apiService } from '../lib/api'
import { profileIdFromSlug, CITIES, SPECIALTIES, nameToSlug } from '../lib/seoSlugs'

const T = {
  bg: '#f8f9fa', white: '#ffffff', brand: '#16a34a', brandLight: '#dcfce7',
  text: '#111827', muted: '#6b7280', border: '#e5e7eb', light: '#f3f4f6',
  star: '#f59e0b',
}

function formatPrice(cents) {
  if (!cents) return null
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

function formatDuration(min) {
  if (!min || min === 0) return null
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60), m = min % 60
  return m ? `${h}h ${m}min` : `${h}h`
}

export default function NutritionistProfile() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const id = profileIdFromSlug(slug)

  const [pro,      setPro]      = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [reviews,  setReviews]  = useState([])
  const [revTotal, setRevTotal] = useState(0)

  useEffect(() => {
    if (!id) { setError('Perfil não encontrado'); setLoading(false); return }
    setLoading(true)
    apiService.discoverProfile(slug)
      .then(data => {
        setPro(data)
        setLoading(false)
        return apiService.getReviews(data.id)
      })
      .then(r => { setReviews(r.reviews || []); setRevTotal(r.total || 0) })
      .catch(() => { setError('Profissional não encontrado'); setLoading(false) })
  }, [slug, id])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg }}>
      <Loader2 size={28} color={T.brand} style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  )

  if (error || !pro) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, background: T.bg }}>
      <p style={{ fontSize: 16, color: T.muted }}>{error || 'Perfil não encontrado'}</p>
      <Link to="/nutricionistas" style={{ color: T.brand, fontWeight: 600, textDecoration: 'none' }}>← Ver todos os nutricionistas</Link>
    </div>
  )

  const citySlug = CITIES.find(c => c.query === pro.location?.city)?.slug
  const cityLabel = pro.location?.city
  const districtLabel = pro.location?.district
  const districtSlug = districtLabel ? nameToSlug(districtLabel) : null

  const breadcrumbs = [
    { name: 'Início',          url: 'https://orbinutri.com.br/' },
    { name: 'Nutricionistas',  url: 'https://orbinutri.com.br/nutricionistas' },
    cityLabel && { name: cityLabel, url: `https://orbinutri.com.br/nutricionistas/${citySlug || nameToSlug(cityLabel)}` },
    { name: pro.name, url: `https://orbinutri.com.br/nutricionista/${slug}` },
  ].filter(Boolean)

  const schemaJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((b, i) => ({
          '@type': 'ListItem', position: i + 1, name: b.name, item: b.url,
        })),
      },
      {
        '@type': ['MedicalBusiness', 'LocalBusiness'],
        '@id': `https://orbinutri.com.br/nutricionista/${slug}`,
        name: pro.name,
        description: pro.description || undefined,
        image: pro.logo_url || undefined,
        url: `https://orbinutri.com.br/nutricionista/${slug}`,
        telephone: pro.phone || undefined,
        priceRange: pro.services?.length > 0 ? '$$' : undefined,
        address: pro.location?.city ? {
          '@type': 'PostalAddress',
          streetAddress: pro.location.address_line1 || undefined,
          addressLocality: pro.location.city,
          postalCode: pro.location.postcode || undefined,
          addressRegion: 'SP',
          addressCountry: 'BR',
        } : undefined,
        geo: pro.location?.latitude ? {
          '@type': 'GeoCoordinates',
          latitude: pro.location.latitude,
          longitude: pro.location.longitude,
        } : undefined,
        aggregateRating: pro.ratings_count > 0 ? {
          '@type': 'AggregateRating',
          ratingValue: pro.ratings_average,
          reviewCount: pro.ratings_count,
          bestRating: 5,
        } : undefined,
        hasOfferCatalog: pro.services?.length > 0 ? {
          '@type': 'OfferCatalog',
          name: 'Serviços',
          itemListElement: pro.services.map(s => ({
            '@type': 'Offer',
            name: s.name,
            price: s.price_cents ? (s.price_cents / 100).toFixed(2) : undefined,
            priceCurrency: 'BRL',
          })),
        } : undefined,
        sameAs: pro.instagram_url ? [pro.instagram_url] : undefined,
      },
    ],
  })

  const seoTitle = `${pro.name} — Nutricionista${cityLabel ? ` em ${cityLabel}` : ''} | OrbiNutri`
  const seoDesc = pro.description
    ? pro.description.slice(0, 160)
    : `${pro.name} é nutricionista${cityLabel ? ` em ${cityLabel}` : ''}. Agende sua consulta online pelo OrbiNutri.`

  const bookingToken = pro.booking_token

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDesc} />
        <link rel="canonical" href={`https://orbinutri.com.br/nutricionista/${slug}`} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDesc} />
        <meta property="og:image" content={`https://orbinutri.com.br/og/nutricionista/${slug}.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="profile" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={`https://orbinutri.com.br/og/nutricionista/${slug}.png`} />
        <script type="application/ld+json">{schemaJson}</script>
      </Helmet>

      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'system-ui, -apple-system, sans-serif' }}>

        {/* Breadcrumb */}
        <header style={{ background: T.white, borderBottom: `1px solid ${T.border}`, padding: '12px 20px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: T.muted }}>
            {breadcrumbs.map((b, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {i > 0 && <ChevronRight size={12} />}
                {i < breadcrumbs.length - 1
                  ? <Link to={new URL(b.url).pathname} style={{ color: T.muted, textDecoration: 'none' }}>{b.name}</Link>
                  : <span style={{ color: T.text, fontWeight: 600 }}>{b.name}</span>
                }
              </span>
            ))}
          </div>
        </header>

        <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 60px' }}>

          {/* Card topo */}
          <div style={{ background: T.white, borderRadius: 16, border: `1px solid ${T.border}`, overflow: 'hidden', marginBottom: 24 }}>
            {/* Cover */}
            {pro.logo_url && (
              <div style={{ height: 200, overflow: 'hidden', background: T.light }}>
                <img src={pro.logo_url} alt={pro.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}

            <div style={{ padding: '24px 28px', display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800, color: T.text }}>{pro.name}</h1>

                <p style={{ margin: '0 0 12px', fontSize: 14, color: T.muted }}>Nutricionista</p>

                {/* Avaliação */}
                {pro.ratings_count > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} size={14} fill={n <= Math.round(pro.ratings_average) ? T.star : T.light} color={n <= Math.round(pro.ratings_average) ? T.star : T.border} />
                    ))}
                    <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{pro.ratings_average?.toFixed(1)}</span>
                    <span style={{ fontSize: 13, color: T.muted }}>({pro.ratings_count} avaliações)</span>
                  </div>
                )}

                {/* CRN */}
                {pro.professional_registration && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, background: T.brandLight, marginBottom: 12 }}>
                    <Check size={12} color={T.brand} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.brand }}>{pro.professional_registration}</span>
                  </div>
                )}

                {/* Especialidades */}
                {pro.specialties?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                    {pro.specialties.map(s => (
                      <span key={s} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: T.light, color: T.text, fontWeight: 500, textTransform: 'capitalize' }}>{s}</span>
                    ))}
                  </div>
                )}

                {/* Localização */}
                {districtLabel && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: T.muted }}>
                    <MapPin size={13} color={T.muted} />
                    {districtSlug && citySlug
                      ? <Link to={`/nutricionistas/${citySlug}/${districtSlug}`} style={{ color: T.muted, textDecoration: 'none' }}>{districtLabel}{cityLabel ? `, ${cityLabel}` : ''}</Link>
                      : <span>{districtLabel}{cityLabel ? `, ${cityLabel}` : ''}</span>
                    }
                  </div>
                )}
              </div>

              {/* Botão agendar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 200 }}>
                {bookingToken ? (
                  <a
                    href={`/agendar/${bookingToken}`}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 20px', background: T.brand, color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 15 }}
                  >
                    <Calendar size={16} /> Agendar consulta
                  </a>
                ) : (
                  pro.phone && (
                    <a
                      href={`https://wa.me/55${pro.phone.replace(/\D/g, '')}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 20px', background: '#25D366', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 15 }}
                    >
                      <Phone size={16} /> WhatsApp
                    </a>
                  )
                )}
                {pro.instagram_url && (
                  <a
                    href={pro.instagram_url}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 20px', border: `1px solid ${T.border}`, borderRadius: 10, textDecoration: 'none', color: T.text, fontWeight: 500, fontSize: 14 }}
                  >
                    <Instagram size={15} /> Instagram
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Sobre */}
          {pro.description && (
            <section style={{ background: T.white, borderRadius: 14, border: `1px solid ${T.border}`, padding: '24px 28px', marginBottom: 20 }}>
              <h2 style={{ margin: '0 0 12px', fontSize: 17, fontWeight: 700, color: T.text }}>Sobre</h2>
              <p style={{ margin: 0, fontSize: 14, color: T.muted, lineHeight: 1.75 }}>{pro.description}</p>
            </section>
          )}

          {/* Serviços */}
          {pro.services?.length > 0 && (
            <section style={{ background: T.white, borderRadius: 14, border: `1px solid ${T.border}`, padding: '24px 28px', marginBottom: 20 }}>
              <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700, color: T.text }}>Serviços</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pro.services.map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: T.bg, borderRadius: 10 }}>
                    <div>
                      <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 600, color: T.text }}>{s.name}</p>
                      <div style={{ display: 'flex', gap: 10, fontSize: 12, color: T.muted }}>
                        {s.duration_minutes > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={11} /> {formatDuration(s.duration_minutes)}</span>
                        )}
                        <span style={{ textTransform: 'capitalize' }}>{s.modality}</span>
                      </div>
                    </div>
                    {s.price_cents > 0 && (
                      <span style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{formatPrice(s.price_cents)}</span>
                    )}
                  </div>
                ))}
              </div>

              {bookingToken && (
                <div style={{ marginTop: 20 }}>
                  <a
                    href={`/agendar/${bookingToken}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', background: T.brand, color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}
                  >
                    <Calendar size={15} /> Agendar consulta
                  </a>
                </div>
              )}
            </section>
          )}

          {/* Avaliações */}
          <section style={{ background: T.white, borderRadius: 14, border: `1px solid ${T.border}`, padding: '24px 28px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <MessageSquare size={18} color={T.brand} />
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: T.text }}>
                  Avaliações {revTotal > 0 && <span style={{ fontSize: 14, color: T.muted, fontWeight: 400 }}>({revTotal})</span>}
                </h2>
              </div>
              <Link
                to={`/avaliar/${pro.id}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: `1px solid ${T.brand}`, borderRadius: 8, color: T.brand, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
              >
                <PenLine size={13} /> Avaliar profissional
              </Link>
            </div>

            {reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ fontSize: 14, color: T.muted, margin: '0 0 16px' }}>Ainda sem avaliações. Seja o primeiro!</p>
                <Link
                  to={`/avaliar/${pro.id}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: T.brand, color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}
                >
                  <PenLine size={14} /> Deixar avaliação
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {reviews.map(r => (
                  <div key={r.id} style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: T.brandLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: T.brand }}>
                            {r.reviewer_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text }}>{r.reviewer_name}</p>
                          <p style={{ margin: 0, fontSize: 11, color: T.muted }}>
                            {new Date(r.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} size={13} fill={n <= r.rating ? T.star : T.light} color={n <= r.rating ? T.star : T.border} />
                        ))}
                      </div>
                    </div>
                    {r.comment && (
                      <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.7, paddingLeft: 40 }}>{r.comment}</p>
                    )}
                  </div>
                ))}
                {revTotal > reviews.length && (
                  <p style={{ margin: 0, fontSize: 13, color: T.muted, textAlign: 'center' }}>
                    +{revTotal - reviews.length} avaliações não exibidas
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Links internos — SEO */}
          <section style={{ marginTop: 36 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: '0 0 12px' }}>Nutricionistas relacionados</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {citySlug && (
                <Link to={`/nutricionistas/${citySlug}`} style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${T.border}`, background: T.white, color: T.text, textDecoration: 'none', fontSize: 13 }}>
                  Nutricionistas em {cityLabel}
                </Link>
              )}
              {citySlug && districtSlug && (
                <Link to={`/nutricionistas/${citySlug}/${districtSlug}`} style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${T.border}`, background: T.white, color: T.text, textDecoration: 'none', fontSize: 13 }}>
                  Nutricionistas em {districtLabel}
                </Link>
              )}
              {pro.specialties?.slice(0, 3).map(s => {
                const specSlug = SPECIALTIES.find(sp => sp.query === s || sp.label.toLowerCase() === s)?.slug
                if (!specSlug) return null
                return (
                  <Link key={s} to={citySlug ? `/nutricionistas/${citySlug}/${specSlug}` : `/nutricionistas/especialidade/${specSlug}`} style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${T.border}`, background: T.white, color: T.text, textDecoration: 'none', fontSize: 13, textTransform: 'capitalize' }}>
                    Nutricionistas de {s}
                  </Link>
                )
              })}
              <Link to="/nutricionistas" style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${T.border}`, background: T.white, color: T.text, textDecoration: 'none', fontSize: 13 }}>
                Ver todos os nutricionistas
              </Link>
            </div>
          </section>

        </main>
      </div>
    </>
  )
}
