const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push('PAGE ERROR: ' + err.message));

  // Login
  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('networkidle');
  await page.locator('[data-testid="email-input"]').fill('admin@exemplo.com');
  await page.locator('[data-testid="password-input"]').fill('password');
  await page.locator('[data-testid="login-button"]').click();
  await page.waitForURL('http://localhost:5173/', { timeout: 10000 });

  // Navigate to first contact prontuario
  await page.goto('http://localhost:5173/contacts');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  const btn = page.locator('button[title="Ver prontuário"]').first();
  await btn.click();
  await page.waitForTimeout(3000);

  console.log('\n=== CONSOLE ERRORS ===');
  errors.forEach(e => console.log(e));

  // Try to expand error details
  const detailsEl = page.locator('text="Detalhes do erro"');
  if (await detailsEl.isVisible({ timeout: 1000 }).catch(() => false)) {
    await detailsEl.click();
    await page.waitForTimeout(500);
    const details = await page.locator('pre, code, [class*="error"]').first().textContent().catch(() => '');
    console.log('\n=== ERROR DETAILS ===\n', details);
  }

  await browser.close();
})();
