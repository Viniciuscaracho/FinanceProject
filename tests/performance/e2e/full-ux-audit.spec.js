/**
 * Auditoria completa de UX e Performance
 * Cobre: todas as telas, modais, fluxos de uso real e integrações
 * Screenshots em: tests/performance/screenshots/ux-audit/
 *
 * Ordem: login → dashboard → agendamentos → contatos → prontuário →
 *        planos alimentares → serviços → profissionais → transações →
 *        comissões → relatórios → configurações → público
 *
 * Execute:
 *   cd tests/performance
 *   npx playwright test e2e/full-ux-audit.spec.js --project=ui-tour-interactive
 */

const { test, expect } = require('@playwright/test')
const path  = require('path')
const fs    = require('fs')

// ── Constantes ────────────────────────────────────────────────────────────────
const DIR   = path.join(__dirname, '../screenshots/ux-audit')
const BASE  = process.env.BASE_URL          || 'http://localhost:5173'
const EMAIL = process.env.TEST_USER_EMAIL    || 'admin@exemplo.com'
const PASS  = process.env.TEST_USER_PASSWORD || 'password'

const PERF_THRESHOLDS = {
  pageLoad:    3000,  // ms — aceitável para SPA após cache
  modalOpen:   600,   // ms — modal deve abrir rápido
  apiResponse: 2000,  // ms — resposta de API
  listRender:  1500,  // ms — lista com dados deve renderizar
}

test.beforeAll(() => fs.mkdirSync(DIR, { recursive: true }))

// ── Helpers ────────────────────────────────────────────────────────────────────
async function shot(page, name, label = '') {
  await page.waitForTimeout(500)
  await page.screenshot({
    path:     path.join(DIR, `${name}.png`),
    fullPage: true,
  })
  console.log(`  📸 ${name}${label ? ' — ' + label : ''}`)
}

async function shotViewport(page, name) {
  await page.waitForTimeout(400)
  await page.screenshot({ path: path.join(DIR, `${name}.png`), fullPage: false })
  console.log(`  📸 ${name}`)
}

async function login(page) {
  await page.goto(`${BASE}/login`)
  await page.waitForSelector('[data-testid="login-page"]', { timeout: 20_000 })
  await page.fill('[data-testid="email-input"]', EMAIL)
  await page.fill('[data-testid="password-input"]', PASS)
  await page.click('[data-testid="login-button"]')
  await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 20_000 })
  await page.waitForTimeout(800)
}

async function measureNavigation(page, url, label) {
  const t0 = Date.now()
  await page.goto(`${BASE}${url}`)
  await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => {})
  const elapsed = Date.now() - t0
  const ok = elapsed <= PERF_THRESHOLDS.pageLoad
  console.log(`  ⏱  ${label}: ${elapsed}ms ${ok ? '✅' : '⚠️ LENTO'}`)
  return elapsed
}

async function tryClick(page, selector, timeout = 4000) {
  const el = page.locator(selector).first()
  if (await el.isVisible({ timeout }).catch(() => false)) {
    await el.click()
    return true
  }
  return false
}

// Navega para o prontuário do primeiro contato e retorna o pathname (/contacts/:id)
// A página de Contatos usa button[title="Ver prontuário"] com navigate(), não <a href>
async function goToFirstContact(page) {
  await page.goto(`${BASE}/contacts`)
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
  await page.waitForTimeout(800)
  const btn = page.locator('button[title="Ver prontuário"]').first()
  if (!await btn.isVisible({ timeout: 8_000 }).catch(() => false)) return null
  await btn.click()
  await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => {})
  await page.waitForTimeout(800)
  return new URL(page.url()).pathname // ex: /contacts/42
}

// Abre o primeiro plano alimentar listado no prontuário (button[title="Editar plano"])
// Deve ser chamado já estando no prontuário
async function goToFirstMealPlan(page) {
  const btn = page.locator('button[title="Editar plano"], button').filter({ hasText: /abrir|editar/i }).first()
  if (!await btn.isVisible({ timeout: 6_000 }).catch(() => false)) return null
  await btn.click()
  await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => {})
  await page.waitForTimeout(800)
  return new URL(page.url()).pathname // ex: /contacts/42/meal-plans/7
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCO 0 — Login / autenticação
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('0 — Autenticação', () => {
  test('0.1 — Login page: renderização inicial', async ({ page }) => {
    test.setTimeout(60_000)
    const t0 = Date.now()
    await page.goto(`${BASE}/login`)
    await page.waitForSelector('[data-testid="login-page"]', { timeout: 15_000 })
    console.log(`  ⏱  Login page load: ${Date.now() - t0}ms`)
    await shot(page, '00-01-login-page', 'estado vazio')
  })

  test('0.2 — Login: credenciais inválidas (UX erro)', async ({ page }) => {
    test.setTimeout(60_000)
    await page.goto(`${BASE}/login`)
    await page.waitForSelector('[data-testid="login-page"]', { timeout: 15_000 })
    await page.fill('[data-testid="email-input"]', 'errado@teste.com')
    await page.fill('[data-testid="password-input"]', 'senhaerrada')
    await page.click('[data-testid="login-button"]')
    await page.waitForTimeout(2500)
    await shot(page, '00-02-login-error', 'mensagem de erro visível?')
  })

  test('0.3 — Login: fluxo bem-sucedido e redirect', async ({ page }) => {
    test.setTimeout(60_000)
    const t0 = Date.now()
    await login(page)
    const elapsed = Date.now() - t0
    console.log(`  ⏱  Login completo: ${elapsed}ms`)
    await shot(page, '00-03-post-login', 'dashboard após login')
    expect(page.url()).not.toContain('/login')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCO 1 — Dashboard
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('1 — Dashboard', () => {
  test('1.1 — Dashboard: carregamento e KPIs', async ({ page }) => {
    test.setTimeout(90_000)
    await login(page)
    const elapsed = await measureNavigation(page, '/', 'Dashboard inicial')
    await shot(page, '01-01-dashboard-full', 'KPIs e cards')

    // Valida que há pelo menos um card numérico
    const cards = page.locator('[class*="card"], [class*="Card"]')
    const count = await cards.count()
    console.log(`  📊 Cards encontrados: ${count}`)

    await shot(page, '01-01b-dashboard-viewport', 'viewport sem scroll')
  })

  test('1.2 — Dashboard: calendário semanal/horizontal', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page)
    await page.goto(`${BASE}/`)
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    await page.waitForTimeout(800)

    const calEl = page.locator('[class*="calendar"], [class*="Calendar"], [class*="week"]').first()
    if (await calEl.isVisible({ timeout: 3000 }).catch(() => false)) {
      await calEl.scrollIntoViewIfNeeded()
      await shot(page, '01-02-dashboard-calendar', 'calendário semanal')
    } else {
      console.log('  ℹ️  Calendário não encontrado no dashboard')
    }
  })

  test('1.3 — Dashboard: responsividade mobile', async ({ browser }) => {
    test.setTimeout(60_000)
    const ctx  = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await ctx.newPage()
    await login(page)
    await page.goto(`${BASE}/`)
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    await page.waitForTimeout(800)
    await shot(page, '01-03-dashboard-mobile', 'layout mobile 390px')
    await ctx.close()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCO 2 — Agendamentos
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('2 — Agendamentos', () => {
  test('2.1 — Lista de agendamentos: carga com dados', async ({ page }) => {
    test.setTimeout(90_000)
    await login(page)
    const elapsed = await measureNavigation(page, '/appointments', 'Agendamentos lista')
    await shot(page, '02-01-appointments-list', 'tabela com dados')

    const rows = page.locator('table tbody tr, [class*="appointment-row"], [class*="AppointmentRow"]')
    console.log(`  📊 Linhas na tabela: ${await rows.count()}`)
  })

  test('2.2 — Agendamentos: modal Novo Agendamento', async ({ page }) => {
    test.setTimeout(90_000)
    await login(page)
    await page.goto(`${BASE}/appointments`)
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    await page.waitForTimeout(800)

    const t0  = Date.now()
    const btn = page.locator('button').filter({ hasText: /novo agendamento|new appointment/i }).first()
    if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await btn.click()
      await page.waitForTimeout(600)
      console.log(`  ⏱  Modal abriu em: ${Date.now() - t0}ms`)
      await shot(page, '02-02-appointment-new-modal', 'modal novo agendamento')

      // Preenche campos básicos
      const dateInput = page.locator('input[type="date"], input[name*="date"], input[placeholder*="data"]').first()
      if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dateInput.fill(new Date().toISOString().split('T')[0])
      }
      await shot(page, '02-02b-appointment-modal-filled', 'modal parcialmente preenchido')

      // Fecha com ESC
      await page.keyboard.press('Escape')
      await page.waitForTimeout(400)
      await shot(page, '02-02c-appointment-modal-closed', 'modal fechado')
    } else {
      console.log('  ⚠️  Botão novo agendamento não encontrado')
    }
  })

  test('2.3 — Agendamentos: modal Consulta (click em agendamento)', async ({ page }) => {
    test.setTimeout(90_000)
    await login(page)
    await page.goto(`${BASE}/appointments`)
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    await page.waitForTimeout(1000)
    await shot(page, '02-03-appointments-before-click', 'lista antes de clicar')

    const firstRow = page.locator('table tbody tr').first()
    if (await firstRow.isVisible({ timeout: 4000 }).catch(() => false)) {
      await firstRow.click()
      await page.waitForTimeout(800)
      await shot(page, '02-03b-consultation-modal', 'modal de consulta aberto')

      // Fecha
      await page.keyboard.press('Escape')
      await page.waitForTimeout(400)
    }
  })

  test('2.4 — Agendamentos: filtros', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page)
    await page.goto(`${BASE}/appointments`)
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    await page.waitForTimeout(600)

    const filterBtn = page.locator('button').filter({ hasText: /filtro|filter/i }).first()
    if (await filterBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await filterBtn.click()
      await page.waitForTimeout(600)
      await shot(page, '02-04-appointments-filters', 'filtros expandidos')
    }
  })

  test('2.5 — Agendamentos: visualização calendário', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page)
    await page.goto(`${BASE}/appointments`)
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    await page.waitForTimeout(600)

    const calView = page.locator('button').filter({ hasText: /calendário|calendar|semana|mês/i }).first()
    if (await calView.isVisible({ timeout: 3000 }).catch(() => false)) {
      await calView.click()
      await page.waitForTimeout(800)
      await shot(page, '02-05-appointments-calendar-view', 'visão calendário')
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCO 3 — Contatos / Pacientes
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('3 — Contatos', () => {
  test('3.1 — Lista de contatos com dezenas de registros', async ({ page }) => {
    test.setTimeout(90_000)
    await login(page)
    const elapsed = await measureNavigation(page, '/contacts', 'Contatos lista')
    await shot(page, '03-01-contacts-list', `lista carregada em ${elapsed}ms`)

    const rows = page.locator('table tbody tr, [class*="contact-row"]')
    console.log(`  📊 Contatos visíveis: ${await rows.count()}`)
  })

  test('3.2 — Contatos: modal Novo Contato', async ({ page }) => {
    test.setTimeout(90_000)
    await login(page)
    await page.goto(`${BASE}/contacts`)
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    await page.waitForTimeout(600)

    const btn = page.locator('button').filter({ hasText: /novo contato|new contact/i }).first()
    if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
      const t0 = Date.now()
      await btn.click()
      await page.waitForSelector('[data-testid="contact-dialog"]', { timeout: 6000 }).catch(() => {})
      await page.waitForTimeout(500)
      console.log(`  ⏱  Modal novo contato: ${Date.now() - t0}ms`)
      await shot(page, '03-02-new-contact-modal', 'modal novo contato vazio')

      // Preenche campos
      const nameField = page.locator('input[name*="first_name"], input[placeholder*="nome"], input[name*="name"]').first()
      if (await nameField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nameField.fill('Teste Paciente')
      }
      const emailField = page.locator('input[type="email"], input[name*="email"]').first()
      if (await emailField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await emailField.fill('paciente.teste@email.com')
      }
      await shot(page, '03-02b-new-contact-filled', 'modal preenchido')
      await page.keyboard.press('Escape')
    }
  })

  test('3.3 — Contatos: modal Editar Contato', async ({ page }) => {
    test.setTimeout(90_000)
    await login(page)
    await page.goto(`${BASE}/contacts`)
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    await page.waitForTimeout(600)

    // Abre dropdown ou botão de ação do primeiro contato
    const editBtn = page.locator('button').filter({ hasText: /editar|edit/i }).first()
    const dotsBtn = page.locator('button[aria-haspopup="menu"], button[class*="action"], [class*="dropdown"] button').first()

    if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editBtn.click()
    } else if (await dotsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dotsBtn.click()
      await page.waitForTimeout(400)
      await shot(page, '03-03-contact-action-menu', 'menu de ações aberto')
      const editOption = page.locator('[role="menuitem"]').filter({ hasText: /editar/i }).first()
      if (await editOption.isVisible({ timeout: 2000 }).catch(() => false)) await editOption.click()
    }

    await page.waitForTimeout(700)
    const dialog = page.locator('[data-testid="edit-contact-dialog"]')
    if (await dialog.isVisible({ timeout: 4000 }).catch(() => false)) {
      await shot(page, '03-03b-edit-contact-modal', 'modal editar contato')
      await page.keyboard.press('Escape')
    }
  })

  test('3.4 — Contatos: importação Google Contacts (modal)', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page)
    await page.goto(`${BASE}/contacts`)
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    await page.waitForTimeout(600)

    const importBtn = page.locator('button').filter({ hasText: /importar|import|google/i }).first()
    if (await importBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await importBtn.click()
      await page.waitForTimeout(800)
      await shot(page, '03-04-google-import-modal', 'modal importação Google')
      await page.keyboard.press('Escape')
    } else {
      await shot(page, '03-04-contacts-no-import-btn', 'botão importar não visível')
    }
  })

  test('3.5 — Contatos: busca e filtro em tempo real', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page)
    await page.goto(`${BASE}/contacts`)
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    await page.waitForTimeout(600)

    const search = page.locator('input[type="search"], input[placeholder*="buscar"], input[placeholder*="pesquisar"]').first()
    if (await search.isVisible({ timeout: 3000 }).catch(() => false)) {
      await search.fill('Beatriz')
      await page.waitForTimeout(700)
      await shot(page, '03-05a-contacts-search-result', 'resultado busca "Beatriz"')

      await search.clear()
      await search.fill('zzznaoexiste')
      await page.waitForTimeout(700)
      await shot(page, '03-05b-contacts-search-empty', 'resultado vazio')

      await search.clear()
      await page.waitForTimeout(400)
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCO 4 — Prontuário do Paciente
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('4 — Prontuário do Paciente', () => {
  test('4.1 — Prontuário: carregamento e seções', async ({ page }) => {
    test.setTimeout(120_000)
    await login(page)

    const t0  = Date.now()
    const path = await goToFirstContact(page)  // clica btn prontuário e aguarda nav
    if (!path) { console.log('  ⚠️  Sem contatos — pulando prontuário'); return }
    console.log(`  ⏱  Prontuário load: ${Date.now() - t0}ms`)
    await shot(page, '04-01-patient-profile-top', 'cabeçalho prontuário')

    await page.evaluate(() => window.scrollTo(0, 400))
    await page.waitForTimeout(400)
    await shot(page, '04-01b-patient-profile-middle', 'seções intermediárias')

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(400)
    await shot(page, '04-01c-patient-profile-bottom', 'seção planos alimentares')
  })

  test('4.2 — Prontuário: histórico e progresso (toggles)', async ({ page }) => {
    test.setTimeout(90_000)
    await login(page)

    if (!await goToFirstContact(page)) return

    const histBtn = page.locator('button').filter({ hasText: /histórico|history/i }).first()
    if (await histBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await histBtn.click()
      await page.waitForTimeout(500)
      await shot(page, '04-02a-patient-history', 'painel histórico aberto')
    }

    const progBtn = page.locator('button').filter({ hasText: /progress|evolução|progresso/i }).first()
    if (await progBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await progBtn.click()
      await page.waitForTimeout(500)
      await shot(page, '04-02b-patient-progress', 'painel progresso aberto')
    }
    await shot(page, '04-02-patient-profile-overview', 'prontuário: visão geral')
  })

  test('4.3 — Prontuário: seção Metas (adicionar meta)', async ({ page }) => {
    test.setTimeout(90_000)
    await login(page)

    if (!await goToFirstContact(page)) return

    const goalBtn = page.locator('button').filter({ hasText: /nova meta|add goal|adicionar meta/i }).first()
    if (await goalBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await goalBtn.click()
      await page.waitForTimeout(500)
      await shot(page, '04-03-patient-new-goal', 'formulário nova meta')
      await page.keyboard.press('Escape')
    } else {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.6))
      await page.waitForTimeout(400)
      await shot(page, '04-03-patient-goals-section', 'seção de metas')
    }
  })

  test('4.4 — Prontuário: seção Planos Alimentares listados', async ({ page }) => {
    test.setTimeout(90_000)
    await login(page)

    if (!await goToFirstContact(page)) return

    const mealSection = page.locator('text=Planos Alimentares').first()
    if (await mealSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      await mealSection.scrollIntoViewIfNeeded()
      await page.waitForTimeout(600)
      await shot(page, '04-04-meal-plans-section', 'lista de planos alimentares no prontuário')
    } else {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(400)
      await shot(page, '04-04-patient-bottom', 'bottom prontuário')
    }

    // Conta botões "Editar plano" (cada plano tem um)
    const planBtns = page.locator('button[title="Editar plano"]')
    console.log(`  📊 Planos listados: ${await planBtns.count()}`)
  })

  test('4.5 — Prontuário: navega para MealPlanBuilder', async ({ page }) => {
    test.setTimeout(120_000)
    await login(page)

    if (!await goToFirstContact(page)) return

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(400)

    const newPlanBtn = page.locator('button').filter({ hasText: /novo plano alimentar/i }).first()
    if (await newPlanBtn.isVisible({ timeout: 6000 }).catch(() => false)) {
      await newPlanBtn.scrollIntoViewIfNeeded()
      const t0 = Date.now()
      await newPlanBtn.click()
      await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => {})
      await page.waitForTimeout(1000)
      console.log(`  ⏱  MealPlanBuilder load: ${Date.now() - t0}ms`)
      await shot(page, '04-05-meal-plan-builder-new', 'builder vazio após navegar')
    } else {
      // Tenta abrir plano existente
      const editBtn = page.locator('button[title="Editar plano"]').first()
      if (await editBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
        await editBtn.click()
        await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => {})
        await page.waitForTimeout(1000)
        await shot(page, '04-05-meal-plan-builder-existing', 'builder plano existente')
      }
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCO 5 — MealPlanBuilder (fluxo completo)
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('5 — Plano Alimentar (Builder)', () => {
  test('5.1 — Builder: carrega plano existente', async ({ page }) => {
    test.setTimeout(120_000)
    await login(page)

    if (!await goToFirstContact(page)) return
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(400)

    // button[title="Editar plano"] — padrão real do PatientProfile
    const editBtn = page.locator('button[title="Editar plano"]').first()
    if (await editBtn.isVisible({ timeout: 6000 }).catch(() => false)) {
      const t0 = Date.now()
      await editBtn.click()
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
      await page.waitForTimeout(1000)
      console.log(`  ⏱  Plano existente load: ${Date.now() - t0}ms`)
      await shot(page, '05-01-meal-plan-existing', 'plano existente completo')
    } else {
      const newBtn = page.locator('button').filter({ hasText: /novo plano alimentar/i }).first()
      if (await newBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
        await newBtn.click()
        await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => {})
        await page.waitForTimeout(1000)
        await shot(page, '05-01-meal-plan-new-fallback', 'builder novo (sem plano existente)')
      }
    }
  })

  test('5.2 — Builder: seletor de dias e refeições', async ({ page }) => {
    test.setTimeout(120_000)
    await login(page)

    if (!await goToFirstContact(page)) return
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(400)

    const editBtn = page.locator('button[title="Editar plano"]').first()
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click()
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
      await page.waitForTimeout(800)
    } else {
      const newBtn = page.locator('button').filter({ hasText: /novo plano alimentar/i }).first()
      if (await newBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
        await newBtn.click()
        await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => {})
        await page.waitForTimeout(800)
      } else return
    }

    await shot(page, '05-02-meal-plan-builder', 'builder carregado')

    const dayTabs = page.locator('button').filter({ hasText: /segunda|terça|quarta|quinta|sexta|sábado|domingo/i })
    const dayCount = await dayTabs.count()
    console.log(`  📊 Dias no plano: ${dayCount}`)

    if (dayCount > 1) {
      await dayTabs.nth(1).click()
      await page.waitForTimeout(400)
      await shot(page, '05-02-meal-plan-day2', 'segundo dia selecionado')
    }

    const mealHeader = page.locator('button').filter({ hasText: /café|almoço|jantar|lanche/i }).first()
    if (await mealHeader.isVisible({ timeout: 3000 }).catch(() => false)) {
      await mealHeader.click()
      await page.waitForTimeout(400)
      await shot(page, '05-02b-meal-expanded', 'refeição expandida')
    }
  })

  test('5.3 — Builder: busca de alimentos (TACO)', async ({ page }) => {
    test.setTimeout(120_000)
    await login(page)

    if (!await goToFirstContact(page)) return
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(400)

    const newBtn = page.locator('button').filter({ hasText: /novo plano alimentar/i }).first()
    if (!await newBtn.isVisible({ timeout: 4000 }).catch(() => false)) return

    await newBtn.click()
    await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => {})
    await page.waitForTimeout(800)

    // Adiciona dia e refeição
    const addDayBtn = page.locator('button').filter({ hasText: /adicionar dia/i }).first()
    if (await addDayBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addDayBtn.click()
      await page.waitForTimeout(600)
    }

    const cafeBtn = page.locator('button').filter({ hasText: /café da manhã/i }).first()
    if (await cafeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cafeBtn.click()
      await page.waitForTimeout(600)
    }

    const addFoodBtn = page.locator('button').filter({ hasText: /adicionar alimento/i }).first()
    if (await addFoodBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addFoodBtn.click()
      await page.waitForTimeout(500)
      await shot(page, '05-03a-food-search-empty', 'busca de alimento aberta')

      const searchInput = page.locator('input[placeholder*="Buscar"], input[placeholder*="alimento"]').first()
      if (await searchInput.isVisible({ timeout: 4000 }).catch(() => false)) {
        // Testa busca: arroz
        const t0 = Date.now()
        await searchInput.fill('arroz')
        await page.waitForTimeout(600)
        console.log(`  ⏱  Busca "arroz": ${Date.now() - t0}ms`)
        await shot(page, '05-03b-food-search-arroz', 'resultados arroz')

        const results = page.locator('button, li').filter({ hasText: /arroz/i })
        console.log(`  📊 Resultados "arroz": ${await results.count()}`)

        // Testa busca: frango
        await searchInput.clear()
        await searchInput.fill('frango')
        await page.waitForTimeout(600)
        await shot(page, '05-03c-food-search-frango', 'resultados frango')

        // Seleciona primeiro resultado
        const firstResult = results.first()
        if (await firstResult.isVisible({ timeout: 2000 }).catch(() => false)) {
          await firstResult.click()
          await page.waitForTimeout(500)
          await shot(page, '05-03d-food-added', 'alimento adicionado')
        }
      }
    }
  })

  test('5.4 — Builder: macros totais e ativação', async ({ page }) => {
    test.setTimeout(120_000)
    await login(page)

    if (!await goToFirstContact(page)) return
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(400)

    const editBtn = page.locator('button[title="Editar plano"]').first()
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click()
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
      await page.waitForTimeout(800)

      // Captura painel de macros
      const macroPanel = page.locator('[class*="macro"], [class*="Macro"], [class*="calori"]').first()
      if (await macroPanel.isVisible({ timeout: 4000 }).catch(() => false)) {
        await macroPanel.scrollIntoViewIfNeeded()
        await shot(page, '05-04a-meal-plan-macros', 'painel de macros totais')
      } else {
        await shot(page, '05-04a-meal-plan-full', 'plano completo (sem painel macro dedicado)')
      }

      // Botão ativar plano
      const activateBtn = page.locator('button').filter({ hasText: /ativar plano/i }).first()
      if (await activateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await shot(page, '05-04b-meal-plan-activate-btn', 'botão ativar visível')
        await activateBtn.click()
        await page.waitForTimeout(1000)
        await shot(page, '05-04c-meal-plan-activated', 'plano ativado')
      }

      // Link público
      const linkBtn = page.locator('button').filter({ hasText: /link|copiar/i }).first()
      if (await linkBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await linkBtn.click()
        await page.waitForTimeout(500)
        await shot(page, '05-04d-meal-plan-link', 'link público copiado/exibido')
      }
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCO 6 — Serviços
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('6 — Serviços', () => {
  test('6.1 — Lista de serviços', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page)
    const elapsed = await measureNavigation(page, '/services', 'Serviços lista')
    await shot(page, '06-01-services-list', `${elapsed}ms`)
    const rows = page.locator('table tbody tr, [class*="service-row"]')
    console.log(`  📊 Serviços: ${await rows.count()}`)
  })

  test('6.2 — Serviços: modal Novo Serviço', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page)
    await page.goto(`${BASE}/services`)
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    await page.waitForTimeout(600)

    const btn = page.locator('button').filter({ hasText: /novo serviço|new service|adicionar/i }).first()
    if (await btn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await btn.click()
      await page.waitForTimeout(600)
      await shot(page, '06-02a-service-new-modal', 'modal novo serviço')

      // Preenche campos
      const nameInput = page.locator('input[name*="name"], input[placeholder*="nome"]').first()
      if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nameInput.fill('Avaliação Nutricional')
      }
      const priceInput = page.locator('input[name*="price"], input[name*="selling"], input[placeholder*="preço"]').first()
      if (await priceInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await priceInput.fill('15000')
      }
      await shot(page, '06-02b-service-modal-filled', 'modal serviço preenchido')
      await page.keyboard.press('Escape')
    }
  })

  test('6.3 — Serviços: modal Editar Serviço', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page)
    await page.goto(`${BASE}/services`)
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    await page.waitForTimeout(600)

    const editBtn = page.locator('button').filter({ hasText: /editar/i }).first()
    if (await editBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await editBtn.click()
      await page.waitForTimeout(600)
      await shot(page, '06-03-service-edit-modal', 'modal editar serviço')
      await page.keyboard.press('Escape')
    }
  })

  test('6.4 — Serviços: modal Confirmar Exclusão', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page)
    await page.goto(`${BASE}/services`)
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    await page.waitForTimeout(600)

    const delBtn = page.locator('button').filter({ hasText: /excluir|deletar|remover/i }).first()
    if (await delBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await delBtn.click()
      await page.waitForTimeout(600)
      await shot(page, '06-04-service-delete-confirm', 'modal confirmar exclusão')
      await page.keyboard.press('Escape')
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCO 7 — Profissionais
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('7 — Profissionais', () => {
  test('7.1 — Lista de profissionais', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page)
    const elapsed = await measureNavigation(page, '/professionals', 'Profissionais lista')
    await shot(page, '07-01-professionals-list', `${elapsed}ms`)
    console.log(`  📊 Profissionais: ${await page.locator('table tbody tr').count()}`)
  })

  test('7.2 — Profissionais: modal Convidar Profissional', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page)
    await page.goto(`${BASE}/professionals`)
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    await page.waitForTimeout(600)

    const btn = page.locator('button').filter({ hasText: /convidar|novo profissional|invite/i }).first()
    if (await btn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await btn.click()
      await page.waitForTimeout(600)
      await shot(page, '07-02a-professional-invite-modal', 'modal convidar profissional')

      const emailInput = page.locator('input[type="email"]').first()
      if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await emailInput.fill('novo.profissional@clinica.com')
      }
      await shot(page, '07-02b-professional-invite-filled', 'modal preenchido')
      await page.keyboard.press('Escape')
    }
  })

  test('7.3 — Profissionais: modal Configurar Horários', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page)
    await page.goto(`${BASE}/professionals`)
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    await page.waitForTimeout(600)

    const schedBtn = page.locator('button').filter({ hasText: /horário|schedule|agenda/i }).first()
    if (await schedBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await schedBtn.click()
      await page.waitForTimeout(600)
      await shot(page, '07-03-professional-schedule-modal', 'modal horários de trabalho')
      await page.keyboard.press('Escape')
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCO 8 — Transações Financeiras
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('8 — Transações', () => {
  test('8.1 — Lista de transações com dados', async ({ page }) => {
    test.setTimeout(90_000)
    await login(page)
    const elapsed = await measureNavigation(page, '/transactions', 'Transações lista')
    await shot(page, '08-01-transactions-list', `${elapsed}ms`)
    console.log(`  📊 Transações: ${await page.locator('table tbody tr').count()}`)
  })

  test('8.2 — Transações: modal Nova Transação', async ({ page }) => {
    test.setTimeout(90_000)
    await login(page)
    await page.goto(`${BASE}/transactions`)
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    await page.waitForTimeout(600)

    const btn = page.locator('button').filter({ hasText: /nova transação|new transaction|adicionar/i }).first()
    if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await btn.click()
      await page.waitForTimeout(700)
      await shot(page, '08-02a-transaction-new-modal', 'modal nova transação')

      const amountInput = page.locator('input[name*="amount"], input[name*="value"], input[placeholder*="valor"]').first()
      if (await amountInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await amountInput.fill('15000')
      }
      await shot(page, '08-02b-transaction-modal-filled', 'modal preenchido')
      await page.keyboard.press('Escape')
    }
  })

  test('8.3 — Transações: modal Adição Rápida', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page)
    await page.goto(`${BASE}/transactions`)
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    await page.waitForTimeout(600)

    const quickBtn = page.locator('button').filter({ hasText: /rápid|quick/i }).first()
    if (await quickBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await quickBtn.click()
      await page.waitForTimeout(600)
      await shot(page, '08-03-transaction-quick-modal', 'modal adição rápida')
      await page.keyboard.press('Escape')
    }
  })

  test('8.4 — Transações: filtros avançados', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page)
    await page.goto(`${BASE}/transactions`)
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    await page.waitForTimeout(600)

    const filterBtn = page.locator('button').filter({ hasText: /filtro|filter/i }).first()
    if (await filterBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await filterBtn.click()
      await page.waitForTimeout(600)
      await shot(page, '08-04a-transactions-filters', 'filtros expandidos')

      const moreBtn = page.locator('button').filter({ hasText: /mais filtros|more/i }).first()
      if (await moreBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await moreBtn.click()
        await page.waitForTimeout(400)
        await shot(page, '08-04b-transactions-more-filters', 'filtros avançados')
      }
    }
  })

  test('8.5 — Transações: modal Editar Transação', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page)
    await page.goto(`${BASE}/transactions`)
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    await page.waitForTimeout(600)

    const editBtn = page.locator('button').filter({ hasText: /editar/i }).first()
    const rowBtn  = page.locator('table tbody tr button').first()

    if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editBtn.click()
    } else if (await rowBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await rowBtn.click()
    }

    await page.waitForTimeout(600)
    const dialog = page.locator('[role="dialog"]').first()
    if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
      await shot(page, '08-05-transaction-edit-modal', 'modal editar transação')
      await page.keyboard.press('Escape')
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCO 9 — Comissões
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('9 — Comissões', () => {
  test('9.1 — Comissões: listagem e cálculos', async ({ page }) => {
    test.setTimeout(90_000)
    await login(page)
    const elapsed = await measureNavigation(page, '/commissions', 'Comissões')
    await shot(page, '09-01-commissions-list', `${elapsed}ms`)

    // Scroll para ver totais
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(400)
    await shot(page, '09-01b-commissions-totals', 'totais e resumo')
  })

  test('9.2 — Comissões: filtros de período e profissional', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page)
    await page.goto(`${BASE}/commissions`)
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    await page.waitForTimeout(600)

    const profSelect = page.locator('select, [class*="select"]').filter({ hasText: /profissional|todos/i }).first()
    if (await profSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await profSelect.click()
      await page.waitForTimeout(400)
      await shot(page, '09-02-commissions-filter-open', 'filtro profissional aberto')
      await page.keyboard.press('Escape')
    } else {
      await shot(page, '09-02-commissions-no-filter', 'comissões (sem filtro de select visível)')
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCO 10 — Relatórios
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('10 — Relatórios', () => {
  test('10.1 — Relatórios financeiros: carga e gráficos', async ({ page }) => {
    test.setTimeout(90_000)
    await login(page)
    const elapsed = await measureNavigation(page, '/reports', 'Relatórios financeiros')
    await shot(page, '10-01-financial-reports', `${elapsed}ms`)

    await page.evaluate(() => window.scrollTo(0, 400))
    await page.waitForTimeout(400)
    await shot(page, '10-01b-reports-charts', 'gráficos de relatórios')
  })

  test('10.2 — Relatórios de agendamentos', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page)

    const apptReports = `${BASE}/appointments`
    await page.goto(apptReports)
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})

    const reportTab = page.locator('a, button, [role="tab"]').filter({ hasText: /relatório|report/i }).first()
    if (await reportTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await reportTab.click()
      await page.waitForTimeout(800)
      await shot(page, '10-02-appointment-reports', 'relatórios de agendamentos')
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCO 11 — Configurações
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('11 — Configurações', () => {
  test('11.1 — Configurações da empresa', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page)
    const elapsed = await measureNavigation(page, '/company-settings', 'Config. empresa')
    await shot(page, '11-01-company-settings', `${elapsed}ms`)
  })

  test('11.2 — Horários de trabalho', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page)
    const elapsed = await measureNavigation(page, '/working-hours', 'Horários de trabalho')
    await shot(page, '11-02-working-hours', `${elapsed}ms`)
    await page.evaluate(() => window.scrollTo(0, 300))
    await page.waitForTimeout(400)
    await shot(page, '11-02b-working-hours-days', 'dias da semana configurados')
  })

  test('11.3 — Vitrine (perfil público)', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page)
    const elapsed = await measureNavigation(page, '/vitrine', 'Vitrine')
    await shot(page, '11-03-vitrine', `${elapsed}ms`)
    await page.evaluate(() => window.scrollTo(0, 500))
    await page.waitForTimeout(400)
    await shot(page, '11-03b-vitrine-bottom', 'bottom da vitrine')
  })

  test('11.4 — Anamnese: templates', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page)
    const elapsed = await measureNavigation(page, '/anamnese', 'Anamnese templates')
    await shot(page, '11-04-anamnese-templates', `${elapsed}ms`)
  })

  test('11.5 — Links de agendamento', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page)
    const elapsed = await measureNavigation(page, '/appointment-links', 'Links agendamento')
    await shot(page, '11-05-appointment-links', `${elapsed}ms`)
  })

  test('11.6 — Perfil do usuário', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page)
    const elapsed = await measureNavigation(page, '/profile', 'Perfil')
    await shot(page, '11-06-profile', `${elapsed}ms`)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCO 12 — Telas Públicas
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('12 — Telas Públicas (sem auth)', () => {
  test('12.1 — Landing page', async ({ page }) => {
    test.setTimeout(60_000)
    const t0 = Date.now()
    await page.goto(`${BASE}/`)
    // Se redirecionar para login, captura de lá
    await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => {})
    console.log(`  ⏱  Landing/Login: ${Date.now() - t0}ms`)
    await shot(page, '12-01-landing-or-login', 'rota raiz sem auth')
  })

  test('12.2 — Vitrine pública: Descobrir', async ({ page }) => {
    test.setTimeout(60_000)
    const t0 = Date.now()
    await page.goto(`${BASE}/descobrir`)
    await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => {})
    await page.waitForTimeout(600)
    console.log(`  ⏱  Descobrir: ${Date.now() - t0}ms`)
    await shot(page, '12-02a-discover-page', 'listagem de profissionais')

    // Busca por profissão
    const searchInput = page.locator('input[type="search"], input[placeholder*="buscar"], input[placeholder*="profissão"]').first()
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('nutricionista')
      await page.waitForTimeout(700)
      await shot(page, '12-02b-discover-search', 'resultado busca nutricionista')
    }
  })

  test('12.3 — Plano alimentar público (token inválido)', async ({ page }) => {
    test.setTimeout(60_000)
    await page.goto(`${BASE}/plano/token-invalido-ux-test`)
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    await page.waitForTimeout(800)
    await shot(page, '12-03a-meal-plan-not-found-desktop', 'erro token inválido desktop')

    // Mobile
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`${BASE}/plano/token-invalido-ux-test`)
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    await page.waitForTimeout(800)
    await shot(page, '12-03b-meal-plan-not-found-mobile', 'erro token inválido mobile')
  })

  test('12.4 — Agendamento público (appointment booking)', async ({ page }) => {
    test.setTimeout(60_000)
    await page.goto(`${BASE}/book/link-teste-ux`)
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    await page.waitForTimeout(800)
    await shot(page, '12-04-public-booking', 'tela de agendamento público')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCO 13 — Performance com lista grande
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('13 — Performance com dados populados', () => {
  test('13.1 — Contatos: scroll infinito / paginação com muitos registros', async ({ page }) => {
    test.setTimeout(120_000)
    await login(page)
    await page.goto(`${BASE}/contacts`)
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    await page.waitForTimeout(1000)

    const t0 = Date.now()
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1000)
    console.log(`  ⏱  Scroll até o fim: ${Date.now() - t0}ms`)
    await shot(page, '13-01-contacts-scroll-end', 'fim da lista de contatos')
  })

  test('13.2 — Prontuário: performance com vários planos listados', async ({ page }) => {
    test.setTimeout(120_000)
    await login(page)

    const t0 = Date.now()
    if (!await goToFirstContact(page)) return
    const elapsed = Date.now() - t0
    console.log(`  ⏱  Prontuário com múltiplos planos: ${elapsed}ms`)

    const threshold = 4000
    if (elapsed > threshold) {
      console.log(`  ⚠️  LENTO: ${elapsed}ms > ${threshold}ms`)
    }

    const planBtns = page.locator('button[title="Editar plano"]')
    console.log(`  📊 Planos listados: ${await planBtns.count()}`)
    await shot(page, '13-02-patient-profile-perf', 'prontuário com dados reais')
  })

  test('13.3 — MealPlanBuilder: load de plano com 7 dias e 5 refeições/dia', async ({ page }) => {
    test.setTimeout(120_000)
    await login(page)

    if (!await goToFirstContact(page)) return
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(400)

    const editBtn = page.locator('button[title="Editar plano"]').first()
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      const t0 = Date.now()
      await editBtn.click()
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
      await page.waitForTimeout(1000)
      const elapsed = Date.now() - t0
      console.log(`  ⏱  Plano completo (7 dias): ${elapsed}ms`)
      await shot(page, '13-03-meal-plan-builder-full', 'builder plano completo (7 dias)')
    }
  })

  test('13.4 — Dashboard: KPIs com histórico de dados', async ({ page }) => {
    test.setTimeout(90_000)
    await login(page)
    const t0 = Date.now()
    await page.goto(`${BASE}/`)
    await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => {})
    await page.waitForTimeout(800)
    const elapsed = Date.now() - t0
    console.log(`  ⏱  Dashboard com dados: ${elapsed}ms`)

    const kcalEl = page.locator('text=/\\d+\\s*kcal|calori/i').first()
    const hasKcal = await kcalEl.isVisible({ timeout: 3000 }).catch(() => false)
    console.log(`  📊 KCal no dashboard: ${hasKcal}`)

    await shot(page, '13-04-dashboard-with-data', 'dashboard com dados populados')
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// BLOCO 14 — Navegação e UX global
// ═══════════════════════════════════════════════════════════════════════════════
test.describe('14 — Navegação e UX Global', () => {
  test('14.1 — Sidebar: todos os links de navegação', async ({ page }) => {
    test.setTimeout(90_000)
    await login(page)
    await page.goto(`${BASE}/`)
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    await page.waitForTimeout(600)
    await shot(page, '14-01-sidebar-expanded', 'sidebar com todos os links')

    // Sidebar usa buttons com navigate(), não <a href>
    const navBtns = page.locator('button[title]').filter({ hasText: /.+/ })
    console.log(`  📊 Botões de navegação (sidebar): ${await navBtns.count()}`)
  })

  test('14.2 — Bottom nav mobile: todas as abas', async ({ browser }) => {
    test.setTimeout(90_000)
    const ctx  = await browser.newContext({ viewport: { width: 390, height: 844 } })
    const page = await ctx.newPage()
    await login(page)
    await page.goto(`${BASE}/`)
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    await page.waitForTimeout(800)
    await shot(page, '14-02a-bottom-nav', 'nav bottom mobile')

    // BottomNavigation é uma div fixed bottom-0 com buttons
    // Usa aria-label="Ações rápidas" e aria-label="Mais opções"
    const bottomNav = page.locator('div').filter({ has: page.locator('button[aria-label="Ações rápidas"]') }).first()
    const navBtns   = page.locator('button[aria-label="Ações rápidas"], button[aria-label="Mais opções"]')
    const count     = await navBtns.count()
    console.log(`  📊 Botões bottom nav: ${count}`)

    if (await navBtns.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await navBtns.first().click()
      await page.waitForTimeout(600)
      await shot(page, '14-02b-bottom-nav-action', 'bottom nav ações rápidas aberto')
      await page.keyboard.press('Escape')
    } else {
      // Fallback: screenshot do bottom como existe
      await shot(page, '14-02b-bottom-nav-fallback', 'bottom area mobile')
    }
    await ctx.close()
  })

  test('14.3 — Toast de feedback após ação', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page)
    await page.goto(`${BASE}/services`)
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    await page.waitForTimeout(600)

    // Tenta qualquer ação que dispara toast
    const btn = page.locator('button').filter({ hasText: /novo serviço|adicionar/i }).first()
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click()
      await page.waitForTimeout(400)
      const cancelBtn = page.locator('button').filter({ hasText: /cancelar|fechar|cancel/i }).first()
      if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cancelBtn.click()
        await page.waitForTimeout(600)
        const toast = page.locator('[class*="toast"], [class*="sonner"], [role="status"]').first()
        const hasToast = await toast.isVisible({ timeout: 3000 }).catch(() => false)
        if (hasToast) {
          await shot(page, '14-03-toast-feedback', 'toast de feedback')
        }
      }
    }
  })

  test('14.4 — Estado vazio: tela sem dados', async ({ page }) => {
    test.setTimeout(60_000)
    await login(page)

    // Importações — tende a ser vazio em ambiente de teste
    await page.goto(`${BASE}/imports`)
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    await page.waitForTimeout(600)
    await shot(page, '14-04-empty-state-imports', 'estado vazio em importações')
  })

  test('14.5 — Breadcrumb e retorno em MealPlanBuilder', async ({ page }) => {
    test.setTimeout(90_000)
    await login(page)

    if (!await goToFirstContact(page)) return
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(400)

    const editBtn = page.locator('button[title="Editar plano"]').first()
    if (await editBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await editBtn.click()
      await page.waitForLoadState('networkidle', { timeout: 12_000 }).catch(() => {})
      await page.waitForTimeout(600)
      await shot(page, '14-05a-meal-plan-builder-breadcrumb', 'breadcrumb no builder')

      const backBtn = page.locator('button').filter({ hasText: /voltar|back/i }).first()
      if (await backBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await backBtn.click()
        await page.waitForTimeout(600)
        await shot(page, '14-05b-back-to-patient', 'retornou ao prontuário')
      }
    } else {
      await shot(page, '14-05-no-plan-found', 'sem plano para navegar')
    }
  })
})
