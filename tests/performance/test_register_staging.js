const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const apiRequests = [];
  page.on('request', req => {
    if (req.url().includes('/auth/') || req.url().includes('/api/')) {
      apiRequests.push({ method: req.method(), url: req.url() });
    }
  });
  page.on('response', resp => {
    if (resp.url().includes('/auth/') || resp.url().includes('/api/')) {
      const req = apiRequests.find(r => r.url === resp.url());
      if (req) req.status = resp.status();
    }
  });

  await page.goto('https://orbiproject-front.dzkxmb.easypanel.host/login');
  await page.waitForLoadState('networkidle');

  // Check if there's a register link/tab
  const content = await page.content();
  const hasRegister = content.includes('register') || content.includes('Register') || content.includes('cadastr') || content.includes('Cadastr');
  console.log('Page has register option:', hasRegister);

  // Take screenshot to see current state
  await page.screenshot({ path: '/tmp/login_page.png' });
  console.log('Screenshot saved');
  
  // Try clicking register if it exists
  const registerBtn = page.locator('[data-testid="register-tab"], [data-testid="register-button"], button:has-text("Cadastrar"), button:has-text("Register"), a:has-text("Cadastrar")');
  const count = await registerBtn.count();
  console.log('Register buttons found:', count);
  
  if (count > 0) {
    await registerBtn.first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/tmp/register_page.png' });
  }

  console.log('API requests intercepted:', JSON.stringify(apiRequests, null, 2));
  await browser.close();
})();
