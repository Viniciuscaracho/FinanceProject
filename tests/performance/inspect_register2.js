const { chromium } = require('@playwright/test');

const BASE_URL = 'https://orbiproject-front.dzkxmb.easypanel.host';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Captura TODAS as chamadas (incluindo Supabase)
  page.on('request', r => console.log('→', r.method(), r.url().slice(0, 100)));
  page.on('response', async r => {
    const url = r.url();
    const status = r.status();
    if (status >= 400 || url.includes('supabase') || url.includes('auth') || url.includes('api'))
      console.log('←', status, url.slice(0, 100));
  });

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.click('button:has-text("Crie uma conta")');
  await page.waitForTimeout(800);

  await page.fill('#reg-account-name', 'Clínica E2E');
  await page.fill('#reg-name', 'Teste E2E');
  await page.fill('#reg-email', 'e2e_test@orbi.test');
  await page.fill('#reg-password', 'TestE2E@2026');
  await page.fill('#reg-password-confirm', 'TestE2E@2026');
  // CPF fictício
  const doc = page.locator('#reg-document');
  if (await doc.count() > 0) await doc.fill('111.111.111-11');

  console.log('\n=== SUBMETENDO ===');
  await page.locator('[data-testid="register-button"]').click();
  await page.waitForTimeout(6000);

  // Mensagem de erro visível?
  const errs = await page.locator('[role="alert"], .text-red, .text-destructive, [class*="error"]').allTextContents();
  if (errs.length) console.log('Erros visíveis:', errs);

  console.log('URL final:', page.url());
  await browser.close();
})();
