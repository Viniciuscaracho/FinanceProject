const { chromium } = require('@playwright/test');

const BASE_URL = 'https://orbiproject-front.dzkxmb.easypanel.host';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Captura todas as chamadas de rede
  page.on('request', r => {
    if (r.url().includes('/api/') || r.url().includes('/users/'))
      console.log('→ REQ:', r.method(), r.url());
  });
  page.on('response', r => {
    if (r.url().includes('/api/') || r.url().includes('/users/'))
      console.log('← RES:', r.status(), r.url());
  });

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.click('button:has-text("Crie uma conta")');
  await page.waitForTimeout(1000);

  const inputs = await page.evaluate(() =>
    [...document.querySelectorAll('input')].map(el => ({
      type: el.type, id: el.id, placeholder: el.placeholder, testid: el.dataset.testid
    }))
  );
  const buttons = await page.evaluate(() =>
    [...document.querySelectorAll('button')].map(el => ({
      type: el.type, text: el.textContent.trim().slice(0, 40), testid: el.dataset.testid
    }))
  );

  console.log('\n=== REGISTER INPUTS ===');
  inputs.forEach(i => console.log(JSON.stringify(i)));
  console.log('=== REGISTER BUTTONS ===');
  buttons.forEach(b => console.log(JSON.stringify(b)));
  console.log('URL:', page.url());

  // Preenche e submete para ver o endpoint chamado
  console.log('\n→ Submetendo cadastro para ver endpoint…');
  await page.fill('#reg-account-name', 'Clínica E2E');
  await page.fill('#reg-name', 'Teste E2E');
  await page.fill('#reg-email', 'e2e_test@orbi.test');
  await page.fill('#reg-password', 'TestE2E@2026');
  await page.fill('#reg-password-confirm', 'TestE2E@2026');
  
  const submitBtn = page.locator('[data-testid="register-button"], button[type="submit"]').first();
  await submitBtn.click();
  await page.waitForTimeout(4000);

  console.log('URL após submit:', page.url());

  await browser.close();
})();
