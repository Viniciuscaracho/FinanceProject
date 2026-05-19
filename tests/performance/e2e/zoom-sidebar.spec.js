/**
 * VALIDAÇÃO — ZOOM E SIDEBAR ABERTO
 * ─────────────────────────────────────────────────────────────────────────────
 * Testa o layout em diferentes níveis de zoom e com o sidebar expandido.
 *
 * Zoom simulado reduzindo o viewport (comportamento real do browser ao dar zoom):
 *   100% → 1280×800  (baseline)
 *   110% → 1164×727
 *   125% → 1024×640
 *   150% →  853×533
 *
 * Para cada zoom:
 *   - Sidebar colapsado (ícones)
 *   - Sidebar expandido (largura completa)
 *   - Dashboard, Agendamentos, Contatos, Transações, Relatórios
 *
 * Execute:
 *   cd tests/performance
 *   npx playwright test e2e/zoom-sidebar.spec.js \
 *     --config=headed.config.js --reporter=list
 */

const { test, expect } = require('@playwright/test')
const path = require('path')
const fs   = require('fs')

const DIR   = path.join(__dirname, '../screenshots/zoom-sidebar')
const BASE  = process.env.BASE_URL           || 'http://localhost:5173'
const EMAIL = process.env.TEST_USER_EMAIL    || 'admin@exemplo.com'
const PASS  = process.env.TEST_USER_PASSWORD || 'password'

// Zoom levels: [label, viewport_width, viewport_height]
const ZOOMS = [
  { label: '100',  w: 1280, h: 800  },
  { label: '110',  w: 1164, h: 727  },
  { label: '125',  w: 1024, h: 640  },
  { label: '150',  w:  853, h: 533  },
]

const ROUTES = [
  { slug: 'dashboard',      path: '/',               testid: 'dashboard'         },
  { slug: 'appointments',   path: '/appointments',   testid: 'appointments-page' },
  { slug: 'contacts',       path: '/contacts',       testid: 'contacts-page'     },
  { slug: 'transactions',   path: '/transactions',   testid: 'transactions-page' },
  { slug: 'reports',        path: '/reports',        testid: null                },
]

test.beforeAll(() => fs.mkdirSync(DIR, { recursive: true }))

async function login(page) {
  await page.goto(`${BASE}/login`)
  await page.waitForSelector('[data-testid="login-page"]', { timeout: 20_000 })
  await page.fill('[data-testid="email-input"]',  EMAIL)
  await page.fill('[data-testid="password-input"]', PASS)
  await page.click('[data-testid="login-button"]')
  await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 30_000 })
  await page.waitForTimeout(800)
}

async function shot(page, name) {
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(DIR, `${name}.png`), fullPage: false })
  console.log(`    📸 ${name}`)
}

async function checkOverflow(page, label) {
  const result = await page.evaluate(() => ({
    bodyW:   document.body.scrollWidth,
    windowW: window.innerWidth,
    bodyH:   document.body.scrollHeight,
  }))
  const overflowX = result.bodyW > result.windowW + 2
  console.log(`    ${overflowX ? '❌' : '✅'} ${label}: scrollWidth=${result.bodyW}px viewport=${result.windowW}px${overflowX ? ' ← OVERFLOW HORIZONTAL!' : ''}`)
  return !overflowX
}

async function checkClip(page, label) {
  // Verifica se algum elemento importante está fora da viewport horizontalmente
  const clipped = await page.evaluate(() => {
    const vw = window.innerWidth
    const candidates = [
      'header', 'nav', 'main', 'h1', 'h2',
      '[data-testid]', 'button', 'input',
    ]
    const issues = []
    for (const sel of candidates) {
      const els = document.querySelectorAll(sel)
      for (const el of els) {
        const r = el.getBoundingClientRect()
        if (r.width > 0 && r.height > 0 && r.right > vw + 4) {
          issues.push({ tag: el.tagName, text: (el.textContent || '').trim().slice(0, 40), right: Math.round(r.right), vw })
        }
      }
    }
    return issues.slice(0, 5)
  })
  if (clipped.length > 0) {
    console.log(`    ⚠️  ${label}: ${clipped.length} elemento(s) cortado(s):`)
    clipped.forEach(c => console.log(`       → <${c.tag}> "${c.text}" right=${c.right}px > vw=${c.vw}px`))
  } else {
    console.log(`    ✅ ${label}: nenhum elemento cortado`)
  }
  return clipped.length === 0
}

// ── Testes por nível de zoom ────────────────────────────────────────────────

for (const zoom of ZOOMS) {
  test.describe(`Zoom ${zoom.label}% (${zoom.w}×${zoom.h}px)`, () => {

    test(`sidebar colapsado — telas principais`, async ({ page }) => {
      await page.setViewportSize({ width: zoom.w, height: zoom.h })
      await login(page)

      // No breakpoint < 1536px o sidebar inicia colapsado (só ícones)
      const isMobile = zoom.w < 768

      console.log(`\n  ── Zoom ${zoom.label}% sidebar colapsado ──`)

      for (const route of ROUTES) {
        await page.goto(`${BASE}${route.path}`)
        if (route.testid) {
          await page.waitForSelector(`[data-testid="${route.testid}"]`, { timeout: 15_000 }).catch(() => {})
        }
        await page.waitForTimeout(1200)

        await checkOverflow(page, route.slug)
        await checkClip(page, route.slug)
        await shot(page, `z${zoom.label}-col-${route.slug}`)
      }
    })

    test(`sidebar expandido — telas principais`, async ({ page }) => {
      test.skip(zoom.w < 768, 'sidebar expandido só faz sentido em desktop')

      await page.setViewportSize({ width: zoom.w, height: zoom.h })
      await login(page)
      await page.goto(`${BASE}/`)
      await page.waitForSelector('[data-testid="dashboard"]', { timeout: 15_000 })
      await page.waitForTimeout(800)

      // Expande sidebar clicando no toggle (ChevronRight quando colapsado)
      const toggleBtn = page.locator('header').locator('..').locator('button').first()
      // Tenta via sidebar toggle button (ChevronRight / ChevronLeft)
      const sidebarToggle = page.locator('button:has(svg)').filter({ hasText: '' }).first()

      // Método mais robusto: forçar via localStorage e recarregar
      await page.evaluate(() => {
        localStorage.setItem('sidebar_collapsed', 'false')
        localStorage.setItem('orbi_config_nav', 'true')
        localStorage.setItem('orbi_advanced_nav', 'true')
      })

      // Encontrar e clicar no botão de toggle do sidebar (ChevronRight/Left)
      // O sidebar desktop tem o botão com ChevronLeft (quando expandido) ou ChevronRight (colapsado)
      const chevronBtn = page.locator('nav').locator('button').first()
      const headerArea = page.locator('[style*="position: fixed"][style*="left: 0"][style*="top: 0"]').first()

      // Abordagem direta: encontrar o botão de toggle via aria ou texto vazio no header do sidebar
      const sidebarHeader = page.locator('div').filter({ hasText: /^Orbi$/ }).first()

      console.log(`\n  ── Zoom ${zoom.label}% sidebar expandido ──`)

      // Verifica estado atual do sidebar (colapsado = narrow, expandido = largo)
      const sidebarWidth = await page.evaluate(() => {
        // Procura o elemento do sidebar (fixed, left 0)
        const candidates = document.querySelectorAll('[style*="position: fixed"]')
        for (const el of candidates) {
          const s = el.style
          if (s.left === '0px' && (s.top === '0px' || s.top === '')) {
            return el.getBoundingClientRect().width
          }
        }
        return null
      })
      console.log(`    ℹ️  Sidebar width: ${sidebarWidth}px`)

      // Se colapsado (56px), tenta expandir
      if (sidebarWidth !== null && sidebarWidth < 100) {
        // Clica no botão ChevronRight dentro do sidebar header
        const expandBtn = page.locator('button').filter({ hasText: '' }).nth(1)
        try {
          // Clica na área do sidebar header (onde fica o toggle button)
          await page.locator('button[title]').first().click({ timeout: 3000 }).catch(() => {})
          // Se não funcionou, tenta por posição (sidebar header esquerdo)
          await page.click(`[style*="position: fixed"][style*="left: 0"] button`, { timeout: 3000 }).catch(() => {})
          await page.waitForTimeout(400)
        } catch {}
      }

      for (const route of ROUTES) {
        await page.goto(`${BASE}${route.path}`)
        if (route.testid) {
          await page.waitForSelector(`[data-testid="${route.testid}"]`, { timeout: 15_000 }).catch(() => {})
        }
        await page.waitForTimeout(1200)

        await checkOverflow(page, route.slug)
        await checkClip(page, route.slug)
        await shot(page, `z${zoom.label}-exp-${route.slug}`)
      }
    })

  })
}

// ── Teste de sidebar desktop: estados colapsado vs expandido lado a lado ────

test('sidebar desktop: validação visual colapsado → expandido', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await login(page)
  await page.goto(`${BASE}/`)
  await page.waitForSelector('[data-testid="dashboard"]', { timeout: 15_000 })
  await page.waitForTimeout(1000)

  // Captura sidebar colapsado
  await shot(page, 'sidebar-colapsado-1280')
  await checkOverflow(page, 'dashboard colapsado')
  await checkClip(page, 'dashboard colapsado')

  // Encontra e clica no toggle do sidebar (botão com chevron dentro do sidebar fixo)
  const toggleResult = await page.evaluate(() => {
    // Procura o sidebar fixed element
    const sidebars = Array.from(document.querySelectorAll('div[style]')).filter(el => {
      const s = el.style
      return s.position === 'fixed' && s.left === '0px' && s.top === '0px'
    })
    if (sidebars.length === 0) return 'sidebar não encontrado'
    const btn = sidebars[0].querySelector('button')
    if (btn) { btn.click(); return 'clicado' }
    return 'botão não encontrado'
  })
  console.log(`  ℹ️  Toggle sidebar: ${toggleResult}`)
  await page.waitForTimeout(400)

  await shot(page, 'sidebar-expandido-1280')
  await checkOverflow(page, 'dashboard expandido')
  await checkClip(page, 'dashboard expandido')

  // Verifica sidebar em outras páginas com sidebar expandido
  for (const route of ROUTES.slice(0, 3)) {
    await page.goto(`${BASE}${route.path}`)
    if (route.testid) {
      await page.waitForSelector(`[data-testid="${route.testid}"]`, { timeout: 12_000 }).catch(() => {})
    }
    await page.waitForTimeout(1000)
    await checkOverflow(page, `${route.slug} (expandido)`)
    await checkClip(page, `${route.slug} (expandido)`)
    await shot(page, `sidebar-exp-${route.slug}`)
  }
})

// ── Teste específico de zoom 150% onde o sidebar colapsa ───────────────────

test('zoom 150% — verificar que sidebar não sobrepõe conteúdo', async ({ page }) => {
  await page.setViewportSize({ width: 853, height: 533 })
  await login(page)

  const routes = ['/', '/appointments', '/contacts', '/transactions']
  console.log('\n  ── Zoom 150% (853px) — verificação de sobreposição ──')

  for (const path_ of routes) {
    await page.goto(`${BASE}${path_}`)
    await page.waitForTimeout(1500)

    // Verifica sobreposição: sidebar fixed não deve ultrapassar o conteúdo principal
    const overlap = await page.evaluate(() => {
      const sidebar = Array.from(document.querySelectorAll('div[style]')).find(el => {
        const s = el.style
        return s.position === 'fixed' && s.left === '0px' && s.top === '0px' && !s.transform
      })
      if (!sidebar) return { sidebarW: 0, marginLeft: 0, ok: true }

      const sidebarW = sidebar.getBoundingClientRect().width
      const main = document.querySelector('main')
      const mainMarginLeft = main ? parseInt(window.getComputedStyle(main.parentElement || main).marginLeft) : 0

      return {
        sidebarW: Math.round(sidebarW),
        marginLeft: mainMarginLeft,
        ok: mainMarginLeft >= sidebarW - 2,
      }
    })

    const slug = path_.replace('/', '') || 'dashboard'
    console.log(`    ${overlap.ok ? '✅' : '❌'} ${slug}: sidebar=${overlap.sidebarW}px marginLeft=${overlap.marginLeft}px`)

    await checkOverflow(page, slug)
    await shot(page, `z150-overlap-${slug || 'dashboard'}`)
  }
})
