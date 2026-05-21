// @ts-check
/**
 * MOBILE SCREENSHOTS — Captura visual de todas as telas em viewport mobile.
 * Não falha por overflow; gera capturas para inspeção visual do layout.
 * Salva em tests/screenshots/mobile/
 */
const { test } = require('@playwright/test');
const path = require('path');
const fs   = require('fs');

const VIEWPORTS = [
  { label: '393px', width: 393, height: 851 },  // Pixel 5
  { label: '375px', width: 375, height: 667 },  // iPhone SE
];

const PAGES = [
  { name: 'dashboard',         url: '/' },
  { name: 'agendamentos',      url: '/appointments' },
  { name: 'pacientes',         url: '/contacts' },
  { name: 'transacoes',        url: '/transactions' },
  { name: 'comissoes',         url: '/commissions' },
  { name: 'servicos',          url: '/services' },
  { name: 'profissionais',     url: '/professionals' },
  { name: 'horarios',          url: '/working-hours' },
  { name: 'link-agenda',       url: '/appointment-links' },
  { name: 'relatorios',        url: '/reports' },
  { name: 'configuracoes',     url: '/settings' },
  { name: 'vitrine',           url: '/vitrine' },
];

const OUT_DIR = path.join(__dirname, '..', 'screenshots', 'mobile');

test.describe('Mobile Screenshots', () => {
  test.beforeAll(() => {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  });

  for (const vp of VIEWPORTS) {
    test.describe(`Viewport ${vp.label}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
      });

      for (const pg of PAGES) {
        test(`${pg.name}`, async ({ page }) => {
          await page.goto(pg.url);
          await page.waitForLoadState('networkidle').catch(() => {});
          await page.waitForTimeout(800);

          const filePath = path.join(OUT_DIR, `${vp.label}_${pg.name}.png`);
          await page.screenshot({ path: filePath, fullPage: true });
          console.log(`📸 ${filePath}`);
        });
      }

      // Capturas extras com conteúdo interativo
      test('agendamentos_lista', async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto('/appointments');
        await page.waitForLoadState('networkidle').catch(() => {});
        const listTab = page.getByRole('tab', { name: /lista/i });
        if (await listTab.isVisible({ timeout: 3_000 }).catch(() => false)) await listTab.click();
        await page.waitForTimeout(500);
        await page.screenshot({
          path: path.join(OUT_DIR, `${vp.label}_agendamentos-lista.png`),
          fullPage: true,
        });
      });

      test('servicos_dialog', async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto('/services');
        await page.waitForLoadState('networkidle').catch(() => {});
        const btn = page.getByTestId('new-service-btn');
        if (await btn.isVisible({ timeout: 3_000 }).catch(() => false)) await btn.click();
        await page.waitForTimeout(400);
        await page.screenshot({
          path: path.join(OUT_DIR, `${vp.label}_servicos-dialog.png`),
          fullPage: true,
        });
      });

      test('pacientes_dialog', async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto('/contacts');
        await page.waitForLoadState('networkidle').catch(() => {});
        const btn = page.getByTestId('new-contact-btn');
        if (await btn.isVisible({ timeout: 3_000 }).catch(() => false)) await btn.click();
        await page.waitForTimeout(400);
        await page.screenshot({
          path: path.join(OUT_DIR, `${vp.label}_pacientes-dialog.png`),
          fullPage: true,
        });
      });

      test('agendamentos_form', async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto('/appointments');
        await page.waitForLoadState('networkidle').catch(() => {});
        const btn = page.getByTestId('new-appointment-btn');
        if (await btn.isVisible({ timeout: 3_000 }).catch(() => false)) await btn.click();
        await page.waitForTimeout(400);
        await page.screenshot({
          path: path.join(OUT_DIR, `${vp.label}_agendamentos-form.png`),
          fullPage: true,
        });
      });
    });
  }
});
