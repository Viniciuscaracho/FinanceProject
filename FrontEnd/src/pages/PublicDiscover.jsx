import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, MapPin, Loader2, Map, List, Minus, Plus } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { apiService } from '../lib/api'

/* ─── Fix Leaflet default marker icons for Vite ─ */
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

/* ─── Tokens ────────────────────────────────── */
const T = {
  bg:     '#F9F8F5',
  white:  '#FFFFFF',
  brand:  '#4C60AA',
  text:   '#111111',
  muted:  '#6B6B6B',
  border: '#E3E2DF',
  light:  '#EFEFEC',
  chip:   '#EEF2FA',
}
const DISPLAY = { fontFamily: "'Space Grotesk', system-ui, sans-serif" }

const CATEGORIES = [
  'Psicólogo', 'Advogado', 'Nutricionista', 'Personal Trainer',
  'Barbeiro', 'Cabeleireiro', 'Dentista', 'Médico', 'Fisioterapeuta',
  'Professor', 'Coach', 'Terapeuta', 'Contador', 'Veterinário', 'Arquiteto', 'Designer',
]

/* ─── Helpers ────────────────────────────────── */
function getInitials(name) {
  return (name || '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function formatPrice(cents) {
  if (!cents || cents === 0) return null
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

/* ─── Avatar (with onError fallback) ────────── */
function Avatar({ name, src, size = 48, radius = 10 }) {
  const [err, setErr] = useState(false)
  const initials = getInitials(name)
  if (src && !err) {
    return (
      <div style={{ width: size, height: size, borderRadius: radius, flexShrink: 0, overflow: 'hidden', background: T.chip }}>
        <img src={src} alt={name} onError={() => setErr(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
    )
  }
  return (
    <div style={{ width: size, height: size, borderRadius: radius, flexShrink: 0, background: T.chip, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: size * 0.33, fontWeight: 700, color: T.brand, ...DISPLAY }}>{initials}</span>
    </div>
  )
}

/* ─── Professional card with cover photo ────── */
function ProfessionalCard({ professional, onClick }) {
  const location = [professional.location?.district, professional.location?.city].filter(Boolean).join(' · ')
  const [hovered, setHovered] = useState(false)
  const [coverErr, setCoverErr] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: T.white,
        border: `1px solid ${hovered ? T.brand : T.border}`,
        borderRadius: 12,
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
        boxShadow: hovered ? '0 4px 16px rgba(76,96,170,0.12)' : 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Cover photo banner */}
      <div style={{
        height: 80, position: 'relative', flexShrink: 0,
        background: (professional.cover_url && !coverErr)
          ? 'transparent'
          : 'linear-gradient(135deg, #1E2440 0%, #4C60AA 100%)',
        overflow: 'hidden',
      }}>
        {professional.cover_url && !coverErr && (
          <img
            src={professional.cover_url}
            alt=""
            onError={() => setCoverErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}
        {/* Avatar overlapping cover */}
        <div style={{ position: 'absolute', bottom: -18, left: 16, zIndex: 1 }}>
          <Avatar name={professional.name} src={professional.logo_url} size={46} radius={10} />
        </div>
      </div>

      <div style={{ padding: '22px 16px 14px' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: T.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...DISPLAY }}>
            {professional.name}
          </p>

          {professional.profession_category && (
            <span style={{
              display: 'inline-block', marginTop: 4,
              padding: '2px 8px', borderRadius: 4,
              background: T.chip, color: T.brand,
              fontSize: 11, fontWeight: 600, letterSpacing: '0.02em',
            }}>
              {professional.profession_category}
            </span>
          )}

          {location && (
            <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: T.muted, margin: '6px 0 0' }}>
              <MapPin size={11} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{location}</span>
            </p>
          )}
        </div>

        {professional.services_preview?.length > 0 && (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
            {professional.services_preview.map((svc, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: i < professional.services_preview.length - 1 ? 7 : 0 }}>
                <span style={{ fontSize: 12, color: T.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>{svc.name}</span>
                {formatPrice(svc.price_cents) && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.text, flexShrink: 0 }}>{formatPrice(svc.price_cents)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{
        marginTop: 'auto', padding: '10px 16px',
        borderTop: `1px solid ${T.border}`, background: T.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 11, color: T.muted }}>
          {professional.services_count} {professional.services_count === 1 ? 'serviço' : 'serviços'}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: hovered ? T.brand : T.muted, transition: 'color 150ms ease' }}>
          Ver perfil →
        </span>
      </div>
    </div>
  )
}

/* ─── Map view ───────────────────────────────── */
const SAO_PAULO = [-23.5505, -46.6333]

function DiscoverMap({ results, onSearch, navigate }) {
  const mapRef     = useRef(null)
  const mapObj     = useRef(null)
  const circleRef  = useRef(null)
  const centerRef  = useRef(null)
  const markersRef = useRef([])
  const [center, setCenter] = useState(SAO_PAULO)
  const [radius, setRadius] = useState(10) // km
  const [searching, setSearching] = useState(false)

  /* init map once */
  useEffect(() => {
    if (mapObj.current) return
    const map = L.map(mapRef.current, { center: SAO_PAULO, zoom: 11 })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)
    mapObj.current = map

    // center drag marker (crosshair icon)
    const crosshairIcon = L.divIcon({
      html: `<div style="width:28px;height:28px;border-radius:50%;border:3px solid #4C60AA;background:rgba(76,96,170,0.15);display:flex;align-items:center;justify-content:center;">
               <div style="width:8px;height:8px;border-radius:50%;background:#4C60AA;"></div>
             </div>`,
      className: '',
      iconAnchor: [14, 14],
    })
    const marker = L.marker(SAO_PAULO, { icon: crosshairIcon, draggable: true }).addTo(map)
    centerRef.current = marker

    // radius circle
    const circle = L.circle(SAO_PAULO, {
      radius: 10 * 1000,
      color: '#4C60AA',
      fillColor: '#4C60AA',
      fillOpacity: 0.08,
      weight: 2,
    }).addTo(map)
    circleRef.current = circle

    marker.on('dragend', () => {
      const { lat, lng } = marker.getLatLng()
      setCenter([lat, lng])
    })

    map.on('click', (e) => {
      const { lat, lng } = e.latlng
      marker.setLatLng([lat, lng])
      circle.setLatLng([lat, lng])
      map.panTo([lat, lng])
      setCenter([lat, lng])
    })

    return () => { map.remove(); mapObj.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* update circle when radius changes */
  useEffect(() => {
    if (!circleRef.current) return
    circleRef.current.setRadius(radius * 1000)
  }, [radius])

  /* update circle center when center changes */
  useEffect(() => {
    if (!circleRef.current || !centerRef.current) return
    circleRef.current.setLatLng(center)
    centerRef.current.setLatLng(center)
  }, [center])

  /* render professional markers */
  useEffect(() => {
    if (!mapObj.current) return
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    results.forEach(pro => {
      const lat = pro.location?.latitude
      const lng = pro.location?.longitude
      if (!lat || !lng) return

      const icon = L.divIcon({
        html: `<div style="
          background:#4C60AA;color:#fff;
          border-radius:20px;
          padding:4px 10px;
          font-size:11px;font-weight:700;
          font-family:'Space Grotesk',system-ui,sans-serif;
          white-space:nowrap;
          box-shadow:0 2px 8px rgba(0,0,0,0.25);
          border:2px solid #fff;
        ">${pro.profession_category || pro.name.split(' ')[0]}</div>`,
        className: '',
        iconAnchor: [0, 0],
      })

      const logoHtml = pro.logo_url
        ? `<img src="${pro.logo_url}" style="width:40px;height:40px;border-radius:8px;object-fit:cover;flex-shrink:0;" onerror="this.style.display='none'">`
        : `<div style="width:40px;height:40px;border-radius:8px;background:#EEF2FA;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:#4C60AA;font-family:'Space Grotesk',system-ui,sans-serif;flex-shrink:0;">${getInitials(pro.name)}</div>`

      const popupHtml = `
        <div style="font-family:'Space Grotesk',system-ui,sans-serif;min-width:200px;padding:2px 0">
          <div style="display:flex;gap:10px;align-items:center;margin-bottom:10px">
            ${logoHtml}
            <div style="min-width:0">
              <p style="margin:0;font-size:13px;font-weight:700;color:#111;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${pro.name}</p>
              ${pro.profession_category ? `<span style="font-size:11px;font-weight:600;color:#4C60AA;background:#EEF2FA;border-radius:4px;padding:1px 7px">${pro.profession_category}</span>` : ''}
            </div>
          </div>
          ${pro.location?.city ? `<p style="margin:0 0 10px;font-size:12px;color:#6B6B6B">📍 ${[pro.location.district, pro.location.city].filter(Boolean).join(', ')}</p>` : ''}
          <a href="/descobrir/${pro.id}" style="display:block;text-align:center;background:#4C60AA;color:#fff;border-radius:7px;padding:7px 14px;font-size:12px;font-weight:600;text-decoration:none">
            Ver perfil →
          </a>
        </div>
      `

      const m = L.marker([lat, lng], { icon })
        .addTo(mapObj.current)
        .bindPopup(popupHtml, { maxWidth: 240, className: 'orbi-popup' })
      markersRef.current.push(m)
    })
  }, [results])

  const doSearch = useCallback(async (lat, lng, r) => {
    setSearching(true)
    try { await onSearch(lat, lng, r) }
    finally { setSearching(false) }
  }, [onSearch])

  const handleRadiusChange = (delta) => {
    setRadius(prev => {
      const next = Math.max(1, Math.min(200, prev + delta))
      return next
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Radius control bar */}
      <div style={{
        background: T.white, border: `1px solid ${T.border}`, borderRadius: 10,
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12,
        marginBottom: 12, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 240px' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: T.muted, whiteSpace: 'nowrap' }}>Raio de busca:</span>
          <input
            type="range" min="1" max="200" step="1"
            value={radius}
            onChange={e => setRadius(Number(e.target.value))}
            style={{ flex: 1, accentColor: T.brand }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => handleRadiusChange(-5)}
              style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${T.border}`, background: T.white, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Minus size={12} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.brand, minWidth: 58, textAlign: 'center' }}>
              {radius} km
            </span>
            <button onClick={() => handleRadiusChange(5)}
              style={{ width: 24, height: 24, borderRadius: 6, border: `1px solid ${T.border}`, background: T.white, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={12} />
            </button>
          </div>
        </div>
        <button
          onClick={() => doSearch(center[0], center[1], radius)}
          disabled={searching}
          style={{
            padding: '7px 18px', background: T.brand, color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600,
            cursor: searching ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 6,
            opacity: searching ? 0.7 : 1,
          }}
        >
          {searching ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : null}
          Buscar nesta área
        </button>
        <p style={{ fontSize: 11, color: T.muted, margin: 0, flex: '1 1 100%' }}>
          Clique no mapa para mover o centro · arraste o marcador azul
        </p>
      </div>

      {/* Map container */}
      <div ref={mapRef} style={{ height: 480, borderRadius: 12, overflow: 'hidden', border: `1px solid ${T.border}` }} />

      {/* Results below map */}
      {results.filter(r => r.location?.latitude && r.location?.longitude).length > 0 && (
        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: 13, color: T.muted, margin: '0 0 16px' }}>
            <span style={{ fontWeight: 700, color: T.text }}>
              {results.filter(r => r.location?.latitude).length}
            </span> profissional(is) com localização dentro do raio
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {results.filter(r => r.location?.latitude).map(pro => (
              <ProfessionalCard
                key={pro.id}
                professional={pro}
                onClick={() => navigate(`/descobrir/${pro.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      <style>{`
        .orbi-popup .leaflet-popup-content-wrapper { border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); padding: 0; }
        .orbi-popup .leaflet-popup-content { margin: 14px 16px; }
        .orbi-popup .leaflet-popup-tip-container { margin-top: -1px; }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  )
}

/* ─── Main page ──────────────────────────────── */
export function PublicDiscover() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [searchQ,           setSearchQ]          = useState(searchParams.get('q') || '')
  const [searchCity,        setSearchCity]        = useState(searchParams.get('city') || '')
  const [selectedCategory,  setSelectedCategory]  = useState(searchParams.get('category') || '')
  const [viewMode,          setViewMode]          = useState('list') // 'list' | 'map'

  const [results,     setResults]     = useState([])
  const [total,       setTotal]       = useState(0)
  const [page,        setPage]        = useState(0)
  const [loading,     setLoading]     = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchPage = useCallback(async (q, city, category, pg, append, mapParams = {}) => {
    if (append) setLoadingMore(true)
    else setLoading(true)
    try {
      const data = await apiService.discoverSearch({ q, city, category, page: pg, ...mapParams })
      if (append) {
        setResults(prev => [...prev, ...(data.results || [])])
      } else {
        setResults(data.results || [])
        setTotal(data.total || 0)
      }
    } catch {
      // empty state handles it
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    setPage(0)
    fetchPage(searchQ, searchCity, selectedCategory, 0, false)
  }, [selectedCategory]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => {
    e?.preventDefault()
    setPage(0)
    fetchPage(searchQ, searchCity, selectedCategory, 0, false)
    setSearchParams(
      Object.fromEntries(
        Object.entries({ q: searchQ, city: searchCity, category: selectedCategory }).filter(([, v]) => v)
      )
    )
  }

  const handleCategoryClick = (cat) => {
    const next = selectedCategory === cat ? '' : cat
    setSelectedCategory(next)
    setSearchParams(
      Object.fromEntries(
        Object.entries({ q: searchQ, city: searchCity, category: next }).filter(([, v]) => v)
      )
    )
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchPage(searchQ, searchCity, selectedCategory, nextPage, true)
  }

  const handleMapSearch = useCallback((lat, lng, radius) => {
    return fetchPage(searchQ, searchCity, selectedCategory, 0, false, {
      latitude: lat, longitude: lng, radius,
    })
  }, [fetchPage, searchQ, searchCity, selectedCategory])

  return (
    <div style={{ minHeight: '100vh', background: T.bg, ...DISPLAY }}>

      {/* ── Nav ──────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(249,248,245,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => navigate('/landing')}
            style={{ fontSize: 15, fontWeight: 700, color: T.text, background: 'none', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '-0.02em' }}
          >
            Orbi
          </button>
          <span style={{ color: T.border, fontSize: 16, userSelect: 'none' }}>/</span>
          <span style={{ fontSize: 13, color: T.muted, fontWeight: 500 }}>Descobrir</span>

          {/* View toggle */}
          <div style={{ marginLeft: 'auto', display: 'flex', background: T.light, borderRadius: 8, padding: 3, gap: 2 }}>
            {[
              { id: 'list', Icon: List,  label: 'Lista' },
              { id: 'map',  Icon: Map,   label: 'Mapa'  },
            ].map(({ id, Icon, label }) => (
              <button
                key={id}
                onClick={() => setViewMode(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 6, border: 'none',
                  background: viewMode === id ? T.white : 'transparent',
                  color: viewMode === id ? T.brand : T.muted,
                  fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 150ms ease',
                  boxShadow: viewMode === id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Hero + busca ─────────────────────────── */}
      <div style={{ background: T.white, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '52px 24px 36px' }}>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 700, color: T.text, margin: '0 0 10px', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            Encontre profissionais<br />perto de você
          </h1>
          <p style={{ fontSize: 15, color: T.muted, margin: '0 0 32px', lineHeight: 1.5 }}>
            Psicólogos, advogados, personal trainers e mais — agende direto pela plataforma.
          </p>

          {/* Search form */}
          <form onSubmit={handleSearch} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
            <div style={{ flex: '1 1 280px', position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.muted, pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Profissão ou nome"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  paddingLeft: 36, paddingRight: 14, paddingTop: 11, paddingBottom: 11,
                  border: `1px solid ${T.border}`, borderRadius: 8,
                  fontSize: 13, color: T.text, background: T.white,
                  outline: 'none', fontFamily: 'inherit',
                }}
                onFocus={e => { e.target.style.borderColor = T.brand; e.target.style.boxShadow = `0 0 0 3px ${T.chip}` }}
                onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none' }}
              />
            </div>
            {viewMode === 'list' && (
              <div style={{ flex: '0 1 220px', position: 'relative' }}>
                <MapPin size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.muted, pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Cidade ou bairro"
                  value={searchCity}
                  onChange={e => setSearchCity(e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    paddingLeft: 36, paddingRight: 14, paddingTop: 11, paddingBottom: 11,
                    border: `1px solid ${T.border}`, borderRadius: 8,
                    fontSize: 13, color: T.text, background: T.white,
                    outline: 'none', fontFamily: 'inherit',
                  }}
                  onFocus={e => { e.target.style.borderColor = T.brand; e.target.style.boxShadow = `0 0 0 3px ${T.chip}` }}
                  onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none' }}
                />
              </div>
            )}
            <button
              type="submit"
              style={{
                padding: '11px 24px', background: T.text, color: '#fff',
                border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit',
              }}
            >
              Buscar
            </button>
          </form>

          {/* Category chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryClick(cat)}
                style={{
                  padding: '5px 12px', borderRadius: 6, border: 'none',
                  fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 120ms ease',
                  background: selectedCategory === cat ? T.brand : T.light,
                  color:      selectedCategory === cat ? '#fff'   : T.muted,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────── */}
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: viewMode === 'map' ? '24px 24px 60px' : '40px 24px 60px' }}>
        {viewMode === 'map' ? (
          <DiscoverMap results={results} onSearch={handleMapSearch} navigate={navigate} />
        ) : loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <Loader2 size={28} style={{ color: T.brand, animation: 'spin 1s linear infinite' }} />
          </div>
        ) : results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: T.text, margin: '0 0 6px' }}>Nenhum profissional encontrado</p>
            <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>Tente uma busca diferente ou remova os filtros.</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: T.muted, margin: '0 0 24px' }}>
              <span style={{ fontWeight: 700, color: T.text }}>{total}</span>{' '}
              profissional{total !== 1 ? 'is' : ''} encontrado{total !== 1 ? 's' : ''}
              {selectedCategory && (
                <span> em <span style={{ color: T.brand, fontWeight: 600 }}>{selectedCategory}</span></span>
              )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {results.map(professional => (
                <ProfessionalCard
                  key={professional.id}
                  professional={professional}
                  onClick={() => navigate(`/descobrir/${professional.id}`)}
                />
              ))}
            </div>

            {results.length < total && (
              <div style={{ textAlign: 'center', marginTop: 48 }}>
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  style={{
                    padding: '10px 28px',
                    border: `1px solid ${T.border}`, borderRadius: 8,
                    background: T.white, color: T.text,
                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    fontFamily: 'inherit', opacity: loadingMore ? 0.5 : 1,
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                  }}
                >
                  {loadingMore
                    ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Carregando…</>
                    : `Carregar mais · ${total - results.length} restantes`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
