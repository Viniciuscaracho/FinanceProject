import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, MapPin, Loader2, Navigation, Minus, Plus, Map, LayoutGrid, ArrowLeft, Clock } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { apiService } from '../lib/api'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const T = {
  bg:     '#F9F8F5',
  white:  '#FFFFFF',
  brand:  '#5B52D9',
  text:   '#111111',
  muted:  '#6B7280',
  border: '#E5E7EB',
  light:  '#F3F4F6',
  chip:   '#EEEDFB',
  green:  '#16a34a',
}
const DISPLAY = { fontFamily: "'Space Grotesk', system-ui, sans-serif" }

const SPECIALTY_CHIPS = [
  { label: 'Todas',           value: '' },
  { label: 'Emagrecimento',   value: 'emagrecimento' },
  { label: 'Esportiva',       value: 'esportiva' },
  { label: 'Saúde feminina',  value: 'saúde feminina' },
  { label: 'Gestação',        value: 'gestação' },
  { label: 'Infantil',        value: 'infantil' },
  { label: 'Online',          value: 'online' },
  { label: 'Vegetariana',     value: 'vegetariana' },
]

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 640)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 640)
    window.addEventListener('resize', fn, { passive: true })
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

function getInitials(name) {
  return (name || '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}
function formatPrice(cents) {
  if (!cents) return null
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}
function formatDuration(min) {
  if (!min) return null
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60), m = min % 60
  return m ? `${h}h ${m}min` : `${h}h`
}

/* ─── Skeleton ─────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ background: T.white, borderRadius: 14, overflow: 'hidden', border: `1px solid ${T.border}` }}>
      <div style={{ height: 180, background: T.light, animation: 'pulse 1.4s ease-in-out infinite' }} />
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ height: 16, width: '65%', borderRadius: 6, background: T.light, marginBottom: 10, animation: 'pulse 1.4s ease-in-out infinite' }} />
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          <div style={{ height: 20, width: 90, borderRadius: 6, background: T.light, animation: 'pulse 1.4s ease-in-out infinite' }} />
          <div style={{ height: 20, width: 70, borderRadius: 6, background: T.light, animation: 'pulse 1.4s ease-in-out infinite' }} />
        </div>
        <div style={{ height: 13, width: '45%', borderRadius: 6, background: T.light, marginBottom: 18, animation: 'pulse 1.4s ease-in-out infinite' }} />
        <div style={{ height: 36, borderRadius: 8, background: T.light, animation: 'pulse 1.4s ease-in-out infinite' }} />
      </div>
    </div>
  )
}

/* ─── Card da lista ─────────────────────────────── */
function RichCard({ professional, highlighted, onClick, onHover }) {
  const location = [professional.location?.district, professional.location?.city].filter(Boolean).join(', ')
  const tags = (professional.services_preview || []).slice(0, 3).map(s => s.name)
  const minPrice = (professional.services_preview || []).reduce(
    (min, s) => (s.price_cents && s.price_cents < min ? s.price_cents : min), Infinity
  )

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onHover?.(professional.id)}
      onMouseLeave={() => onHover?.(null)}
      style={{
        background: T.white,
        border: `1.5px solid ${highlighted ? T.brand : T.border}`,
        borderRadius: 14, cursor: 'pointer', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        transition: 'border-color 140ms, box-shadow 140ms, transform 120ms',
        boxShadow: highlighted ? '0 8px 28px rgba(91,82,217,0.15)' : '0 1px 4px rgba(0,0,0,0.04)',
        transform: highlighted ? 'translateY(-2px)' : 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div style={{ position: 'relative', height: 180, background: T.chip, flexShrink: 0, overflow: 'hidden' }}>
        {professional.logo_url ? (
          <img
            src={professional.logo_url} alt={professional.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #d8d5f8 0%, #c0bbf2 100%)',
          }}>
            <span style={{ fontSize: 56, fontWeight: 800, color: T.brand, opacity: 0.4, ...DISPLAY }}>
              {getInitials(professional.name)}
            </span>
          </div>
        )}
        <span style={{
          position: 'absolute', bottom: 10, left: 10,
          background: 'rgba(14,14,14,0.68)', backdropFilter: 'blur(6px)',
          color: '#fff', fontSize: 10, fontWeight: 600,
          padding: '3px 9px', borderRadius: 6, letterSpacing: '0.02em',
        }}>
          Nutricionista
        </span>
      </div>

      <div style={{ padding: '14px 16px 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <p style={{ margin: '0 0 9px', fontSize: 15, fontWeight: 700, color: T.text, lineHeight: 1.3, ...DISPLAY }}>
          {professional.name}
        </p>
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
            {tags.map((t, i) => (
              <span key={i} style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 5, background: T.light, color: T.muted }}>
                {t}
              </span>
            ))}
          </div>
        )}
        {location && (
          <p style={{ margin: 0, fontSize: 11, color: T.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={10} style={{ flexShrink: 0, color: T.brand }} />{location}
          </p>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ borderTop: `1px solid ${T.border}`, padding: '12px 0 14px', marginTop: 12 }}>
          {minPrice < Infinity && (
            <p style={{ margin: '0 0 9px', fontSize: 11, color: T.muted }}>
              A partir de{' '}
              <span style={{ fontWeight: 700, color: T.text, fontSize: 13 }}>{formatPrice(minPrice)}</span>
            </p>
          )}
          <button
            onClick={e => { e.stopPropagation(); onClick() }}
            style={{
              width: '100%', padding: '10px',
              background: highlighted ? T.brand : T.text,
              color: '#fff', border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'background 140ms',
              minHeight: 40,
            }}
          >
            Agendar consulta →
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Card compacto (mapa) ──────────────────────── */
function CompactCard({ professional, highlighted, onClick, onHover }) {
  const location = [professional.location?.district, professional.location?.city].filter(Boolean).join(' · ')
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onHover?.(professional.id)}
      onMouseLeave={() => onHover?.(null)}
      style={{
        display: 'flex', gap: 12, padding: '12px 14px',
        background: highlighted ? T.chip : T.white,
        border: `1px solid ${highlighted ? T.brand : T.border}`,
        borderRadius: 10, cursor: 'pointer',
        transition: 'border-color 140ms, background 140ms',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div style={{ width: 46, height: 46, borderRadius: 10, flexShrink: 0, overflow: 'hidden', background: T.chip }}>
        {professional.logo_url ? (
          <img src={professional.logo_url} alt={professional.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #d8d5f8, #c0bbf2)' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: T.brand, ...DISPLAY }}>{getInitials(professional.name)}</span>
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...DISPLAY }}>
          {professional.name}
        </p>
        {location && (
          <p style={{ margin: 0, fontSize: 11, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 3 }}>
            <MapPin size={9} style={{ flexShrink: 0 }} />{location}
          </p>
        )}
      </div>
    </div>
  )
}

/* ─── Painel deslizante ─────────────────────────── */
function ProfessionalPanel({ open, professionalId, previewData, onClose, navigate }) {
  const [profile,     setProfile]     = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [selectedSvc, setSelectedSvc] = useState(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (!open || !professionalId) return
    setProfile(null); setSelectedSvc(null); setLoading(true)
    apiService.discoverProfile(professionalId)
      .then(setProfile).catch(() => {}).finally(() => setLoading(false))
  }, [open, professionalId])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleBook = () => {
    if (profile?.booking_token) navigate(`/agendar/${profile.booking_token}`)
  }

  const name = profile?.name   || previewData?.name   || ''
  const logo = profile?.logo_url || previewData?.logo_url || null
  const city = profile?.location?.city || previewData?.location?.city || ''

  const ctaLabel = selectedSvc
    ? `Ver horários — ${selectedSvc.name}`
    : 'Selecione um serviço para continuar'

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(3px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'all' : 'none',
          transition: 'opacity 280ms',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 101,
        width: 'min(460px, 100vw)',
        background: T.white,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 320ms cubic-bezier(0.32,0,0.16,1)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-16px 0 60px rgba(0,0,0,0.15)',
        overflow: 'hidden',
        ...DISPLAY,
      }}>
        {/* Header roxo — safe area top */}
        <div style={{
          background: 'linear-gradient(145deg, #3a43a0 0%, #5b52d9 100%)',
          flexShrink: 0,
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}>
          {/* Nav bar — toque maior */}
          <div style={{ padding: isMobile ? '4px 16px 0' : '8px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                color: 'rgba(255,255,255,0.75)', background: 'none', border: 'none',
                fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
                padding: '10px 0', minHeight: 44,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <ArrowLeft size={16} /> Voltar
            </button>
            {city && (
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={10} />{city}
              </span>
            )}
          </div>

          {/* Identidade */}
          <div style={{ padding: isMobile ? '12px 16px 20px' : '14px 20px 22px', display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{
              width: isMobile ? 60 : 72, height: isMobile ? 60 : 72,
              borderRadius: 16, flexShrink: 0, overflow: 'hidden',
              border: '3px solid rgba(255,255,255,0.25)',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {logo ? (
                <img src={logo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : name ? (
                <span style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: '#fff' }}>{getInitials(name)}</span>
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.1)', animation: 'pulse 1.4s ease-in-out infinite' }} />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {loading && !name ? (
                <div style={{ height: 22, width: 160, background: 'rgba(255,255,255,0.2)', borderRadius: 6, marginBottom: 8, animation: 'pulse 1.4s ease-in-out infinite' }} />
              ) : (
                <h2 style={{
                  margin: '0 0 6px',
                  fontSize: isMobile ? 18 : 20,
                  fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {name}
                </h2>
              )}
              <span style={{
                display: 'inline-block', padding: '3px 10px',
                background: 'rgba(255,255,255,0.18)', borderRadius: 20,
                color: '#fff', fontSize: 11, fontWeight: 600, letterSpacing: '0.02em',
              }}>
                Nutricionista
              </span>
            </div>
          </div>
        </div>

        {/* Corpo scrollável */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? '20px 16px 120px' : '24px 20px 120px' }}>
          <p style={{ margin: '0 0 12px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.muted }}>
            ESCOLHA O SERVIÇO
          </p>

          {loading ? (
            [1, 2, 3].map(i => (
              <div key={i} style={{ height: 70, background: T.light, borderRadius: 10, marginBottom: 8, animation: 'pulse 1.4s ease-in-out infinite' }} />
            ))
          ) : profile?.services?.length > 0 ? (
            profile.services.map(svc => {
              const isSel    = selectedSvc?.id === svc.id
              const price    = formatPrice(svc.price_cents)
              const duration = formatDuration(svc.duration_minutes)
              return (
                <div
                  key={svc.id}
                  onClick={() => setSelectedSvc(isSel ? null : svc)}
                  style={{
                    border: `1.5px solid ${isSel ? T.brand : T.border}`,
                    background: isSel ? T.chip : T.white,
                    borderRadius: 10, padding: '14px 16px', marginBottom: 8,
                    cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: 'border-color 150ms, background 150ms',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: isSel ? T.brand : T.text, transition: 'color 150ms' }}>
                      {svc.name}
                    </p>
                    {svc.description && (
                      <p style={{ margin: '3px 0 0', fontSize: 12, color: T.muted, lineHeight: 1.4 }}>
                        {svc.description.slice(0, 80)}{svc.description.length > 80 ? '…' : ''}
                      </p>
                    )}
                    {duration && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 5, fontSize: 11, color: T.muted, background: T.light, padding: '2px 7px', borderRadius: 5 }}>
                        <Clock size={10} />{duration}
                      </span>
                    )}
                  </div>
                  {price && (
                    <p style={{ margin: '0 0 0 12px', fontSize: 15, fontWeight: 800, color: T.text, flexShrink: 0 }}>
                      {price}
                    </p>
                  )}
                </div>
              )
            })
          ) : !loading ? (
            <p style={{ fontSize: 13, color: T.muted, padding: '12px 0' }}>Nenhum serviço cadastrado</p>
          ) : null}

          {!loading && profile?.description && (
            <div style={{ marginTop: 20 }}>
              <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.muted }}>
                SOBRE
              </p>
              <p style={{ margin: 0, fontSize: 13, color: '#555', lineHeight: 1.75 }}>
                {profile.description}
              </p>
            </div>
          )}

          {!loading && profile && (
            <button
              onClick={() => { onClose(); navigate(`/descobrir/${profile.id}`) }}
              style={{
                display: 'block', width: '100%', marginTop: 20, padding: '12px',
                border: `1px solid ${T.border}`, borderRadius: 10,
                background: T.white, color: T.muted, fontSize: 13, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
                minHeight: 44, boxSizing: 'border-box',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              Ver perfil completo →
            </button>
          )}
        </div>

        {/* CTA fixo — safe area bottom */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(10px)',
          borderTop: `1px solid ${T.border}`,
          padding: isMobile ? '12px 16px' : '14px 20px',
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        }}>
          <button
            onClick={handleBook}
            disabled={!selectedSvc || !profile?.booking_token}
            style={{
              width: '100%',
              padding: isMobile ? '15px 16px' : '14px 20px',
              background: selectedSvc && profile?.booking_token ? T.brand : T.light,
              color: selectedSvc && profile?.booking_token ? '#fff' : T.muted,
              border: 'none', borderRadius: 12,
              fontSize: 14, fontWeight: 700,
              cursor: selectedSvc && profile?.booking_token ? 'pointer' : 'default',
              fontFamily: 'inherit', letterSpacing: '-0.01em',
              transition: 'background 220ms, color 220ms, box-shadow 220ms',
              boxShadow: selectedSvc && profile?.booking_token ? `0 4px 20px rgba(91,82,217,0.35)` : 'none',
              /* evita que texto longo quebre o layout */
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              boxSizing: 'border-box',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </>
  )
}

/* ─── Mapa (desktop only) ───────────────────────── */
const SAO_PAULO = [-23.5505, -46.6333]

function DiscoverMap({ results, onSearch, highlightedId, onHoverPin, onCardClick }) {
  const mapRef      = useRef(null)
  const mapObj      = useRef(null)
  const circleRef   = useRef(null)
  const centerRef   = useRef(null)
  const markersRef  = useRef({})
  const debounceRef = useRef(null)

  const [center,     setCenter]     = useState(SAO_PAULO)
  const [radius,     setRadius]     = useState(10)
  const [searching,  setSearching]  = useState(false)
  const [geoLoading, setGeoLoading] = useState(false)

  const doSearch = useCallback(async (lat, lng, r) => {
    setSearching(true)
    try { await onSearch(lat, lng, r) }
    finally { setSearching(false) }
  }, [onSearch])

  const schedule = useCallback((lat, lng, r) => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(lat, lng, r), 700)
  }, [doSearch])

  useEffect(() => {
    if (mapObj.current) return
    const map = L.map(mapRef.current, { center: SAO_PAULO, zoom: 11, zoomControl: false })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors', maxZoom: 19,
    }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    mapObj.current = map

    const crossIcon = L.divIcon({
      html: `<div style="width:30px;height:30px;border-radius:50%;border:3px solid #5B52D9;background:rgba(91,82,217,0.15);display:flex;align-items:center;justify-content:center;">
               <div style="width:9px;height:9px;border-radius:50%;background:#5B52D9;"></div>
             </div>`,
      className: '', iconAnchor: [15, 15],
    })
    const marker = L.marker(SAO_PAULO, { icon: crossIcon, draggable: true }).addTo(map)
    centerRef.current = marker

    const circle = L.circle(SAO_PAULO, {
      radius: 10000, color: '#5B52D9', fillColor: '#5B52D9',
      fillOpacity: 0.06, weight: 2, dashArray: '5 4',
    }).addTo(map)
    circleRef.current = circle

    marker.on('drag', () => { circle.setLatLng(marker.getLatLng()) })
    marker.on('dragend', () => {
      const { lat, lng } = marker.getLatLng()
      setCenter([lat, lng]); schedule(lat, lng, radius)
    })
    map.on('click', (e) => {
      const { lat, lng } = e.latlng
      marker.setLatLng([lat, lng]); circle.setLatLng([lat, lng])
      map.panTo([lat, lng], { animate: true, duration: 0.3 })
      setCenter([lat, lng]); schedule(lat, lng, radius)
    })
    return () => { clearTimeout(debounceRef.current); map.remove(); mapObj.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { circleRef.current?.setRadius(radius * 1000) }, [radius])
  useEffect(() => {
    circleRef.current?.setLatLng(center)
    centerRef.current?.setLatLng(center)
  }, [center])

  useEffect(() => {
    if (!mapObj.current) return
    Object.values(markersRef.current).forEach(m => m.remove())
    markersRef.current = {}
    results.forEach(pro => {
      const lat = pro.location?.latitude; const lng = pro.location?.longitude
      if (!lat || !lng) return
      const hl = pro.id === highlightedId
      const icon = L.divIcon({
        html: `<div style="background:${hl ? '#111' : '#5B52D9'};color:#fff;border-radius:20px;padding:4px 10px;font-size:11px;font-weight:700;font-family:'Space Grotesk',system-ui,sans-serif;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.25);border:2px solid #fff;">${pro.name.split(' ')[0]}</div>`,
        className: '', iconAnchor: [0, 0],
      })
      const logoHtml = pro.logo_url
        ? `<img src="${pro.logo_url}" style="width:38px;height:38px;border-radius:7px;object-fit:cover;flex-shrink:0;">`
        : `<div style="width:38px;height:38px;border-radius:7px;background:#EEEDFB;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:#5B52D9;flex-shrink:0;">${getInitials(pro.name)}</div>`
      const popup = `<div style="font-family:'Space Grotesk',system-ui,sans-serif;min-width:190px;padding:2px 0">
        <div style="display:flex;gap:10px;align-items:center;margin-bottom:8px">${logoHtml}
          <div><p style="margin:0;font-size:13px;font-weight:700;color:#111">${pro.name}</p>
          <span style="font-size:10px;font-weight:600;color:#5B52D9;background:#EEEDFB;border-radius:4px;padding:1px 6px">Nutricionista</span></div></div>
        ${pro.location?.city ? `<p style="margin:0 0 8px;font-size:11px;color:#6B7280">📍 ${[pro.location.district, pro.location.city].filter(Boolean).join(', ')}</p>` : ''}
        <a href="/descobrir/${pro.id}" style="display:block;text-align:center;background:#5B52D9;color:#fff;border-radius:6px;padding:6px 12px;font-size:12px;font-weight:600;text-decoration:none">Ver perfil →</a>
      </div>`
      const m = L.marker([lat, lng], { icon }).addTo(mapObj.current).bindPopup(popup, { maxWidth: 230, className: 'orbi-popup' })
      m.on('mouseover', () => onHoverPin(pro.id))
      m.on('mouseout',  () => onHoverPin(null))
      markersRef.current[pro.id] = m
    })
  }, [results, highlightedId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleGeo = () => {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords
        setCenter([lat, lng])
        mapObj.current?.flyTo([lat, lng], 13, { animate: true, duration: 1 })
        setGeoLoading(false); doSearch(lat, lng, radius)
      },
      () => setGeoLoading(false), { timeout: 8000 }
    )
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Sidebar — só existe em telas ≥ 640px */}
      <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${T.border}`, background: T.bg }}>
        <div style={{ padding: '12px 14px', borderBottom: `1px solid ${T.border}` }}>
          <button onClick={handleGeo} disabled={geoLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 7, border: `1px solid ${T.border}`, background: T.white, color: T.brand, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', width: '100%', justifyContent: 'center', minHeight: 40 }}>
            {geoLoading ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Navigation size={12} />}
            Minha localização
          </button>
        </div>
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: T.muted, flexShrink: 0 }}>Raio</span>
          <input type="range" min="1" max="100" step="1" value={radius} onChange={e => setRadius(Number(e.target.value))} style={{ flex: 1, accentColor: T.brand }} />
          <button onClick={() => setRadius(r => Math.max(1, r - 5))} style={{ width: 26, height: 26, borderRadius: 5, border: `1px solid ${T.border}`, background: T.white, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Minus size={10} /></button>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.brand, minWidth: 38, textAlign: 'center' }}>{radius} km</span>
          <button onClick={() => setRadius(r => Math.min(100, r + 5))} style={{ width: 26, height: 26, borderRadius: 5, border: `1px solid ${T.border}`, background: T.white, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Plus size={10} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {searching ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ height: 70, background: T.white, borderRadius: 10, border: `1px solid ${T.border}`, animation: 'pulse 1.4s ease-in-out infinite' }} />
            ))
          ) : results.length === 0 ? (
            <p style={{ textAlign: 'center', paddingTop: 40, fontSize: 13, color: T.muted }}>
              Clique no mapa para buscar nutricionistas na região
            </p>
          ) : (
            results.filter(r => r.location?.latitude).map(pro => (
              <CompactCard key={pro.id} professional={pro} highlighted={highlightedId === pro.id} onHover={onHoverPin} onClick={() => onCardClick(pro)} />
            ))
          )}
        </div>
      </div>

      {/* Mapa */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        {searching && (
          <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', zIndex: 900, background: T.white, borderRadius: 8, padding: '7px 14px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: T.brand }}>
            <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Buscando…
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)', background: 'rgba(14,14,14,0.7)', backdropFilter: 'blur(5px)', color: '#fff', borderRadius: 7, padding: '5px 11px', fontSize: 10, fontWeight: 500, zIndex: 900, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
          Clique no mapa para buscar na região
        </div>
      </div>

      <style>{`
        .orbi-popup .leaflet-popup-content-wrapper { border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); padding: 0; }
        .orbi-popup .leaflet-popup-content { margin: 12px 14px; }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}

/* ─── Página principal ──────────────────────────── */
export function PublicDiscover() {
  const navigate    = useNavigate()
  const isMobile    = useIsMobile()
  const [searchParams, setSearchParams] = useSearchParams()

  const [viewMode,     setViewMode]     = useState('list')
  const [searchQ,      setSearchQ]      = useState(searchParams.get('q') || '')
  const [searchCity,   setSearchCity]   = useState(searchParams.get('city') || '')
  const [activeChip,   setActiveChip]   = useState('')
  const [results,      setResults]      = useState([])
  const [total,        setTotal]        = useState(0)
  const [page,         setPage]         = useState(0)
  const [loading,      setLoading]      = useState(true)
  const [loadingMore,  setLoadingMore]  = useState(false)
  const [hoveredId,    setHoveredId]    = useState(null)

  const [panelOpen,    setPanelOpen]    = useState(false)
  const [panelId,      setPanelId]      = useState(null)
  const [panelPreview, setPanelPreview] = useState(null)

  /* em mobile não há modo mapa — volta para lista se a tela encolher */
  useEffect(() => {
    if (isMobile && viewMode === 'map') setViewMode('list')
  }, [isMobile, viewMode])

  const openPanel = (professional) => {
    setPanelId(professional.id)
    setPanelPreview(professional)
    setPanelOpen(true)
  }
  const closePanel = () => setPanelOpen(false)

  const buildQ = (q, chip) => [q, chip].filter(Boolean).join(' ')

  const fetchPage = useCallback(async (q, chip, city, pg, append, mapParams = {}) => {
    if (append) setLoadingMore(true)
    else setLoading(true)
    try {
      const data = await apiService.discoverSearch({ q: buildQ(q, chip), city, category: 'Nutricionista', page: pg, ...mapParams })
      if (append) {
        setResults(prev => [...prev, ...(data.results || [])])
      } else {
        setResults(data.results || [])
        setTotal(data.total || 0)
      }
    } catch { /* empty */ }
    finally { setLoading(false); setLoadingMore(false) }
  }, [])

  useEffect(() => {
    fetchPage(searchQ, activeChip, searchCity, 0, false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => {
    e?.preventDefault()
    setPage(0)
    fetchPage(searchQ, activeChip, searchCity, 0, false)
    setSearchParams(Object.fromEntries(Object.entries({ q: searchQ, city: searchCity }).filter(([, v]) => v)))
  }

  const handleChip = (value) => {
    const next = activeChip === value ? '' : value
    setActiveChip(next); setPage(0)
    fetchPage(searchQ, next, searchCity, 0, false)
  }

  const handleLoadMore = () => {
    const next = page + 1; setPage(next)
    fetchPage(searchQ, activeChip, searchCity, next, true)
  }

  const handleMapSearch = useCallback((lat, lng, radius) => {
    return fetchPage(searchQ, activeChip, searchCity, 0, false, { latitude: lat, longitude: lng, radius })
  }, [fetchPage, searchQ, activeChip, searchCity])

  const px = isMobile ? '16px' : '24px'

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: T.bg, ...DISPLAY, overflow: 'hidden' }}>

      {/* ── Header ──────────────────────────────── */}
      <div style={{ flexShrink: 0, background: T.white, borderBottom: `1px solid ${T.border}`, zIndex: 40 }}>

        {/* Row 1 */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: `0 ${px}`, height: 48, display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => navigate('/landing')}
            style={{ fontSize: 15, fontWeight: 700, color: T.text, background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '-0.02em', flexShrink: 0 }}>
            Orbi
          </button>
          <span style={{ color: T.border, fontSize: 16, flexShrink: 0 }}>/</span>
          <span style={{ fontSize: 13, color: T.muted, fontWeight: 500, flexShrink: 0 }}>Nutricionistas</span>
          {total > 0 && !isMobile && (
            <span style={{ fontSize: 11, color: T.muted, background: T.light, borderRadius: 20, padding: '2px 8px', fontWeight: 600, flexShrink: 0 }}>
              {total} cadastradas
            </span>
          )}

          {/* Toggle Lista/Mapa — apenas desktop */}
          {!isMobile && (
            <div style={{ marginLeft: 'auto', display: 'flex', background: T.light, borderRadius: 8, padding: 3, gap: 2 }}>
              {[
                { id: 'list', Icon: LayoutGrid, label: 'Lista' },
                { id: 'map',  Icon: Map,        label: 'Mapa'  },
              ].map(({ id, Icon, label }) => (
                <button key={id} onClick={() => setViewMode(id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 10px', borderRadius: 6, border: 'none',
                    background: viewMode === id ? T.white : 'transparent',
                    color: viewMode === id ? T.brand : T.muted,
                    fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 140ms',
                    boxShadow: viewMode === id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  }}>
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Row 2: busca + chips */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: `0 ${px} 10px`, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Formulário de busca */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 7 }}>
            <div style={{ position: 'relative', flex: '1 1 0' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.muted, pointerEvents: 'none' }} />
              <input
                type="text" placeholder="Nome"
                value={searchQ} onChange={e => setSearchQ(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 29, paddingRight: 10, paddingTop: 8, paddingBottom: 8, border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 14, color: T.text, background: T.white, outline: 'none', fontFamily: 'inherit' }}
                onFocus={e => { e.target.style.borderColor = T.brand; e.target.style.boxShadow = `0 0 0 3px ${T.chip}` }}
                onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none' }}
              />
            </div>
            {!isMobile && (
              <div style={{ position: 'relative', flex: '1 1 0' }}>
                <MapPin size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.muted, pointerEvents: 'none' }} />
                <input
                  type="text" placeholder="Cidade ou bairro"
                  value={searchCity} onChange={e => setSearchCity(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', paddingLeft: 29, paddingRight: 10, paddingTop: 8, paddingBottom: 8, border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 14, color: T.text, background: T.white, outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => { e.target.style.borderColor = T.brand; e.target.style.boxShadow = `0 0 0 3px ${T.chip}` }}
                  onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none' }}
                />
              </div>
            )}
            <button
              type="submit"
              style={{ padding: '8px 16px', background: T.brand, color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, minHeight: 40, WebkitTapHighlightColor: 'transparent' }}
            >
              Buscar
            </button>
          </form>

          {/* Chips de especialidade */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 2 }}>
            {SPECIALTY_CHIPS.map(({ label, value }) => {
              const active = activeChip === value
              return (
                <button key={value} onClick={() => handleChip(value)}
                  style={{
                    padding: isMobile ? '6px 12px' : '5px 12px',
                    borderRadius: 20, border: 'none', whiteSpace: 'nowrap',
                    fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                    background: active ? T.brand : T.light,
                    color: active ? '#fff' : T.muted,
                    transition: 'all 120ms', flexShrink: 0,
                    minHeight: isMobile ? 36 : 28,
                    WebkitTapHighlightColor: 'transparent',
                  }}>
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Conteúdo ─────────────────────────────── */}
      {viewMode === 'map' && !isMobile ? (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <DiscoverMap
            results={results}
            onSearch={handleMapSearch}
            highlightedId={hoveredId}
            onHoverPin={setHoveredId}
            onCardClick={openPanel}
          />
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '16px 16px 80px' : '24px 24px 60px' }}>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                {Array.from({ length: isMobile ? 4 : 9 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : results.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 80 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: T.text, margin: '0 0 8px' }}>Nenhuma nutricionista encontrada</p>
                <p style={{ fontSize: 13, color: T.muted, margin: '0 0 20px' }}>Tente uma busca diferente ou mude o filtro de especialidade.</p>
                <button onClick={() => { setSearchQ(''); setSearchCity(''); setActiveChip(''); fetchPage('', '', '', 0, false) }}
                  style={{ padding: '10px 20px', background: T.brand, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}>
                  Ver todas
                </button>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 12, color: T.muted, margin: '0 0 16px' }}>
                  <span style={{ fontWeight: 700, color: T.text }}>{total}</span> nutricionista{total !== 1 ? 's' : ''} encontrada{total !== 1 ? 's' : ''}
                  {activeChip && <> em <span style={{ color: T.brand, fontWeight: 600 }}>{activeChip}</span></>}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                  {results.map(pro => (
                    <RichCard
                      key={pro.id}
                      professional={pro}
                      highlighted={hoveredId === pro.id}
                      onClick={() => openPanel(pro)}
                      onHover={setHoveredId}
                    />
                  ))}
                </div>

                {results.length < total && (
                  <div style={{ textAlign: 'center', marginTop: 36 }}>
                    <button onClick={handleLoadMore} disabled={loadingMore}
                      style={{ padding: '11px 28px', border: `1px solid ${T.border}`, borderRadius: 8, background: T.white, color: T.text, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', opacity: loadingMore ? 0.5 : 1, display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 44 }}>
                      {loadingMore
                        ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Carregando…</>
                        : `Ver mais ${total - results.length} nutricionistas`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Painel deslizante */}
      <ProfessionalPanel
        open={panelOpen}
        professionalId={panelId}
        previewData={panelPreview}
        onClose={closePanel}
        navigate={navigate}
      />

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%, 100% { opacity: 1 } 50% { opacity: 0.45 } }
        /* esconde scrollbar horizontal nos chips em mobile */
        ::-webkit-scrollbar { height: 0; }
      `}</style>
    </div>
  )
}
