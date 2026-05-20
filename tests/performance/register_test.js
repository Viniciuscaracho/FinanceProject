const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const responses = [];
  page.on('response', async resp => {
    if (resp.url().includes('/api/v1/auth')) {
      try {
        const body = await resp.json().catch(() => null);
        responses.push({ url: resp.url(), status: resp.status(), body });
      } catch {}
    }
  });

  await page.goto('https://orbiproject-front.dzkxmb.easypanel.host/login');
  await page.waitForLoadState('networkidle');

  await page.locator('button:has-text("Crie uma conta")').click();
  await page.waitForTimeout(1000);

  await page.locator('input[placeholder*="000.000.000"]').fill('123.456.789-00');
  await page.locator('input[placeholder*="Consultório"]').fill('Orbi Test Studio');
  await page.locator('input[placeholder*="João Silva"]').fill('Admin Teste');
  await page.locator('input[type="email"]').fill('viniciuscaracho77@gmail.com');
  await page.locator('[data-testid="reg-password-input"]').fill('Password123!');
  await page.locator('[data-testid="reg-password-confirm-input"]').fill('Password123!');

  console.log('Submitting...');
  await page.locator('[data-testid="register-button"]').click();
  await page.waitForTimeout(4000);

  const body = await page.locator('body').innerText().catch(() => '');
  console.log('Page result:', body.substring(0, 300));
  console.log('\nAPI responses:', JSON.stringify(responses, null, 2));

  await browser.close();
})();
