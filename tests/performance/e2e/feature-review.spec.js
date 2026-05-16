const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, '../screenshots');
fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

async function loginIfNeeded(page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  const emailInput = page.locator('[data-testid="email-input"]').first();
  if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await emailInput.fill('admin@exemplo.com');
    await page.locator('[data-testid="password-input"]').first().fill('password');
    await page.locator('[data-testid="login-button"]').first().click();
    await page.waitForURL('/', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
  }
}

async function shot(page, name) {
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${name}.png`), fullPage: false });
  console.log(`📸 ${name}`);
}

// ─── Cenário 1: Página de Contatos ─────────────────────────────────────────
test('C1 - Contatos: lista e botão prontuário', async ({ page }) => {
  await loginIfNeeded(page);
  await page.goto('/contacts');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await shot(page, '01-contacts-list');

  // Verificar botão prontuário (ClipboardList icon) existe
  const prontuarioBtn = page.locator('button[title="Ver prontuário"]').first();
  const hasProntuario = await prontuarioBtn.isVisible({ timeout: 3000 }).catch(() => false);
  console.log(`  Botão "Ver prontuário" visível: ${hasProntuario}`);

  if (hasProntuario) {
    await prontuarioBtn.hover();
    await shot(page, '01b-contacts-prontuario-hover');
  }
});

// ─── Cenário 2: Prontuário do Paciente ──────────────────────────────────────
test('C2 - Prontuário do paciente: carregamento e seções', async ({ page }) => {
  await loginIfNeeded(page);
  await page.goto('/contacts');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  // Clicar no botão prontuário do primeiro contato
  const prontuarioBtn = page.locator('button[title="Ver prontuário"]').first();
  const hasProntuario = await prontuarioBtn.isVisible({ timeout: 3000 }).catch(() => false);

  if (hasProntuario) {
    await prontuarioBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await shot(page, '02-patient-profile-full');

    // Verificar seções presentes
    const sections = ['Metas', 'Documentos', 'Histórico de Anamneses', 'Consultas'];
    for (const section of sections) {
      const visible = await page.locator(`text="${section}"`).first().isVisible({ timeout: 2000 }).catch(() => false);
      console.log(`  Seção "${section}": ${visible ? '✅' : '❌'}`);
    }

    // Scroll para ver seções inferiores
    await page.evaluate(() => window.scrollTo(0, 400));
    await shot(page, '02b-patient-profile-scroll');
  } else {
    // Navegar diretamente por URL se não há contatos
    console.log('  Sem contatos na lista. Verificando URL direta...');
    await page.goto('/contacts/1');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await shot(page, '02-patient-profile-direct');
  }
});

// ─── Cenário 3: Metas e formulário nova meta ────────────────────────────────
test('C3 - Prontuário: criar e visualizar meta', async ({ page }) => {
  await loginIfNeeded(page);
  await page.goto('/contacts');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  const prontuarioBtn = page.locator('button[title="Ver prontuário"]').first();
  if (await prontuarioBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await prontuarioBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Abrir seção Metas se fechada e clicar em Nova Meta
    const metasSection = page.locator('button', { hasText: 'Metas' }).first();
    if (await metasSection.isVisible({ timeout: 2000 }).catch(() => false)) {
      await metasSection.click();
      await page.waitForTimeout(400);
    }

    const novaMetaBtn = page.locator('button', { hasText: 'Nova meta' }).first();
    if (await novaMetaBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await novaMetaBtn.click();
      await page.waitForTimeout(400);
      await shot(page, '03-goal-new-form');

      // Preencher form
      await page.fill('input[placeholder="Ex: Emagrecer 5kg"]', 'Perder 5kg');
      await page.fill('input[placeholder="72"]', '72');
      await page.fill('input[placeholder="65"]', '65');
      await page.fill('input[placeholder="kg, mg/dL…"]', 'kg');
      await shot(page, '03b-goal-form-filled');
    }
  }
});

// ─── Cenário 4: Modal de Consulta ───────────────────────────────────────────
test('C4 - Modal de consulta: seções do prontuário', async ({ page }) => {
  await loginIfNeeded(page);
  await page.goto('/appointments');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await shot(page, '04-appointments-page');

  // Abrir o primeiro agendamento
  const firstApt = page.locator('[data-appointment-id], .appointment-card, [class*="appointment"]').first();
  const hasApt = await firstApt.isVisible({ timeout: 2000 }).catch(() => false);

  if (!hasApt) {
    // Tentar clicar em qualquer card visível no calendário
    const anyCard = page.locator('[class*="event"], [class*="card"]').first();
    if (await anyCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      await anyCard.click();
      await page.waitForTimeout(1000);
      await shot(page, '04b-consultation-modal');
    }
  } else {
    await firstApt.click();
    await page.waitForTimeout(1000);
    await shot(page, '04b-consultation-modal');
  }
});

// ─── Cenário 5: Seção Metas no ConsultationModal ────────────────────────────
test('C5 - ConsultationModal: seção metas do paciente', async ({ page }) => {
  await loginIfNeeded(page);
  await page.goto('/appointments');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Tentar abrir qualquer evento do calendário
  const events = page.locator('text=/agendado|consulta/i').first();
  const hasEvent = await events.isVisible({ timeout: 2000 }).catch(() => false);

  if (hasEvent) {
    await events.click();
    await page.waitForTimeout(1000);

    // Scroll até a seção Metas
    await page.evaluate(() => {
      const el = [...document.querySelectorAll('span, button')].find(e => e.textContent.includes('Metas do Paciente'));
      if (el) el.scrollIntoView();
    });
    await shot(page, '05-consultation-modal-goals');

    // Expandir seção Metas
    const metasBtn = page.locator('text="Metas do Paciente"').first();
    if (await metasBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await metasBtn.click();
      await page.waitForTimeout(600);
      await shot(page, '05b-goals-expanded');
    }
  }
});

// ─── Cenário 6: Plano Alimentar Vivo (Feature #1) ───────────────────────────
test('C6 - ConsultationModal: seção Documentos do Paciente', async ({ page }) => {
  await loginIfNeeded(page);
  await page.goto('/appointments');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  const events = page.locator('text=/agendado|consulta/i').first();
  if (await events.isVisible({ timeout: 2000 }).catch(() => false)) {
    await events.click();
    await page.waitForTimeout(1000);

    // Scroll até Documentos
    await page.evaluate(() => {
      const el = [...document.querySelectorAll('span, button')].find(e => e.textContent.includes('Documentos do Paciente'));
      if (el) el.scrollIntoView();
    });
    await shot(page, '06-consultation-modal-docs');

    const docsBtn = page.locator('text="Documentos do Paciente"').first();
    if (await docsBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await docsBtn.click();
      await page.waitForTimeout(600);
      await shot(page, '06b-docs-expanded');
    }
  }
});

// ─── Cenário 7: Templates de Anamnese ───────────────────────────────────────
test('C7 - Templates de anamnese: galeria e pré-templates', async ({ page }) => {
  await loginIfNeeded(page);
  await page.goto('/anamnese');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await shot(page, '07-anamnese-templates');

  // Verificar pré-templates
  const rastreamento = page.locator('text=/rastreamento metab/i').first();
  const preConsulta = page.locator('text=/pré-consulta|pre-consulta/i').first();
  console.log(`  Template "Rastreamento Metabólico": ${await rastreamento.isVisible({ timeout: 2000 }).catch(() => false) ? '✅' : '❌'}`);
  console.log(`  Template "Pré-Consulta": ${await preConsulta.isVisible({ timeout: 2000 }).catch(() => false) ? '✅' : '❌'}`);

  // Scroll para ver galeria completa
  await page.evaluate(() => window.scrollTo(0, 500));
  await shot(page, '07b-anamnese-pre-templates');
});

// ─── Cenário 8: Formulário público de anamnese ──────────────────────────────
test('C8 - Formulário público de anamnese (URL de exemplo)', async ({ page }) => {
  // Verificar que a rota pública existe (com token inválido, deve mostrar estado de erro ou carregamento)
  await page.goto('/anamnese/responder/token-invalido-123');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await shot(page, '08-public-anamnese-form');
});

// ─── Cenário 9: Documento público (Feature #1) ──────────────────────────────
test('C9 - Documento público: rota /d/:token', async ({ page }) => {
  await page.goto('/d/token-invalido-xyz');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await shot(page, '09-public-document');
});

// ─── Cenário 10: Dashboard geral ────────────────────────────────────────────
test('C10 - Dashboard', async ({ page }) => {
  await loginIfNeeded(page);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await shot(page, '10-dashboard');
});
