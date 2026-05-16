const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const DIR = path.join(__dirname, 'screenshots');
const BASE = 'http://localhost:5173';

async function shot(page, name) {
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(DIR, `${name}.png`) });
  console.log(`  📸 ${name}.png`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // Login
  await page.goto(BASE + '/login');
  await page.waitForLoadState('networkidle');
  await page.locator('[data-testid="email-input"]').fill('admin@exemplo.com');
  await page.locator('[data-testid="password-input"]').fill('password');
  await page.locator('[data-testid="login-button"]').click();
  await page.waitForURL(BASE + '/', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await shot(page, 'FINAL-01-dashboard');

  // Prontuário — verificar badge corrigido
  await page.goto(BASE + '/contacts');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await page.locator('button[title="Ver prontuário"]').first().click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await shot(page, 'FINAL-02-prontuario-header');

  const badge = await page.locator('text="undefined_contact"').first().isVisible({ timeout: 1000 }).catch(() => false);
  console.log(`  Badge "undefined_contact" ainda visível: ${badge ? '❌ BUG PERSISTE' : '✅ Corrigido'}`);

  const correctBadge = await page.locator('text=/Cliente|Paciente|Contato/').first().isVisible({ timeout: 1000 }).catch(() => false);
  console.log(`  Badge com label correto: ${correctBadge ? '✅' : '❌'}`);

  // Expandir Metas e criar uma
  await page.getByText('Metas', { exact: true }).first().click().catch(() => {});
  await page.waitForTimeout(400);
  const novaMeta = page.locator('button', { hasText: 'Nova meta' }).first();
  if (await novaMeta.isVisible({ timeout: 1000 }).catch(() => false)) {
    await novaMeta.click();
    await page.waitForTimeout(300);
    await page.fill('input[placeholder="Ex: Emagrecer 5kg"]', 'Perder 5kg').catch(() => {});
    await page.fill('input[placeholder="72"]', '72').catch(() => {});
    await page.fill('input[placeholder="65"]', '65').catch(() => {});
    await page.fill('input[placeholder="kg, mg/dL…"]', 'kg').catch(() => {});
    await shot(page, 'FINAL-03-prontuario-nova-meta');

    await page.locator('button', { hasText: 'Salvar' }).first().click().catch(() => {});
    await page.waitForTimeout(1200);
    await shot(page, 'FINAL-04-prontuario-meta-criada');

    const goalCard = await page.locator('text="Perder 5kg"').first().isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`  Card da meta criada visível: ${goalCard ? '✅' : '❌'}`);

    // Testar "Registrar progresso"
    const registrarBtn = page.locator('button:has-text("+ Registrar")').first();
    if (await registrarBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await registrarBtn.click();
      await page.waitForTimeout(300);
      await page.fill('input[type="number"]', '71').catch(() => {});
      await page.fill('input[placeholder="Observação (opcional)"]', 'Primeira medição').catch(() => {});
      await shot(page, 'FINAL-05-prontuario-registrar-progresso');
    }
  }

  // Seção consultas — scroll e expandir
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForTimeout(400);
  const consultasBtn = page.getByText('Consultas', { exact: true }).first();
  if (await consultasBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await consultasBtn.click();
    await page.waitForTimeout(800);
    await shot(page, 'FINAL-06-prontuario-consultas');
  }

  // Modal de consulta via lista de agendamentos
  await page.goto(BASE + '/appointments');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await page.locator('button:has-text("Lista")').first().click().catch(() => {});
  await page.waitForTimeout(800);

  // Clicar no ícone de abrir modal (não no dropdown de status)
  const firstRow = page.locator('table tbody tr, [class*="appointment-row"]').first();
  if (await firstRow.isVisible({ timeout: 2000 }).catch(() => false)) {
    // Clica no nome do cliente (link que abre o modal)
    const clientName = firstRow.locator('[class*="client"], td').first();
    await clientName.click();
    await page.waitForTimeout(1200);
    const modal = page.locator('[role="dialog"]').first();
    if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await shot(page, 'FINAL-07-consultation-modal');
      console.log('  Modal de consulta: ✅');
    } else {
      console.log('  Modal não abriu ao clicar no cliente');
      await shot(page, 'FINAL-07-appointments-lista');
    }
  }

  await browser.close();
  console.log('\n✅ Verificação final concluída');
})();
