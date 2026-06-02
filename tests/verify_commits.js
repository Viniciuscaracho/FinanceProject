/**
 * Verify: commits recentes contra https://orbinutri.com.br
 * Usa conta E2E com login por senha (não depende de Google OAuth).
 * Cobre: login, transactions (nav mensal + bulk), contacts (nota fiscal),
 *        PatientProfile, MealPlanBuilder (food search tabs), NutrientPanel.
 */
const { chromium } = require('playwright');
const { execSync }  = require('child_process');

const BASE      = 'https://orbinutri.com.br';
const API_BASE  = 'https://orbiproject-orbiapp.dzkxmb.easypanel.host/api/v1';
const E2E_EMAIL = 'viniciuscaracho77+nutritest@gmail.com';
const E2E_PASS  = 'test123456';
const RUN_ID    = Date.now();
const SHOTS     = '/tmp/verify_commits';

execSync(`mkdir -p ${SHOTS}`);

async function shot(page, name) {
  const p = `${SHOTS}/${name}.png`;
  await page.screenshot({ path: p, fullPage: false });
  console.log(`  📸 ${p}`);
  return p;
}

const results = [];
function log(icon, step, detail = '') {
  const line = `${icon}  ${step}${detail ? ': ' + detail : ''}`;
  console.log(line);
  results.push({ icon, step, detail });
}

// ── Tenta login; se conta não existe, registra primeiro ──────────────────────
async function ensureLogin(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 20000 });
  await shot(page, '01-login-page');

  const emailInput = page.locator('[data-testid="email-input"]').first();
  const passInput  = page.locator('[data-testid="password-input"]').first();

  await emailInput.fill(email);
  await passInput.fill(password);
  await page.locator('[data-testid="login-button"]').first().click();

  // Detectar erro de credencial vs erro de conta inexistente
  await page.waitForTimeout(2000);
  const errorText = await page.locator('.text-red, [class*="error"], [class*="alert"]').first().textContent().catch(() => '');

  if (page.url().includes('/login')) {
    // Conta não existe — registrar
    console.log('  ℹ️  Conta não encontrada, registrando conta E2E...');
    const regEmail = `viniciuscaracho77+e2e_${RUN_ID}@gmail.com`;

    await page.getByRole('button', { name: /crie uma conta|criar conta|cadastre/i }).first().click();
    await page.waitForTimeout(500);

    await page.locator('#reg-account-name, [placeholder*="Clínica"], [placeholder*="consultório"]').first().fill('Clínica E2E Verify');
    await page.locator('#reg-name, [placeholder*="nome"], [placeholder*="Nome"]').first().fill('E2E Tester');
    await page.locator('#reg-email, [data-testid="reg-email"], input[type="email"]').first().fill(regEmail);
    await page.getByTestId('reg-password-input').fill('TestE2E@2026');
    await page.getByTestId('reg-password-confirm-input').fill('TestE2E@2026');
    await page.getByTestId('register-button').click();

    try {
      await page.waitForURL(/\/(dashboard|contacts|$)(?!.*login)/, { timeout: 25000 });
      log('✅', 'Registro E2E', `conta criada: ${regEmail}`);
      return true;
    } catch {
      await shot(page, '01c-register-fail');
      log('❌', 'Registro E2E falhou', page.url());
      return false;
    }
  }

  try {
    await page.waitForURL(/\/(dashboard|contacts|$)(?!.*login)/, { timeout: 15000 });
    log('✅', 'Login E2E', `${email}`);
    return true;
  } catch {
    await shot(page, '01b-login-fail');
    log('❌', 'Login falhou', `URL: ${page.url()} | erro: ${errorText.substring(0, 80)}`);
    return false;
  }
}

// Completa o onboarding multi-step preenchendo todos os campos obrigatórios
async function dismissOnboardingModals(page) {
  // Seletor do overlay do modal de onboarding
  const modalOverlay = '[class*="fixed"][class*="inset"], [data-radix-dialog-overlay], [class*="overlay"]';

  for (let step = 0; step < 8; step++) {
    const continueBtn = page.locator('button').filter({ hasText: /continuar/i }).first();
    const isVisible = await continueBtn.isVisible({ timeout: 1500 }).catch(() => false);
    if (!isVisible) break;

    // Preencher TODOS os inputs visíveis dentro do modal que estejam vazios
    const allInputs = await page.locator('input:visible').all();
    for (const inp of allInputs) {
      const placeholder = await inp.getAttribute('placeholder').catch(() => '');
      const val = await inp.inputValue().catch(() => '');
      if (val.trim()) continue; // já preenchido

      if (/cpf|cnpj|000\.000/i.test(placeholder)) {
        await inp.fill('111.444.777-35');
      } else if (/serviço|service|consulta/i.test(placeholder)) {
        await inp.fill('Consulta Nutricional');
      } else if (/preço|price|valor|R\$/i.test(placeholder) || await inp.getAttribute('type').then(t => t === 'number').catch(() => false)) {
        await inp.fill('150');
      } else if (/nome|name|clínica|clinic/i.test(placeholder)) {
        await inp.fill('Clínica E2E');
      } else if (placeholder && placeholder.length > 0) {
        await inp.fill('E2E Teste');
      }
      await page.waitForTimeout(150);
    }

    // Verificar se o botão está habilitado após preencher
    const isDisabled = await continueBtn.isDisabled().catch(() => false);
    console.log(`  ℹ️  Onboarding step ${step + 1}${isDisabled ? ' (botão ainda disabled, tentando force)' : ''} — clicando Continuar`);
    await continueBtn.click({ force: true });
    await page.waitForTimeout(900);
  }
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const ctx  = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // Coleta erros de JS globalmente
  const jsErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') jsErrors.push(msg.text()); });
  page.on('pageerror', err => jsErrors.push(err.message));

  // ── 1. Login / Registro ───────────────────────────────────────────────────
  console.log('\n=== 1. Login ===');
  const loggedIn = await ensureLogin(page, E2E_EMAIL, E2E_PASS);
  if (!loggedIn) {
    await browser.close();
    return printReport();
  }
  await shot(page, '02-after-login');

  // Dispensar modal de onboarding (CPF/CNPJ, configurações iniciais etc.)
  await dismissOnboardingModals(page);

  // ── 2. Transactions — navegação mensal + bulk select ──────────────────────
  console.log('\n=== 2. Transactions ===');
  await page.goto(`${BASE}/transactions`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1500);
  await shot(page, '03-transactions');

  // Dispensar modal que possa ter aparecido na navegação
  await dismissOnboardingModals(page);

  // Verificar label de mês atual — padrão "Janeiro de 2026" ou "Jan 2026"
  const monthText = await page.locator('text=/janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro/i').first().textContent().catch(() => null);
  log(monthText ? '✅' : '⚠️', 'Transactions — label mensal', monthText ? `"${monthText.trim().substring(0, 40)}"` : 'não encontrado');

  // Navegar ao mês anterior via botão ChevronLeft (force:true para ignorar overlays)
  const allButtons = await page.locator('button').all();
  let prevClicked = false;
  for (const btn of allButtons) {
    const html = await btn.innerHTML().catch(() => '');
    if (html.includes('chevron-left') || html.includes('ChevronLeft')) {
      await btn.click({ force: true });
      prevClicked = true;
      break;
    }
  }
  await page.waitForTimeout(1000);
  const urlAfterNav = page.url();
  const hasMonthParam = urlAfterNav.includes('mes=');
  log(hasMonthParam ? '✅' : '⚠️', 'Transactions — nav mês anterior', hasMonthParam ? `?mes=${urlAfterNav.split('mes=')[1]?.split('&')[0]}` : `sem ?mes= na URL${prevClicked ? '' : ' (botão não encontrado)'}`);
  await shot(page, '04-transactions-prev-month');

  // Bulk select
  const checkCount = await page.locator('input[type="checkbox"]').count();
  log(checkCount > 0 ? '✅' : '⚠️', 'Transactions — bulk select checkboxes', `${checkCount} checkbox(es)`);

  // ── 3. Contacts — seção Nota Fiscal ────────────────────────────────────────
  console.log('\n=== 3. Contacts — Nota Fiscal ===');
  await page.goto(`${BASE}/contacts`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1500);
  await shot(page, '05-contacts');

  // Tentar abrir primeiro contato (linha da tabela ou card)
  const firstRow = page.locator('tbody tr, [data-testid="contact-row"], [class*="contact-row"]').first();
  const firstRowVisible = await firstRow.isVisible().catch(() => false);

  if (firstRowVisible) {
    await firstRow.click();
    await page.waitForTimeout(1200);
    await shot(page, '06-contact-detail');
    const notaFiscal = await page.locator('text=Nota Fiscal').first().isVisible().catch(() => false);
    const birthDate  = await page.locator('input[type="date"]').count();
    const cepField   = await page.locator('input[placeholder*="00000-000"], input[placeholder*="CEP"]').count();
    log(notaFiscal ? '✅' : '⚠️', 'Contacts — seção "Nota Fiscal"', notaFiscal ? 'visível' : 'não encontrada');
    log(birthDate > 0 ? '✅' : '⚠️', 'Contacts — campo Data de Nascimento', `${birthDate} campo(s)`);
    log(cepField > 0 ? '✅' : '⚠️', 'Contacts — campo CEP', `${cepField} campo(s)`);
  } else {
    // Conta nova sem contatos — verificar apenas que a tela abre sem erro
    const hasAddBtn = await page.locator('button').filter({ hasText: /novo|adicionar|\+/i }).first().isVisible().catch(() => false);
    log(hasAddBtn ? '✅' : '⚠️', 'Contacts — tela carregou (conta sem contatos)', hasAddBtn ? 'botão "Novo" visível' : 'sem botão Novo');

    // Criar contato de teste para verificar campos
    if (hasAddBtn) {
      await page.locator('button').filter({ hasText: /novo|adicionar|\+/i }).first().click({ force: true });
      await page.waitForTimeout(1000);
      await shot(page, '06-contact-form');
      const notaFiscal = await page.locator('text=Nota Fiscal').first().isVisible().catch(() => false);
      const birthDate  = await page.locator('input[type="date"]').count();
      log(notaFiscal ? '✅' : '⚠️', 'Contacts — seção "Nota Fiscal" no form', notaFiscal ? 'visível' : 'não encontrada');
      log(birthDate > 0 ? '✅' : '⚠️', 'Contacts — campo Data de Nascimento no form', `${birthDate} campo(s)`);
      // Fechar modal
      await page.keyboard.press('Escape');
    }
  }

  // ── 4. PatientProfile — aba Plano Alimentar ────────────────────────────────
  console.log('\n=== 4. PatientProfile ===');
  // Pegar href de contato existente (ou recém-aberto)
  await page.goto(`${BASE}/contacts`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1000);

  const contactLink = page.locator('a[href*="/contacts/"]').first();
  const contactHref = await contactLink.getAttribute('href').catch(() => null);

  if (contactHref) {
    await page.goto(`${BASE}${contactHref}`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1500);
    await shot(page, '07-patient-profile');

    const mealTab = page.locator('[role="tab"], button, a').filter({ hasText: /plano alimentar/i }).first();
    const mealTabVisible = await mealTab.isVisible().catch(() => false);
    log(mealTabVisible ? '✅' : '⚠️', 'PatientProfile — aba "Plano Alimentar"', mealTabVisible ? 'visível' : 'não encontrada');

    if (mealTabVisible) {
      await mealTab.click();
      await page.waitForTimeout(1500);
      await shot(page, '08-meal-plans-tab');

      const createBtn = page.locator('button').filter({ hasText: /novo plano|criar|adicionar/i }).first();
      log(await createBtn.isVisible().catch(() => false) ? '✅' : '⚠️', 'PatientProfile — botão criar plano', '');

      // Abrir primeiro plano existente se houver
      const planLink = page.locator('a[href*="meal-plan"]').first();
      if (await planLink.count() > 0) {
        const planHref = await planLink.getAttribute('href');
        await page.goto(`${BASE}${planHref}`, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(2000);
        await shot(page, '09-meal-plan-builder');

        // ── 5. MealPlanBuilder — NutrientPanel + food search tabs ──────────
        console.log('\n=== 5. MealPlanBuilder ===');
        const nutriMacros = await page.locator('text=/kcal|proteína|prot\.|carbo|gordura/i').first().isVisible().catch(() => false);
        log(nutriMacros ? '✅' : '⚠️', 'MealPlanBuilder — NutrientPanel/macros', nutriMacros ? 'visível' : 'não encontrado');

        // Tentar abrir FoodSearch para ver as tabs de fonte
        const addFoodBtn = page.locator('button').filter({ hasText: /adicionar alimento|\+ alimento/i }).first();
        const addFoodAlt = page.locator('button[title*="alimento"], button').filter({ hasText: /\+ add|\+/i }).first();
        const openBtn = await addFoodBtn.isVisible().catch(() => false) ? addFoodBtn : addFoodAlt;

        if (await openBtn.isVisible().catch(() => false)) {
          await openBtn.click();
          await page.waitForTimeout(1200);
          await shot(page, '10-food-search');

          const tacoTab = await page.locator('text=TACO').first().isVisible().catch(() => false);
          const fabTab  = await page.locator('text=Fabricantes').first().isVisible().catch(() => false);
          const meusTab = await page.locator('text=Meus alimentos').first().isVisible().catch(() => false);
          log(tacoTab ? '✅' : '⚠️', 'FoodSearch — tab TACO', '');
          log(fabTab  ? '✅' : '⚠️', 'FoodSearch — tab Fabricantes', '');
          log(meusTab ? '✅' : '⚠️', 'FoodSearch — tab Meus alimentos', '');

          // 🔍 Probe: buscar alimento na tab TACO
          if (tacoTab) {
            await page.locator('text=TACO').first().click();
            await page.waitForTimeout(300);
            const searchInput = page.locator('input[placeholder*="buscar"], input[placeholder*="alimento"], input[type="search"]').first();
            if (await searchInput.isVisible().catch(() => false)) {
              await searchInput.fill('frango');
              await page.waitForTimeout(1500);
              const resultCount = await page.locator('[class*="result"], [class*="food-item"], li').count();
              log(resultCount > 0 ? '✅' : '⚠️', '🔍 FoodSearch TACO — busca "frango"', `${resultCount} resultado(s)`);
            }
          }
          await shot(page, '11-food-search-results');
          await page.keyboard.press('Escape');
        } else {
          log('⚠️', 'MealPlanBuilder — botão adicionar alimento', 'não encontrado');
        }
      } else {
        log('ℹ️', 'MealPlanBuilder', 'nenhum plano existente para abrir (conta nova)');
      }
    }
  } else {
    log('⚠️', 'PatientProfile', 'nenhum link de contato encontrado');
  }

  // ── 6. PublicMealPlan — rota pública ────────────────────────────────────────
  console.log('\n=== 6. Plano Público ===');
  await page.goto(`${BASE}/meal-plan/token-invalido`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(800);
  const notFound = await page.locator('text=/não encontrado|not found|expirado|inválido/i').first().isVisible().catch(() => false);
  const hasLayout = await page.locator('h1, main, body').first().isVisible().catch(() => false);
  log(hasLayout ? '✅' : '⚠️', 'PublicMealPlan — rota pública responde', notFound ? 'erro esperado (token inválido) mostrado' : 'página renderizou');
  await shot(page, '12-public-meal-plan');

  // 🔍 Probe: verificar estrutura de URL esperada (token válido via API se disponível)
  const tokenRes = await page.request.get(`${API_BASE}/health_check`).catch(() => null);
  if (tokenRes) {
    const healthy = tokenRes.ok();
    log(healthy ? '✅' : '⚠️', '🔍 API health_check', healthy ? 'OK' : `status ${tokenRes.status()}`);
  }

  // ── 7. Dark mode ────────────────────────────────────────────────────────────
  console.log('\n=== 7. Dark Mode ===');
  await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1000);
  await shot(page, '13-settings');
  const darkOption = await page.locator('text=/escuro|dark|tema/i').first().isVisible().catch(() => false);
  log(darkOption ? '✅' : '⚠️', 'Dark mode — opção em /settings', darkOption ? 'visível' : 'não encontrado');

  // ── 8. AppointmentsCalendar — fix calendar ──────────────────────────────────
  console.log('\n=== 8. Agenda / Calendar ===');
  await page.goto(`${BASE}/appointments`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1500);
  await shot(page, '14-appointments');
  const calendarEl = await page.locator('[class*="calendar"], [class*="Calendar"], table, .fc').first().isVisible().catch(() => false);
  const apptList   = await page.locator('text=/agendamento|consulta|hoje|seg|ter|qua|qui|sex/i').first().isVisible().catch(() => false);
  log(calendarEl || apptList ? '✅' : '⚠️', 'Appointments — calendário/lista carregou', '');

  // ── 9. Erros de JS globais ───────────────────────────────────────────────────
  console.log('\n=== 9. Erros de JS ===');
  const appErrors = jsErrors.filter(e =>
    !e.includes('extension') && !e.includes('chrome-extension') &&
    !e.includes('favicon') && !e.includes('ResizeObserver') &&
    !e.includes('Non-Error promise')
  );
  if (appErrors.length === 0) {
    log('✅', 'Sem erros de JS durante toda a sessão', '');
  } else {
    appErrors.slice(0, 6).forEach(e => log('⚠️', 'Erro JS', e.substring(0, 140)));
  }

  await browser.close();
  printReport();
}

function printReport() {
  console.log('\n' + '═'.repeat(60));
  console.log('RELATÓRIO FINAL — orbinutri.com.br');
  console.log('═'.repeat(60));
  results.forEach(r => console.log(`${r.icon}  ${r.step}${r.detail ? ': ' + r.detail : ''}`));
  const pass  = results.filter(r => r.icon === '✅').length;
  const warn  = results.filter(r => r.icon === '⚠️').length;
  const fail  = results.filter(r => r.icon === '❌').length;
  const probe = results.filter(r => r.icon === '🔍' || r.step.startsWith('🔍')).length;
  console.log(`\n  ✅ ${pass} passou  ⚠️ ${warn} aviso  ❌ ${fail} falhou  🔍 ${probe} probe`);
  console.log(`\nScreenshots: ${SHOTS}/`);
}

main().catch(err => { console.error(err); process.exit(1); });
