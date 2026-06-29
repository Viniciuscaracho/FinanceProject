import { useState, useEffect, useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { MapPin, Star, Calendar, ChevronRight, Loader2, Search } from 'lucide-react'
import { apiService } from '../lib/api'
import {
  SPECIALTIES, CITIES, SP_NEIGHBORHOODS,
  slugToLabel, slugToQuery, isSpecialtySlug, profileSlug, nameToSlug,
} from '../lib/seoSlugs'

const T = {
  bg: '#f8f9fa', white: '#ffffff', brand: '#16a34a', brandLight: '#dcfce7',
  text: '#111827', muted: '#6b7280', border: '#e5e7eb', light: '#f3f4f6',
  star: '#f59e0b',
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function formatPrice(cents) {
  if (!cents) return null
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

function getInitials(name) {
  return (name || '?').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

/* ── Card de profissional ─────────────────────────────────────────────────── */
function ProCard({ pro }) {
  const navigate = useNavigate()
  const slug = profileSlug(pro.name, pro.id)
  const price = pro.services_preview?.[0]?.price_cents

  return (
    <article
      onClick={() => navigate(`/nutricionista/${slug}`)}
      style={{
        background: T.white, borderRadius: 14, overflow: 'hidden',
        border: `1px solid ${T.border}`, cursor: 'pointer',
        transition: 'box-shadow 0.15s, transform 0.15s',
        display: 'flex', flexDirection: 'column',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
    >
      {/* Cover / foto */}
      <div style={{ height: 160, background: T.light, position: 'relative', overflow: 'hidden' }}>
        {pro.logo_url
          ? <img src={pro.logo_url} alt={pro.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.brandLight }}>
              <span style={{ fontSize: 36, fontWeight: 700, color: T.brand }}>{getInitials(pro.name)}</span>
            </div>
        }
      </div>

      <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text, lineHeight: 1.3 }}>{pro.name}</h3>

        {/* Tags especialidade */}
        {pro.specialties?.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {pro.specialties.slice(0, 3).map(s => (
              <span key={s} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: T.brandLight, color: T.brand, fontWeight: 600, textTransform: 'capitalize' }}>{s}</span>
            ))}
          </div>
        )}

        {/* Avaliação */}
        {pro.ratings_count > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Star size={12} fill={T.star} color={T.star} />
            <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{pro.ratings_average?.toFixed(1)}</span>
            <span style={{ fontSize: 12, color: T.muted }}>({pro.ratings_count} avaliações)</span>
          </div>
        )}

        {/* Localização */}
        {pro.location?.district && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={12} color={T.muted} />
            <span style={{ fontSize: 12, color: T.muted }}>{pro.location.district}{pro.location.city ? `, ${pro.location.city}` : ''}</span>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          {price && <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>a partir de {formatPrice(price)}</span>}
          <Link
            to={`/nutricionista/${slug}`}
            onClick={e => e.stopPropagation()}
            style={{ fontSize: 13, fontWeight: 600, color: T.white, background: T.brand, padding: '8px 14px', borderRadius: 8, textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            Ver perfil
          </Link>
        </div>
      </div>
    </article>
  )
}

function SkeletonCard() {
  return (
    <div style={{ background: T.white, borderRadius: 14, overflow: 'hidden', border: `1px solid ${T.border}` }}>
      <div style={{ height: 160, background: T.light, animation: 'pulse 1.4s ease-in-out infinite' }} />
      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ height: 16, width: '60%', borderRadius: 6, background: T.light, animation: 'pulse 1.4s ease-in-out infinite' }} />
        <div style={{ height: 12, width: '40%', borderRadius: 6, background: T.light, animation: 'pulse 1.4s ease-in-out infinite' }} />
        <div style={{ height: 36, borderRadius: 8, background: T.light, animation: 'pulse 1.4s ease-in-out infinite', marginTop: 10 }} />
      </div>
    </div>
  )
}

/* ── FAQ por tipo de página ──────────────────────────────────────────────── */
function buildFaq(spec, city, district) {
  const where = district ? `${district}, ${city || 'São Paulo'}` : city || 'São Paulo'
  const specLabel = spec ? SPECIALTIES.find(s => s.slug === spec)?.label?.toLowerCase() || spec : null

  const base = [
    {
      q: `Quanto custa uma consulta com nutricionista${specLabel ? ` de ${specLabel}` : ''}${city ? ` em ${where}` : ''}?`,
      a: `O valor médio de uma consulta com nutricionista${specLabel ? ` especialista em ${specLabel}` : ''} varia entre R$ 150 e R$ 350. Retornos e consultas online costumam ser mais acessíveis. No OrbiNutri você vê o preço de cada profissional antes de agendar.`,
    },
    {
      q: 'Como agendar uma consulta pelo OrbiNutri?',
      a: 'Escolha o profissional, clique em "Ver perfil" e use o botão de agendamento online. Você receberá confirmação por e-mail ou WhatsApp sem precisar ligar para o consultório.',
    },
    {
      q: `Os nutricionistas${city ? ` em ${where}` : ''} atendem online?`,
      a: 'Sim. Muitos profissionais cadastrados no OrbiNutri oferecem atendimento online via videochamada, permitindo que você seja atendido de qualquer lugar do Brasil.',
    },
    {
      q: `Como escolher um bom nutricionista${specLabel ? ` de ${specLabel}` : ''}?`,
      a: `Verifique o CRN (registro no Conselho Regional de Nutricionistas), as especialidades, as avaliações de outros pacientes e a experiência com casos semelhantes ao seu. No OrbiNutri todos os perfis são verificados.`,
    },
  ]

  if (specLabel === 'esportiva' || spec === 'esportiva') {
    base.push({
      q: 'O que faz um nutricionista esportivo?',
      a: 'O nutricionista esportivo elabora estratégias alimentares para melhorar performance, ganho de massa muscular, recuperação e composição corporal. É essencial para atletas e praticantes regulares de atividade física.',
    })
  }
  if (spec === 'emagrecimento') {
    base.push({
      q: 'Nutricionista de emagrecimento faz dieta restritiva?',
      a: 'Não necessariamente. Os melhores profissionais de emagrecimento trabalham com reeducação alimentar sustentável, sem proibições drásticas, adaptando o plano à rotina e preferências do paciente.',
    })
  }
  if (spec === 'infantil') {
    base.push({
      q: 'A partir de que idade meu filho pode ir ao nutricionista?',
      a: 'Desde o nascimento. A nutrição infantil e pediátrica acompanha desde a introdução alimentar (a partir dos 6 meses) até a adolescência, garantindo crescimento e desenvolvimento saudáveis.',
    })
  }

  return base
}

/* ── Texto de apresentação por tipo ─────────────────────────────────────── */
function buildIntro(spec, city, district) {
  const where = district ? `${district}${city ? `, ${city}` : ''}` : city
  const specLabel = spec ? SPECIALTIES.find(s => s.slug === spec)?.label || spec : null

  if (specLabel && where) {
    return {
      heading: `Nutricionistas de ${specLabel} em ${where}`,
      sub: `Encontre os melhores nutricionistas especializados em ${specLabel.toLowerCase()} em ${where}. Perfis verificados com CRN, avaliações reais de pacientes e agendamento online pelo OrbiNutri.`,
      body: `A nutrição ${specLabel.toLowerCase()} requer um profissional com formação e experiência específicas. Em ${where}, você encontra nutricionistas com pós-graduação e anos de prática atendendo casos como o seu. Veja as avaliações, compare preços e agende sem sair de casa.`,
    }
  }
  if (specLabel) {
    return {
      heading: `Nutricionistas de ${specLabel}`,
      sub: `Encontre nutricionistas especializados em ${specLabel.toLowerCase()} no Brasil. Perfis verificados com agendamento online pelo OrbiNutri.`,
      body: `A especialidade de ${specLabel.toLowerCase()} exige conhecimento aprofundado e atualização constante. Aqui você encontra profissionais com experiência comprovada, avaliações de pacientes reais e atendimento presencial ou online para todo o Brasil.`,
    }
  }
  if (where) {
    return {
      heading: `Nutricionistas em ${where}`,
      sub: `Encontre nutricionistas em ${where} com agendamento online. Perfis verificados, avaliações reais e atendimento presencial ou online.`,
      body: `Em ${where} há nutricionistas especializados em emagrecimento, nutrição esportiva, saúde feminina, infantil, vegetariana e muito mais. Todos os perfis no OrbiNutri são verificados com CRN ativo. Compare preços, leia avaliações e agende sua consulta sem ligação.`,
    }
  }
  return {
    heading: 'Encontre nutricionistas',
    sub: 'Descubra nutricionistas verificados perto de você. Agendamento online, sem filas, sem ligação.',
    body: 'No OrbiNutri você encontra nutricionistas em todo o Brasil, especializados em emagrecimento, saúde esportiva, nutrição infantil, saúde feminina e muito mais. Todos os perfis têm CRN verificado, avaliações de pacientes reais e botão de agendamento online.',
  }
}

/* ── Links internos ──────────────────────────────────────────────────────── */
function InternalLinks({ spec, city, district }) {
  const cityData = CITIES.find(c => c.slug === city)
  const isSpCity = city === 'sao-paulo' || !city

  return (
    <div style={{ marginTop: 48 }}>
      {/* Especialidades relacionadas */}
      {!spec && (
        <section style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 14px' }}>
            {city ? `Nutricionistas por especialidade em ${cityData?.label || 'São Paulo'}` : 'Buscar por especialidade'}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SPECIALTIES.map(s => (
              <Link
                key={s.slug}
                to={city ? `/nutricionistas/${city}/${s.slug}` : `/nutricionistas/especialidade/${s.slug}`}
                style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${T.border}`, background: T.white, color: T.text, textDecoration: 'none', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {s.label} <ChevronRight size={12} color={T.muted} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Cidades relacionadas */}
      {!city && (
        <section style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 14px' }}>Cidades com nutricionistas</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CITIES.map(c => (
              <Link
                key={c.slug}
                to={spec ? `/nutricionistas/${c.slug}/${spec}` : `/nutricionistas/${c.slug}`}
                style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${T.border}`, background: T.white, color: T.text, textDecoration: 'none', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <MapPin size={12} color={T.muted} /> {c.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Bairros de SP */}
      {(city === 'sao-paulo' || isSpCity) && !district && (
        <section style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 14px' }}>Bairros em São Paulo</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SP_NEIGHBORHOODS.map(n => (
              <Link
                key={n.slug}
                to={`/nutricionistas/sao-paulo/${n.slug}`}
                style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${T.border}`, background: T.white, color: T.text, textDecoration: 'none', fontSize: 13, fontWeight: 500 }}
              >
                {n.label}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Especialidades na cidade atual */}
      {city && spec && (
        <section style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 14px' }}>
            Outras especialidades em {cityData?.label || city}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SPECIALTIES.filter(s => s.slug !== spec).map(s => (
              <Link
                key={s.slug}
                to={`/nutricionistas/${city}/${s.slug}`}
                style={{ padding: '7px 14px', borderRadius: 20, border: `1px solid ${T.border}`, background: T.white, color: T.text, textDecoration: 'none', fontSize: 13, fontWeight: 500 }}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

/* ── Página principal ────────────────────────────────────────────────────── */
export default function NutritionistDirectory() {
  const { cidade, segment, spec: specParam } = useParams()

  // segment pode ser uma especialidade (/sao-paulo/esportiva)
  // ou um bairro (/sao-paulo/moema)
  const isSegmentSpec = segment && isSpecialtySlug(segment)
  const spec     = isSegmentSpec ? segment : null
  const district = (!isSegmentSpec && segment) ? segment : null

  // specParam vem da rota /nutricionistas/especialidade/:spec
  const finalSpec = specParam || spec

  const cityData    = cidade ? CITIES.find(c => c.slug === cidade) : null
  const cityQuery   = cityData?.query || (cidade ? slugToQuery(cidade, CITIES) : null)
  const specData    = finalSpec ? SPECIALTIES.find(s => s.slug === finalSpec) : null
  const specQuery   = specData?.query || (finalSpec ? slugToQuery(finalSpec, SPECIALTIES) : null)
  const distQuery   = district ? slugToLabel(district, SP_NEIGHBORHOODS) : null

  const intro = buildIntro(finalSpec, cityData?.label, distQuery)
  const faq   = buildFaq(finalSpec, cityData?.label, distQuery)

  const [results, setResults] = useState([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [page,    setPage]    = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)

  const fetchPros = useCallback(async (pg, append) => {
    pg === 0 ? setLoading(true) : setLoadingMore(true)
    try {
      const params = { page: pg }
      if (cityQuery)  params.city     = cityQuery
      if (distQuery)  params.district = distQuery
      if (specQuery)  params.specialty = specQuery
      const data = await apiService.discoverSearch(params)
      setTotal(data.total || 0)
      setResults(prev => append ? [...prev, ...(data.results || [])] : (data.results || []))
    } finally {
      pg === 0 ? setLoading(false) : setLoadingMore(false)
    }
  }, [cityQuery, distQuery, specQuery])

  useEffect(() => {
    setPage(0)
    setResults([])
    fetchPros(0, false)
  }, [fetchPros])

  function handleLoadMore() {
    const next = page + 1
    setPage(next)
    fetchPros(next, true)
  }

  /* ── SEO ── */
  const where = distQuery || cityData?.label
  const specLabel = specData?.label

  let seoTitle, seoDesc, canonical

  if (specLabel && where)     { seoTitle = `Nutricionistas de ${specLabel} em ${where} | OrbiNutri`; canonical = `/nutricionistas/${cidade}/${finalSpec}` }
  else if (specLabel)         { seoTitle = `Nutricionistas de ${specLabel} | OrbiNutri`;             canonical = `/nutricionistas/especialidade/${finalSpec}` }
  else if (where)             { seoTitle = `Nutricionistas em ${where} | OrbiNutri`;                canonical = `/nutricionistas/${cidade}${district ? '/' + district : ''}` }
  else                        { seoTitle = 'Encontre Nutricionistas | OrbiNutri';                   canonical = '/nutricionistas' }

  seoDesc = intro.sub

  const breadcrumbs = [
    { name: 'Início', item: 'https://orbinutri.com.br/' },
    { name: 'Nutricionistas', item: 'https://orbinutri.com.br/nutricionistas' },
    cityData && { name: cityData.label, item: `https://orbinutri.com.br/nutricionistas/${cidade}` },
    distQuery && { name: distQuery,     item: `https://orbinutri.com.br/nutricionistas/${cidade}/${district}` },
    specLabel && { name: specLabel,     item: `https://orbinutri.com.br${canonical}` },
  ].filter(Boolean)

  const schemaJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((b, i) => ({
          '@type': 'ListItem', position: i + 1, name: b.name, item: b.item,
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: faq.map(f => ({
          '@type': 'Question', name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      results.length > 0 && {
        '@type': 'ItemList',
        name: intro.heading,
        numberOfItems: total,
        itemListElement: results.slice(0, 10).map((pro, i) => ({
          '@type': 'ListItem', position: i + 1,
          item: {
            '@type': 'MedicalBusiness',
            name: pro.name,
            url: `https://orbinutri.com.br/nutricionista/${profileSlug(pro.name, pro.id)}`,
            image: pro.logo_url || undefined,
            address: pro.location?.city ? {
              '@type': 'PostalAddress', addressLocality: pro.location.city, addressRegion: 'SP', addressCountry: 'BR',
            } : undefined,
            aggregateRating: pro.ratings_count > 0 ? {
              '@type': 'AggregateRating', ratingValue: pro.ratings_average, reviewCount: pro.ratings_count,
            } : undefined,
          },
        })),
      },
    ].filter(Boolean),
  })

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDesc} />
        <link rel="canonical" href={`https://orbinutri.com.br${canonical}`} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDesc} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://orbinutri.com.br${canonical}`} />
        <script type="application/ld+json">{schemaJson}</script>
      </Helmet>

      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: 'system-ui, -apple-system, sans-serif' }}>

        {/* Header / nav breadcrumb */}
        <header style={{ background: T.white, borderBottom: `1px solid ${T.border}`, padding: '12px 20px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: T.muted }}>
            {breadcrumbs.map((b, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {i > 0 && <ChevronRight size={12} />}
                {i < breadcrumbs.length - 1
                  ? <Link to={new URL(b.item).pathname} style={{ color: T.muted, textDecoration: 'none' }}>{b.name}</Link>
                  : <span style={{ color: T.text, fontWeight: 600 }}>{b.name}</span>
                }
              </span>
            ))}
          </div>
        </header>

        <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px 60px' }}>

          {/* Hero */}
          <section style={{ marginBottom: 40 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: T.text, margin: '0 0 12px', lineHeight: 1.2 }}>
              {intro.heading}
            </h1>
            <p style={{ fontSize: 16, color: T.muted, margin: '0 0 8px', lineHeight: 1.6, maxWidth: 720 }}>
              {intro.sub}
            </p>
            {total > 0 && !loading && (
              <p style={{ fontSize: 14, color: T.muted, margin: 0 }}>
                <span style={{ fontWeight: 700, color: T.text }}>{total}</span> nutricionista{total !== 1 ? 's' : ''} encontrada{total !== 1 ? 's' : ''}
              </p>
            )}
          </section>

          {/* Filtros rápidos por especialidade */}
          {!finalSpec && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
              {SPECIALTIES.slice(0, 7).map(s => (
                <Link
                  key={s.slug}
                  to={cidade ? `/nutricionistas/${cidade}/${s.slug}` : `/nutricionistas/especialidade/${s.slug}`}
                  style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${T.border}`, background: T.white, color: T.text, textDecoration: 'none', fontSize: 13, fontWeight: 500 }}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          )}

          {/* Grade de profissionais */}
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : results.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <Search size={40} color={T.muted} style={{ marginBottom: 16 }} />
              <p style={{ fontSize: 16, fontWeight: 600, color: T.text, margin: '0 0 8px' }}>Nenhum profissional encontrado</p>
              <p style={{ fontSize: 14, color: T.muted, margin: '0 0 20px' }}>Tente uma busca diferente.</p>
              <Link to="/nutricionistas" style={{ padding: '10px 20px', background: T.brand, color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Ver todos</Link>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                {results.map(pro => <ProCard key={pro.id} pro={pro} />)}
              </div>
              {results.length < total && (
                <div style={{ textAlign: 'center', marginTop: 32 }}>
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    style={{ padding: '12px 28px', border: `1px solid ${T.border}`, borderRadius: 8, background: T.white, color: T.text, fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                  >
                    {loadingMore ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Carregando…</> : `Ver mais ${total - results.length}`}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Texto rico (SEO) */}
          <section style={{ marginTop: 48, padding: '28px 32px', background: T.white, borderRadius: 14, border: `1px solid ${T.border}` }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: '0 0 12px' }}>{intro.heading}</h2>
            <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.75, margin: 0 }}>{intro.body}</p>
          </section>

          {/* Links internos */}
          <InternalLinks spec={finalSpec} city={cidade} district={district} />

          {/* FAQ */}
          <section style={{ marginTop: 40 }} itemScope itemType="https://schema.org/FAQPage">
            <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text, margin: '0 0 20px' }}>Perguntas frequentes</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {faq.map((f, i) => (
                <details
                  key={i}
                  itemScope itemProp="mainEntity" itemType="https://schema.org/Question"
                  style={{ background: T.white, borderRadius: 10, border: `1px solid ${T.border}`, padding: '16px 20px' }}
                >
                  <summary itemProp="name" style={{ fontWeight: 600, fontSize: 15, color: T.text, cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {f.q} <ChevronRight size={16} color={T.muted} />
                  </summary>
                  <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                    <p itemProp="text" style={{ margin: '12px 0 0', fontSize: 14, color: T.muted, lineHeight: 1.7 }}>{f.a}</p>
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
