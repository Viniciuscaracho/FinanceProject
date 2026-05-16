const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const DIR = path.join(__dirname, 'screenshots');
const BASE = 'http://localhost:5173';

async function shot(page, name, scroll = 0) {
  if (scroll) await page.evaluate(y => window.scrollTo(0, y), scroll);
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(DIR, `${name}.png`), fullPage: false });
  console.log(`  📸 ${name}.png`);
}

async function login(page) {
  await page.goto(BASE + '/login');
  await page.waitForLoadState('networkidle');
  await page.locator('[data-testid="email-input"]').fill('admin@exemplo.com');
  await page.locator('[data-testid="password-input"]').fill('password');
  await page.locator('[data-testid="login-button"]').click();
  await page.waitForURL(BASE + '/', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  await login(page);

  // ── C1: Dashboard ─────────────────────────────────────────────────────────
  console.log('\n━━━ Dashboard ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await page.waitForTimeout(1500);
  await shot(page, 'C1-dashboard');

  // ── C2: Contatos ──────────────────────────────────────────────────────────
  console.log('\n━━━ Contatos ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await page.goto(BASE + '/contacts');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await shot(page, 'C2-contacts');

  const hasProntuario = await page.locator('button[title="Ver prontuário"]').first().isVisible({ timeout: 3000 }).catch(() => false);
  console.log(`  Botão prontuário: ${hasProntuario ? '✅' : '❌'}`);

  // ── C3: Prontuário ────────────────────────────────────────────────────────
  console.log('\n━━━ Prontuário do Paciente ━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (hasProntuario) {
    await page.locator('button[title="Ver prontuário"]').first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await shot(page, 'C3a-prontuario-topo');

    // Verificar seções
    for (const txt of ['Metas', 'Documentos', 'Histórico de Anamneses', 'Consultas']) {
      const ok = await page.getByText(txt, { exact: true }).first().isVisible({ timeout: 2000 }).catch(() => false);
      console.log(`  "${txt}": ${ok ? '✅' : '❌'}`);
    }

    // Expandir Metas
    await page.getByText('Metas', { exact: true }).first().click().catch(() => {});
    await page.waitForTimeout(500);
    await shot(page, 'C3b-prontuario-metas-abertas');

    // Clicar Nova Meta e preencher
    const novaMeta = page.locator('button', { hasText: 'Nova meta' }).first();
    if (await novaMeta.isVisible({ timeout: 1000 }).catch(() => false)) {
      await novaMeta.click();
      await page.waitForTimeout(400);
      await page.fill('input[placeholder="Ex: Emagrecer 5kg"]', 'Perder 5kg').catch(() => {});
      await page.fill('input[placeholder="72"]', '72').catch(() => {});
      await page.fill('input[placeholder="65"]', '65').catch(() => {});
      await page.fill('input[placeholder="kg, mg/dL…"]', 'kg').catch(() => {});
      await shot(page, 'C3c-prontuario-nova-meta');

      // Salvar meta
      await page.locator('button', { hasText: 'Salvar' }).first().click().catch(() => {});
      await page.waitForTimeout(1000);
      await shot(page, 'C3d-prontuario-meta-salva');
    }

    // Scroll para ver Documentos e Anamneses
    await shot(page, 'C3e-prontuario-documentos', 500);
    await shot(page, 'C3f-prontuario-inferior', 900);
  }

  // ── C4: Templates de Anamnese ─────────────────────────────────────────────
  console.log('\n━━━ Templates de Anamnese ━━━━━━━━━━━━━━━━━━━━━━━━━');
  await page.goto(BASE + '/anamnese');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await shot(page, 'C4a-anamnese-templates');

  const rastreamento = await page.getByText('Rastreamento Metabólico').first().isVisible({ timeout: 2000 }).catch(() => false);
  const preConsulta  = await page.getByText('Pré-Consulta').first().isVisible({ timeout: 2000 }).catch(() => false);
  console.log(`  "Rastreamento Metabólico": ${rastreamento ? '✅' : '❌'}`);
  console.log(`  "Pré-Consulta": ${preConsulta ? '✅' : '❌'}`);

  // Abrir um pré-modelo
  await page.getByText('Rastreamento Metabólico').first().click().catch(() => {});
  await page.waitForTimeout(600);
  await shot(page, 'C4b-anamnese-premodelo-detalhe');

  // ── C5: Formulário público (token inválido esperado) ──────────────────────
  console.log('\n━━━ Formulário Público Anamnese ━━━━━━━━━━━━━━━━━━━');
  await page.goto(BASE + '/anamnese/responder/token-invalido');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await shot(page, 'C5-anamnese-publica-token-invalido');
  const errMsg = await page.getByText(/Link inválido|expirado/i).first().isVisible({ timeout: 2000 }).catch(() => false);
  console.log(`  Mensagem de token inválido: ${errMsg ? '✅' : '❌'}`);

  // ── C6: Documento público (token inválido esperado) ───────────────────────
  console.log('\n━━━ Documento Público ━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await page.goto(BASE + '/d/token-invalido');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await shot(page, 'C6-documento-publico-token-invalido');
  const docErr = await page.getByText(/não disponível|não encontrado/i).first().isVisible({ timeout: 2000 }).catch(() => false);
  console.log(`  Mensagem de documento não disponível: ${docErr ? '✅' : '❌'}`);

  // ── C7: Agendamentos ──────────────────────────────────────────────────────
  console.log('\n━━━ Agendamentos ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  await page.goto(BASE + '/appointments');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await shot(page, 'C7a-agendamentos');

  // Tentar clicar num evento do calendário (barras coloridas)
  const eventBar = page.locator('.rbc-event, [class*="event-bar"], [class*="EventBar"]').first();
  const hasEvent = await eventBar.isVisible({ timeout: 2000 }).catch(() => false);
  if (hasEvent) {
    await eventBar.click();
    await page.waitForTimeout(1200);
    const modal = page.locator('[role="dialog"]').first();
    if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await shot(page, 'C7b-consultation-modal');
      console.log('  Modal de consulta: ✅');

      // Scroll dentro do modal até Metas
      await page.evaluate(() => {
        const metas = [...document.querySelectorAll('button, span')].find(e => e.textContent?.trim() === 'Metas do Paciente');
        if (metas) metas.scrollIntoView({ block: 'center' });
      });
      await page.waitForTimeout(500);
      await shot(page, 'C7c-modal-metas');

      // Expandir metas
      const metasBtn = page.locator('button:has-text("Metas do Paciente")').first();
      if (await metasBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await metasBtn.click();
        await page.waitForTimeout(600);
        await shot(page, 'C7d-modal-metas-expanded');
      }

      // Scroll até Documentos do Paciente
      await page.evaluate(() => {
        const docs = [...document.querySelectorAll('button, span')].find(e => e.textContent?.trim() === 'Documentos do Paciente');
        if (docs) docs.scrollIntoView({ block: 'center' });
      });
      await page.waitForTimeout(500);
      await shot(page, 'C7e-modal-documentos');

      // Scroll até Anamnese
      await page.evaluate(() => {
        const ana = [...document.querySelectorAll('span, label')].find(e => e.textContent?.includes('Formulário'));
        if (ana) ana.scrollIntoView({ block: 'center' });
      });
      await page.waitForTimeout(500);
      await shot(page, 'C7f-modal-anamnese');
    } else {
      console.log('  Modal não abriu após clique no evento');
    }
  } else {
    // Tentar via Lista
    await page.locator('button:has-text("Lista")').first().click().catch(() => {});
    await page.waitForTimeout(1000);
    await shot(page, 'C7b-agendamentos-lista');
    const firstRow = page.locator('[class*="appointment"], [class*="row"]').first();
    if (await firstRow.isVisible({ timeout: 1000 }).catch(() => false)) {
      await firstRow.click();
      await page.waitForTimeout(1200);
      await shot(page, 'C7c-modal-via-lista');
    }
  }

  await browser.close();

  const total = fs.readdirSync(DIR).filter(f => f.startsWith('C') && f.endsWith('.png')).length;
  console.log(`\n✅ Concluído. ${total} screenshots de cenário salvas em ${DIR}`);
})();
