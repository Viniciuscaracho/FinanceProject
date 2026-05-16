/**
 * Batch 1: Appointments (tabs + modal) · AppointmentLinks (novo, QR, editar) · Contacts (novo, editar)
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

test('Batch 1 — Appointments · Links · Contacts', async ({ browser }) => {
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

    // ── Appointments: 3 tabs ─────────────────────────────────────────────────
    await p.goto(`${BASE}/appointments`)
    await p.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    await p.waitForTimeout(800)

    await p.getByRole('tab', { name: 'Lista' }).click()
    await p.waitForTimeout(700)
    await shot(p, `${suffix}-02-appointments-lista`)

    await p.getByRole('tab', { name: /anota|notas/i }).click()
    await p.waitForTimeout(700)
    await shot(p, `${suffix}-02-appointments-anotacoes`)

    // Novo Agendamento modal
    await p.click('[data-testid="new-appointment-btn"]')
    await p.waitForSelector('[role="dialog"]', { timeout: 8000 })
    await p.waitForTimeout(600)
    await shotVp(p, `${suffix}-02-appointments-modal-novo`)
    await p.evaluate(() => {
      const d = document.querySelector('[role="dialog"]')
      if (d) d.scrollTop = d.scrollHeight
    })
    await p.waitForTimeout(400)
    await shotVp(p, `${suffix}-02-appointments-modal-novo-scroll`)
    await esc(p)

    // ── AppointmentLinks ─────────────────────────────────────────────────────
    await p.goto(`${BASE}/appointment-links`)
    await p.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    await p.waitForTimeout(700)

    // Novo Link
    await p.click('[data-testid="new-link-btn"]')
    await p.waitForSelector('[data-testid="appointment-link-dialog"]', { timeout: 8000 })
    await p.waitForTimeout(600)
    await shotVp(p, `${suffix}-03-links-modal-novo`)
    await p.evaluate(() => {
      const d = document.querySelector('[data-testid="appointment-link-dialog"]')
      if (d) d.scrollTop = d.scrollHeight
    })
    await p.waitForTimeout(400)
    await shotVp(p, `${suffix}-03-links-modal-novo-scroll`)
    await esc(p)

    // QR dialog (só se existirem links)
    const qrBtn = p.locator('button[title="Ver QR Code"]').first()
    if (await qrBtn.isVisible().catch(() => false)) {
      await qrBtn.click()
      await p.waitForSelector('[role="dialog"]', { timeout: 4000 })
      await p.waitForTimeout(700)
      await shotVp(p, `${suffix}-03-links-modal-qr`)
      await esc(p)
    }

    // ── Contacts ─────────────────────────────────────────────────────────────
    await p.goto(`${BASE}/contacts`)
    await p.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    await p.waitForTimeout(700)

    await p.click('[data-testid="new-contact-btn"]')
    await p.waitForSelector('[data-testid="contact-dialog"]', { timeout: 8000 })
    await p.waitForTimeout(600)
    await shotVp(p, `${suffix}-04-contacts-modal-novo`)
    await esc(p)

    // Editar primeiro contato, se existir
    const editBtn = p.locator('[data-testid="contacts-page"]')
      .getByRole('button', { name: /editar/i }).first()
    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click()
      await p.waitForSelector('[data-testid="edit-contact-dialog"]', { timeout: 4000 })
      await p.waitForTimeout(600)
      await shotVp(p, `${suffix}-04-contacts-modal-editar`)
      await esc(p)
    }

    await ctx.close()
  }
})
