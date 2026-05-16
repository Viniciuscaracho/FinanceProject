const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const DIR = path.join(__dirname, 'screenshots');
fs.mkdirSync(DIR, { recursive: true });

const EMAIL = 'admin@exemplo.com';
const PASSWORD = 'password';
const BASE = 'http://localhost:5173';

async function shot(page, name) {
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(DIR, `${name}.png`), fullPage: false });
  console.log(`  📸 ${name}.png`);
}

async function login(page) {
  await page.goto(BASE + '/login');
  await page.waitForLoadState('networkidle');
  const email = page.locator('[data-testid="email-input"]').first();
  if (await email.isVisible({ timeout: 4000 }).catch(() => false)) {
    await email.fill(EMAIL);
    await page.locator('[data-testid="password-input"]').first().fill(PASSWORD);
    await page.locator('[data-testid="login-button"]').first().click();
    await page.waitForURL(BASE + '/', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    console.log('  ✅ Login OK');
  } else {
    console.log('  ℹ️  Já logado ou sem form de login');
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  console.log('\n━━━ CENÁRIO 1: Dashboard ━━━━━━━━━━━━━━━━━━━━━━━━');
  await login(page);
  await shot(page, '01-dashboard');

  console.log('\n━━━ CENÁRIO 2: Página de Contatos ━━━━━━━━━━━━━━━━');
  await page.goto(BASE + '/contacts');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await shot(page, '02-contacts-list');

  // Verificar botão prontuário
  const prontuarioBtn = page.locator('button[title="Ver prontuário"]').first();
  const hasProntuario = await prontuarioBtn.isVisible({ timeout: 3000 }).catch(() => false);
  console.log(`  Botão "Ver prontuário" visível: ${hasProntuario ? '✅' : '❌'}`);

  console.log('\n━━━ CENÁRIO 3: Prontuário do Paciente ━━━━━━━━━━━━');
  if (hasProntuario) {
    await prontuarioBtn.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await shot(page, '03-patient-profile');

    const sectionTitles = ['Metas', 'Documentos', 'Histórico de Anamneses', 'Consultas'];
    for (const t of sectionTitles) {
      const ok = await page.locator(`text="${t}"`).first().isVisible({ timeout: 2000 }).catch(() => false);
      console.log(`  Seção "${t}": ${ok ? '✅' : '❌'}`);
    }

    // Testar seção Metas
    const metasHeader = page.locator('button', { hasText: 'Metas' }).first();
    if (await metasHeader.isVisible({ timeout: 2000 }).catch(() => false)) {
      await metasHeader.click();
      await page.waitForTimeout(500);
      await shot(page, '03b-profile-metas-expanded');
    }

    // Nova meta
    const novaMetaBtn = page.locator('button', { hasText: 'Nova meta' }).first();
    if (await novaMetaBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await novaMetaBtn.click();
      await page.waitForTimeout(400);
      await page.fill('input[placeholder="Ex: Emagrecer 5kg"]', 'Perder 5kg').catch(() => {});
      await page.fill('input[placeholder="72"]', '72').catch(() => {});
      await page.fill('input[placeholder="65"]', '65').catch(() => {});
      await page.fill('input[placeholder="kg, mg/dL…"]', 'kg').catch(() => {});
      await shot(page, '03c-profile-nova-meta-form');
    }

    // Scroll para ver seção Documentos
    await page.evaluate(() => window.scrollTo(0, 600));
    await shot(page, '03d-profile-docs-section');

    // Seção Anamneses
    await page.evaluate(() => window.scrollTo(0, 1000));
    await shot(page, '03e-profile-bottom-sections');
  } else {
    console.log('  ⚠️  Nenhum contato na lista. Testando URL direta /contacts/1...');
    await page.goto(BASE + '/contacts/1');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    await shot(page, '03-patient-profile-direct');
  }

  console.log('\n━━━ CENÁRIO 4: Templates de Anamnese ━━━━━━━━━━━━━');
  await page.goto(BASE + '/anamnese');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await shot(page, '04-anamnese-templates');

  const rastreamento = await page.locator('text=/rastreamento metab/i').first().isVisible({ timeout: 3000 }).catch(() => false);
  const preConsulta  = await page.locator('text=/pré.consulta/i').first().isVisible({ timeout: 3000 }).catch(() => false);
  console.log(`  Pre-template "Rastreamento Metabólico": ${rastreamento ? '✅' : '❌'}`);
  console.log(`  Pre-template "Pré-Consulta": ${preConsulta ? '✅' : '❌'}`);

  await page.evaluate(() => window.scrollTo(0, 600));
  await shot(page, '04b-anamnese-galeria');

  console.log('\n━━━ CENÁRIO 5: Formulário público de anamnese ━━━━━');
  await page.goto(BASE + '/anamnese/responder/token-fake-123');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await shot(page, '05-public-anamnese-token-invalido');

  console.log('\n━━━ CENÁRIO 6: Documento público /d/:token ━━━━━━━');
  await page.goto(BASE + '/d/token-fake-xyz');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await shot(page, '06-public-document-token-invalido');

  console.log('\n━━━ CENÁRIO 7: Agendamentos (modal) ━━━━━━━━━━━━━━');
  await login(page);
  await page.goto(BASE + '/appointments');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await shot(page, '07-appointments');

  // Tentar abrir um evento
  const possibleSelectors = [
    '.rbc-event', '.fc-event', '[class*="event"]',
    '[class*="appointment"]', '[class*="card"]'
  ];
  let opened = false;
  for (const sel of possibleSelectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 1000 }).catch(() => false)) {
      await el.click();
      await page.waitForTimeout(1000);
      const modal = page.locator('[role="dialog"]').first();
      if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
        await shot(page, '07b-consultation-modal-open');
        console.log('  Modal de consulta aberto ✅');

        // Scroll até Metas do Paciente
        await page.evaluate(() => {
          const el = [...document.querySelectorAll('*')].find(e =>
            e.textContent?.includes('Metas do Paciente') && e.children.length < 5
          );
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        await page.waitForTimeout(600);
        await shot(page, '07c-modal-metas-section');

        // Tentar expandir Metas
        const metasToggle = page.locator('button:has-text("Metas do Paciente")').first();
        if (await metasToggle.isVisible({ timeout: 1000 }).catch(() => false)) {
          await metasToggle.click();
          await page.waitForTimeout(600);
          await shot(page, '07d-modal-metas-expanded');
        }

        // Scroll até Documentos
        await page.evaluate(() => {
          const el = [...document.querySelectorAll('*')].find(e =>
            e.textContent?.includes('Documentos do Paciente') && e.children.length < 5
          );
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        await page.waitForTimeout(600);
        await shot(page, '07e-modal-docs-section');

        opened = true;
        break;
      }
    }
  }
  if (!opened) console.log('  ⚠️  Nenhum evento clicável encontrado no calendário');

  await browser.close();
  console.log(`\n✅ Screenshots salvas em: ${DIR}`);
  console.log(`📁 Total: ${fs.readdirSync(DIR).filter(f => f.endsWith('.png')).length} arquivos`);
})();
