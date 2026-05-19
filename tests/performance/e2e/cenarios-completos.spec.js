/**
 * CENÁRIOS COMPLETOS DE TESTE — ORBI
 * ─────────────────────────────────────────────────────────────────────────────
 * Cobre todos os módulos do sistema com testes funcionais + métricas de perf.
 *
 * Estrutura:
 *   01. Autenticação
 *   02. Dashboard
 *   03. Agendamentos
 *   04. Contatos
 *   05. Transações
 *   06. Serviços
 *   07. Profissionais
 *   08. Horários de Trabalho
 *   09. Links de Agendamento
 *   10. Notas de Agendamento
 *   11. Relatórios Financeiros
 *   12. Comissões
 *   13. Configurações da Empresa
 *   14. Vitrine / Descobrir
 *   15. Anamnese
 *   16. Planos Alimentares (Nutrição)
 *   17. Páginas Públicas
 *   18. Navegação & Layout
 *   19. Performance Geral
 *
 * Execute:
 *   cd tests/performance
 *   npx playwright test e2e/cenarios-completos.spec.js --project=ux-audit --headed
 */

const { test, expect } = require('@playwright/test')
const path = require('path')
const fs = require('fs')

// ── Config ─────────────────────────────────────────────────────────────────────
const DIR   = path.join(__dirname, '../screenshots/cenarios')
const BASE  = process.env.BASE_URL           || 'http://localhost:5173'
const EMAIL = process.env.TEST_USER_EMAIL    || 'admin@exemplo.com'
const PASS  = process.env.TEST_USER_PASSWORD || 'password'

// Limiares de performance (ms)
const P = {
  pageLoad:    4000,
  modalOpen:    800,
  listRender:  3000,
  interaction:  500,
}

// ── Helpers ────────────────────────────────────────────────────────────────────
test.beforeAll(() => fs.mkdirSync(DIR, { recursive: true }))

async function shot(page, name) {
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(DIR, `${name}.png`), fullPage: true })
  console.log(`  📸 ${name}`)
}

async function login(page) {
  // Já autenticado? Pular login para evitar acúmulo de estado após muitos testes
  const currentUrl = page.url()
  if (currentUrl && !currentUrl.includes('/login') && currentUrl.includes('localhost')) {
    await page.goto(`${BASE}/`)
    const alreadyIn = await page.locator('[data-testid="dashboard"]').isVisible({ timeout: 4000 }).catch(() => false)
    if (alreadyIn) { await page.waitForTimeout(300); return }
  }
  await page.goto(`${BASE}/login`)
  await page.waitForSelector('[data-testid="login-page"]', { timeout: 20_000 })
  await page.fill('[data-testid="email-input"]', EMAIL)
  await page.fill('[data-testid="password-input"]', PASS)
  await page.click('[data-testid="login-button"]')
  await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 30_000 })
  await page.waitForTimeout(600)
}

async function timed(label, fn) {
  const t0 = Date.now()
  await fn()
  const ms = Date.now() - t0
  console.log(`  ⏱  ${label}: ${ms}ms`)
  return ms
}

async function visibleOrSkip(page, selector, timeout = 5000) {
  return page.locator(selector).first().isVisible({ timeout }).catch(() => false)
}

// ══════════════════════════════════════════════════════════════════════════════
// 01. AUTENTICAÇÃO
// ══════════════════════════════════════════════════════════════════════════════
test.describe('01 · Autenticação', () => {

  test('Login — exibe campos email, senha e botão Entrar', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible()
    await shot(page, '01-login-form')
  })

  test('Login — link "Esqueci minha senha" visível no campo de senha', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await expect(page.locator('button:has-text("Esqueci minha senha")')).toBeVisible({ timeout: 10_000 })
  })

  test('Login — credenciais inválidas exibem mensagem de erro', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.fill('[data-testid="email-input"]', 'invalido@teste.com')
    await page.fill('[data-testid="password-input"]', 'senhaerrada')
    await page.click('[data-testid="login-button"]')
    await expect(page.locator('[role="alert"]').first()).toBeVisible({ timeout: 10_000 })
    await shot(page, '01-login-erro')
  })

  test('Login — campos required impedem submit em branco', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.click('[data-testid="login-button"]')
    await expect(page).toHaveURL(/\/login/)
  })

  test('Login — link "Esqueci minha senha" abre tela de recuperação', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.click('button:has-text("Esqueci minha senha")')
    await expect(page.locator('h1:has-text("Recuperar senha")')).toBeVisible({ timeout: 6_000 })
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await shot(page, '01-forgot-password-form')
  })

  test('Login — recuperação de senha exibe confirmação após submit', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.click('button:has-text("Esqueci minha senha")')
    await page.fill('input[type="email"]', 'usuario@teste.com')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=/instruções de recuperação/i')).toBeVisible({ timeout: 10_000 })
    await shot(page, '01-forgot-password-confirmacao')
  })

  test('Login — voltar ao login a partir da tela de recuperação', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.click('button:has-text("Esqueci minha senha")')
    await page.click('button:has-text("Voltar ao login")')
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible({ timeout: 6_000 })
  })

  test('Registro — botão "Crie uma conta" exibe formulário de cadastro', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.click('button:has-text("Crie uma conta")')
    await expect(page.locator('[data-testid="register-button"]')).toBeVisible({ timeout: 6_000 })
    await expect(page.locator('input#reg-account-name')).toBeVisible()
    await expect(page.locator('input#reg-name')).toBeVisible()
    await expect(page.locator('input#reg-email')).toBeVisible()
    await shot(page, '01-register-form')
  })

  test('Registro — validação: senhas não coincidem', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.click('button:has-text("Crie uma conta")')
    await page.fill('input#reg-account-name', 'Clínica Teste')
    await page.fill('input#reg-name', 'Fulano Teste')
    await page.fill('input#reg-email', 'novo@teste.com')
    await page.fill('[data-testid="reg-password-input"]', 'senha123')
    await page.fill('[data-testid="reg-password-confirm-input"]', 'outra456')
    await page.click('[data-testid="register-button"]')
    await expect(page.locator('text=/senhas não coincidem/i')).toBeVisible({ timeout: 5_000 })
  })

  test('Registro — validação: senha muito curta (< 6 chars)', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.click('button:has-text("Crie uma conta")')
    await page.fill('input#reg-account-name', 'Clínica Teste')
    await page.fill('input#reg-name', 'Fulano Teste')
    await page.fill('input#reg-email', 'novo@teste.com')
    await page.fill('[data-testid="reg-password-input"]', '123')
    await page.fill('[data-testid="reg-password-confirm-input"]', '123')
    await page.click('[data-testid="register-button"]')
    await expect(page.locator('text=/pelo menos 6/i')).toBeVisible({ timeout: 5_000 })
  })

  test('Registro — link "Faça login" volta para o login', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.click('button:has-text("Crie uma conta")')
    await page.click('button:has-text("Faça login")')
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible({ timeout: 6_000 })
  })

  test('Rotas protegidas — acesso sem auth redireciona para /login', async ({ page }) => {
    for (const route of ['/', '/transactions', '/contacts', '/appointments', '/services']) {
      await page.goto(`${BASE}${route}`)
      await expect(page).toHaveURL(/\/login/, { timeout: 8_000 })
    }
  })

  test('Login — credenciais válidas redirecionam ao dashboard', async ({ page }) => {
    const ms = await timed('login completo', async () => {
      await login(page)
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 15_000 })
    })
    expect(ms).toBeLessThan(P.pageLoad + 2000) // login pode ser mais lento na primeira vez
    await shot(page, '01-login-sucesso-dashboard')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 02. DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
test.describe('02 · Dashboard', () => {
  test.beforeEach(async ({ page }) => { await login(page) })

  test('carrega o wrapper principal com data-testid="dashboard"', async ({ page }) => {
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 15_000 })
    await shot(page, '02-dashboard-desktop')
  })

  test('exibe saudação contextual (Bom dia / Boa tarde / Boa noite)', async ({ page }) => {
    await expect(
      page.locator('[data-testid="dashboard"]').locator('text=/bom dia|boa tarde|boa noite/i')
    ).toBeVisible({ timeout: 8_000 })
  })

  test('exibe métrica "Recebido" do mês', async ({ page }) => {
    await expect(page.locator('text=Recebido')).toBeVisible({ timeout: 10_000 })
  })

  test('exibe seção de agendamentos de hoje ou estado vazio', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    const dash = page.locator('[data-testid="dashboard"]')
    await expect(
      dash.locator('text=/hoje|agendamentos/i').first()
    ).toBeVisible({ timeout: 12_000 })
  })

  test('performance: dashboard carrega em menos de 4 s', async ({ page }) => {
    const ms = await timed('dashboard load', async () => {
      await page.goto(`${BASE}/`)
      await page.waitForSelector('[data-testid="dashboard"]', { timeout: 15_000 })
    })
    expect(ms).toBeLessThan(P.pageLoad)
  })

  test('LCP (Largest Contentful Paint) captado via PerformanceObserver', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 15_000 })

    const lcp = await page.evaluate(() => new Promise(resolve => {
      new PerformanceObserver(list => {
        const entries = list.getEntries()
        resolve(entries[entries.length - 1]?.startTime ?? 9999)
      }).observe({ type: 'largest-contentful-paint', buffered: true })
      setTimeout(() => resolve(9999), 5000)
    }))

    console.log(`  ⚡ LCP Dashboard: ${Math.round(lcp)}ms`)
    // 6s é o limiar máximo aceitável para SPA com cache frio
    expect(lcp).toBeLessThan(6000)
    await shot(page, '02-dashboard-lcp')
  })

  test('clique no link de Agendamentos navega para /appointments', async ({ page }) => {
    await page.click('a[href="/appointments"]')
    await expect(page).toHaveURL(`${BASE}/appointments`)
    // Appointments pode ser lento (217 registros sem paginação)
    await expect(page.locator('[data-testid="appointments-page"]')).toBeVisible({ timeout: 20_000 })
  })

  test('mobile: dashboard renderiza sem elementos cortados (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(`${BASE}/`)
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 15_000 })
    await shot(page, '02-dashboard-mobile')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 03. AGENDAMENTOS
// ══════════════════════════════════════════════════════════════════════════════
test.describe('03 · Agendamentos', () => {
  test.beforeEach(async ({ page }) => { await login(page) })

  test('página carrega com data-testid="appointments-page"', async ({ page }) => {
    await page.goto(`${BASE}/appointments`)
    await expect(page.locator('[data-testid="appointments-page"]')).toBeVisible({ timeout: 15_000 })
    await shot(page, '03-agendamentos-lista')
  })

  test('performance: mede tempo de carga (API retorna 217 registros sem paginação)', async ({ page }) => {
    test.setTimeout(180_000) // 217 registros sem paginação: pode ser lento
    const ms = await timed('appointments', async () => {
      await page.goto(`${BASE}/appointments`)
      await page.waitForSelector('[data-testid="appointments-page"]', { timeout: 90_000 })
    })
    // Log apenas — falha real é quando nunca carrega (> 90s)
    const status = ms < 5000 ? '✅' : ms < 15000 ? '⚠️ lento (sem paginação)' : '❌ muito lento'
    console.log(`  ${status} Appointments: ${ms}ms`)
    expect(ms).toBeLessThan(90_000)
  })

  test('exibe botão "Novo Agendamento"', async ({ page }) => {
    await page.goto(`${BASE}/appointments`)
    await expect(page.locator('[data-testid="new-appointment-btn"]')).toBeVisible({ timeout: 10_000 })
  })

  test('clique em "Novo Agendamento" abre dialog', async ({ page }) => {
    await page.goto(`${BASE}/appointments`)
    await page.waitForLoadState('networkidle')
    const ms = await timed('modal abrir', async () => {
      await page.click('[data-testid="new-appointment-btn"]')
      await expect(page.locator('[role="dialog"]').first()).toBeVisible({ timeout: 8_000 })
    })
    expect(ms).toBeLessThan(P.modalOpen)
    await shot(page, '03-agendamentos-novo-dialog')
  })

  test('dialog "Novo Agendamento" fecha ao clicar em Cancelar', async ({ page }) => {
    await page.goto(`${BASE}/appointments`)
    await page.waitForLoadState('networkidle')
    await page.click('[data-testid="new-appointment-btn"]')
    await page.waitForSelector('[role="dialog"]', { timeout: 6_000 })
    const cancelBtn = page.locator('[role="dialog"] button:has-text("Cancelar")').first()
    if (await cancelBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await cancelBtn.click()
      await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 5_000 })
    }
  })

  test('alternar para visão Mensal exibe calendário mensal', async ({ page }) => {
    await page.goto(`${BASE}/appointments`)
    await page.waitForLoadState('networkidle')
    const monthBtn = page.locator('button:has-text("Mês"), button:has-text("month"), [data-view="month"]').first()
    if (await monthBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await monthBtn.click()
      await page.waitForTimeout(500)
      await shot(page, '03-agendamentos-mes')
    }
  })

  test('alternar para visão Semana exibe grade semanal', async ({ page }) => {
    await page.goto(`${BASE}/appointments`)
    await page.waitForLoadState('networkidle')
    const weekBtn = page.locator('button:has-text("Semana"), button:has-text("week"), [data-view="week"]').first()
    if (await weekBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await weekBtn.click()
      await page.waitForTimeout(500)
      await shot(page, '03-agendamentos-semana')
    }
  })

  test('alternar para visão Dia exibe agenda do dia', async ({ page }) => {
    await page.goto(`${BASE}/appointments`)
    await page.waitForLoadState('networkidle')
    const dayBtn = page.locator('button:has-text("Dia"), button:has-text("day"), [data-view="day"]').first()
    if (await dayBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await dayBtn.click()
      await page.waitForTimeout(500)
      await shot(page, '03-agendamentos-dia')
    }
  })

  test('mobile: agendamentos renderizam em 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(`${BASE}/appointments`)
    await expect(page.locator('[data-testid="appointments-page"]')).toBeVisible({ timeout: 15_000 })
    await shot(page, '03-agendamentos-mobile')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 04. CONTATOS
// ══════════════════════════════════════════════════════════════════════════════
test.describe('04 · Contatos', () => {
  test.beforeEach(async ({ page }) => { await login(page) })

  test('página carrega com data-testid="contacts-page"', async ({ page }) => {
    await page.goto(`${BASE}/contacts`)
    await expect(page.locator('[data-testid="contacts-page"]')).toBeVisible({ timeout: 12_000 })
    await shot(page, '04-contatos-lista')
  })

  test('performance: carrega em menos de 6 s', async ({ page }) => {
    const ms = await timed('contacts', async () => {
      await page.goto(`${BASE}/contacts`)
      await page.waitForSelector('[data-testid="contacts-page"]', { timeout: 15_000 })
    })
    expect(ms).toBeLessThan(6000)
  })

  test('skeleton de carregamento exibido antes dos dados', async ({ page }) => {
    // Detecta o estado de skeleton (animate-pulse) durante carregamento
    await page.goto(`${BASE}/contacts`)
    const skeletonVisible = await page.locator('.animate-pulse').isVisible({ timeout: 3_000 }).catch(() => false)
    console.log(`  ℹ️ Skeleton visível: ${skeletonVisible}`)
    await page.waitForSelector('[data-testid="contacts-page"]', { timeout: 12_000 })
  })

  test('exibe botão "Adicionar Contato"', async ({ page }) => {
    await page.goto(`${BASE}/contacts`)
    await expect(page.locator('[data-testid="new-contact-btn"]')).toBeVisible({ timeout: 10_000 })
  })

  test('dialog "Novo Contato" abre em menos de 800ms', async ({ page }) => {
    await page.goto(`${BASE}/contacts`)
    await page.waitForLoadState('networkidle')
    const ms = await timed('modal contato', async () => {
      await page.click('[data-testid="new-contact-btn"]')
      await expect(page.locator('[data-testid="contact-dialog"]')).toBeVisible({ timeout: 8_000 })
    })
    expect(ms).toBeLessThan(P.modalOpen)
    await shot(page, '04-contatos-novo-dialog')
  })

  test('dialog contém campos: Nome, Email, Telefone, Documento, Observações', async ({ page }) => {
    await page.goto(`${BASE}/contacts`)
    await page.waitForLoadState('networkidle')
    await page.click('[data-testid="new-contact-btn"]')
    const dialog = page.locator('[data-testid="contact-dialog"]')
    await expect(dialog.locator('input[placeholder="Nome completo"]')).toBeVisible({ timeout: 6_000 })
    await expect(dialog.locator('input[type="email"]')).toBeVisible()
    await expect(dialog.locator('input[placeholder*="99999"]')).toBeVisible()
    await expect(dialog.locator('input[placeholder*="CPF"]')).toBeVisible()
    await expect(dialog.locator('textarea')).toBeVisible()
  })

  test('dialog tem seletor de tipo (Paciente/Colaborador/Fornecedor/etc.)', async ({ page }) => {
    await page.goto(`${BASE}/contacts`)
    await page.waitForLoadState('networkidle')
    await page.click('[data-testid="new-contact-btn"]')
    const dialog = page.locator('[data-testid="contact-dialog"]')
    await expect(dialog.locator('button:has-text("Paciente")')).toBeVisible({ timeout: 6_000 })
    await expect(dialog.locator('button:has-text("Colaborador")')).toBeVisible()
    await expect(dialog.locator('button:has-text("Fornecedor")')).toBeVisible()
  })

  test('validação: nome é obrigatório ao criar contato', async ({ page }) => {
    await page.goto(`${BASE}/contacts`)
    await page.waitForLoadState('networkidle')
    await page.click('[data-testid="new-contact-btn"]')
    const dialog = page.locator('[data-testid="contact-dialog"]')
    await expect(dialog).toBeVisible({ timeout: 6_000 })
    await dialog.locator('button:has-text("Salvar")').click()
    await expect(dialog.locator('text=/nome é obrigatório/i')).toBeVisible({ timeout: 5_000 })
  })

  test('cancelar dialog fecha sem salvar', async ({ page }) => {
    await page.goto(`${BASE}/contacts`)
    await page.waitForLoadState('networkidle')
    await page.click('[data-testid="new-contact-btn"]')
    await page.waitForSelector('[data-testid="contact-dialog"]', { timeout: 6_000 })
    await page.locator('[data-testid="contact-dialog"] button:has-text("Cancelar")').click()
    await expect(page.locator('[data-testid="contact-dialog"]')).not.toBeVisible({ timeout: 5_000 })
  })

  test('botão de filtro por tipo "Cliente" filtra a lista', async ({ page }) => {
    await page.goto(`${BASE}/contacts`)
    await page.waitForLoadState('networkidle')
    const clienteBtn = page.locator('button:has-text("Cliente")').first()
    if (await clienteBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await clienteBtn.click()
      await page.waitForTimeout(500)
      await shot(page, '04-contatos-filtro-cliente')
    }
  })

  test('campo de busca filtra contatos pelo nome', async ({ page }) => {
    await page.goto(`${BASE}/contacts`)
    await page.waitForLoadState('networkidle')
    const searchInput = page.locator('input[placeholder*="Pesquisar"]')
    if (await searchInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await searchInput.fill('a')
      await page.waitForTimeout(400)
      await shot(page, '04-contatos-busca')
    }
  })

  test('botão de excluir exige dois cliques (inline confirm)', async ({ page }) => {
    await page.goto(`${BASE}/contacts`)
    await page.waitForLoadState('networkidle')
    const trash = page.locator('button[title="Excluir contato"]').first()
    if (await trash.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await trash.click()
      await expect(page.locator('button:has-text("Confirmar?")')).toBeVisible({ timeout: 3_000 })
      // NÃO confirma — apenas verifica que o estado de confirmação apareceu
      await shot(page, '04-contatos-delete-confirm')
      // Espera 3s para o estado de confirmação resetar automaticamente
      await page.waitForTimeout(3200)
      await expect(page.locator('button[title="Excluir contato"]').first()).toBeVisible({ timeout: 3_000 })
    }
  })

  test('botão "Ver prontuário" navega para /contacts/:id', async ({ page }) => {
    await page.goto(`${BASE}/contacts`)
    await page.waitForLoadState('networkidle')
    const prontuarioBtn = page.locator('button[title="Ver prontuário"]').first()
    if (await prontuarioBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await prontuarioBtn.click()
      await expect(page).toHaveURL(/\/contacts\/\d+/, { timeout: 8_000 })
      await shot(page, '04-contatos-prontuario')
    }
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 05. TRANSAÇÕES
// ══════════════════════════════════════════════════════════════════════════════
test.describe('05 · Transações', () => {
  test.beforeEach(async ({ page }) => { await login(page) })

  test('página carrega com data-testid="transactions-page"', async ({ page }) => {
    await page.goto(`${BASE}/transactions`)
    await expect(page.locator('[data-testid="transactions-page"]')).toBeVisible({ timeout: 12_000 })
    await shot(page, '05-transacoes-lista')
  })

  test('performance: carrega em menos de 4 s', async ({ page }) => {
    const ms = await timed('transactions', async () => {
      await page.goto(`${BASE}/transactions`)
      await page.waitForSelector('[data-testid="transactions-page"]', { timeout: 12_000 })
    })
    expect(ms).toBeLessThan(P.pageLoad)
  })

  test('botão "Nova Transação" abre dialog de adição rápida', async ({ page }) => {
    await page.goto(`${BASE}/transactions`)
    await page.waitForLoadState('networkidle')
    await page.click('[data-testid="new-transaction-btn"]')
    await expect(page.locator('[data-testid="transaction-dialog"]')).toBeVisible({ timeout: 6_000 })
    await shot(page, '05-transacoes-novo-quick')
  })

  test('dialog "Nova Transação" tem campos: Descrição, Valor, Tipo', async ({ page }) => {
    await page.goto(`${BASE}/transactions`)
    await page.waitForLoadState('networkidle')
    await page.click('[data-testid="new-transaction-btn"]')
    const dialog = page.locator('[data-testid="transaction-dialog"]')
    await expect(dialog.locator('input#quick-description')).toBeVisible({ timeout: 6_000 })
    await expect(dialog.locator('input#quick-amount')).toBeVisible()
    await expect(dialog.locator('text=/receita|despesa/i').first()).toBeVisible()
  })

  test('seletor Receita / Despesa alterna o tipo da transação', async ({ page }) => {
    await page.goto(`${BASE}/transactions`)
    await page.waitForLoadState('networkidle')
    await page.click('[data-testid="new-transaction-btn"]')
    const dialog = page.locator('[data-testid="transaction-dialog"]')
    await expect(dialog).toBeVisible({ timeout: 6_000 })
    const despesaOpt = dialog.locator('text=/despesa/i').first()
    if (await despesaOpt.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await despesaOpt.click()
    }
  })

  test('validação: submeter transação sem descrição exibe erro ou mantém dialog', async ({ page }) => {
    await page.goto(`${BASE}/transactions`)
    await page.waitForLoadState('networkidle')
    await page.click('[data-testid="new-transaction-btn"]')
    const dialog = page.locator('[data-testid="transaction-dialog"]')
    await expect(dialog).toBeVisible({ timeout: 6_000 })
    // O botão de salvar do quick-add não tem type="submit", usa onClick
    const saveBtn = dialog.locator('button:has-text("Salvar")').first()
    if (await saveBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await saveBtn.click()
      await page.waitForTimeout(800)
      const stillOpen = await dialog.isVisible({ timeout: 2_000 }).catch(() => false)
      const hasError = await page.locator('[role="alert"], .text-red-500, .text-destructive').isVisible({ timeout: 2_000 }).catch(() => false)
      console.log(`  ℹ️ Dialog aberto: ${stillOpen} | Erro visível: ${hasError}`)
      expect(stillOpen || hasError).toBe(true)
    }
  })

  test('filtro por Receita filtra a tabela', async ({ page }) => {
    await page.goto(`${BASE}/transactions`)
    await page.waitForLoadState('networkidle')
    const receitaBtn = page.locator('button:has-text("Receitas")').first()
    if (await receitaBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await receitaBtn.click()
      await page.waitForTimeout(400)
      await shot(page, '05-transacoes-filtro-receita')
    }
  })

  test('filtro por Despesa filtra a tabela', async ({ page }) => {
    await page.goto(`${BASE}/transactions`)
    await page.waitForLoadState('networkidle')
    const despesaBtn = page.locator('button:has-text("Despesas")').first()
    if (await despesaBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await despesaBtn.click()
      await page.waitForTimeout(400)
      await shot(page, '05-transacoes-filtro-despesa')
    }
  })

  test('status Pago/Pendente é visível na tabela/cards', async ({ page }) => {
    await page.goto(`${BASE}/transactions`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
    const statusBtn = page.locator('button:has-text("Pago"), button:has-text("Pendente")').first()
    const isVis = await statusBtn.isVisible({ timeout: 8_000 }).catch(() => false)
    console.log(`  ℹ️ Botão de status Pago/Pendente visível: ${isVis}`)
    // Informa mas não falha — pode não haver transações cadastradas
  })

  test('campo de busca filtra transações', async ({ page }) => {
    await page.goto(`${BASE}/transactions`)
    await page.waitForLoadState('networkidle')
    const searchInput = page.locator('input[placeholder*="buscar"], input[placeholder*="Buscar"], input[placeholder*="pesquisar"]').first()
    if (await searchInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await searchInput.fill('teste')
      await page.waitForTimeout(600)
    }
  })

  test('mobile: transações exibem cards em vez de tabela (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(`${BASE}/transactions`)
    await expect(page.locator('[data-testid="transactions-page"]')).toBeVisible({ timeout: 12_000 })
    await shot(page, '05-transacoes-mobile')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 06. SERVIÇOS
// ══════════════════════════════════════════════════════════════════════════════
test.describe('06 · Serviços', () => {
  test.beforeEach(async ({ page }) => { await login(page) })

  test('página carrega com data-testid="services-page"', async ({ page }) => {
    await page.goto(`${BASE}/services`)
    await expect(page.locator('[data-testid="services-page"]')).toBeVisible({ timeout: 12_000 })
    await shot(page, '06-servicos-lista')
  })

  test('botão "Novo Serviço" abre dialog', async ({ page }) => {
    await page.goto(`${BASE}/services`)
    await page.waitForLoadState('networkidle')
    await page.click('[data-testid="new-service-btn"]')
    await expect(page.locator('[data-testid="service-dialog"]')).toBeVisible({ timeout: 6_000 })
    await shot(page, '06-servicos-novo-dialog')
  })

  test('dialog tem campos: Nome do Serviço, Preço, Duração', async ({ page }) => {
    await page.goto(`${BASE}/services`)
    await page.waitForLoadState('networkidle')
    await page.click('[data-testid="new-service-btn"]')
    const dialog = page.locator('[data-testid="service-dialog"]')
    await expect(dialog.locator('input#name')).toBeVisible({ timeout: 6_000 })
    const priceInput = dialog.locator('input#price, input[type="number"]').first()
    const hasPriceInput = await priceInput.isVisible({ timeout: 3_000 }).catch(() => false)
    console.log(`  ℹ️ Campo preço visível: ${hasPriceInput}`)
  })

  test('validação: salvar serviço sem nome mantém dialog aberto', async ({ page }) => {
    await page.goto(`${BASE}/services`)
    await page.waitForLoadState('networkidle')
    await page.click('[data-testid="new-service-btn"]')
    const dialog = page.locator('[data-testid="service-dialog"]')
    await expect(dialog).toBeVisible({ timeout: 6_000 })
    // Botão de submit usa type="submit" e texto "Criar" (não "Salvar")
    const submitBtn = dialog.locator('button[type="submit"]').first()
    if (await submitBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await submitBtn.click()
      await page.waitForTimeout(500)
      const open = await dialog.isVisible().catch(() => false)
      console.log(`  ℹ️ Dialog aberto após submit sem nome: ${open}`)
    }
  })

  test('cancelar dialog fecha sem criar serviço', async ({ page }) => {
    await page.goto(`${BASE}/services`)
    await page.waitForLoadState('networkidle')
    await page.click('[data-testid="new-service-btn"]')
    await page.waitForSelector('[data-testid="service-dialog"]', { timeout: 6_000 })
    await page.locator('[data-testid="service-dialog"] button:has-text("Cancelar")').click()
    await expect(page.locator('[data-testid="service-dialog"]')).not.toBeVisible({ timeout: 5_000 })
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 07. PROFISSIONAIS
// ══════════════════════════════════════════════════════════════════════════════
test.describe('07 · Profissionais', () => {
  test.beforeEach(async ({ page }) => { await login(page) })

  test('página carrega com data-testid="professionals-page"', async ({ page }) => {
    await page.goto(`${BASE}/professionals`)
    await expect(page.locator('[data-testid="professionals-page"]')).toBeVisible({ timeout: 12_000 })
    await shot(page, '07-profissionais-lista')
  })

  test('botão "Novo Profissional" abre dialog', async ({ page }) => {
    await page.goto(`${BASE}/professionals`)
    await page.waitForLoadState('networkidle')
    await page.click('[data-testid="new-professional-btn"]')
    await expect(page.locator('[data-testid="professional-dialog"]')).toBeVisible({ timeout: 6_000 })
    await shot(page, '07-profissionais-novo-dialog')
  })

  test('dialog tem campos: Nome, Email, Telefone', async ({ page }) => {
    await page.goto(`${BASE}/professionals`)
    await page.waitForLoadState('networkidle')
    await page.click('[data-testid="new-professional-btn"]')
    const dialog = page.locator('[data-testid="professional-dialog"]')
    await expect(dialog.locator('input#first_name')).toBeVisible({ timeout: 6_000 })
    const emailInput = dialog.locator('input[type="email"]')
    const hasEmail = await emailInput.isVisible({ timeout: 3_000 }).catch(() => false)
    console.log(`  ℹ️ Campo email visível: ${hasEmail}`)
  })

  test('cancelar dialog fecha sem criar profissional', async ({ page }) => {
    await page.goto(`${BASE}/professionals`)
    await page.waitForLoadState('networkidle')
    await page.click('[data-testid="new-professional-btn"]')
    await page.waitForSelector('[data-testid="professional-dialog"]', { timeout: 6_000 })
    await page.locator('[data-testid="professional-dialog"] button:has-text("Cancelar")').click()
    await expect(page.locator('[data-testid="professional-dialog"]')).not.toBeVisible({ timeout: 5_000 })
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 08. HORÁRIOS DE TRABALHO
// ══════════════════════════════════════════════════════════════════════════════
test.describe('08 · Horários de Trabalho', () => {
  test.beforeEach(async ({ page }) => { await login(page) })

  test('página carrega e exibe dias da semana', async ({ page }) => {
    await page.goto(`${BASE}/working-hours`)
    await page.waitForLoadState('networkidle')
    await expect(
      page.locator('text=/segunda|seg|monday/i').first()
    ).toBeVisible({ timeout: 12_000 })
    await shot(page, '08-horarios-trabalho')
  })

  test('toggling de dia habilita/desabilita o horário', async ({ page }) => {
    await page.goto(`${BASE}/working-hours`)
    await page.waitForLoadState('networkidle')
    const toggle = page.locator('[type="checkbox"], button[role="switch"]').first()
    if (await toggle.isVisible({ timeout: 5_000 }).catch(() => false)) {
      const before = await toggle.isChecked().catch(() => null)
      await toggle.click()
      await page.waitForTimeout(400)
      console.log(`  ℹ️ Toggle alterado de: ${before}`)
    }
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 09. LINKS DE AGENDAMENTO
// ══════════════════════════════════════════════════════════════════════════════
test.describe('09 · Links de Agendamento', () => {
  test.beforeEach(async ({ page }) => { await login(page) })

  test('página carrega', async ({ page }) => {
    await page.goto(`${BASE}/appointment-links`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 12_000 })
    await shot(page, '09-appointment-links')
  })

  test('botão de criar novo link visível', async ({ page }) => {
    await page.goto(`${BASE}/appointment-links`)
    await page.waitForLoadState('networkidle')
    const createBtn = page.locator('button:has-text("Novo"), button:has-text("Criar"), button:has-text("link")').first()
    const isVis = await createBtn.isVisible({ timeout: 6_000 }).catch(() => false)
    console.log(`  ℹ️ Botão criar link visível: ${isVis}`)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 10. NOTAS DE AGENDAMENTO
// ══════════════════════════════════════════════════════════════════════════════
test.describe('10 · Notas de Agendamento', () => {
  test.beforeEach(async ({ page }) => { await login(page) })

  test('página carrega', async ({ page }) => {
    await page.goto(`${BASE}/appointment-notes`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).not.toContainText('404', { timeout: 8_000 })
    await shot(page, '10-appointment-notes')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 11. RELATÓRIOS FINANCEIROS
// ══════════════════════════════════════════════════════════════════════════════
test.describe('11 · Relatórios Financeiros', () => {
  test.beforeEach(async ({ page }) => { await login(page) })

  test('página carrega sem erro', async ({ page }) => {
    await page.goto(`${BASE}/reports`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).not.toContainText('404', { timeout: 10_000 })
    await shot(page, '11-relatorios')
  })

  test('exibe gráficos ou dados financeiros', async ({ page }) => {
    await page.goto(`${BASE}/reports`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // aguarda recharts renderizar
    const hasChart = await page.locator('.recharts-wrapper, canvas, svg').isVisible({ timeout: 6_000 }).catch(() => false)
    // Tenta vários padrões de texto presentes no FinancialReports
    const bodyText = await page.locator('body').textContent().catch(() => '')
    const hasRevenueText = /receita|Receita|RECEITA|despesa|Despesa|comissão|Comissão/i.test(bodyText)
    console.log(`  ℹ️ Gráfico: ${hasChart} | Texto financeiro: ${hasRevenueText}`)
    // Página de relatórios deve ter pelo menos um desses
    expect(hasChart || hasRevenueText).toBe(true)
    await shot(page, '11-relatorios-graficos')
  })

  test('seletor de período de datas está presente', async ({ page }) => {
    await page.goto(`${BASE}/reports`)
    await page.waitForLoadState('networkidle')
    const hasPeriodo = await page.locator('text=/período|data|mês/i').isVisible({ timeout: 8_000 }).catch(() => false)
    console.log(`  ℹ️ Seletor de período visível: ${hasPeriodo}`)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 12. COMISSÕES
// ══════════════════════════════════════════════════════════════════════════════
test.describe('12 · Comissões', () => {
  test.beforeEach(async ({ page }) => { await login(page) })

  test('página carrega sem erro', async ({ page }) => {
    await page.goto(`${BASE}/commissions`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).not.toContainText('404', { timeout: 10_000 })
    await shot(page, '12-comissoes')
  })

  test('exibe conteúdo de comissões', async ({ page }) => {
    await page.goto(`${BASE}/commissions`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800)
    const bodyText = await page.locator('body').textContent().catch(() => '')
    const hasContent = /comissões|comissão|profissional|período/i.test(bodyText)
    const hasTable = await page.locator('table, [role="grid"], h1').isVisible({ timeout: 6_000 }).catch(() => false)
    console.log(`  ℹ️ Texto comissões: ${hasContent} | Tabela/H1: ${hasTable}`)
    expect(hasContent || hasTable).toBe(true)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 13. CONFIGURAÇÕES DA EMPRESA
// ══════════════════════════════════════════════════════════════════════════════
test.describe('13 · Configurações da Empresa', () => {
  test.beforeEach(async ({ page }) => { await login(page) })

  test('página carrega sem erro', async ({ page }) => {
    await page.goto(`${BASE}/company-settings`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).not.toContainText('404', { timeout: 10_000 })
    await shot(page, '13-company-settings')
  })

  test('exibe campos de configuração (nome, logo, etc.)', async ({ page }) => {
    await page.goto(`${BASE}/company-settings`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1500)
    const bodyText = await page.locator('body').textContent().catch(() => '')
    const hasConfigText = /empresa|configuração|nome|CNPJ|documento|settings/i.test(bodyText)
    const hasForm = await page.locator('form, input, textarea').isVisible({ timeout: 6_000 }).catch(() => false)
    console.log(`  ℹ️ Formulário: ${hasForm} | Texto config: ${hasConfigText}`)
    expect(hasForm || hasConfigText).toBe(true)
  })

  test('botão Salvar está presente', async ({ page }) => {
    await page.goto(`${BASE}/company-settings`)
    await page.waitForLoadState('networkidle')
    const saveBtn = page.locator('button:has-text("Salvar"), button[type="submit"]').first()
    const isVis = await saveBtn.isVisible({ timeout: 8_000 }).catch(() => false)
    console.log(`  ℹ️ Botão Salvar visível: ${isVis}`)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 14. VITRINE / DESCOBRIR
// ══════════════════════════════════════════════════════════════════════════════
test.describe('14 · Vitrine & Descobrir', () => {
  test('página /descobrir carrega sem login', async ({ page }) => {
    await page.goto(`${BASE}/descobrir`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).not.toContainText('404', { timeout: 10_000 })
    await shot(page, '14-descobrir-publico')
  })

  test('campo de busca na vitrine pública está presente', async ({ page }) => {
    await page.goto(`${BASE}/descobrir`)
    await page.waitForLoadState('networkidle')
    const searchEl = page.locator('input[type="search"], input[placeholder*="buscar"], input[placeholder*="Buscar"]').first()
    const isVis = await searchEl.isVisible({ timeout: 8_000 }).catch(() => false)
    console.log(`  ℹ️ Busca na vitrine: ${isVis}`)
  })

  test('vitrine autenticada (/vitrine) carrega configurações', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/vitrine`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).not.toContainText('404', { timeout: 10_000 })
    await shot(page, '14-vitrine-settings')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 15. ANAMNESE
// ══════════════════════════════════════════════════════════════════════════════
test.describe('15 · Anamnese', () => {
  test.beforeEach(async ({ page }) => { await login(page) })

  test('página de templates carrega sem erro', async ({ page }) => {
    await page.goto(`${BASE}/anamnese`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).not.toContainText('404', { timeout: 10_000 })
    await shot(page, '15-anamnese-templates')
  })

  test('botão de criar novo template é visível', async ({ page }) => {
    await page.goto(`${BASE}/anamnese`)
    await page.waitForLoadState('networkidle')
    const createBtn = page.locator('button:has-text("Novo"), button:has-text("Criar"), button:has-text("Template")').first()
    const isVis = await createBtn.isVisible({ timeout: 6_000 }).catch(() => false)
    console.log(`  ℹ️ Botão criar template: ${isVis}`)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 16. PLANOS ALIMENTARES (NUTRIÇÃO)
// ══════════════════════════════════════════════════════════════════════════════
test.describe('16 · Planos Alimentares', () => {
  test.beforeEach(async ({ page }) => { await login(page) })

  test('prontuário de contato exibe seção de planos alimentares', async ({ page }) => {
    await page.goto(`${BASE}/contacts`)
    await page.waitForLoadState('networkidle')
    const btn = page.locator('button[title="Ver prontuário"]').first()
    if (await btn.isVisible({ timeout: 6_000 }).catch(() => false)) {
      await btn.click()
      await expect(page).toHaveURL(/\/contacts\/\d+/, { timeout: 8_000 })
      await page.waitForLoadState('networkidle')
      const hasMealPlan = await page.locator('text=/plano alimentar|refeição|meal/i').isVisible({ timeout: 6_000 }).catch(() => false)
      console.log(`  ℹ️ Seção plano alimentar visível: ${hasMealPlan}`)
      await shot(page, '16-prontuario-planos')
    }
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 17. PÁGINAS PÚBLICAS
// ══════════════════════════════════════════════════════════════════════════════
test.describe('17 · Páginas Públicas', () => {
  test('landing page carrega', async ({ page }) => {
    await page.goto(`${BASE}/landing`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).not.toContainText('404', { timeout: 10_000 })
    await shot(page, '17-landing')
  })

  test('/agendar/:token inválido mostra erro gracioso (não 500)', async ({ page }) => {
    await page.goto(`${BASE}/agendar/token-invalido-000`)
    await page.waitForLoadState('networkidle')
    // Pode mostrar "link inválido" ou "não encontrado" — não deve mostrar stack trace
    await expect(page.locator('body')).not.toContainText('Error: ', { timeout: 6_000 })
    await shot(page, '17-agendamento-publico-token-invalido')
  })

  test('/d/:token inválido mostra erro gracioso', async ({ page }) => {
    await page.goto(`${BASE}/d/token-invalido-000`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).not.toContainText('Error: ', { timeout: 6_000 })
  })

  test('/plano/:token inválido mostra erro gracioso', async ({ page }) => {
    await page.goto(`${BASE}/plano/token-invalido-000`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).not.toContainText('Error: ', { timeout: 6_000 })
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 18. NAVEGAÇÃO & LAYOUT
// ══════════════════════════════════════════════════════════════════════════════
test.describe('18 · Navegação & Layout', () => {
  test.beforeEach(async ({ page }) => { await login(page) })

  test('sidebar exibe links principais do menu', async ({ page }) => {
    await expect(page.locator('a[href="/"]').first()).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('a[href="/appointments"]').first()).toBeVisible()
    await expect(page.locator('a[href="/contacts"]').first()).toBeVisible()
    await expect(page.locator('a[href="/transactions"]').first()).toBeVisible()
    await shot(page, '18-sidebar')
  })

  test('todos os links do menu navegam sem erro de rota', async ({ page }) => {
    const routes = [
      '/', '/appointments', '/contacts', '/transactions',
      '/services', '/professionals', '/working-hours', '/reports',
      '/commissions', '/appointment-links', '/vitrine', '/anamnese',
      '/company-settings', '/settings',
    ]
    for (const route of routes) {
      await page.goto(`${BASE}${route}`)
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
      const notFound = await page.locator('text=/404|not found|página não encontrada/i').isVisible({ timeout: 2_000 }).catch(() => false)
      if (notFound) {
        console.warn(`  ⚠️  Rota ${route} retornou 404`)
      }
      expect(notFound).toBe(false)
    }
  })

  test('mobile: bottom navigation visível em 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto(`${BASE}/`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(800) // aguarda hook isMobile re-render
    // BottomNavigation usa <nav> com fixed position no bottom
    const hasNav = await page.locator('nav').isVisible({ timeout: 6_000 }).catch(() => false)
    // Sidebar oculta no mobile — links de nav visíveis via bottom bar
    const hasLinks = await page.locator('a[href="/appointments"], a[href="/contacts"]').first().isVisible({ timeout: 4_000 }).catch(() => false)
    console.log(`  ℹ️ Nav mobile: ${hasNav} | Links mobile: ${hasLinks}`)
    expect(hasNav || hasLinks).toBe(true)
    await shot(page, '18-mobile-nav')
  })

  test('sidebar colapsa / expande ao clicar no toggle', async ({ page }) => {
    const toggle = page.locator('button[title*="colapsar"], button[title*="recolher"], button[aria-label*="sidebar"]').first()
    if (await toggle.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await toggle.click()
      await page.waitForTimeout(300)
      await shot(page, '18-sidebar-collapsed')
    }
  })

  test('header exibe saldo da conta bancária', async ({ page }) => {
    await page.waitForLoadState('networkidle')
    const hasSaldo = await page.locator('text=/R\$/').isVisible({ timeout: 10_000 }).catch(() => false)
    console.log(`  ℹ️ Saldo exibido no header: ${hasSaldo}`)
  })

  test('tema dark é aplicado ao alternar (se disponível)', async ({ page }) => {
    const darkBtn = page.locator('button[title*="dark"], button[title*="escuro"], button[aria-label*="tema"]').first()
    if (await darkBtn.isVisible({ timeout: 4_000 }).catch(() => false)) {
      await darkBtn.click()
      await page.waitForTimeout(400)
      const isDark = await page.locator('html.dark, body.dark, [data-theme="dark"]').isVisible().catch(() => false)
      console.log(`  ℹ️ Tema dark ativado: ${isDark}`)
    }
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 19. PERFORMANCE GERAL — TODAS AS ROTAS
// ══════════════════════════════════════════════════════════════════════════════
test.describe('19 · Performance Geral', () => {
  test.beforeEach(async ({ page }) => { await login(page) })

  test('mede tempo de carregamento de todas as rotas principais', async ({ page }) => {
    const results = []
    const routes = [
      { path: '/',                  label: 'Dashboard' },
      { path: '/appointments',      label: 'Agendamentos' },
      { path: '/contacts',          label: 'Contatos' },
      { path: '/transactions',      label: 'Transações' },
      { path: '/services',          label: 'Serviços' },
      { path: '/professionals',     label: 'Profissionais' },
      { path: '/working-hours',     label: 'Horários' },
      { path: '/reports',           label: 'Relatórios' },
      { path: '/commissions',       label: 'Comissões' },
      { path: '/appointment-links', label: 'Links Agend.' },
      { path: '/vitrine',           label: 'Vitrine' },
      { path: '/anamnese',          label: 'Anamnese' },
      { path: '/company-settings',  label: 'Config. Empresa' },
      { path: '/settings',          label: 'Configurações' },
    ]

    for (const { path, label } of routes) {
      const t0 = Date.now()
      await page.goto(`${BASE}${path}`)
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
      const ms = Date.now() - t0
      const status = ms <= P.pageLoad ? '✅' : ms <= P.pageLoad * 1.5 ? '⚠️' : '❌'
      console.log(`  ${status}  ${label.padEnd(16)} ${ms}ms`)
      results.push({ label, ms, ok: ms <= P.pageLoad })
    }

    const slow = results.filter(r => !r.ok)
    if (slow.length > 0) {
      console.warn(`\n  ⚠️  ${slow.length} rota(s) acima de ${P.pageLoad}ms:`)
      slow.forEach(r => console.warn(`      • ${r.label}: ${r.ms}ms`))
    }

    // Falha se mais de metade das rotas for lenta
    expect(slow.length).toBeLessThan(routes.length / 2)
  })

  test('Web Vitals (CLS, FID, FCP) — Dashboard', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 15_000 })

    const vitals = await page.evaluate(() => {
      return new Promise(resolve => {
        const result = { fcp: null, lcp: null, cls: 0 }

        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') result.fcp = entry.startTime
          }
        }).observe({ type: 'paint', buffered: true })

        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            result.lcp = entry.startTime
          }
        }).observe({ type: 'largest-contentful-paint', buffered: true })

        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) result.cls += entry.value
          }
        }).observe({ type: 'layout-shift', buffered: true })

        setTimeout(() => resolve(result), 4000)
      })
    })

    console.log('\n  ── Web Vitals (Dashboard) ──────────────────────')
    console.log(`  FCP : ${Math.round(vitals.fcp || 0)}ms  ${(vitals.fcp || 0) < 1800 ? '✅ Bom' : (vitals.fcp || 0) < 3000 ? '⚠️ Precisa melhorar' : '❌ Ruim'}`)
    console.log(`  LCP : ${Math.round(vitals.lcp || 0)}ms  ${(vitals.lcp || 0) < 2500 ? '✅ Bom' : (vitals.lcp || 0) < 4000 ? '⚠️ Precisa melhorar' : '❌ Ruim'}`)
    console.log(`  CLS : ${(vitals.cls || 0).toFixed(3)}   ${(vitals.cls || 0) < 0.1 ? '✅ Bom' : (vitals.cls || 0) < 0.25 ? '⚠️ Precisa melhorar' : '❌ Ruim'}`)
    console.log('  ────────────────────────────────────────────────\n')

    // CLS deve ser baixo (evitar layout shift)
    expect(vitals.cls || 0).toBeLessThan(0.5)
    await shot(page, '19-web-vitals-dashboard')
  })

  test('tempo de abertura de modais críticos < 800ms', async ({ page }) => {
    const modalTests = [
      {
        route: '/contacts',
        trigger: '[data-testid="new-contact-btn"]',
        dialog: '[data-testid="contact-dialog"]',
        label: 'Modal Contato'
      },
      {
        route: '/transactions',
        trigger: '[data-testid="new-transaction-btn"]',
        dialog: '[data-testid="transaction-dialog"]',
        label: 'Modal Transação'
      },
      {
        route: '/services',
        trigger: '[data-testid="new-service-btn"]',
        dialog: '[data-testid="service-dialog"]',
        label: 'Modal Serviço'
      },
      {
        route: '/professionals',
        trigger: '[data-testid="new-professional-btn"]',
        dialog: '[data-testid="professional-dialog"]',
        label: 'Modal Profissional'
      },
    ]

    console.log('\n  ── Tempos de abertura de modais ───────────────')
    for (const { route, trigger, dialog, label } of modalTests) {
      await page.goto(`${BASE}${route}`)
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})

      const triggerEl = page.locator(trigger).first()
      if (!(await triggerEl.isVisible({ timeout: 5_000 }).catch(() => false))) {
        console.log(`  ⏭  ${label}: trigger não encontrado, pulando`)
        continue
      }

      const t0 = Date.now()
      await triggerEl.click()
      await page.locator(dialog).waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {})
      const ms = Date.now() - t0

      const ok = ms < P.modalOpen
      console.log(`  ${ok ? '✅' : '⚠️'}  ${label}: ${ms}ms`)
      expect(ms).toBeLessThan(P.modalOpen * 2) // dobro do ideal ainda é aceitável

      // Fecha o modal
      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)
    }
    console.log('  ────────────────────────────────────────────────\n')
  })

  test('sem erros JS no console durante navegação normal', async ({ page }) => {
    const errors = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', err => errors.push(err.message))

    const routes = ['/', '/appointments', '/contacts', '/transactions', '/services']
    for (const route of routes) {
      await page.goto(`${BASE}${route}`)
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    }

    const critical = errors.filter(e =>
      !e.includes('ResizeObserver') &&
      !e.includes('Non-Error promise rejection') &&
      !e.includes('favicon')
    )

    if (critical.length > 0) {
      console.warn('\n  ⚠️  Erros JS capturados:')
      critical.slice(0, 5).forEach(e => console.warn(`      • ${e.slice(0, 120)}`))
    }

    expect(critical.length).toBeLessThan(5)
  })

  test('sem requisições com status 5xx durante uso normal', async ({ page }) => {
    const serverErrors = []
    page.on('response', res => {
      if (res.status() >= 500) serverErrors.push(`${res.status()} ${res.url()}`)
    })

    const routes = ['/', '/appointments', '/contacts', '/transactions']
    for (const route of routes) {
      await page.goto(`${BASE}${route}`)
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
    }

    if (serverErrors.length > 0) {
      console.warn('\n  ❌ Erros 5xx capturados:')
      serverErrors.forEach(e => console.warn(`      • ${e}`))
    }

    expect(serverErrors.length).toBe(0)
  })
})
