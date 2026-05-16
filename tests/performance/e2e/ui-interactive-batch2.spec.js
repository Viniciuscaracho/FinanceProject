/**
 * Batch 2: Transactions · Professionals · Services · Commissions
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

test('Batch 2 — Transactions · Professionals · Services · Commissions', async ({ browser }) => {
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

    // ── Transactions ─────────────────────────────────────────────────────────
    await p.goto(`${BASE}/transactions`)
    await p.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    await p.waitForTimeout(800)

    await p.click('[data-testid="new-transaction-btn"]')
    await p.waitForSelector('[data-testid="transaction-dialog"]', { timeout: 8000 })
    await p.waitForTimeout(600)
    await shotVp(p, `${suffix}-05-transactions-modal-novo`)
    await esc(p)

    // Editar primeira transação (se existir)
    const editTx = p.locator('[data-testid="transactions-page"]')
      .getByRole('button', { name: /editar/i }).first()
    if (await editTx.isVisible().catch(() => false)) {
      await editTx.click()
      await p.waitForSelector('[data-testid="edit-transaction-dialog"]', { timeout: 4000 })
      await p.waitForTimeout(600)
      await shotVp(p, `${suffix}-05-transactions-modal-editar`)
      await esc(p)
    }

    // ── Professionals ────────────────────────────────────────────────────────
    await p.goto(`${BASE}/professionals`)
    await p.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    await p.waitForTimeout(800)

    // Novo Profissional
    await p.click('[data-testid="new-professional-btn"]')
    await p.waitForSelector('[data-testid="professional-dialog"]', { timeout: 8000 })
    await p.waitForTimeout(600)
    await shotVp(p, `${suffix}-06-professionals-modal-novo`)
    await p.evaluate(() => {
      const d = document.querySelector('[data-testid="professional-dialog"]')
      if (d) d.scrollTop = d.scrollHeight
    })
    await p.waitForTimeout(400)
    await shotVp(p, `${suffix}-06-professionals-modal-novo-scroll`)
    await esc(p)

    // Horários do primeiro profissional
    const horariosBtn = p.getByRole('button', { name: /horários/i }).first()
    if (await horariosBtn.isVisible().catch(() => false)) {
      await horariosBtn.click()
      await p.waitForSelector('[data-testid="professional-schedule-dialog"]', { timeout: 6000 })
      await p.waitForTimeout(600)
      await shotVp(p, `${suffix}-06-professionals-modal-horarios`)
      await esc(p)
    }

    // ── Services ─────────────────────────────────────────────────────────────
    await p.goto(`${BASE}/services`)
    await p.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    await p.waitForTimeout(800)

    await p.click('[data-testid="new-service-btn"]')
    await p.waitForSelector('[data-testid="service-dialog"]', { timeout: 8000 })
    await p.waitForTimeout(600)
    await shotVp(p, `${suffix}-07-services-modal-novo`)
    await esc(p)

    // ── Commissions: expandir profissional ───────────────────────────────────
    await p.goto(`${BASE}/commissions`)
    await p.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    await p.waitForTimeout(900)

    const expandBtn = p.locator('button').filter({ has: p.locator('[data-lucide="chevron-down"]') }).first()
    if (await expandBtn.isVisible().catch(() => false)) {
      await expandBtn.click()
      await p.waitForTimeout(600)
      await shot(p, `${suffix}-09-commissions-expanded`)
    }

    await ctx.close()
  }
})
