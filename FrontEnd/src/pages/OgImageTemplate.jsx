import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { apiService } from '../lib/api'
import { profileIdFromSlug } from '../lib/seoSlugs'

// Página sem header/nav renderizada pelo Puppeteer como OG image 1200×630
export default function OgImageTemplate() {
  const { slug } = useParams()
  const id = profileIdFromSlug(slug)
  const [pro, setPro] = useState(null)

  useEffect(() => {
    if (!id) return
    apiService.discoverProfile(slug)
      .then(setPro)
      .catch(() => {})
  }, [slug, id])

  const name       = pro?.name || 'Nutricionista'
  const photo      = pro?.logo_url || null
  const specs      = pro?.specialties?.slice(0, 2) || []
  const rating     = pro?.ratings_average
  const ratingCt   = pro?.ratings_count || 0
  const city       = pro?.location?.city
  const district   = pro?.location?.district
  const crn        = pro?.professional_registration

  const where = district && city ? `${district}, ${city}` : city || district || null

  return (
    <div
      data-og-ready={pro ? 'true' : undefined}
      style={{
        width: 1200, height: 630, overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex', background: '#f8faf8',
      }}
    >
      {/* Foto — metade esquerda */}
      <div style={{ width: 480, height: 630, flexShrink: 0, position: 'relative', overflow: 'hidden', background: '#dcfce7' }}>
        {photo ? (
          <img
            src={photo}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 120, fontWeight: 800, color: '#16a34a', opacity: 0.4 }}>
              {name.split(' ').slice(0, 2).map(n => n[0]).join('')}
            </span>
          </div>
        )}
        {/* Gradiente lateral */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, transparent 60%, #f8faf8 100%)',
        }} />
      </div>

      {/* Conteúdo direito */}
      <div style={{
        flex: 1, padding: '56px 64px 48px 48px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>
        <div>
          {/* Crédencial */}
          {crn && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 20,
              background: '#dcfce7', marginBottom: 20,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>{crn}</span>
            </div>
          )}

          {/* Nome */}
          <h1 style={{
            margin: '0 0 10px', lineHeight: 1.15,
            fontSize: name.length > 28 ? 38 : 46,
            fontWeight: 800, color: '#111827',
          }}>
            {name}
          </h1>

          <p style={{ margin: '0 0 20px', fontSize: 20, color: '#6b7280', fontWeight: 500 }}>
            Nutricionista
          </p>

          {/* Especialidades */}
          {specs.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {specs.map(s => (
                <span key={s} style={{
                  padding: '6px 16px', borderRadius: 20,
                  background: '#f0fdf4', border: '1.5px solid #bbf7d0',
                  fontSize: 15, fontWeight: 600, color: '#15803d',
                  textTransform: 'capitalize',
                }}>
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Avaliação */}
          {ratingCt > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              {[1,2,3,4,5].map(n => (
                <svg key={n} width="22" height="22" viewBox="0 0 24 24"
                  fill={n <= Math.round(rating) ? '#f59e0b' : '#e5e7eb'}
                  stroke={n <= Math.round(rating) ? '#f59e0b' : '#e5e7eb'}
                  strokeWidth="1">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              ))}
              <span style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>{rating?.toFixed(1)}</span>
              <span style={{ fontSize: 15, color: '#6b7280' }}>({ratingCt} avaliações)</span>
            </div>
          )}

          {/* Localização */}
          {where && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <span style={{ fontSize: 16, color: '#6b7280' }}>{where}</span>
            </div>
          )}
        </div>

        {/* Rodapé — branding */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, background: '#16a34a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#111827' }}>OrbiNutri</p>
              <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>orbinutri.com.br</p>
            </div>
          </div>

          <div style={{
            padding: '10px 22px', borderRadius: 10,
            background: '#16a34a', color: '#fff',
            fontSize: 15, fontWeight: 700,
          }}>
            Agendar consulta →
          </div>
        </div>
      </div>
    </div>
  )
}
