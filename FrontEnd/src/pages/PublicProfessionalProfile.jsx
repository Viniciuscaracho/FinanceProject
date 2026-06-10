import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 640)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 640)
    window.addEventListener('resize', fn, { passive: true })
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}
import { Helmet } from 'react-helmet-async'
import { ArrowLeft, MapPin, Phone, Mail, Clock, Loader2, Calendar, MessageCircle, ChevronRight, Star, Instagram } from 'lucide-react'
import { apiService } from '../lib/api'

/* ─── Tokens ─────────────────────────────────── */
const T = {
  bg:     '#F9F8F5',
  white:  '#FFFFFF',
  brand:  '#5B52D9',
  dark:   '#1E2440',
  text:   '#111111',
  muted:  '#6B7280',
  border: '#E5E7EB',
  light:  '#F3F4F6',
  chip:   '#EEEDFB',
  green:  '#25D366',
}
const DISPLAY = { fontFamily: "'Space Grotesk', system-ui, sans-serif" }

/* ─── Helpers ─────────────────────────────────── */
function getInitials(name) {
  return (name || '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function formatPrice(cents) {
  if (!cents || cents === 0) return null
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

function formatDuration(min) {
  if (!min) return null
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60), m = min % 60
  return m ? `${h}h ${m}min` : `${h}h`
}

function openInstagram(url) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

function openWA(phone, name) {
  const digits = phone?.replace(/\D/g, '')
  if (!digits) return
  const number = digits.startsWith('55') ? digits : `55${digits}`
  const msg = `Olá ${name || ''}! Vi seu perfil no Orbi e gostaria de saber mais sobre seus serviços.`
  window.open(`https://wa.me/${number}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer')
}

/* ─── Componente Avatar ───────────────────────── */
function ProfilePhoto({ name, src, size = 112 }) {
  const [error, setError] = useState(false)
  const initials = getInitials(name)
  if (src && !error) {
    return (
      <img
        src={src} alt={name} onError={() => setError(true)}
        style={{ width: size, height: size, objectFit: 'cover', display: 'block' }}
      />
    )
  }
  return (
    <span style={{ fontSize: size * 0.35, fontWeight: 800, color: T.brand, ...DISPLAY }}>
      {initials}
    </span>
  )
}

/* ─── Schema.org JSON-LD ──────────────────────── */
function SchemaOrg({ professional }) {
  const name        = professional.name || ''
  const description = professional.description || ''
  const city        = professional.location?.city || ''
  const district    = professional.location?.district || ''
  const state       = professional.location?.state || ''
  const phone       = professional.phone || ''
  const email       = professional.email || ''
  const url         = typeof window !== 'undefined' ? window.location.href : ''
  const category    = professional.profession_category || ''

  const address = (city || state) ? {
    '@type': 'PostalAddress',
    addressLocality: city || undefined,
    addressRegion: state || undefined,
    streetAddress: district || undefined,
    addressCountry: 'BR',
  } : undefined

  const offers = professional.services?.length > 0
    ? professional.services.map(svc => ({
        '@type': 'Offer',
        name: svc.name,
        description: svc.description || undefined,
        price: svc.price_cents ? (svc.price_cents / 100).toFixed(2) : undefined,
        priceCurrency: svc.price_cents ? 'BRL' : undefined,
        seller: { '@type': 'Person', name },
      }))
    : undefined

  const sameAs = [
    professional.instagram_url,
  ].filter(Boolean)

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Person', 'LocalBusiness'],
        '@id': url,
        name,
        description: description || undefined,
        url,
        telephone: phone || undefined,
        email: email || undefined,
        image: professional.logo_url || undefined,
        jobTitle: category || undefined,
        knowsAbout: category || undefined,
        address,
        offers,
        sameAs: sameAs.length > 0 ? sameAs : undefined,
        priceRange: offers ? '$$' : undefined,
        areaServed: city ? { '@type': 'City', name: city } : undefined,
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/* ─── Página principal ────────────────────────── */
export function PublicProfessionalProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [professional, setProfessional] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [coverError, setCoverError] = useState(false)
  const [selectedSvc, setSelectedSvc] = useState(null)

  useEffect(() => { loadProfile() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadProfile = async () => {
    try {
      const data = await apiService.discoverProfile(id)
      setProfessional(data)
    } catch { setError(true) }
    finally { setLoading(false) }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', ...DISPLAY }}>
      <Loader2 size={28} style={{ color: T.brand, animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  if (error || !professional) return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', ...DISPLAY }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: T.text, margin: '0 0 8px' }}>Profissional não encontrado</p>
        <button onClick={() => navigate('/descobrir')} style={{ fontSize: 13, color: T.brand, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          ← Voltar ao Descobrir
        </button>
      </div>
    </div>
  )

  const city      = professional.location?.city || ''
  const district  = professional.location?.district || ''
  const state     = professional.location?.state || ''
  const location  = [district, city, state].filter(Boolean).join(', ')
  const category  = professional.profession_category || ''

  // SEO strings
  const seoTitle       = category && city
    ? `${professional.name} — ${category} em ${district || city}${state ? `, ${state}` : ''} | Orbi`
    : `${professional.name} | Orbi`
  const seoDescription = professional.description
    ? professional.description.slice(0, 155).replace(/\n/g, ' ')
    : `${category} em ${city}${state ? ` (${state})` : ''}. Agende online pelo Orbi.`
  const canonicalUrl = typeof window !== 'undefined' ? window.location.href : ''

  const hasCover = professional.cover_url && !coverError

  const hasAddress = !!professional.location?.address_line1

  return (
    <div style={{ minHeight: '100vh', background: T.bg, ...DISPLAY }}>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={professional.logo_url || 'https://orbinutri.com.br/og-image.png'} />
        <meta property="og:image:width" content={professional.logo_url ? '400' : '1200'} />
        <meta property="og:image:height" content={professional.logo_url ? '400' : '630'} />
        <meta property="og:locale" content="pt_BR" />
        <meta name="twitter:card" content={professional.logo_url ? 'summary' : 'summary_large_image'} />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content={professional.logo_url || 'https://orbinutri.com.br/og-image.png'} />
        {category && city && <meta name="keywords" content={`${category.toLowerCase()} em ${city}${district ? `, ${category.toLowerCase()} em ${district}` : ''}${state ? `, ${category.toLowerCase()} ${state}` : ''}, agendar ${category.toLowerCase()}`} />}
      </Helmet>
      <SchemaOrg professional={professional} />

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        .contact-chip:hover { opacity: .78; }
      `}</style>

      {/* ── Sticky nav ──────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(249,248,245,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => navigate('/descobrir')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', fontFamily: 'inherit', fontWeight: 500 }}
          >
            <ArrowLeft size={14} /> Descobrir
          </button>
          {professional.booking_token && (
            <button
              onClick={() => navigate(`/agendar/${professional.booking_token}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', background: T.brand, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <Calendar size={13} /> Agendar
            </button>
          )}
        </div>
      </header>

      {/* ── Hero cover ──────────────────────────── */}
      <div style={{ position: 'relative', height: isMobile ? 200 : 260, overflow: 'hidden', animation: 'fadeIn 500ms ease both' }}>
        {hasCover ? (
          <>
            <img src={professional.cover_url} alt="" onError={() => setCoverError(true)}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,12,30,0.7) 0%, rgba(10,12,30,0.15) 55%, transparent 100%)' }} />
          </>
        ) : (
          <>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(150deg, #0d1535 0%, #1a2660 40%, #3d50a0 75%, #5a6ec0 100%)' }} />
            {/* subtle grid overlay */}
            <div style={{ position: 'absolute', inset: 0, opacity: 0.07, backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 40px)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,12,30,0.6) 0%, transparent 60%)' }} />
          </>
        )}
      </div>

      {/* ── Identity block ──────────────────────── */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '0 16px' : '0 20px', animation: 'fadeUp 420ms ease both' }}>

        {/* Avatar + actions row */}
        <div style={{ marginTop: isMobile ? -44 : -56, marginBottom: 14, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
          <div style={{
            width: isMobile ? 88 : 112, height: isMobile ? 88 : 112,
            borderRadius: '50%', flexShrink: 0,
            border: `${isMobile ? 3 : 4}px solid #fff`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
            background: T.chip, overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ProfilePhoto name={professional.name} src={professional.logo_url} size={isMobile ? 88 : 112} />
          </div>

          {/* Ações — ícone+texto no desktop, só ícone no mobile */}
          <div style={{ display: 'flex', gap: 8, paddingBottom: 4, flexShrink: 0 }}>
            {professional.phone && (
              <button
                onClick={() => openWA(professional.phone, professional.name)}
                style={{
                  display: 'flex', alignItems: 'center', gap: isMobile ? 0 : 7,
                  padding: isMobile ? '9px 12px' : '9px 16px',
                  background: T.green, color: '#fff',
                  border: 'none', borderRadius: 10,
                  fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 2px 12px rgba(37,211,102,0.3)',
                  minHeight: 40, minWidth: isMobile ? 42 : 'auto',
                  justifyContent: 'center',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <MessageCircle size={16} />
                {!isMobile && <span style={{ marginLeft: 6 }}>WhatsApp</span>}
              </button>
            )}
            {professional.instagram_url && (
              <button
                onClick={() => openInstagram(professional.instagram_url)}
                style={{
                  display: 'flex', alignItems: 'center', gap: isMobile ? 0 : 6,
                  padding: isMobile ? '9px 12px' : '9px 16px',
                  background: '#E1306C18', color: '#E1306C',
                  border: '1.5px solid #E1306C30', borderRadius: 10,
                  fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  minHeight: 40, minWidth: isMobile ? 42 : 'auto',
                  justifyContent: 'center',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Instagram size={16} />
                {!isMobile && <span style={{ marginLeft: 5 }}>Instagram</span>}
              </button>
            )}
            {professional.booking_token && (
              <button
                onClick={() => navigate(`/agendar/${professional.booking_token}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: isMobile ? 0 : 6,
                  padding: isMobile ? '9px 12px' : '9px 16px',
                  background: T.brand + '16', color: T.brand,
                  border: `1.5px solid ${T.brand}30`, borderRadius: 10,
                  fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  minHeight: 40, minWidth: isMobile ? 42 : 'auto',
                  justifyContent: 'center',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Calendar size={16} />
                {!isMobile && <span style={{ marginLeft: 5 }}>Agendar</span>}
              </button>
            )}
          </div>
        </div>

        {/* Name */}
        <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: T.text, margin: '0 0 6px', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
          {professional.name}
        </h1>

        {/* Category + location */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          {category && (
            <span style={{ padding: '4px 12px', borderRadius: 20, background: T.chip, color: T.brand, fontSize: 12, fontWeight: 700, letterSpacing: '0.03em' }}>
              {category}
            </span>
          )}
          {location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: T.muted, fontWeight: 500 }}>
              <MapPin size={12} style={{ flexShrink: 0 }} /> {location}
            </span>
          )}
          {professional.services?.length > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.muted }}>
              · {professional.services.length} {professional.services.length === 1 ? 'serviço' : 'serviços'}
            </span>
          )}
        </div>

        {/* Specialties */}
        {professional.specialties?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {professional.specialties.map(sp => (
              <span key={sp} style={{
                fontSize: 11, fontWeight: 600, padding: '3px 10px',
                borderRadius: 20, background: '#F3F4F6', color: '#6B7280',
              }}>
                {sp}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {professional.description && (
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.75, margin: '0 0 4px', maxWidth: 580 }}>
            {professional.description}
          </p>
        )}
      </div>

      {/* ── Sections ────────────────────────────── */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '16px 16px 140px' : '24px 20px 140px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Serviços */}
        {professional.services?.length > 0 && (
          <section>
            <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted }}>
              ESCOLHA O SERVIÇO
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {professional.services.map((svc) => {
                const price    = formatPrice(svc.price_cents)
                const duration = formatDuration(svc.duration_minutes)
                const isSel    = selectedSvc?.id === svc.id
                return (
                  <div
                    key={svc.id}
                    onClick={() => setSelectedSvc(isSel ? null : svc)}
                    style={{
                      background: isSel ? T.chip : T.white,
                      border: `1.5px solid ${isSel ? T.brand : T.border}`,
                      borderRadius: 14,
                      padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
                      cursor: 'pointer',
                      transition: 'border-color 160ms, background 160ms, box-shadow 160ms',
                      boxShadow: isSel ? `0 0 0 3px ${T.brand}20` : 'none',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: isSel ? T.brand : T.text, margin: '0 0 3px', transition: 'color 160ms' }}>
                        {svc.name}
                      </p>
                      {svc.description && (
                        <p style={{ fontSize: 13, color: T.muted, margin: '0 0 8px', lineHeight: 1.55 }}>
                          {svc.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        {duration && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.muted, background: T.light, borderRadius: 6, padding: '2px 8px' }}>
                            <Clock size={11} /> {duration}
                          </span>
                        )}
                        {svc.modality && svc.modality !== 'presencial' && (
                          <span style={{ fontSize: 12, color: T.brand, background: T.chip, padding: '2px 8px', borderRadius: 6, fontWeight: 600, textTransform: 'capitalize' }}>
                            {svc.modality}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                      {price && (
                        <p style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}>
                          {price}
                        </p>
                      )}
                      {isSel && professional.booking_token && (
                        <button
                          onClick={e => { e.stopPropagation(); navigate(`/agendar/${professional.booking_token}`) }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            fontSize: 12, fontWeight: 700, color: '#fff',
                            background: T.brand, border: 'none',
                            borderRadius: 8, padding: '7px 14px',
                            cursor: 'pointer', fontFamily: 'inherit',
                            boxShadow: `0 2px 10px ${T.brand}40`,
                            animation: 'fadeUp 180ms ease both',
                          }}
                        >
                          Ver horários <ChevronRight size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Contato */}
        {(professional.phone || professional.email || professional.instagram_url) && (
          <section>
            <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted }}>
              Contato
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {professional.phone && (
                <a href={`tel:${professional.phone}`} className="contact-chip"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px', background: T.white,
                    border: `1px solid ${T.border}`, borderRadius: 12,
                    fontSize: 13, color: T.text, textDecoration: 'none',
                    fontFamily: 'inherit', transition: 'opacity 160ms',
                  }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Phone size={14} style={{ color: T.brand }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: T.muted, fontWeight: 500 }}>Telefone</p>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{professional.phone}</p>
                  </div>
                </a>
              )}
              {professional.email && (
                <a href={`mailto:${professional.email}`} className="contact-chip"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px', background: T.white,
                    border: `1px solid ${T.border}`, borderRadius: 12,
                    fontSize: 13, color: T.text, textDecoration: 'none',
                    fontFamily: 'inherit', transition: 'opacity 160ms',
                  }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail size={14} style={{ color: T.brand }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: T.muted, fontWeight: 500 }}>E-mail</p>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{professional.email}</p>
                  </div>
                </a>
              )}
              {professional.instagram_url && (
                <a href={professional.instagram_url} target="_blank" rel="noopener noreferrer" className="contact-chip"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px', background: T.white,
                    border: `1px solid ${T.border}`, borderRadius: 12,
                    fontSize: 13, color: T.text, textDecoration: 'none',
                    fontFamily: 'inherit', transition: 'opacity 160ms',
                  }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: '#FFF0F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Instagram size={14} style={{ color: '#E1306C' }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 11, color: T.muted, fontWeight: 500 }}>Instagram</p>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>
                      {professional.instagram_url.replace(/^https?:\/\/(www\.)?instagram\.com\/?/, '@').replace(/\/$/, '')}
                    </p>
                  </div>
                </a>
              )}
            </div>
          </section>
        )}

        {/* Endereço — só se tiver rua */}
        {hasAddress && (
          <section>
            <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted }}>
              Localização
            </p>
            <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <MapPin size={15} style={{ color: T.brand }} />
              </div>
              <div>
                <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: T.text }}>{professional.location.address_line1}</p>
                <p style={{ margin: 0, fontSize: 13, color: T.muted }}>{[district, city, state].filter(Boolean).join(' · ')}</p>
              </div>
            </div>
          </section>
        )}

        {/* Sem agendamento */}
        {!professional.booking_token && (
          <div style={{ padding: '20px', border: `1px solid ${T.border}`, borderRadius: 14, background: T.white, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>
              Este profissional ainda não habilitou o agendamento online.
            </p>
          </div>
        )}
      </div>

      {/* ── CTA fixo ────────────────────────────── */}
      {professional.booking_token && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
          background: 'rgba(249,248,245,0.97)', backdropFilter: 'blur(16px)',
          borderTop: `1px solid ${T.border}`,
          padding: isMobile ? '10px 16px' : '12px 20px',
          paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
        }}>
          <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', gap: 8 }}>
            {professional.phone && (
              <button
                onClick={() => openWA(professional.phone, professional.name)}
                style={{
                  flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: isMobile ? 0 : 7,
                  padding: isMobile ? '13px 14px' : '13px 18px',
                  background: '#25D36615', color: T.green,
                  border: `1.5px solid ${T.green}35`, borderRadius: 12,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  minHeight: 48, minWidth: isMobile ? 48 : 'auto',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <MessageCircle size={18} />
                {!isMobile && <span style={{ marginLeft: 6 }}>WhatsApp</span>}
              </button>
            )}
            <button
              onClick={() => navigate(`/agendar/${professional.booking_token}`)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                padding: '13px 12px',
                background: T.brand, color: '#fff',
                border: 'none', borderRadius: 12,
                fontSize: isMobile ? 13 : 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                letterSpacing: '-0.01em', boxShadow: `0 4px 16px ${T.brand}55`,
                transition: 'box-shadow 200ms',
                minHeight: 48,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <Calendar size={16} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedSvc ? `Agendar — ${selectedSvc.name}` : 'Agendar atendimento'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
