/**
 * Batch 3: Reports · Imports · DocumentTemplates
 */
const { test } = require('@playwright/test')
const path = require('path')
const fs = require('fs')

const DIR = path.join(__dirname, '../screenshots/interactive')
const BASE = process.env.BASE_URL || 'http://localhost:5173'
const EMAIL = process.env.TEST_USER_EMAIL || 'admin@exemplo.com'
const PASS  = process.env.TEST_USER_PASSWORD || 'password'

test.beforeAll(() => fs.mkdirSync(DIR, { recursive: true }))

async function shot(page, name) {
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(DIR, `${name}.png`), fullPage: true })
  console.log('✓', name)
}
async function shotVp(page, name) {
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(DIR, `${name}.png`), fullPage: false })
  console.log('✓', name)
}
async function esc(page) {
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)
}

test('Batch 3 — Reports · Imports · DocumentTemplates', async ({ browser }) => {
  test.setTimeout(600_000)

  for (const [suffix, vp] of [['desktop', { width: 1280, height: 720 }], ['mobile', { width: 390, height: 844 }]]) {
    const ctx = await browser.newContext({ viewport: vp })
    const p = await ctx.newPage()

    // Login
    await p.goto(`${BASE}/login`)
    await p.waitForSelector('[data-testid="login-page"]', { timeout: 15000 })
    await p.fill('[data-testid="email-input"]', EMAIL)
    await p.fill('[data-testid="password-input"]', PASS)
    await p.click('[data-testid="login-button"]')
    await p.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 20000 }).catch(() => {})
    await p.waitForTimeout(1200)

    // ── Reports: aba Agendamentos ────────────────────────────────────────────
    await p.goto(`${BASE}/reports`)
    await p.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    await p.waitForTimeout(900)
    await shot(p, `${suffix}-10-reports-default`)

    const aptTab = p.getByRole('tab', { name: /agendamentos/i }).first()
    if (await aptTab.isVisible().catch(() => false)) {
      await aptTab.click()
      await p.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {})
      await p.waitForTimeout(800)
      await shot(p, `${suffix}-10-reports-tab-agendamentos`)
    }

    const finTab = p.getByRole('tab', { name: /financeiro|finan/i }).first()
    if (await finTab.isVisible().catch(() => false)) {
      await finTab.click()
      await p.waitForTimeout(800)
      await shot(p, `${suffix}-10-reports-tab-financeiro`)
    }

    // ── Imports: nova importação ─────────────────────────────────────────────
    await p.goto(`${BASE}/imports`)
    await p.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    await p.waitForTimeout(700)
    await shot(p, `${suffix}-11-imports-page`)

    const newImportBtn = p.locator('[data-testid="new-import-btn"]').first()
    if (await newImportBtn.isVisible().catch(() => false)) {
      await newImportBtn.click()
      await p.waitForSelector('[data-testid="import-dialog"]', { timeout: 8000 }).catch(() => {})
      await p.waitForTimeout(600)
      await shotVp(p, `${suffix}-11-imports-modal-novo`)
      await esc(p)
    }

    // ── Document Templates: form receipt + contract ───────────────────────────
    await p.goto(`${BASE}/document-templates/receipt/new`)
    await p.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    await p.waitForTimeout(800)
    await shot(p, `${suffix}-12-document-template-form-recibo`)

    await p.goto(`${BASE}/document-templates/contract/new`)
    await p.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    await p.waitForTimeout(800)
    await shot(p, `${suffix}-12-document-template-form-contrato`)

    // ── Document Templates: list page ─────────────────────────────────────────
    await p.goto(`${BASE}/document-templates`)
    await p.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    await p.waitForTimeout(800)
    await shot(p, `${suffix}-12-document-templates-list`)

    await ctx.close()
  }
})
