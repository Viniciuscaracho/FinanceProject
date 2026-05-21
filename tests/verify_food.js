const { chromium } = require('playwright');

async function main() {
  const PROD_URL = 'https://orbinutri.com.br/contacts/5/meal-plans/1';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const networkLogs = [];

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/foods')) {
      let body = '';
      try { body = await response.text(); } catch {}
      networkLogs.push({ url, status: response.status(), body: body.slice(0, 600) });
    }
  });

  console.log('=== Step 1: Navigate to page ===');
  await page.goto(PROD_URL, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(e => console.log('Nav error:', e.message));
  await page.waitForTimeout(3000);
  console.log('URL:', page.url());
  await page.screenshot({ path: '/tmp/food-01-initial.png' });

  const url1 = page.url();
  if (url1.includes('login') || url1.includes('entrar')) {
    console.log('Redirected to login — page requires auth');
  } else {
    const addFoodBtns = await page.locator('button:has-text("Adicionar alimento")').count();
    console.log('"Adicionar alimento" buttons found:', addFoodBtns);

    if (addFoodBtns > 0) {
      await page.locator('button:has-text("Adicionar alimento")').first().click();
      await page.waitForTimeout(600);
      await page.screenshot({ path: '/tmp/food-02-search-open.png' });
      const input = page.locator('input[placeholder*="aliment"]').first();
      if (await input.isVisible().catch(() => false)) {
        await input.fill('arroz');
        await page.waitForTimeout(1500);
        await page.screenshot({ path: '/tmp/food-03-results.png' });
        const resultBtns = await page.locator('[style*="border-bottom"]').count();
        console.log('Result items in list:', resultBtns);
      }
    }
  }

  console.log('\n=== Step 2: Direct API test (unauthenticated) ===');
  const res = await page.evaluate(async () => {
    try {
      const r = await fetch('https://orbinutri.com.br/api/v1/foods?q=arroz');
      return { status: r.status, body: (await r.text()).slice(0, 400) };
    } catch(e) { return { error: e.message }; }
  });
  console.log('Unauthed API:', JSON.stringify(res));

  console.log('\n=== Network logs ===');
  networkLogs.forEach(l => console.log(JSON.stringify(l)));

  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
// Run step 2: authenticated
EOF
cat > /home/baby/Documents/BarberManagement/tests/verify_food2.js << 'EOF'
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

  // Step 2: Fill login form (default seed credentials)
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passInput = page.locator('input[type="password"]').first();
  const hasForm = await emailInput.isVisible({ timeout: 5000 }).catch(() => false);
  console.log('Login form visible:', hasForm);

  if (hasForm) {
    await emailInput.fill('admin@exemplo.com');
    await passInput.fill('password');
    await page.screenshot({ path: '/tmp/food-05-login-filled.png' });

    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    await page.waitForTimeout(4000);
    await page.screenshot({ path: '/tmp/food-06-after-login.png' });
    console.log('URL after login attempt:', page.url());

    // Get auth token from localStorage
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    console.log('Auth token obtained:', token ? `${token.slice(0,30)}...` : 'null');

    if (token) {
      // Step 3: Navigate to meal plan page
      console.log('\n=== Step 3: Navigate to meal plan ===');
      await page.goto('https://orbinutri.com.br/contacts/5/meal-plans/1', { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(4000);
      await page.screenshot({ path: '/tmp/food-07-mealplan.png' });
      console.log('Meal plan page URL:', page.url());

      // Check content
      const addFoodCount = await page.locator('button:has-text("Adicionar alimento")').count();
      console.log('"Adicionar alimento" buttons:', addFoodCount);

      // Step 4: Test the API with auth token
      console.log('\n=== Step 4: Test API with auth token ===');
      // Get the VITE_API_URL from the app
      const apiBase = await page.evaluate(() => {
        // Try to read from window or known storage
        return window.APP_API_BASE_URL || null;
      });
      console.log('window.APP_API_BASE_URL:', apiBase);

      // Discover the actual API URL by intercepting a network request
      const apiResult = await page.evaluate(async (authToken) => {
        const results = {};
        // Try relative
        try {
          const r1 = await fetch('/api/v1/foods?q=arroz', {
            headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }
          });
          results.relative = { status: r1.status, isHtml: (await r1.text()).startsWith('<!doctype') };
        } catch(e) { results.relative_error = e.message; }
        return results;
      }, token);
      console.log('API test results:', JSON.stringify(apiResult));

      // Step 5: Click "Adicionar alimento" and search
      if (addFoodCount > 0) {
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
EOF
node verify_food2.js 2>&1