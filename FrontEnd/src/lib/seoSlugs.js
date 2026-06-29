// Utilitários para slugs SEO das páginas de nutricionistas

export const SPECIALTIES = [
  { slug: 'emagrecimento',  label: 'Emagrecimento',   query: 'emagrecimento' },
  { slug: 'esportiva',      label: 'Esportiva',        query: 'esportiva' },
  { slug: 'saude-feminina', label: 'Saúde Feminina',   query: 'saúde feminina' },
  { slug: 'gestacao',       label: 'Gestação',         query: 'gestação' },
  { slug: 'infantil',       label: 'Infantil',         query: 'infantil' },
  { slug: 'online',         label: 'Online',           query: 'online' },
  { slug: 'vegetariana',    label: 'Vegetariana',      query: 'vegetariana' },
  { slug: 'hormonal',       label: 'Hormonal',         query: 'hormonal' },
  { slug: 'diabetes',       label: 'Diabetes',         query: 'diabetes' },
  { slug: 'bariatrica',     label: 'Bariátrica',       query: 'bariátrica' },
  { slug: 'vegana',         label: 'Vegana',           query: 'vegana' },
]

export const SPECIALTY_SLUGS = new Set(SPECIALTIES.map(s => s.slug))

export const CITIES = [
  { slug: 'sao-paulo',              label: 'São Paulo',              query: 'São Paulo' },
  { slug: 'campinas',               label: 'Campinas',               query: 'Campinas' },
  { slug: 'guarulhos',              label: 'Guarulhos',              query: 'Guarulhos' },
  { slug: 'santo-andre',            label: 'Santo André',            query: 'Santo André' },
  { slug: 'sao-bernardo-do-campo',  label: 'São Bernardo do Campo',  query: 'São Bernardo do Campo' },
  { slug: 'osasco',                 label: 'Osasco',                 query: 'Osasco' },
  { slug: 'diadema',                label: 'Diadema',                query: 'Diadema' },
  { slug: 'sao-jose-dos-campos',    label: 'São José dos Campos',    query: 'São José dos Campos' },
  { slug: 'sorocaba',               label: 'Sorocaba',               query: 'Sorocaba' },
  { slug: 'ribeirao-preto',         label: 'Ribeirão Preto',         query: 'Ribeirão Preto' },
  { slug: 'santos',                 label: 'Santos',                 query: 'Santos' },
  { slug: 'taubate',                label: 'Taubaté',                query: 'Taubaté' },
]

export const SP_NEIGHBORHOODS = [
  { slug: 'moema',            label: 'Moema' },
  { slug: 'pinheiros',        label: 'Pinheiros' },
  { slug: 'vila-mariana',     label: 'Vila Mariana' },
  { slug: 'itaim-bibi',       label: 'Itaim Bibi' },
  { slug: 'jardins',          label: 'Jardins' },
  { slug: 'higienopolis',     label: 'Higienópolis' },
  { slug: 'morumbi',          label: 'Morumbi' },
  { slug: 'perdizes',         label: 'Perdizes' },
  { slug: 'vila-olimpia',     label: 'Vila Olímpia' },
  { slug: 'consolacao',       label: 'Consolação' },
  { slug: 'paraiso',          label: 'Paraíso' },
  { slug: 'aclimacao',        label: 'Aclimação' },
  { slug: 'santana',          label: 'Santana' },
  { slug: 'lapa',             label: 'Lapa' },
  { slug: 'tatuape',          label: 'Tatuapé' },
  { slug: 'campo-belo',       label: 'Campo Belo' },
  { slug: 'ipiranga',         label: 'Ipiranga' },
  { slug: 'jabaquara',        label: 'Jabaquara' },
  { slug: 'santo-amaro',      label: 'Santo Amaro' },
  { slug: 'butanta',          label: 'Butantã' },
]

export function slugToLabel(slug, list) {
  return list.find(i => i.slug === slug)?.label || toTitleCase(slug.replace(/-/g, ' '))
}

export function slugToQuery(slug, list) {
  return list.find(i => i.slug === slug)?.query || toTitleCase(slug.replace(/-/g, ' '))
}

export function nameToSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function profileSlug(name, id) {
  return `${nameToSlug(name)}-${id}`
}

export function profileIdFromSlug(slug) {
  const parts = slug.split('-')
  return parseInt(parts[parts.length - 1], 10)
}

function toTitleCase(str) {
  return str.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.slice(1))
}

export function isSpecialtySlug(slug) {
  return SPECIALTY_SLUGS.has(slug)
}
