const { test } = require('@playwright/test')
const path = require('path')
const fs = require('fs')

const SCREENS_DIR = path.join(__dirname, '../screenshots/interactive')
const BASE = process.env.BASE_URL || 'http://localhost:5173'
const EMAIL = process.env.TEST_USER_EMAIL || 'admin@exemplo.com'
const PASSWORD = process.env.TEST_USER_PASSWORD || 'password'

test.beforeAll(() => {
  fs.mkdirSync(SCREENS_DIR, { recursive: true })
})

async function shot(page, name) {
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(SCREENS_DIR, `${name}.png`), fullPage: true })
}

async function shotVp(page, name) {
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(SCREENS_DIR, `${name}.png`), fullPage: false })
}

async function closeDialog(page) {
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)
}

async function openAndShot(page, triggerSelector, dialogSelector, shotName, scroll = false) {
  const trigger = page.locator(triggerSelector).first()
  if (!await trigger.isVisible().catch(() => false)) return
  await trigger.click()
  await page.waitForSelector(dialogSelector, { timeout: 5000 }).catch(() => {})
  await page.waitForTimeout(600)
  await shotVp(page, shotName)
  if (scroll) {
    await page.evaluate((sel) => {
      const el = document.querySelector(sel)
      if (el) el.scrollTop = el.scrollHeight
    }, dialogSelector)
    await page.waitForTimeout(400)
    await shotVp(page, `${shotName}-scroll`)
  }
  await closeDialog(page)
}

async function login(page) {
  await page.goto(`${BASE}/login`)
  await page.waitForSelector('[data-testid="login-page"]', { timeout: 15000 })
  await page.fill('[data-testid="email-input"]', EMAIL)
  await page.fill('[data-testid="password-input"]', PASSWORD)
  await page.click('[data-testid="login-button"]')
  await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(1200)
}

// ─── Desktop ─────────────────────────────────────────────────────────────────
test('UI Tour Interactive — Desktop', async ({ browser }) => {
  test.setTimeout(600_000)
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await ctx.newPage()
  await login(page)

  // ── 02 Appointments: tabs + modal ──────────────────────────────────────────
  await page.goto(`${BASE}/appointments`)
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(800)

  await page.click('[value="list"]')
  await page.waitForTimeout(700)
  await shot(page, 'desktop-02-appointments-tab-lista')

  await page.click('[value="notes"]')
  await page.waitForTimeout(700)
  await shot(page, 'desktop-02-appointments-tab-anotacoes')

  await page.click('[data-testid="new-appointment-btn"]')
  await page.waitForSelector('[role="dialog"]', { timeout: 6000 }).catch(() => {})
  await page.waitForTimeout(600)
  await shotVp(page, 'desktop-02-appointments-modal-novo')
  // scroll down dialog to capture full form
  await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]')
    if (d) d.scrollTop = d.scrollHeight
  })
  await page.waitForTimeout(400)
  await shotVp(page, 'desktop-02-appointments-modal-novo-scroll')
  await closeDialog(page)

  // ── 03 AppointmentLinks: novo + QR + editar ────────────────────────────────
  await page.goto(`${BASE}/appointment-links`)
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(700)

  await openAndShot(page,
    '[data-testid="new-link-btn"]',
    '[data-testid="appointment-link-dialog"]',
    'desktop-03-links-modal-novo',
    true
  )

  // QR code dialog — só se houver links
  const qrBtn = page.locator('button[title="Ver QR Code"]').first()
  if (await qrBtn.isVisible().catch(() => false)) {
    await qrBtn.click()
    await page.waitForSelector('[role="dialog"]', { timeout: 4000 }).catch(() => {})
    await page.waitForTimeout(800)
    await shotVp(page, 'desktop-03-links-modal-qr')
    await closeDialog(page)
  }

  // Edit dialog — primeiro botão Edit na tabela desktop
  const editLinkBtns = page.locator('.hidden.md\\:block [role="row"] button').nth(1)
  if (await editLinkBtns.isVisible().catch(() => false)) {
    await editLinkBtns.click()
    await page.waitForSelector('[data-testid="edit-link-dialog"]', { timeout: 4000 }).catch(() => {})
    await page.waitForTimeout(600)
    await shotVp(page, 'desktop-03-links-modal-editar')
    await closeDialog(page)
  }

  // ── 04 Contacts: novo + editar ─────────────────────────────────────────────
  await page.goto(`${BASE}/contacts`)
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(700)

  await openAndShot(page,
    '[data-testid="new-contact-btn"]',
    '[data-testid="contact-dialog"]',
    'desktop-04-contacts-modal-novo'
  )

  const editContactBtn = page.locator('[data-testid="contacts-page"] button').filter({ hasText: /editar/i }).first()
  if (await editContactBtn.isVisible().catch(() => false)) {
    await editContactBtn.click()
    await page.waitForSelector('[data-testid="edit-contact-dialog"]', { timeout: 4000 }).catch(() => {})
    await page.waitForTimeout(600)
    await shotVp(page, 'desktop-04-contacts-modal-editar')
    await closeDialog(page)
  }

  // ── 05 Transactions: novo + editar ────────────────────────────────────────
  await page.goto(`${BASE}/transactions`)
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(700)

  await openAndShot(page,
    '[data-testid="new-transaction-btn"]',
    '[data-testid="transaction-dialog"]',
    'desktop-05-transactions-modal-novo'
  )

  // Edit first transaction if available
  const editTxBtn = page.locator('[data-testid="transactions-page"]').getByRole('button', { name: /editar/i }).first()
  if (await editTxBtn.isVisible().catch(() => false)) {
    await editTxBtn.click()
    await page.waitForSelector('[data-testid="edit-transaction-dialog"]', { timeout: 4000 }).catch(() => {})
    await page.waitForTimeout(600)
    await shotVp(page, 'desktop-05-transactions-modal-editar')
    await closeDialog(page)
  }

  // ── 06 Professionals: novo + horários ─────────────────────────────────────
  await page.goto(`${BASE}/professionals`)
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(700)

  await openAndShot(page,
    '[data-testid="new-professional-btn"]',
    '[data-testid="professional-dialog"]',
    'desktop-06-professionals-modal-novo',
    true
  )

  const horariosBtn = page.getByRole('button', { name: /horários/i }).first()
  if (await horariosBtn.isVisible().catch(() => false)) {
    await horariosBtn.click()
    await page.waitForSelector('[data-testid="professional-schedule-dialog"]', { timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(600)
    await shotVp(page, 'desktop-06-professionals-modal-horarios')
    await closeDialog(page)
  }

  // ── 07 Services: novo ─────────────────────────────────────────────────────
  await page.goto(`${BASE}/services`)
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(700)

  await openAndShot(page,
    '[data-testid="new-service-btn"]',
    '[data-testid="service-dialog"]',
    'desktop-07-services-modal-novo'
  )

  // ── 09 Commissions: expandir profissional ─────────────────────────────────
  await page.goto(`${BASE}/commissions`)
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(900)

  const expandBtn = page.locator('button').filter({ has: page.locator('[data-lucide="chevron-down"]') }).first()
  if (await expandBtn.isVisible().catch(() => false)) {
    await expandBtn.click()
    await page.waitForTimeout(600)
    await shot(page, 'desktop-09-commissions-expanded')
  }

  // ── 10 Reports: aba Agendamentos ──────────────────────────────────────────
  await page.goto(`${BASE}/reports`)
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(900)

  await page.click('[value="appointments"]')
  await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {})
  await page.waitForTimeout(800)
  await shot(page, 'desktop-10-reports-tab-agendamentos')

  // ── 11 Imports: nova importação ───────────────────────────────────────────
  await page.goto(`${BASE}/imports`)
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(700)

  await openAndShot(page,
    '[data-testid="new-import-btn"]',
    '[data-testid="import-dialog"]',
    'desktop-11-imports-modal-novo'
  )

  // ── 12 Document Template Form: novo recibo ────────────────────────────────
  await page.goto(`${BASE}/document-templates/receipt/new`)
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(800)
  await shot(page, 'desktop-12-document-template-form-recibo')

  await page.goto(`${BASE}/document-templates/contract/new`)
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(800)
  await shot(page, 'desktop-12-document-template-form-contrato')

  await ctx.close()
})

// ─── Mobile ───────────────────────────────────────────────────────────────────
test('UI Tour Interactive — Mobile', async ({ browser }) => {
  test.setTimeout(600_000)
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  await login(page)

  // ── 02 Appointments: tabs + modal ──────────────────────────────────────────
  await page.goto(`${BASE}/appointments`)
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(800)

  await page.click('[value="list"]')
  await page.waitForTimeout(700)
  await shot(page, 'mobile-02-appointments-tab-lista')

  await page.click('[value="notes"]')
  await page.waitForTimeout(700)
  await shot(page, 'mobile-02-appointments-tab-anotacoes')

  await page.click('[data-testid="new-appointment-btn"]')
  await page.waitForSelector('[role="dialog"]', { timeout: 6000 }).catch(() => {})
  await page.waitForTimeout(600)
  await shot(page, 'mobile-02-appointments-modal-novo')
  await closeDialog(page)

  // ── 03 AppointmentLinks: novo ──────────────────────────────────────────────
  await page.goto(`${BASE}/appointment-links`)
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(700)

  await openAndShot(page,
    '[data-testid="new-link-btn"]',
    '[data-testid="appointment-link-dialog"]',
    'mobile-03-links-modal-novo',
    true
  )

  // ── 04 Contacts: novo ─────────────────────────────────────────────────────
  await page.goto(`${BASE}/contacts`)
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(700)

  await openAndShot(page,
    '[data-testid="new-contact-btn"]',
    '[data-testid="contact-dialog"]',
    'mobile-04-contacts-modal-novo'
  )

  // ── 05 Transactions: nova ─────────────────────────────────────────────────
  await page.goto(`${BASE}/transactions`)
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(700)

  await openAndShot(page,
    '[data-testid="new-transaction-btn"]',
    '[data-testid="transaction-dialog"]',
    'mobile-05-transactions-modal-novo'
  )

  // ── 06 Professionals: novo + horários ─────────────────────────────────────
  await page.goto(`${BASE}/professionals`)
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(700)

  await openAndShot(page,
    '[data-testid="new-professional-btn"]',
    '[data-testid="professional-dialog"]',
    'mobile-06-professionals-modal-novo',
    true
  )

  const horariosBtn = page.getByRole('button', { name: /horários/i }).first()
  if (await horariosBtn.isVisible().catch(() => false)) {
    await horariosBtn.click()
    await page.waitForSelector('[data-testid="professional-schedule-dialog"]', { timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(600)
    await shot(page, 'mobile-06-professionals-modal-horarios')
    await closeDialog(page)
  }

  // ── 07 Services: novo ─────────────────────────────────────────────────────
  await page.goto(`${BASE}/services`)
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(700)

  await openAndShot(page,
    '[data-testid="new-service-btn"]',
    '[data-testid="service-dialog"]',
    'mobile-07-services-modal-novo'
  )

  // ── 09 Commissions: expandir ──────────────────────────────────────────────
  await page.goto(`${BASE}/commissions`)
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(900)

  const expandBtn = page.locator('button').filter({ has: page.locator('[data-lucide="chevron-down"]') }).first()
  if (await expandBtn.isVisible().catch(() => false)) {
    await expandBtn.click()
    await page.waitForTimeout(600)
    await shot(page, 'mobile-09-commissions-expanded')
  }

  // ── 10 Reports: aba Agendamentos ──────────────────────────────────────────
  await page.goto(`${BASE}/reports`)
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(900)

  await page.click('[value="appointments"]')
  await page.waitForTimeout(800)
  await shot(page, 'mobile-10-reports-tab-agendamentos')

  // ── 11 Imports: nova ──────────────────────────────────────────────────────
  await page.goto(`${BASE}/imports`)
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(700)

  await openAndShot(page,
    '[data-testid="new-import-btn"]',
    '[data-testid="import-dialog"]',
    'mobile-11-imports-modal-novo'
  )

  // ── 12 Document Template Form ─────────────────────────────────────────────
  await page.goto(`${BASE}/document-templates/receipt/new`)
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
  await page.waitForTimeout(800)
  await shot(page, 'mobile-12-document-template-form-recibo')

  await ctx.close()
})
