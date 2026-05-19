/**
 * E2E — Plano Alimentar (interface da nutricionista)
 * Screenshots salvas em tests/performance/screenshots/meal-plan/
 */
const { test, expect } = require('@playwright/test')
const path = require('path')
const fs   = require('fs')

const DIR   = path.join(__dirname, '../screenshots/meal-plan')
const BASE  = process.env.BASE_URL  || 'http://localhost:5173'
const EMAIL = process.env.TEST_USER_EMAIL    || 'admin@exemplo.com'
const PASS  = process.env.TEST_USER_PASSWORD || 'password'

test.beforeAll(() => fs.mkdirSync(DIR, { recursive: true }))

async function shot(page, name) {
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(DIR, `${name}.png`), fullPage: true })
  console.log('📸', name)
}

async function login(page) {
  await page.goto(`${BASE}/login`)
  await page.waitForSelector('[data-testid="login-page"]', { timeout: 15000 })
  await page.fill('[data-testid="email-input"]', EMAIL)
  await page.fill('[data-testid="password-input"]', PASS)
  await page.click('[data-testid="login-button"]')
  await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 20000 })
  await page.waitForTimeout(1000)
}

test.skip(!process.env.TEST_USER_EMAIL, 'Defina TEST_USER_EMAIL e TEST_USER_PASSWORD')

test('Plano Alimentar — fluxo completo com screenshots', async ({ browser }) => {
  test.setTimeout(300_000)

  for (const [suffix, vp] of [
    ['desktop', { width: 1280, height: 800 }],
    ['mobile',  { width: 390,  height: 844 }],
  ]) {
    const ctx  = await browser.newContext({ viewport: vp })
    const page = await ctx.newPage()

    await login(page)

    // ── 1. Perfil do paciente ──────────────────────────────────────────────────
    await page.goto(`${BASE}/contacts`)
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
    await page.waitForTimeout(800)

    // Clica no primeiro contato disponível
    const firstContact = page.locator('a[href*="/contacts/"], button').filter({ hasText: /paciente|cliente|contato/i }).first()
    const contactLinks = page.locator('a').filter({ hasText: /.+/ }).filter({ has: page.locator('[href*="/contacts/"]') })

    // Vai para a lista de contatos e abre o primeiro
    const rows = page.locator('a[href^="/contacts/"]')
    await rows.first().waitFor({ timeout: 8000 }).catch(() => {})
    const href = await rows.first().getAttribute('href').catch(() => null)

    if (!href) {
      console.log('⚠️  Nenhum contato encontrado — pulando testes de plano alimentar')
      await ctx.close()
      continue
    }

    await page.goto(`${BASE}${href}`)
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
    await page.waitForTimeout(800)
    await shot(page, `${suffix}-01-patient-profile`)

    // ── 2. Seção Planos Alimentares ────────────────────────────────────────────
    const mealPlanSection = page.locator('text=Planos Alimentares').first()
    await mealPlanSection.waitFor({ timeout: 8000 }).catch(() => {})
    await shot(page, `${suffix}-02-meal-plans-section`)

    // ── 3. Cria novo plano ─────────────────────────────────────────────────────
    const newPlanBtn = page.locator('button').filter({ hasText: /novo plano alimentar/i }).first()
    await newPlanBtn.waitFor({ timeout: 6000 }).catch(() => {})
    await newPlanBtn.click()
    await page.waitForTimeout(2000)
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})
    await shot(page, `${suffix}-03-meal-plan-builder-empty`)

    // ── 4. Edita o título ──────────────────────────────────────────────────────
    const titleEl = page.locator('h1').first()
    await titleEl.waitFor({ timeout: 5000 }).catch(() => {})
    await titleEl.click()
    await page.waitForTimeout(400)
    const titleInput = page.locator('input').filter({ hasText: '' }).first()
    if (await titleInput.isVisible().catch(() => false)) {
      await titleInput.selectText()
      await titleInput.fill('Plano Funcional — Semana 1')
      await page.keyboard.press('Enter')
      await page.waitForTimeout(600)
    }
    await shot(page, `${suffix}-04-meal-plan-title-edited`)

    // ── 5. Adiciona dia ────────────────────────────────────────────────────────
    const addDayBtn = page.locator('button').filter({ hasText: /adicionar dia/i }).first()
    await addDayBtn.waitFor({ timeout: 5000 }).catch(() => {})
    await addDayBtn.click()
    await page.waitForTimeout(1000)
    await shot(page, `${suffix}-05-meal-plan-day-added`)

    // ── 6. Adiciona refeição ───────────────────────────────────────────────────
    const cafeBtn = page.locator('button').filter({ hasText: /café da manhã/i }).first()
    await cafeBtn.waitFor({ timeout: 5000 }).catch(() => {})
    await cafeBtn.click()
    await page.waitForTimeout(800)
    await shot(page, `${suffix}-06-meal-added`)

    // ── 7. Busca alimento ──────────────────────────────────────────────────────
    const addFoodBtn = page.locator('button').filter({ hasText: /adicionar alimento/i }).first()
    await addFoodBtn.waitFor({ timeout: 5000 }).catch(() => {})
    await addFoodBtn.click()
    await page.waitForTimeout(600)
    await shot(page, `${suffix}-07-food-search-open`)

    // Digita na busca
    const searchInput = page.locator('input[placeholder*="Buscar alimento"]')
    await searchInput.waitFor({ timeout: 5000 }).catch(() => {})
    await searchInput.fill('arroz')
    await page.waitForTimeout(800)
    await shot(page, `${suffix}-08-food-search-results`)

    // Seleciona o primeiro resultado
    const firstResult = page.locator('button').filter({ hasText: 'Arroz' }).first()
    if (await firstResult.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstResult.click()
      await page.waitForTimeout(800)
      await shot(page, `${suffix}-09-food-added-to-meal`)
    }

    // ── 8. Adiciona almoço ─────────────────────────────────────────────────────
    const almoco = page.locator('button').filter({ hasText: /almoço/i }).first()
    if (await almoco.isVisible({ timeout: 3000 }).catch(() => false)) {
      await almoco.click()
      await page.waitForTimeout(600)
    }

    // Adiciona frango ao almoço
    const addFood2 = page.locator('button').filter({ hasText: /adicionar alimento/i }).nth(1)
    if (await addFood2.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addFood2.click()
      await page.waitForTimeout(400)
      const search2 = page.locator('input[placeholder*="Buscar alimento"]')
      await search2.fill('frango')
      await page.waitForTimeout(800)
      const firstFood = page.locator('button').filter({ hasText: 'Frango' }).first()
      if (await firstFood.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstFood.click()
        await page.waitForTimeout(600)
      }
    }
    await shot(page, `${suffix}-10-plan-with-multiple-meals`)

    // ── 9. Ativa o plano ───────────────────────────────────────────────────────
    const activateBtn = page.locator('button').filter({ hasText: /ativar plano/i }).first()
    if (await activateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await activateBtn.click()
      await page.waitForTimeout(1000)
      await shot(page, `${suffix}-11-plan-activated`)
    }

    // ── 10. Copia o link ───────────────────────────────────────────────────────
    const linkBtn = page.locator('button').filter({ hasText: /link paciente/i }).first()
    if (await linkBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await linkBtn.click()
      await page.waitForTimeout(600)
      await shot(page, `${suffix}-12-link-copied`)
    }

    await ctx.close()
  }
})

test('Plano Alimentar — visualização do paciente (pública)', async ({ browser }) => {
  test.setTimeout(120_000)

  const ctx  = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()

  // Tenta acessar com token fictício — deve mostrar erro tratado
  await page.goto(`${BASE}/plano/token-invalido-teste`)
  await page.waitForTimeout(2000)
  await shot(page, 'public-01-not-found-mobile')

  // Versão desktop do erro
  await ctx.close()
  const ctx2  = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page2 = await ctx2.newPage()
  await page2.goto(`${BASE}/plano/token-invalido-teste`)
  await page2.waitForTimeout(2000)
  await shot(page2, 'public-02-not-found-desktop')
  await ctx2.close()
})
