const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const networkLogs = [];

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/foods') || url.includes('/auth') || url.includes('/meal')) {
      let body = '';
      try { body = await response.text(); } catch {}
      networkLogs.push({ url, status: response.status(), body: body.slice(0, 300) });
    }
  });

  // Step 1: Go to login page
  console.log('=== Step 1: Load login page ===');
  await page.goto('https://orbinutri.com.br/login', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/food-04-login.png' });
  console.log('Login page URL:', page.url());

  // Step 2: Fill login form
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passInput = page.locator('input[type="password"]').first();
  const hasForm = await emailInput.isVisible({ timeout: 5000 }).catch(() => false);
  console.log('Login form visible:', hasForm);

  if (hasForm) {
    await emailInput.fill('admin@exemplo.com');
    await passInput.fill('password');
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    await page.waitForTimeout(4000);
    await page.screenshot({ path: '/tmp/food-06-after-login.png' });
    console.log('URL after login attempt:', page.url());

    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    console.log('Auth token obtained:', token ? `${token.slice(0,30)}...` : 'null');

    if (token) {
      // Navigate to meal plan
      console.log('\n=== Step 3: Navigate to meal plan ===');
      await page.goto('https://orbinutri.com.br/contacts/5/meal-plans/1', { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(4000);
      await page.screenshot({ path: '/tmp/food-07-mealplan.png' });
      console.log('Meal plan URL:', page.url());

      const addFoodCount = await page.locator('button:has-text("Adicionar alimento")').count();
      console.log('"Adicionar alimento" buttons:', addFoodCount);

      // Discover actual API base from window
      const apiBase = await page.evaluate(() => window.APP_API_BASE_URL || null);
      console.log('window.APP_API_BASE_URL:', apiBase);

      // Test API with relative URL
      console.log('\n=== Step 4: Test /api/v1/foods with auth ===');
      const apiResult = await page.evaluate(async (authToken) => {
        const r = await fetch('/api/v1/foods?q=arroz', {
          headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }
        });
        const text = await r.text();
        return { status: r.status, isHtml: text.startsWith('<!doctype'), body: text.slice(0, 300) };
      }, token);
      console.log('Relative /api/v1/foods:', JSON.stringify(apiResult));

      // Click "Adicionar alimento" and search
      if (addFoodCount > 0) {
        console.log('\n=== Step 5: Open food search and search "arroz" ===');
        await page.locator('button:has-text("Adicionar alimento")').first().click();
        await page.waitForTimeout(500);
        const searchInput = page.locator('input[placeholder*="aliment"], input[placeholder*="Buscar"]').first();
        const searchVisible = await searchInput.isVisible({ timeout: 3000 }).catch(() => false);
        console.log('Food search input visible:', searchVisible);
        if (searchVisible) {
          await searchInput.fill('arroz');
          await page.waitForTimeout(1500);
          await page.screenshot({ path: '/tmp/food-08-search-results.png' });
          const nothingFound = await page.locator('text=Nenhum alimento encontrado').isVisible().catch(() => false);
          const hasResults = await page.locator('button').filter({ hasText: /arroz/i }).count();
          console.log('"Nenhum alimento encontrado" visible:', nothingFound);
          console.log('Result buttons with "arroz":', hasResults);
        }
      }
    }
  }

  console.log('\n=== Network logs ===');
  networkLogs.forEach(l => console.log(JSON.stringify(l)));

  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
