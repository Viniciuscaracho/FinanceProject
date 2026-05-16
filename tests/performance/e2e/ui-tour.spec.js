const { test, expect, chromium } = require('@playwright/test')
const path = require('path')
const fs = require('fs')

const SCREENS_DIR = path.join(__dirname, '../screenshots')
const BASE = process.env.BASE_URL || 'http://localhost:5173'
const EMAIL = process.env.TEST_USER_EMAIL || 'admin@exemplo.com'
const PASSWORD = process.env.TEST_USER_PASSWORD || 'password'

test.beforeAll(() => {
  fs.mkdirSync(SCREENS_DIR, { recursive: true })
})

async function loginAndCapture(page, routes, suffix = '') {
  // Login
  await page.goto(`${BASE}/login`)
  await page.waitForSelector('[data-testid="login-page"]', { timeout: 15000 })
  await page.fill('[data-testid="email-input"]', EMAIL)
  await page.fill('[data-testid="password-input"]', PASSWORD)
  await page.click('[data-testid="login-button"]')
  // Aguarda sair da tela de login
  await page.waitForFunction(
    () => !window.location.pathname.includes('/login'),
    { timeout: 15000 }
  ).catch(() => {})
  await page.waitForTimeout(1000)
}

const privateRoutes = [
  { name: '01-dashboard',          path: '/' },
  { name: '02-appointments',       path: '/appointments' },
  { name: '03-appointment-links',  path: '/appointment-links' },
  { name: '04-contacts',           path: '/contacts' },
  { name: '05-transactions',       path: '/transactions' },
  { name: '06-professionals',      path: '/professionals' },
  { name: '07-services',           path: '/services' },
  { name: '08-working-hours',      path: '/working-hours' },
  { name: '09-commissions',        path: '/commissions' },
  { name: '10-reports',            path: '/reports' },
  { name: '11-imports',            path: '/imports' },
  { name: '12-document-templates', path: '/document-templates' },
  { name: '13-subscription',       path: '/subscription' },
  { name: '14-profile',            path: '/profile' },
  { name: '15-settings',           path: '/settings' },
  { name: '16-company-settings',   path: '/company-settings' },
  { name: '17-vitrine',            path: '/vitrine' },
  { name: '18-admin',              path: '/admin' },
]

const publicRoutes = [
  { name: '19-landing',  path: '/landing' },
  { name: '20-discover', path: '/descobrir' },
  { name: '21-login',    path: '/login' },
]

test('UI Tour — todas as telas (desktop + mobile)', async ({ browser }) => {
  test.setTimeout(300_000)
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const page = await ctx.newPage()

  // Login
  await page.goto(`${BASE}/login`)
  await page.waitForSelector('[data-testid="login-page"]', { timeout: 15000 })
  await page.fill('[data-testid="email-input"]', EMAIL)
  await page.fill('[data-testid="password-input"]', PASSWORD)
  await page.click('[data-testid="login-button"]')
  await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 20000 }).catch(() => {})
  await page.waitForTimeout(1200)

  // Private routes — desktop
  for (const route of privateRoutes) {
    await page.goto(`${BASE}${route.path}`)
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(600)
    await page.screenshot({ path: path.join(SCREENS_DIR, `desktop-${route.name}.png`), fullPage: true })
  }

  // Private routes — mobile
  await page.setViewportSize({ width: 390, height: 844 })
  for (const route of privateRoutes) {
    await page.goto(`${BASE}${route.path}`)
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    await page.waitForTimeout(600)
    await page.screenshot({ path: path.join(SCREENS_DIR, `mobile-${route.name}.png`), fullPage: true })
  }

  await ctx.close()

  // Public routes — sem auth
  const pubCtx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  const pubPage = await pubCtx.newPage()
  for (const route of publicRoutes) {
    await pubPage.goto(`${BASE}${route.path}`)
    await pubPage.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    await pubPage.waitForTimeout(600)
    await pubPage.screenshot({ path: path.join(SCREENS_DIR, `desktop-${route.name}.png`), fullPage: true })
    await pubPage.setViewportSize({ width: 390, height: 844 })
    await pubPage.waitForTimeout(400)
    await pubPage.screenshot({ path: path.join(SCREENS_DIR, `mobile-${route.name}.png`), fullPage: true })
    await pubPage.setViewportSize({ width: 1280, height: 720 })
  }
  await pubCtx.close()
})
