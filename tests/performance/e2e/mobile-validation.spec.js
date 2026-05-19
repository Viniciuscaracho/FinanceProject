/**
 * VALIDAÇÃO MOBILE — ORBI
 * ─────────────────────────────────────────────────────────────────────────────
 * Valida layout responsivo em viewport de smartphone (390×844 — iPhone 14 Pro).
 * Cobre: autenticação, dashboard, agendamentos, contatos, transações,
 *        serviços, profissionais, relatórios, configurações.
 *
 * Métricas coletadas por tela:
 *   • LCP  (Largest Contentful Paint)
 *   • CLS  (Cumulative Layout Shift)
 *   • FCP  (First Contentful Paint)
 *
 * Execute:
 *   cd tests/performance
 *   npx playwright test e2e/mobile-validation.spec.js \
 *     --config=mobile.config.js --reporter=list
 */

const { test, expect } = require('@playwright/test')
const path = require('path')
const fs   = require('fs')

const DIR   = path.join(__dirname, '../screenshots/mobile')
const BASE  = process.env.BASE_URL           || 'http://localhost:5173'
const EMAIL = process.env.TEST_USER_EMAIL    || 'admin@exemplo.com'
const PASS  = process.env.TEST_USER_PASSWORD || 'password'

// Limiares — mobile é mais lento, thresholds mais generosos
const P = {
  lcp:     4500,   // ms
  cls:     0.15,   // score
  fcp:     3000,   // ms
  load:    6000,   // ms para navegação completa
}

test.beforeAll(() => fs.mkdirSync(DIR, { recursive: true }))

// ── Helpers ────────────────────────────────────────────────────────────────────
async function shot(page, name) {
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(DIR, `${name}.png`), fullPage: true })
  console.log(`  📸 ${name}`)
}

async function login(page) {
  await page.goto(`${BASE}/login`)
  await page.waitForSelector('[data-testid="login-page"]', { timeout: 20_000 })
  await page.fill('[data-testid="email-input"]',  EMAIL)
  await page.fill('[data-testid="password-input"]', PASS)
  await page.click('[data-testid="login-button"]')
  await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 20_000 })
  await page.waitForTimeout(800)
}

async function measureVitals(page) {
  return page.evaluate(() => new Promise(resolve => {
    const result = { lcp: null, cls: 0, fcp: null }
    const observers = []

    const lcpObs = new PerformanceObserver(list => {
      const entries = list.getEntries()
      if (entries.length) result.lcp = entries[entries.length - 1].startTime
    })
    lcpObs.observe({ type: 'largest-contentful-paint', buffered: true })
    observers.push(lcpObs)

    const clsObs = new PerformanceObserver(list => {
      for (const e of list.getEntries()) {
        if (!e.hadRecentInput) result.cls += e.value
      }
    })
    clsObs.observe({ type: 'layout-shift', buffered: true })
    observers.push(clsObs)

    const fcpObs = new PerformanceObserver(list => {
      const e = list.getEntriesByName('first-contentful-paint')[0]
      if (e) result.fcp = e.startTime
    })
    fcpObs.observe({ type: 'paint', buffered: true })
    observers.push(fcpObs)

    setTimeout(() => {
      observers.forEach(o => { try { o.disconnect() } catch {} })
      resolve(result)
    }, 2000)
  }))
}

function reportVitals(label, vitals) {
  const lcpStatus = vitals.lcp === null ? '?' : vitals.lcp < 2500 ? '✅' : vitals.lcp < P.lcp ? '⚠️' : '❌'
  const clsStatus = vitals.cls < 0.1 ? '✅' : vitals.cls < P.cls ? '⚠️' : '❌'
  const fcpStatus = vitals.fcp === null ? '?' : vitals.fcp < 1800 ? '✅' : vitals.fcp < P.fcp ? '⚠️' : '❌'
  console.log(`  📊 ${label}`)
  console.log(`     LCP: ${vitals.lcp ? Math.round(vitals.lcp) + 'ms' : 'n/d'} ${lcpStatus}`)
  console.log(`     CLS: ${vitals.cls.toFixed(3)} ${clsStatus}`)
  console.log(`     FCP: ${vitals.fcp ? Math.round(vitals.fcp) + 'ms' : 'n/d'} ${fcpStatus}`)
}

async function checkVisible(page, selector, label) {
  const ok = await page.locator(selector).first().isVisible({ timeout: 5000 }).catch(() => false)
  console.log(`  ${ok ? '✅' : '❌'} ${label}`)
  return ok
}

// ── Testes ─────────────────────────────────────────────────────────────────────

test('01 — Login mobile: layout e usabilidade', async ({ page }) => {
  await page.goto(`${BASE}/login`)
  await page.waitForSelector('[data-testid="login-page"]', { timeout: 20_000 })
  await shot(page, '01-login')

  // Campos devem ser acessíveis em mobile
  const email = page.locator('[data-testid="email-input"]')
  const pass  = page.locator('[data-testid="password-input"]')
  const btn   = page.locator('[data-testid="login-button"]')

  await expect(email).toBeVisible()
  await expect(pass).toBeVisible()
  await expect(btn).toBeVisible()

  // Verificar que não há scroll horizontal (overflow-x)
  const bodyWidth   = await page.evaluate(() => document.body.scrollWidth)
  const windowWidth = await page.evaluate(() => window.innerWidth)
  console.log(`  📐 scrollWidth: ${bodyWidth}px, viewport: ${windowWidth}px`)
  expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 2) // +2 px de tolerância

  // Link "Esqueci minha senha"
  const forgotLink = await page.locator('button:has-text("Esqueci")').isVisible({ timeout: 3000 }).catch(() => false)
  console.log(`  ${forgotLink ? '✅' : '⚠️'} Link "Esqueci minha senha"`)

  const vitals = await measureVitals(page)
  reportVitals('Login', vitals)
})

test('02 — Dashboard mobile: hero, ações rápidas, painéis', async ({ page }) => {
  await login(page)
  await page.goto(`${BASE}/`)
  await page.waitForSelector('[data-testid="dashboard"]', { timeout: 30_000 })
  await page.waitForTimeout(2000) // aguarda renderização completa + API calls

  const vitals = await measureVitals(page)
  reportVitals('Dashboard', vitals)

  await shot(page, '02-dashboard-top')

  // Hero deve estar visível
  await checkVisible(page, '[data-testid="dashboard"]', 'Dashboard container')

  // Verificar overflow horizontal
  const bodyWidth   = await page.evaluate(() => document.body.scrollWidth)
  const windowWidth = await page.evaluate(() => window.innerWidth)
  console.log(`  📐 scrollWidth: ${bodyWidth}px, viewport: ${windowWidth}px`)
  expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 2)

  // CLS deve estar dentro do limite
  if (vitals.cls > P.cls) {
    console.warn(`  ⚠️  CLS alto no dashboard: ${vitals.cls.toFixed(3)} (limite: ${P.cls})`)
  }
  expect(vitals.cls).toBeLessThan(P.cls)

  // LCP
  if (vitals.lcp && vitals.lcp > P.lcp) {
    console.warn(`  ⚠️  LCP alto: ${Math.round(vitals.lcp)}ms`)
  }

  // Scroll para ver painéis abaixo do hero
  await page.evaluate(() => window.scrollTo(0, 400))
  await shot(page, '02-dashboard-panels')
})

test('03 — Agendamentos mobile: lista e header', async ({ page }) => {
  await login(page)
  const t0 = Date.now()
  await page.goto(`${BASE}/appointments`)
  await page.waitForTimeout(2000)
  const loadTime = Date.now() - t0
  console.log(`  ⏱  Agendamentos carregou em: ${loadTime}ms`)

  await shot(page, '03-appointments')

  const bodyWidth   = await page.evaluate(() => document.body.scrollWidth)
  const windowWidth = await page.evaluate(() => window.innerWidth)
  expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 2)

  const vitals = await measureVitals(page)
  reportVitals('Agendamentos', vitals)
  // Agendamentos tem layout mais complexo (calendario/lista) — threshold levemente maior
  if (vitals.cls >= 0.25) {
    throw new Error(`CLS crítico em Agendamentos: ${vitals.cls.toFixed(3)} (limite: 0.25)`)
  }
  console.log(`  ${vitals.cls < 0.1 ? '✅' : vitals.cls < 0.25 ? '⚠️' : '❌'} CLS Agendamentos: ${vitals.cls.toFixed(3)}`)
})

test('04 — Contatos mobile: grid e skeleton', async ({ page }) => {
  await login(page)
  await page.goto(`${BASE}/contacts`)
  await page.waitForTimeout(2000)

  await shot(page, '04-contacts')

  // Sem overflow horizontal
  const bodyWidth   = await page.evaluate(() => document.body.scrollWidth)
  const windowWidth = await page.evaluate(() => window.innerWidth)
  expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 2)

  // Skeleton ou cards de contato visíveis
  const hasSkeleton = await page.locator('[style*="animation"]').count() > 0
  const hasCards    = await page.locator('button, [role="button"]').count() > 0
  console.log(`  ${hasSkeleton || hasCards ? '✅' : '⚠️'} Conteúdo ou skeleton presente`)

  const vitals = await measureVitals(page)
  reportVitals('Contatos', vitals)
  expect(vitals.cls).toBeLessThan(P.cls)
})

test('05 — Transações mobile: lista e filtros', async ({ page }) => {
  await login(page)
  await page.goto(`${BASE}/transactions`)
  await page.waitForTimeout(2000)

  await shot(page, '05-transactions')

  const bodyWidth   = await page.evaluate(() => document.body.scrollWidth)
  const windowWidth = await page.evaluate(() => window.innerWidth)
  expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 2)

  const vitals = await measureVitals(page)
  reportVitals('Transações', vitals)
  expect(vitals.cls).toBeLessThan(P.cls)
})

test('06 — Relatórios mobile: gráficos e filtros', async ({ page }) => {
  await login(page)
  await page.goto(`${BASE}/reports`)
  await page.waitForTimeout(2500)

  await shot(page, '06-reports')

  const bodyWidth   = await page.evaluate(() => document.body.scrollWidth)
  const windowWidth = await page.evaluate(() => window.innerWidth)
  expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 2)

  const vitals = await measureVitals(page)
  reportVitals('Relatórios', vitals)
  expect(vitals.cls).toBeLessThan(P.cls)
})

test('07 — Serviços mobile', async ({ page }) => {
  await login(page)
  await page.goto(`${BASE}/services`)
  await page.waitForTimeout(2000)

  await shot(page, '07-services')

  const bodyWidth   = await page.evaluate(() => document.body.scrollWidth)
  const windowWidth = await page.evaluate(() => window.innerWidth)
  expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 2)

  const vitals = await measureVitals(page)
  reportVitals('Serviços', vitals)
})

test('08 — Profissionais mobile', async ({ page }) => {
  await login(page)
  await page.goto(`${BASE}/professionals`)
  await page.waitForTimeout(2000)

  await shot(page, '08-professionals')

  const bodyWidth   = await page.evaluate(() => document.body.scrollWidth)
  const windowWidth = await page.evaluate(() => window.innerWidth)
  expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 2)

  const vitals = await measureVitals(page)
  reportVitals('Profissionais', vitals)
})

test('09 — Configurações da empresa mobile', async ({ page }) => {
  await login(page)
  await page.goto(`${BASE}/company-settings`)
  await page.waitForTimeout(2000)

  await shot(page, '09-company-settings')

  const bodyWidth   = await page.evaluate(() => document.body.scrollWidth)
  const windowWidth = await page.evaluate(() => window.innerWidth)
  expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 2)

  const vitals = await measureVitals(page)
  reportVitals('Configurações', vitals)
})

test('10 — Navegação mobile: sidebar e menu', async ({ page }) => {
  await login(page)
  await page.goto(`${BASE}/`)
  await page.waitForTimeout(1200)

  await shot(page, '10-nav-inicial')

  // No mobile, o botão hamburger fica no Header com aria-label="Abrir menu"
  // (a sidebar fica no DOM mas off-screen via transform: translateX(-100%))
  const hamburger = page.locator('button[aria-label="Abrir menu"]')
  const hasHamburger = await hamburger.isVisible({ timeout: 3000 }).catch(() => false)

  if (hasHamburger) {
    await hamburger.click()
    await page.waitForTimeout(600) // aguarda animação de 280ms
    await shot(page, '10-nav-aberto')
    console.log('  ✅ Menu hamburger encontrado e aberto')

    // Verifica que a sidebar deslizou para dentro da viewport
    const sidebar = page.locator('nav, aside').first()
    const sidebarVisible = await sidebar.isVisible({ timeout: 2000 }).catch(() => false)
    console.log(`  ${sidebarVisible ? '✅' : '⚠️'} Sidebar visível após abertura`)
  } else {
    console.log('  ℹ️  Botão hamburger não encontrado — pode ser bottom nav ou outra variação')
    await shot(page, '10-nav-layout')
  }

  // Verifica BottomNavigation (navegação mobile alternativa)
  const hasBottomNav = await page.locator('[class*="bottom"], [data-testid*="bottom"]').isVisible({ timeout: 2000 }).catch(() => false)
  console.log(`  ${hasHamburger || hasBottomNav ? '✅' : '⚠️'} Algum sistema de navegação presente`)
})

test('11 — Perfil de paciente mobile', async ({ page }) => {
  await login(page)
  await page.goto(`${BASE}/contacts`)
  await page.waitForTimeout(2000)

  // Aguardar conteúdo carregar e tentar clicar no primeiro card de contato
  await page.waitForTimeout(2000)
  // Usa seletor mais específico para evitar pegar botões fora da viewport (sidebar off-screen)
  const firstContact = page.locator('[data-testid="contacts-page"] button, [data-testid="contact-card"]').first()
  const hasContact   = await firstContact.isVisible({ timeout: 3000 }).catch(() => false)

  if (hasContact) {
    await firstContact.click({ timeout: 10_000 })
    await page.waitForTimeout(1500)
    await shot(page, '11-patient-profile')
    console.log('  ✅ Perfil de paciente acessado')
  } else {
    await shot(page, '11-contacts-list')
    console.log('  ℹ️  Sem contatos com testid, capturando tela')
  }

  const bodyWidth   = await page.evaluate(() => document.body.scrollWidth)
  const windowWidth = await page.evaluate(() => window.innerWidth)
  expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 2)
})

test('12 — Performance geral mobile: Web Vitals consolidado', async ({ page }) => {
  const results = []

  const routes = [
    { path: '/',             label: 'Dashboard'     },
    { path: '/appointments', label: 'Agendamentos'  },
    { path: '/contacts',     label: 'Contatos'      },
    { path: '/transactions', label: 'Transações'    },
    { path: '/reports',      label: 'Relatórios'    },
  ]

  await login(page)

  for (const r of routes) {
    await page.goto(`${BASE}${r.path}`)
    await page.waitForTimeout(2200)
    const vitals = await measureVitals(page)
    results.push({ ...r, ...vitals })
  }

  console.log('\n  ┌─────────────────────────────────────────────────────────')
  console.log('  │  RESUMO MOBILE — Web Vitals')
  console.log('  ├────────────────────┬──────────┬──────────┬──────────')
  console.log('  │ Tela               │  LCP     │  CLS     │  FCP')
  console.log('  ├────────────────────┼──────────┼──────────┼──────────')
  for (const r of results) {
    const lcp = r.lcp ? `${Math.round(r.lcp)}ms` : ' n/d'
    const cls = r.cls.toFixed(3)
    const fcp = r.fcp ? `${Math.round(r.fcp)}ms` : ' n/d'
    const lcpOk = !r.lcp || r.lcp < P.lcp ? '✅' : '❌'
    const clsOk = r.cls < P.cls ? '✅' : '❌'
    console.log(`  │ ${r.label.padEnd(19)}│ ${lcpOk} ${lcp.padStart(6)}  │ ${clsOk} ${cls}  │ ${fcp}`)
  }
  console.log('  └─────────────────────────────────────────────────────────\n')

  // Dashboard CLS deve estar dentro do limite após as correções
  const dash = results.find(r => r.label === 'Dashboard')
  if (dash) {
    console.log(`  Dashboard CLS: ${dash.cls.toFixed(3)} (meta: < ${P.cls})`)
    expect(dash.cls).toBeLessThan(P.cls)
  }

  await shot(page, '12-perf-final-state')
})
