'use strict'

const express    = require('express')
const puppeteer  = require('puppeteer-core')
const { execSync } = require('child_process')

const PORT        = process.env.PORT || 3000
const TIMEOUT_MS  = parseInt(process.env.RENDER_TIMEOUT || '25000', 10)
const CACHE_TTL   = parseInt(process.env.CACHE_TTL_SECONDS || '3600', 10) * 1000

// ── Browser singleton ────────────────────────────────────────────────────────
let browser = null

async function getBrowser() {
  if (browser && browser.isConnected()) return browser
  const execPath = process.env.CHROME_PATH ||
    execSync('which chromium || which chromium-browser || which google-chrome || echo ""')
      .toString().trim() ||
    '/usr/bin/chromium'

  browser = await puppeteer.launch({
    executablePath: execPath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
    ],
  })
  browser.on('disconnected', () => { browser = null })
  console.log(`[prerender] browser started: ${execPath}`)
  return browser
}

// ── In-memory LRU cache ──────────────────────────────────────────────────────
const cache   = new Map()
const MAX_ENTRIES = 500

function cacheGet(key) {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL) { cache.delete(key); return null }
  return entry.html
}

function cacheSet(key, html) {
  if (cache.size >= MAX_ENTRIES) {
    // evict oldest
    const oldest = cache.keys().next().value
    cache.delete(oldest)
  }
  cache.set(key, { html, ts: Date.now() })
}

// ── Render ───────────────────────────────────────────────────────────────────
async function render(targetUrl) {
  const cached = cacheGet(targetUrl)
  if (cached) { console.log(`[prerender] cache hit: ${targetUrl}`); return cached }

  const b    = await getBrowser()
  const page = await b.newPage()

  try {
    await page.setExtraHTTPHeaders({ 'X-Prerender': '1' })
    await page.setRequestInterception(true)

    // Bloqueia recursos desnecessários para crawlers
    page.on('request', req => {
      const type = req.resourceType()
      if (['image', 'media', 'font', 'stylesheet'].includes(type)) {
        req.abort()
      } else {
        req.continue()
      }
    })

    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: TIMEOUT_MS })

    // Aguarda o React renderizar conteúdo principal
    await Promise.race([
      page.waitForSelector('h1', { timeout: 8000 }),
      new Promise(r => setTimeout(r, 8000)),
    ])

    // Injeta meta para indicar que é conteúdo pré-renderizado
    await page.evaluate(() => {
      const m = document.createElement('meta')
      m.name = 'prerendered'; m.content = 'true'
      document.head.appendChild(m)
    })

    const html = await page.content()
    cacheSet(targetUrl, html)
    console.log(`[prerender] rendered: ${targetUrl}`)
    return html
  } finally {
    await page.close().catch(() => {})
  }
}

// ── Screenshot cache (PNG) ───────────────────────────────────────────────────
const screenshotCache = new Map()
const SCREENSHOT_TTL  = 24 * 60 * 60 * 1000 // 24h

function screenshotCacheGet(key) {
  const entry = screenshotCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > SCREENSHOT_TTL) { screenshotCache.delete(key); return null }
  return entry.buf
}
function screenshotCacheSet(key, buf) {
  if (screenshotCache.size >= 200) {
    screenshotCache.delete(screenshotCache.keys().next().value)
  }
  screenshotCache.set(key, { buf, ts: Date.now() })
}

// ── HTTP server ──────────────────────────────────────────────────────────────
const app = express()

// Aquece o browser na inicialização
getBrowser().catch(e => console.error('[prerender] browser warmup failed:', e.message))

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', cacheSize: cache.size, screenshotCache: screenshotCache.size }))

// Limpar cache (útil após deploy)
app.delete('/cache', (_req, res) => {
  const size = cache.size + screenshotCache.size
  cache.clear(); screenshotCache.clear()
  res.json({ cleared: size })
})

// Screenshot — GET /screenshot?url=http://...&width=1200&height=630
app.get('/screenshot', async (req, res) => {
  const { url, width = '1200', height = '630' } = req.query
  if (!url) return res.status(400).json({ error: 'url required' })

  const cacheKey = `${url}__${width}x${height}`
  const cached = screenshotCacheGet(cacheKey)
  if (cached) {
    res.set('Content-Type', 'image/png')
    res.set('Cache-Control', 'public, max-age=86400')
    res.set('X-Screenshot-Cache', 'HIT')
    return res.send(cached)
  }

  const b    = await getBrowser()
  const page = await b.newPage()
  try {
    await page.setViewport({ width: parseInt(width, 10), height: parseInt(height, 10), deviceScaleFactor: 1 })
    await page.goto(url, { waitUntil: 'networkidle0', timeout: TIMEOUT_MS })

    // Aguarda o template sinalizar que está pronto
    await Promise.race([
      page.waitForSelector('[data-og-ready]', { timeout: 10000 }),
      new Promise(r => setTimeout(r, 10000)),
    ])

    const buf = await page.screenshot({ type: 'png' })
    screenshotCacheSet(cacheKey, buf)
    console.log(`[prerender] screenshot: ${url}`)

    res.set('Content-Type', 'image/png')
    res.set('Cache-Control', 'public, max-age=86400')
    res.set('X-Screenshot-Cache', 'MISS')
    res.send(buf)
  } finally {
    await page.close().catch(() => {})
  }
})

// Rota principal — recebe: GET /http://orbiproject_front:80/nutricionistas/sao-paulo
app.get('/*', async (req, res) => {
  // O Nginx reescreve para: /_prerender/path → /http://host/path
  const rawPath = req.url // ex: "/http://orbiproject_front:80/nutricionistas/sao-paulo"
  const targetUrl = rawPath.startsWith('/http') ? rawPath.slice(1) : `http://orbiproject_front:80${rawPath}`

  try {
    const html = await render(targetUrl)
    res.set('Content-Type', 'text/html; charset=utf-8')
    res.set('X-Prerender-Cache', cacheGet(targetUrl) ? 'HIT' : 'MISS')
    res.send(html)
  } catch (err) {
    console.error(`[prerender] error for ${targetUrl}:`, err.message)
    res.status(500).send(`Prerender error: ${err.message}`)
  }
})

app.listen(PORT, () => console.log(`[prerender] listening on :${PORT}`))
